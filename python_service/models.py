from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class UserEntity(Base):
    __tablename__ = "users" # Confirmed via UserEntity.java

    id = Column(BigInteger, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    
    # Add other fields if necessary, but for now we only need these for Password Reset

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens" # Confirmed via PasswordResetToken.java

    id = Column(BigInteger, primary_key=True, index=True)
    token = Column(String, unique=True)
    expiry_date = Column(DateTime)
    used = Column(Boolean, default=False)
    
    user_id = Column(BigInteger, ForeignKey("users.id"))
    user = relationship("UserEntity")
