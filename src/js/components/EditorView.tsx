import React, { useState, useCallback } from 'react';
import { useAppContext, useCurrentMode } from '../contexts/AppContext';
import MonacoEditor from './MonacoEditor';
import NotesManager from './NotesManager';
import { fsBridge } from '../lib/fs-bridge';
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
} from 'lucide-react';
import {
  Code,
  MessageSquare,
  StickyNote,
  Settings,
  Undo,
  Redo,
  Save,
  Menu,
} from 'lucide-react';
import { useLayerOperations } from '../hooks/useCEPBridge';
import type { LayerInfo } from '../../shared/universals';
import '../styles/simple-editor-layout.scss';
import PropertySelector from './PropertySelector';
import { useExpressionOperations } from '../hooks/useCEPBridge';
import type { PropertySelection } from '../types/expression';

const SimpleEditorLayout: React.FC = () => {
  const { state, setMode, openModal, undo, redo, canUndo, canRedo } =
    useAppContext();
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );

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

  // Comment mode: tabs for all layers in active comp
  const [allLayers, setAllLayers] = useState<LayerInfo[]>([]);
  const [activeCompName, setActiveCompName] = useState<string>('');
  const lastAeSelectionSignatureRef = React.useRef<string>('');

  const resolveProjectRoot = React.useCallback(async () => {
    try {
      const info = await cepBridge.getProjectInfo();
      if (info.path) {
        return info.path.replace(/\\[^\\/]+$/, '');
      }
    } catch {}
    return '';
  }, []);

  const refreshExplorer = React.useCallback(async () => {
    setIsFSLoading(true);
    try {
      const dir = await resolveProjectRoot();
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
  }, [resolveProjectRoot]);

  React.useEffect(() => {
    // Load explorer entries on first open
    if (isExplorerOpen && !rootDir) {
      refreshExplorer();
    }
  }, [isExplorerOpen, rootDir, refreshExplorer]);

  // Poll active composition name
  React.useEffect(() => {
    let timer: any;
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
    timer = setInterval(load, 2000);
    return () => timer && clearInterval(timer);
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
        setSaveStatus('idle');
      } catch (_) {
        setLayerCommentText('');
        setBaselineComment('');
        setSaveStatus('idle');
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
        setExpressionText(value);
      } else {
        setEditorValue(value);
      }
    },
    [currentMode]
  );

  const handleSave = useCallback(async () => {
    if (currentMode === 'comment') {
      if (!activeLayerId) return;
      const locked = allLayers.find(l => l.id === activeLayerId)?.locked;
      if (locked) {
        // Prevent saving when the layer is locked
        setSaveStatus('idle');
        return;
      }
      setIsSavingComment(true);
      setSaveStatus('saving');
      try {
        await setLayerComment(activeLayerId, layerComment);
        setBaselineComment(layerComment);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } finally {
        setIsSavingComment(false);
      }
      return;
    }
    if (currentMode === 'expression') {
      if (!selectedProperty) return;
      try {
        await setPropertyExpression(
          selectedProperty.propertyPath,
          expressionText
        );
      } catch {}
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
        return '// Expressions are not available yet.\n// This area is read-only for now.\n';
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

  const isModeUnavailable = false;

  const isDirty = currentMode === 'comment' && layerComment !== baselineComment;

  const mdFiles = React.useMemo(
    () => entries.filter(f => /\.md$/i.test(f)),
    [entries]
  );
  const openFileTab = React.useCallback(
    (fileName: string) => {
      if (!rootDir) return;
      const full = `${rootDir}/${fileName}`;
      setOpenTabs(prev => (prev.includes(full) ? prev : [...prev, full]));
      setActiveTabPath(full);
    },
    [rootDir]
  );
  const closeFileTab = React.useCallback((path: string) => {
    setOpenTabs(prev => prev.filter(p => p !== path));
    setActiveTabPath(prev => (prev === path ? null : prev));
  }, []);

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
      } catch {}
    };
    if (currentMode === 'comment') {
      loadAll();
      interval = setInterval(loadAll, 2000);
    }
    return () => interval && clearInterval(interval);
  }, [currentMode]);

  const handleSelectLayer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveLayerId(e.target.value || null);
  };

  const handleCommentSave = async () => {
    if (!activeLayerId) return;
    setIsSavingComment(true);
    try {
      await setLayerComment(activeLayerId, layerComment);
    } finally {
      setIsSavingComment(false);
    }
  };

  const activeLayer = activeLayerId
    ? selectedLayers.find(l => l.id === activeLayerId) || null
    : null;

  return (
    <div className="simple-editor-layout">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar__left">
          <div
            className="toolbar__brand"
            onClick={() => setIsExplorerOpen(v => !v)}
            title="Toggle Explorer"
          >
            <Menu size={20} />
            <span>Layer Note</span>
          </div>
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
                  : 'Save (disabled)'
              }
              disabled={
                currentMode !== 'comment' ||
                !activeLayerId ||
                isCommentLoading ||
                (currentMode === 'comment' &&
                  !!allLayers.find(l => l.id === activeLayerId)?.locked) ||
                isSavingComment ||
                !isDirty
              }
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
            <div
              className="explorer-header"
              style={{
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {currentMode === 'comment' ? (
                <span
                  style={{
                    fontSize: 12,
                    color: '#ccc',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
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
                  }}
                  title={activeCompName || 'Active Composition'}
                >
                  {activeCompName || 'Active Composition'}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: 12,
                    color: '#ccc',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={rootDir || 'No project folder'}
                >
                  {rootDir || 'No project folder'}
                </span>
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
            </div>
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
                  <ul
                    className="layer-list"
                    style={{ listStyle: 'none', padding: 0, margin: 0 }}
                  >
                    {allLayers.map(l => (
                      <li
                        key={l.id}
                        className="layer-item"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '2px 6px 2px 16px',
                          borderRadius: 4,
                          backgroundColor:
                            activeLayerId === l.id ? '#2a2f3a' : 'transparent',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            width: 16,
                            justifyContent: 'center',
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
                        <button
                          className="layer-name"
                          onClick={() => {
                            // Local switch without forcing AE to change selection
                            setActiveLayerId(l.id);
                            const layerTitle = l.name || `Layer ${l.id}`;
                            const syntheticPath = `layer://${l.id}/${layerTitle}`;
                            setOpenTabs(prev => {
                              // If already open, keep tabs and just focus below
                              if (prev.includes(syntheticPath)) return prev;

                              if (isEditorFocused) {
                                // When editor has focus, replace an existing layer tab instead of adding
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
                                  // De-duplicate while preserving order
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

                                // No active layer tab; replace the first existing layer tab if any
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

                                // If no layer tabs exist yet, append
                                return [...prev, syntheticPath];
                              }
                              // Not focused: append if missing
                              return prev.includes(syntheticPath)
                                ? prev
                                : [...prev, syntheticPath];
                            });
                            // Focus the synthetic tab (existing or replaced)
                            setActiveTabPath(syntheticPath);
                          }}
                          title={l.name}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: l.locked
                              ? '#9ca3af'
                              : activeLayerId === l.id
                                ? '#fff'
                                : '#e5e7eb',
                            cursor: 'pointer',
                            padding: '4px 2px',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textAlign: 'left',
                          }}
                        >
                          {l.name}
                        </button>
                      </li>
                    ))}
                  </ul>
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
                          setExpressionText(expr || '');
                        } catch {
                          setExpressionText('');
                        }
                      } else {
                        setExpressionText('');
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
              ) : mdFiles.length === 0 ? (
                <div
                  className="empty-state"
                  style={{ color: '#aaa', fontSize: 12 }}
                >
                  No markdown files
                </div>
              ) : (
                <ul
                  className="file-list"
                  style={{ listStyle: 'none', padding: 0, margin: 0 }}
                >
                  {mdFiles.map(name => (
                    <li
                      key={name}
                      className="file-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <button
                        className="file-name"
                        onClick={() => openFileTab(name)}
                        title={name}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#e5e7eb',
                          cursor: 'pointer',
                          padding: '4px 2px',
                        }}
                      >
                        {name}
                      </button>
                    </li>
                  ))}
                </ul>
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
              // VSCode-like tabs: show file tabs in Note mode; show layer tabs (layer://) in Comment mode
              openTabs
                .filter(p =>
                  currentMode === 'note'
                    ? !p.startsWith('layer://')
                    : p.startsWith('layer://')
                )
                .map(item => {
                  const isLayerTab = item.startsWith('layer://');
                  const isActive = activeTabPath === item;
                  const title = isLayerTab
                    ? item.split('/').slice(-1)[0]
                    : item.split(/\\|\//).pop();
                  return (
                    <div
                      key={item}
                      className={`editor-tab ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setActiveTabPath(item);
                        if (isLayerTab) {
                          const m = item.match(/^layer:\/\/(\d+)\//);
                          if (m) setActiveLayerId(m[1]);
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
                    </div>
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
            <div
              className={`editor-overlay ${isModeUnavailable ? 'editor-overlay--visible' : ''}`}
              style={{ position: 'absolute', inset: 0 }}
            >
              {currentMode === 'expression' && (
                <span>Expressions are not available yet.</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
              {currentMode === 'note' ? (
                <NotesManager />
              ) : (
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status bar removed per request */}
    </div>
  );
};

export default SimpleEditorLayout;
