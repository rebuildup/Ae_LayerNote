import React from 'react';
import '../styles/loading-indicator.scss';
import { LoaderCircle } from 'lucide-react';

interface LoadingIndicatorProps {
  message?: string;
  overlay?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Loading...',
  overlay = true,
}) => {
  const content = (
    <div
      className="loading-indicator"
      data-testid="loading-indicator"
      role="status"
      aria-live="polite"
    >
      <div className="loading-indicator__spinner" aria-hidden="true">
        {/* Animated dots for tests/UX */}
        <span
          className="loading-indicator__dot"
          data-testid="loading-dot"
          style={{ animationName: 'loading-bounce' }}
        />
        <span
          className="loading-indicator__dot"
          data-testid="loading-dot"
          style={{ animationName: 'loading-bounce' }}
        />
        <span
          className="loading-indicator__dot"
          data-testid="loading-dot"
          style={{ animationName: 'loading-bounce' }}
        />
        {/* Icon fallback */}
        <LoaderCircle className="loading-indicator__icon" size={16} />
      </div>
      <div className="loading-indicator__message">{message}</div>
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay" data-testid="loading-overlay">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingIndicator;
