import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useLayerOperations,
  useExpressionOperations,
} from '../hooks/useCEPBridge';
import type { LayerInfo, PropertyInfo } from '../../shared/universals';
import type { PropertySelection } from '../types/expression';
import { ChevronRight, ChevronDown } from 'lucide-react';
import '../styles/property-selector.scss';
import '../styles/sidebar-list.scss';
import { SidebarList, SidebarRow } from './SidebarList';
/**
 * Property selection panel that lists After Effects layer properties as a tree
 * and allows choosing a property to inspect/edit its expression.
 */
interface PropertySelectorProps {
  selectedProperty: PropertySelection | null;
  onPropertySelect: (property: PropertySelection | null) => void;
  _onClose?: () => void;
}

const PropertySelector: React.FC<PropertySelectorProps> = ({
  selectedProperty,
  onPropertySelect,
  _onClose,
}) => {
  const { getSelectedLayers, isLoading: layersLoading } = useLayerOperations();
  const { getLayerProperties, getPropertyExpression } =
    useExpressionOperations();

  const [layers, setLayers] = useState<LayerInfo[]>([]);
  // expandedLayers kept for potential future use
  // const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [layerProperties, setLayerProperties] = useState<
    Map<string, PropertyInfo[]>
  >(new Map());
  const [loadingProperties, setLoadingProperties] = useState<Set<string>>(
    new Set()
  );
  // Search UI removed to match comment mode tone

  // Load selected layers on mount
  useEffect(() => {
    loadLayers();
  }, []);

  const loadLayers = useCallback(async () => {
    try {
      const selectedLayers = await getSelectedLayers();
      setLayers(selectedLayers);

      // Preload properties for all selected layers
      selectedLayers.forEach(l => loadLayerProperties(l.id));
      // debug alert removed
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
        const props = await getLayerProperties(layerId);
        setLayerProperties(prev => new Map(prev).set(layerId, props));
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
    [layerProperties, loadingProperties, getLayerProperties]
  );

  // const toggleLayerExpansion = useCallback(
  //   (layerId: string) => {
  //     setExpandedLayers(prev => {
  //       const newSet = new Set(prev);
  //       if (newSet.has(layerId)) {
  //         newSet.delete(layerId);
  //       } else {
  //         newSet.add(layerId);
  //         loadLayerProperties(layerId);
  //       }
  //       return newSet;
  //     });
  //   },
  //   [loadLayerProperties]
  // );

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

  const filteredLayers = layers;

  return (
    <div className="property-selector">
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
              <div className="properties-list">
                {loadingProperties.has(layer.id) ? (
                  <div className="loading-properties">
                    <div className="loading-spinner">⟳</div>
                    <span>Loading properties...</span>
                  </div>
                ) : (
                  <SidebarList>
                    <Tree
                      layerId={layer.id}
                      items={layerProperties.get(layer.id) || []}
                      selectedPath={selectedProperty?.propertyPath || ''}
                      onSelect={prop => handlePropertySelect(layer, prop)}
                    />
                  </SidebarList>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// VSCode-like tree for property paths using ">"-style disclosure
type TreeProps = {
  layerId: string;
  items: PropertyInfo[];
  selectedPath: string;
  onSelect: (prop: PropertyInfo) => void;
};

type TreeNode = {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  prop?: PropertyInfo;
};

const Tree: React.FC<TreeProps> = ({ layerId, items, selectedPath, onSelect }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Build a tree structure from dot-separated paths (already prefixed with layerId)
  const root = useMemo(() => {
    const makeNode = (name: string, path: string): TreeNode => ({
      name,
      path,
      children: new Map(),
    });
    const rootNode: TreeNode = makeNode(layerId, layerId);
    for (const p of items) {
      const parts = p.path.split('.');
      // Ensure we don't duplicate the layer id segment under root
      const startIndex = parts[0] === layerId ? 1 : 0;
      let node: TreeNode = rootNode;
      for (let i = startIndex; i < parts.length; i++) {
        const part = parts[i];
        if (!node.children.has(part)) {
          const subPath = `${node.path}.${part}`;
          node.children.set(part, makeNode(part, subPath));
        }
        const next = node.children.get(part)!;
        node = next;
        if (i === parts.length - 1) {
          node.prop = p;
        }
      }
    }
    return rootNode;
  }, [items, layerId]);

  const toggle = (path: string) =>
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));

  const renderNode = (node: TreeNode, depth: number) => {
    const hasChildren =
      node.children.size > 0 && (!node.prop || node.children.size > 1);
    const isExpanded = !!expanded[node.path];
    const isLeaf = !!node.prop && node.children.size === 0;
    const isSelected = selectedPath === node.path;

    // Skip rendering synthetic root (layerId) as a clickable leaf; show as a collapsible group
    const isRoot = node.path === layerId;

    return (
      <div
        key={node.path}
        className="tree-row"
        style={{ paddingLeft: depth * 12 }}
      >
        {!isRoot && (
          <SidebarRow
            selected={isSelected}
            onClick={() => {
              if (hasChildren && !isLeaf) {
                toggle(node.path);
              } else if (node.prop) {
                onSelect(node.prop);
              }
            }}
            leftSlot={
              hasChildren && !isLeaf ? (
                <span
                  className="chevron"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </span>
              ) : node.prop ? (
                <span className="leaf-icon" aria-hidden />
              ) : (
                <span className="leaf-icon" />
              )
            }
            rightSlot={
              node.prop ? (
                <span className="tree-type">
                  {node.prop.propertyType}
                  {node.prop.canSetExpression === true ? '' : ' (read-only)'}
                </span>
              ) : undefined
            }
            title={node.name}
          >
            <span className="tree-name">
              {node.name}
              {node.prop?.hasExpression && (
                <span className="expression-indicator" title="Has expression">
                  ✨
                </span>
              )}
            </span>
          </SidebarRow>
        )}
        {hasChildren && (isRoot || isExpanded) && (
          <div className="tree-children">
            {Array.from(node.children.values()).map((child: TreeNode) =>
              renderNode(child, isRoot ? depth : depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return <div className="vscode-tree">{renderNode(root, 0)}</div>;
};

export default PropertySelector;
