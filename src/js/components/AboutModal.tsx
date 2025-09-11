import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Zap, Atom, FileText, Palette, Package, Wrench } from 'lucide-react';
import '../styles/about-modal.scss';

const AboutModal: React.FC = () => {
  const { closeModal } = useAppContext();

  const handleClose = () => {
    closeModal('about');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="about-modal">
        <div className="modal-header">
          <h2>About AE Code Editor</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="about-logo">
            <div className="logo-icon">
              <Zap size={32} />
            </div>
            <h3>After Effects Code Editor Extension</h3>
            <p className="version">Version 1.0.0</p>
          </div>

          <div className="about-description">
            <p>
              A powerful VSCode-like editor for After Effects expressions, layer
              comments, and notes. Built with React, Monaco Editor, and the CEP
              framework.
            </p>
          </div>

          <div className="about-features">
            <h4>Features</h4>
            <ul>
              <li>Monaco Editor with syntax highlighting</li>
              <li>IntelliSense and code completion</li>
              <li>Real-time linting and error detection</li>
              <li>Code formatting with Prettier</li>
              <li>Layer comment management</li>
              <li>Note-taking system</li>
              <li>Search and replace functionality</li>
              <li>Customizable settings and themes</li>
              <li>Keyboard shortcuts</li>
              <li>Responsive UI layout</li>
            </ul>
          </div>

          <div className="about-tech">
            <h4>Built With</h4>
            <div className="tech-stack">
              <div className="tech-item">
                <span className="tech-icon">
                  <Atom size={16} />
                </span>
                <span>React</span>
              </div>
              <div className="tech-item">
                <span className="tech-icon">
                  <FileText size={16} />
                </span>
                <span>Monaco Editor</span>
              </div>
              <div className="tech-item">
                <span className="tech-icon">
                  <Palette size={16} />
                </span>
                <span>Sass</span>
              </div>
              <div className="tech-item">
                <span className="tech-icon">
                  <Zap size={16} />
                </span>
                <span>Vite</span>
              </div>
              <div className="tech-item">
                <span className="tech-icon">
                  <Package size={16} />
                </span>
                <span>TypeScript</span>
              </div>
              <div className="tech-item">
                <span className="tech-icon">
                  <Wrench size={16} />
                </span>
                <span>CEP</span>
              </div>
            </div>
          </div>

          <div className="about-info">
            <div className="info-section">
              <h4>System Information</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Platform:</span>
                  <span className="info-value">{navigator.platform}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">User Agent:</span>
                  <span className="info-value">
                    {navigator.userAgent.split(' ')[0]}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Language:</span>
                  <span className="info-value">{navigator.language}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <p className="copyright">
            © 2024 AE Code Editor Extension. Built for After Effects
            developers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
