import json
import os
from datetime import datetime
import psycopg2

SCHEMA = 't_p76227163_vpr_quest_gaming_pla'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
}


def esc(value):
    if value is None:
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"


def t(name: str) -> str:
    return f'{SCHEMA}.{name}'


def connect():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def respond(status, payload):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False, default=str), 'isBase64Encoded': False}


def resolve_session(conn, token: str):
    if not token:
        return None
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT role, user_id FROM {t('sessions')} WHERE token = {esc(token)} AND expires_at > NOW()"
        )
        row = cur.fetchone()
    if not row:
        return None
    return {'role': row[0], 'user_id': row[1]}


def child_stats(conn, child_id: int):
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT topic, module, SUM(correct), SUM(total) FROM {t('results')} "
            f"WHERE child_id = {child_id} GROUP BY topic, module ORDER BY topic"
        )
        rows = cur.fetchall()
    stats = []
    for topic, module, correct, total in rows:
        total = int(total or 0)
        correct = int(correct or 0)
        pct = round(correct * 100 / total) if total else 0
        stats.append({'topic': topic, 'module': module, 'correct': correct, 'total': total, 'percent': pct})
    return stats


def handler(event: dict, context) -> dict:
    """Кабинет родителя и ребёнка: список детей, назначение заданий, личная статистика и результаты игр."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token') or ''

    conn = connect()
    session = resolve_session(conn, token)
    if not session:
        conn.close()
        return respond(401, {'error': 'Нужен вход'})

    if method == 'GET' and action == 'parent-dashboard':
        if session['role'] != 'parent':
            conn.close()
            return respond(403, {'error': 'Доступно только родителю'})
        parent_id = session['user_id']
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id, name, grade, login_code, pin, avatar, coins, xp, energy "
                f"FROM {t('children')} WHERE parent_id = {parent_id} ORDER BY id"
            )
            child_rows = cur.fetchall()
        children = []
        for r in child_rows:
            children.append({
                'id': r[0], 'name': r[1], 'grade': r[2], 'code': r[3], 'pin': r[4],
                'avatar': r[5], 'coins': r[6], 'xp': r[7], 'energy': r[8],
                'stats': child_stats(conn, r[0]),
            })
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id, child_id, topic, module, deadline, minutes, status, created_at "
                f"FROM {t('assignments')} WHERE parent_id = {parent_id} ORDER BY id DESC LIMIT 50"
            )
            a_rows = cur.fetchall()
        assignments = [{
            'id': r[0], 'child_id': r[1], 'topic': r[2], 'module': r[3],
            'deadline': r[4], 'minutes': r[5], 'status': r[6], 'created_at': r[7],
        } for r in a_rows]
        conn.close()
        return respond(200, {'children': children, 'assignments': assignments})

    if method == 'GET' and action == 'child-dashboard':
        if session['role'] != 'child':
            conn.close()
            return respond(403, {'error': 'Доступно только ученику'})
        child_id = session['user_id']
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id, name, grade, avatar, coins, xp, energy, login_code "
                f"FROM {t('children')} WHERE id = {child_id}"
            )
            c = cur.fetchone()
            cur.execute(
                f"SELECT id, topic, module, deadline, minutes, status FROM {t('assignments')} "
                f"WHERE child_id = {child_id} ORDER BY status, id DESC LIMIT 30"
            )
            a_rows = cur.fetchall()
        result = {
            'child': {
                'id': c[0], 'name': c[1], 'grade': c[2], 'avatar': c[3],
                'coins': c[4], 'xp': c[5], 'energy': c[6], 'code': c[7],
            },
            'assignments': [{
                'id': r[0], 'topic': r[1], 'module': r[2], 'deadline': r[3],
                'minutes': r[4], 'status': r[5],
            } for r in a_rows],
            'stats': child_stats(conn, child_id),
        }
        conn.close()
        return respond(200, result)

    body = json.loads(event.get('body') or '{}')

    if method == 'POST' and action == 'assign':
        if session['role'] != 'parent':
            conn.close()
            return respond(403, {'error': 'Назначать задания может только родитель'})
        child_id = int(body.get('child_id') or 0)
        topic = (body.get('topic') or '').strip()
        module = (body.get('module') or '').strip()
        deadline = (body.get('deadline') or '').strip()
        minutes = int(body.get('minutes') or 15)
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT 1 FROM {t('children')} WHERE id = {child_id} AND parent_id = {session['user_id']}"
            )
            if not cur.fetchone():
                conn.close()
                return respond(403, {'error': 'Это не ваш ребёнок'})
        if not topic or not deadline:
            conn.close()
            return respond(400, {'error': 'Укажите тему и дедлайн'})
        if datetime.strptime(deadline, '%Y-%m-%d').date() < datetime.utcnow().date():
            conn.close()
            return respond(400, {'error': 'Дедлайн уже прошёл'})
        with conn.cursor() as cur:
            cur.execute(
                f"INSERT INTO {t('assignments')} (child_id, parent_id, topic, module, deadline, minutes) "
                f"VALUES ({child_id}, {session['user_id']}, {esc(topic)}, {esc(module)}, {esc(deadline)}, {minutes}) "
                f"RETURNING id"
            )
            new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return respond(200, {'id': new_id, 'ok': True})

    if method == 'POST' and action == 'submit-result':
        if session['role'] != 'child':
            conn.close()
            return respond(403, {'error': 'Результат отправляет ученик'})
        child_id = session['user_id']
        topic = (body.get('topic') or '').strip()
        module = (body.get('module') or '').strip()
        correct = int(body.get('correct') or 0)
        total = int(body.get('total') or 0)
        assignment_id = body.get('assignment_id')
        coins = correct * 20
        xp = correct * 35
        aid = int(assignment_id) if assignment_id else None
        with conn.cursor() as cur:
            cur.execute(
                f"INSERT INTO {t('results')} (child_id, assignment_id, topic, module, correct, total, coins, xp) "
                f"VALUES ({child_id}, {aid if aid else 'NULL'}, {esc(topic)}, {esc(module)}, {correct}, {total}, {coins}, {xp})"
            )
            cur.execute(
                f"UPDATE {t('children')} SET coins = coins + {coins}, xp = xp + {xp} WHERE id = {child_id}"
            )
            if aid:
                cur.execute(
                    f"UPDATE {t('assignments')} SET status = 'done' WHERE id = {aid} AND child_id = {child_id}"
                )
            cur.execute(f"SELECT coins, xp FROM {t('children')} WHERE id = {child_id}")
            row = cur.fetchone()
        conn.commit()
        conn.close()
        return respond(200, {'coins': row[0], 'xp': row[1], 'earned_coins': coins, 'earned_xp': xp})

    conn.close()
    return respond(404, {'error': 'Неизвестное действие'})