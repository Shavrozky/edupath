from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..auth import authenticate_user, create_access_token, create_refresh_token, require_auth, verify_refresh_token

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    accessToken: str
    refreshToken: str
    tokenType: str = "bearer"
    username: str
    role: str


class RefreshRequest(BaseModel):
    refreshToken: str


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> dict[str, str]:
    user = authenticate_user(payload.username, payload.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    return {
        "accessToken": create_access_token(user["username"], user["role"]),
        "refreshToken": create_refresh_token(user["username"], user["role"]),
        "tokenType": "bearer",
        "username": user["username"],
        "role": user["role"],
    }


@router.post("/refresh", response_model=LoginResponse)
def refresh(payload: RefreshRequest) -> dict[str, str]:
    user = verify_refresh_token(payload.refreshToken)
    return {
        "accessToken": create_access_token(user["username"], user["role"]),
        "refreshToken": create_refresh_token(user["username"], user["role"]),
        "tokenType": "bearer",
        "username": user["username"],
        "role": user["role"],
    }


@router.get("/me")
def me(user: dict[str, str] = Depends(require_auth)) -> dict[str, str]:
    return user
