import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(String(100), unique=True, nullable=False, index=True)
    payment_id = Column(String(100), nullable=True, index=True)
    signature = Column(String(255), nullable=True)
    amount = Column(Integer, nullable=False)  # in INR
    amount_paise = Column(Integer, nullable=False)  # in paise (amount * 100)
    currency = Column(String(10), default="INR", nullable=False)
    status = Column(String(50), default="created", nullable=False, index=True)  # created, paid, failed, refunded
    receipt = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", backref="payments")
    course = relationship("Course", backref="payments")

    __table_args__ = (
        Index("idx_payments_user_course", "user_id", "course_id"),
    )
