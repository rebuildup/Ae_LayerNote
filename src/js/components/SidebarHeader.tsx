import React from 'react';

type SidebarHeaderProps = {
  titleNode: React.ReactNode; // span or button (folder picker)
  rightActions?: React.ReactNode; // e.g., refresh, + button
};

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  titleNode,
  rightActions,
}) => {
  return (
    <div
      className="sidebar-header"
      style={{
        padding: '6px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* left gap is provided by margin-left on the title children to align with hamburger */}
        {titleNode}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {rightActions}
      </div>
    </div>
  );
};

export default SidebarHeader;
