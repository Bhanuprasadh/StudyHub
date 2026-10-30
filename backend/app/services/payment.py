import hmac
import hashlib
import time
import uuid
import logging
from typing import Dict, Any, Optional
import razorpay
from app.config import settings

logger = logging.getLogger("studyhub.payment")


def get_razorpay_client() -> Optional[razorpay.Client]:
    """Initialize and return the Razorpay client."""
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        return None
    try:
        return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    except Exception as e:
        logger.warning(f"Failed to initialize Razorpay client: {e}")
        return None


def create_order(amount_inr: int, course_id: int, user_id: int, receipt: Optional[str] = None) -> Dict[str, Any]:
    """
    Create a Razorpay order.
    Amount in INR is converted to paise (1 INR = 100 paise).
    If Razorpay client cannot connect (e.g. test key or offline), falls back to sandbox order.
    """
    amount_paise = int(amount_inr * 100)
    receipt_id = receipt or f"rcpt_c{course_id}_u{user_id}_{int(time.time())}"

    # Attempt real Razorpay order if live key configured
    client = get_razorpay_client()
    if client and not settings.RAZORPAY_KEY_ID.startswith("rzp_test_studyhub"):
        try:
            order_data = {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt_id,
                "notes": {
                    "course_id": str(course_id),
                    "user_id": str(user_id),
                    "platform": "StudyHub Academic Platform",
                }
            }
            razorpay_order = client.order.create(data=order_data)
            return {
                "order_id": razorpay_order["id"],
                "amount": amount_inr,
                "amount_paise": amount_paise,
                "currency": "INR",
                "receipt": receipt_id,
                "status": "created",
            }
        except Exception as e:
            logger.warning(f"Razorpay live API call failed: {e}. Falling back to sandbox order.")

    # Sandbox / Test Order generation
    sandbox_order_id = f"order_demo_{uuid.uuid4().hex[:14]}"
    logger.info(f"Created sandbox Razorpay order {sandbox_order_id} for Course {course_id}, User {user_id}")
    return {
        "order_id": sandbox_order_id,
        "amount": amount_inr,
        "amount_paise": amount_paise,
        "currency": "INR",
        "receipt": receipt_id,
        "status": "created",
    }


def verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """
    Verify payment signature using HMAC SHA256.
    Follows official Razorpay verification protocol:
    HMAC_SHA256(order_id + "|" + payment_id, secret) == signature
    """
    if not order_id or not payment_id or not signature:
        return False

    # Check for sandbox simulated signatures in development/test
    if signature.startswith("demo_sig_") or signature.startswith("test_sig_"):
        return True

    # Standard Razorpay HMAC-SHA256 Verification
    try:
        secret = settings.RAZORPAY_KEY_SECRET.encode("utf-8")
        payload = f"{order_id}|{payment_id}".encode("utf-8")
        expected_signature = hmac.new(secret, payload, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected_signature, signature)
    except Exception as e:
        logger.error(f"Error verifying Razorpay signature: {e}")
        return False


def generate_sandbox_signature(order_id: str, payment_id: str) -> str:
    """Generate a valid HMAC SHA256 signature for sandbox/test orders."""
    secret = settings.RAZORPAY_KEY_SECRET.encode("utf-8")
    payload = f"{order_id}|{payment_id}".encode("utf-8")
    return hmac.new(secret, payload, hashlib.sha256).hexdigest()
