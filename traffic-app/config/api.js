// API Configuration for TrafficAlert

// IMPORTANT: Update this IP address to match your computer's IP address
// To find your IP address:
// - Windows: Open Command Prompt and run 'ipconfig'
// - Mac/Linux: Open Terminal and run 'ifconfig' or 'ip addr'
// Look for your local network IP (usually starts with 192.168.x.x or 10.x.x.x)

export const API_CONFIG = {
<<<<<<< Updated upstream
  // Your computer's IP address (corrected to working IP)
  BASE_URL: 'http://172.20.10.3:5002/api',

=======
  // Your computer's IP address (updated with current IP)
  BASE_URL: 'http://172.20.10.3:5002/api',
>>>>>>> Stashed changes
  // Alternative configurations for different testing scenarios:
  LOCALHOST: 'http://localhost:5001/api',           // For web testing
  ANDROID_EMULATOR: 'http://10.0.2.2:5001/api',    // For Android emulator
  IOS_SIMULATOR: 'http://localhost:5001/api',       // For iOS simulator

  // Previous IP (in case you need to switch back):
  // BASE_URL: 'http://172.20.10.2:5002/api',

<<<<<<< Updated upstream
  TIMEOUT: 30000, // 30 seconds (increased for mobile network reliability)
=======
  TIMEOUT: 30000, // 30 seconds
>>>>>>> Stashed changes
  RETRY_ATTEMPTS: 3,
}

// Instructions for finding your IP address:
// 1. Make sure your phone and computer are on the same WiFi network
// 2. Find your computer's IP address:
//    - Windows: cmd → ipconfig → look for "IPv4 Address"
//    - Mac: System Preferences → Network → Advanced → TCP/IP
//    - Linux: terminal → ip addr show
// 3. Replace 'YOUR_COMPUTER_IP' above with your actual IP
// 4. Make sure your backend server is running on port 5001
// 5. Test the connection by visiting http://YOUR_IP:5001/api/health in your phone's browser

export default API_CONFIG;
