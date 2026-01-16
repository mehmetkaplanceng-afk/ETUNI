from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import uuid

from database import get_db
from models import UserEntity, PasswordResetToken
from schemas import ForgotPasswordRequest, SimpleEmailRequest, EmailSchema
from email_service import send_email

app = FastAPI(title="ETUNI Python Service")

@app.post("/email/send")
async def send_generic_email(req: SimpleEmailRequest, background_tasks: BackgroundTasks):
    email_data = EmailSchema(
        email=[req.to],
        subject=req.subject,
        body=req.body,
        is_html=req.is_html
    )
    background_tasks.add_task(send_email, email_data)
    return {"message": "Email sent to background task"}

@app.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    # 1. Find User
    result = await db.execute(select(UserEntity).where(UserEntity.email == req.email))
    user = result.scalars().first()
    
    if not user:
        # Silently fail
        return {"message": "If user exists, email sent."}
    
    # 2. Check existing token
    result = await db.execute(select(PasswordResetToken).where(PasswordResetToken.user_id == user.id))
    existing_token = result.scalars().first()
    
    token_str = str(uuid.uuid4())
    expiry = datetime.now() + timedelta(minutes=30)
    
    if existing_token:
        existing_token.token = token_str
        existing_token.expiry_date = expiry
        existing_token.used = False
    else:
        new_token = PasswordResetToken(
            token=token_str,
            user_id=user.id,
            expiry_date=expiry,
            used=False
        )
        db.add(new_token)
    
    await db.commit()
    
    # 3. Send Email
    reset_url = f"http://13.53.170.220:8080/reset-password?token={token_str}" # Hardcoded for now, should be env
    
    html_content = f"""
    <html>
        <body>
            <h3>Merhaba {user.full_name},</h3>
            <p>Hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
            <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
            <p><a href="{reset_url}">Şifremi Sıfırla</a></p>
            <p>Bu bağlantı 30 dakika süreyle geçerlidir.</p>
            <p>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
            <br/>
            <p>ETUNI Ekibi</p>
        </body>
    </html>
    """
    
    email_data = EmailSchema(
        email=[user.email],
        subject="Şifre Sıfırlama İsteği - ETUNI",
        body=html_content,
        is_html=True
    )
    
    background_tasks.add_task(send_email, email_data)
    
    return {"message": "If user exists, email sent."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
