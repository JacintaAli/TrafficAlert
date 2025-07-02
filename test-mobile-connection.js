// Test script to help configure mobile device connection
const os = require('os');
const http = require('http');

console.log('🔍 TrafficAlert Mobile Connection Test\n');

// Get all network interfaces
const interfaces = os.networkInterfaces();
const possibleIPs = [];

// Find potential IP addresses
Object.keys(interfaces).forEach(interfaceName => {
  interfaces[interfaceName].forEach(interface => {
    if (interface.family === 'IPv4' && !interface.internal) {
      possibleIPs.push({
        interface: interfaceName,
        ip: interface.address
      });
    }
  });
});

console.log('📡 Found these network interfaces:');
possibleIPs.forEach((item, index) => {
  console.log(`   ${index + 1}. ${item.interface}: ${item.ip}`);
});

if (possibleIPs.length === 0) {
  console.log('❌ No external network interfaces found');
  console.log('   Make sure you\'re connected to WiFi');
  process.exit(1);
}

console.log('\n🎯 Recommended IP for mobile testing:');
const recommendedIP = possibleIPs[0].ip;
console.log(`   ${recommendedIP}`);

console.log('\n📝 Update your config file:');
console.log(`   File: traffic-app/config/api.js`);
console.log(`   Change: BASE_URL: 'http://${recommendedIP}:5001/api'`);

// Test if backend is running
console.log('\n🧪 Testing backend connection...');

const testConnection = (host, port, callback) => {
  const req = http.get(`http://${host}:${port}/api/health`, { timeout: 5000 }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        callback(null, response);
      } catch (e) {
        callback(null, { status: 'OK' });
      }
    });
  });

  req.on('error', (error) => {
    callback(error);
  });

  req.on('timeout', () => {
    req.destroy();
    callback(new Error('Timeout'));
  });
};

// Test localhost first
testConnection('localhost', 5001, (error, response) => {
  if (error) {
    console.log('❌ Backend is not running on localhost:5001');
    console.log('🚀 Start your backend first:');
    console.log('   cd backend');
    console.log('   node server.js');
    return;
  }

  console.log('✅ Backend is running on localhost:5001');
  console.log(`📊 Status: ${response.status}`);

  // Test with the recommended IP
  console.log(`\n🔗 Testing with recommended IP: ${recommendedIP}:5001`);
  testConnection(recommendedIP, 5001, (ipError, ipResponse) => {
    if (ipError) {
      console.log(`❌ Cannot access backend via IP: ${recommendedIP}:5001`);
      console.log('🔧 Possible solutions:');
      console.log('   - Check Windows Firewall settings');
      console.log('   - Try a different IP from the list above');
      console.log('   - Make sure port 5001 is not blocked');
    } else {
      console.log(`✅ Backend accessible via IP: ${recommendedIP}:5001`);
      console.log('🎉 Your mobile device should be able to connect!');

      console.log('\n📱 Mobile Testing Instructions:');
      console.log('1. Update traffic-app/config/api.js with the IP above');
      console.log('2. Make sure your phone is on the same WiFi network');
      console.log(`3. Test in phone browser: http://${recommendedIP}:5001/api/health`);
      console.log('4. Run your React Native app and test login/signup');
    }
  });
});
