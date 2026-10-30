from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.payment import Payment
from app.models.notification import Notification
from app.schemas.payment import OrderCreateRequest, OrderResponse, PaymentVerifyRequest, PaymentTransactionResponse
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
    payment = Payment(
        user_id=current_user.id,
        course_id=course.id,
        order_id=order_data["order_id"],
        amount=order_data["amount"],
        amount_paise=order_data["amount_paise"],
        currency=order_data["currency"],
        status="created",
        receipt=order_data["receipt"],
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
    Verify Razorpay payment signature and complete enrollment.
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

    # Find or update payment record
    payment = db.query(Payment).filter(Payment.order_id == request.razorpay_order_id).first()
    if payment:
        payment.payment_id = request.razorpay_payment_id
        payment.signature = request.razorpay_signature
        payment.status = "paid"
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
        message=f"Payment for '{course.title}' was confirmed (Txn: {request.razorpay_payment_id}). Happy learning!",
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
            "course_id": p.course_id,
            "course_title": p.course.title if p.course else "Course",
            "created_at": p.created_at,
        })
    return results
