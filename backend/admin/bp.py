import json
import os
import base64
import uuid
import psycopg2
import boto3

SCHEMA = 't_p76227163_vpr_quest_gaming_pla'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
}


def default_config():
    levels = []
    for l in range(1, 31):
        if l % 10 == 0:
            free = {'type': 'item', 'item': 'backpack', 'count': 1}
            prem = {'type': 'vehicle', 'model': 'jester' if l == 30 else 'sultan', 'title': 'Jester' if l == 30 else 'Sultan'}
        elif l % 5 == 0:
            free = {'type': 'item', 'item': 'armour', 'count': 1}
            prem = {'type': 'coins', 'amount': 100}
        elif l % 3 == 0:
            free = {'type': 'item', 'item': 'medkit', 'count': 2}
            prem = {'type': 'money', 'amount': 5000 * l}
        else:
            free = {'type': 'money', 'amount': 1000 * l}
            prem = {'type': 'item', 'item': 'repair', 'count': 2}
        levels.append({'free': free, 'premium': prem})
    return {
        'seasonId': 'winter-2026',
        'title1': 'А-РКТИЧЕСКИЙ',
        'title2': 'ПРОПУСК',
        'edition': 'ЗИМНЕЕ ИЗДАНИЕ',
        'description': 'Пропуск — это уникальная система призов. Приобретя его, вы получите доступ к эксклюзивным предметам: уникальные машины, деньги, коины и многое другое. С каждым новым уровнем вы становитесь ближе к супер-призу. Пройдите всю цепочку раньше всех и возглавьте рейтинг лидеров!',
        'background': 'img/bp_winter.jpg',
        'price': 3000,
        'levelPrice': 150,
        'giftEnabled': True,
        'minutesPerLevel': 30,
        'endsAt': '2027-02-28',
        'levels': levels,
    }


def respond(code, payload):
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False), 'isBase64Encoded': False}


def load(cur):
    cur.execute(f'SELECT data FROM {SCHEMA}.battlepass_config WHERE id = 1')
    r = cur.fetchone()
    return json.loads(r[0]) if r else default_config()


def bp_handler(event: dict) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**CORS, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor()

    if event.get('httpMethod') == 'GET':
        cfg = load(cur)
        conn.close()
        return respond(200, {'config': cfg})

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')
    pwd = os.environ.get('BP_ADMIN_PASSWORD') or ''
    if not pwd or body.get('password') != pwd:
        conn.close()
        return respond(403, {'error': 'Неверный пароль'})

    if action == 'login':
        conn.close()
        return respond(200, {'ok': True})

    if action == 'save':
        cfg = body.get('config')
        if not isinstance(cfg, dict) or not isinstance(cfg.get('levels'), list):
            conn.close()
            return respond(400, {'error': 'Неверные данные'})
        raw = json.dumps(cfg, ensure_ascii=False).replace("'", "''")
        cur.execute(f"INSERT INTO {SCHEMA}.battlepass_config (id, data, updated_at) VALUES (1, '{raw}', NOW()) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()")
        conn.close()
        return respond(200, {'ok': True})

    if action == 'reset':
        cur.execute(f'DELETE FROM {SCHEMA}.battlepass_config WHERE id = 1')
        conn.close()
        return respond(200, {'config': default_config()})

    if action == 'upload':
        conn.close()
        data = base64.b64decode(body.get('data', '').split(',')[-1])
        ctype = body.get('type') or 'image/jpeg'
        ext = {'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif'}.get(ctype, 'jpg')
        key = f'battlepass/{uuid.uuid4().hex}.{ext}'
        s3 = boto3.client('s3', endpoint_url='https://bucket.poehali.dev', aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'], aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
        s3.put_object(Bucket='files', Key=key, Body=data, ContentType=ctype)
        return respond(200, {'url': f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"})

    conn.close()
    return respond(400, {'error': 'Неизвестное действие'})
