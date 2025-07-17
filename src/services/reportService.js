import googleConfig from '../config/googleConfig';
import googleSheetsService from './googleSheetsService';

class ReportService {
  constructor() {
    this.baseUrl = googleConfig.api_base_url;
  }

  // Tạo báo cáo tổng quan
  async generateOverviewReport() {
    try {
      const response = await fetch(`${this.baseUrl}/reports/overview`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating overview report:', error);
      throw error;
    }
  }

  // Tạo báo cáo từ Google Sheets data
  async generateSheetReport(sheetName = 'Orders') {
    try {
      // Đọc dữ liệu từ sheet
      const sheetData = await googleSheetsService.readSheet(sheetName);

      if (!sheetData.values || sheetData.values.length === 0) {
        return { error: 'No data found in sheet' };
      }

      // Parse headers và data
      const headers = sheetData.values[0];
      const rows = sheetData.values.slice(1);

      // Tạo báo cáo
      const report = this.analyzeData(headers, rows);

      return {
        success: true,
        sheetName: sheetName,
        dataCount: rows.length,
        report: report,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error generating sheet report:', error);
      throw error;
    }
  }

  // Phân tích dữ liệu
  analyzeData(headers, rows) {
    const analysis = {
      totalRecords: rows.length,
      summary: {},
      charts: [],
      statistics: {},
    };

    // Tìm cột quantity và total
    const quantityIndex = headers.findIndex((h) => h.toLowerCase().includes('quantity'));
    const totalIndex = headers.findIndex((h) => h.toLowerCase().includes('total'));
    const statusIndex = headers.findIndex((h) => h.toLowerCase().includes('status'));
    const dateIndex = headers.findIndex((h) => h.toLowerCase().includes('date'));

    // Tính toán thống kê cơ bản
    if (quantityIndex !== -1) {
      const quantities = rows.map((row) => parseInt(row[quantityIndex]) || 0);
      analysis.statistics.totalQuantity = quantities.reduce((a, b) => a + b, 0);
      analysis.statistics.avgQuantity = analysis.statistics.totalQuantity / quantities.length;
      analysis.statistics.maxQuantity = Math.max(...quantities);
      analysis.statistics.minQuantity = Math.min(...quantities);
    }

    if (totalIndex !== -1) {
      const totals = rows.map((row) => parseFloat(row[totalIndex]) || 0);
      analysis.statistics.totalRevenue = totals.reduce((a, b) => a + b, 0);
      analysis.statistics.avgRevenue = analysis.statistics.totalRevenue / totals.length;
      analysis.statistics.maxRevenue = Math.max(...totals);
      analysis.statistics.minRevenue = Math.min(...totals);
    }

    // Phân tích theo status
    if (statusIndex !== -1) {
      const statusCount = {};
      rows.forEach((row) => {
        const status = row[statusIndex] || 'unknown';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
      analysis.summary.statusBreakdown = statusCount;

      // Data cho pie chart
      analysis.charts.push({
        type: 'pie',
        title: 'Status Distribution',
        data: Object.entries(statusCount).map(([status, count]) => ({
          name: status,
          value: count,
        })),
      });
    }

    // Phân tích theo thời gian
    if (dateIndex !== -1) {
      const dateCount = {};
      rows.forEach((row) => {
        const date = row[dateIndex] || 'unknown';
        dateCount[date] = (dateCount[date] || 0) + 1;
      });

      // Data cho line chart
      analysis.charts.push({
        type: 'line',
        title: 'Orders Over Time',
        data: Object.entries(dateCount).map(([date, count]) => ({
          date: date,
          orders: count,
        })),
      });
    }

    return analysis;
  }

  // Tạo báo cáo performance
  async generatePerformanceReport() {
    try {
      const startTime = Date.now();

      // Test các APIs
      const tests = [
        { name: 'Google Sheets', test: () => googleSheetsService.getSpreadsheetInfo() },
        {
          name: 'Email Service',
          test: () => fetch(`${this.baseUrl}/alerts/test-email`, { method: 'POST' }),
        },
        { name: 'Backend Health', test: () => fetch(`${this.baseUrl}/health`) },
      ];

      const results = [];

      for (const testCase of tests) {
        const testStart = Date.now();
        try {
          await testCase.test();
          results.push({
            service: testCase.name,
            status: 'OK',
            responseTime: Date.now() - testStart,
            error: null,
          });
        } catch (error) {
          results.push({
            service: testCase.name,
            status: 'ERROR',
            responseTime: Date.now() - testStart,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        totalTime: Date.now() - startTime,
        results: results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error generating performance report:', error);
      throw error;
    }
  }

  // Export báo cáo ra CSV
  exportToCSV(reportData, filename = 'report.csv') {
    try {
      let csvContent = '';

      if (reportData.report && reportData.report.statistics) {
        csvContent += 'Metric,Value\n';
        Object.entries(reportData.report.statistics).forEach(([key, value]) => {
          csvContent += `${key},${value}\n`;
        });
      }

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true, message: 'Report exported successfully' };
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }

  // Format số tiền
  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  // Format số
  formatNumber(number) {
    return new Intl.NumberFormat('vi-VN').format(number);
  }

  // Format phần trăm
  formatPercentage(value, total) {
    return ((value / total) * 100).toFixed(2) + '%';
  }

  // Tạo summary text
  generateSummaryText(reportData) {
    if (!reportData.report) return 'No data available';

    const stats = reportData.report.statistics;
    let summary = `📊 REPORT SUMMARY\n\n`;
    summary += `Total Records: ${reportData.dataCount}\n`;

    if (stats.totalRevenue) {
      summary += `Total Revenue: ${this.formatCurrency(stats.totalRevenue)}\n`;
      summary += `Average Revenue: ${this.formatCurrency(stats.avgRevenue)}\n`;
    }

    if (stats.totalQuantity) {
      summary += `Total Quantity: ${this.formatNumber(stats.totalQuantity)}\n`;
      summary += `Average Quantity: ${stats.avgQuantity.toFixed(2)}\n`;
    }

    summary += `\nGenerated: ${new Date().toLocaleString()}`;

    return summary;
  }
}

export default new ReportService();
