import React, { useState, useEffect, useCallback } from 'react';
import EditorContainer from './EditorContainer';
import { useLayerOperations } from '../hooks/useCEPBridge';
import { LayerInfo } from '../../shared/universals';
import '../styles/layer-comment-editor.scss';

interface LayerCommentEditorProps {
  selectedLayers: LayerInfo[];
  onLayerSelectionChange?: (layers: LayerInfo[]) => void;
}

interface LayerCommentTab {
  layerId: string;
  layerName: string;
  comment: string;
  isDirty: boolean;
}

const LayerCommentEditor: React.FC<LayerCommentEditorProps> = ({
  selectedLayers,
  onLayerSelectionChange,
}) => {
  const { getLayerComment, setLayerComment, isLoading, error } =
    useLayerOperations();

  const [tabs, setTabs] = useState<LayerCommentTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [loadingComments, setLoadingComments] = useState<Set<string>>(
    new Set()
  );

  // Update tabs when selected layers change
  useEffect(() => {
    updateTabsFromSelectedLayers();
  }, [selectedLayers]);

  const updateTabsFromSelectedLayers = useCallback(async () => {
    if (selectedLayers.length === 0) {
      setTabs([]);
      setActiveTabId(null);
      return;
    }

    // Create tabs for selected layers
    const newTabs: LayerCommentTab[] = [];
    const loadingSet = new Set<string>();

    for (const layer of selectedLayers) {
      loadingSet.add(layer.id);
      newTabs.push({
        layerId: layer.id,
        layerName: layer.name,
        comment: layer.comment || '',
        isDirty: false,
      });
    }

    setTabs(newTabs);
    setLoadingComments(loadingSet);

    // Set active tab to first layer if none selected
    if (!activeTabId || !selectedLayers.find(l => l.id === activeTabId)) {
      setActiveTabId(selectedLayers[0].id);
    }

    // Load comments for all selected layers
    for (const layer of selectedLayers) {
      try {
        const comment = await getLayerComment(layer.id);
        setTabs(prevTabs =>
          prevTabs.map(tab =>
            tab.layerId === layer.id ? { ...tab, comment } : tab
          )
        );
      } catch (error) {
        console.error(`Failed to load comment for layer ${layer.id}:`, error);
      } finally {
        setLoadingComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(layer.id);
          return newSet;
        });
      }
    }
  }, [selectedLayers, activeTabId, getLayerComment]);

  const handleSaveComment = useCallback(
    async (layerId: string, comment: string) => {
      try {
        const success = await setLayerComment(layerId, comment);
        if (success) {
          setTabs(prevTabs =>
            prevTabs.map(tab =>
              tab.layerId === layerId ? { ...tab, isDirty: false } : tab
            )
          );

          // Update the selected layers state if callback provided
          if (onLayerSelectionChange) {
            const updatedLayers = selectedLayers.map(layer =>
              layer.id === layerId ? { ...layer, comment } : layer
            );
            onLayerSelectionChange(updatedLayers);
          }
        }
      } catch (error) {
        console.error(`Failed to save comment for layer ${layerId}:`, error);
      }
    },
    [setLayerComment, selectedLayers, onLayerSelectionChange]
  );

  const handleCancelComment = useCallback(
    (layerId: string) => {
      const originalComment =
        selectedLayers.find(l => l.id === layerId)?.comment || '';
      setTabs(prevTabs =>
        prevTabs.map(tab =>
          tab.layerId === layerId
            ? { ...tab, comment: originalComment, isDirty: false }
            : tab
        )
      );
    },
    [selectedLayers]
  );

  const handleTabClick = useCallback((layerId: string) => {
    setActiveTabId(layerId);
  }, []);

  const handleCloseTab = useCallback(
    (layerId: string) => {
      setTabs(prevTabs => {
        const newTabs = prevTabs.filter(tab => tab.layerId !== layerId);

        // If closing active tab, switch to another tab
        if (activeTabId === layerId && newTabs.length > 0) {
          setActiveTabId(newTabs[0].layerId);
        } else if (newTabs.length === 0) {
          setActiveTabId(null);
        }

        return newTabs;
      });

      // Remove from selected layers if callback provided
      if (onLayerSelectionChange) {
        const updatedLayers = selectedLayers.filter(
          layer => layer.id !== layerId
        );
        onLayerSelectionChange(updatedLayers);
      }
    },
    [activeTabId, selectedLayers, onLayerSelectionChange]
  );

  const activeTab = tabs.find(tab => tab.layerId === activeTabId);

  if (selectedLayers.length === 0) {
    return (
      <div className="layer-comment-editor">
        <div className="no-selection">
          <p>
            Select one or more layers in After Effects to edit their comments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="layer-comment-editor">
      {/* Tab bar */}
      <div className="tab-bar">
        {tabs.map(tab => (
          <div
            key={tab.layerId}
            className={`tab ${activeTabId === tab.layerId ? 'active' : ''} ${
              tab.isDirty ? 'dirty' : ''
            }`}
            onClick={() => handleTabClick(tab.layerId)}
          >
            <span className="tab-name" title={tab.layerName}>
              {tab.layerName}
            </span>
            {tab.isDirty && <span className="dirty-indicator">●</span>}
            {loadingComments.has(tab.layerId) && (
              <span className="loading-indicator">⟳</span>
            )}
            <button
              className="close-tab"
              onClick={e => {
                e.stopPropagation();
                handleCloseTab(tab.layerId);
              }}
              title="Close tab"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Editor content */}
      {activeTab && (
        <div className="editor-wrapper">
          <EditorContainer
            title={`Comment for "${activeTab.layerName}"`}
            initialValue={activeTab.comment}
            language="plaintext"
            onSave={value => handleSaveComment(activeTab.layerId, value)}
            onCancel={() => handleCancelComment(activeTab.layerId)}
            readOnly={isLoading || loadingComments.has(activeTab.layerId)}
          />
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="error-message">
          <p>Error: {error.message}</p>
        </div>
      )}
    </div>
  );
};

export default LayerCommentEditor;
