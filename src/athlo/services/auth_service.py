"""Authentication service for user management and JWT tokens."""

import secrets
from datetime import datetime, timedelta
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import EmailStr

from athlo.config import settings
from athlo.models.user import RefreshToken, User
from athlo.repositories.json_repository import JsonRepository

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Repositories
user_repo = JsonRepository[User]("users.json", User)
refresh_token_repo = JsonRepository[RefreshToken]("refresh_tokens.json", RefreshToken)


class AuthError(Exception):
    """Authentication error."""

    pass


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: UUID) -> str:
    """Create a JWT access token."""
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: UUID) -> tuple[str, RefreshToken]:
    """Create a refresh token and store it."""
    token_str = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)

    refresh_token = RefreshToken(
        user_id=user_id,
        token=token_str,
        expires_at=expires_at,
    )
    refresh_token_repo.create(refresh_token)
    return token_str, refresh_token


def decode_access_token(token: str) -> UUID | None:
    """Decode and validate an access token. Returns user_id if valid."""
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
        if payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        return UUID(user_id) if user_id else None
    except JWTError:
        return None


def register_user(email: EmailStr, password: str, name: str) -> User:
    """Register a new user."""
    # Check if email already exists
    existing = user_repo.find_one_by(email=email)
    if existing:
        raise AuthError("Email already registered")

    # Validate password
    if len(password) < 8:
        raise AuthError("Password must be at least 8 characters")

    # Create user
    user = User(
        email=email,
        password_hash=hash_password(password),
        name=name,
    )
    return user_repo.create(user)


def login_user(email: EmailStr, password: str) -> tuple[User, str, str]:
    """
    Authenticate a user and return tokens.

    Returns:
        Tuple of (user, access_token, refresh_token)
    """
    user = user_repo.find_one_by(email=email)
    if not user or not verify_password(password, user.password_hash):
        raise AuthError("Invalid email or password")

    if not user.is_active:
        raise AuthError("Account is deactivated")

    access_token = create_access_token(user.id)
    refresh_token_str, _ = create_refresh_token(user.id)

    return user, access_token, refresh_token_str


def refresh_access_token(refresh_token_str: str) -> tuple[str, str]:
    """
    Exchange a refresh token for new tokens.

    Returns:
        Tuple of (new_access_token, new_refresh_token)
    """
    # Find the refresh token
    token = refresh_token_repo.find_one_by(token=refresh_token_str)
    if not token:
        raise AuthError("Invalid refresh token")

    if token.revoked:
        raise AuthError("Refresh token has been revoked")

    if token.expires_at < datetime.utcnow():
        raise AuthError("Refresh token has expired")

    # Get the user
    user = user_repo.get(token.user_id)
    if not user or not user.is_active:
        raise AuthError("User not found or inactive")

    # Revoke old refresh token
    token.revoked = True
    refresh_token_repo.update(token)

    # Create new tokens
    new_access_token = create_access_token(user.id)
    new_refresh_token_str, _ = create_refresh_token(user.id)

    return new_access_token, new_refresh_token_str


def logout_user(refresh_token_str: str) -> bool:
    """Revoke a refresh token (logout)."""
    token = refresh_token_repo.find_one_by(token=refresh_token_str)
    if token and not token.revoked:
        token.revoked = True
        refresh_token_repo.update(token)
        return True
    return False


def get_user_by_id(user_id: UUID) -> User | None:
    """Get a user by ID."""
    return user_repo.get(user_id)


def update_user(user: User) -> User:
    """Update user profile."""
    return user_repo.update(user)


def change_password(user_id: UUID, current_password: str, new_password: str) -> bool:
    """Change user password."""
    user = user_repo.get(user_id)
    if not user:
        raise AuthError("User not found")

    if not verify_password(current_password, user.password_hash):
        raise AuthError("Current password is incorrect")

    if len(new_password) < 8:
        raise AuthError("New password must be at least 8 characters")

    user.password_hash = hash_password(new_password)
    user_repo.update(user)
    return True


def delete_user(user_id: UUID) -> bool:
    """Delete a user account."""
    return user_repo.delete(user_id)
