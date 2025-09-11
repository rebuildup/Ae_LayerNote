import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAppContext } from '../contexts/AppContext';
import '../styles/settings-panel.scss';

type SettingsTab =
  | 'editor'
  | 'linting'
  | 'formatting'
  | 'ui'
  | 'keyboard'
  | 'advanced';

const SettingsPanel: React.FC = () => {
  const {
    settings,
    updateEditorSettings,
    updateLintingSettings,
    updateFormattingSettings,
    updateUISettings,
    resetSettings,
    exportSettings,
    importSettings,
  } = useSettings();
  const { closeModal } = useAppContext();
  const [activeTab, setActiveTab] = useState<SettingsTab>('editor');
  const [importText, setImportText] = useState('');

  const handleClose = () => {
    closeModal('settings');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleExport = () => {
    const settingsJson = exportSettings();
    navigator.clipboard
      .writeText(settingsJson)
      .then(() => {
        alert('Settings copied to clipboard!');
      })
      .catch(() => {
        // Fallback: show in a text area
        const textarea = document.createElement('textarea');
        textarea.value = settingsJson;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Settings copied to clipboard!');
      });
  };

  const handleImport = async () => {
    try {
      await importSettings(importText);
      setImportText('');
      alert('Settings imported successfully!');
    } catch (error) {
      alert('Failed to import settings. Please check the format.');
    }
  };

  const handleReset = () => {
    if (
      confirm(
        'Are you sure you want to reset all settings to defaults? This cannot be undone.'
      )
    ) {
      resetSettings();
    }
  };

  const renderEditorSettings = () => (
    <div className="settings-section">
      <h3>Editor Settings</h3>

      <div className="setting-group">
        <label>Theme</label>
        <select
          value={settings.editor.theme}
          onChange={e =>
            updateEditorSettings({ theme: e.target.value as 'dark' | 'light' })
          }
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      <div className="setting-group">
        <label>Font Size</label>
        <input
          type="number"
          min="10"
          max="24"
          value={settings.editor.fontSize}
          onChange={e =>
            updateEditorSettings({ fontSize: parseInt(e.target.value) })
          }
        />
      </div>

      <div className="setting-group">
        <label>Font Family</label>
        <input
          type="text"
          value={settings.editor.fontFamily}
          onChange={e => updateEditorSettings({ fontFamily: e.target.value })}
        />
      </div>

      <div className="setting-group">
        <label>Tab Size</label>
        <input
          type="number"
          min="1"
          max="8"
          value={settings.editor.tabSize}
          onChange={e =>
            updateEditorSettings({ tabSize: parseInt(e.target.value) })
          }
        />
      </div>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.editor.wordWrap}
            onChange={e => updateEditorSettings({ wordWrap: e.target.checked })}
          />
          Word Wrap
        </label>
      </div>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.editor.minimap}
            onChange={e => updateEditorSettings({ minimap: e.target.checked })}
          />
          Show Minimap
        </label>
      </div>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.editor.autoSave}
            onChange={e => updateEditorSettings({ autoSave: e.target.checked })}
          />
          Auto Save
        </label>
      </div>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.editor.autoFormat}
            onChange={e =>
              updateEditorSettings({ autoFormat: e.target.checked })
            }
          />
          Auto Format
        </label>
      </div>
    </div>
  );

  const renderLintingSettings = () => (
    <div className="settings-section">
      <h3>Linting Settings</h3>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.linting.enabled}
            onChange={e => updateLintingSettings({ enabled: e.target.checked })}
          />
          Enable Linting
        </label>
      </div>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.linting.rules.deprecatedFunctions}
            onChange={e =>
              updateLintingSettings({
                rules: {
                  ...settings.linting.rules,
                  deprecatedFunctions: e.target.checked,
                },
              })
            }
          />
          Check Deprecated Functions
        </label>
      </div>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.linting.rules.syntaxErrors}
            onChange={e =>
              updateLintingSettings({
                rules: {
                  ...settings.linting.rules,
                  syntaxErrors: e.target.checked,
                },
              })
            }
          />
          Check Syntax Errors
        </label>
      </div>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.linting.rules.unusedVariables}
            onChange={e =>
              updateLintingSettings({
                rules: {
                  ...settings.linting.rules,
                  unusedVariables: e.target.checked,
                },
              })
            }
          />
          Check Unused Variables
        </label>
      </div>
    </div>
  );

  const renderFormattingSettings = () => (
    <div className="settings-section">
      <h3>Formatting Settings</h3>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.formatting.enabled}
            onChange={e =>
              updateFormattingSettings({ enabled: e.target.checked })
            }
          />
          Enable Formatting
        </label>
      </div>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.formatting.formatOnSave}
            onChange={e =>
              updateFormattingSettings({ formatOnSave: e.target.checked })
            }
          />
          Format on Save
        </label>
      </div>

      <div className="setting-group">
        <label>Indent Size</label>
        <input
          type="number"
          min="1"
          max="8"
          value={settings.formatting.indentSize}
          onChange={e =>
            updateFormattingSettings({ indentSize: parseInt(e.target.value) })
          }
        />
      </div>

      <div className="setting-group">
        <label>Quotes</label>
        <select
          value={settings.formatting.quotes}
          onChange={e =>
            updateFormattingSettings({
              quotes: e.target.value as 'single' | 'double',
            })
          }
        >
          <option value="single">Single</option>
          <option value="double">Double</option>
        </select>
      </div>
    </div>
  );

  const renderUISettings = () => (
    <div className="settings-section">
      <h3>UI Settings</h3>

      <div className="setting-group">
        <label>Sidebar Width</label>
        <input
          type="number"
          min="200"
          max="500"
          value={settings.ui.sidebarWidth}
          onChange={e =>
            updateUISettings({ sidebarWidth: parseInt(e.target.value) })
          }
        />
      </div>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.ui.showStatusBar}
            onChange={e =>
              updateUISettings({ showStatusBar: e.target.checked })
            }
          />
          Show Status Bar
        </label>
      </div>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.ui.compactMode}
            onChange={e => updateUISettings({ compactMode: e.target.checked })}
          />
          Compact Mode
        </label>
      </div>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.ui.animationsEnabled}
            onChange={e =>
              updateUISettings({ animationsEnabled: e.target.checked })
            }
          />
          Enable Animations
        </label>
      </div>
    </div>
  );

  const renderAdvancedSettings = () => (
    <div className="settings-section">
      <h3>Advanced Settings</h3>

      <div className="setting-group">
        <label>Export Settings</label>
        <button onClick={handleExport} className="settings-button">
          Copy to Clipboard
        </button>
      </div>

      <div className="setting-group">
        <label>Import Settings</label>
        <textarea
          value={importText}
          onChange={e => setImportText(e.target.value)}
          placeholder="Paste settings JSON here..."
          rows={4}
        />
        <button
          onClick={handleImport}
          className="settings-button"
          disabled={!importText.trim()}
        >
          Import
        </button>
      </div>

      <div className="setting-group">
        <label>Reset Settings</label>
        <button
          onClick={handleReset}
          className="settings-button settings-button--danger"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'editor':
        return renderEditorSettings();
      case 'linting':
        return renderLintingSettings();
      case 'formatting':
        return renderFormattingSettings();
      case 'ui':
        return renderUISettings();
      case 'advanced':
        return renderAdvancedSettings();
      default:
        return renderEditorSettings();
    }
  };

  const tabs = [
    { id: 'editor' as const, label: 'Editor', icon: '⚡' },
    { id: 'linting' as const, label: 'Linting', icon: '🔍' },
    { id: 'formatting' as const, label: 'Formatting', icon: '✨' },
    { id: 'ui' as const, label: 'UI', icon: '🎨' },
    { id: 'advanced' as const, label: 'Advanced', icon: '⚙️' },
  ];

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="settings-tab-icon">{tab.icon}</span>
                <span className="settings-tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="settings-body">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
