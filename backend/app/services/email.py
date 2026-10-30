import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger("studyhub.email")


def _get_base_html_template(title: str, content_html: str, action_url: Optional[str] = None, action_text: Optional[str] = None) -> str:
    """Generate a responsive and modern HTML email template for StudyHub."""
    action_button = ""
    if action_url and action_text:
        action_button = f"""
        <div style="margin: 28px 0; text-align: center;">
            <a href="{action_url}" style="background: linear-gradient(135deg, #4f46e5, #0ea5e9); color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: 700; border-radius: 8px; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
                {action_text} &rarr;
            </a>
        </div>
        """

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
        <tr>
            <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 8px 30px rgba(0,0,0,0.04);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 32px 30px; text-align: center;">
                            <div style="display: inline-block; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 6px 14px; margin-bottom: 12px;">
                                <span style="color: #38bdf8; font-weight: 800; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;">StudyHub Academic</span>
                            </div>
                            <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">Full-Stack Web Engineering</h1>
                        </td>
                    </tr>
                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 36px 30px;">
                            {content_html}
                            {action_button}
                            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0 20px 0;">
                            <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0;">
                                You received this notification as an enrolled member of StudyHub. If you have any academic inquiries, please reach out via your course discussion forum.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #f1f5f9;">
                            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                                &copy; 2026 StudyHub Platform. Academic & Industry Curriculum.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


def send_email_notification(to_email: str, subject: str, html_content: str, text_content: Optional[str] = None):
    """
    Send an email via configured SMTP server.
    If SMTP credentials are not configured or connection fails, logs simulated email safely.
    """
    if not to_email:
        return

    # Check if SMTP is configured
    if not settings.EMAILS_ENABLED or not settings.SMTP_USER:
        logger.info(
            f"[EMAIL DISPATCH - SIMULATED / LOGGED]\n"
            f"To: {to_email}\n"
            f"Subject: {subject}\n"
            f"From: {settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>\n"
            f"Status: Logged successfully (SMTP disabled in dev/test mode)"
        )
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        if text_content:
            msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
            logger.info(f"Email successfully delivered to {to_email}: {subject}")
    except Exception as exc:
        logger.warning(f"Could not send real email via SMTP to {to_email}: {exc}. Simulated fallback active.")


def send_welcome_email(to_email: str, full_name: str):
    """Welcome email dispatched on user registration."""
    subject = "🎓 Welcome to StudyHub Full-Stack Web Engineering!"
    catalog_url = f"{settings.FRONTEND_URL}/courses"
    html_body = f"""
    <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; font-weight: 700;">Welcome, {full_name}!</h2>
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
        Your StudyHub student account has been successfully initialized. You now have access to our curriculum covering FastAPI, React, PostgreSQL, Cloud DevOps, and System Design.
    </p>
    <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; color: #1e293b; font-size: 14px;">Next Steps:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.6;">
            <li>Browse the verified academic course catalog</li>
            <li>Enroll in your first course to access the page-by-page learning workspace</li>
            <li>Take module quizzes to earn progress badges</li>
        </ul>
    </div>
    """
    html = _get_base_html_template(
        title=subject,
        content_html=html_body,
        action_url=catalog_url,
        action_text="Explore Course Catalog"
    )
    send_email_notification(to_email, subject, html)


def send_enrollment_email(to_email: str, full_name: str, course_title: str, course_id: int, payment_info: Optional[Dict[str, Any]] = None):
    """Email sent upon successful course enrollment and payment."""
    subject = f"✅ Enrolled: {course_title}"
    workspace_url = f"{settings.FRONTEND_URL}/learn/{course_id}"

    payment_receipt_html = ""
    if payment_info:
        amount_inr = payment_info.get("amount", 0)
        order_id = payment_info.get("order_id", "N/A")
        payment_id = payment_info.get("payment_id", "Free Enrollment")
        payment_receipt_html = f"""
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0284c7; margin-bottom: 8px;">
                💳 Razorpay Payment Receipt
            </div>
            <table width="100%" style="font-size: 13px; color: #334155; line-height: 1.8;">
                <tr><td><strong>Amount Paid:</strong></td><td align="right">₹{amount_inr} INR</td></tr>
                <tr><td><strong>Payment ID:</strong></td><td align="right"><code>{payment_id}</code></td></tr>
                <tr><td><strong>Order ID:</strong></td><td align="right"><code>{order_id}</code></td></tr>
                <tr><td><strong>Status:</strong></td><td align="right"><span style="color: #10b981; font-weight: 700;">Captured / Confirmed</span></td></tr>
            </table>
        </div>
        """

    html_body = f"""
    <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; font-weight: 700;">Congratulations, {full_name}!</h2>
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
        You have successfully enrolled in <strong>{course_title}</strong>. Your curriculum, architectural roadmaps, structured lesson pages, and quizzes are now available.
    </p>
    {payment_receipt_html}
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
        Jump straight into your interactive learning workspace to start Section 0:
    </p>
    """
    html = _get_base_html_template(
        title=subject,
        content_html=html_body,
        action_url=workspace_url,
        action_text="Open Learning Workspace"
    )
    send_email_notification(to_email, subject, html)


