import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import {
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  ShieldCheck,
  Lock,
  X,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';

const TOP_BANKS = [
  { id: 'HDFC', name: 'HDFC Bank', code: 'HDFC', color: '#004c8f' },
  { id: 'ICICI', name: 'ICICI Bank', code: 'ICIC', color: '#c2410c' },
  { id: 'SBI', name: 'State Bank of India', code: 'SBIN', color: '#0284c7' },
  { id: 'AXIS', name: 'Axis Bank', code: 'UTIB', color: '#9d174d' },
  { id: 'KOTAK', name: 'Kotak Mahindra', code: 'KKBK', color: '#dc2626' },
  { id: 'PNB', name: 'Punjab National Bank', code: 'PUNB', color: '#b91c1c' },
];

const ALL_BANKS = [
  'HDFC Bank',
  'ICICI Bank',
  'State Bank of India (SBI)',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank (PNB)',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'IndusInd Bank',
  'Federal Bank',
  'IDFC First Bank',
  'Yes Bank',
  'Indian Bank',
  'Central Bank of India',
  'Bank of India',
  'RBL Bank',
  'AU Small Finance Bank',
  'South Indian Bank',
  'Karur Vysya Bank',
  'Saraswat Cooperative Bank',
  'Standard Chartered Bank India',
];

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', handle: '@okaxis' },
  { id: 'phonepe', name: 'PhonePe', handle: '@ybl' },
  { id: 'paytm', name: 'Paytm UPI', handle: '@paytm' },
  { id: 'bhim', name: 'BHIM UPI', handle: '@upi' },
  { id: 'cred', name: 'CRED', handle: '@axisbank' },
];

const WALLETS = [
  { id: 'paytm', name: 'Paytm Wallet', balance: '₹4,250.00' },
  { id: 'phonepe', name: 'PhonePe Wallet', balance: '₹1,500.00' },
  { id: 'amazon', name: 'Amazon Pay Balance', balance: '₹890.00' },
  { id: 'mobikwik', name: 'MobiKwik Wallet', balance: '₹620.00' },
];

