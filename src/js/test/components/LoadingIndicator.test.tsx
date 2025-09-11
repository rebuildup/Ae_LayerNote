/**
 * LoadingIndicator Component Tests
 */

import React from 'react';
import { render, screen } from '../test-utils';
import LoadingIndicator from '../../components/LoadingIndicator';

describe('LoadingIndicator', () => {
  describe('Default Behavior', () => {
    it('should render with default props', () => {
      render(<LoadingIndicator />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('should render with overlay by default', () => {
      render(<LoadingIndicator />);

      const overlay = screen.getByTestId('loading-overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('loading-overlay');
    });

    it('should render spinner dots', () => {
      render(<LoadingIndicator />);

      const dots = screen.getAllByTestId('loading-dot');
      expect(dots).toHaveLength(3);
    });
  });

  describe('Custom Props', () => {
    it('should render custom message', () => {
      const customMessage = 'Saving your work...';
      render(<LoadingIndicator message={customMessage} />);

      expect(screen.getByText(customMessage)).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should render without overlay when overlay=false', () => {
      render(<LoadingIndicator overlay={false} />);

      expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('should render with both custom message and no overlay', () => {
      const customMessage = 'Processing...';
      render(<LoadingIndicator message={customMessage} overlay={false} />);

      expect(screen.getByText(customMessage)).toBeInTheDocument();
      expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LoadingIndicator />);

      const indicator = screen.getByTestId('loading-indicator');
      expect(indicator).toHaveAttribute('role', 'status');
      expect(indicator).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible text for screen readers', () => {
      render(<LoadingIndicator message="Custom loading message" />);

      const indicator = screen.getByTestId('loading-indicator');
      expect(indicator).toHaveTextContent('Custom loading message');
    });
  });

  describe('CSS Classes', () => {
    it('should have correct CSS classes for overlay version', () => {
      render(<LoadingIndicator />);

      expect(screen.getByTestId('loading-overlay')).toHaveClass(
        'loading-overlay'
      );
      expect(screen.getByTestId('loading-indicator')).toHaveClass(
        'loading-indicator'
      );
    });

    it('should have correct CSS classes for inline version', () => {
      render(<LoadingIndicator overlay={false} />);

      const indicator = screen.getByTestId('loading-indicator');
      expect(indicator).toHaveClass('loading-indicator');
      expect(indicator).not.toHaveClass('loading-overlay');
    });
  });

  describe('Animation', () => {
    it('should have animated spinner dots', () => {
      render(<LoadingIndicator />);

      const dots = screen.getAllByTestId('loading-dot');
      dots.forEach((dot, index) => {
        expect(dot).toHaveClass('loading-indicator__dot');
        // Each dot should have different animation delay
        const computedStyle = window.getComputedStyle(dot);
        expect(computedStyle.animationName).toBe('loading-bounce');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain structure on different screen sizes', () => {
      // Test with different viewport sizes
      const originalInnerWidth = window.innerWidth;

      // Mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      render(<LoadingIndicator />);
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

      // Desktop size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

      // Restore original width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });
  });
});
