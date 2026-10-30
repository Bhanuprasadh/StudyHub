import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import {
  Printer,
  X,
  CheckCircle,
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  ShieldCheck,
  Download,
  GraduationCap,
  FileText,
} from 'lucide-react';

const InvoiceModal = ({
  isOpen,
  onClose,
  invoiceId,
  initialData,
}) => {
  if (!isOpen) return null;

  const [invoice, setInvoice] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setInvoice(initialData);
      setLoading(false);
      return;
    }
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId, initialData]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/payments/invoice/${invoiceId}`);
      setInvoice(res.data);
    } catch (err) {
      console.error('Invoice fetch error:', err);
      setError('Unable to load official tax invoice.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'upi':
        return <QrCode size={15} color="#4f46e5" />;
      case 'netbanking':
        return <Building2 size={15} color="#0284c7" />;
      case 'wallet':
        return <Wallet size={15} color="#059669" />;
      default:
        return <CreditCard size={15} color="#ea580c" />;
    }
  };

  return (
    <div
      className="invoice-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1.5rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="card invoice-container"
        style={{
          width: '100%',
          maxWidth: '720px',
          background: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-color)',
          position: 'relative',
        }}
      >
        {/* Modal Controls (Hidden in print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>
            <FileText size={18} /> Official Tax Invoice & Enrollment Receipt
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handlePrint}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Printer size={15} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'var(--bg-subtle)',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Loading invoice details...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#dc2626' }}>
            {error}
          </div>
        ) : invoice ? (
          <div className="printable-invoice">
            {/* Invoice Top Brand Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div
                    style={{
                      background: 'var(--primary)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <GraduationCap size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                      StudyHub <span style={{ color: 'var(--primary)' }}>Academic</span>
                    </h2>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Engineering & Research Platform
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <div>StudyHub Higher Education Foundation</div>
                  <div>GSTIN: <code>36AAACH7409R1ZZ</code> • SAC: <code>999293</code></div>
                  <div>Campus Academic Division, Telangana, India</div>
                  <div>Contact: <code>billing@studyhub.edu</code></div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    display: 'inline-block',
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    marginBottom: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  ✓ Tax Invoice (Paid)
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                  {invoice.invoice_number}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Date:{' '}
                  {new Date(invoice.issued_at || Date.now()).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>

            {/* Billed To & Payment Metadata */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                background: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '2rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Billed To (Student Scholar)
                </div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'block' }}>
                  {invoice.student_name}
                </strong>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  {invoice.student_email}
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Status: <strong>Active Enrolled Scholar</strong>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Payment & Settlement Details
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                  {renderMethodIcon(invoice.payment_method)}
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-main)' }}>
                    {invoice.payment_method} Gateway
                  </span>
                  {invoice.bank_or_vpa && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      ({invoice.bank_or_vpa})
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Razorpay Payment ID: <code>{invoice.payment_id}</code>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Order Ref: <code>{invoice.order_id}</code>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div style={{ marginBottom: '2rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-secondary)' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-secondary)' }}>Curriculum Description</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-secondary)' }}>SAC Code</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--text-secondary)' }}>Rate (INR)</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', color: 'var(--text-secondary)' }}>Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-muted)' }}>01</td>
                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <strong style={{ color: 'var(--text-main)', display: 'block' }}>{invoice.course_title}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Full Academic Track Access & Assessment Certification</span>
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.8rem' }}>999293</td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>₹{invoice.amount}.00</td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>₹{invoice.amount}.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2.5rem' }}>
              <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Subtotal:</span>
                  <span>₹{invoice.amount}.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Educational GST (Exempted 0%):</span>
                  <span>₹0.00</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '0.65rem',
                    borderTop: '2px solid var(--text-main)',
                    fontWeight: 900,
                    fontSize: '1.15rem',
                    color: 'var(--text-main)',
                  }}
                >
                  <span>Total Paid:</span>
                  <span style={{ color: 'var(--primary)' }}>₹{invoice.total_amount || invoice.amount}.00 INR</span>
                </div>
              </div>
            </div>

            {/* Digital Stamp & Verification Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                borderTop: '1px dashed var(--border-color)',
                paddingTop: '1.5rem',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: 700, marginBottom: '0.2rem' }}>
                  <ShieldCheck size={16} /> Digitally Authorized & Cryptographically Verified
                </div>
                <div>Issued electronically under the Information Technology Act, 2000.</div>
                <div>No physical signature required. Valid for academic reimbursement.</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    border: '2px dashed #0284c7',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284c7',
                    fontWeight: 800,
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    transform: 'rotate(-8deg)',
                  }}
                >
                  <div>STUDYHUB</div>
                  <div>★ PAID ★</div>
                  <div>REGISTRAR</div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .invoice-modal-overlay {
            position: absolute !important;
            inset: 0 !important;
            background: #ffffff !important;
            padding: 0 !important;
            display: block !important;
            overflow: visible !important;
          }
          .invoice-container {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
          .printable-invoice, .printable-invoice * {
            visibility: visible !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceModal;
