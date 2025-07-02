const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  phone: '+1234567890'
};

const testReport = {
  type: 'accident',
  severity: 'high',
  description: 'Major accident on highway, multiple vehicles involved',
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    address: 'New York, NY, USA'
  }
};

let authToken = '';
let userId = '';
let reportId = '';

// Helper function to make API requests
const apiRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

// Test functions
const testHealthCheck = async () => {
  console.log('\n🔍 Testing Health Check...');
  const result = await apiRequest('GET', '/health');
  
  if (result.success) {
    console.log('✅ Health check passed');
    console.log('📊 Response:', result.data);
  } else {
    console.log('❌ Health check failed');
    console.log('🚨 Error:', result.error);
  }
  
  return result.success;
};

const testUserRegistration = async () => {
  console.log('\n🔍 Testing User Registration...');
  const result = await apiRequest('POST', '/auth/register', testUser);
  
  if (result.success) {
    console.log('✅ User registration passed');
    authToken = result.data.data.token;
    userId = result.data.data.user.id;
    console.log('🔑 Auth token received');
  } else {
    console.log('❌ User registration failed');
    console.log('🚨 Error:', result.error);
  }
  
  return result.success;
};

const testUserLogin = async () => {
  console.log('\n🔍 Testing User Login...');
  const loginData = {
    email: testUser.email,
    password: testUser.password
  };
  
  const result = await apiRequest('POST', '/auth/login', loginData);
  
  if (result.success) {
    console.log('✅ User login passed');
    authToken = result.data.data.token;
    console.log('🔑 New auth token received');
  } else {
    console.log('❌ User login failed');
    console.log('🚨 Error:', result.error);
  }
  
  return result.success;
};

const testGetProfile = async () => {
  console.log('\n🔍 Testing Get Profile...');
  const result = await apiRequest('GET', '/auth/me', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Get profile passed');
    console.log('👤 User profile:', result.data.data.user);
  } else {
    console.log('❌ Get profile failed');
    console.log('🚨 Error:', result.error);
  }
  
  return result.success;
};

const testCreateReport = async () => {
  console.log('\n🔍 Testing Create Report...');
  const result = await apiRequest('POST', '/reports', testReport, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Create report passed');
    reportId = result.data.data.report._id;
    console.log('📍 Report created with ID:', reportId);
  } else {
    console.log('❌ Create report failed');
    console.log('🚨 Error:', result.error);
  }
  
  return result.success;
};

const testGetReports = async () => {
  console.log('\n🔍 Testing Get Reports...');
  const result = await apiRequest('GET', '/reports?page=1&limit=10');
  
  if (result.success) {
    console.log('✅ Get reports passed');
    console.log('📊 Reports count:', result.data.data.reports.length);
    console.log('📄 Pagination:', result.data.data.pagination);
  } else {
    console.log('❌ Get reports failed');
    console.log('🚨 Error:', result.error);
  }
  
  return result.success;
};

const testGetNearbyReports = async () => {
  console.log('\n🔍 Testing Get Nearby Reports...');
  const result = await apiRequest('GET', `/reports/nearby?latitude=${testReport.location.latitude}&longitude=${testReport.location.longitude}&radius=10000`);
  
  if (result.success) {
    console.log('✅ Get nearby reports passed');
    console.log('📊 Nearby reports count:', result.data.data.reports.length);
  } else {
    console.log('❌ Get nearby reports failed');
    console.log('🚨 Error:', result.error);
  }
  
  return result.success;
};

const testGetReportById = async () => {
  if (!reportId) {
    console.log('\n⚠️  Skipping Get Report by ID (no report ID available)');
    return true;
  }
  
  console.log('\n🔍 Testing Get Report by ID...');
  const result = await apiRequest('GET', `/reports/${reportId}`);
  
  if (result.success) {
    console.log('✅ Get report by ID passed');
    console.log('📍 Report details:', result.data.data.report.description);
  } else {
    console.log('❌ Get report by ID failed');
    console.log('🚨 Error:', result.error);
  }
  
  return result.success;
};

const testGetNotifications = async () => {
  console.log('\n🔍 Testing Get Notifications...');
  const result = await apiRequest('GET', '/notifications', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Get notifications passed');
    console.log('🔔 Notifications count:', result.data.data.notifications.length);
  } else {
    console.log('❌ Get notifications failed');
    console.log('🚨 Error:', result.error);
  }
  
  return result.success;
};

const testGetUserStats = async () => {
  console.log('\n🔍 Testing Get User Stats...');
  const result = await apiRequest('GET', '/users/stats', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Get user stats passed');
    console.log('📊 User stats:', result.data.data.stats);
  } else {
    console.log('❌ Get user stats failed');
    console.log('🚨 Error:', result.error);
  }
  
  return result.success;
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting TrafficAlert API Tests...');
  console.log('=' .repeat(50));
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'User Login', fn: testUserLogin },
    { name: 'Get Profile', fn: testGetProfile },
    { name: 'Create Report', fn: testCreateReport },
    { name: 'Get Reports', fn: testGetReports },
    { name: 'Get Nearby Reports', fn: testGetNearbyReports },
    { name: 'Get Report by ID', fn: testGetReportById },
    { name: 'Get Notifications', fn: testGetNotifications },
    { name: 'Get User Stats', fn: testGetUserStats }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} threw an error:`, error.message);
      failed++;
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above for details.');
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
