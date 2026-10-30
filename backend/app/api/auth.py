import hashlib
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie, Request, BackgroundTasks
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole
from app.models.refresh_token import RefreshToken
from app.schemas.user import (
    UserRegister, UserLogin, UserResponse, Token,
    RefreshTokenRequest, ForgotPasswordRequest, ResetPasswordRequest
)
from app.services.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, create_password_reset_token,
    decode_token
)
from app.services.email import send_welcome_email, send_password_reset_email
from app.api.deps import get_current_user, get_current_user_optional
from app.limiter import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])

REFRESH_COOKIE_NAME = "studyhub_refresh"


def _hash_token(raw_token: str) -> str:
    """SHA-256 hash of the raw refresh token for safe storage."""
    return hashlib.sha256(raw_token.encode()).hexdigest()


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    """Attach the refresh token as an HttpOnly, SameSite=Lax, Secure cookie."""
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw_token,
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path="/api/v1/auth")


def _create_and_store_refresh_token(db: Session, user_id: int, family_id: str) -> str:
    """Generate a new refresh token, store its hash in DB, and return the raw value."""
    raw = str(uuid.uuid4())
    token_hash = _hash_token(raw)
    rt = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        family_id=family_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(rt)
    db.commit()
    return raw


def _check_lockout(user: User) -> None:
    """Raise 403 if the account is currently locked out."""
    if user.locked_until and datetime.now(timezone.utc) < user.locked_until.replace(tzinfo=timezone.utc if user.locked_until.tzinfo is None else None):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account temporarily locked due to too many failed login attempts. Try again later.",
        )


def _record_failed_login(db: Session, user: User) -> None:
    """Increment failure counter; lock the account after MAX_FAILED_LOGIN_ATTEMPTS."""
    user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
    if user.failed_login_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
        user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
    db.commit()


def _reset_failed_login(db: Session, user: User) -> None:
    """Clear failure counters on successful login."""
    if user.failed_login_attempts or user.locked_until:
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()


