import googleConfig from '../config/googleConfig';

class GoogleDriveService {
  constructor() {
    this.baseUrl = googleConfig.api_base_url;
  }

  // Upload file lên Google Drive
  async uploadFile(file, fileName = null, folderId = null) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      if (fileName) {
        formData.append('fileName', fileName);
      }

      formData.append('folderId', folderId || googleConfig.drive_folder_id);

      const response = await fetch(`${this.baseUrl}/drive/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Liệt kê files trong thư mục
  async listFiles(folderId = null) {
    try {
      const response = await fetch(`${this.baseUrl}/drive/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: folderId || googleConfig.drive_folder_id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  // Tạo thư mục mới
  async createFolder(folderName, parentFolderId = null) {
    try {
      const response = await fetch(`${this.baseUrl}/drive/create-folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderName: folderName,
          parentFolderId: parentFolderId || googleConfig.drive_folder_id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  // Xóa file hoặc thư mục
  async deleteFile(fileId) {
    try {
      const response = await fetch(`${this.baseUrl}/drive/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: fileId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Chia sẻ file với email
  async shareFile(fileId, email, role = 'reader') {
    try {
      const response = await fetch(`${this.baseUrl}/drive/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: fileId,
          email: email,
          role: role, // 'reader', 'writer', 'commenter'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sharing file:', error);
      throw error;
    }
  }

  // Lấy public link của file
  async getFileLink(fileId) {
    try {
      const response = await fetch(`${this.baseUrl}/drive/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: fileId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting file link:', error);
      throw error;
    }
  }

  // Download file
  async downloadFile(fileId, fileName) {
    try {
      const response = await fetch(`${this.baseUrl}/drive/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: fileId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      // Tạo download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true, message: 'File downloaded successfully' };
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file type icon
  getFileTypeIcon(mimeType) {
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('document')) return '📝';
    if (mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('video')) return '🎥';
    if (mimeType.includes('audio')) return '🎵';
    return '📁';
  }
}

export default new GoogleDriveService();
