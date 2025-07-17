import { useEffect, useState } from 'react';
import googleDriveService from '../services/googleDriveService';
import './GoogleDriveTest.css';

const GoogleDriveTest = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [selectedFileId, setSelectedFileId] = useState('');

  // Load files khi component mount
  useEffect(() => {
    loadFiles();
  }, []);

  // Tải danh sách files
  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await googleDriveService.listFiles();
      setFiles(result.files || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Upload file
  const handleUpload = async () => {
    if (!uploadFile) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await googleDriveService.uploadFile(uploadFile);
      console.log('Upload result:', result);

      // Refresh file list
      await loadFiles();
      setUploadFile(null);

      // Reset file input
      const fileInput = document.getElementById('fileInput');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Tạo thư mục mới
  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    setLoading(true);
    setError(null);
    try {
      const result = await googleDriveService.createFolder(folderName);
      console.log('Create folder result:', result);
      await loadFiles();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Xóa file
  const handleDelete = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await googleDriveService.deleteFile(fileId);
      console.log('Delete result:', result);
      await loadFiles();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Chia sẻ file
  const handleShare = async () => {
    if (!selectedFileId || !shareEmail) {
      setError('Please select a file and enter an email address');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await googleDriveService.shareFile(selectedFileId, shareEmail);
      console.log('Share result:', result);
      setShareEmail('');
      setSelectedFileId('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Lấy public link
  const handleGetLink = async (fileId) => {
    try {
      const result = await googleDriveService.getFileLink(fileId);
      if (result.webViewLink) {
        window.open(result.webViewLink, '_blank');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Download file
  const handleDownload = async (fileId, fileName) => {
    setLoading(true);
    setError(null);
    try {
      await googleDriveService.downloadFile(fileId, fileName);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Render file list
  const renderFileList = () => {
    if (files.length === 0) {
      return (
        <div className="no-files">
          <p>📁 No files found in the folder</p>
        </div>
      );
    }

    return (
      <div className="file-list">
        <h3>📂 Files in Drive</h3>
        <div className="files-grid">
          {files.map((file) => (
            <div key={file.id} className="file-item">
              <div className="file-header">
                <span className="file-icon">
                  {googleDriveService.getFileTypeIcon(file.mimeType)}
                </span>
                <div className="file-info">
                  <h4 className="file-name">{file.name}</h4>
                  <p className="file-details">
                    {file.size ? googleDriveService.formatFileSize(parseInt(file.size)) : 'Folder'}
                    {file.modifiedTime && (
                      <span> • {new Date(file.modifiedTime).toLocaleDateString()}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="file-actions">
                <button
                  className="action-btn view-btn"
                  onClick={() => handleGetLink(file.id)}
                  title="Open in browser"
                >
                  👁️
                </button>

                {file.mimeType !== 'application/vnd.google-apps.folder' && (
                  <button
                    className="action-btn download-btn"
                    onClick={() => handleDownload(file.id, file.name)}
                    title="Download"
                  >
                    ⬇️
                  </button>
                )}

                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(file.id, file.name)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="google-drive-test">
      <div className="header">
        <h2>💾 Google Drive Integration</h2>
        <p>Upload, manage, and share files on Google Drive</p>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <h3>📤 Upload File</h3>
        <div className="upload-area">
          <input
            id="fileInput"
            type="file"
            onChange={(e) => setUploadFile(e.target.files[0])}
            className="file-input"
          />
          {uploadFile && (
            <div className="selected-file">
              <span>Selected: {uploadFile.name}</span>
              <span className="file-size">
                ({googleDriveService.formatFileSize(uploadFile.size)})
              </span>
            </div>
          )}
          <div className="upload-buttons">
            <button onClick={handleUpload} disabled={loading || !uploadFile} className="upload-btn">
              📤 Upload File
            </button>
            <button onClick={handleCreateFolder} disabled={loading} className="folder-btn">
              📁 Create Folder
            </button>
            <button onClick={loadFiles} disabled={loading} className="refresh-btn">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Share Section */}
      <div className="share-section">
        <h3>🔗 Share File</h3>
        <div className="share-controls">
          <select
            value={selectedFileId}
            onChange={(e) => setSelectedFileId(e.target.value)}
            className="file-select"
          >
            <option value="">Select a file to share...</option>
            {files
              .filter((f) => f.mimeType !== 'application/vnd.google-apps.folder')
              .map((file) => (
                <option key={file.id} value={file.id}>
                  {file.name}
                </option>
              ))}
          </select>

          <input
            type="email"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            placeholder="Enter email address"
            className="email-input"
          />

          <button
            onClick={handleShare}
            disabled={loading || !selectedFileId || !shareEmail}
            className="share-btn"
          >
            🔗 Share
          </button>
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

      {/* File List */}
      {renderFileList()}
    </div>
  );
};

export default GoogleDriveTest;
