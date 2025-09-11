import { useState, useEffect, useCallback } from 'react';
import { useLayerOperations } from './useCEPBridge';
import { LayerInfo } from '../../shared/universals';

/**
 * Hook for managing layer selection and synchronization with After Effects
 */
export const useLayerSelection = () => {
  const { getSelectedLayers, isLoading, error } = useLayerOperations();
  const [selectedLayers, setSelectedLayers] = useState<LayerInfo[]>([]);
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Auto-sync with After Effects selection
  useEffect(() => {
    if (autoSync) {
      const interval = setInterval(() => {
        syncWithAfterEffects();
      }, 1000); // Check every second

      // Initial sync
      syncWithAfterEffects();

      return () => clearInterval(interval);
    }
  }, [autoSync]);

  const syncWithAfterEffects = useCallback(async () => {
    try {
      const layers = await getSelectedLayers();

      // Only update if selection actually changed
      const hasChanged =
        layers.length !== selectedLayers.length ||
        layers.some(
          (layer, index) =>
            !selectedLayers[index] || layer.id !== selectedLayers[index].id
        );

      if (hasChanged) {
        setSelectedLayers(layers);
        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error('Failed to sync layer selection:', error);
    }
  }, [getSelectedLayers, selectedLayers]);

  const manualSync = useCallback(async () => {
    await syncWithAfterEffects();
  }, [syncWithAfterEffects]);

  const updateSelectedLayers = useCallback((layers: LayerInfo[]) => {
    setSelectedLayers(layers);
    setLastSyncTime(new Date());
  }, []);

  const toggleAutoSync = useCallback(() => {
    setAutoSync(prev => !prev);
  }, []);

  const selectLayer = useCallback((layer: LayerInfo) => {
    setSelectedLayers(prev => {
      const exists = prev.find(l => l.id === layer.id);
      if (exists) {
        return prev; // Already selected
      }
      return [...prev, layer];
    });
  }, []);

  const deselectLayer = useCallback((layerId: string) => {
    setSelectedLayers(prev => prev.filter(l => l.id !== layerId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedLayers([]);
  }, []);

  const isLayerSelected = useCallback(
    (layerId: string) => {
      return selectedLayers.some(l => l.id === layerId);
    },
    [selectedLayers]
  );

  return {
    selectedLayers,
    isLoading,
    error,
    autoSync,
    lastSyncTime,
    syncWithAfterEffects: manualSync,
    updateSelectedLayers,
    toggleAutoSync,
    selectLayer,
    deselectLayer,
    clearSelection,
    isLayerSelected,
  };
};
