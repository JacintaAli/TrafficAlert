// API Service for TrafficAlert React Native App
import AsyncStorage from '@react-native-async-storage/async-storage';

// Inline config to avoid import issues
const API_CONFIG = {
  BASE_URL: 'http://172.20.10.2:5001/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

console.log('🔧 ApiService: Using inline API_CONFIG:', API_CONFIG);

// Use the configured base URL
const API_BASE_URL = API_CONFIG.BASE_URL;
console.log('🔧 ApiService: Using BASE_URL:', API_BASE_URL);

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    console.log('🔧 ApiService initialized with baseURL:', this.baseURL);
    console.log('🔧 API_CONFIG:', API_CONFIG);
    console.log('🔧 API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
  }

  // Get authentication token from storage
  async getToken() {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('authToken');
    }
    return this.token;
  }

  // Make API request with timeout and retry logic
  async request(endpoint, options = {}, retryCount = 0) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getToken();

    console.log('🌐 API Request:', endpoint, `(attempt ${retryCount + 1})`);
    console.log('🌐 Full URL:', url);
    console.log('🔑 Token available:', token ? 'Yes' : 'No');
    console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'None');
    console.log('📤 Request method:', options.method || 'GET');
    console.log('⏱️ Timeout set to:', API_CONFIG.TIMEOUT, 'ms');

    // Build headers with proper precedence
    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    // Only add Content-Type if not using FormData
    if (!options.body || !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      headers,
      ...options,
    };

    console.log('Request headers:', JSON.stringify(headers, null, 2));

    try {
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Request timeout reached, aborting...');
        controller.abort();
      }, API_CONFIG.TIMEOUT);

      console.log('🚀 Making fetch request...');
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('✅ Fetch request completed, status:', response.status);
      const data = await response.json();

      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        // Log detailed error information
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });

        // Log specific validation errors if available
        if (data.errors && Array.isArray(data.errors)) {
          console.error('Validation Errors:', data.errors.map(err => ({
            field: err.path || err.field,
            message: err.message,
            value: err.value
          })));
        }

        throw new Error(data.message || `API request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);

      // Handle specific error types
      if (error.name === 'AbortError') {
        throw new Error('Network request timed out. Please check your connection and try again.');
      }

      if (error.message.includes('Network request failed')) {
        throw new Error('Network request failed. Please check your internet connection.');
      }

      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      this.setToken(response.data.token);
    }

    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    await AsyncStorage.removeItem('authToken');
    this.token = null;
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  // Report methods
  async createReport(reportData, images = []) {
    console.log('Creating report with', images.length, 'images');

    // If no images, send as JSON to preserve data types
    if (images.length === 0) {
      console.log('Sending as JSON (no images)');
      return await this.request('/reports', {
        method: 'POST',
        body: JSON.stringify(reportData),
      });
    }

    // If images exist, use FormData
    console.log('Sending as FormData (with images)');
    const formData = new FormData();

    // Add report data
    Object.keys(reportData).forEach(key => {
      if (key === 'location') {
        // Send location as JSON string - backend controller will parse it
        formData.append(key, JSON.stringify(reportData[key]));
      } else {
        formData.append(key, reportData[key]);
      }
    });

    // Add images
    images.forEach((image, index) => {
      formData.append('images', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.name || `image_${index}.jpg`,
      });
    });

    // The request method will handle headers properly for FormData
    return await this.request('/reports', {
      method: 'POST',
      body: formData,
    });
  }

  async getReports(params = {}) {
    // Default to showing all reports (including expired ones)
    const defaultParams = { status: 'all', ...params };
    const queryString = new URLSearchParams(defaultParams).toString();
    return await this.request(`/reports?${queryString}`);
  }

  async getNearbyReports(latitude, longitude, radius = 5000) {
    return await this.request(
      `/reports/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
    );
  }

  async getUserReports(page = 1, limit = 20, status = null) {
    let url = `/users/reports?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    return await this.request(url);
  }

  async updateReport(reportId, updateData) {
    return await this.request(`/reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteReport(reportId) {
    return await this.request(`/reports/${reportId}`, {
      method: 'DELETE',
    });
  }

  async getReportById(id) {
    return await this.request(`/reports/${id}`);
  }

  async verifyReport(id) {
    return await this.request(`/reports/${id}/verify`, { method: 'POST' });
  }

  async markReportHelpful(id) {
    return await this.request(`/reports/${id}/helpful`, { method: 'POST' });
  }

  async removeReportHelpful(id) {
    return await this.request(`/reports/${id}/helpful`, { method: 'DELETE' });
  }

  async markReportDisputed(id) {
    return await this.request(`/reports/${id}/dispute`, { method: 'POST' });
  }

  async removeReportDispute(id) {
    return await this.request(`/reports/${id}/dispute`, { method: 'DELETE' });
  }

  async addComment(reportId, text) {
    return await this.request(`/reports/${reportId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async upvoteComment(reportId, commentId) {
    return await this.request(`/reports/${reportId}/comments/${commentId}/upvote`, {
      method: 'POST',
    });
  }

  async removeCommentUpvote(reportId, commentId) {
    return await this.request(`/reports/${reportId}/comments/${commentId}/upvote`, {
      method: 'DELETE',
    });
  }

  async deleteComment(reportId, commentId) {
    return await this.request(`/reports/${reportId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  async addReply(reportId, commentId, replyData) {
    return await this.request(`/reports/${reportId}/comments/${commentId}/replies`, {
      method: 'POST',
      body: JSON.stringify(replyData),
    });
  }

  async deleteReply(reportId, commentId, replyId) {
    return await this.request(`/reports/${reportId}/comments/${commentId}/replies/${replyId}`, {
      method: 'DELETE',
    });
  }

  async upvoteReply(reportId, commentId, replyId) {
    return await this.request(`/reports/${reportId}/comments/${commentId}/replies/${replyId}/upvote`, {
      method: 'POST',
    });
  }



  // User methods
  async getUserProfile() {
    return await this.request('/users/profile');
  }

  async updateProfile(profileData) {
    console.log('🔧 ApiService: updateProfile called with data:', profileData);
    console.log('🔧 ApiService: Stringified data:', JSON.stringify(profileData));

    const response = await this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });

    console.log('🔧 ApiService: updateProfile response:', response);
    return response;
  }

  async getUserStats() {
    return await this.request('/users/stats');
  }

  async uploadProfilePicture(imageFile) {
    console.log('📸 ApiService: Uploading profile picture...');
    console.log('📸 ApiService: Image file details:', imageFile);

    try {
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.name || 'profile.jpg',
      });

      console.log('📸 ApiService: FormData prepared, making request to /users/profile/picture');
      const response = await this.request('/users/profile/picture', {
        method: 'POST',
        body: formData,
      });

      console.log('📸 ApiService: Upload response received:', response);
      return response;
    } catch (error) {
      console.error('📸 ApiService: Upload error:', error);
      throw error;
    }
  }

  async changePassword(passwordData) {
    console.log('🔐 ApiService: Changing password...');
    return await this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }


}

// Export singleton instance
export default new ApiService();
