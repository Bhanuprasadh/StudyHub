import datetime
from pydantic import BaseModel
from typing import Optional


class OrderCreateRequest(BaseModel):
    course_id: int


class OrderResponse(BaseModel):
    order_id: str
    amount: int  # In INR
    amount_paise: int
    currency: str
    key_id: str
    receipt: str
    course_id: int
    course_title: str


class PaymentVerifyRequest(BaseModel):
    course_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentTransactionResponse(BaseModel):
    id: int
    order_id: str
    payment_id: Optional[str] = None
    amount: int
    currency: str
    status: str
    receipt: Optional[str] = None
    course_id: int
    course_title: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True
