import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { cepBridge } from '../lib/cep-bridge';
import {
  Note,
  NoteCategory,
  NotesFilter,
  NotesState,
  CreateNoteRequest,
  UpdateNoteRequest,
  NotesStorageData,
} from '../types/notes';

const STORAGE_KEY = 'ae-code-editor-notes';
const STORAGE_VERSION = 1;

// File-system helpers using CEP fs if available
const fs = typeof window !== 'undefined' && (window as any).cep?.fs;
const pathJoin = (a: string, b: string) =>
  a.endsWith('/') || a.endsWith('\\') ? a + b : a + '/' + b;
const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9-_\s\.]/g, '_');

const DEFAULT_CATEGORIES: NoteCategory[] = [
  { id: 'general', name: 'General', color: '#007acc' },
  { id: 'ideas', name: 'Ideas', color: '#4caf50' },
  { id: 'todo', name: 'To Do', color: '#ff9800' },
  { id: 'bugs', name: 'Bugs', color: '#f44336' },
  { id: 'references', name: 'References', color: '#9c27b0' },
];

/**
 * Hook for managing temporary notes with CEP persistent storage
 */
export const useNotesManager = () => {
  const { settings } = useSettings();
  const [state, setState] = useState<NotesState>({
    notes: [],
    categories: DEFAULT_CATEGORIES,
    filter: {},
    selectedNoteId: null,
    isLoading: true,
    error: null,
  });

  // Load notes from storage on mount
  useEffect(() => {
    loadNotesFromStorage();
  }, []);

  // Auto-save notes when they change
  useEffect(() => {
    if (!state.isLoading) {
      saveNotesToStorage();
    }
  }, [state.notes, state.categories, state.isLoading]);

  const loadNotesFromStorage = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // FS-backed notes: read .md files from target folder
      let targetFolder: string | undefined = settings.notes?.folderPath;
      if (!targetFolder) {
        const info = await cepBridge.getProjectInfo();
        if (info.path) {
          // Use project folder
          targetFolder = info.path.replace(/\\[^\\/]+$/, '');
        }
      }

      if (fs && targetFolder) {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
        await new Promise<void>((resolve, reject) => {
          fs.readdir(targetFolder!, (err: any, files?: string[]) => {
            if (err) return reject(err);
            const mdFiles = (files || []).filter(f => /\.md$/i.test(f));
            const readTasks = mdFiles.map(
              fileName =>
                new Promise<Note>((res, rej) => {
                  fs.readFile(
                    pathJoin(targetFolder!, fileName),
                    (e: any, data?: string) => {
                      if (e) return rej(e);
                      const base = fileName.replace(/\.md$/i, '');
                      const now = new Date();
                      res({
                        id: `file_${fileName}`,
                        title: base,
                        content: data || '',
                        createdAt: now,
                        updatedAt: now,
                        pinned: false,
                      });
                    }
                  );
                })
            );
            Promise.all(readTasks)
              .then(notes => {
                setState(prev => ({
                  ...prev,
                  notes,
                  categories: prev.categories,
                  isLoading: false,
                }));
                resolve();
              })
              .catch(reject);
          });
        });
        return;
      }

      // Fallback to previous storage
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedData: NotesStorageData = JSON.parse(storedData);
        const notes = parsedData.notes.map(note => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }));
        setState(prev => ({
          ...prev,
          notes,
          categories: parsedData.categories || DEFAULT_CATEGORIES,
          isLoading: false,
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to load notes: ${error}`,
        isLoading: false,
      }));
    }
  }, []);

  const saveNotesToStorage = useCallback(async () => {
    try {
      // When FS is available and target folder set, write each note as markdown
      let targetFolder: string | undefined = settings.notes?.folderPath;
      if (!targetFolder) {
        const info = await cepBridge.getProjectInfo();
        if (info.path) targetFolder = info.path.replace(/\\[^\\/]+$/, '');
      }

      if (fs && targetFolder) {
        for (const note of state.notes) {
          const fileName = sanitizeFileName(
            `${note.title || 'Untitled Note'}.md`
          );
          await new Promise<void>((resolve, reject) =>
            fs.writeFile(
              pathJoin(targetFolder!, fileName),
              note.content || '',
              (err: any) => (err ? reject(err) : resolve())
            )
          );
        }
        return;
      }

      // Fallback to local storage snapshot
      const dataToSave: NotesStorageData = {
        notes: state.notes,
        categories: state.categories,
        version: STORAGE_VERSION,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save notes:', error);
      setState(prev => ({
        ...prev,
        error: `Failed to save notes: ${error}`,
      }));
    }
  }, [state.notes, state.categories, settings.notes]);

  const generateId = useCallback(() => {
    return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const createNote = useCallback(
    (request: CreateNoteRequest): Note => {
      const now = new Date();
      const newNote: Note = {
        id: generateId(),
        title: request.title || 'Untitled Note',
        content: request.content || '',
        category: request.category,
        tags: request.tags || [],
        color: request.color,
        createdAt: now,
        updatedAt: now,
        pinned: false,
      };

      setState(prev => ({
        ...prev,
        notes: [newNote, ...prev.notes],
        selectedNoteId: newNote.id,
      }));

      // Persist file if possible
      (async () => {
        try {
          let targetFolder: string | undefined = settings.notes?.folderPath;
          if (!targetFolder) {
            const info = await cepBridge.getProjectInfo();
            if (info.path) targetFolder = info.path.replace(/\\[^\\/]+$/, '');
          }
          if (fs && targetFolder) {
            const fileName = sanitizeFileName(`${newNote.title}.md`);
            await new Promise<void>((resolve, reject) =>
              fs.writeFile(
                pathJoin(targetFolder!, fileName),
                newNote.content || '',
                (err: any) => (err ? reject(err) : resolve())
              )
            );
          }
        } catch {
          /* noop */
        }
      })();

      return newNote;
    },
    [generateId, settings.notes]
  );

  const updateNote = useCallback((request: UpdateNoteRequest): boolean => {
    setState(prev => {
      const noteIndex = prev.notes.findIndex(note => note.id === request.id);
      if (noteIndex === -1) {
        return {
          ...prev,
          error: `Note with ID ${request.id} not found`,
        };
      }

      const updatedNotes = [...prev.notes];
      const existingNote = updatedNotes[noteIndex];

      updatedNotes[noteIndex] = {
        ...existingNote,
        title: request.title !== undefined ? request.title : existingNote.title,
        content:
          request.content !== undefined
            ? request.content
            : existingNote.content,
        category:
          request.category !== undefined
            ? request.category
            : existingNote.category,
        tags: request.tags !== undefined ? request.tags : existingNote.tags,
        color: request.color !== undefined ? request.color : existingNote.color,
        pinned:
          request.pinned !== undefined ? request.pinned : existingNote.pinned,
        updatedAt: new Date(),
      };

      return {
        ...prev,
        notes: updatedNotes,
        error: null,
      };
    });

    return true;
  }, []);

  const deleteNote = useCallback((noteId: string): boolean => {
    setState(prev => {
      const noteExists = prev.notes.some(note => note.id === noteId);
      if (!noteExists) {
        return {
          ...prev,
          error: `Note with ID ${noteId} not found`,
        };
      }

      return {
        ...prev,
        notes: prev.notes.filter(note => note.id !== noteId),
        selectedNoteId:
          prev.selectedNoteId === noteId ? null : prev.selectedNoteId,
        error: null,
      };
    });

    // Also remove file if FS available
    (async () => {
      try {
        let targetFolder: string | undefined = settings.notes?.folderPath;
        if (!targetFolder) {
          const info = await cepBridge.getProjectInfo();
          if (info.path) targetFolder = info.path.replace(/\\[^\\/]+$/, '');
        }
        if (fs && targetFolder) {
          const note = state.notes.find(n => n.id === noteId);
          if (note) {
            const fileName = sanitizeFileName(`${note.title}.md`);
            await new Promise<void>((resolve, reject) =>
              (window as any).cep.fs.deleteFile(
                pathJoin(targetFolder!, fileName),
                (err: any) => (err ? reject(err) : resolve())
              )
            );
          }
        }
      } catch {
        /* noop */
      }
    })();

    return true;
  }, []);

  const duplicateNote = useCallback(
    (noteId: string): Note | null => {
      const originalNote = state.notes.find(note => note.id === noteId);
      if (!originalNote) {
        setState(prev => ({
          ...prev,
          error: `Note with ID ${noteId} not found`,
        }));
        return null;
      }

      const duplicatedNote = createNote({
        title: `${originalNote.title} (Copy)`,
        content: originalNote.content,
        category: originalNote.category,
        tags: originalNote.tags,
        color: originalNote.color,
      });

      return duplicatedNote;
    },
    [state.notes, createNote]
  );

  const selectNote = useCallback((noteId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedNoteId: noteId,
    }));
  }, []);

  const setFilter = useCallback((filter: NotesFilter) => {
    setState(prev => ({
      ...prev,
      filter,
    }));
  }, []);

  const clearFilter = useCallback(() => {
    setState(prev => ({
      ...prev,
      filter: {},
    }));
  }, []);

  const createCategory = useCallback((name: string, color: string) => {
    const newCategory: NoteCategory = {
      id: `category_${Date.now()}`,
      name,
      color,
    };

    setState(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }));

    return newCategory;
  }, []);

  const updateCategory = useCallback(
    (categoryId: string, updates: Partial<NoteCategory>) => {
      setState(prev => ({
        ...prev,
        categories: prev.categories.map(cat =>
          cat.id === categoryId ? { ...cat, ...updates } : cat
        ),
      }));
    },
    []
  );

  const deleteCategory = useCallback((categoryId: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.id !== categoryId),
      // Remove category from notes
      notes: prev.notes.map(note =>
        note.category === categoryId ? { ...note, category: undefined } : note
      ),
    }));
  }, []);

  const getFilteredNotes = useCallback(() => {
    let filtered = [...state.notes];

    // Apply category filter
    if (state.filter.category) {
      filtered = filtered.filter(
        note => note.category === state.filter.category
      );
    }

    // Apply tags filter
    if (state.filter.tags && state.filter.tags.length > 0) {
      filtered = filtered.filter(note =>
        state.filter.tags!.some(tag => note.tags?.includes(tag))
      );
    }

    // Apply search query
    if (state.filter.searchQuery) {
      const query = state.filter.searchQuery.toLowerCase();
      filtered = filtered.filter(
        note =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply pinned filter
    if (state.filter.showPinnedOnly) {
      filtered = filtered.filter(note => note.pinned);
    }

    // Sort by pinned first, then by updated date
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    return filtered;
  }, [state.notes, state.filter]);

  const getSelectedNote = useCallback(() => {
    return state.notes.find(note => note.id === state.selectedNoteId) || null;
  }, [state.notes, state.selectedNoteId]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const exportNotes = useCallback(() => {
    const exportData = {
      notes: state.notes,
      categories: state.categories,
      exportedAt: new Date().toISOString(),
      version: STORAGE_VERSION,
    };

    return JSON.stringify(exportData, null, 2);
  }, [state.notes, state.categories]);

  const importNotes = useCallback(
    (jsonData: string) => {
      try {
        const importData = JSON.parse(jsonData);

        if (!importData.notes || !Array.isArray(importData.notes)) {
          throw new Error('Invalid notes data format');
        }

        const importedNotes = importData.notes.map((note: any) => ({
          ...note,
          id: generateId(), // Generate new IDs to avoid conflicts
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }));

        setState(prev => ({
          ...prev,
          notes: [...importedNotes, ...prev.notes],
          categories: importData.categories || prev.categories,
        }));

        return true;
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: `Failed to import notes: ${error}`,
        }));
        return false;
      }
    },
    [generateId]
  );

  return {
    // State
    notes: state.notes,
    categories: state.categories,
    filter: state.filter,
    selectedNoteId: state.selectedNoteId,
    isLoading: state.isLoading,
    error: state.error,

    // Computed values
    filteredNotes: getFilteredNotes(),
    selectedNote: getSelectedNote(),

    // Actions
    createNote,
    updateNote,
    deleteNote,
    duplicateNote,
    selectNote,
    setFilter,
    clearFilter,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
    exportNotes,
    importNotes,
    refreshNotes: loadNotesFromStorage,
  };
};
