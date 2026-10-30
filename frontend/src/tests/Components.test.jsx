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
});


