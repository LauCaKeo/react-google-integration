import { useEffect, useState } from 'react';
import googleSheetsService from '../services/googleSheetsService';
import './GoogleSheetsTest.css';

const GoogleSheetsTest = () => {
  const [sheetData, setSheetData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheetName, setSheetName] = useState('Orders');
  const [range, setRange] = useState('A1:Z100');
  const [newData, setNewData] = useState('');
  const [spreadsheetInfo, setSpreadsheetInfo] = useState(null);

  // Đọc dữ liệu từ sheet
  const handleReadSheet = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await googleSheetsService.readSheet(sheetName, range);
      setSheetData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ghi dữ liệu vào sheet
  const handleWriteSheet = async () => {
    if (!newData.trim()) {
      setError('Please enter data to write');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Parse CSV data
      const rows = googleSheetsService.parseCSVData(newData);
      const result = await googleSheetsService.writeSheet(sheetName, 'A1', rows);
      console.log('Write result:', result);

      // Refresh data
      await handleReadSheet();
      setNewData('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Thêm dữ liệu vào cuối sheet
  const handleAppendSheet = async () => {
    if (!newData.trim()) {
      setError('Please enter data to append');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rows = googleSheetsService.parseCSVData(newData);
      const result = await googleSheetsService.appendSheet(sheetName, rows);
      console.log('Append result:', result);

      // Refresh data
      await handleReadSheet();
      setNewData('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Tạo sheet mới
  const handleCreateSheet = async () => {
    const newSheetName = prompt('Enter new sheet name:');
    if (!newSheetName) return;

    setLoading(true);
    setError(null);
    try {
      const result = await googleSheetsService.createSheet(newSheetName);
      console.log('Create sheet result:', result);
      await getSpreadsheetInfo();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Lấy thông tin spreadsheet
  const getSpreadsheetInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await googleSheetsService.getSpreadsheetInfo();
      setSpreadsheetInfo(info);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load spreadsheet info khi component mount
  useEffect(() => {
    getSpreadsheetInfo();
  }, []);

  // Render data table
  const renderDataTable = () => {
    if (!sheetData || !sheetData.values) return null;

    return (
      <div className="data-table">
        <h3>Sheet Data: {sheetName}</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {sheetData.values[0]?.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheetData.values.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="data-info">
          Rows: {sheetData.values.length - 1} | Columns: {sheetData.values[0]?.length || 0}
        </p>
      </div>
    );
  };

  return (
    <div className="google-sheets-test">
      <div className="header">
        <h2>📊 Google Sheets Integration</h2>
        <p>Test reading, writing, and managing Google Sheets data</p>
      </div>

      {/* Spreadsheet Info */}
      {spreadsheetInfo && (
        <div className="info-panel">
          <h3>📋 Spreadsheet Info</h3>
          <p>
            <strong>Title:</strong> {spreadsheetInfo.properties?.title}
          </p>
          <p>
            <strong>Sheets:</strong>{' '}
            {spreadsheetInfo.sheets?.map((s) => s.properties.title).join(', ')}
          </p>
          <button onClick={getSpreadsheetInfo} disabled={loading}>
            🔄 Refresh Info
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="controls">
        <div className="control-group">
          <label>Sheet Name:</label>
          <input
            type="text"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            placeholder="e.g., Orders, Data, Sheet1"
          />
        </div>

        <div className="control-group">
          <label>Range:</label>
          <input
            type="text"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder="e.g., A1:Z100"
          />
        </div>

        <div className="action-buttons">
          <button onClick={handleReadSheet} disabled={loading}>
            📖 Read Sheet
          </button>
          <button onClick={handleCreateSheet} disabled={loading}>
            ➕ Create Sheet
          </button>
        </div>
      </div>

      {/* Data Input */}
      <div className="data-input">
        <h3>📝 Add Data</h3>
        <textarea
          value={newData}
          onChange={(e) => setNewData(e.target.value)}
          placeholder="Enter CSV data (comma-separated values, one row per line)"
          rows="5"
        />
        <div className="input-buttons">
          <button onClick={handleWriteSheet} disabled={loading || !newData.trim()}>
            ✏️ Write Data (Replace)
          </button>
          <button onClick={handleAppendSheet} disabled={loading || !newData.trim()}>
            ➕ Append Data
          </button>
        </div>
        <div className="sample-data">
          <strong>Sample Data:</strong>
          <code>date,product,quantity,total,status</code>
          <br />
          <code>2024-01-01,Laptop,1,15000000,completed</code>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Processing...</p>
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

      {/* Data Display */}
      {renderDataTable()}
    </div>
  );
};

export default GoogleSheetsTest;
