from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from datetime import datetime, timedelta
import secrets
from app.api.deps import get_current_user
from app.api.deps import create_access_token, get_db, get_password_hash, verify_password
from app.models import User

router = APIRouter(tags=["auth"])

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    college: str
    college_logo: str | None = None
    roll_number: str | None = None

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/register", response_model=Token)
async def register(body: UserCreate, db: AsyncSession = Depends(get_db)) -> Any:
    stmt = select(User).where(User.email == body.email)
    existing_user = (await db.execute(stmt)).scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        name=body.name,
        college=body.college,
        college_logo=body.college_logo,
        roll_number=body.roll_number,
        password_hash=get_password_hash(body.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)) -> Any:
    stmt = select(User).where(User.email == form_data.username)
    user = (await db.execute(stmt)).scalars().first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    college: str
    roll_number: str | None = None

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        college=current_user.college,
        roll_number=current_user.roll_number
    )

class ForgotPassword(BaseModel):
    email: str

@router.post("/forgot-password")
async def forgot_password(body: ForgotPassword, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == body.email)
    user = (await db.execute(stmt)).scalars().first()
    if user:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expires = datetime.utcnow() + timedelta(minutes=5)
        await db.commit()
        print(f"PASSWORD RESET LINK FOR {user.email}: http://localhost:5173/reset-password?token={token}")
        return {"msg": "Password reset email sent (check terminal for dev link)", "token": token}
    return {"msg": "If email exists, reset link has been sent"}

class ResetPassword(BaseModel):
    token: str
    new_password: str

@router.post("/reset-password")
async def reset_password(body: ResetPassword, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.reset_token == body.token)
    user = (await db.execute(stmt)).scalars().first()
    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    user.password_hash = get_password_hash(body.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    await db.commit()
    return {"msg": "Password has been reset successfully"}

class ChangePassword(BaseModel):
    old_password: str
    new_password: str

@router.post("/change-password")
async def change_password(body: ChangePassword, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not verify_password(body.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    current_user.password_hash = get_password_hash(body.new_password)
    await db.commit()
    return {"msg": "Password changed successfully"}
