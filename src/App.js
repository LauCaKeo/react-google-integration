import React, { useState } from 'react';
import './App.css';
import AlertTest from './components/AlertTest';
import GoogleDriveTest from './components/GoogleDriveTest';
import GoogleSheetsTest from './components/GoogleSheetsTest';
import ReportDashboard from './components/ReportDashboard';
import { validateConfig } from './config/googleConfig';

function App() {
  const [activeTab, setActiveTab] = useState('sheets');
  const [configValid, setConfigValid] = useState(false);

  // Check config khi component mount
  React.useEffect(() => {
    const isValid = validateConfig();
    setConfigValid(isValid);
  }, []);

  // Render config warning
  const renderConfigWarning = () => {
    if (configValid) return null;

    return (
      <div className="config-warning">
        <div className="warning-content">
          <h3>⚠️ Configuration Required</h3>
          <p>
            Please configure your environment variables before using the application. Copy{' '}
            <code>.env.example</code> to <code>.env</code> and fill in your Google credentials.
          </p>
          <div className="warning-links">
            <a href="/QUICK_SETUP.md" target="_blank" rel="noopener noreferrer">
              📋 Quick Setup Guide
            </a>
            <a href="/README.md" target="_blank" rel="noopener noreferrer">
              📚 Full Documentation
            </a>
          </div>
        </div>
      </div>
    );
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'sheets':
        return <GoogleSheetsTest />;
      case 'drive':
        return <GoogleDriveTest />;
      case 'alerts':
        return <AlertTest />;
      case 'reports':
        return <ReportDashboard />;
      default:
        return <GoogleSheetsTest />;
    }
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>🚀 React Google Integration</h1>
          <p>Comprehensive Google Services Integration Platform</p>
        </div>
      </header>

      {/* Configuration Warning */}
      {renderConfigWarning()}

      {/* Navigation Tabs */}
      <nav className="app-nav">
        <div className="nav-container">
          <button
            className={`nav-tab ${activeTab === 'sheets' ? 'active' : ''}`}
            onClick={() => setActiveTab('sheets')}
          >
            📊 Google Sheets
          </button>
          <button
            className={`nav-tab ${activeTab === 'drive' ? 'active' : ''}`}
            onClick={() => setActiveTab('drive')}
          >
            💾 Google Drive
          </button>
          <button
            className={`nav-tab ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            🚨 Alerts
          </button>
          <button
            className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            📈 Reports
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">{renderTabContent()}</main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>🔗 Quick Links</h4>
            <ul>
              <li>
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Cloud Console
                </a>
              </li>
              <li>
                <a href="https://sheets.google.com/" target="_blank" rel="noopener noreferrer">
                  Google Sheets
                </a>
              </li>
              <li>
                <a href="https://drive.google.com/" target="_blank" rel="noopener noreferrer">
                  Google Drive
                </a>
              </li>
              <li>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Gmail App Passwords
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>📚 Documentation</h4>
            <ul>
              <li>
                <a href="/README.md" target="_blank" rel="noopener noreferrer">
                  Full Setup Guide
                </a>
              </li>
              <li>
                <a href="/QUICK_SETUP.md" target="_blank" rel="noopener noreferrer">
                  Quick Setup
                </a>
              </li>
              <li>
                <a href="/PROJECT_SUMMARY.md" target="_blank" rel="noopener noreferrer">
                  Project Summary
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>🛠️ Features</h4>
            <ul>
              <li>Google Sheets Integration</li>
              <li>Google Drive Management</li>
              <li>Email & Telegram Alerts</li>
              <li>Automated Reports</li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>ℹ️ Status</h4>
            <div className="status-indicators">
              <div className={`status-item ${configValid ? 'ok' : 'error'}`}>
                <span className="status-dot"></span>
                Configuration: {configValid ? 'OK' : 'Needs Setup'}
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 React Google Integration. Built with React, Express, and Google APIs.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
