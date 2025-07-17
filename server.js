const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { google } = require('googleapis');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Google API Setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.REACT_APP_GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.REACT_APP_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.REACT_APP_GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.REACT_APP_GOOGLE_CLIENT_EMAIL)}`,
  },
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
  ],
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

// Email transporter
let transporter = null;
if (process.env.REACT_APP_EMAIL_USER && process.env.REACT_APP_EMAIL_PASS) {
  transporter = nodemailer.createTransporter({
    service: process.env.REACT_APP_EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.REACT_APP_EMAIL_USER,
      pass: process.env.REACT_APP_EMAIL_PASS,
    },
  });
}

// Alert history storage (in-memory for demo)
let alertHistory = [];

// Helper function to add to alert history
const addToAlertHistory = (type, subject, message) => {
  alertHistory.unshift({
    type,
    subject,
    message,
    timestamp: new Date().toISOString(),
  });

  // Keep only last 50 alerts
  if (alertHistory.length > 50) {
    alertHistory = alertHistory.slice(0, 50);
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      sheets: !!process.env.REACT_APP_GOOGLE_CLIENT_EMAIL,
      email: !!transporter,
      telegram: !!(
        process.env.REACT_APP_TELEGRAM_BOT_TOKEN && process.env.REACT_APP_TELEGRAM_CHAT_ID
      ),
    },
  });
});

// Google Sheets Routes

// Read sheet
app.post('/api/sheets/read', async (req, res) => {
  try {
    const { spreadsheetId, range } = req.body;

    if (!spreadsheetId || !range) {
      return res.status(400).json({ error: 'spreadsheetId and range are required' });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    res.json({
      success: true,
      values: response.data.values || [],
      range: response.data.range,
    });
  } catch (error) {
    console.error('Error reading sheet:', error);
    res.status(500).json({
      error: 'Failed to read sheet',
      details: error.message,
    });
  }
});

// Write to sheet
app.post('/api/sheets/write', async (req, res) => {
  try {
    const { spreadsheetId, range, values } = req.body;

    if (!spreadsheetId || !range || !values) {
      return res.status(400).json({ error: 'spreadsheetId, range, and values are required' });
    }

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });

    res.json({
      success: true,
      updatedCells: response.data.updatedCells,
      updatedRange: response.data.updatedRange,
    });
  } catch (error) {
    console.error('Error writing to sheet:', error);
    res.status(500).json({
      error: 'Failed to write to sheet',
      details: error.message,
    });
  }
});

// Append to sheet
app.post('/api/sheets/append', async (req, res) => {
  try {
    const { spreadsheetId, range, values } = req.body;

    if (!spreadsheetId || !range || !values) {
      return res.status(400).json({ error: 'spreadsheetId, range, and values are required' });
    }

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });

    res.json({
      success: true,
      updates: response.data.updates,
    });
  } catch (error) {
    console.error('Error appending to sheet:', error);
    res.status(500).json({
      error: 'Failed to append to sheet',
      details: error.message,
    });
  }
});

// Create new sheet
app.post('/api/sheets/create', async (req, res) => {
  try {
    const { spreadsheetId, sheetName } = req.body;

    if (!spreadsheetId || !sheetName) {
      return res.status(400).json({ error: 'spreadsheetId and sheetName are required' });
    }

    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });

    res.json({
      success: true,
      sheetId: response.data.replies[0].addSheet.properties.sheetId,
      sheetName: sheetName,
    });
  } catch (error) {
    console.error('Error creating sheet:', error);
    res.status(500).json({
      error: 'Failed to create sheet',
      details: error.message,
    });
  }
});

// Get spreadsheet info
app.post('/api/sheets/info', async (req, res) => {
  try {
    const { spreadsheetId } = req.body;

    if (!spreadsheetId) {
      return res.status(400).json({ error: 'spreadsheetId is required' });
    }

    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    res.json({
      success: true,
      properties: response.data.properties,
      sheets: response.data.sheets.map((sheet) => ({
        properties: sheet.properties,
      })),
    });
  } catch (error) {
    console.error('Error getting spreadsheet info:', error);
    res.status(500).json({
      error: 'Failed to get spreadsheet info',
      details: error.message,
    });
  }
});

// Google Drive Routes

// Upload file
app.post('/api/drive/upload', async (req, res) => {
  try {
    const { file, fileName, folderId } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const fileMetadata = {
      name: fileName || file.originalname,
      parents: folderId ? [folderId] : undefined,
    };

    const media = {
      mimeType: file.mimetype,
      body: file.buffer,
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,size,mimeType',
    });

    res.json({
      success: true,
      file: response.data,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      error: 'Failed to upload file',
      details: error.message,
    });
  }
});

// List files
app.post('/api/drive/list', async (req, res) => {
  try {
    const { folderId } = req.body;

    let query = 'trashed=false';
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    const response = await drive.files.list({
      q: query,
      fields: 'files(id,name,size,mimeType,modifiedTime,webViewLink)',
      orderBy: 'modifiedTime desc',
    });

    res.json({
      success: true,
      files: response.data.files,
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      error: 'Failed to list files',
      details: error.message,
    });
  }
});

// Create folder
app.post('/api/drive/create-folder', async (req, res) => {
  try {
    const { folderName, parentFolderId } = req.body;

    if (!folderName) {
      return res.status(400).json({ error: 'folderName is required' });
    }

    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined,
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      fields: 'id,name',
    });

    res.json({
      success: true,
      folder: response.data,
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({
      error: 'Failed to create folder',
      details: error.message,
    });
  }
});

// Delete file
app.post('/api/drive/delete', async (req, res) => {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required' });
    }

    await drive.files.delete({
      fileId,
    });

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      error: 'Failed to delete file',
      details: error.message,
    });
  }
});

// Share file
app.post('/api/drive/share', async (req, res) => {
  try {
    const { fileId, email, role = 'reader' } = req.body;

    if (!fileId || !email) {
      return res.status(400).json({ error: 'fileId and email are required' });
    }

    const response = await drive.permissions.create({
      fileId,
      requestBody: {
        role,
        type: 'user',
        emailAddress: email,
      },
    });

    res.json({
      success: true,
      permission: response.data,
    });
  } catch (error) {
    console.error('Error sharing file:', error);
    res.status(500).json({
      error: 'Failed to share file',
      details: error.message,
    });
  }
});

// Get file link
app.post('/api/drive/link', async (req, res) => {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'fileId is required' });
    }

    const response = await drive.files.get({
      fileId,
      fields: 'webViewLink,webContentLink',
    });

    res.json({
      success: true,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
    });
  } catch (error) {
    console.error('Error getting file link:', error);
    res.status(500).json({
      error: 'Failed to get file link',
      details: error.message,
    });
  }
});

// Alert Routes

// Send email alert
app.post('/api/alerts/email', async (req, res) => {
  try {
    if (!transporter) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const { to, subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'subject and message are required' });
    }

    const mailOptions = {
      from: process.env.REACT_APP_EMAIL_USER,
      to: to || process.env.REACT_APP_ALERT_EMAIL_TO,
      subject,
      text: message,
      html: message.replace(/\n/g, '<br>'),
    };

    const info = await transporter.sendMail(mailOptions);

    addToAlertHistory('EMAIL', subject, message);

    res.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message,
    });
  }
});

// Send Telegram alert
app.post('/api/alerts/telegram', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const botToken = process.env.REACT_APP_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.REACT_APP_TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(500).json({ error: 'Telegram not configured' });
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    });

    addToAlertHistory('TELEGRAM', 'Telegram Alert', message);

    res.json({
      success: true,
      messageId: response.data.result.message_id,
    });
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    res.status(500).json({
      error: 'Failed to send Telegram message',
      details: error.message,
    });
  }
});

// Test email connection
app.post('/api/alerts/test-email', async (req, res) => {
  try {
    if (!transporter) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    await transporter.verify();

    // Send test email
    const testMailOptions = {
      from: process.env.REACT_APP_EMAIL_USER,
      to: process.env.REACT_APP_ALERT_EMAIL_TO,
      subject: '✅ Email Test - React Google Integration',
      text: 'This is a test email from React Google Integration system.\n\nIf you receive this, your email configuration is working correctly!',
    };

    await transporter.sendMail(testMailOptions);

    res.json({
      success: true,
      message: 'Email connection test successful',
    });
  } catch (error) {
    console.error('Email test failed:', error);
    res.status(500).json({
      error: 'Email connection test failed',
      details: error.message,
    });
  }
});

// Test Telegram connection
app.post('/api/alerts/test-telegram', async (req, res) => {
  try {
    const botToken = process.env.REACT_APP_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.REACT_APP_TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(500).json({ error: 'Telegram not configured' });
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: chatId,
      text: '✅ Telegram Test - React Google Integration\n\nIf you receive this, your Telegram configuration is working correctly!',
    });

    res.json({
      success: true,
      message: 'Telegram connection test successful',
      messageId: response.data.result.message_id,
    });
  } catch (error) {
    console.error('Telegram test failed:', error);
    res.status(500).json({
      error: 'Telegram connection test failed',
      details: error.message,
    });
  }
});

// Get alert history
app.get('/api/alerts/history', (req, res) => {
  res.json({
    success: true,
    alerts: alertHistory,
  });
});

// Report Routes

// Generate overview report
app.get('/api/reports/overview', async (req, res) => {
  try {
    const report = {
      timestamp: new Date().toISOString(),
      systemStatus: {
        sheets: !!process.env.REACT_APP_GOOGLE_CLIENT_EMAIL,
        drive: !!process.env.REACT_APP_GOOGLE_CLIENT_EMAIL,
        email: !!transporter,
        telegram: !!(
          process.env.REACT_APP_TELEGRAM_BOT_TOKEN && process.env.REACT_APP_TELEGRAM_CHAT_ID
        ),
      },
      alertHistory: alertHistory.length,
      uptime: process.uptime(),
    };

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error generating overview report:', error);
    res.status(500).json({
      error: 'Failed to generate overview report',
      details: error.message,
    });
  }
});

// Scheduled tasks
if (process.env.NODE_ENV !== 'development') {
  // Daily report at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily report...');

    if (transporter) {
      try {
        const reportData = {
          timestamp: new Date().toISOString(),
          alertCount: alertHistory.length,
          systemUptime: process.uptime(),
        };

        const mailOptions = {
          from: process.env.REACT_APP_EMAIL_USER,
          to: process.env.REACT_APP_ALERT_EMAIL_TO,
          subject: '📊 Daily Report - React Google Integration',
          text: `Daily System Report\n\nGenerated: ${reportData.timestamp}\nAlerts in last 24h: ${reportData.alertCount}\nSystem uptime: ${Math.floor(reportData.systemUptime / 3600)} hours\n\nSystem Status: All services operational.`,
        };

        await transporter.sendMail(mailOptions);
        console.log('Daily report sent successfully');
      } catch (error) {
        console.error('Failed to send daily report:', error);
      }
    }
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: error.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(
    `📊 Google Sheets: ${!!process.env.REACT_APP_GOOGLE_CLIENT_EMAIL ? 'Configured' : 'Not configured'}`,
  );
  console.log(`📧 Email: ${!!transporter ? 'Configured' : 'Not configured'}`);
  console.log(
    `📱 Telegram: ${!!(process.env.REACT_APP_TELEGRAM_BOT_TOKEN && process.env.REACT_APP_TELEGRAM_CHAT_ID) ? 'Configured' : 'Not configured'}`,
  );
});
