from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
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
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Register a new user (Student or Instructor) and return JWT access + refresh tokens."""
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # Restrict self-registration role to student or instructor only
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

    # Dispatch welcome email asynchronously
    background_tasks.add_task(send_welcome_email, to_email=new_user.email, full_name=new_user.full_name)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": new_user,
    }


@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password and return JWT access + refresh tokens."""
    user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
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

    user_claims = {"sub": str(user.id), "role": user.role, "email": user.email}
    access_token = create_access_token(data=user_claims)
    refresh_token = create_refresh_token(data=user_claims)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/refresh", response_model=Token)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Generate new access and refresh tokens using a valid refresh token.
    Enforces JWT type claims and validates user active status.
    """
    payload = decode_token(request.refresh_token, expected_type="refresh")
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token. Please sign in again.",
        )

    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this token is not active.",
        )

    user_claims = {"sub": str(user.id), "role": user.role, "email": user.email}
    new_access_token = create_access_token(data=user_claims)
    new_refresh_token = create_refresh_token(data=user_claims)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Initiate password recovery. Generates a signed JWT reset token and dispatches an email notification.
    """
    user = db.query(User).filter(User.email == request.email.lower()).first()
    if user and user.is_active:
        token = create_password_reset_token(user_id=user.id, email=user.email, expires_minutes=15)
        background_tasks.add_task(
            send_password_reset_email,
            to_email=user.email,
            full_name=user.full_name,
            reset_token=token
        )

    # Return same generic response to prevent user enumeration attacks
    return {
        "message": "If an active account exists with that email, a password reset link has been dispatched."
    }


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Verify the cryptographic reset token and update user password.
    """
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
def logout():
    """Logout endpoint to confirm session closure on client."""
    return {"message": "Successfully logged out"}
