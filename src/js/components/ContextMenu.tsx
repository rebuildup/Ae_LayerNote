import React, { useEffect, useRef, useState } from 'react';
import '../styles/context-menu.scss';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  separator?: boolean;
  disabled?: boolean;
  action?: () => void;
  submenu?: ContextMenuItem[];
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
  visible: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ items, position, onClose, visible }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  useEffect(() => {
    if (!visible || !menuRef.current) return;
    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    let { x, y } = position;
    if (x + rect.width > viewport.width) x = viewport.width - rect.width - 10;
    if (y + rect.height > viewport.height) y = viewport.height - rect.height - 10;
    x = Math.max(10, x);
    y = Math.max(10, y);
    setAdjustedPosition({ x, y });
  }, [position, visible]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled || item.separator) return;
    item.action?.();
    onClose();
  };

  const renderMenuItem = (item: ContextMenuItem) => {
    if (item.separator) return <div key={item.id} className="context-menu-separator" />;
    return (
      <button
        key={item.id}
        type="button"
        className={`context-menu-item ${item.disabled ? 'context-menu-item--disabled' : ''}`}
        onClick={() => handleItemClick(item)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleItemClick(item);
          }
        }}
        disabled={!!item.disabled}
        role="menuitem"
      >
        {item.icon && <span className="context-menu-item__icon">{item.icon}</span>}
        <span className="context-menu-item__label">{item.label}</span>
        {item.shortcut && <span className="context-menu-item__shortcut">{item.shortcut}</span>}
        {item.submenu && <span className="context-menu-item__arrow">›</span>}
      </button>
    );
  };

  if (!visible) return null;
  return (
    <div ref={menuRef} className="context-menu" role="menu" style={{ left: adjustedPosition.x, top: adjustedPosition.y }}>
      {items.map(renderMenuItem)}
    </div>
  );
};

export default ContextMenu;

