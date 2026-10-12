import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('StudyHub App Integration', () => {
  it('renders navbar brand and catalog links', () => {
    render(<App />);
    expect(screen.getAllByText(/StudyHub/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Course Catalog/i).length).toBeGreaterThan(0);
  });

  it('renders academic viva demo credentials badge on landing page', () => {
    render(<App />);
    expect(screen.getByText(/Academic Evaluation Credentials/i)).toBeInTheDocument();
  });
});
