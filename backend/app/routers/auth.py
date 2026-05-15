from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..auth import create_access_token, require_auth, verify_admin_credentials

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> dict[str, str]:
    if not verify_admin_credentials(payload.username, payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    return {"accessToken": create_access_token(payload.username), "tokenType": "bearer"}


@router.get("/me")
def me(user: dict[str, str] = Depends(require_auth)) -> dict[str, str]:
    return user
