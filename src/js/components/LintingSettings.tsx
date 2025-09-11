import React, { useState, useCallback } from 'react';
import {
  LintingOptions,
  LintingRule,
  DEFAULT_LINTING_OPTIONS,
} from '../lib/expression-linter';
import '../styles/linting-settings.scss';

interface LintingSettingsProps {
  options: LintingOptions;
  rules: LintingRule[];
  onOptionsChange: (options: LintingOptions) => void;
  onRuleToggle: (ruleId: string, enabled: boolean) => void;
  onClose?: () => void;
}

const LintingSettings: React.FC<LintingSettingsProps> = ({
  options,
  rules,
  onOptionsChange,
  onRuleToggle,
  onClose,
}) => {
  const [localOptions, setLocalOptions] = useState<LintingOptions>(options);

  const handleOptionChange = useCallback(
    <K extends keyof LintingOptions>(key: K, value: LintingOptions[K]) => {
      const newOptions = { ...localOptions, [key]: value };
      setLocalOptions(newOptions);
      onOptionsChange(newOptions);
    },
    [localOptions, onOptionsChange]
  );

  const handleRuleToggle = useCallback(
    (ruleId: string, enabled: boolean) => {
      onRuleToggle(ruleId, enabled);
    },
    [onRuleToggle]
  );

  const resetToDefaults = useCallback(() => {
    setLocalOptions(DEFAULT_LINTING_OPTIONS);
    onOptionsChange(DEFAULT_LINTING_OPTIONS);

    // Reset all rules to default
    rules.forEach(rule => {
      const defaultEnabled = DEFAULT_LINTING_OPTIONS.rules[rule.id] ?? true;
      onRuleToggle(rule.id, defaultEnabled);
    });
  }, [onOptionsChange, onRuleToggle, rules]);

  const groupedRules = rules.reduce(
    (groups, rule) => {
      const category = rule.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(rule);
      return groups;
    },
    {} as Record<string, LintingRule[]>
  );

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return '🚫';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📝';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'syntax':
        return '🔤';
      case 'performance':
        return '⚡';
      case 'deprecated':
        return '⏰';
      case 'best-practice':
        return '✨';
      default:
        return '📋';
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'syntax':
        return 'Syntax';
      case 'performance':
        return 'Performance';
      case 'deprecated':
        return 'Deprecated';
      case 'best-practice':
        return 'Best Practices';
      default:
        return category;
    }
  };

  return (
    <div className="linting-settings">
      <div className="linting-settings-header">
        <h3>Linting Settings</h3>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="linting-settings-content">
        {/* General Options */}
        <div className="settings-section">
          <h4>General Options</h4>

          <div className="setting-row">
            <label>Max Complexity:</label>
            <input
              type="number"
              min="1"
              max="50"
              value={localOptions.maxComplexity}
              onChange={e =>
                handleOptionChange('maxComplexity', parseInt(e.target.value))
              }
            />
          </div>

          <div className="setting-row">
            <label>Max Line Length:</label>
            <input
              type="number"
              min="40"
              max="200"
              value={localOptions.maxLineLength}
              onChange={e =>
                handleOptionChange('maxLineLength', parseInt(e.target.value))
              }
            />
          </div>

          <div className="setting-row checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={localOptions.allowDeprecated}
                onChange={e =>
                  handleOptionChange('allowDeprecated', e.target.checked)
                }
              />
              <span>Allow deprecated functions</span>
            </label>
          </div>

          <div className="setting-row checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={localOptions.strictMode}
                onChange={e =>
                  handleOptionChange('strictMode', e.target.checked)
                }
              />
              <span>Strict mode (more aggressive linting)</span>
            </label>
          </div>
        </div>

        {/* Linting Rules */}
        <div className="settings-section">
          <h4>Linting Rules</h4>

          {Object.entries(groupedRules).map(([category, categoryRules]) => (
            <div key={category} className="rule-category">
              <div className="category-header">
                <span className="category-icon">
                  {getCategoryIcon(category)}
                </span>
                <span className="category-title">
                  {getCategoryTitle(category)}
                </span>
                <span className="category-count">({categoryRules.length})</span>
              </div>

              <div className="rules-list">
                {categoryRules.map(rule => (
                  <div key={rule.id} className="rule-item">
                    <div className="rule-header">
                      <label className="rule-toggle">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={e =>
                            handleRuleToggle(rule.id, e.target.checked)
                          }
                        />
                        <span className="rule-name">
                          <span className="severity-icon">
                            {getSeverityIcon(rule.severity)}
                          </span>
                          {rule.name}
                        </span>
                      </label>
                      <span className={`severity-badge ${rule.severity}`}>
                        {rule.severity}
                      </span>
                    </div>
                    <div className="rule-description">{rule.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Rule Statistics */}
        <div className="settings-section">
          <h4>Rule Statistics</h4>
          <div className="rule-stats">
            <div className="stat-item">
              <span className="stat-label">Total Rules:</span>
              <span className="stat-value">{rules.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Enabled:</span>
              <span className="stat-value enabled">
                {rules.filter(r => r.enabled).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Disabled:</span>
              <span className="stat-value disabled">
                {rules.filter(r => !r.enabled).length}
              </span>
            </div>
          </div>

          <div className="severity-stats">
            <div className="stat-item">
              <span className="stat-label">🚫 Errors:</span>
              <span className="stat-value error">
                {rules.filter(r => r.severity === 'error' && r.enabled).length}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">⚠️ Warnings:</span>
              <span className="stat-value warning">
                {
                  rules.filter(r => r.severity === 'warning' && r.enabled)
                    .length
                }
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">ℹ️ Info:</span>
              <span className="stat-value info">
                {rules.filter(r => r.severity === 'info' && r.enabled).length}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="settings-section">
          <h4>Quick Actions</h4>
          <div className="quick-actions">
            <button
              className="action-btn"
              onClick={() => {
                rules.forEach(rule => handleRuleToggle(rule.id, true));
              }}
            >
              Enable All Rules
            </button>
            <button
              className="action-btn"
              onClick={() => {
                rules.forEach(rule => handleRuleToggle(rule.id, false));
              }}
            >
              Disable All Rules
            </button>
            <button
              className="action-btn"
              onClick={() => {
                rules.forEach(rule => {
                  if (rule.severity === 'error') {
                    handleRuleToggle(rule.id, true);
                  }
                });
              }}
            >
              Enable Only Errors
            </button>
            <button
              className="action-btn"
              onClick={() => {
                rules.forEach(rule => {
                  if (rule.category === 'performance') {
                    handleRuleToggle(rule.id, true);
                  }
                });
              }}
            >
              Enable Performance Rules
            </button>
          </div>
        </div>
      </div>

      <div className="linting-settings-footer">
        <button className="reset-btn" onClick={resetToDefaults}>
          Reset to Defaults
        </button>
        {onClose && (
          <button className="apply-btn" onClick={onClose}>
            Apply
          </button>
        )}
      </div>
    </div>
  );
};

export default LintingSettings;
