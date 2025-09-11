import React, { useState, useCallback } from 'react';
import { Note, NoteCategory, NotesFilter } from '../types/notes';
import '../styles/notes-list.scss';

interface NotesListProps {
  notes: Note[];
  categories: NoteCategory[];
  filter: NotesFilter;
  selectedNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
  onNoteDelete: (noteId: string) => void;
  onNoteDuplicate: (noteId: string) => void;
  onNotePin: (noteId: string, pinned: boolean) => void;
  onFilterChange: (filter: NotesFilter) => void;
  onCreateNote: () => void;
}

const NotesList: React.FC<NotesListProps> = ({
  notes,
  categories,
  filter,
  selectedNoteId,
  onNoteSelect,
  onNoteDelete,
  onNoteDuplicate,
  onNotePin,
  onFilterChange,
  onCreateNote,
}) => {
  const [searchQuery, setSearchQuery] = useState(filter.searchQuery || '');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      onFilterChange({ ...filter, searchQuery: query || undefined });
    },
    [filter, onFilterChange]
  );

  const handleCategoryFilter = useCallback(
    (categoryId: string | undefined) => {
      onFilterChange({ ...filter, category: categoryId });
    },
    [filter, onFilterChange]
  );

  const handlePinnedFilter = useCallback(() => {
    onFilterChange({
      ...filter,
      showPinnedOnly: !filter.showPinnedOnly,
    });
  }, [filter, onFilterChange]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    onFilterChange({});
  }, [onFilterChange]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
      }
      return `${hours}h ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getCategoryColor = (categoryId?: string) => {
    if (!categoryId) return '#666666';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || '#666666';
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown';
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="notes-list">
      {/* Header */}
      <div className="notes-list-header">
        <div className="header-top">
          <h3>Notes ({notes.length})</h3>
          <div className="header-actions">
            <button
              className="filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
              title="Toggle filters"
            >
              🔍
            </button>
            <button
              className="create-note-btn"
              onClick={onCreateNote}
              title="Create new note"
            >
              +
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          {(searchQuery || filter.category || filter.showPinnedOnly) && (
            <button className="clear-search" onClick={clearFilters}>
              ×
            </button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Category:</label>
              <select
                value={filter.category || ''}
                onChange={e =>
                  handleCategoryFilter(e.target.value || undefined)
                }
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filter.showPinnedOnly || false}
                  onChange={handlePinnedFilter}
                />
                <span>Pinned only</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Notes list */}
      <div className="notes-list-content">
        {notes.length === 0 ? (
          <div className="empty-state">
            <p>No notes found</p>
            <button onClick={onCreateNote} className="create-first-note">
              Create your first note
            </button>
          </div>
        ) : (
          <div className="notes-grid">
            {notes.map(note => (
              <div
                key={note.id}
                className={`note-card ${
                  selectedNoteId === note.id ? 'selected' : ''
                } ${note.pinned ? 'pinned' : ''}`}
                onClick={() => onNoteSelect(note.id)}
                style={{
                  borderLeftColor:
                    note.color || getCategoryColor(note.category),
                }}
              >
                <div className="note-header">
                  <h4 className="note-title" title={note.title}>
                    {note.title}
                  </h4>
                  <div className="note-actions">
                    <button
                      className={`pin-btn ${note.pinned ? 'pinned' : ''}`}
                      onClick={e => {
                        e.stopPropagation();
                        onNotePin(note.id, !note.pinned);
                      }}
                      title={note.pinned ? 'Unpin note' : 'Pin note'}
                    >
                      📌
                    </button>
                    <button
                      className="duplicate-btn"
                      onClick={e => {
                        e.stopPropagation();
                        onNoteDuplicate(note.id);
                      }}
                      title="Duplicate note"
                    >
                      📋
                    </button>
                    <button
                      className="delete-btn"
                      onClick={e => {
                        e.stopPropagation();
                        if (
                          confirm(
                            `Are you sure you want to delete "${note.title}"?`
                          )
                        ) {
                          onNoteDelete(note.id);
                        }
                      }}
                      title="Delete note"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="note-content">
                  <p>{truncateContent(note.content)}</p>
                </div>

                <div className="note-footer">
                  <div className="note-meta">
                    <span
                      className="note-category"
                      style={{ color: getCategoryColor(note.category) }}
                    >
                      {getCategoryName(note.category)}
                    </span>
                    <span className="note-date">
                      {formatDate(note.updatedAt)}
                    </span>
                  </div>

                  {note.tags && note.tags.length > 0 && (
                    <div className="note-tags">
                      {note.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="note-tag">
                          #{tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="note-tag-more">
                          +{note.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesList;
