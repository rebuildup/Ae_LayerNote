import { useState, useCallback, useRef, useEffect } from 'react';
import { ContextMenuItem } from '../components/ContextMenu';

interface ContextMenuState {
  visible: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
}

export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    position: { x: 0, y: 0 },
    items: [],
  });

  const targetRef = useRef<HTMLElement | null>(null);

  const showContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent, items: ContextMenuItem[]) => {
      event.preventDefault();
      event.stopPropagation();

      setContextMenu({
        visible: true,
        position: { x: event.clientX, y: event.clientY },
        items,
      });
    },
    []
  );

  const hideContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  const handleContextMenu = useCallback(
    (items: ContextMenuItem[]) => (event: React.MouseEvent) => {
      showContextMenu(event, items);
    },
    [showContextMenu]
  );

  // Auto-hide context menu on scroll or resize
  useEffect(() => {
    if (!contextMenu.visible) return;

    const handleScroll = () => hideContextMenu();
    const handleResize = () => hideContextMenu();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [contextMenu.visible, hideContextMenu]);

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
    handleContextMenu,
    targetRef,
  };
};
