import os
from typing import Optional

import httpx

from app.config import settings


class EmailService:
    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.RESEND_FROM_EMAIL
        self.from_name = settings.RESEND_FROM_NAME
        self.base_url = "https://api.resend.com"

    async def send_email(
        self,
        to: str,
        subject: str,
        html: str,
        text: Optional[str] = None,
    ) -> bool:
        if not self.api_key:
            print(f"[EMAIL SKIPPED] To: {to}, Subject: {subject}")
            return True

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    f"{self.base_url}/emails",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": f"{self.from_name} <{self.from_email}>",
                        "to": [to],
                        "subject": subject,
                        "html": html,
                        "text": text,
                    },
                )
                response.raise_for_status()
                return True
        except Exception as exc:
            print(f"[EMAIL ERROR] {exc}")
            return False

    async def send_verification_email(self, to: str, token: str, name: Optional[str] = None) -> bool:
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><style>
          body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 0; }}
          .container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
          .header {{ background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; padding: 40px 30px; text-align: center; }}
          .header h1 {{ margin: 0; font-size: 28px; }}
          .header .logo {{ font-weight: 800; font-size: 32px; letter-spacing: -1px; }}
          .header .logo span {{ color: #06b6d4; }}
          .content {{ padding: 40px 30px; text-align: center; }}
          .content h2 {{ color: #0f172a; font-size: 24px; margin-bottom: 16px; }}
          .content p {{ color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 32px; }}
          .btn {{ display: inline-block; background: #06b6d4; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; }}
          .footer {{ padding: 30px; text-align: center; color: #94a3b8; font-size: 14px; border-top: 1px solid #f1f5f9; }}
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">DELETE<span style="color:#06b6d4">API</span></div>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Welcome to DELETE, {name or 'there'}!</p>
              <p>Please verify your email address to activate your account and start using our download APIs.</p>
              <a href="{verify_url}" class="btn">Verify Email</a>
            </div>
            <div class="footer">
              <p>&copy; 2026 DELETE API Platform. All rights reserved.</p>
              <p>If you didn't sign up for DELETE, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
        """
        return await self.send_email(to, "Verify Your DELETE Account", html)

    async def send_welcome_email(self, to: str, name: Optional[str] = None) -> bool:
        html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><style>
          body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 0; }}
          .container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
          .header {{ background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; padding: 40px 30px; text-align: center; }}
          .header h1 {{ margin: 0; font-size: 28px; }}
          .header .logo {{ font-weight: 800; font-size: 32px; letter-spacing: -1px; }}
          .header .logo span {{ color: #06b6d4; }}
          .content {{ padding: 40px 30px; text-align: center; }}
          .content h2 {{ color: #0f172a; font-size: 24px; margin-bottom: 16px; }}
          .content p {{ color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 32px; }}
          .btn {{ display: inline-block; background: #06b6d4; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; }}
          .footer {{ padding: 30px; text-align: center; color: #94a3b8; font-size: 14px; border-top: 1px solid #f1f5f9; }}
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">DELETE<span style="color:#06b6d4">API</span></div>
            </div>
            <div class="content">
              <h2>Welcome to DELETE!</h2>
              <p>Your account is now active, {name or 'there'}!</p>
              <p>Start building with our download APIs for YouTube, Instagram, Facebook, and TikTok.</p>
              <a href="{settings.FRONTEND_URL}/dashboard" class="btn">Go to Dashboard</a>
            </div>
            <div class="footer">
              <p>&copy; 2026 DELETE API Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
        """
        return await self.send_email(to, "Welcome to DELETE API Platform", html)

    async def send_password_reset_email(self, to: str, code: str, name: Optional[str] = None) -> bool:
        reset_code = code
        html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><style>
          body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 0; }}
          .container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
          .header {{ background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; padding: 40px 30px; text-align: center; }}
          .header h1 {{ margin: 0; font-size: 28px; }}
          .header .logo {{ font-weight: 800; font-size: 32px; letter-spacing: -1px; }}
          .header .logo span {{ color: #06b6d4; }}
          .content {{ padding: 40px 30px; text-align: center; }}
          .content h2 {{ color: #0f172a; font-size: 24px; margin-bottom: 16px; }}
          .content p {{ color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 32px; }}
          .btn {{ display: inline-block; background: #06b6d4; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; }}
          .footer {{ padding: 30px; text-align: center; color: #94a3b8; font-size: 14px; border-top: 1px solid #f1f5f9; }}
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">DELETE<span style="color:#06b6d4">API</span></div>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>Hello, {name or 'there'}!</p>
              <p>We received a request to reset your password for your DELETE account.</p>
              <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f172a; margin: 24px 0;">{reset_code}</div>
              <p style="margin-top: 24px; font-size: 14px; color: #94a3b8;">This code will expire in 10 minutes.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 DELETE API Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
        """
        return await self.send_email(to, "Reset Your DELETE Password", html)

    async def send_quota_warning_email(self, to: str, used: int, limit: int, name: Optional[str] = None) -> bool:
        html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><style>
          body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 0; }}
          .container {{ max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
          .header {{ background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; padding: 40px 30px; text-align: center; }}
          .header h1 {{ margin: 0; font-size: 28px; }}
          .header .logo {{ font-weight: 800; font-size: 32px; letter-spacing: -1px; }}
          .header .logo span {{ color: #06b6d4; }}
          .content {{ padding: 40px 30px; text-align: center; }}
          .content h2 {{ color: #0f172a; font-size: 24px; margin-bottom: 16px; }}
          .content p {{ color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 32px; }}
          .btn {{ display: inline-block; background: #06b6d4; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; }}
          .footer {{ padding: 30px; text-align: center; color: #94a3b8; font-size: 14px; border-top: 1px solid #f1f5f9; }}
        </style></head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">DELETE<span style="color:#06b6d4">API</span></div>
            </div>
            <div class="content">
              <h2>API Quota Warning</h2>
              <p>Hello, {name or 'there'}!</p>
              <p>You've used {used} out of {limit} monthly requests. Your quota is running low.</p>
              <a href="{settings.FRONTEND_URL}/pricing" class="btn">Upgrade Plan</a>
            </div>
            <div class="footer">
              <p>&copy; 2026 DELETE API Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
        """
        return await self.send_email(to, "API Quota Warning - DELETE", html)


email_service = EmailService()
