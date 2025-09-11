import React, { useState, useCallback } from 'react';
import {
  FormattingOptions,
  DEFAULT_FORMATTING_OPTIONS,
} from '../lib/expression-formatter';
import '../styles/formatting-settings.scss';

interface FormattingSettingsProps {
  options: FormattingOptions;
  onOptionsChange: (options: FormattingOptions) => void;
  onClose?: () => void;
}

const FormattingSettings: React.FC<FormattingSettingsProps> = ({
  options,
  onOptionsChange,
  onClose,
}) => {
  const [localOptions, setLocalOptions] = useState<FormattingOptions>(options);

  const handleOptionChange = useCallback(
    <K extends keyof FormattingOptions>(
      key: K,
      value: FormattingOptions[K]
    ) => {
      const newOptions = { ...localOptions, [key]: value };
      setLocalOptions(newOptions);
      onOptionsChange(newOptions);
    },
    [localOptions, onOptionsChange]
  );

  const resetToDefaults = useCallback(() => {
    setLocalOptions(DEFAULT_FORMATTING_OPTIONS);
    onOptionsChange(DEFAULT_FORMATTING_OPTIONS);
  }, [onOptionsChange]);

  return (
    <div className="formatting-settings">
      <div className="formatting-settings-header">
        <h3>Formatting Settings</h3>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="formatting-settings-content">
        {/* Indentation Settings */}
        <div className="settings-section">
          <h4>Indentation</h4>

          <div className="setting-row">
            <label>Indent Style:</label>
            <select
              value={localOptions.indentStyle}
              onChange={e =>
                handleOptionChange(
                  'indentStyle',
                  e.target.value as 'spaces' | 'tabs'
                )
              }
            >
              <option value="spaces">Spaces</option>
              <option value="tabs">Tabs</option>
            </select>
          </div>

          <div className="setting-row">
            <label>Indent Size:</label>
            <input
              type="number"
              min="1"
              max="8"
              value={localOptions.indentSize}
              onChange={e =>
                handleOptionChange('indentSize', parseInt(e.target.value))
              }
            />
          </div>

          <div className="setting-row">
            <label>Tab Size:</label>
            <input
              type="number"
              min="1"
              max="8"
              value={localOptions.tabSize}
              onChange={e =>
                handleOptionChange('tabSize', parseInt(e.target.value))
              }
            />
          </div>
        </div>

        {/* Line Settings */}
        <div className="settings-section">
          <h4>Line Settings</h4>

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
                checked={localOptions.insertFinalNewline}
                onChange={e =>
                  handleOptionChange('insertFinalNewline', e.target.checked)
                }
              />
              <span>Insert final newline</span>
            </label>
          </div>

          <div className="setting-row checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={localOptions.trimTrailingWhitespace}
                onChange={e =>
                  handleOptionChange('trimTrailingWhitespace', e.target.checked)
                }
              />
              <span>Trim trailing whitespace</span>
            </label>
          </div>
        </div>

        {/* Code Style Settings */}
        <div className="settings-section">
          <h4>Code Style</h4>

          <div className="setting-row checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={localOptions.bracketSpacing}
                onChange={e =>
                  handleOptionChange('bracketSpacing', e.target.checked)
                }
              />
              <span>Bracket spacing</span>
            </label>
          </div>

          <div className="setting-row checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={localOptions.semicolons}
                onChange={e =>
                  handleOptionChange('semicolons', e.target.checked)
                }
              />
              <span>Add semicolons</span>
            </label>
          </div>

          <div className="setting-row">
            <label>Quote Style:</label>
            <select
              value={localOptions.quoteStyle}
              onChange={e =>
                handleOptionChange(
                  'quoteStyle',
                  e.target.value as 'single' | 'double'
                )
              }
            >
              <option value="double">Double quotes (")</option>
              <option value="single">Single quotes (')</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        <div className="settings-section">
          <h4>Preview</h4>
          <div className="formatting-preview">
            <div className="preview-label">Before:</div>
            <pre className="preview-code before">
              {`var x=5;var y=10;
if(x>y){
return x*2;
}else{
return y/2;}`}
            </pre>

            <div className="preview-label">After:</div>
            <pre className="preview-code after">
              {localOptions.indentStyle === 'spaces'
                ? `var x = 5;\nvar y = 10;\n\nif (x > y) {\n  return x * 2;\n} else {\n  return y / 2;\n}`
                : `var x = 5;\nvar y = 10;\n\nif (x > y) {\n\treturn x * 2;\n} else {\n\treturn y / 2;\n}`}
            </pre>
          </div>
        </div>
      </div>

      <div className="formatting-settings-footer">
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

export default FormattingSettings;
