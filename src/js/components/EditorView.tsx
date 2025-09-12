import React, { useState, useCallback } from 'react';
import { useAppContext, useCurrentMode } from '../contexts/AppContext';
import MonacoEditor from './MonacoEditor';
import { fsBridge } from '../lib/fs-bridge';
import { selectFolder as boltSelectFolder } from '../lib/utils/bolt';
import { cepBridge } from '../lib/cep-bridge';
import {
  FileText,
  Shapes,
  Type as TypeIcon,
  Camera,
  SunMedium,
  Wand2,
  Square,
  File,
  Code,
  MessageSquare,
  StickyNote,
  Settings,
  Undo,
  Redo,
  Save,
  Menu,
} from 'lucide-react';
import { useLayerOperations, useExpressionOperations } from '../hooks/useCEPBridge';
import type { LayerInfo } from '../../shared/universals';
import '../styles/simple-editor-layout.scss';
import PropertySelector from './PropertySelector';
import type { PropertySelection } from '../types/expression';
import { SidebarList, SidebarRow } from './SidebarList';
import SidebarHeader from './SidebarHeader';
import '../styles/sidebar-list.scss';

const SimpleEditorLayout: React.FC = () => {
  const { setMode, openModal, undo, redo, canUndo, canRedo } = useAppContext();
  const currentMode = useCurrentMode();
  const [editorValue, setEditorValue] = useState(
    '// After Effects Expression Editor\n// Write your expressions here...\n\n'
  );

  // Layer selection + comments via CEP bridge (avoid broken useLayerSelection)
  const { getSelectedLayers, getLayerComment, setLayerComment } =
    useLayerOperations();
  const [selectedLayers, setSelectedLayers] = useState<LayerInfo[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [layerComment, setLayerCommentText] = useState('');
  const [baselineComment, setBaselineComment] = useState('');
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isSavingComment, setIsSavingComment] = useState(false);

  // Explorer + Tabs (for Notes files)
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [rootDir, setRootDir] = useState<string>('');
  const [entries, setEntries] = useState<string[]>([]);
  const [isFSLoading, setIsFSLoading] = useState(false);
  const [explorerWidth, setExplorerWidth] = useState<number>(260);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTabPath, setActiveTabPath] = useState<string | null>(null);
  const [isEditorFocused, setIsEditorFocused] = useState<boolean>(false);
  // Expression mode state
  const { getPropertyExpression, setPropertyExpression } =
    useExpressionOperations();
  const [selectedProperty, setSelectedProperty] =
    useState<PropertySelection | null>(null);
  const [expressionText, setExpressionText] = useState<string>('');
  const [expressionBaseline, setExpressionBaseline] = useState<string>('');

  // Comment mode: tabs for all layers in active comp
  const [allLayers, setAllLayers] = useState<LayerInfo[]>([]);
  const [activeCompName, setActiveCompName] = useState<string>('');
  const lastAeSelectionSignatureRef = React.useRef<string>('');

  const resolveProjectRoot = React.useCallback(async () => {
    try {
      const info = await cepBridge.getProjectInfo();

      if (info.path) {
        const base = info.path.replace(/\\[^\\/]+$/, '');

        return base;
      }
    } catch {
      /* noop */
    }
    return '';
  }, []);

  const refreshExplorer = React.useCallback(async () => {
    setIsFSLoading(true);
    try {
      const dir = await resolveProjectRoot();
      setRootDir(dir);
      if (dir) {
        let files: string[] = [];
        try {
          const scan = await cepBridge.scanFolder(dir);
          files = scan && scan.success ? scan.files || [] : [];
        } catch {
          /* noop */
        }
        if (files.length === 0) {
          try {
            files = await fsBridge.readdir(dir);
          } catch {
            /* noop */
          }
        }
        setEntries(files || []);
      } else {
        // Ask user to pick a folder as fallback using bolt.selectFolder (decodes file://)

        const picked = await new Promise<string | null>(resolve => {
          try {
            boltSelectFolder('', 'Select notes folder', (path: string) =>
              resolve(path)
            );
          } catch {
            resolve(null);
          }
        });
        if (picked) {
          setRootDir(picked);
          try {
            let files: string[] = [];
            try {
              const scan = await cepBridge.scanFolder(picked);
              files = scan && scan.success ? scan.files || [] : [];
            } catch {
              /* noop */
            }
            if (files.length === 0) {
              try {
                files = await fsBridge.readdir(picked);
              } catch {
                /* noop */
              }
            }
            setEntries(files || []);
          } catch (e) {
            setEntries([]);
          }
        } else {
          setEntries([]);
        }
      }
    } finally {
      setIsFSLoading(false);
    }
  }, [resolveProjectRoot]);

  const pickNotesFolder = React.useCallback(async (): Promise<
    string | null
  > => {
    const picked = await new Promise<string | null>(resolve => {
      try {
        boltSelectFolder('', 'Select notes folder', (path: string) =>
          resolve(path)
        );
      } catch {
        resolve(null);
      }
    });
    if (picked) {
      setRootDir(picked);
      try {
        const files = await fsBridge.readdir(picked);
        setEntries(files);
      } catch {
        setEntries([]);
      }
    }
    return picked;
  }, []);

  // createNoteFile / renameNoteFile are defined after openFileTab to avoid TDZ issues

  React.useEffect(() => {
    // Load explorer entries on first open
    if (isExplorerOpen && !rootDir) {
      refreshExplorer();
    }
  }, [isExplorerOpen, rootDir, refreshExplorer]);

  // Poll active composition name
  React.useEffect(() => {
    const load = async () => {
      try {
        const info = await cepBridge.getProjectInfo();
        if (info) {
          setActiveCompName((info as any).activeItemName || info.name || '');
        }
      } catch {
        // ignore
      }
    };
    load();
    const timer = setInterval(load, 2000);
    return () => clearInterval(timer);
  }, []);

  // Explorer resizer handlers
  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(180, Math.min(520, e.clientX));
      setExplorerWidth(newWidth);
    };
    const onUp = () => setIsResizing(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isResizing]);

  // Poll AE selection (only override local activeLayerId when AE selection actually changes)
  React.useEffect(() => {
    let isMounted = true;
    const sync = async () => {
      try {
        const layers = await getSelectedLayers();
        if (!isMounted) return;
        setSelectedLayers(layers);

        const signature = layers.map(l => l.id).join(',');
        const prevSig = lastAeSelectionSignatureRef.current;
        const aeChanged = signature !== prevSig;
        if (aeChanged) {
          lastAeSelectionSignatureRef.current = signature;
          if (layers.length > 0) {
            const stillValid = layers.find(l => l.id === activeLayerId);
            const nextId = stillValid ? activeLayerId : layers[0].id;
            if (nextId !== activeLayerId) {
              setActiveLayerId(nextId);
            }
          } else {
            setActiveLayerId(null);
            setLayerCommentText('');
          }
        }
      } catch (_) {
        // ignore
      }
    };

    // Initial + interval
    sync();
    const interval = setInterval(sync, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [getSelectedLayers, activeLayerId]);

  // Load comment when active layer changes
  React.useEffect(() => {
    const load = async () => {
      if (!activeLayerId) return;
      setIsCommentLoading(true);
      try {
        const comment = await getLayerComment(activeLayerId);
        const text = comment || '';
        setLayerCommentText(text);
        setBaselineComment(text);
      } catch (_) {
        setLayerCommentText('');
        setBaselineComment('');
      } finally {
        setIsCommentLoading(false);
      }
    };
    load();
  }, [activeLayerId, getLayerComment]);

  const handleEditorChange = useCallback(
    (value: string) => {
      if (currentMode === 'comment') {
        setLayerCommentText(value);
      } else if (currentMode === 'expression') {
        // Prevent editing when selected property is read-only
        if (
          selectedProperty &&
          (selectedProperty as any).canSetExpression === false
        ) {
          return;
        }
        setExpressionText(value);
      } else {
        setEditorValue(value);
      }
    },
    [currentMode, selectedProperty]
  );

  const handleSave = useCallback(async () => {
    if (currentMode === 'comment') {
      if (!activeLayerId) return;
      const locked = allLayers.find(l => l.id === activeLayerId)?.locked;
      if (locked) {
        // Prevent saving when the layer is locked
        return;
      }
      setIsSavingComment(true);
      try {
        await setLayerComment(activeLayerId, layerComment);
        setBaselineComment(layerComment);
        // previously updated saveStatus; now rely on isSavingComment only
      } finally {
        setIsSavingComment(false);
      }
      return;
    }
    if (currentMode === 'expression') {
      if (!selectedProperty) return;
      if ((selectedProperty as any).canSetExpression === false) return;
      try {
        await setPropertyExpression(
          selectedProperty.propertyPath,
          expressionText
        );
        // Re-fetch to confirm
        try {
          const refreshed = await getPropertyExpression(
            selectedProperty.propertyPath
          );
          const next = refreshed || '';
          setExpressionText(next);
          setExpressionBaseline(next);
        } catch {
          // keep current text; baseline not updated
        }
      } catch {
        /* noop */
      }
      return;
    }
    if (currentMode === 'note') {
      if (!activeTabPath) return;
      const isFileTab =
        !activeTabPath.startsWith('layer://') &&
        !activeTabPath.startsWith('prop://');
      if (!isFileTab) return;
      try {
        const wr = await cepBridge.writeTextFile(activeTabPath, editorValue);
        if (!wr || !wr.success) {
          await fsBridge.writeFile(activeTabPath, editorValue);
        }
      } catch (e) {
        try {
          await fsBridge.writeFile(activeTabPath, editorValue);
        } catch {
          /* noop */
        }
      }
      return;
    }
    // For other modes (notes placeholder)
    console.log('Saving...', editorValue);
  }, [
    currentMode,
    activeLayerId,
    layerComment,
    editorValue,
    setLayerComment,
    selectedProperty,
    expressionText,
    setPropertyExpression,
    activeTabPath,
  ]);

  const modes = [
    {
      id: 'expression' as const,
      label: 'Expressions',
      icon: Code,
      tooltip: 'Edit After Effects expressions (Ctrl+1)',
    },
    {
      id: 'comment' as const,
      label: 'Comments',
      icon: MessageSquare,
      tooltip: 'Manage layer comments (Ctrl+2)',
    },
    {
      id: 'note' as const,
      label: 'Notes',
      icon: StickyNote,
      tooltip: 'Create and organize notes (Ctrl+3)',
    },
  ];

  const getEditorLanguage = () => {
    switch (currentMode) {
      case 'expression':
        return 'javascript';
      case 'comment':
        return 'markdown';
      case 'note':
        return 'markdown';
      default:
        return 'javascript';
    }
  };

  const getEditorPlaceholder = () => {
    switch (currentMode) {
      case 'expression':
        return '// Select a layer property from the side panel to load its expression.\n// Edit here and press Ctrl+S to apply to the selected property.\n';
      case 'comment':
        if (!activeLayerId) {
          return '# No layer selected\n\nSelect a layer in After Effects to edit its comment.';
        }
        {
          const layerName =
            selectedLayers.find(l => l.id === activeLayerId)?.name || '';
          return `# Comment for ${layerName}\n\nEdit the comment in this editor. Use Ctrl+S to save.`;
        }
      case 'note':
        return '# Notes\n\nUse the Notes panel to manage markdown files.';
      default:
        return '// After Effects Expression Editor\n// Write your expressions here...\n\n';
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't interfere with IME composition (e.g., Japanese input)
      if ((event as any).isComposing || event.key === 'Process') {
        return;
      }

      // If focused inside Monaco editor, avoid handling mode/undo/redo shortcuts here
      const target = event.target as HTMLElement | null;
      const inMonaco = !!target?.closest('.monaco-editor');

      // Mode switching shortcuts
      if (!inMonaco && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            setMode('expression');
            break;
          case '2':
            event.preventDefault();
            setMode('comment');
            break;
          case '3':
            event.preventDefault();
            setMode('note');
            break;
        }
      }

      // Settings shortcut
      if ((event.ctrlKey || event.metaKey) && event.key === ',') {
        event.preventDefault();
        openModal('settings');
      }

      // Save shortcut
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSave();
        return;
      }

      // Undo/Redo shortcuts (handled by Monaco but also available globally)
      if (
        !inMonaco &&
        (event.ctrlKey || event.metaKey) &&
        event.key === 'z' &&
        !event.shiftKey
      ) {
        if (canUndo) {
          event.preventDefault();
          undo();
        }
      }
      if (
        !inMonaco &&
        (((event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          event.key === 'Z') ||
          ((event.ctrlKey || event.metaKey) && event.key === 'y'))
      ) {
        if (canRedo) {
          event.preventDefault();
          redo();
        }
      }
    },
    [setMode, openModal, undo, redo, canUndo, canRedo, handleSave]
  );

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Update editor content when mode changes
  React.useEffect(() => {
    setEditorValue(getEditorPlaceholder());
  }, [currentMode]);

  // const isModeUnavailable = false; // unused

  // Ensure the side panel is open in expression mode
  React.useEffect(() => {
    if (currentMode === 'expression' || currentMode === 'note') {
      setIsExplorerOpen(true);
    }
  }, [currentMode]);

  const isDirty = currentMode === 'comment' && layerComment !== baselineComment;
  const isExpressionDirty =
    currentMode === 'expression' && expressionText !== expressionBaseline;

  const noteFiles = React.useMemo(
    () =>
      entries.map(name => {
        try {
          return decodeURIComponent(name);
        } catch {
          return name;
        }
      }),
    [entries]
  );
  const openFileTab = React.useCallback(
    async (fileName: string) => {
      if (!rootDir) return;
      const full = fsBridge.join(rootDir, fileName);
      setMode('note');
      setOpenTabs(prev => (prev.includes(full) ? prev : [...prev, full]));
      setActiveTabPath(full);
      try {
        const content = await fsBridge.readFile(full);
        setEditorValue(content || '');
      } catch {
        setEditorValue('');
      }
    },
    [rootDir, setMode]
  );
  // const closeFileTab = React.useCallback((path: string) => {
  //   setOpenTabs(prev => prev.filter(p => p !== path));
  //   setActiveTabPath(prev => (prev === path ? null : prev));
  // }, []);

  const createNoteFile = React.useCallback(async () => {
    try {
      await cepBridge.debugAlert?.('CreateNote: start');
      let dir = rootDir;
      if (!dir) {
        const picked = await pickNotesFolder();
        dir = picked || rootDir;
        if (!dir) {
          await cepBridge.debugAlert?.('CreateNote: no dir');
          return;
        }
      }
      await cepBridge.debugAlert?.('CreateNote: dir=' + dir);
      const existing = new Set(entries.map(e => e.toLowerCase()));
      let name = 'note.md';
      let idx = 1;
      while (existing.has(name.toLowerCase())) {
        name = `note ${idx++}.md`;
      }
      const fullPath = fsBridge.join(dir, name);
      try {
        // Prefer AE-side write to avoid sandbox limitations
        const wr = await cepBridge.writeTextFile(fullPath, '');
        if (!wr || !wr.success) {
          await fsBridge.writeFile(fullPath, '');
          await cepBridge.debugAlert?.('CreateNote: wrote (CEP) ' + fullPath);
        } else {
          await cepBridge.debugAlert?.('CreateNote: wrote (AE) ' + fullPath);
        }
      } catch (err) {
        await cepBridge.debugAlert?.('CreateNote: write error ' + String(err));
        throw err;
      }
      try {
        const scan = await cepBridge.scanFolder(dir);
        const files =
          scan && scan.success ? scan.files || [] : await fsBridge.readdir(dir);
        setEntries(files || []);
        await cepBridge.debugAlert?.(
          'CreateNote: refresh ok ' + (files ? files.length : 0)
        );
      } catch {
        const files = await fsBridge.readdir(dir);
        setEntries(files || []);
        await cepBridge.debugAlert?.(
          'CreateNote: refresh fallback ' + (files ? files.length : 0)
        );
      }
      openFileTab(name);
    } catch (e) {
      console.error('Failed to create note file:', e);
      await cepBridge.debugAlert?.('CreateNote: failed ' + String(e));
    }
  }, [rootDir, entries, openFileTab, pickNotesFolder]);

  // const renameNoteFile = React.useCallback(
  //   async (oldName: string) => {
  //     try {
  //       if (!rootDir) return;
  //       const newName = prompt('Rename to:', oldName) || oldName;
  //       if (!newName || newName === oldName) return;
  //       const oldPath = `${rootDir}/${oldName}`;
  //       const newPath = `${rootDir}/${newName}`;
  //       const data = await fsBridge.readFile(oldPath);
  //       await fsBridge.writeFile(newPath, data);
  //       await fsBridge.deletePath(oldPath);
  //       const scan = await cepBridge.scanFolder(rootDir);
  //       const files =
  //         scan && scan.success
  //           ? scan.files || []
  //           : await fsBridge.readdir(rootDir);
  //       setEntries(files || []);
  //       setOpenTabs(prev => prev.map(p => (p === oldPath ? newPath : p)));
  //       setActiveTabPath(prev => (prev === oldPath ? newPath : prev));
  //     } catch (e) {
  //       console.error('Failed to rename note file:', e);
  //     }
  //   },
  //   [rootDir]
  // );

  // createNoteFile / renameNoteFile are defined after openFileTab to avoid TDZ issues

  // Load all layers for comment mode and refresh periodically
  React.useEffect(() => {
    let interval: any;
    const loadAll = async () => {
      try {
        const layers = await cepBridge.getAllLayers();
        // Exclude pseudo/system layers like LayerNodeSettings
        const visibleLayers = layers.filter(
          l => (l.name || '').trim() !== 'LayerNodeSettings'
        );
        setAllLayers(visibleLayers);
      } catch {
        /* noop */
      }
    };
    if (currentMode === 'comment') {
      loadAll();
      interval = setInterval(loadAll, 2000);
    }
    return () => interval && clearInterval(interval);
  }, [currentMode]);

  // const handleSelectLayer = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   setActiveLayerId(e.target.value || null);
  // };

  // const handleCommentSave = async () => {
  //   if (!activeLayerId) return;
  //   setIsSavingComment(true);
  //   try {
  //     await setLayerComment(activeLayerId, layerComment);
  //   } finally {
  //     setIsSavingComment(false);
  //   }
  // };

  // const activeLayer = activeLayerId
  //   ? selectedLayers.find(l => l.id === activeLayerId) || null
  //   : null;

  return (
    <div className="simple-editor-layout">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar__left">
          <button
            type="button"
            className="toolbar__brand"
            onClick={() => setIsExplorerOpen(v => !v)}
            title="Toggle Explorer"
          >
            <Menu size={20} />
          </button>
          <div className="toolbar__modes">
            {modes.map(mode => (
              <button
                key={mode.id}
                className={`toolbar__mode-btn ${
                  currentMode === mode.id ? 'toolbar__mode-btn--active' : ''
                }`}
                onClick={() => setMode(mode.id)}
                title={mode.tooltip}
              >
                <mode.icon size={16} />
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar__right">
          <div className="toolbar__actions">
            <button
              className="toolbar__action-btn"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo size={16} />
            </button>
            <button
              className="toolbar__action-btn"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo size={16} />
            </button>
            <button
              className="toolbar__action-btn"
              onClick={handleSave}
              title={
                currentMode === 'comment'
                  ? 'Save comment (Ctrl+S)'
                  : currentMode === 'expression'
                    ? 'Apply expression (Ctrl+S)'
                    : 'Save file (Ctrl+S)'
              }
              disabled={(() => {
                if (currentMode === 'comment') {
                  return (
                    !activeLayerId ||
                    isCommentLoading ||
                    !!allLayers.find(l => l.id === activeLayerId)?.locked ||
                    isSavingComment ||
                    !isDirty
                  );
                }
                if (currentMode === 'expression') {
                  return (
                    !selectedProperty ||
                    (selectedProperty as any).canSetExpression === false ||
                    !isExpressionDirty
                  );
                }
                if (currentMode === 'note') {
                  const isFileTab =
                    !!activeTabPath &&
                    !activeTabPath.startsWith('layer://') &&
                    !activeTabPath.startsWith('prop://');
                  return !isFileTab;
                }
                return false;
              })()}
            >
              <Save size={16} />
              {currentMode === 'comment' &&
                activeLayerId &&
                allLayers.find(l => l.id === activeLayerId)?.locked && (
                  <span
                    style={{ marginLeft: 6, fontSize: 12, color: '#f59e0b' }}
                    title="Layer is locked (cannot save comment)"
                  >
                    Locked
                  </span>
                )}
            </button>
            <button
              className="toolbar__action-btn"
              onClick={() => openModal('settings')}
              title="Settings (Ctrl+,)"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Editor Tabs were moved inside the editor content area to align with editor width */}

      {/* Editor Area */}
      <div className="editor-area">
        {isExplorerOpen && (
          <div
            className="editor-explorer"
            style={{
              width: explorerWidth,
              borderRight: '1px solid #3e3e42',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <SidebarHeader
              titleNode={
                currentMode === 'comment' ? (
                  <span
                    style={{
                      fontSize: 12,
                      color: '#ccc',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginLeft: 6,
                    }}
                    title={activeCompName || 'Active Composition'}
                  >
                    {activeCompName || 'Active Composition'}
                  </span>
                ) : currentMode === 'expression' ? (
                  <span
                    style={{
                      fontSize: 12,
                      color: '#ccc',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginLeft: 6,
                    }}
                    title={
                      (activeLayerId &&
                        (selectedLayers.find(l => l.id === activeLayerId)
                          ?.name ||
                          '')) ||
                      'No layer selected'
                    }
                  >
                    {(activeLayerId &&
                      (selectedLayers.find(l => l.id === activeLayerId)?.name ||
                        '')) ||
                      'No layer selected'}
                  </span>
                ) : (
                  <button
                    onClick={pickNotesFolder}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      fontSize: 12,
                      color: '#ccc',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'left',
                      marginLeft: 6,
                    }}
                    title={rootDir || 'Select notes folder'}
                  >
                    {rootDir || 'Select notes folder'}
                  </button>
                )
              }
              rightActions={
                <>
                  {currentMode === 'note' && (
                    <button
                      onClick={createNoteFile}
                      title="Create note (.md)"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ccc',
                        cursor: 'pointer',
                        padding: '0 4px',
                        borderRadius: 0,
                        fontSize: 12,
                      }}
                    >
                      +
                    </button>
                  )}
                  <button
                    className="explorer-refresh"
                    onClick={refreshExplorer}
                    disabled={isFSLoading}
                    title="Refresh"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ccc',
                      cursor: 'pointer',
                    }}
                  >
                    ↻
                  </button>
                </>
              }
            />
            <div
              className="explorer-content"
              style={{ overflow: 'auto', padding: '4px 6px' }}
            >
              {currentMode === 'comment' ? (
                allLayers.length === 0 ? (
                  <div
                    className="empty-state"
                    style={{ color: '#aaa', fontSize: 12 }}
                  >
                    No layers
                  </div>
                ) : (
                  <SidebarList>
                    {allLayers.map(l => (
                      <SidebarRow
                        key={l.id}
                        selected={activeLayerId === l.id}
                        onClick={() => {
                          setActiveLayerId(l.id);
                          const layerTitle = l.name || `Layer ${l.id}`;
                          const syntheticPath = `layer://${l.id}/${layerTitle}`;
                          setOpenTabs(prev => {
                            if (prev.includes(syntheticPath)) return prev;

                            if (isEditorFocused) {
                              const isActiveLayerTab = !!(
                                activeTabPath &&
                                activeTabPath.startsWith('layer://')
                              );
                              const activeIdx = isActiveLayerTab
                                ? prev.indexOf(activeTabPath as string)
                                : -1;

                              if (activeIdx !== -1) {
                                const next = [...prev];
                                next[activeIdx] = syntheticPath;
                                const seen = new Set<string>();
                                const out: string[] = [];
                                for (const p of next) {
                                  if (p === syntheticPath && seen.has(p))
                                    continue;
                                  if (!seen.has(p)) {
                                    seen.add(p);
                                    out.push(p);
                                  }
                                }
                                return out;
                              }

                              const firstLayerIdx = prev.findIndex(p =>
                                p.startsWith('layer://')
                              );
                              if (firstLayerIdx !== -1) {
                                const next = [...prev];
                                next[firstLayerIdx] = syntheticPath;
                                const seen = new Set<string>();
                                const out: string[] = [];
                                for (const p of next) {
                                  if (p === syntheticPath && seen.has(p))
                                    continue;
                                  if (!seen.has(p)) {
                                    seen.add(p);
                                    out.push(p);
                                  }
                                }
                                return out;
                              }

                              return [...prev, syntheticPath];
                            }
                            return prev.includes(syntheticPath)
                              ? prev
                              : [...prev, syntheticPath];
                          });
                          setActiveTabPath(syntheticPath);
                        }}
                        leftSlot={
                          <span
                            style={{
                              color: l.locked
                                ? '#6b7280'
                                : activeLayerId === l.id
                                  ? '#fff'
                                  : '#9ca3af',
                            }}
                          >
                            {(() => {
                              switch (l.layerType) {
                                case 'text':
                                  return <TypeIcon size={14} />;
                                case 'shape':
                                  return <Shapes size={14} />;
                                case 'camera':
                                  return <Camera size={14} />;
                                case 'light':
                                  return <SunMedium size={14} />;
                                case 'adjustment':
                                  return <Wand2 size={14} />;
                                case 'null':
                                  return <Square size={14} />;
                                case 'footage':
                                  return <FileText size={14} />;
                                default:
                                  return <File size={14} />;
                              }
                            })()}
                          </span>
                        }
                        title={l.name}
                      >
                        {l.name}
                      </SidebarRow>
                    ))}
                  </SidebarList>
                )
              ) : currentMode === 'expression' ? (
                <div style={{ paddingRight: 2 }}>
                  <PropertySelector
                    selectedProperty={selectedProperty}
                    onPropertySelect={async prop => {
                      setSelectedProperty(prop);
                      if (prop) {
                        try {
                          const expr = await getPropertyExpression(
                            prop.propertyPath
                          );
                          const next = expr || '';
                          setExpressionText(next);
                          setExpressionBaseline(next);
                        } catch {
                          setExpressionText('');
                          setExpressionBaseline('');
                        }

                        // Open/focus a prop tab like comment mode layer tabs
                        const tabId = `prop://${prop.propertyPath}`;
                        setOpenTabs(prev =>
                          prev.includes(tabId) ? prev : [...prev, tabId]
                        );
                        setActiveTabPath(tabId);
                      } else {
                        setExpressionText('');
                        setExpressionBaseline('');
                      }
                    }}
                  />
                </div>
              ) : isFSLoading ? (
                <div
                  className="loading-state"
                  style={{ color: '#aaa', fontSize: 12 }}
                >
                  Loading files...
                </div>
              ) : noteFiles.length === 0 ? (
                <div
                  className="empty-state"
                  style={{ color: '#aaa', fontSize: 12 }}
                >
                  No files
                </div>
              ) : (
                <SidebarList>
                  {noteFiles.map(name => {
                    const isText = /\.md$/i.test(name) || /\.txt$/i.test(name);
                    return (
                      <SidebarRow
                        key={name}
                        disabled={!isText}
                        onClick={() => isText && openFileTab(name)}
                        leftSlot={<FileText size={14} />}
                        title={name}
                      >
                        <span style={{ color: isText ? '#e5e7eb' : '#9ca3af' }}>
                          {name}
                        </span>
                      </SidebarRow>
                    );
                  })}
                </SidebarList>
              )}
            </div>
          </div>
        )}

        {isExplorerOpen && (
          <div
            className="explorer-resizer"
            onMouseDown={() => setIsResizing(true)}
            style={{
              width: 4,
              cursor: 'col-resize',
              background: isResizing ? '#555' : 'transparent',
            }}
          />
        )}

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            minHeight: 0,
          }}
        >
          {/* VSCode-like tabs scoped to editor width */}
          <div
            className="editor-tabs"
            style={{
              height: 28,
              borderBottom: '1px solid #3e3e42',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '0 6px',
              background: '#2d2d30',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {
              // VSCode-like tabs per mode
              openTabs
                .filter(p => {
                  if (currentMode === 'note') {
                    return (
                      !p.startsWith('layer://') && !p.startsWith('prop://')
                    );
                  }
                  if (currentMode === 'comment') {
                    return p.startsWith('layer://');
                  }
                  // expression
                  return p.startsWith('prop://');
                })
                .map(item => {
                  const isLayerTab = item.startsWith('layer://');
                  const isPropTab = item.startsWith('prop://');
                  const isActive = activeTabPath === item;
                  const title = isLayerTab
                    ? item.split('/').slice(-1)[0]
                    : isPropTab
                      ? item.replace('prop://', '').split('.').slice(-1)[0] ||
                        'Property'
                      : item.split(/\\|\//).pop();
                  return (
                    <button
                      type="button"
                      key={item}
                      className={`editor-tab ${isActive ? 'active' : ''}`}
                      role="tab"
                      aria-selected={isActive}
                      tabIndex={0}
                      onClick={() => {
                        setActiveTabPath(item);
                        if (isLayerTab) {
                          const m = item.match(/^layer:\/\/(\d+)\//);
                          if (m) setActiveLayerId(m[1]);
                        } else if (isPropTab) {
                          // Switching to a prop tab: ensure expression mode and keep current selection
                          setMode('expression');
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveTabPath(item);
                          if (isLayerTab) {
                            const m = item.match(/^layer:\/\/(\d+)\//);
                            if (m) setActiveLayerId(m[1]);
                          } else if (isPropTab) {
                            setMode('expression');
                          }
                        }
                      }}
                      onMouseDown={e => {
                        if (e.button === 1) {
                          // Middle-click close
                          e.stopPropagation();
                          setOpenTabs(prev => prev.filter(p => p !== item));
                          if (activeTabPath === item) {
                            const sameGroup = openTabs.filter(
                              p =>
                                (currentMode === 'note'
                                  ? !p.startsWith('layer://') &&
                                    !p.startsWith('prop://')
                                  : currentMode === 'comment'
                                    ? p.startsWith('layer://')
                                    : p.startsWith('prop://')) && p !== item
                            );
                            const next = sameGroup.slice(-1)[0] || null;
                            setActiveTabPath(next);
                            if (isLayerTab) {
                              if (next) {
                                const m = next.match(/^layer:\/\/(\d+)\//);
                                if (m) setActiveLayerId(m[1]);
                              } else {
                                setActiveLayerId(null);
                              }
                            }
                          }
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 8px',
                        borderRadius: 0,
                        cursor: 'pointer',
                        background: 'transparent',
                        color: '#ccc',
                        borderTop: isActive
                          ? '2px solid #0e639c'
                          : '2px solid transparent',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span
                        className="tab-name"
                        title={item}
                        style={{
                          fontSize: 12,
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {isLayerTab && (
                          <span
                            style={{
                              display: 'inline-flex',
                              width: 14,
                              justifyContent: 'center',
                            }}
                          >
                            {(() => {
                              const id = (item.match(/^layer:\/\/(\d+)\//) ||
                                [])[1];
                              const l = allLayers.find(x => x.id === id);
                              switch (l?.layerType) {
                                case 'text':
                                  return <TypeIcon size={12} />;
                                case 'shape':
                                  return <Shapes size={12} />;
                                case 'camera':
                                  return <Camera size={12} />;
                                case 'light':
                                  return <SunMedium size={12} />;
                                case 'adjustment':
                                  return <Wand2 size={12} />;
                                case 'null':
                                  return <Square size={12} />;
                                case 'footage':
                                  return <FileText size={12} />;
                                default:
                                  return <File size={12} />;
                              }
                            })()}
                          </span>
                        )}
                        {title}
                      </span>
                      <button
                        className="tab-close"
                        onClick={e => {
                          e.stopPropagation();
                          setOpenTabs(prev => prev.filter(p => p !== item));
                          if (activeTabPath === item) {
                            const sameGroup = openTabs.filter(
                              p =>
                                (currentMode === 'note'
                                  ? !p.startsWith('layer://')
                                  : p.startsWith('layer://')) && p !== item
                            );
                            const next = sameGroup.slice(-1)[0] || null;
                            setActiveTabPath(next);
                            if (isLayerTab) {
                              if (next) {
                                const m = next.match(/^layer:\/\/(\d+)\//);
                                if (m) setActiveLayerId(m[1]);
                              } else {
                                setActiveLayerId(null);
                              }
                            }
                          }
                        }}
                        title="Close"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        ×
                      </button>
                    </button>
                  );
                })
            }
          </div>
          {/* Removed header layer tabs per request */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              position: 'relative',
              display: 'flex',
            }}
          >
            {/* Removed deprecated expression mode overlay */}
            <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
              <MonacoEditor
                value={
                  currentMode === 'comment'
                    ? layerComment
                    : currentMode === 'expression'
                      ? expressionText
                      : editorValue
                }
                language={getEditorLanguage()}
                onChange={handleEditorChange}
                onSave={handleSave}
                onFocusChange={setIsEditorFocused}
                options={{
                  theme: 'vs-dark',
                  fontSize: 14,
                  wordWrap: true,
                  minimap: false,
                  autoFormat: true,
                  readOnly: (currentMode === 'comment' &&
                    (!activeLayerId || isCommentLoading)) as any,
                  paddingTop: 6,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status bar removed per request */}
    </div>
  );
};

export default SimpleEditorLayout;

