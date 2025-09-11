import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import NotesList from './NotesList';
import NoteEditor from './NoteEditor';
import { useNotesManager } from '../hooks/useNotesManager';
import { CreateNoteRequest, UpdateNoteRequest } from '../types/notes';
import { useSettings } from '../contexts/SettingsContext';
import { cepBridge } from '../lib/cep-bridge';
import { fsBridge, sanitizeFileName } from '../lib/fs-bridge';
import '../styles/notes-manager.scss';

interface NotesManagerProps {
  className?: string;
}

const NotesManager: React.FC<NotesManagerProps> = ({ className = '' }) => {
  const { settings } = useSettings();
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
  // File explorer state
  const [rootDir, setRootDir] = useState<string>('');
  const [entries, setEntries] = useState<string[]>([]);
  const [openTabs, setOpenTabs] = useState<string[]>([]); // file paths
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isFSLoading, setIsFSLoading] = useState(false);

  const resolveRoot = useCallback(async () => {
    if (settings.notes?.folderPath && settings.notes.folderPath.trim()) {
      return settings.notes.folderPath.trim();
    }
    const info = await cepBridge.getProjectInfo();
    if (info.path) return info.path.replace(/\\[^\\/]+$/, '');
    return '';
  }, [settings.notes]);

  const refreshExplorer = useCallback(async () => {
    setIsFSLoading(true);
    try {
      const dir = await resolveRoot();
      setRootDir(dir);
      if (dir) {
        const files = await fsBridge.readdir(dir);
        setEntries(files);
      } else {
        setEntries([]);
      }
    } finally {
      setIsFSLoading(false);
    }
  }, [resolveRoot]);

  useEffect(() => {
    refreshExplorer();
  }, [refreshExplorer]);

  const mdFiles = useMemo(
    () => entries.filter(f => /\.md$/i.test(f)),
    [entries]
  );

  const openFileInTab = useCallback(
    async (fileName: string) => {
      if (!rootDir) return;
      const fullPath = fsBridge.join(rootDir, fileName);
      if (!openTabs.includes(fullPath)) {
        setOpenTabs(prev => [...prev, fullPath]);
      }
      setActiveTab(fullPath);
    },
    [rootDir, openTabs]
  );

  const closeTab = useCallback((path: string) => {
    setOpenTabs(prev => prev.filter(p => p !== path));
    setActiveTab(prev => (prev === path ? null : prev));
  }, []);

  const handleCreateMarkdown = useCallback(async () => {
    if (!rootDir) return;
    const base = 'New Note';
    let name = `${base}.md`;
    let idx = 1;
    while (entries.includes(name)) {
      name = `${base} ${idx++}.md`;
    }
    const safe = sanitizeFileName(name);
    await fsBridge.writeFile(fsBridge.join(rootDir, safe), '');
    await refreshExplorer();
    openFileInTab(safe);
  }, [rootDir, entries, refreshExplorer, openFileInTab]);

  const handleCreateFolder = useCallback(async () => {
    if (!rootDir) return;
    const base = 'New Folder';
    let name = base;
    let idx = 1;
    while (entries.includes(name)) {
      name = `${base} ${idx++}`;
    }
    const safe = sanitizeFileName(name);
    await fsBridge.makeDir(fsBridge.join(rootDir, safe));
    await refreshExplorer();
  }, [rootDir, entries, refreshExplorer]);

  const handleDeletePath = useCallback(
    async (fileName: string) => {
      if (!rootDir) return;
      if (!confirm(`Delete "${fileName}"?`)) return;
      const fullPath = fsBridge.join(rootDir, fileName);
      await fsBridge.deletePath(fullPath);
      setOpenTabs(prev => prev.filter(p => p !== fullPath));
      if (activeTab === fullPath) setActiveTab(null);
      await refreshExplorer();
    },
    [rootDir, activeTab, refreshExplorer]
  );

  const handleRenamePath = useCallback(
    async (oldName: string, newNameRaw: string) => {
      if (!rootDir) return;
      const newName = sanitizeFileName(newNameRaw || oldName);
      if (newName === oldName) return;
      const oldPath = fsBridge.join(rootDir, oldName);
      const newPath = fsBridge.join(rootDir, newName);
      // CEP fs might not have rename; emulate via read/write/delete
      const data = await fsBridge.readFile(oldPath);
      await fsBridge.writeFile(newPath, data);
      await fsBridge.deletePath(oldPath);
      setOpenTabs(prev => prev.map(p => (p === oldPath ? newPath : p)));
      if (activeTab === oldPath) setActiveTab(newPath);
      await refreshExplorer();
    },
    [rootDir, activeTab, refreshExplorer]
  );

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
          <div className="loading-spinner" aria-hidden="true">
            <LoaderCircle size={16} />
          </div>
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
            className="create-folder-btn"
            onClick={handleCreateFolder}
            title="New Folder"
          >
            📁
          </button>
          <button
            className="create-file-btn"
            onClick={handleCreateMarkdown}
            title="New Markdown"
          >
            📄
          </button>
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
          {/* File explorer (project folder) */}
          <div className="file-explorer">
            <div className="explorer-header">
              <span
                className="root-path"
                title={rootDir || 'No project folder'}
              >
                {rootDir || 'No project folder'}
              </span>
              <button
                className="explorer-refresh"
                onClick={refreshExplorer}
                disabled={isFSLoading}
              >
                ↻
              </button>
            </div>
            <div className="explorer-content">
              {isFSLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner" aria-hidden="true">
                    <LoaderCircle size={16} />
                  </div>
                  <span>Loading files...</span>
                </div>
              ) : mdFiles.length === 0 ? (
                <div className="empty-state">
                  <p>No markdown files</p>
                </div>
              ) : (
                <ul className="file-list">
                  {mdFiles.map(name => (
                    <li key={name} className="file-item">
                      <button
                        className="file-name"
                        onClick={() => openFileInTab(name)}
                        title={name}
                      >
                        {name}
                      </button>
                      <div className="file-actions">
                        <button
                          className="rename"
                          onClick={() => {
                            const nn = prompt('Rename to:', name) || name;
                            handleRenamePath(name, nn);
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          className="delete"
                          onClick={() => handleDeletePath(name)}
                        >
                          🗑️
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

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
          {/* Open file tabs */}
          {openTabs.length > 0 && (
            <div className="file-tabs">
              {openTabs.map(p => (
                <div
                  key={p}
                  className={`file-tab ${activeTab === p ? 'active' : ''}`}
                  onClick={() => setActiveTab(p)}
                >
                  <span className="tab-name" title={p}>
                    {p.split(/\\|\//).pop()}
                  </span>
                  <button
                    className="tab-close"
                    onClick={e => {
                      e.stopPropagation();
                      closeTab(p);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* If a file tab is active, show its content in NoteEditor-like viewer */}
          {/* For MVP we open as a temporary note in memory; full sync can be added later */}
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
