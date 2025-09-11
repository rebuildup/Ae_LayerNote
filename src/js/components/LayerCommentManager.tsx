import React, { useState, useCallback } from 'react';
import LayerCommentEditor from './LayerCommentEditor';
import { useLayerSelection } from '../hooks/useLayerSelection';
import { useCEPBridge } from '../hooks/useCEPBridge';
import '../styles/layer-comment-manager.scss';

interface LayerCommentManagerProps {
  className?: string;
}

const LayerCommentManager: React.FC<LayerCommentManagerProps> = ({
  className = '',
}) => {
  const {
    selectedLayers,
    isLoading: selectionLoading,
    error: selectionError,
    autoSync,
    lastSyncTime,
    syncWithAfterEffects,
    updateSelectedLayers,
    toggleAutoSync,
    clearSelection,
  } = useLayerSelection();

  const {
    isConnected,
    isLoading: connectionLoading,
    error: connectionError,
    connectionStatus,
    checkConnection,
    clearError,
  } = useCEPBridge();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await syncWithAfterEffects();
    } finally {
      setIsRefreshing(false);
    }
  }, [syncWithAfterEffects]);

  const handleReconnect = useCallback(async () => {
    clearError();
    await checkConnection();
  }, [clearError, checkConnection]);

  const formatLastSyncTime = (time: Date | null) => {
    if (!time) return 'Never';
    const now = new Date();
    const diff = now.getTime() - time.getTime();

    if (diff < 1000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return time.toLocaleTimeString();
  };

  return (
    <div className={`layer-comment-manager ${className}`}>
      {/* Header with controls */}
      <div className="manager-header">
        <div className="header-left">
          <h3>Layer Comments</h3>
          <div className="connection-status">
            <span
              className={`status-indicator ${
                isConnected ? 'connected' : 'disconnected'
              }`}
            />
            <span className="status-text">{connectionStatus}</span>
          </div>
        </div>

        <div className="header-controls">
          <div className="sync-controls">
            <label className="auto-sync-toggle">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={toggleAutoSync}
                disabled={!isConnected}
              />
              <span>Auto-sync</span>
            </label>

            <button
              className="refresh-button"
              onClick={handleRefresh}
              disabled={!isConnected || isRefreshing || selectionLoading}
              title="Refresh layer selection"
            >
              {isRefreshing ? '⟳' : '↻'}
            </button>
          </div>

          <div className="layer-info">
            <span className="layer-count">
              {selectedLayers.length} layer
              {selectedLayers.length !== 1 ? 's' : ''} selected
            </span>
            <span className="last-sync">
              Last sync: {formatLastSyncTime(lastSyncTime)}
            </span>
          </div>

          {selectedLayers.length > 0 && (
            <button
              className="clear-selection"
              onClick={clearSelection}
              title="Clear selection"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error messages */}
      {(connectionError || selectionError) && (
        <div className="error-section">
          {connectionError && (
            <div className="error-message connection-error">
              <span>Connection Error: {connectionError.message}</span>
              <button onClick={handleReconnect} className="retry-button">
                Retry
              </button>
            </div>
          )}
          {selectionError && (
            <div className="error-message selection-error">
              <span>Selection Error: {selectionError.message}</span>
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {(connectionLoading || selectionLoading) && (
        <div className="loading-section">
          <div className="loading-spinner">⟳</div>
          <span>
            {connectionLoading ? 'Connecting...' : 'Loading layers...'}
          </span>
        </div>
      )}

      {/* Main editor */}
      {isConnected && !connectionLoading && (
        <div className="editor-section">
          <LayerCommentEditor
            selectedLayers={selectedLayers}
            onLayerSelectionChange={updateSelectedLayers}
          />
        </div>
      )}

      {/* Connection prompt */}
      {!isConnected && !connectionLoading && (
        <div className="connection-prompt">
          <p>Not connected to After Effects</p>
          <button onClick={handleReconnect} className="connect-button">
            Connect
          </button>
        </div>
      )}
    </div>
  );
};

export default LayerCommentManager;
