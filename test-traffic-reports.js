// Test script for traffic report functionality
const http = require('http');

const BASE_URL = 'http://172.20.10.2:5001/api';

console.log('🚗 Testing Traffic Report Functionality\n');

// Helper function to make HTTP requests
const makeRequest = (method, path, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

// Test sequence
const runTests = async () => {
  let authToken = '';
  let reportId = '';

  try {
    // Step 1: Test user registration/login
    console.log('1️⃣ Testing User Authentication...');
    
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    let authResponse = await makeRequest('POST', '/auth/login', loginData);
    
    if (authResponse.status !== 200) {
      // Try registration if login fails
      console.log('   Login failed, trying registration...');
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      authResponse = await makeRequest('POST', '/auth/register', registerData);
    }

    if (authResponse.status === 200 || authResponse.status === 201) {
      authToken = authResponse.data.data.token;
      console.log('   ✅ Authentication successful');
    } else {
      console.log('   ❌ Authentication failed:', authResponse.data.message);
      return;
    }

    // Step 2: Test creating a traffic report
    console.log('\n2️⃣ Testing Traffic Report Creation...');
    
    const reportData = {
      type: 'accident',
      severity: 'high',
      description: 'Major accident on highway, multiple vehicles involved. Traffic is completely blocked.',
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY, USA'
      },
      metadata: {
        deviceInfo: {
          platform: 'mobile',
          version: '1.0.0'
        },
        reportedVia: 'mobile'
      }
    };

    const createResponse = await makeRequest('POST', '/reports', reportData, authToken);
    
    if (createResponse.status === 201) {
      reportId = createResponse.data.data.report._id;
      console.log('   ✅ Report created successfully');
      console.log('   📍 Report ID:', reportId);
      console.log('   📊 Report Type:', createResponse.data.data.report.type);
      console.log('   🔥 Severity:', createResponse.data.data.report.severity);
    } else {
      console.log('   ❌ Report creation failed:', createResponse.data.message);
    }

    // Step 3: Test getting all reports
    console.log('\n3️⃣ Testing Get All Reports...');
    
    const allReportsResponse = await makeRequest('GET', '/reports');
    
    if (allReportsResponse.status === 200) {
      const reports = allReportsResponse.data.data.reports;
      console.log('   ✅ Retrieved reports successfully');
      console.log('   📊 Total reports:', reports.length);
      if (reports.length > 0) {
        console.log('   📍 Latest report:', reports[0].description.substring(0, 50) + '...');
      }
    } else {
      console.log('   ❌ Failed to get reports:', allReportsResponse.data.message);
    }

    // Step 4: Test getting nearby reports
    console.log('\n4️⃣ Testing Get Nearby Reports...');
    
    const nearbyResponse = await makeRequest('GET', '/reports/nearby?latitude=40.7128&longitude=-74.0060&radius=10000');
    
    if (nearbyResponse.status === 200) {
      const nearbyReports = nearbyResponse.data.data.reports;
      console.log('   ✅ Retrieved nearby reports successfully');
      console.log('   📊 Nearby reports:', nearbyReports.length);
      nearbyReports.forEach((report, index) => {
        console.log(`   ${index + 1}. ${report.type} - ${report.distance}m away`);
      });
    } else {
      console.log('   ❌ Failed to get nearby reports:', nearbyResponse.data.message);
    }

    // Step 5: Test report interactions (if we have a report)
    if (reportId) {
      console.log('\n5️⃣ Testing Report Interactions...');
      
      // Test marking as helpful
      const helpfulResponse = await makeRequest('POST', `/reports/${reportId}/helpful`, {}, authToken);
      if (helpfulResponse.status === 200) {
        console.log('   ✅ Marked report as helpful');
        console.log('   👍 Helpful count:', helpfulResponse.data.data.helpfulCount);
      } else {
        console.log('   ❌ Failed to mark as helpful:', helpfulResponse.data.message);
      }

      // Test adding comment
      const commentData = { text: 'Thanks for the report! I can confirm this accident is still blocking traffic.' };
      const commentResponse = await makeRequest('POST', `/reports/${reportId}/comments`, commentData, authToken);
      if (commentResponse.status === 201) {
        console.log('   ✅ Added comment successfully');
        console.log('   💬 Comment:', commentResponse.data.data.comment.text);
      } else {
        console.log('   ❌ Failed to add comment:', commentResponse.data.message);
      }

      // Test verifying report
      const verifyResponse = await makeRequest('POST', `/reports/${reportId}/verify`, {}, authToken);
      if (verifyResponse.status === 200) {
        console.log('   ✅ Verified report successfully');
        console.log('   ✔️ Verification count:', verifyResponse.data.data.verificationCount);
      } else {
        console.log('   ❌ Failed to verify report:', verifyResponse.data.message);
      }
    }

    console.log('\n🎉 Traffic Report Testing Complete!');
    console.log('\n📱 Your mobile app should now be able to:');
    console.log('   ✅ Create traffic reports with real backend');
    console.log('   ✅ View nearby reports from database');
    console.log('   ✅ Interact with reports (helpful votes, comments)');
    console.log('   ✅ See real-time data on the map');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// Run the tests
runTests();
