import os
import re
import secrets
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    create_access_token,
    get_current_user,
    get_db,
    get_password_hash,
    verify_password,
)
from app.core.rate_limit import forgot_password_limiter, get_client_ip
from app.models import User

router = APIRouter(tags=["auth"])

def validate_password_complexity(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter (A-Z)")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter (a-z)")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number (0-9)")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_+=\[\]\\\/~`]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character (!@#$%^&*)")

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
    validate_password_complexity(body.password)
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

def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST") or os.getenv("MAIL_SERVER")
    smtp_port_raw = os.getenv("SMTP_PORT") or os.getenv("MAIL_PORT") or "587"
    smtp_user = os.getenv("SMTP_USER") or os.getenv("MAIL_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD") or os.getenv("MAIL_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM") or os.getenv("MAIL_FROM") or smtp_user or "noreply@labpilotai.com"
    use_tls = os.getenv("SMTP_TLS", "true").lower() in ("true", "1", "yes")

    if not smtp_host or not smtp_user or not smtp_password:
        return False

    try:
        smtp_port = int(smtp_port_raw)
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "LabPilotAI - Password Reset Request"
        msg["From"] = f"LabPilotAI <{smtp_from}>"
        msg["To"] = to_email

        text_content = (
            f"Hello,\n\n"
            f"You requested a password reset for your LabPilotAI account.\n"
            f"Click the link below to set a new password:\n{reset_link}\n\n"
            f"This link is valid for 15 minutes. If you did not request this, please ignore this email.\n\n"
            f"Best regards,\nLabPilotAI Team"
        )

        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: bold;">LabPilotAI</h1>
                <p style="color: #6b7280; font-size: 13px; margin-top: 4px;">Automated Lab Documentation & Viva AI Prep</p>
            </div>
            <p style="color: #374151; font-size: 15px;">Hello,</p>
            <p style="color: #374151; font-size: 15px;">We received a request to reset your password. Click the button below to set up a new password for your account:</p>
            <div style="text-align: center; margin: 28px 0;">
                <a href="{reset_link}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; font-weight: 600; font-size: 14px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #6b7280; font-size: 13px;">Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb; font-size: 13px;"><a href="{reset_link}">{reset_link}</a></p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">This password reset link is valid for 15 minutes. If you did not request this change, you can safely ignore this email.</p>
        </div>
        """

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10) as server:
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                if use_tls:
                    server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        return True
    except Exception as exc:
        print(f"Error sending password reset email via SMTP: {exc}")
        return False

class ForgotPassword(BaseModel):
    email: str

GENERIC_RESET_MSG = "If an account exists with this email address, a password reset link has been sent to your inbox."

@router.post("/forgot-password")
async def forgot_password(body: ForgotPassword, request: Request, db: AsyncSession = Depends(get_db)):
    # 1. Enforce rate limiting per client IP to mitigate abuse and email flooding
    forgot_password_limiter.check(
        get_client_ip(request),
        custom_message="Too many password reset requests. Please wait a few minutes before trying again."
    )

    stmt = select(User).where(User.email == body.email)
    user = (await db.execute(stmt)).scalars().first()
    if user:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expires = datetime.utcnow() + timedelta(minutes=15)
        await db.commit()

        # 2. Prevent Host Header / Reset-Link poisoning: strictly use configured FRONTEND_URL
        frontend_url = os.getenv("FRONTEND_URL", "https://lab-pilot-ai.vercel.app").rstrip("/")
        reset_link = f"{frontend_url}/reset-password?token={token}"

        # 3. Deliver token ONLY via email
        send_password_reset_email(user.email, reset_link)

    # 4. Return identical generic message to prevent account enumeration
    # Never return the token or reset_url in the API response
    return {"msg": GENERIC_RESET_MSG}

class ResetPassword(BaseModel):
    token: str
    new_password: str

@router.post("/reset-password")
async def reset_password(body: ResetPassword, db: AsyncSession = Depends(get_db)):
    validate_password_complexity(body.new_password)
    stmt = select(User).where(User.reset_token == body.token)
    user = (await db.execute(stmt)).scalars().first()
    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
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
    validate_password_complexity(body.new_password)
    if not verify_password(body.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    current_user.password_hash = get_password_hash(body.new_password)
    await db.commit()
    return {"msg": "Password changed successfully"}
