import os
from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.api.deps import get_password_hash
from app.api.routes.auth import get_frontend_url, send_password_reset_email
from app.core.database import AsyncSessionLocal
from app.main import app
from app.models import User


@pytest.mark.asyncio
async def test_get_frontend_url():
    req = MagicMock()
    req.headers = {"origin": "http://localhost:5173"}
    with patch.dict(os.environ, {"FRONTEND_URL": "http://myfrontend.com"}):
        assert get_frontend_url(req) == "http://myfrontend.com"

    with patch.dict(os.environ, {"FRONTEND_URL": ""}, clear=False):
        assert get_frontend_url(req) == "http://localhost:5173"

    req.headers = {}
    with patch.dict(os.environ, {"FRONTEND_URL": ""}, clear=False):
        assert get_frontend_url(req) == "https://lab-pilot-ai.vercel.app"

def test_send_password_reset_email_no_smtp():
    with patch.dict(os.environ, {"SMTP_HOST": "", "SMTP_USER": "", "SMTP_PASSWORD": ""}):
        result = send_password_reset_email("test@example.com", "http://localhost:5173/reset-password?token=abc")
        assert result is False

def test_send_password_reset_email_mocked_smtp():
    with patch.dict(os.environ, {
        "SMTP_HOST": "smtp.gmail.com",
        "SMTP_PORT": "587",
        "SMTP_USER": "test@gmail.com",
        "SMTP_PASSWORD": "app-password-1234",
        "SMTP_TLS": "true"
    }):
        with patch("smtplib.SMTP") as mock_smtp:
            instance = mock_smtp.return_value.__enter__.return_value
            result = send_password_reset_email("user@example.com", "http://localhost:5173/reset-password?token=123")
            assert result is True
            assert instance.ehlo.called
            assert instance.starttls.called
            assert instance.login.called
            assert instance.send_message.called

@pytest.mark.asyncio
async def test_forgot_and_reset_password_flow():
    async with AsyncSessionLocal() as db:
        # Create a test user
        test_email = "resettester@example.com"
        stmt = select(User).where(User.email == test_email)
        existing = (await db.execute(stmt)).scalars().first()
        if not existing:
            user = User(
                email=test_email,
                password_hash=get_password_hash("OldPassword123!"),
                name="Test Reset User",
                college="Test University"
            )
            db.add(user)
            await db.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Request password reset for unknown email
        res_unknown = await ac.post("/api/v1/auth/forgot-password", json={"email": "nobody_exists_here_xyz@example.com"})
        assert res_unknown.status_code == 200
        assert "If an account exists with this email address" in res_unknown.json()["msg"]
        assert "dev_reset_url" not in res_unknown.json()

        # 2. Request password reset for existing user without SMTP configured
        with patch.dict(os.environ, {"SMTP_HOST": "", "ENVIRONMENT": "development"}):
            res_known = await ac.post("/api/v1/auth/forgot-password", json={"email": test_email})
            assert res_known.status_code == 200
            data = res_known.json()
            assert "If an account exists with this email address" in data["msg"]
            assert "dev_reset_url" in data
            assert "/reset-password?token=" in data["dev_reset_url"]

            # Extract token
            token = data["dev_reset_url"].split("token=")[1]

            # 3. Test reset-password with invalid password complexity
            res_invalid_pw = await ac.post("/api/v1/auth/reset-password", json={"token": token, "new_password": "short"})
            assert res_invalid_pw.status_code == 400

            # 4. Test reset-password successfully
            res_reset = await ac.post("/api/v1/auth/reset-password", json={"token": token, "new_password": "NewSecretPassword123!"})
            assert res_reset.status_code == 200
            assert res_reset.json()["msg"] == "Password has been reset successfully"

            # 5. Token is now invalid/consumed
            res_reuse = await ac.post("/api/v1/auth/reset-password", json={"token": token, "new_password": "AnotherPassword123!"})
            assert res_reuse.status_code == 400
