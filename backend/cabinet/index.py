import json
import os
import random
from datetime import datetime
import psycopg2

SCHEMA = 't_p76227163_vpr_quest_gaming_pla'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
}

CHILD_SHOP = {
    'skin_cyberpanda': {'title': 'Скин «Кибер-панда»', 'price': 320, 'kind': 'skin'},
    'skin_cloak': {'title': 'Плащ-невидимка', 'price': 450, 'kind': 'skin'},
    'skin_retro': {'title': 'Форма из 1980-х', 'price': 280, 'kind': 'skin'},
    'pet_robocat': {'title': 'Пет «Робот-кот»', 'price': 600, 'kind': 'pet'},
    'pet_raven': {'title': 'Пет «Ворон-шпаргалка»', 'price': 540, 'kind': 'pet'},
    'emote_dance': {'title': 'Эмоция «Победный танец»', 'price': 190, 'kind': 'emote'},
}

PARENT_SHOP = {
    'energy_5': {'title': '5 попыток', 'price': 149, 'kind': 'energy', 'energy': 5},
    'energy_15': {'title': '15 попыток', 'price': 349, 'kind': 'energy', 'energy': 15},
    'energy_40': {'title': '40 попыток', 'price': 749, 'kind': 'energy', 'energy': 40},
    'plan_month': {'title': 'Безлимит на месяц', 'price': 990, 'kind': 'plan', 'energy': 100},
    'report_pdf': {'title': 'Подробный разбор от методиста', 'price': 590, 'kind': 'service', 'energy': 0},
}

INVITE_REWARD = 3


def esc(value):
    if value is None:
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"


def t(name: str) -> str:
    return f'{SCHEMA}.{name}'


def connect():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def respond(status, payload):
    return {
        'statusCode': status,
        'headers': CORS,
        'body': json.dumps(payload, ensure_ascii=False, default=str),
        'isBase64Encoded': False,
    }


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


def child_heatmap(conn, child_id: int):
    """Матрица тема × попытка с долей ошибок и автоматическими выводами."""
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT topic, module, correct, total, created_at FROM {t('results')} "
            f"WHERE child_id = {child_id} ORDER BY created_at"
        )
        rows = cur.fetchall()

    by_topic = {}
    for topic, module, correct, total, created in rows:
        entry = by_topic.setdefault(topic, {'topic': topic, 'module': module, 'cells': []})
        pct = round((total - correct) * 100 / total) if total else 0
        entry['cells'].append({'errors': pct, 'date': created, 'correct': correct, 'total': total})

    topics = []
    for entry in by_topic.values():
        cells = entry['cells'][-6:]
        errors = [c['errors'] for c in cells]
        avg = round(sum(errors) / len(errors)) if errors else 0
        trend = 0
        if len(errors) >= 2:
            trend = errors[-1] - errors[0]
        topics.append({
            'topic': entry['topic'],
            'module': entry['module'],
            'cells': cells,
            'avg_errors': avg,
            'trend': trend,
            'attempts': len(entry['cells']),
        })
    topics.sort(key=lambda x: -x['avg_errors'])

    insights = []
    weak = [x for x in topics if x['avg_errors'] >= 40]
    strong = [x for x in topics if x['avg_errors'] <= 20 and x['attempts'] >= 1]
    improving = [x for x in topics if x['trend'] <= -15]
    worsening = [x for x in topics if x['trend'] >= 15]

    for x in weak[:3]:
        insights.append({
            'level': 'alert',
            'title': f"Проблемная тема: {x['topic']}",
            'text': f"В среднем {x['avg_errors']}% ошибок за {x['attempts']} попыток. Назначьте эту тему ещё раз — короткой капсулой на 10 минут.",
            'topic': x['topic'],
        })
    for x in improving[:2]:
        insights.append({
            'level': 'good',
            'title': f"Прогресс по теме «{x['topic']}»",
            'text': f"Ошибок стало меньше на {abs(x['trend'])} процентных пунктов. Тренировка работает, можно снизить частоту.",
            'topic': x['topic'],
        })
    for x in worsening[:2]:
        insights.append({
            'level': 'warn',
            'title': f"Просадка по теме «{x['topic']}»",
            'text': f"Ошибок стало больше на {x['trend']} пунктов. Стоит вернуться к теме и разобрать её вместе.",
            'topic': x['topic'],
        })
    for x in strong[:2]:
        insights.append({
            'level': 'good',
            'title': f"Тема закрыта: {x['topic']}",
            'text': f"Всего {x['avg_errors']}% ошибок. К ВПР по этой теме ребёнок готов.",
            'topic': x['topic'],
        })
    if not topics:
        insights.append({
            'level': 'info',
            'title': 'Данных пока нет',
            'text': 'Назначьте первое задание — после капсулы здесь появится карта ошибок и разбор по темам.',
            'topic': None,
        })

    return {'topics': topics, 'insights': insights}


