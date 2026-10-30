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
    payment_method: Optional[str] = "card"  # "card", "upi", "netbanking", "wallet"
    bank_or_vpa: Optional[str] = None  # e.g., "HDFC Bank", "user@okhdfcbank", "Visa **** 4242"


class PaymentTransactionResponse(BaseModel):
    id: int
    order_id: str
    payment_id: Optional[str] = None
    amount: int
    currency: str
    status: str
    receipt: Optional[str] = None
    payment_method: Optional[str] = "card"
    bank_or_vpa: Optional[str] = None
    invoice_number: Optional[str] = None
    course_id: int
    course_title: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    invoice_number: str
    order_id: str
    payment_id: str
    course_id: int
    course_title: str
    student_name: str
    student_email: str
    amount: int
    tax_amount: int = 0
    total_amount: int
    currency: str = "INR"
    payment_method: str = "card"
    bank_or_vpa: Optional[str] = None
    status: str
    issued_at: datetime.datetime

