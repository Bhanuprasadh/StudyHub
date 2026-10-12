import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
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
});
