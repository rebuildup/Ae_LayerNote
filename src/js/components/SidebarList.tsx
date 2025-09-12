import React from 'react';

export type SidebarRowProps = {
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  leftSlot?: React.ReactNode; // icon / chevron (16px width)
  rightSlot?: React.ReactNode; // meta text
  title?: string;
  children?: React.ReactNode; // main label text
};

export const SidebarRow: React.FC<SidebarRowProps> = ({
  selected,
  disabled,
  onClick,
  leftSlot,
  rightSlot,
  title,
  children,
}) => {
  return (
    <div
      className={`sidebar-row${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
      title={title}
      role={onClick ? 'button' : undefined}
    >
      <span className="row-left" aria-hidden>
        {leftSlot}
      </span>
      <span className="row-label">{children}</span>
      {rightSlot && <span className="row-right">{rightSlot}</span>}
    </div>
  );
};

type SidebarListProps = {
  children: React.ReactNode;
};

export const SidebarList: React.FC<SidebarListProps> = ({ children }) => {
  return <div className="sidebar-list">{children}</div>;
};

export default SidebarList;
