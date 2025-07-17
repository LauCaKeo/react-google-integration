import { useEffect, useState } from 'react';
import alertService from '../services/alertService';
import './AlertTest.css';

const AlertTest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    message: '',
  });
  const [telegramMessage, setTelegramMessage] = useState('');
  const [thresholdForm, setThresholdForm] = useState({
    value: '',
    metric: 'sales',
    type: 'high',
  });
  const [alertHistory, setAlertHistory] = useState([]);

  // Load alert history khi component mount
  useEffect(() => {
    loadAlertHistory();
  }, []);

  // Load alert history
  const loadAlertHistory = async () => {
    try {
      const history = await alertService.getAlertHistory();
      setAlertHistory(history.alerts || []);
    } catch (err) {
      console.error('Error loading alert history:', err);
    }
  };

  // Gửi email alert
  const handleSendEmail = async () => {
    if (!emailForm.subject || !emailForm.message) {
      setError('Please fill in subject and message');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await alertService.sendEmailAlert(
        emailForm.subject,
        emailForm.message,
        emailForm.to || null,
      );

      setSuccess('Email sent successfully!');
      setEmailForm({ to: '', subject: '', message: '' });
      await loadAlertHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Gửi Telegram alert
  const handleSendTelegram = async () => {
    if (!telegramMessage.trim()) {
      setError('Please enter a message');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await alertService.sendTelegramAlert(telegramMessage);
      setSuccess('Telegram message sent successfully!');
      setTelegramMessage('');
      await loadAlertHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test threshold alert
  const handleThresholdAlert = async () => {
    if (!thresholdForm.value) {
      setError('Please enter a value');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await alertService.checkThresholdAlert(
        parseFloat(thresholdForm.value),
        thresholdForm.metric,
        thresholdForm.type,
      );

      if (result.alertSent) {
        setSuccess(
          `Threshold alert sent! Value ${result.value} exceeded threshold ${result.threshold}`,
        );
      } else {
        setSuccess(
          `No alert needed. Value ${result.value} is within threshold ${result.threshold}`,
        );
      }

      await loadAlertHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test email connection
  const handleTestEmail = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await alertService.testEmailConnection();
      setSuccess('Email connection test successful!');
    } catch (err) {
      setError(`Email connection test failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test Telegram connection
  const handleTestTelegram = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await alertService.testTelegramConnection();
      setSuccess('Telegram connection test successful!');
    } catch (err) {
      setError(`Telegram connection test failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Send scheduled report
  const handleScheduledReport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const reportData = {
        totalOrders: 150,
        totalRevenue: 45000000,
        avgOrderValue: 300000,
        pendingOrders: 12,
        completedOrders: 138,
      };

      const result = await alertService.sendScheduledReport(reportData);
      setSuccess('Scheduled report sent successfully!');
      await loadAlertHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="alert-test">
      <div className="header">
        <h2>🚨 Alert System</h2>
        <p>Test email and Telegram notifications</p>
      </div>

      {/* Connection Tests */}
      <div className="test-section">
        <h3>🔧 Connection Tests</h3>
        <div className="test-buttons">
          <button onClick={handleTestEmail} disabled={loading} className="test-btn email-test">
            📧 Test Email
          </button>
          <button
            onClick={handleTestTelegram}
            disabled={loading}
            className="test-btn telegram-test"
          >
            📱 Test Telegram
          </button>
        </div>
      </div>

      {/* Email Alert */}
      <div className="alert-section">
        <h3>📧 Send Email Alert</h3>
        <div className="email-form">
          <div className="form-group">
            <label>To (optional):</label>
            <input
              type="email"
              value={emailForm.to}
              onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
              placeholder="Leave empty to use default recipient"
            />
          </div>

          <div className="form-group">
            <label>Subject:</label>
            <input
              type="text"
              value={emailForm.subject}
              onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              placeholder="Enter email subject"
            />
          </div>

          <div className="form-group">
            <label>Message:</label>
            <textarea
              value={emailForm.message}
              onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
              placeholder="Enter email message"
              rows="4"
            />
          </div>

          <button
            onClick={handleSendEmail}
            disabled={loading || !emailForm.subject || !emailForm.message}
            className="send-btn email-btn"
          >
            📧 Send Email
          </button>
        </div>
      </div>

      {/* Telegram Alert */}
      <div className="alert-section">
        <h3>📱 Send Telegram Alert</h3>
        <div className="telegram-form">
          <div className="form-group">
            <label>Message:</label>
            <textarea
              value={telegramMessage}
              onChange={(e) => setTelegramMessage(e.target.value)}
              placeholder="Enter Telegram message"
              rows="3"
            />
          </div>

          <button
            onClick={handleSendTelegram}
            disabled={loading || !telegramMessage.trim()}
            className="send-btn telegram-btn"
          >
            📱 Send Telegram
          </button>
        </div>
      </div>

      {/* Threshold Alert */}
      <div className="alert-section">
        <h3>⚠️ Threshold Alert Test</h3>
        <div className="threshold-form">
          <div className="form-row">
            <div className="form-group">
              <label>Value:</label>
              <input
                type="number"
                value={thresholdForm.value}
                onChange={(e) => setThresholdForm({ ...thresholdForm, value: e.target.value })}
                placeholder="Enter value to test"
              />
            </div>

            <div className="form-group">
              <label>Metric:</label>
              <input
                type="text"
                value={thresholdForm.metric}
                onChange={(e) => setThresholdForm({ ...thresholdForm, metric: e.target.value })}
                placeholder="e.g., sales, orders, inventory"
              />
            </div>

            <div className="form-group">
              <label>Type:</label>
              <select
                value={thresholdForm.type}
                onChange={(e) => setThresholdForm({ ...thresholdForm, type: e.target.value })}
              >
                <option value="high">High Alert</option>
                <option value="low">Low Alert</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleThresholdAlert}
            disabled={loading || !thresholdForm.value}
            className="send-btn threshold-btn"
          >
            ⚠️ Test Threshold
          </button>

          <div className="threshold-info">
            <p>
              <strong>Current Thresholds:</strong>
            </p>
            <p>High: 100 | Low: 10</p>
          </div>
        </div>
      </div>

      {/* Scheduled Report */}
      <div className="alert-section">
        <h3>📊 Send Report</h3>
        <div className="report-form">
          <p>Send a sample scheduled report with mock data</p>
          <button
            onClick={handleScheduledReport}
            disabled={loading}
            className="send-btn report-btn"
          >
            📊 Send Sample Report
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Sending...</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="success">
          <h3>✅ Success</h3>
          <p>{success}</p>
          <button onClick={() => setSuccess(null)}>Dismiss</button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Alert History */}
      {alertHistory.length > 0 && (
        <div className="history-section">
          <h3>📋 Recent Alerts</h3>
          <div className="history-list">
            {alertHistory.slice(0, 5).map((alert, index) => (
              <div key={index} className="history-item">
                <div className="alert-type">{alert.type}</div>
                <div className="alert-content">
                  <strong>{alert.subject}</strong>
                  <span className="alert-time">{alert.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertTest;
