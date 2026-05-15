import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt


ALGORITHM = "HS256"
security = HTTPBearer(auto_error=False)


def admin_username() -> str:
    return os.getenv("ADMIN_USERNAME", "admin")


def admin_password() -> str:
    return os.getenv("ADMIN_PASSWORD", "admin")


def jwt_secret_key() -> str:
    return os.getenv("JWT_SECRET_KEY", "dev-only-change-this-secret")


def jwt_expire_minutes() -> int:
    try:
        return int(os.getenv("JWT_EXPIRE_MINUTES", "720"))
    except ValueError:
        return 720


def create_access_token(subject: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=jwt_expire_minutes())
    payload = {"sub": subject, "exp": expires_at}
    return jwt.encode(payload, jwt_secret_key(), algorithm=ALGORITHM)


def verify_admin_credentials(username: str, password: str) -> bool:
    return username == admin_username() and password == admin_password()


def require_auth(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict[str, str]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, jwt_secret_key(), algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc
    subject = payload.get("sub")
    if subject != admin_username():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")
    return {"username": subject}