# ──────────────────────────────────────────────────────────────────────────────


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_AUTH)
def register(
    request: Request,
    user_in: UserRegister,
    response: Response,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Register a new user and return JWT access + refresh tokens and HttpOnly cookie."""
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    assigned_role = UserRole.STUDENT.value
    if user_in.role and user_in.role.lower() == UserRole.INSTRUCTOR.value:
        assigned_role = UserRole.INSTRUCTOR.value

    new_user = User(
        email=user_in.email.lower(),
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name.strip(),
        role=assigned_role,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    user_claims = {"sub": str(new_user.id), "role": new_user.role, "email": new_user.email}
    access_token = create_access_token(data=user_claims)
    refresh_token = create_refresh_token(data=user_claims)

    family_id = str(uuid.uuid4())
    raw_refresh = _create_and_store_refresh_token(db, new_user.id, family_id)
    _set_refresh_cookie(response, raw_refresh)

    # Dispatch welcome email asynchronously
    background_tasks.add_task(send_welcome_email, to_email=new_user.email, full_name=new_user.full_name)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": new_user,
    }


@router.post("/login", response_model=Token)
@limiter.limit(settings.RATE_LIMIT_AUTH)
def login(request: Request, user_in: UserLogin, response: Response, db: Session = Depends(get_db)):
    """Authenticate user; returns access token + refresh token + HttpOnly cookie."""
    user = db.query(User).filter(User.email == user_in.email.lower()).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    _check_lockout(user)

    if not verify_password(user_in.password, user.hashed_password):
        _record_failed_login(db, user)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is disabled. Please contact the administrator.",
        )

    _reset_failed_login(db, user)

    user_claims = {"sub": str(user.id), "role": user.role, "email": user.email}
    access_token = create_access_token(data=user_claims)
    refresh_token = create_refresh_token(data=user_claims)

    family_id = str(uuid.uuid4())
    raw_refresh = _create_and_store_refresh_token(db, user.id, family_id)
    _set_refresh_cookie(response, raw_refresh)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/refresh", response_model=Token)
def refresh_token(
    request_data: Optional[RefreshTokenRequest] = None,
    response: Response = None,
    db: Session = Depends(get_db),
    cookie_token: Optional[str] = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
):
    """
    Rotate refresh token: supports JWT refresh token in request body or HttpOnly cookie.
    Validates user active status, regenerates tokens, and updates cookie.
    """
    token_str = (request_data.refresh_token if request_data and request_data.refresh_token else None) or cookie_token
    if not token_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")

    # Check if it's a signed JWT refresh token
    payload = decode_token(token_str, expected_type="refresh")
    if payload and payload.get("sub"):
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account invalid")

        user_claims = {"sub": str(user.id), "role": user.role, "email": user.email}
        new_access = create_access_token(data=user_claims)
        new_refresh = create_refresh_token(data=user_claims)

        family_id = str(uuid.uuid4())
        raw_refresh = _create_and_store_refresh_token(db, user.id, family_id)
        if response:
            _set_refresh_cookie(response, raw_refresh)

        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer",
            "user": user,
        }

    # Fallback to database-backed opaque refresh token
    token_hash = _hash_token(token_str)
    rt = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if not rt:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if rt.revoked:
        db.query(RefreshToken).filter(RefreshToken.family_id == rt.family_id).update({"revoked": True})
        db.commit()
        if response:
            _clear_refresh_cookie(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token reuse detected. Session invalidated.")

    if datetime.now(timezone.utc) > rt.expires_at.replace(tzinfo=timezone.utc if rt.expires_at.tzinfo is None else None):
        rt.revoked = True
        db.commit()
        if response:
            _clear_refresh_cookie(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    user = db.query(User).filter(User.id == rt.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account invalid")

    rt.revoked = True
    db.commit()

    user_claims = {"sub": str(user.id), "role": user.role, "email": user.email}
    new_access = create_access_token(data=user_claims)
    new_refresh_jwt = create_refresh_token(data=user_claims)
    raw_new_refresh = _create_and_store_refresh_token(db, user.id, rt.family_id)

    rt.replaced_by = _hash_token(raw_new_refresh)
    db.commit()

    if response:
        _set_refresh_cookie(response, raw_new_refresh)

    return {
        "access_token": new_access,
        "refresh_token": new_refresh_jwt,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Initiate password recovery. Generates a signed JWT reset token and dispatches email."""
    user = db.query(User).filter(User.email == request.email.lower()).first()
    if user and user.is_active:
        token = create_password_reset_token(user_id=user.id, email=user.email, expires_minutes=15)
        background_tasks.add_task(
            send_password_reset_email,
            to_email=user.email,
            full_name=user.full_name,
            reset_token=token
        )

    return {
        "message": "If an active account exists with that email, a password reset link has been dispatched."
    }


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verify cryptographic reset token and update user password."""
    payload = decode_token(request.token, expected_type="reset_password")
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token is invalid or has expired. Please request a new link.",
        )

    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found or disabled.",
        )

    user.hashed_password = hash_password(request.new_password)
    db.commit()

    return {
        "message": "Your password has been successfully reset. You may now log in with your new credentials."
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get profile information for the currently authenticated user."""
    return current_user


@router.post("/logout")
def logout(
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: Optional[str] = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Revoke current refresh token and clear the cookie."""
    if refresh_token:
        token_hash = _hash_token(refresh_token)
        rt = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
        if rt:
            rt.revoked = True
            db.commit()
    elif current_user:
        tokens = db.query(RefreshToken).filter(
            RefreshToken.user_id == current_user.id,
            RefreshToken.revoked == False
        ).all()
        for t in tokens:
            t.revoked = True
        db.commit()

    _clear_refresh_cookie(response)
    return {"message": "Successfully logged out"}


@router.post("/logout-all")
def logout_all(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Revoke ALL refresh tokens for the current user (all sessions)."""
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.revoked.is_(False),
    ).update({"revoked": True})
    db.commit()
    _clear_refresh_cookie(response)
    return {"message": "All sessions have been logged out"}
