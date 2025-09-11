import React, { useState, useCallback } from 'react';
import PropertySelector from './PropertySelector';
import ExpressionEditor from './ExpressionEditor';
import { PropertySelection } from '../types/expression';
import { useCEPBridge } from '../hooks/useCEPBridge';
import '../styles/expression-manager.scss';

interface ExpressionManagerProps {
  className?: string;
}

const ExpressionManager: React.FC<ExpressionManagerProps> = ({
  className = '',
}) => {
  const [selectedProperty, setSelectedProperty] =
    useState<PropertySelection | null>(null);
  const [showPropertySelector, setShowPropertySelector] = useState(true);
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');

  const {
    isConnected,
    isLoading: connectionLoading,
    error: connectionError,
    connectionStatus,
    checkConnection,
    clearError,
  } = useCEPBridge();

  const handlePropertySelect = useCallback(
    (property: PropertySelection | null) => {
      setSelectedProperty(property);
      if (property && window.innerWidth < 1200) {
        // Auto-hide property selector on smaller screens when property is selected
        setShowPropertySelector(false);
      }
    },
    []
  );

  const handlePropertyChange = useCallback((property: PropertySelection) => {
    setSelectedProperty(property);
  }, []);

  const togglePropertySelector = useCallback(() => {
    setShowPropertySelector(!showPropertySelector);
  }, [showPropertySelector]);

  const toggleLayout = useCallback(() => {
    setLayout(layout === 'horizontal' ? 'vertical' : 'horizontal');
  }, [layout]);

  const handleReconnect = useCallback(async () => {
    clearError();
    await checkConnection();
  }, [clearError, checkConnection]);

  if (connectionLoading) {
    return (
      <div className={`expression-manager ${className}`}>
        <div className="loading-state">
          <div className="loading-spinner">⟳</div>
          <span>Connecting to After Effects...</span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={`expression-manager ${className}`}>
        <div className="connection-error">
          <div className="error-content">
            <h3>Not Connected to After Effects</h3>
            <p>The expression editor requires a connection to After Effects.</p>
            {connectionError && (
              <div className="error-details">
                <strong>Error:</strong> {connectionError.message}
              </div>
            )}
            <button onClick={handleReconnect} className="reconnect-btn">
              Try to Connect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`expression-manager ${className} layout-${layout}`}>
      {/* Header */}
      <div className="expression-manager-header">
        <div className="header-left">
          <h2>Expression Editor</h2>
          <div className="connection-status">
            <span className="status-indicator connected" />
            <span className="status-text">{connectionStatus}</span>
          </div>
        </div>

        <div className="header-controls">
          <button
            className={`toggle-selector ${showPropertySelector ? 'active' : ''}`}
            onClick={togglePropertySelector}
            title="Toggle property selector"
          >
            📋 Properties
          </button>

          <button
            className="layout-toggle"
            onClick={toggleLayout}
            title={`Switch to ${layout === 'horizontal' ? 'vertical' : 'horizontal'} layout`}
          >
            {layout === 'horizontal' ? '⬌' : '⬍'} Layout
          </button>

          {selectedProperty && (
            <div className="selected-property-info">
              <span className="property-name">
                {selectedProperty.propertyName}
              </span>
              <span className="layer-name">({selectedProperty.layerName})</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="expression-manager-content">
        {/* Property Selector Panel */}
        {showPropertySelector && (
          <div className="property-selector-panel">
            <PropertySelector
              selectedProperty={selectedProperty}
              onPropertySelect={handlePropertySelect}
              onClose={() => setShowPropertySelector(false)}
            />
          </div>
        )}

        {/* Expression Editor Panel */}
        <div className="expression-editor-panel">
          <ExpressionEditor
            selectedProperty={selectedProperty}
            onPropertyChange={handlePropertyChange}
          />
        </div>
      </div>

      {/* Quick Actions */}
      {selectedProperty && (
        <div className="quick-actions">
          <div className="action-group">
            <span className="group-label">Quick Actions:</span>
            <button
              className="quick-action"
              onClick={() => {
                // Insert common expression templates
                // This would be implemented with editor integration
              }}
              title="Insert wiggle expression"
            >
              🌊 Wiggle
            </button>
            <button
              className="quick-action"
              onClick={() => {
                // Insert rotation expression
              }}
              title="Insert rotation expression"
            >
              🔄 Rotate
            </button>
            <button
              className="quick-action"
              onClick={() => {
                // Insert scale expression
              }}
              title="Insert scale expression"
            >
              📏 Scale
            </button>
            <button
              className="quick-action"
              onClick={() => {
                // Insert opacity expression
              }}
              title="Insert opacity expression"
            >
              👁️ Opacity
            </button>
          </div>

          <div className="property-actions">
            <button
              className="property-action"
              onClick={() => setSelectedProperty(null)}
              title="Clear property selection"
            >
              ✕ Clear
            </button>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="expression-manager-status">
        <div className="status-left">
          <span>After Effects Expression Editor</span>
          {selectedProperty && (
            <>
              <span className="separator">•</span>
              <span>{selectedProperty.propertyType} Property</span>
              {selectedProperty.hasExpression && (
                <>
                  <span className="separator">•</span>
                  <span className="has-expression">✨ Has Expression</span>
                </>
              )}
            </>
          )}
        </div>

        <div className="status-right">
          <span className="connection-indicator">
            🔗 Connected to After Effects
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExpressionManager;
