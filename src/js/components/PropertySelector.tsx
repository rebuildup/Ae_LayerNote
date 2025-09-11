import React, { useState, useEffect, useCallback } from 'react';
import {
  useLayerOperations,
  useExpressionOperations,
} from '../hooks/useCEPBridge';
import { LayerInfo, PropertyInfo } from '../../shared/universals';
import { PropertySelection } from '../types/expression';
import { ChevronRight, Settings } from 'lucide-react';
import '../styles/property-selector.scss';

interface PropertySelectorProps {
  selectedProperty: PropertySelection | null;
  onPropertySelect: (property: PropertySelection | null) => void;
  onClose?: () => void;
}

const PropertySelector: React.FC<PropertySelectorProps> = ({
  selectedProperty,
  onPropertySelect,
  onClose,
}) => {
  const { getSelectedLayers, isLoading: layersLoading } = useLayerOperations();
  const { getPropertyExpression } = useExpressionOperations();

  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [layerProperties, setLayerProperties] = useState<
    Map<string, PropertyInfo[]>
  >(new Map());
  const [loadingProperties, setLoadingProperties] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Load selected layers on mount
  useEffect(() => {
    loadLayers();
  }, []);

  const loadLayers = useCallback(async () => {
    try {
      const selectedLayers = await getSelectedLayers();
      setLayers(selectedLayers);

      // Auto-expand if only one layer
      if (selectedLayers.length === 1) {
        setExpandedLayers(new Set([selectedLayers[0].id]));
        loadLayerProperties(selectedLayers[0].id);
      }
    } catch (error) {
      console.error('Failed to load layers:', error);
    }
  }, [getSelectedLayers]);

  const loadLayerProperties = useCallback(
    async (layerId: string) => {
      if (layerProperties.has(layerId) || loadingProperties.has(layerId)) {
        return;
      }

      setLoadingProperties(prev => new Set(prev).add(layerId));

      try {
        // This would be implemented with actual CEP bridge call
        // For now, we'll create mock properties
        const mockProperties: PropertyInfo[] = [
          {
            path: `${layerId}.Transform.Position`,
            name: 'Position',
            expression: '',
            hasExpression: false,
            propertyType: '2D_SPATIAL',
          },
          {
            path: `${layerId}.Transform.Rotation`,
            name: 'Rotation',
            expression: 'time * 360',
            hasExpression: true,
            propertyType: '1D',
          },
          {
            path: `${layerId}.Transform.Scale`,
            name: 'Scale',
            expression: '',
            hasExpression: false,
            propertyType: '2D',
          },
          {
            path: `${layerId}.Transform.Opacity`,
            name: 'Opacity',
            expression: '',
            hasExpression: false,
            propertyType: '1D',
          },
        ];

        setLayerProperties(prev => new Map(prev).set(layerId, mockProperties));
      } catch (error) {
        console.error(`Failed to load properties for layer ${layerId}:`, error);
      } finally {
        setLoadingProperties(prev => {
          const newSet = new Set(prev);
          newSet.delete(layerId);
          return newSet;
        });
      }
    },
    [layerProperties, loadingProperties]
  );

  const toggleLayerExpansion = useCallback(
    (layerId: string) => {
      setExpandedLayers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(layerId)) {
          newSet.delete(layerId);
        } else {
          newSet.add(layerId);
          loadLayerProperties(layerId);
        }
        return newSet;
      });
    },
    [loadLayerProperties]
  );

  const handlePropertySelect = useCallback(
    async (layer: LayerInfo, property: PropertyInfo) => {
      try {
        // Load current expression
        const currentExpression = property.hasExpression
          ? await getPropertyExpression(property.path)
          : '';

        const propertySelection: PropertySelection = {
          layerId: layer.id,
          layerName: layer.name,
          propertyPath: property.path,
          propertyName: property.name,
          propertyType: property.propertyType,
          currentExpression,
          hasExpression: property.hasExpression,
        };

        onPropertySelect(propertySelection);
      } catch (error) {
        console.error('Failed to load property expression:', error);
      }
    },
    [getPropertyExpression, onPropertySelect]
  );

  const filteredLayers = layers.filter(layer =>
    layer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPropertyIcon = (propertyType: string) => {
    switch (propertyType) {
      case '2D_SPATIAL':
      case '3D_SPATIAL':
        return '📍';
      case '1D':
        return '📊';
      case '2D':
        return '📐';
      case 'COLOR':
        return '🎨';
      default:
        return <Settings size={16} />;
    }
  };

  return (
    <div className="property-selector">
      <div className="property-selector-header">
        <h3>Select Property</h3>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search layers..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button
          className="refresh-btn"
          onClick={loadLayers}
          disabled={layersLoading}
          title="Refresh layers"
        >
          {layersLoading ? '⟳' : '↻'}
        </button>
      </div>

      {selectedProperty && (
        <div className="current-selection">
          <div className="selection-header">Current Selection:</div>
          <div className="selection-info">
            <div className="layer-name">{selectedProperty.layerName}</div>
            <div className="property-name">
              {getPropertyIcon(selectedProperty.propertyType)}{' '}
              {selectedProperty.propertyName}
            </div>
            <div className="property-path">{selectedProperty.propertyPath}</div>
            {selectedProperty.hasExpression && (
              <div className="has-expression">✨ Has Expression</div>
            )}
          </div>
        </div>
      )}

      <div className="layers-list">
        {layersLoading ? (
          <div className="loading-state">
            <div className="loading-spinner">⟳</div>
            <span>Loading layers...</span>
          </div>
        ) : filteredLayers.length === 0 ? (
          <div className="empty-state">
            <p>No layers found</p>
            <button onClick={loadLayers} className="retry-btn">
              Refresh
            </button>
          </div>
        ) : (
          filteredLayers.map(layer => (
            <div key={layer.id} className="layer-item">
              <div
                className="layer-header"
                onClick={() => toggleLayerExpansion(layer.id)}
              >
                <span
                  className={`expand-icon ${expandedLayers.has(layer.id) ? 'expanded' : ''}`}
                >
                  <ChevronRight size={14} />
                </span>
                <span className="layer-name">{layer.name}</span>
                <span className="layer-index">#{layer.index}</span>
              </div>

              {expandedLayers.has(layer.id) && (
                <div className="properties-list">
                  {loadingProperties.has(layer.id) ? (
                    <div className="loading-properties">
                      <div className="loading-spinner">⟳</div>
                      <span>Loading properties...</span>
                    </div>
                  ) : (
                    layerProperties.get(layer.id)?.map(property => (
                      <div
                        key={property.path}
                        className={`property-item ${
                          selectedProperty?.propertyPath === property.path
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() => handlePropertySelect(layer, property)}
                      >
                        <div className="property-info">
                          <span className="property-icon">
                            {getPropertyIcon(property.propertyType)}
                          </span>
                          <span className="property-name">{property.name}</span>
                          {property.hasExpression && (
                            <span
                              className="expression-indicator"
                              title="Has expression"
                            >
                              ✨
                            </span>
                          )}
                        </div>
                        <div className="property-type">
                          {property.propertyType}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {selectedProperty && (
        <div className="selection-actions">
          <button
            className="clear-selection"
            onClick={() => onPropertySelect(null)}
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};

export default PropertySelector;
