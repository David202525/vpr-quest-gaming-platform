import json
import os
import hashlib
import secrets
import random
from datetime import datetime, timedelta
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


def hash_password(password: str, salt: str = '') -> str:
    salt = salt or secrets.token_hex(8)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 60000).hex()
    return f'{salt}${digest}'


def check_password(password: str, stored: str) -> bool:
    if '$' not in stored:
        return False
    salt = stored.split('$', 1)[0]
    return hash_password(password, salt) == stored


def make_session(conn, role: str, user_id: int) -> str:
    token = secrets.token_hex(24)
    expires = (datetime.utcnow() + timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')
    with conn.cursor() as cur:
        cur.execute(
            f"INSERT INTO {t('sessions')} (token, role, user_id, expires_at) "
            f"VALUES ({esc(token)}, {esc(role)}, {user_id}, {esc(expires)})"
        )
    conn.commit()
    return token


def resolve_session(conn, token: str):
    if not token:
        return None
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT role, user_id FROM {t('sessions')} "
            f"WHERE token = {esc(token)} AND expires_at > NOW()"
        )
        row = cur.fetchone()
    if not row:
        return None
    return {'role': row[0], 'user_id': row[1]}


def respond(status, payload):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False), 'isBase64Encoded': False}


def new_child_code(conn) -> str:
    while True:
        code = 'QST-' + ''.join(random.choice('ABCDEFGHJKLMNPQRSTUVWXYZ23456789') for _ in range(5))
        with conn.cursor() as cur:
            cur.execute(f"SELECT 1 FROM {t('children')} WHERE login_code = {esc(code)}")
            if not cur.fetchone():
                return code


def handler(event: dict, context) -> dict:
    """Вход и регистрация: родитель заходит по почте и паролю, ребёнок — по коду и ПИН-коду."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token') or ''

    conn = connect()

    if method == 'GET' and action == 'me':
        session = resolve_session(conn, token)
        if not session:
            conn.close()
            return respond(200, {'authorized': False})
        with conn.cursor() as cur:
            if session['role'] == 'parent':
                cur.execute(f"SELECT id, name, email FROM {t('parents')} WHERE id = {session['user_id']}")
                row = cur.fetchone()
                conn.close()
                if not row:
                    return respond(200, {'authorized': False})
                return respond(200, {'authorized': True, 'role': 'parent', 'user': {'id': row[0], 'name': row[1], 'email': row[2]}})
            cur.execute(
                f"SELECT id, name, grade, avatar, coins, xp, energy, login_code "
                f"FROM {t('children')} WHERE id = {session['user_id']}"
            )
            row = cur.fetchone()
        conn.close()
        if not row:
            return respond(200, {'authorized': False})
        return respond(200, {'authorized': True, 'role': 'child', 'user': {
            'id': row[0], 'name': row[1], 'grade': row[2], 'avatar': row[3],
            'coins': row[4], 'xp': row[5], 'energy': row[6], 'code': row[7],
        }})

    body = json.loads(event.get('body') or '{}')

    if method == 'POST' and action == 'register':
        email = (body.get('email') or '').strip().lower()
        name = (body.get('name') or '').strip()
        password = body.get('password') or ''
        if len(name) < 2 or '@' not in email or len(password) < 6:
            conn.close()
            return respond(400, {'error': 'Проверьте имя, почту и пароль (от 6 символов)'})
        with conn.cursor() as cur:
            cur.execute(f"SELECT 1 FROM {t('parents')} WHERE email = {esc(email)}")
            if cur.fetchone():
                conn.close()
                return respond(409, {'error': 'Такая почта уже зарегистрирована'})
            cur.execute(
                f"INSERT INTO {t('parents')} (email, name, password_hash) "
                f"VALUES ({esc(email)}, {esc(name)}, {esc(hash_password(password))}) RETURNING id"
            )
            parent_id = cur.fetchone()[0]
        conn.commit()
        session_token = make_session(conn, 'parent', parent_id)
        conn.close()
        return respond(200, {'token': session_token, 'role': 'parent', 'user': {'id': parent_id, 'name': name, 'email': email}})

    if method == 'POST' and action == 'login':
        email = (body.get('email') or '').strip().lower()
        password = body.get('password') or ''
        with conn.cursor() as cur:
            cur.execute(f"SELECT id, name, password_hash FROM {t('parents')} WHERE email = {esc(email)}")
            row = cur.fetchone()
        if not row or not check_password(password, row[2]):
            conn.close()
            return respond(401, {'error': 'Неверная почта или пароль'})
        session_token = make_session(conn, 'parent', row[0])
        conn.close()
        return respond(200, {'token': session_token, 'role': 'parent', 'user': {'id': row[0], 'name': row[1], 'email': email}})

    if method == 'POST' and action == 'child-login':
        code = (body.get('code') or '').strip().upper()
        pin = (body.get('pin') or '').strip()
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id, name, grade, avatar, coins, xp, energy, pin "
                f"FROM {t('children')} WHERE login_code = {esc(code)}"
            )
            row = cur.fetchone()
        if not row or row[7] != pin:
            conn.close()
            return respond(401, {'error': 'Не подходит код или ПИН. Спроси у родителей.'})
        session_token = make_session(conn, 'child', row[0])
        conn.close()
        return respond(200, {'token': session_token, 'role': 'child', 'user': {
            'id': row[0], 'name': row[1], 'grade': row[2], 'avatar': row[3],
            'coins': row[4], 'xp': row[5], 'energy': row[6], 'code': code,
        }})

    if method == 'POST' and action == 'add-child':
        session = resolve_session(conn, token)
        if not session or session['role'] != 'parent':
            conn.close()
            return respond(401, {'error': 'Нужен вход в кабинет родителя'})
        name = (body.get('name') or '').strip()
        grade = (body.get('grade') or '5').strip()
        pin = (body.get('pin') or '').strip()
        avatar = (body.get('avatar') or 'panda').strip()
        if len(name) < 2 or not pin.isdigit() or len(pin) != 4:
            conn.close()
            return respond(400, {'error': 'Имя от 2 символов, ПИН — ровно 4 цифры'})
        code = new_child_code(conn)
        with conn.cursor() as cur:
            cur.execute(
                f"INSERT INTO {t('children')} (parent_id, name, grade, login_code, pin, avatar) "
                f"VALUES ({session['user_id']}, {esc(name)}, {esc(grade)}, {esc(code)}, {esc(pin)}, {esc(avatar)}) "
                f"RETURNING id"
            )
            child_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return respond(200, {'child': {
            'id': child_id, 'name': name, 'grade': grade, 'code': code,
            'pin': pin, 'avatar': avatar, 'coins': 0, 'xp': 0, 'energy': 5,
        }})

    if method == 'POST' and action == 'logout':
        if token:
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {t('sessions')} SET expires_at = NOW() WHERE token = {esc(token)}")
            conn.commit()
        conn.close()
        return respond(200, {'ok': True})

    conn.close()
    return respond(404, {'error': 'Неизвестное действие'})
