import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';
import ErrorBoundary from '../components/ErrorBoundary';

const ProblemChild = () => {
  throw new Error('Test crash in child component');
};

describe('StudyHub App Integration', () => {
  it('renders navbar brand and catalog links', () => {
    render(<App />);
    expect(screen.getAllByText(/StudyHub/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Course Catalog/i).length).toBeGreaterThan(0);
  });

  it('renders academic viva demo credentials badge on landing page', async () => {
    render(<App />);
    const badge = await screen.findByText(/Academic Evaluation Credentials/i);
    expect(badge).toBeInTheDocument();
  });

  it('catches crashes gracefully using ErrorBoundary', () => {
    // Suppress console.error in test output for intentional error boundary test
    const consoleSpy = vitest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Reload Page/i)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
