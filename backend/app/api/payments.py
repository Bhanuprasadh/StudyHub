import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.payment import Payment
from app.models.notification import Notification
from app.schemas.payment import (
    OrderCreateRequest,
    OrderResponse,
    PaymentVerifyRequest,
    PaymentTransactionResponse,
    InvoiceResponse,
)
from app.services.payment import create_order, verify_payment_signature
from app.services.email import send_enrollment_email
from app.api.deps import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/config")
def get_payment_config():
    """Return public Razorpay configuration for frontend checkout."""
    return {
        "key_id": settings.RAZORPAY_KEY_ID,
        "currency": "INR",
        "enabled": settings.RAZORPAY_ENABLED,
    }


@router.post("/create-order", response_model=OrderResponse)
def create_payment_order(
    request: OrderCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Initialize a payment order for course enrollment with Razorpay.
    """
    course = db.query(Course).filter(Course.id == request.course_id, Course.status == "published").first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or not currently published")

    # Check if already enrolled
    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == course.id,
        Enrollment.user_id == current_user.id
    ).first()
    if existing_enrollment:
        raise HTTPException(status_code=400, detail="You are already enrolled in this course")

    # Determine amount (default to 499 INR if course price not set)
    course_price = course.price if (course.price is not None and course.price > 0) else 499

    # Generate order
    order_data = create_order(
        amount_inr=course_price,
        course_id=course.id,
        user_id=current_user.id
    )

    # Save payment record to database in 'created' state
    inv_num = f"INV-{datetime.datetime.now().year}-{uuid.uuid4().hex[:8].upper()}"
    payment = Payment(
        user_id=current_user.id,
        course_id=course.id,
        order_id=order_data["order_id"],
        amount=order_data["amount"],
        amount_paise=order_data["amount_paise"],
        currency=order_data["currency"],
        status="created",
        receipt=order_data["receipt"],
        invoice_number=inv_num,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "order_id": order_data["order_id"],
        "amount": order_data["amount"],
        "amount_paise": order_data["amount_paise"],
        "currency": order_data["currency"],
        "key_id": settings.RAZORPAY_KEY_ID,
        "receipt": order_data["receipt"],
        "course_id": course.id,
        "course_title": course.title,
    }


@router.post("/verify")
def verify_payment(
    request: PaymentVerifyRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verify Razorpay payment signature, record payment method & bank details, and complete enrollment.
    """
    course = db.query(Course).filter(Course.id == request.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Verify cryptographic signature
    is_valid = verify_payment_signature(
        order_id=request.razorpay_order_id,
        payment_id=request.razorpay_payment_id,
        signature=request.razorpay_signature
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid payment signature. Verification failed.")

    payment_method = request.payment_method or "card"
    bank_or_vpa = request.bank_or_vpa
    inv_num = f"INV-{datetime.datetime.now().year}-{uuid.uuid4().hex[:8].upper()}"

    # Find or update payment record
    payment = db.query(Payment).filter(Payment.order_id == request.razorpay_order_id).first()
    if payment:
        payment.payment_id = request.razorpay_payment_id
        payment.signature = request.razorpay_signature
        payment.status = "paid"
        payment.payment_method = payment_method
        payment.bank_or_vpa = bank_or_vpa
        if not payment.invoice_number:
            payment.invoice_number = inv_num
    else:
        payment = Payment(
            user_id=current_user.id,
            course_id=course.id,
            order_id=request.razorpay_order_id,
            payment_id=request.razorpay_payment_id,
            signature=request.razorpay_signature,
            amount=course.price or 499,
            amount_paise=(course.price or 499) * 100,
            currency="INR",
            status="paid",
            receipt=f"rcpt_{request.razorpay_payment_id}",
            payment_method=payment_method,
            bank_or_vpa=bank_or_vpa,
            invoice_number=inv_num,
        )
        db.add(payment)

    # Create enrollment if not already exists
    enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == course.id,
        Enrollment.user_id == current_user.id
    ).first()

    if not enrollment:
        enrollment = Enrollment(
            user_id=current_user.id,
            course_id=course.id,
            status="active"
        )
        db.add(enrollment)

    # In-app notification
    notif = Notification(
        user_id=current_user.id,
        title="Payment & Enrollment Confirmed",
        message=f"Payment for '{course.title}' was confirmed via {payment_method.upper()} (Txn: {request.razorpay_payment_id}). Happy learning!",
    )
    db.add(notif)
    db.commit()
    db.refresh(enrollment)
    if payment:
        db.refresh(payment)

    # Dispatch email notification in background
    payment_info = {
        "amount": payment.amount if payment else (course.price or 499),
        "order_id": request.razorpay_order_id,
        "payment_id": request.razorpay_payment_id,
        "payment_method": payment.payment_method,
        "bank_or_vpa": payment.bank_or_vpa,
        "invoice_number": payment.invoice_number or f"INV-2026-{payment.id:04d}",
    }
    background_tasks.add_task(
        send_enrollment_email,
        to_email=current_user.email,
        full_name=current_user.full_name,
        course_title=course.title,
        course_id=course.id,
        payment_info=payment_info
    )

    return {
        "success": True,
        "message": "Payment verified and enrollment successfully created",
        "enrollment_id": enrollment.id,
        "course_id": course.id,
        "payment_id": request.razorpay_payment_id,
        "order_id": request.razorpay_order_id,
        "amount": payment.amount,
        "payment_method": payment.payment_method,
        "bank_or_vpa": payment.bank_or_vpa,
        "invoice_number": payment.invoice_number,
    }


@router.get("/my-transactions", response_model=List[PaymentTransactionResponse])
def get_my_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch payment and transaction receipt history for the authenticated user."""
    payments = db.query(Payment).filter(
        Payment.user_id == current_user.id
    ).order_by(Payment.created_at.desc()).all()

    results = []
    for p in payments:
        results.append({
            "id": p.id,
            "order_id": p.order_id,
            "payment_id": p.payment_id,
            "amount": p.amount,
            "currency": p.currency,
            "status": p.status,
            "receipt": p.receipt,
            "payment_method": p.payment_method or "card",
            "bank_or_vpa": p.bank_or_vpa,
            "invoice_number": p.invoice_number or f"INV-2026-{p.id:04d}",
            "course_id": p.course_id,
            "course_title": p.course.title if p.course else "Course",
            "created_at": p.created_at,
        })
    return results


@router.get("/invoice/{invoice_or_payment_id}", response_model=InvoiceResponse)
def get_payment_invoice(
    invoice_or_payment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve full official tax invoice details for a verified payment."""
    conditions = [
        Payment.invoice_number == invoice_or_payment_id,
        Payment.payment_id == invoice_or_payment_id,
        Payment.order_id == invoice_or_payment_id
    ]
    if invoice_or_payment_id.isdigit():
        conditions.append(Payment.id == int(invoice_or_payment_id))
    payment = db.query(Payment).filter(or_(*conditions)).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Invoice or payment transaction not found")

    if current_user.role != "admin" and payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this invoice")

    inv_num = payment.invoice_number or f"INV-2026-{payment.id:04d}"
    return {
        "invoice_number": inv_num,
        "order_id": payment.order_id,
        "payment_id": payment.payment_id or "N/A",
        "course_id": payment.course_id,
        "course_title": payment.course.title if payment.course else "Academic Course",
        "student_name": payment.user.full_name if payment.user else current_user.full_name,
        "student_email": payment.user.email if payment.user else current_user.email,
        "amount": payment.amount,
        "tax_amount": 0,
        "total_amount": payment.amount,
        "currency": payment.currency,
        "payment_method": payment.payment_method or "card",
        "bank_or_vpa": payment.bank_or_vpa,
        "status": payment.status,
        "issued_at": payment.created_at,
    }

