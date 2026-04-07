import jwt
import datetime
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError
from config import Config
import models

ph = PasswordHasher()

def hash_password(password):
    """Argon2 hash for a password."""
    return ph.hash(password)

def authenticate_user(email, password):
    user = models.get_user_by_email(email)
    if not user:
        return None
    stored_hash = user[1]  
    try:
        ph.verify(stored_hash, password)
        return {'user_id': user[0], 'role': user[2]}
    except VerificationError:
        return None

def generate_token(user_id, role):
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=5)
    }
    token = jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')
    return token if isinstance(token, str) else token.decode('utf-8')

def verify_token(token):
    try:
        return jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
    except ExpiredSignatureError:
        return None
    except InvalidTokenError:
        return None
