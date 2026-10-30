import pytest
from app.services.auth import create_password_reset_token
from app.services.payment import verify_payment_signature, generate_sandbox_signature


def test_payment_config(client):
    res = client.get("/api/v1/payments/config")
    assert res.status_code == 200
    data = res.json()
    assert "key_id" in data
    assert data["currency"] == "INR"
    assert data["enabled"] is True


def test_create_order_unauthorized(client):
    res = client.post("/api/v1/payments/create-order", json={"course_id": 1})
    assert res.status_code == 401


def test_create_order_authorized(client, student2_token):
    res = client.post(
        "/api/v1/payments/create-order",
        headers={"Authorization": f"Bearer {student2_token}"},
        json={"course_id": 5}
    )
    assert res.status_code == 200
    data = res.json()
    assert "order_id" in data
    assert data["amount"] == 999
    assert data["currency"] == "INR"
    assert data["course_id"] == 5


def test_verify_payment_invalid_signature(client, student2_token):
    res = client.post(
        "/api/v1/payments/verify",
        headers={"Authorization": f"Bearer {student2_token}"},
        json={
            "course_id": 5,
            "razorpay_order_id": "order_test_invalid",
            "razorpay_payment_id": "pay_test_invalid",
            "razorpay_signature": "invalid_signature_hex"
        }
    )
    assert res.status_code == 400
    assert "Invalid payment signature" in res.json()["detail"]


def test_verify_payment_success_and_transactions(client, student2_token):
    # Ensure clean enrollment state before test
    client.delete("/api/v1/enrollments/courses/3", headers={"Authorization": f"Bearer {student2_token}"})

    # Create valid order
    order_res = client.post(
        "/api/v1/payments/create-order",
        headers={"Authorization": f"Bearer {student2_token}"},
        json={"course_id": 3}
    )
    assert order_res.status_code == 200
    order_id = order_res.json()["order_id"]
    payment_id = "pay_test_mock_9999"
    sig = generate_sandbox_signature(order_id, payment_id)

    verify_res = client.post(
        "/api/v1/payments/verify",
        headers={"Authorization": f"Bearer {student2_token}"},
        json={
            "course_id": 3,
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": sig
        }
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["success"] is True

    # Check transactions endpoint
    tx_res = client.get(
        "/api/v1/payments/my-transactions",
        headers={"Authorization": f"Bearer {student2_token}"}
    )
    assert tx_res.status_code == 200
    txs = tx_res.json()
    assert len(txs) > 0
    matched = next(t for t in txs if t["order_id"] == order_id)
    assert matched is not None
    assert "invoice_number" in matched


def test_verify_payment_multimethod_and_invoice(client, student2_token):
    # Test UPI payment verification
    client.delete("/api/v1/enrollments/courses/4", headers={"Authorization": f"Bearer {student2_token}"})

    order_res = client.post(
        "/api/v1/payments/create-order",
        headers={"Authorization": f"Bearer {student2_token}"},
        json={"course_id": 4}
    )
    assert order_res.status_code == 200
    order_id = order_res.json()["order_id"]
    payment_id = "pay_upi_test_8888"
    sig = generate_sandbox_signature(order_id, payment_id)

    verify_res = client.post(
        "/api/v1/payments/verify",
        headers={"Authorization": f"Bearer {student2_token}"},
        json={
            "course_id": 4,
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": sig,
            "payment_method": "upi",
            "bank_or_vpa": "student@okhdfcbank"
        }
    )
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert data["payment_method"] == "upi"
    assert data["bank_or_vpa"] == "student@okhdfcbank"
    assert "invoice_number" in data
    inv_num = data["invoice_number"]

    # Test Invoice Retrieval via invoice_number
    inv_res = client.get(
        f"/api/v1/payments/invoice/{inv_num}",
        headers={"Authorization": f"Bearer {student2_token}"}
    )
    assert inv_res.status_code == 200
    inv = inv_res.json()
    assert inv["invoice_number"] == inv_num
    assert inv["payment_method"] == "upi"
    assert inv["bank_or_vpa"] == "student@okhdfcbank"
    assert inv["amount"] > 0
    assert inv["status"] == "paid"

    # Test Invoice Retrieval via payment_id
    inv_by_pay = client.get(
        f"/api/v1/payments/invoice/{payment_id}",
        headers={"Authorization": f"Bearer {student2_token}"}
    )
    assert inv_by_pay.status_code == 200
    assert inv_by_pay.json()["invoice_number"] == inv_num


def test_jwt_refresh_flow(client):
    # 1. Login to get tokens
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student@studyhub.edu",
        "password": "Student@123"
    })
    assert login_res.status_code == 200
    tokens = login_res.json()
    refresh_tok = tokens["refresh_token"]
    assert refresh_tok is not None

    # 2. Refresh token
    refresh_res = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_tok
    })
    assert refresh_res.status_code == 200
    new_tokens = refresh_res.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens


def test_password_reset_flow(client):
    # 1. Request forgot password
    forgot_res = client.post("/api/v1/auth/forgot-password", json={
        "email": "student@studyhub.edu"
    })
    assert forgot_res.status_code == 200

    # 2. Generate valid reset token
    reset_tok = create_password_reset_token(user_id=4, email="student@studyhub.edu")

    # 3. Reset password
    reset_res = client.post("/api/v1/auth/reset-password", json={
        "token": reset_tok,
        "new_password": "StudentNewPass@123"
    })
    assert reset_res.status_code == 200

    # 4. Login with new password
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student@studyhub.edu",
        "password": "StudentNewPass@123"
    })
    assert login_res.status_code == 200

    # 5. Restore original password for consistency
    restore_tok = create_password_reset_token(user_id=4, email="student@studyhub.edu")
    client.post("/api/v1/auth/reset-password", json={
        "token": restore_tok,
        "new_password": "Student@123"
    })
