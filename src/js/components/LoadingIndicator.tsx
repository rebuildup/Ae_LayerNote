import React from 'react';
import '../styles/loading-indicator.scss';

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
      <div className="loading-indicator__spinner">
        <div className="loading-indicator__dot" data-testid="loading-dot"></div>
        <div className="loading-indicator__dot" data-testid="loading-dot"></div>
        <div className="loading-indicator__dot" data-testid="loading-dot"></div>
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
