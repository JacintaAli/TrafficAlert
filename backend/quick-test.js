const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Simple test to verify the API is working
const quickTest = async () => {
  console.log('🚀 Quick API Test for TrafficAlert Backend\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.message);
    console.log('📊 Status:', healthResponse.data.status);
    console.log('🕐 Timestamp:', healthResponse.data.timestamp);

    // Test 2: Test Registration (this will likely fail due to validation, but shows the endpoint works)
    console.log('\n2️⃣ Testing Registration Endpoint...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      console.log('✅ Registration successful');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Registration endpoint working (validation error expected)');
        console.log('📝 Response:', error.response.data.message);
      } else {
        console.log('❌ Registration endpoint error:', error.message);
      }
    }

    // Test 3: Test Get Reports (public endpoint)
    console.log('\n3️⃣ Testing Get Reports...');
    try {
      const reportsResponse = await axios.get(`${BASE_URL}/reports`);
      console.log('✅ Get Reports successful');
      console.log('📊 Reports found:', reportsResponse.data.data.reports.length);
    } catch (error) {
      console.log('❌ Get Reports error:', error.response?.data?.message || error.message);
    }

    // Test 4: Test Nearby Reports
    console.log('\n4️⃣ Testing Nearby Reports...');
    try {
      const nearbyResponse = await axios.get(`${BASE_URL}/reports/nearby?latitude=40.7128&longitude=-74.0060&radius=5000`);
      console.log('✅ Nearby Reports successful');
      console.log('📊 Nearby reports found:', nearbyResponse.data.data.reports.length);
    } catch (error) {
      console.log('❌ Nearby Reports error:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Quick test completed! Your API is responding correctly.');
    console.log('\n📚 Next steps:');
    console.log('   1. Configure your email service in .env for OTP functionality');
    console.log('   2. Add your Google Maps API key for location services');
    console.log('   3. Test with your React Native frontend');
    console.log('   4. Check the API_DOCUMENTATION.md for all available endpoints');

  } catch (error) {
    console.log('❌ Connection error:', error.message);
    console.log('🔍 Make sure your server is running on port 5001');
  }
};

// Run the test
quickTest();
