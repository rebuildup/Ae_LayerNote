import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileText,
  Settings,
  Terminal,
  Code,
  MessageSquare,
  StickyNote,
} from 'lucide-react';
import '../styles/command-palette.scss';

interface Command {
  id: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  category: string;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand?: (command: Command) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onCommand,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: Command[] = [
    // File operations
    {
      id: 'new-file',
      title: 'New File',
      description: 'Create a new file',
      icon: FileText,
      action: () => console.log('New file'),
      category: 'File',
      shortcut: 'Ctrl+N',
    },
    {
      id: 'open-file',
      title: 'Open File',
      description: 'Open an existing file',
      icon: FileText,
      action: () => console.log('Open file'),
      category: 'File',
      shortcut: 'Ctrl+O',
    },
    {
      id: 'save',
      title: 'Save',
      description: 'Save the current file',
      icon: FileText,
      action: () => console.log('Save'),
      category: 'File',
      shortcut: 'Ctrl+S',
    },

    // View operations
    {
      id: 'expression-editor',
      title: 'Expression Editor',
      description: 'Switch to expression editor mode',
      icon: Code,
      action: () => console.log('Expression editor'),
      category: 'View',
      shortcut: 'Ctrl+1',
    },
    {
      id: 'layer-comments',
      title: 'Layer Comments',
      description: 'Switch to layer comments mode',
      icon: MessageSquare,
      action: () => console.log('Layer comments'),
      category: 'View',
      shortcut: 'Ctrl+2',
    },
    {
      id: 'notes',
      title: 'Notes',
      description: 'Switch to notes mode',
      icon: StickyNote,
      action: () => console.log('Notes'),
      category: 'View',
      shortcut: 'Ctrl+3',
    },

    // Settings
    {
      id: 'settings',
      title: 'Settings',
      description: 'Open settings',
      icon: Settings,
      action: () => console.log('Settings'),
      category: 'Preferences',
      shortcut: 'Ctrl+,',
    },

    // Terminal
    {
      id: 'terminal',
      title: 'Terminal',
      description: 'Open integrated terminal',
      icon: Terminal,
      action: () => console.log('Terminal'),
      category: 'View',
      shortcut: 'Ctrl+`',
    },
  ];

  const filteredCommands = commands.filter(
    command =>
      command.title.toLowerCase().includes(query.toLowerCase()) ||
      command.description?.toLowerCase().includes(query.toLowerCase()) ||
      command.category.toLowerCase().includes(query.toLowerCase())
  );

  const groupedCommands = filteredCommands.reduce(
    (groups, command) => {
      const category = command.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(command);
      return groups;
    },
    {} as Record<string, Command[]>
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onCommand?.(filteredCommands[selectedIndex]);
            onClose();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose, onCommand]);

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <div className="command-palette__header">
          <div className="command-palette__search">
            <Search size={16} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="command-palette__input"
            />
          </div>
        </div>

        <div className="command-palette__content" ref={listRef}>
          {Object.entries(groupedCommands).map(
            ([category, categoryCommands]) => (
              <div key={category} className="command-palette__group">
                <div className="command-palette__group-title">{category}</div>
                {categoryCommands.map((command, _index) => {
                  const globalIndex = filteredCommands.indexOf(command);
                  return (
                    <div
                      key={command.id}
                      className={`command-palette__item ${
                        globalIndex === selectedIndex ? 'selected' : ''
                      }`}
                      onClick={() => {
                        command.action();
                        onCommand?.(command);
                        onClose();
                      }}
                    >
                      <div className="command-palette__item-icon">
                        {command.icon && <command.icon size={16} />}
                      </div>
                      <div className="command-palette__item-content">
                        <div className="command-palette__item-title">
                          {command.title}
                        </div>
                        {command.description && (
                          <div className="command-palette__item-description">
                            {command.description}
                          </div>
                        )}
                      </div>
                      {command.shortcut && (
                        <div className="command-palette__item-shortcut">
                          {command.shortcut}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}

          {filteredCommands.length === 0 && (
            <div className="command-palette__empty">
              No commands found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
