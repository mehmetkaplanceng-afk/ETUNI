from pydantic import BaseModel, EmailStr
from typing import Optional, List

class EmailSchema(BaseModel):
    email: List[EmailStr]
    body: str
    subject: str
    is_html: bool = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class SimpleEmailRequest(BaseModel):
    to: EmailStr
    subject: str
    body: str # Can be HTML or Text
    is_html: bool = True
