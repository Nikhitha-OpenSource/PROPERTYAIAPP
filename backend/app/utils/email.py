import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

def send_verification_email(to_email: str, code: str) -> bool:
    """
    Sends a 6-digit verification code to the user's email during registration.
    """
    sender_email = getattr(settings, "SMTP_EMAIL", "no-reply@propiq.ai")
    sender_password = getattr(settings, "SMTP_PASSWORD", "")
    smtp_host = getattr(settings, "SMTP_HOST", "smtp.gmail.com")
    smtp_port = getattr(settings, "SMTP_PORT", 587)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your PROPIQ AI Verification Code"
    msg["From"] = sender_email
    msg["To"] = to_email

    html = f"""
    <html>
      <body>
        <h2>Welcome to PROPIQ AI!</h2>
        <p>Your authentication code for registration is: <strong style="font-size: 1.2em;">{code}</strong></p>
        <p>Please enter this code in the app to complete your registration.</p>
      </body>
    </html>
    """
    msg.attach(MIMEText(html, "html"))

    # If SMTP isn't configured in .env, mock the email sending (useful for dev)
    if not sender_password:
        print(f"\n[Email Mock] Verification code for {to_email} is {code}\n")
        return True

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[Email Error] Failed to send email: {e}")
        return False