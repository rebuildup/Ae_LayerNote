import React, { useCallback, useState } from 'react';
import NotesList from './NotesList';
import NoteEditor from './NoteEditor';
import { useNotesManager } from '../hooks/useNotesManager';
import { CreateNoteRequest, UpdateNoteRequest } from '../types/notes';
import '../styles/notes-manager.scss';

interface NotesManagerProps {
  className?: string;
}

const NotesManager: React.FC<NotesManagerProps> = ({ className = '' }) => {
  const {
    notes,
    categories,
    filter,
    selectedNoteId,
    isLoading,
    error,
    filteredNotes,
    selectedNote,
    createNote,
    updateNote,
    deleteNote,
    duplicateNote,
    selectNote,
    setFilter,
    clearError,
    exportNotes,
    importNotes,
    refreshNotes,
  } = useNotesManager();

  const [showImportExport, setShowImportExport] = useState(false);
  const [importData, setImportData] = useState('');

  const handleCreateNote = useCallback(() => {
    const request: CreateNoteRequest = {
      title: 'New Note',
      content: '',
    };
    createNote(request);
  }, [createNote]);

  const handleNoteSelect = useCallback(
    (noteId: string) => {
      selectNote(noteId);
    },
    [selectNote]
  );

  const handleNoteDelete = useCallback(
    (noteId: string) => {
      deleteNote(noteId);
    },
    [deleteNote]
  );

  const handleNoteDuplicate = useCallback(
    (noteId: string) => {
      duplicateNote(noteId);
    },
    [duplicateNote]
  );

  const handleNotePin = useCallback(
    (noteId: string, pinned: boolean) => {
      updateNote({ id: noteId, pinned });
    },
    [updateNote]
  );

  const handleNoteSave = useCallback(
    (updates: UpdateNoteRequest) => {
      updateNote(updates);
    },
    [updateNote]
  );

  const handleNoteClose = useCallback(() => {
    selectNote(null);
  }, [selectNote]);

  const handleExport = useCallback(() => {
    try {
      const exportedData = exportNotes();
      const blob = new Blob([exportedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Export failed: ${error}`);
    }
  }, [exportNotes]);

  const handleImport = useCallback(() => {
    if (!importData.trim()) {
      alert('Please paste the import data first');
      return;
    }

    const success = importNotes(importData);
    if (success) {
      setImportData('');
      setShowImportExport(false);
      alert('Notes imported successfully!');
    }
  }, [importNotes, importData]);

  const handleFileImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target?.result as string;
        if (content) {
          const success = importNotes(content);
          if (success) {
            alert('Notes imported successfully!');
          }
        }
      };
      reader.readAsText(file);
    },
    [importNotes]
  );

  if (isLoading) {
    return (
      <div className={`notes-manager ${className}`}>
        <div className="loading-state">
          <div className="loading-spinner">⟳</div>
          <span>Loading notes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`notes-manager ${className}`}>
      {/* Header */}
      <div className="notes-manager-header">
        <div className="header-left">
          <h2>Notes Manager</h2>
          <div className="notes-stats">
            <span>{notes.length} total notes</span>
            <span>{filteredNotes.length} visible</span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={refreshNotes}
            title="Refresh notes"
          >
            ↻
          </button>
          <button
            className="import-export-btn"
            onClick={() => setShowImportExport(!showImportExport)}
            title="Import/Export notes"
          >
            ⇅
          </button>
          <button
            className="create-note-btn primary"
            onClick={handleCreateNote}
            title="Create new note"
          >
            + New Note
          </button>
        </div>
      </div>

      {/* Import/Export Panel */}
      {showImportExport && (
        <div className="import-export-panel">
          <div className="panel-header">
            <h3>Import/Export Notes</h3>
            <button
              className="close-panel"
              onClick={() => setShowImportExport(false)}
            >
              ×
            </button>
          </div>

          <div className="panel-content">
            <div className="export-section">
              <h4>Export</h4>
              <p>Download all your notes as a JSON file</p>
              <button onClick={handleExport} className="export-btn">
                Export Notes
              </button>
            </div>

            <div className="import-section">
              <h4>Import</h4>
              <p>Import notes from a JSON file or paste JSON data</p>

              <div className="import-methods">
                <div className="file-import">
                  <label htmlFor="file-import" className="file-import-label">
                    Choose File
                  </label>
                  <input
                    id="file-import"
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="file-input"
                  />
                </div>

                <div className="text-import">
                  <textarea
                    value={importData}
                    onChange={e => setImportData(e.target.value)}
                    placeholder="Or paste JSON data here..."
                    className="import-textarea"
                  />
                  <button
                    onClick={handleImport}
                    disabled={!importData.trim()}
                    className="import-btn"
                  >
                    Import Notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={clearError} className="dismiss-error">
            ×
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="notes-manager-content">
        <div className="notes-sidebar">
          <NotesList
            notes={filteredNotes}
            categories={categories}
            filter={filter}
            selectedNoteId={selectedNoteId}
            onNoteSelect={handleNoteSelect}
            onNoteDelete={handleNoteDelete}
            onNoteDuplicate={handleNoteDuplicate}
            onNotePin={handleNotePin}
            onFilterChange={setFilter}
            onCreateNote={handleCreateNote}
          />
        </div>

        <div className="notes-editor-panel">
          <NoteEditor
            note={selectedNote}
            categories={categories}
            onSave={handleNoteSave}
            onClose={handleNoteClose}
          />
        </div>
      </div>
    </div>
  );
};

export default NotesManager;
