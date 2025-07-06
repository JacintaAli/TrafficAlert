// API Service for TrafficAlert React Native App
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

// Use the configured base URL
const API_BASE_URL = API_CONFIG.BASE_URL;

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    console.log('🔧 ApiService initialized with baseURL:', this.baseURL);
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

    console.log('API Request:', endpoint, `(attempt ${retryCount + 1})`);
    console.log('Token available:', token ? 'Yes' : 'No');
    console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'None');
    console.log('Request method:', options.method || 'GET');

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
      const startTime = Date.now();
      console.log(`⏰ Starting request at: ${new Date().toISOString()}`);
      console.log(`🎯 Request URL: ${url}`);
      console.log(`⏱️  Timeout set to: ${API_CONFIG.TIMEOUT || 30000}ms`);

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          const elapsed = Date.now() - startTime;
          console.log(`⏰ Request timed out after ${elapsed}ms`);
          reject(new Error('Network request timed out'));
        }, API_CONFIG.TIMEOUT || 30000);
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(url, config),
        timeoutPromise
      ]);

      const elapsed = Date.now() - startTime;
      console.log(`✅ Response received after ${elapsed}ms`);

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

      // Check if we should retry
      const maxRetries = API_CONFIG.RETRY_ATTEMPTS || 3;
      const isNetworkError = error.message === 'Network request timed out' ||
                            error.message.includes('Network request failed') ||
                            error.name === 'TypeError';

      if (isNetworkError && retryCount < maxRetries - 1) {
        console.log(`🔄 Retrying request... (${retryCount + 1}/${maxRetries})`);
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.request(endpoint, options, retryCount + 1);
      }

      // Provide more specific error messages
      if (error.message === 'Network request timed out') {
        throw new Error('Connection timed out. Please check your internet connection and try again.');
      } else if (error.message.includes('Network request failed') || error.name === 'TypeError') {
        throw new Error('Unable to connect to server. Please check your internet connection.');
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
    const queryString = new URLSearchParams(params).toString();
    return await this.request(`/reports?${queryString}`);
  }

  async getNearbyReports(latitude, longitude, radius = 5000) {
    return await this.request(
      `/reports/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
    );
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

  async addComment(reportId, text) {
    return await this.request(`/reports/${reportId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  // User methods
  async getUserProfile() {
    return await this.request('/users/profile');
  }

  async updateProfile(profileData) {
    return await this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
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

  // Notification methods
  async getNotifications() {
    return await this.request('/notifications');
  }

  async markNotificationsRead(notificationIds) {
    return await this.request('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notificationIds }),
    });
  }
}

// Export singleton instance
export default new ApiService();
