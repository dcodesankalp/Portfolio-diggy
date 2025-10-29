from flask import Flask, request, jsonify, send_from_directory
import smtplib, os, sqlite3, uuid
from email.message import EmailMessage
from datetime import datetime

app = Flask(__name__, static_folder='.')

DB_PATH = os.getenv('DB_PATH','messages.db')
SMTP_HOST = os.getenv('SMTP_HOST','smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT',587))
SMTP_USER = os.getenv('SMTP_USER','your.email@gmail.com')
SMTP_PASS = os.getenv('SMTP_PASS','your_app_password')
RECEIVE_EMAIL = os.getenv('RECEIVE_EMAIL', SMTP_USER)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS messages
                 (id TEXT PRIMARY KEY, name TEXT, email TEXT, message TEXT, created_at TEXT, verified INTEGER)''')
    conn.commit()
    conn.close()

@app.route('/contact', methods=['POST'])
def contact():
    data = request.get_json(force=True)
    name = data.get('name','').strip()
    email = data.get('email','').strip()
    message = data.get('message','').strip()
    if not (name and email and message):
        return jsonify({'error':'missing fields'}), 400
    if '@' not in email:
        return jsonify({'error':'invalid email'}), 400
    init_db()
    msg_id = str(uuid.uuid4())
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('INSERT INTO messages (id,name,email,message,created_at,verified) VALUES (?,?,?,?,?,?)',
              (msg_id,name,email,message,datetime.utcnow().isoformat(), 0))
    conn.commit()
    conn.close()
    try:
        send_email(name, email, message)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def send_email(name, from_email, message_body):
    msg = EmailMessage()
    msg['Subject'] = f'Portfolio Contact — {name}'
    msg['From'] = SMTP_USER
    msg['To'] = RECEIVE_EMAIL
    body = f'Name: {name}\nEmail: {from_email}\n\nMessage:\n{message_body}'
    msg.set_content(body)
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
        s.starttls()
        s.login(SMTP_USER, SMTP_PASS)
        s.send_message(msg)

# static serve index and assets when hosting everything in one repo (Replit)
@app.route('/')
def root():
    return send_from_directory('.', 'index.html')

@app.route('/assets/<path:p>')
def assets(p):
    return send_from_directory('assets', p)

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=3000)