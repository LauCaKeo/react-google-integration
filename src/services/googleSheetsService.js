import googleConfig from '../config/googleConfig';

class GoogleSheetsService {
  constructor() {
    this.baseUrl = googleConfig.api_base_url;
  }

  // Đọc dữ liệu từ Google Sheet
  async readSheet(sheetName = 'Sheet1', range = 'A1:Z1000') {
    try {
      const response = await fetch(`${this.baseUrl}/sheets/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: googleConfig.spreadsheet_id,
          range: `${sheetName}!${range}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error reading sheet:', error);
      throw error;
    }
  }

  // Ghi dữ liệu vào Google Sheet
  async writeSheet(sheetName = 'Sheet1', range = 'A1', values = []) {
    try {
      const response = await fetch(`${this.baseUrl}/sheets/write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: googleConfig.spreadsheet_id,
          range: `${sheetName}!${range}`,
          values: values,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error writing sheet:', error);
      throw error;
    }
  }

  // Thêm dữ liệu vào cuối sheet
  async appendSheet(sheetName = 'Sheet1', values = []) {
    try {
      const response = await fetch(`${this.baseUrl}/sheets/append`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: googleConfig.spreadsheet_id,
          range: `${sheetName}!A1`,
          values: values,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error appending sheet:', error);
      throw error;
    }
  }

  // Tạo sheet mới
  async createSheet(sheetName) {
    try {
      const response = await fetch(`${this.baseUrl}/sheets/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: googleConfig.spreadsheet_id,
          sheetName: sheetName,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating sheet:', error);
      throw error;
    }
  }

  // Lấy thông tin về spreadsheet
  async getSpreadsheetInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/sheets/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: googleConfig.spreadsheet_id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting spreadsheet info:', error);
      throw error;
    }
  }

  // Parse CSV data thành array
  parseCSVData(csvText) {
    const lines = csvText.split('\n');
    return lines.map((line) => line.split(',').map((cell) => cell.trim()));
  }

  // Format data thành CSV
  formatToCSV(data) {
    return data.map((row) => row.join(',')).join('\n');
  }
}

export default new GoogleSheetsService();
