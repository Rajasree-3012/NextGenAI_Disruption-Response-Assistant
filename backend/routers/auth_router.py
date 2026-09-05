from time import monotonic
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import or_
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, UserRole
from backend.auth import APP_ENV, AUTH_COOKIE_NAME, ACCESS_TOKEN_EXPIRE_MINUTES, verify_password, hash_password, create_access_token, get_current_user
from backend.schemas import Token, RegisterRequest, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])
failed_logins: dict[str, list[float]] = {}
MAX_LOGIN_FAILURES = 5
LOGIN_WINDOW_SECONDS = 60


def check_login_rate(request: Request) -> str:
    address = request.client.host if request.client else "unknown"
    now = monotonic()
    recent = [stamp for stamp in failed_logins.get(address, []) if now - stamp < LOGIN_WINDOW_SECONDS]
    failed_logins[address] = recent
    if len(recent) >= MAX_LOGIN_FAILURES:
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again later.")
    return address


@router.post("/token", response_model=Token)
def login(response: Response, request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    address = check_login_rate(request)
    user = db.query(User).filter(or_(User.username == form.username, User.email == form.username)).first()
    if not user or not verify_password(form.password, user.hashed_password):
        failed_logins.setdefault(address, []).append(monotonic())
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    token = create_access_token({"sub": str(user.id)})
    failed_logins.pop(address, None)
    response.set_cookie(AUTH_COOKIE_NAME, token, httponly=True, secure=APP_ENV == "production", samesite="lax", max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    return {"user": user}


@router.post("/register", response_model=Token)
def register(response: Response, req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    is_first = db.query(User).count() == 0
    user = User(
        username=req.username,
        email=req.email,
        full_name=req.full_name,
        hashed_password=hash_password(req.password),
        role=UserRole.admin if is_first else UserRole.viewer,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    response.set_cookie(AUTH_COOKIE_NAME, token, httponly=True, secure=APP_ENV == "production", samesite="lax", max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    return {"user": user}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(AUTH_COOKIE_NAME)
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
