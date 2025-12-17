"""Authentication routes."""

from fastapi import APIRouter, Depends, HTTPException, status

from athlo.api.deps import get_current_user
from athlo.api.schemas import (
    ErrorResponse,
    LoginRequest,
    LogoutRequest,
    PasswordChangeRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    UserUpdateRequest,
)
from athlo.models.user import User
from athlo.services import auth_service
from athlo.services.auth_service import AuthError

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}},
)
async def register(request: RegisterRequest):
    """Register a new user account."""
    try:
        user = auth_service.register_user(
            email=request.email,
            password=request.password,
            name=request.name,
        )
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            preferred_units=user.preferred_units,
            is_active=user.is_active,
            created_at=user.created_at,
        )
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/login",
    response_model=TokenResponse,
    responses={401: {"model": ErrorResponse}},
)
async def login(request: LoginRequest):
    """Login and get access/refresh tokens."""
    try:
        user, access_token, refresh_token = auth_service.login_user(
            email=request.email,
            password=request.password,
        )
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post(
    "/refresh",
    response_model=TokenResponse,
    responses={401: {"model": ErrorResponse}},
)
async def refresh_token(request: RefreshRequest):
    """Exchange refresh token for new access/refresh tokens."""
    try:
        access_token, refresh_token = auth_service.refresh_access_token(
            request.refresh_token
        )
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: LogoutRequest):
    """Logout by revoking the refresh token."""
    auth_service.logout_user(request.refresh_token)
    return None


# User profile routes (protected)
user_router = APIRouter(prefix="/users", tags=["Users"])


@user_router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        preferred_units=current_user.preferred_units,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )


@user_router.put("/me", response_model=UserResponse)
async def update_profile(
    request: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    """Update current user profile."""
    if request.name is not None:
        current_user.name = request.name
    if request.preferred_units is not None:
        if request.preferred_units not in ("metric", "imperial"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="preferred_units must be 'metric' or 'imperial'",
            )
        current_user.preferred_units = request.preferred_units

    updated_user = auth_service.update_user(current_user)
    return UserResponse(
        id=updated_user.id,
        email=updated_user.email,
        name=updated_user.name,
        preferred_units=updated_user.preferred_units,
        is_active=updated_user.is_active,
        created_at=updated_user.created_at,
    )


@user_router.put(
    "/me/password",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={400: {"model": ErrorResponse}},
)
async def change_password(
    request: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
):
    """Change current user password."""
    try:
        auth_service.change_password(
            user_id=current_user.id,
            current_password=request.current_password,
            new_password=request.new_password,
        )
        return None
    except AuthError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@user_router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(current_user: User = Depends(get_current_user)):
    """Delete current user account."""
    auth_service.delete_user(current_user.id)
    return None