def parent_row(conn, parent_id: int):
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT id, name, email, energy, plan FROM {t('parents')} WHERE id = {parent_id}"
        )
        r = cur.fetchone()
    return {'id': r[0], 'name': r[1], 'email': r[2], 'energy': r[3], 'plan': r[4]}


def handler(event: dict, context) -> dict:
    """Кабинет родителя и ребёнка: дети, задания, тепловая карта с анализом, энергия, магазины и приглашения."""
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
                f"SELECT id, name, grade, login_code, pin, avatar, coins, xp, free_used "
                f"FROM {t('children')} WHERE parent_id = {parent_id} ORDER BY id"
            )
            child_rows = cur.fetchall()
        children = []
        for r in child_rows:
            children.append({
                'id': r[0], 'name': r[1], 'grade': r[2], 'code': r[3], 'pin': r[4],
                'avatar': r[5], 'coins': r[6], 'xp': r[7], 'free_used': r[8],
                'stats': child_stats(conn, r[0]),
                'heatmap': child_heatmap(conn, r[0]),
            })
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id, child_id, topic, module, deadline, minutes, status, created_at "
                f"FROM {t('assignments')} WHERE parent_id = {parent_id} ORDER BY id DESC LIMIT 60"
            )
            a_rows = cur.fetchall()
            cur.execute(
                f"SELECT id, code, friend_email, status, created_at FROM {t('invites')} "
                f"WHERE parent_id = {parent_id} ORDER BY id DESC LIMIT 30"
            )
            i_rows = cur.fetchall()
            cur.execute(
                f"SELECT item_title, price, kind, created_at FROM {t('purchases')} "
                f"WHERE parent_id = {parent_id} AND child_id IS NULL ORDER BY id DESC LIMIT 20"
            )
            p_rows = cur.fetchall()
        result = {
            'parent': parent_row(conn, parent_id),
            'children': children,
            'assignments': [{
                'id': r[0], 'child_id': r[1], 'topic': r[2], 'module': r[3],
                'deadline': r[4], 'minutes': r[5], 'status': r[6], 'created_at': r[7],
            } for r in a_rows],
            'invites': [{
                'id': r[0], 'code': r[1], 'email': r[2], 'status': r[3], 'created_at': r[4],
            } for r in i_rows],
            'purchases': [{
                'title': r[0], 'price': r[1], 'kind': r[2], 'created_at': r[3],
            } for r in p_rows],
            'shop': [{'code': k, **v} for k, v in PARENT_SHOP.items()],
        }
        conn.close()
        return respond(200, result)

    if method == 'GET' and action == 'child-dashboard':
        if session['role'] != 'child':
            conn.close()
            return respond(403, {'error': 'Доступно только ученику'})
        child_id = session['user_id']
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT c.id, c.name, c.grade, c.avatar, c.coins, c.xp, c.login_code, "
                f"c.free_used, p.energy, p.plan "
                f"FROM {t('children')} c JOIN {t('parents')} p ON p.id = c.parent_id "
                f"WHERE c.id = {child_id}"
            )
            c = cur.fetchone()
            cur.execute(
                f"SELECT id, topic, module, deadline, minutes, status FROM {t('assignments')} "
                f"WHERE child_id = {child_id} ORDER BY status, id DESC LIMIT 40"
            )
            a_rows = cur.fetchall()
            cur.execute(
                f"SELECT item_code, item_title, price, kind FROM {t('purchases')} "
                f"WHERE child_id = {child_id} ORDER BY id DESC"
            )
            p_rows = cur.fetchall()
        result = {
            'child': {
                'id': c[0], 'name': c[1], 'grade': c[2], 'avatar': c[3],
                'coins': c[4], 'xp': c[5], 'code': c[6], 'free_used': c[7],
                'parent_energy': c[8], 'plan': c[9],
            },
            'assignments': [{
                'id': r[0], 'topic': r[1], 'module': r[2], 'deadline': r[3],
                'minutes': r[4], 'status': r[5],
            } for r in a_rows],
            'stats': child_stats(conn, child_id),
            'purchases': [{'code': r[0], 'title': r[1], 'price': r[2], 'kind': r[3]} for r in p_rows],
            'shop': [{'code': k, **v} for k, v in CHILD_SHOP.items()],
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

    if method == 'POST' and action == 'start-test':
        if session['role'] != 'child':
            conn.close()
            return respond(403, {'error': 'Запускает тест ученик'})
        child_id = session['user_id']
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT c.free_used, c.parent_id, p.energy, p.plan FROM {t('children')} c "
                f"JOIN {t('parents')} p ON p.id = c.parent_id WHERE c.id = {child_id}"
            )
            free_used, parent_id, energy, plan = cur.fetchone()

            if not free_used:
                cur.execute(f"UPDATE {t('children')} SET free_used = true WHERE id = {child_id}")
                conn.commit()
                conn.close()
                return respond(200, {'ok': True, 'paid_with': 'free', 'energy_left': energy})

            if plan == 'unlimited':
                conn.close()
                return respond(200, {'ok': True, 'paid_with': 'plan', 'energy_left': energy})

            if energy <= 0:
                conn.close()
                return respond(402, {
                    'error': 'Попытки закончились. Родитель может пополнить их в кабинете или пригласить друга.',
                    'energy_left': 0,
                })

            cur.execute(f"UPDATE {t('parents')} SET energy = energy - 1 WHERE id = {parent_id}")
        conn.commit()
        conn.close()
        return respond(200, {'ok': True, 'paid_with': 'energy', 'energy_left': energy - 1})

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

    if method == 'POST' and action == 'buy':
        if session['role'] != 'child':
            conn.close()
            return respond(403, {'error': 'Покупает ученик за луткоины'})
        child_id = session['user_id']
        code = (body.get('code') or '').strip()
        item = CHILD_SHOP.get(code)
        if not item:
            conn.close()
            return respond(400, {'error': 'Такого товара нет'})
        with conn.cursor() as cur:
            cur.execute(f"SELECT coins FROM {t('children')} WHERE id = {child_id}")
            coins = cur.fetchone()[0]
            cur.execute(
                f"SELECT 1 FROM {t('purchases')} WHERE child_id = {child_id} AND item_code = {esc(code)}"
            )
            if cur.fetchone():
                conn.close()
                return respond(409, {'error': 'Это уже куплено'})
            if coins < item['price']:
                conn.close()
                return respond(402, {'error': f"Не хватает {item['price'] - coins} луткоинов"})
            cur.execute(
                f"INSERT INTO {t('purchases')} (child_id, item_code, item_title, price, kind) "
                f"VALUES ({child_id}, {esc(code)}, {esc(item['title'])}, {item['price']}, {esc(item['kind'])})"
            )
            cur.execute(
                f"UPDATE {t('children')} SET coins = coins - {item['price']} WHERE id = {child_id}"
            )
            if item['kind'] == 'skin':
                pass
            cur.execute(f"SELECT coins FROM {t('children')} WHERE id = {child_id}")
            left = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return respond(200, {'ok': True, 'coins': left, 'title': item['title']})

    if method == 'POST' and action == 'parent-buy':
        if session['role'] != 'parent':
            conn.close()
            return respond(403, {'error': 'Покупает родитель'})
        parent_id = session['user_id']
        code = (body.get('code') or '').strip()
        item = PARENT_SHOP.get(code)
        if not item:
            conn.close()
            return respond(400, {'error': 'Такой услуги нет'})
        with conn.cursor() as cur:
            cur.execute(
                f"INSERT INTO {t('purchases')} (parent_id, item_code, item_title, price, kind) "
                f"VALUES ({parent_id}, {esc(code)}, {esc(item['title'])}, {item['price']}, {esc(item['kind'])})"
            )
            if item.get('energy'):
                cur.execute(
                    f"UPDATE {t('parents')} SET energy = energy + {item['energy']} WHERE id = {parent_id}"
                )
            if item['kind'] == 'plan':
                cur.execute(
                    f"UPDATE {t('parents')} SET plan = 'unlimited' WHERE id = {parent_id}"
                )
        conn.commit()
        data = parent_row(conn, parent_id)
        conn.close()
        return respond(200, {'ok': True, 'parent': data, 'title': item['title']})

    if method == 'POST' and action == 'invite':
        if session['role'] != 'parent':
            conn.close()
            return respond(403, {'error': 'Приглашает родитель'})
        parent_id = session['user_id']
        email = (body.get('email') or '').strip().lower()
        if '@' not in email:
            conn.close()
            return respond(400, {'error': 'Проверьте почту друга'})
        code = 'INV-' + ''.join(random.choice('ABCDEFGHJKLMNPQRSTUVWXYZ23456789') for _ in range(5))
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT 1 FROM {t('invites')} WHERE parent_id = {parent_id} AND friend_email = {esc(email)}"
            )
            if cur.fetchone():
                conn.close()
                return respond(409, {'error': 'Этому другу приглашение уже отправлено'})
            cur.execute(
                f"INSERT INTO {t('invites')} (parent_id, code, friend_email, status, reward_given) "
                f"VALUES ({parent_id}, {esc(code)}, {esc(email)}, 'sent', true)"
            )
            cur.execute(
                f"UPDATE {t('parents')} SET energy = energy + {INVITE_REWARD} WHERE id = {parent_id}"
            )
        conn.commit()
        data = parent_row(conn, parent_id)
        conn.close()
        return respond(200, {'ok': True, 'code': code, 'reward': INVITE_REWARD, 'parent': data})

    conn.close()
    return respond(404, {'error': 'Неизвестное действие'})
