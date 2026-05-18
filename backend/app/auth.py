import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt


ALGORITHM = "HS256"
security = HTTPBearer(auto_error=False)
Role = str


def superadmin_username() -> str:
    return os.getenv("SUPERADMIN_USERNAME", os.getenv("ADMIN_USERNAME", "admin"))


def superadmin_password() -> str:
    return os.getenv("SUPERADMIN_PASSWORD", os.getenv("ADMIN_PASSWORD", "admin"))


def viewer_username() -> str:
    return os.getenv("VIEWER_USERNAME", "viewer")


def viewer_password() -> str:
    return os.getenv("VIEWER_PASSWORD", "viewer")


def jwt_secret_key() -> str:
    return os.getenv("JWT_SECRET_KEY", "dev-only-change-this-secret")


def jwt_expire_minutes() -> int:
    try:
        return int(os.getenv("JWT_EXPIRE_MINUTES", "720"))
    except ValueError:
        return 720


def configured_users() -> list[dict[str, str]]:
    return [
        {"username": superadmin_username(), "password": superadmin_password(), "role": "superadmin"},
        {"username": viewer_username(), "password": viewer_password(), "role": "viewer"},
    ]


def create_access_token(subject: str, role: Role) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=jwt_expire_minutes())
    payload = {"sub": subject, "role": role, "exp": expires_at}
    return jwt.encode(payload, jwt_secret_key(), algorithm=ALGORITHM)


def authenticate_user(username: str, password: str) -> dict[str, str] | None:
    for user in configured_users():
        if username == user["username"] and password == user["password"]:
            return {"username": user["username"], "role": user["role"]}
    return None


def require_auth(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict[str, str]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, jwt_secret_key(), algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc
    subject = payload.get("sub")
    role = payload.get("role")
    valid_user = next((user for user in configured_users() if user["username"] == subject and user["role"] == role), None)
    if valid_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")
    return {"username": subject, "role": role}


def require_superadmin(user: dict[str, str] = Depends(require_auth)) -> dict[str, str]:
    if user.get("role") != "superadmin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superadmin role required")
    return user
