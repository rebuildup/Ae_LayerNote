import React, { useState, useEffect, useCallback } from 'react';
import EditorContainer from './EditorContainer';
import { Note, NoteCategory, UpdateNoteRequest } from '../types/notes';
import '../styles/note-editor.scss';

interface NoteEditorProps {
  note: Note | null;
  categories: NoteCategory[];
  onSave: (updates: UpdateNoteRequest) => void;
  onClose: () => void;
  readOnly?: boolean;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  categories,
  onSave,
  onClose,
  readOnly = false,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [color, setColor] = useState<string | undefined>(undefined);
  const [tagInput, setTagInput] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Predefined colors for notes
  const noteColors = [
    '#007acc', // Blue
    '#4caf50', // Green
    '#ff9800', // Orange
    '#f44336', // Red
    '#9c27b0', // Purple
    '#607d8b', // Blue Grey
    '#795548', // Brown
    '#e91e63', // Pink
  ];

  // Initialize form when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category);
      setTags(note.tags || []);
      setColor(note.color);
      setIsDirty(false);
    } else {
      // Clear form for new note
      setTitle('');
      setContent('');
      setCategory(undefined);
      setTags([]);
      setColor(undefined);
      setIsDirty(false);
    }
  }, [note]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value);
      setIsDirty(true);
    },
    []
  );

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setCategory(e.target.value || undefined);
      setIsDirty(true);
    },
    []
  );

  const handleColorChange = useCallback((newColor: string) => {
    setColor(newColor);
    setIsDirty(true);
  }, []);

  const handleTagInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTagInput(e.target.value);
    },
    []
  );

  const handleTagInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const newTag = tagInput.trim().toLowerCase();
        if (newTag && !tags.includes(newTag)) {
          setTags([...tags, newTag]);
          setTagInput('');
          setIsDirty(true);
        }
      } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
        setTags(tags.slice(0, -1));
        setIsDirty(true);
      }
    },
    [tagInput, tags]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      setTags(tags.filter(tag => tag !== tagToRemove));
      setIsDirty(true);
    },
    [tags]
  );

  const handleSave = useCallback(() => {
    if (!note) return;

    const updates: UpdateNoteRequest = {
      id: note.id,
      title: title.trim() || 'Untitled Note',
      content,
      category,
      tags,
      color,
    };

    onSave(updates);
    setIsDirty(false);
  }, [note, title, content, category, tags, color, onSave]);

  const handleCancel = useCallback(() => {
    if (note) {
      // Reset to original values
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category);
      setTags(note.tags || []);
      setColor(note.color);
      setIsDirty(false);
    }
  }, [note]);

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'Unknown';
  };

  if (!note) {
    return (
      <div className="note-editor">
        <div className="no-note-selected">
          <p>Select a note to edit or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="note-editor">
      {/* Header */}
      <div className="note-editor-header">
        <div className="header-left">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Note title..."
            className="title-input"
            readOnly={readOnly}
          />
          <div className="note-info">
            <span className="note-category">{getCategoryName(category)}</span>
            <span className="note-dates">
              Created: {note.createdAt.toLocaleDateString()} | Updated:{' '}
              {note.updatedAt.toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="header-actions">
          {isDirty && !readOnly && (
            <>
              <button className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSave}>
                Save
              </button>
            </>
          )}
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="note-metadata">
        <div className="metadata-row">
          <div className="category-selector">
            <label>Category:</label>
            <select
              value={category || ''}
              onChange={handleCategoryChange}
              disabled={readOnly}
            >
              <option value="">Uncategorized</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="color-selector">
            <label>Color:</label>
            <div className="color-options">
              <button
                className={`color-option ${!color ? 'selected' : ''}`}
                onClick={() => handleColorChange('')}
                disabled={readOnly}
                title="Default"
              >
                <div className="color-swatch default" />
              </button>
              {noteColors.map(noteColor => (
                <button
                  key={noteColor}
                  className={`color-option ${
                    color === noteColor ? 'selected' : ''
                  }`}
                  onClick={() => handleColorChange(noteColor)}
                  disabled={readOnly}
                  title={noteColor}
                >
                  <div
                    className="color-swatch"
                    style={{ backgroundColor: noteColor }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="metadata-row">
          <div className="tags-editor">
            <label>Tags:</label>
            <div className="tags-container">
              <div className="tags-list">
                {tags.map(tag => (
                  <span key={tag} className="tag">
                    #{tag}
                    {!readOnly && (
                      <button
                        className="remove-tag"
                        onClick={() => removeTag(tag)}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {!readOnly && (
                <input
                  type="text"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Add tag..."
                  className="tag-input"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Editor */}
      <div className="note-content-editor">
        <EditorContainer
          title="Note Content"
          initialValue={content}
          language="plaintext"
          onSave={handleSave}
          onCancel={handleCancel}
          readOnly={readOnly}
        />
      </div>

      {/* Status */}
      <div className="note-editor-status">
        <div className="status-left">
          <span>Characters: {content.length}</span>
          <span>Lines: {content.split('\n').length}</span>
          {tags.length > 0 && <span>Tags: {tags.length}</span>}
        </div>
        <div className="status-right">
          {isDirty && <span className="dirty-indicator">Modified</span>}
          {note.pinned && <span className="pinned-indicator">📌 Pinned</span>}
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
