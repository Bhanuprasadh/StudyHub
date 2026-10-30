import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import LessonContentRenderer from '../components/LessonContentRenderer';
import { Award } from 'lucide-react';

describe('Reusable UI Components', () => {
  it('renders StatCard with title, value, and subtitle', () => {
    render(
      <StatCard
        icon={Award}
        title="Active Students"
        value={150}
        subtitle="Across 12 courses"
      />
    );
    expect(screen.getByText('Active Students')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Across 12 courses')).toBeInTheDocument();
  });

  it('renders LoadingSpinner with customized message', () => {
    render(<LoadingSpinner text="Fetching examination results..." />);
    expect(screen.getByText('Fetching examination results...')).toBeInTheDocument();
  });

  it('structures multi-section lesson content into distinct pages with stepper tabs', () => {
    const sampleContent = `## Page One Architecture
This is the first page of architectural theory.

---

## Page Two Standards & Verification
This is the second page of technical standards.

| Header 1 | Header 2 |
| :--- | :--- |
| Val A | Val B |

---

### Page Three Implementation
Here is code implementation.
`;

    render(<LessonContentRenderer content={sampleContent} />);

    // Should indicate 3 structured pages
    expect(screen.getByText(/3 Structured Pages/i)).toBeInTheDocument();

    // First page content should be visible
    expect(screen.getAllByText('Page One Architecture').length).toBeGreaterThan(0);
    expect(screen.getByText('This is the first page of architectural theory.')).toBeInTheDocument();

    // Click Next Page button
    const nextBtn = screen.getByRole('button', { name: /Next Page/i });
    fireEvent.click(nextBtn);

    // Second page should now be active
    expect(screen.getAllByText('Page Two Standards & Verification').length).toBeGreaterThan(0);

    // Table elements should exist in the DOM
    expect(screen.getByText('Header 1')).toBeInTheDocument();
    expect(screen.getByText('Val A')).toBeInTheDocument();
  });

  it('correctly renders callout alerts and sanitizes markdown alert syntax', () => {
    const alertContent = `## Security Principles
> [!NOTE]
> All passwords must be salted with bcrypt.

> 💡 **Engineering Tip**: Return 201 Created on resource insertion.
`;

    render(<LessonContentRenderer content={alertContent} />);
    expect(screen.getByText(/All passwords must be salted with bcrypt/i)).toBeInTheDocument();
    expect(screen.getByText(/Return 201 Created on resource insertion/i)).toBeInTheDocument();
    expect(screen.getByText(/Pro Engineering Tip/i)).toBeInTheDocument();
  });

  it('renders ForgotPasswordPage with email input and recovery action', async () => {
    const { default: ForgotPasswordPage } = await import('../pages/ForgotPasswordPage');
    const { BrowserRouter } = await import('react-router-dom');
    const { AuthProvider } = await import('../context/AuthContext');

    render(
      <AuthProvider>
        <BrowserRouter>
          <ForgotPasswordPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByRole('heading', { name: /Reset Password/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@studyhub.edu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Recovery Instructions/i })).toBeInTheDocument();
  });

  it('renders PaymentModal with multi-instrument tabs (Cards, UPI, Netbanking, Wallets)', async () => {
    const { default: PaymentModal } = await import('../components/PaymentModal');
    const mockCourse = { id: 6, title: 'AI Research Methodology', price: 999 };
    const mockOrder = { order_id: 'order_test_12345', amount: 999, currency: 'INR' };
    const mockUser = { full_name: 'Bhanu Prasadh', email: 'bhanuprasadh004@gmail.com' };

    render(
      <PaymentModal
        isOpen={true}
        onClose={() => {}}
        course={mockCourse}
        orderData={mockOrder}
        user={mockUser}
        onSuccess={() => {}}
      />
    );

    // Header & Currency
    expect(screen.getByText('RAZORPAY')).toBeInTheDocument();
    expect(screen.getByText('AI Research Methodology')).toBeInTheDocument();
    expect(screen.getByText('₹999.00')).toBeInTheDocument();

    // Tabs
    expect(screen.getByRole('button', { name: /cards/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upi \/ qr/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /netbanking/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /wallets/i })).toBeInTheDocument();

    // Cards tab active by default
    expect(screen.getByText('Cardholder Name')).toBeInTheDocument();
    expect(screen.getByText('Visa (Success)')).toBeInTheDocument();

    // Switch to UPI tab
    fireEvent.click(screen.getByRole('button', { name: /upi \/ qr/i }));
    expect(screen.getByText(/Scan with GPay, PhonePe, Paytm, BHIM, or any UPI App/i)).toBeInTheDocument();

    // Switch to Netbanking tab
    fireEvent.click(screen.getByRole('button', { name: /netbanking/i }));
    expect(screen.getAllByText('HDFC Bank').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('State Bank of India').length).toBeGreaterThanOrEqual(1);

    // Switch to Wallets tab
    fireEvent.click(screen.getByRole('button', { name: /wallets/i }));
    expect(screen.getByText('Paytm Wallet')).toBeInTheDocument();
    expect(screen.getByText('PhonePe Wallet')).toBeInTheDocument();
  });

  it('renders InvoiceModal with official tax receipt, student credentials, and GST breakdown', async () => {
    const { default: InvoiceModal } = await import('../components/InvoiceModal');
    const sampleInvoice = {
      invoice_number: 'INV-2026-TEST99',
      order_id: 'order_test_99',
      payment_id: 'pay_test_99',
      course_title: 'AI Research Methodology',
      student_name: 'Bhanu Prasadh',
      student_email: 'bhanuprasadh004@gmail.com',
      amount: 999,
      total_amount: 999,
      payment_method: 'upi',
      bank_or_vpa: 'bhanu@okhdfcbank',
      status: 'paid',
      issued_at: '2026-10-31T00:00:00Z',
    };

    render(
      <InvoiceModal
        isOpen={true}
        onClose={() => {}}
        initialData={sampleInvoice}
      />
    );

    expect(screen.getByText('INV-2026-TEST99')).toBeInTheDocument();
    expect(screen.getByText('Bhanu Prasadh')).toBeInTheDocument();
    expect(screen.getByText('bhanuprasadh004@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('36AAACH7409R1ZZ', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Educational GST (Exempted 0%):')).toBeInTheDocument();
    expect(screen.getByText('₹999.00 INR')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Print \/ Save PDF/i })).toBeInTheDocument();
  });
});


