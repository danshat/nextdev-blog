import os
from typing import Optional
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
SESSION_SALT = "nextdev-session"
SESSION_MAX_AGE = 60 * 60 * 24 * 7  # 7 days

serializer = URLSafeTimedSerializer(SECRET_KEY, salt=SESSION_SALT)


def create_session_token(data: dict) -> str:
    return serializer.dumps(data)


def load_session_token(token: str) -> Optional[dict]:
    try:
        data = serializer.loads(token, max_age=SESSION_MAX_AGE)
        return data
    except SignatureExpired:
        return None
    except BadSignature:
        return None
