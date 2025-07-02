// API Service for TrafficAlert React Native App
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

// Use the configured base URL
const API_BASE_URL = API_CONFIG.BASE_URL;

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
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

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getToken();

    console.log('API Request:', endpoint);
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
      const response = await fetch(url, config);
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
