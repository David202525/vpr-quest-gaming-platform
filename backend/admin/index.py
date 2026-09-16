import json
import os
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
    return {
        'statusCode': status,
        'headers': CORS,
        'body': json.dumps(payload, ensure_ascii=False, default=str),
        'isBase64Encoded': False,
    }


def resolve_admin(conn, token: str):
    if not token:
        return None
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT p.id, p.name, p.is_admin FROM {t('sessions')} s "
            f"JOIN {t('parents')} p ON p.id = s.user_id "
            f"WHERE s.token = {esc(token)} AND s.role = 'parent' AND s.expires_at > NOW()"
        )
        row = cur.fetchone()
    if not row or not row[2]:
        return None
    return {'id': row[0], 'name': row[1]}


def handler(event: dict, context) -> dict:
    """Админка банка заданий: просмотр тем и вопросов, добавление, правка, включение и отключение."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token') or ''

    conn = connect()
    admin = resolve_admin(conn, token)

    if not admin and action == 'seed':
        with conn.cursor() as cur:
            cur.execute(f"SELECT COUNT(*) FROM {t('questions')}")
            if cur.fetchone()[0] > 0:
                conn.close()
                return respond(403, {'error': 'Банк заданий уже заполнен'})
        admin = {'id': 0, 'name': 'setup'}

    if not admin:
        conn.close()
        return respond(403, {'error': 'Нужны права администратора'})

    if method == 'GET' and action == 'overview':
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT t.slug, t.label, t.subject, t.module, t.grades, t.is_active, "
                f"COUNT(q.id) FILTER (WHERE q.is_active) "
                f"FROM {t('topics')} t LEFT JOIN {t('questions')} q ON q.topic_slug = t.slug "
                f"GROUP BY t.id ORDER BY t.subject, t.label"
            )
            rows = cur.fetchall()
            cur.execute(f"SELECT COUNT(*) FROM {t('questions')} WHERE is_active")
            total = cur.fetchone()[0]
        conn.close()
        return respond(200, {
            'topics': [{
                'slug': r[0], 'label': r[1], 'subject': r[2], 'module': r[3],
                'grades': r[4], 'is_active': r[5], 'count': r[6],
            } for r in rows],
            'total': total,
            'admin': admin,
        })

    if method == 'GET' and action == 'questions':
        slug = (params.get('topic') or '').strip()
        search = (params.get('q') or '').strip()
        where = f"topic_slug = {esc(slug)}" if slug else '1 = 1'
        if search:
            where += f" AND text ILIKE {esc('%' + search + '%')}"
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id, topic_slug, text, options, right_index, source, is_active "
                f"FROM {t('questions')} WHERE {where} ORDER BY id DESC LIMIT 400"
            )
            rows = cur.fetchall()
        conn.close()
        return respond(200, {'questions': [{
            'id': r[0], 'topic': r[1], 'text': r[2], 'options': json.loads(r[3]),
            'right': r[4], 'source': r[5], 'is_active': r[6],
        } for r in rows]})

    body = json.loads(event.get('body') or '{}')

    if method == 'POST' and action == 'add-question':
        slug = (body.get('topic') or '').strip()
        text = (body.get('text') or '').strip()
        options = body.get('options') or []
        right = int(body.get('right') or 0)
        options = [str(o).strip() for o in options if str(o).strip()]
        if not slug or len(text) < 3 or len(options) < 2:
            conn.close()
            return respond(400, {'error': 'Нужны тема, текст и минимум два варианта'})
        if right < 0 or right >= len(options):
            conn.close()
            return respond(400, {'error': 'Отметьте правильный вариант'})
        with conn.cursor() as cur:
            cur.execute(f"SELECT 1 FROM {t('topics')} WHERE slug = {esc(slug)}")
            if not cur.fetchone():
                conn.close()
                return respond(400, {'error': 'Такой темы нет'})
            cur.execute(
                f"INSERT INTO {t('questions')} (topic_slug, text, options, right_index, source) "
                f"VALUES ({esc(slug)}, {esc(text)}, {esc(json.dumps(options, ensure_ascii=False))}, "
                f"{right}, 'admin') RETURNING id"
            )
            new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return respond(200, {'ok': True, 'id': new_id})

    if method == 'POST' and action == 'toggle-question':
        qid = int(body.get('id') or 0)
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE {t('questions')} SET is_active = NOT is_active WHERE id = {qid} "
                f"RETURNING is_active"
            )
            row = cur.fetchone()
        conn.commit()
        conn.close()
        if not row:
            return respond(404, {'error': 'Вопрос не найден'})
        return respond(200, {'ok': True, 'is_active': row[0]})

    if method == 'POST' and action == 'add-topic':
        slug = (body.get('slug') or '').strip().lower()
        label = (body.get('label') or '').strip()
        subject = (body.get('subject') or '').strip()
        module = (body.get('module') or '').strip()
        grades = (body.get('grades') or '').strip()
        if not slug.isascii() or len(slug) < 2 or len(label) < 3 or not subject or not grades:
            conn.close()
            return respond(400, {'error': 'Заполните название, предмет, классы и латинский код'})
        with conn.cursor() as cur:
            cur.execute(f"SELECT 1 FROM {t('topics')} WHERE slug = {esc(slug)}")
            if cur.fetchone():
                conn.close()
                return respond(409, {'error': 'Тема с таким кодом уже есть'})
            cur.execute(
                f"INSERT INTO {t('topics')} (slug, label, subject, module, grades) "
                f"VALUES ({esc(slug)}, {esc(label)}, {esc(subject)}, {esc(module)}, {esc(grades)})"
            )
        conn.commit()
        conn.close()
        return respond(200, {'ok': True})

    if method == 'POST' and action == 'seed':
        from seed_data import SEED as SEED_ITEMS
        items = list(SEED_ITEMS)
        added = 0
        with conn.cursor() as cur:
            cur.execute(f"SELECT topic_slug, text FROM {t('questions')}")
            existing = {(r[0], r[1]) for r in cur.fetchall()}
            batch = []
            for item in items:
                key = (item['slug'], item['text'])
                if key in existing:
                    continue
                existing.add(key)
                opts = json.dumps(item['options'], ensure_ascii=False)
                batch.append(
                    f"({esc(item['slug'])}, {esc(item['text'])}, {esc(opts)}, "
                    f"{int(item['right'])}, {esc(item.get('source', 'base'))})"
                )
                if len(batch) >= 120:
                    cur.execute(
                        f"INSERT INTO {t('questions')} (topic_slug, text, options, right_index, source) "
                        f"VALUES " + ','.join(batch)
                    )
                    added += len(batch)
                    batch = []
            if batch:
                cur.execute(
                    f"INSERT INTO {t('questions')} (topic_slug, text, options, right_index, source) "
                    f"VALUES " + ','.join(batch)
                )
                added += len(batch)
        conn.commit()
        with conn.cursor() as cur:
            cur.execute(f"SELECT COUNT(*) FROM {t('questions')}")
            total = cur.fetchone()[0]
        conn.close()
        return respond(200, {'ok': True, 'added': added, 'total': total})

    conn.close()
    return respond(404, {'error': 'Неизвестное действие'})