import { useEffect, useState } from 'react';
import { subscribeBackgroundColor } from '../lib/utils/bolt';
import { EditorProvider } from '../contexts/EditorContext';
import { AppProvider } from '../contexts/AppContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import ErrorBoundary from '../components/ErrorBoundary';
import MainLayout from '../components/MainLayout';
import AppIntegration from '../components/AppIntegration';
import '../lib/monaco-environment'; // Configure Monaco for CEP
import './main.scss';

export const App = () => {
  const [bgColor, setBgColor] = useState('#282c34');

  useEffect(() => {
    try {
      if (window.cep) {
        subscribeBackgroundColor(setBgColor);
      }
    } catch (error) {
      // Ignore errors in non-CEP environments
      console.log('CEP not available, using default background color');
    }
  }, []);

  return (
    <ErrorBoundary>
      <SettingsProvider>
        <AppProvider>
          <EditorProvider>
            <AppIntegration>
              <div className="app" style={{ backgroundColor: bgColor }}>
                <MainLayout />
              </div>
            </AppIntegration>
          </EditorProvider>
        </AppProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
};
