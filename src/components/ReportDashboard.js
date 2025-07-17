import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import reportService from '../services/reportService';
import './ReportDashboard.css';

const ReportDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheetReport, setSheetReport] = useState(null);
  const [performanceReport, setPerformanceReport] = useState(null);
  const [overviewReport, setOverviewReport] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState('Orders');

  // Colors for charts
  const COLORS = ['#4285f4', '#34a853', '#ea4335', '#fbbc05', '#ff6d01', '#9c27b0'];

  // Load reports khi component mount
  useEffect(() => {
    loadAllReports();
  }, []);

  // Load tất cả reports
  const loadAllReports = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([loadSheetReport(), loadPerformanceReport(), loadOverviewReport()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load sheet report
  const loadSheetReport = async () => {
    try {
      const report = await reportService.generateSheetReport(selectedSheet);
      setSheetReport(report);
    } catch (err) {
      console.error('Error loading sheet report:', err);
    }
  };

  // Load performance report
  const loadPerformanceReport = async () => {
    try {
      const report = await reportService.generatePerformanceReport();
      setPerformanceReport(report);
    } catch (err) {
      console.error('Error loading performance report:', err);
    }
  };

  // Load overview report
  const loadOverviewReport = async () => {
    try {
      const report = await reportService.generateOverviewReport();
      setOverviewReport(report);
    } catch (err) {
      console.error('Error loading overview report:', err);
    }
  };

  // Export report
  const handleExport = () => {
    if (sheetReport) {
      const filename = `${selectedSheet}_report_${new Date().toISOString().split('T')[0]}.csv`;
      reportService.exportToCSV(sheetReport, filename);
    }
  };

  // Render statistics cards
  const renderStatsCards = () => {
    if (!sheetReport || !sheetReport.report || !sheetReport.report.statistics) {
      return null;
    }

    const stats = sheetReport.report.statistics;

    return (
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Records</h3>
            <p className="stat-value">{reportService.formatNumber(sheetReport.dataCount)}</p>
          </div>
        </div>

        {stats.totalRevenue && (
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>Total Revenue</h3>
              <p className="stat-value">{reportService.formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        )}

        {stats.avgRevenue && (
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>Avg Revenue</h3>
              <p className="stat-value">{reportService.formatCurrency(stats.avgRevenue)}</p>
            </div>
          </div>
        )}

        {stats.totalQuantity && (
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <h3>Total Quantity</h3>
              <p className="stat-value">{reportService.formatNumber(stats.totalQuantity)}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render charts
  const renderCharts = () => {
    if (!sheetReport || !sheetReport.report || !sheetReport.report.charts) {
      return null;
    }

    const charts = sheetReport.report.charts;

    return (
      <div className="charts-grid">
        {charts.map((chart, index) => (
          <div key={index} className="chart-container">
            <h3>{chart.title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              {chart.type === 'pie' ? (
                <PieChart>
                  <Pie
                    data={chart.data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chart.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : chart.type === 'line' ? (
                <LineChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="orders" stroke="#4285f4" strokeWidth={2} />
                </LineChart>
              ) : (
                <BarChart data={chart.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#34a853" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    );
  };

  // Render performance report
  const renderPerformanceReport = () => {
    if (!performanceReport) return null;

    return (
      <div className="performance-section">
        <h3>🚀 System Performance</h3>
        <div className="performance-grid">
          <div className="performance-summary">
            <h4>Overall Status</h4>
            <p className="total-time">Total Test Time: {performanceReport.totalTime}ms</p>
            <p className="timestamp">
              Last Check: {new Date(performanceReport.timestamp).toLocaleString()}
            </p>
          </div>

          <div className="service-status">
            <h4>Service Status</h4>
            <div className="services-list">
              {performanceReport.results.map((result, index) => (
                <div key={index} className={`service-item ${result.status.toLowerCase()}`}>
                  <span className="service-name">{result.service}</span>
                  <span className="service-status">{result.status}</span>
                  <span className="service-time">{result.responseTime}ms</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="report-dashboard">
      <div className="header">
        <h2>📈 Report Dashboard</h2>
        <p>Data analytics and system reports</p>
      </div>

      {/* Controls */}
      <div className="dashboard-controls">
        <div className="control-group">
          <label>Sheet to Analyze:</label>
          <select value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)}>
            <option value="Orders">Orders</option>
            <option value="Reports">Reports</option>
            <option value="Logs">Logs</option>
            <option value="Sheet1">Sheet1</option>
          </select>
        </div>

        <div className="action-buttons">
          <button onClick={loadAllReports} disabled={loading} className="refresh-btn">
            🔄 Refresh Reports
          </button>

          <button onClick={handleExport} disabled={loading || !sheetReport} className="export-btn">
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Generating reports...</p>
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

      {/* Statistics Cards */}
      {renderStatsCards()}

      {/* Charts */}
      {renderCharts()}

      {/* Performance Report */}
      {renderPerformanceReport()}

      {/* Summary Text */}
      {sheetReport && (
        <div className="summary-section">
          <h3>📋 Report Summary</h3>
          <div className="summary-content">
            <pre>{reportService.generateSummaryText(sheetReport)}</pre>
          </div>
        </div>
      )}

      {/* Raw Data (for debugging) */}
      {sheetReport && (
        <div className="debug-section">
          <details>
            <summary>🔍 Raw Report Data (Debug)</summary>
            <pre>{JSON.stringify(sheetReport, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default ReportDashboard;
