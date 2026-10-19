"""
Diagnostic script to test SMTP / Gmail configuration for LabPilotAI.
Usage:
    cd backend
    python test_smtp.py recipient@example.com
"""
import os
import smtplib
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env
backend_env = Path(__file__).resolve().parent / ".env"
load_dotenv(backend_env, override=True)

def main():
    to_email = sys.argv[1] if len(sys.argv) > 1 else None

    smtp_host = os.getenv("SMTP_HOST") or os.getenv("MAIL_SERVER")
    smtp_port_raw = os.getenv("SMTP_PORT") or os.getenv("MAIL_PORT") or "587"
    smtp_user = os.getenv("SMTP_USER") or os.getenv("MAIL_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD") or os.getenv("MAIL_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM") or os.getenv("MAIL_FROM") or smtp_user
    use_tls = os.getenv("SMTP_TLS", "true").lower() in ("true", "1", "yes")

    print("\n" + "=" * 70)
    print(" LabPilotAI SMTP Email Diagnostic Tool")
    print("=" * 70)
    print(f"Loaded config from: {backend_env}")
    print(f"SMTP_HOST:     {smtp_host or '[NOT SET]'}")
    print(f"SMTP_PORT:     {smtp_port_raw}")
    print(f"SMTP_USER:     {smtp_user or '[NOT SET]'}")
    print(f"SMTP_PASSWORD: {'*' * len(smtp_password) if smtp_password else '[NOT SET]'}")
    print(f"SMTP_FROM:     {smtp_from or '[NOT SET]'}")
    print(f"SMTP_TLS:      {use_tls}")
    print("=" * 70)

    if not smtp_host or not smtp_user or not smtp_password:
        print("\n[ERROR] SMTP credentials are not configured in backend/.env!")
        print("\nTo fix this:")
        print("1. Open backend/.env")
        print("2. Uncomment the following lines (remove the leading #):")
        print("   SMTP_HOST=smtp.gmail.com")
        print("   SMTP_PORT=587")
        print("   SMTP_USER=your_email@gmail.com")
        print("   SMTP_PASSWORD=your_16_character_app_password")
        print("   SMTP_FROM=your_email@gmail.com")
        print("   SMTP_TLS=true")
        print("\nNote for Gmail:")
        print("- You CANNOT use your normal Google account password.")
        print("- Go to https://myaccount.google.com/security -> 2-Step Verification.")
        print("- Go to https://myaccount.google.com/apppasswords to generate a 16-character App Password.")
        print("=" * 70 + "\n")
        sys.exit(1)

    if not to_email:
        to_email = smtp_user
        print(f"\nNo recipient specified. Sending test email to sender: {to_email}")

    print(f"\nAttempting to connect to {smtp_host}:{smtp_port_raw}...")

    try:
        smtp_port = int(smtp_port_raw)
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "LabPilotAI - SMTP Test Email"
        msg["From"] = f"LabPilotAI <{smtp_from}>"
        msg["To"] = to_email

        body_text = "Congratulations! Your LabPilotAI SMTP email configuration is working perfectly."
        body_html = """
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #10b981; border-radius: 8px;">
            <h2 style="color: #10b981;">SMTP Connection Successful!</h2>
            <p>Your LabPilotAI password reset emails are now configured and working properly.</p>
        </div>
        """
        msg.attach(MIMEText(body_text, "plain"))
        msg.attach(MIMEText(body_html, "html"))

        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15) as server:
                server.ehlo()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                server.ehlo()
                if use_tls:
                    server.starttls()
                    server.ehlo()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)

        print("\n[SUCCESS] Test email sent successfully to " + to_email)
        print("Please check your inbox (and Spam/Junk folder)!")
        print("=" * 70 + "\n")

    except smtplib.SMTPAuthenticationError as auth_err:
        print(f"\n[AUTHENTICATION ERROR] {auth_err}")
        print("\nGmail rejected the username or password.")
        print("Reminders:")
        print("1. Did you use your regular Google account password? That will FAIL.")
        print("2. You must create an App Password at: https://myaccount.google.com/apppasswords")
        print("3. Ensure 2-Step Verification is turned on for your Google Account.")
        print("=" * 70 + "\n")
        sys.exit(1)
    except Exception as exc:
        print(f"\n[CONNECTION ERROR] {exc}")
        print("=" * 70 + "\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