const PaymentModal = ({
  isOpen,
  onClose,
  course,
  orderData,
  user,
  onSuccess,
  onError,
}) => {
  if (!isOpen || !course || !orderData) return null;

  const [activeTab, setActiveTab] = useState('card'); // 'card' | 'upi' | 'netbanking' | 'wallet'
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState('select'); // 'select' | 'otp' | 'success'
  const [errorMsg, setErrorMsg] = useState('');

  // Card form state
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardHolder, setCardHolder] = useState(user?.full_name || 'Academic Scholar');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  // UPI state
  const [upiMode, setUpiMode] = useState('qr'); // 'qr' | 'id'
  const [upiId, setUpiId] = useState(user?.email ? `${user.email.split('@')[0]}@okhdfcbank` : 'student@okhdfcbank');

  // Netbanking state
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [otherBank, setOtherBank] = useState('');

  // Wallet state
  const [selectedWallet, setSelectedWallet] = useState('paytm');

  // OTP state
  const [otp, setOtp] = useState('123456');
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const detectCardBrand = (num) => {
    const clean = num.replace(/\s+/g, '');
    if (/^4/.test(clean)) return 'Visa';
    if (/^5[1-5]/.test(clean)) return 'Mastercard';
    if (/^(60|65|81|82)/.test(clean)) return 'RuPay';
    if (/^3[47]/.test(clean)) return 'Amex';
    return 'Credit / Debit';
  };

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const setTestCard = (brand) => {
    if (brand === 'visa') {
      setCardNumber('4242 4242 4242 4242');
      setCardExpiry('12/28');
      setCardCvv('123');
    } else if (brand === 'mastercard') {
      setCardNumber('5123 4567 8901 2345');
      setCardExpiry('08/29');
      setCardCvv('456');
    } else if (brand === 'rupay') {
      setCardNumber('6071 2345 6789 0123');
      setCardExpiry('11/27');
      setCardCvv('789');
    }
  };

  const handleInitiatePayment = () => {
    setErrorMsg('');
    if (activeTab === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setErrorMsg('Please enter a valid 16-digit card number.');
        return;
      }
      if (cardExpiry.length < 5) {
        setErrorMsg('Please enter a valid MM/YY expiry date.');
        return;
      }
      if (cardCvv.length < 3) {
        setErrorMsg('Please enter a valid 3-digit CVV.');
        return;
      }
      // Proceed to bank 3D-Secure OTP
      setCountdown(60);
      setStep('otp');
    } else if (activeTab === 'upi') {
      if (upiMode === 'id' && (!upiId || !upiId.includes('@'))) {
        setErrorMsg('Please enter a valid UPI VPA handle (e.g. name@okhdfcbank).');
        return;
      }
      // UPI can authorize directly or via QR approval simulation
      finalizeTransaction();
    } else if (activeTab === 'netbanking') {
      const bankName = otherBank || TOP_BANKS.find((b) => b.id === selectedBank)?.name || selectedBank;
      if (!bankName) {
        setErrorMsg('Please select your banking institution.');
        return;
      }
      setCountdown(60);
      setStep('otp');
    } else if (activeTab === 'wallet') {
      finalizeTransaction();
    }
  };

  const finalizeTransaction = async () => {
    setProcessing(true);
    setErrorMsg('');

    try {
      const mockPaymentId = `pay_${activeTab}_${Date.now().toString().slice(-8)}`;
      const mockSignature = `demo_sig_${Date.now()}`;

      let bankOrVpa = '';
      if (activeTab === 'card') {
        const brand = detectCardBrand(cardNumber);
        const last4 = cardNumber.replace(/\s/g, '').slice(-4) || '4242';
        bankOrVpa = `${brand} ending in ${last4}`;
      } else if (activeTab === 'upi') {
        bankOrVpa = upiMode === 'qr' ? 'UPI QR Dynamic Scan' : upiId;
      } else if (activeTab === 'netbanking') {
        bankOrVpa = otherBank || TOP_BANKS.find((b) => b.id === selectedBank)?.name || selectedBank;
      } else if (activeTab === 'wallet') {
        const w = WALLETS.find((item) => item.id === selectedWallet);
        bankOrVpa = w?.name || 'Digital Wallet';
      }

      const verifyRes = await apiClient.post('/payments/verify', {
        course_id: course.id,
        razorpay_order_id: orderData.order_id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
        payment_method: activeTab,
        bank_or_vpa: bankOrVpa,
      });

      setProcessing(false);
      onSuccess(verifyRes.data);
      onClose();
    } catch (err) {
      console.error('Payment confirmation error:', err);
      setProcessing(false);
      const msg = err.response?.data?.detail || 'Payment verification failed';
      setErrorMsg(msg);
      if (onError) onError(msg);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
          border: '1px solid #4f46e5',
          borderRadius: 'var(--radius-xl)',
          background: '#ffffff',
        }}
      >
        {/* Gateway Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #172554 100%)',
            padding: '1.5rem 1.75rem',
            color: '#ffffff',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.72rem',
                  letterSpacing: '0.08em',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
                }}
              >
                RAZORPAY
              </div>
              <span style={{ fontSize: '0.85rem', color: '#93c5fd', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={14} color="#38bdf8" /> Secured Checkout
              </span>
            </div>

            <button
              onClick={onClose}
              disabled={processing}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#cbd5e1',
                cursor: 'pointer',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s ease',
              }}
            >
              <X size={17} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Curriculum Track
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', maxWidth: '340px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {course.title}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Total Payable</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1 }}>
                ₹{orderData.amount || course.price}.00{' '}
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700 }}>INR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error notification banner if any */}
        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              background: '#fef2f2',
              borderBottom: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step: Select Payment Instrument */}
        {step === 'select' && (
          <div>
            {/* Payment Method Selector Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                borderBottom: '1px solid var(--border-color)',
                background: '#f8fafc',
              }}
            >
              <button
                type="button"
                onClick={() => { setActiveTab('card'); setErrorMsg(''); }}
                style={{
                  padding: '0.9rem 0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.78rem',
                  fontWeight: activeTab === 'card' ? 700 : 500,
                  color: activeTab === 'card' ? 'var(--primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'card' ? '3px solid var(--primary)' : '3px solid transparent',
                  background: activeTab === 'card' ? '#ffffff' : 'transparent',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                <CreditCard size={18} />
                <span>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('upi'); setErrorMsg(''); }}
                style={{
                  padding: '0.9rem 0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.78rem',
                  fontWeight: activeTab === 'upi' ? 700 : 500,
                  color: activeTab === 'upi' ? 'var(--primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'upi' ? '3px solid var(--primary)' : '3px solid transparent',
                  background: activeTab === 'upi' ? '#ffffff' : 'transparent',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                <QrCode size={18} />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('netbanking'); setErrorMsg(''); }}
                style={{
                  padding: '0.9rem 0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.78rem',
                  fontWeight: activeTab === 'netbanking' ? 700 : 500,
                  color: activeTab === 'netbanking' ? 'var(--primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'netbanking' ? '3px solid var(--primary)' : '3px solid transparent',
                  background: activeTab === 'netbanking' ? '#ffffff' : 'transparent',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                <Building2 size={18} />
                <span>Netbanking</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('wallet'); setErrorMsg(''); }}
                style={{
                  padding: '0.9rem 0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.78rem',
                  fontWeight: activeTab === 'wallet' ? 700 : 500,
                  color: activeTab === 'wallet' ? 'var(--primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'wallet' ? '3px solid var(--primary)' : '3px solid transparent',
                  background: activeTab === 'wallet' ? '#ffffff' : 'transparent',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                <Wallet size={18} />
                <span>Wallets</span>
              </button>
            </div>

            {/* Tab Body */}
            <div style={{ padding: '1.5rem' }}>
              {/* TAB 1: CARDS */}
              {activeTab === 'card' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Supports Visa, Mastercard, RuPay & Amex
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        background: 'var(--primary-light)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {detectCardBrand(cardNumber)}
                    </span>
                  </div>

                  {/* Card Form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                        Card Number
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          style={{
                            width: '100%',
                            padding: '0.75rem 0.85rem',
                            fontSize: '0.95rem',
                            fontFamily: 'monospace',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            letterSpacing: '0.05em',
                          }}
                        />
                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                          <CreditCard size={18} color="var(--text-muted)" />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="Name on card"
                          style={{
                            width: '100%',
                            padding: '0.75rem 0.85rem',
                            fontSize: '0.875rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                          }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                            Expiry
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                            placeholder="MM/YY"
                            maxLength={5}
                            style={{
                              width: '100%',
                              padding: '0.75rem 0.5rem',
                              fontSize: '0.875rem',
                              textAlign: 'center',
                              fontFamily: 'monospace',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-color)',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                            CVV
                          </label>
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="•••"
                            maxLength={4}
                            style={{
                              width: '100%',
                              padding: '0.75rem 0.5rem',
                              fontSize: '0.875rem',
                              textAlign: 'center',
                              fontFamily: 'monospace',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-color)',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Test Card Presets Quick Fill */}
                    <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                        ⚡ Sandbox Fast Presets (Click to autofill):
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setTestCard('visa')}
                          style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            color: '#1e3a8a',
                          }}
                        >
                          Visa (Success)
                        </button>
                        <button
                          type="button"
                          onClick={() => setTestCard('mastercard')}
                          style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            color: '#ea580c',
                          }}
                        >
                          Mastercard 3DS
                        </button>
                        <button
                          type="button"
                          onClick={() => setTestCard('rupay')}
                          style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            color: '#047857',
                          }}
                        >
                          RuPay India
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: UPI */}
              {activeTab === 'upi' && (
                <div>
                  {/* Mode Toggle: QR vs ID */}
                  <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setUpiMode('qr')}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        fontSize: '0.8rem',
                        fontWeight: upiMode === 'qr' ? 700 : 500,
                        background: upiMode === 'qr' ? '#ffffff' : 'transparent',
                        color: upiMode === 'qr' ? 'var(--primary)' : 'var(--text-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        boxShadow: upiMode === 'qr' ? 'var(--shadow-xs)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Scan QR Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpiMode('id')}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        fontSize: '0.8rem',
                        fontWeight: upiMode === 'id' ? 700 : 500,
                        background: upiMode === 'id' ? '#ffffff' : 'transparent',
                        color: upiMode === 'id' ? 'var(--primary)' : 'var(--text-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        boxShadow: upiMode === 'id' ? 'var(--shadow-xs)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Enter UPI ID / VPA
                    </button>
                  </div>

                  {upiMode === 'qr' ? (
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: '180px',
                          height: '180px',
                          margin: '0 auto 1rem',
                          padding: '12px',
                          background: '#ffffff',
                          borderRadius: 'var(--radius-lg)',
                          border: '2px solid #e2e8f0',
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.06)',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {/* Interactive SVG QR Code */}
                        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                          {/* Corner Markers */}
                          <rect x="5" y="5" width="25" height="25" fill="#0f172a" rx="3" />
                          <rect x="9" y="9" width="17" height="17" fill="#ffffff" rx="2" />
                          <rect x="13" y="13" width="9" height="9" fill="#4f46e5" rx="1" />

                          <rect x="70" y="5" width="25" height="25" fill="#0f172a" rx="3" />
                          <rect x="74" y="9" width="17" height="17" fill="#ffffff" rx="2" />
                          <rect x="78" y="13" width="9" height="9" fill="#4f46e5" rx="1" />

                          <rect x="5" y="70" width="25" height="25" fill="#0f172a" rx="3" />
                          <rect x="9" y="74" width="17" height="17" fill="#ffffff" rx="2" />
                          <rect x="13" y="78" width="9" height="9" fill="#4f46e5" rx="1" />

                          {/* Data Matrix Dots */}
                          <rect x="36" y="8" width="6" height="6" fill="#0f172a" />
                          <rect x="46" y="12" width="6" height="6" fill="#0f172a" />
                          <rect x="56" y="8" width="6" height="6" fill="#0f172a" />
                          <rect x="36" y="22" width="6" height="6" fill="#0f172a" />
                          <rect x="48" y="26" width="6" height="6" fill="#4f46e5" />
                          <rect x="58" y="20" width="6" height="6" fill="#0f172a" />

                          {/* Center Academic Seal */}
                          <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
                          <text x="50" y="53" textAnchor="middle" fontSize="9" fontWeight="900" fill="#4f46e5">SH</text>

                          {/* Bottom & Side Dots */}
                          <rect x="8" y="36" width="6" height="6" fill="#0f172a" />
                          <rect x="20" y="42" width="6" height="6" fill="#0f172a" />
                          <rect x="74" y="38" width="6" height="6" fill="#0f172a" />
                          <rect x="86" y="48" width="6" height="6" fill="#0f172a" />
                          <rect x="38" y="74" width="6" height="6" fill="#0f172a" />
                          <rect x="48" y="84" width="6" height="6" fill="#0f172a" />
                          <rect x="62" y="78" width="6" height="6" fill="#0f172a" />
                          <rect x="76" y="74" width="6" height="6" fill="#0f172a" />
                          <rect x="84" y="84" width="6" height="6" fill="#4f46e5" />
                        </svg>

                        {/* Animated Scanning Line */}
                        <div
                          style={{
                            position: 'absolute',
                            left: '8px',
                            right: '8px',
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent, #4f46e5, transparent)',
                            boxShadow: '0 0 8px #4f46e5',
                            animation: 'scanLine 2s linear infinite',
                          }}
                        />
                      </div>

                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                        Scan with GPay, PhonePe, Paytm, BHIM, or any UPI App
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Merchant: <strong>StudyHub Academic Platform</strong> • UPI ID: <code>studyhub.edu@razorpay</code>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                        Virtual Payment Address (VPA) / UPI ID
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="username@bank"
                        style={{
                          width: '100%',
                          padding: '0.75rem 0.85rem',
                          fontSize: '0.9rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                          marginBottom: '0.65rem',
                        }}
                      />

                      {/* Quick Suffix Chips */}
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                        {['@okhdfcbank', '@okaxis', '@okicici', '@paytm', '@ybl', '@ibl'].map((handle) => (
                          <button
                            key={handle}
                            type="button"
                            onClick={() => {
                              const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId;
                              setUpiId(`${prefix || 'student'}${handle}`);
                            }}
                            style={{
                              fontSize: '0.72rem',
                              padding: '3px 8px',
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: 'var(--radius-full)',
                              cursor: 'pointer',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {handle}
                          </button>
                        ))}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                        Select Your UPI Provider:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.5rem' }}>
                        {UPI_APPS.map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => {
                              const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId;
                              setUpiId(`${prefix || 'student'}${app.handle}`);
                            }}
                            style={{
                              padding: '0.5rem',
                              background: upiId.endsWith(app.handle) ? 'var(--primary-light)' : '#ffffff',
                              border: upiId.endsWith(app.handle) ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.2rem',
                            }}
                          >
                            <Smartphone size={16} color="var(--primary)" />
                            <span>{app.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: NETBANKING */}
              {activeTab === 'netbanking' && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.75rem' }}>
                    Popular Indian Banking Gateways:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginBottom: '1.25rem' }}>
                    {TOP_BANKS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => { setSelectedBank(b.id); setOtherBank(''); }}
                        style={{
                          padding: '0.75rem 0.5rem',
                          background: selectedBank === b.id && !otherBank ? 'var(--primary-light)' : '#ffffff',
                          border: selectedBank === b.id && !otherBank ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Building2 size={20} color={b.color} />
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'center' }}>
                          {b.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Or Select From 30+ Other Scheduled Banks:
                  </label>
                  <select
                    value={otherBank}
                    onChange={(e) => { setOtherBank(e.target.value); setSelectedBank(''); }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.85rem',
                      fontSize: '0.875rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      background: '#ffffff',
                      color: 'var(--text-main)',
                    }}
                  >
                    <option value="">-- Choose Other Indian Bank --</option>
                    {ALL_BANKS.map((bankName) => (
                      <option key={bankName} value={bankName}>{bankName}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* TAB 4: WALLETS */}
              {activeTab === 'wallet' && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.75rem' }}>
                    Select Linked Digital Wallet:
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {WALLETS.map((w) => (
                      <label
                        key={w.id}
                        onClick={() => setSelectedWallet(w.id)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.85rem 1rem',
                          background: selectedWallet === w.id ? 'var(--primary-light)' : '#ffffff',
                          border: selectedWallet === w.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <input
                            type="radio"
                            name="wallet"
                            checked={selectedWallet === w.id}
                            onChange={() => setSelectedWallet(w.id)}
                          />
                          <Wallet size={18} color="var(--primary)" />
                          <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{w.name}</strong>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                          Available: {w.balance}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Linked Mobile Number: <strong>+91 98••••1234</strong> (One-Click Wallet Checkout)
                  </div>
                </div>
              )}

              {/* Order Reference & Secure Footer */}
              <div
                style={{
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Order Ref: <code>{orderData.order_id}</code></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontWeight: 600 }}>
                  <Lock size={12} /> 256-bit Bank Encryption
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={processing}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={processing}
                  className="btn btn-primary"
                  style={{
                    flex: 2,
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
                    boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 700,
                  }}
                >
                  {processing ? (
                    'Processing Payment...'
                  ) : activeTab === 'upi' && upiMode === 'qr' ? (
                    <>
                      <Sparkles size={16} /> Simulate QR Approval (₹{orderData.amount || course.price})
                    </>
                  ) : (
                    <>
                      Pay ₹{orderData.amount || course.price}.00 <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Bank 3D Secure / OTP Simulation */}
        {step === 'otp' && (
          <div style={{ padding: '2rem 1.75rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#e0f2fe',
                  color: '#0284c7',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <ShieldCheck size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
                Bank 3D Secure Authentication
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
                Authenticating transaction with your issuing banking institution.
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Merchant:</span>
                <strong>StudyHub Academic Platform</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Transaction Amount:</span>
                <strong style={{ color: 'var(--primary)' }}>₹{orderData.amount || course.price}.00 INR</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Method:</span>
                <strong style={{ textTransform: 'capitalize' }}>{activeTab} Gateway</strong>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Enter 6-Digit One Time Password (OTP)
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={12} /> {countdown}s
                </span>
              </div>

              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '1.4rem',
                  letterSpacing: '0.5em',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--primary)',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setOtp('123456')}
                  style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  ⚡ Auto-fill Demo OTP (123456)
                </button>
                <button
                  type="button"
                  onClick={() => setCountdown(60)}
                  style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  Resend OTP
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setStep('select')}
                disabled={processing}
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={finalizeTransaction}
                disabled={processing || otp.length < 6}
                className="btn btn-primary"
                style={{
                  flex: 2,
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 700,
                }}
              >
                {processing ? (
                  <>
                    <RefreshCw size={16} className="spin" /> Verifying Bank OTP...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Authorize Payment
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 12px; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 168px; opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PaymentModal;