def send_quiz_result_email(to_email: str, full_name: str, quiz_title: str, score: float, passed: bool, passing_score: int, course_id: int):
    """Email sent after a student submits a quiz attempt."""
    status_str = "Passed 🎉" if passed else "Needs Review"
    subject = f"📊 Quiz Result: {quiz_title} - {score}% ({status_str})"
    workspace_url = f"{settings.FRONTEND_URL}/learn/{course_id}"

    badge_color = "#10b981" if passed else "#f59e0b"
    badge_bg = "#ecfdf5" if passed else "#fffbeb"

    html_body = f"""
    <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; font-weight: 700;">Quiz Attempt Report</h2>
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
        Hello {full_name}, your submission for <strong>{quiz_title}</strong> has been graded:
    </p>
    <div style="background: {badge_bg}; border: 1px solid {badge_color}; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
        <div style="font-size: 32px; font-weight: 800; color: {badge_color};">{score}%</div>
        <div style="font-size: 14px; font-weight: 700; color: {badge_color}; margin-top: 4px;">{status_str}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 8px;">Minimum Required Passing Score: {passing_score}%</div>
    </div>
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
        {"Great job! Your passing result has been recorded towards your course completion certificate." if passed else "Don't worry! Review the structured lesson pages and attempt the quiz again to master the concepts."}
    </p>
    """
    html = _get_base_html_template(
        title=subject,
        content_html=html_body,
        action_url=workspace_url,
        action_text="Review Quiz & Lessons"
    )
    send_email_notification(to_email, subject, html)


def send_password_reset_email(to_email: str, full_name: str, reset_token: str):
    """Email sent when a user requests a password reset."""
    subject = "🔒 Reset Your StudyHub Password"
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    html_body = f"""
    <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; font-weight: 700;">Password Reset Request</h2>
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
        Hello {full_name}, we received a request to reset your StudyHub account password. Click the button below to choose a new password:
    </p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin: 20px 0; color: #991b1b; font-size: 13px;">
        ⏱️ This password reset link is cryptographically signed and will expire in <strong>15 minutes</strong>.
    </div>
    <p style="color: #64748b; font-size: 13px; line-height: 1.6;">
        If you did not request this password reset, you can safely ignore this email; your existing password remains unchanged.
    </p>
    """
    html = _get_base_html_template(
        title=subject,
        content_html=html_body,
        action_url=reset_url,
        action_text="Reset Password"
    )
    send_email_notification(to_email, subject, html)


def send_course_update_email(to_email: str, full_name: str, course_title: str, update_title: str, course_id: int):
    """Email sent when an instructor publishes a new lesson or curriculum update."""
    subject = f"🔔 Course Update: {course_title}"
    workspace_url = f"{settings.FRONTEND_URL}/learn/{course_id}"
    html_body = f"""
    <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; font-weight: 700;">New Material Added!</h2>
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
        Hello {full_name}, your instructor has published new learning material in <strong>{course_title}</strong>:
    </p>
    <div style="background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin: 20px 0; color: #0369a1;">
        <strong>📖 {update_title}</strong>
    </div>
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
        Log in to your learning workspace to review the new structured pages, specs, and exercises.
    </p>
    """
    html = _get_base_html_template(
        title=subject,
        content_html=html_body,
        action_url=workspace_url,
        action_text="View New Lesson"
    )
    send_email_notification(to_email, subject, html)


def send_discussion_reply_email(to_email: str, author_name: str, replier_name: str, thread_title: str, reply_snippet: str, course_id: int):
    """Email sent to thread author when a peer or instructor replies to their question."""
    subject = f"💬 New Reply on: {thread_title}"
    workspace_url = f"{settings.FRONTEND_URL}/learn/{course_id}"
    html_body = f"""
    <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; font-weight: 700;">New Response to Your Academic Query</h2>
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
        Hello {author_name}, <strong>{replier_name}</strong> has posted a response to your discussion thread:
    </p>
    <div style="background: #f8fafc; border-left: 4px solid #6366f1; border-radius: 4px; padding: 14px 18px; margin: 18px 0; color: #334155; font-size: 14px; font-style: italic;">
        "{reply_snippet}"
    </div>
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
        Join the conversation or mark the question as resolved in your course discussion forum:
    </p>
    """
    html = _get_base_html_template(
        title=subject,
        content_html=html_body,
        action_url=workspace_url,
        action_text="View Discussion Reply"
    )
    send_email_notification(to_email, subject, html)

