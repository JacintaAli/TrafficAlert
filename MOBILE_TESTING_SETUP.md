# 📱 Mobile Testing Setup Guide

## 🎯 Goal
Connect your React Native app to your backend API so you can test login and signup on your mobile phone.

## ✅ Current Status
- ✅ Backend API running on `http://localhost:5001`
- ✅ Login and Signup screens updated to use real backend
- ✅ API service created and configured
- ⚠️ Need to configure IP address for mobile testing

## 🔧 Setup Steps

### Step 1: Find Your Computer's IP Address

**Windows:**
1. Open Command Prompt (cmd)
2. Type `ipconfig` and press Enter
3. Look for "IPv4 Address" under your WiFi adapter
4. It will look like: `192.168.1.100` or `10.0.0.100`

**Mac:**
1. Open System Preferences → Network
2. Select your WiFi connection
3. Click "Advanced" → "TCP/IP"
4. Note the "IPv4 Address"

**Linux:**
1. Open Terminal
2. Type `ip addr show` or `ifconfig`
3. Look for your network interface IP address

### Step 2: Update API Configuration

1. Open `traffic-app/config/api.js`
2. Replace `YOUR_COMPUTER_IP` with your actual IP address:

```javascript
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.100:5001/api', // Replace with YOUR IP
  // ... rest of config
}
```

**Example:**
If your IP is `192.168.1.150`, change it to:
```javascript
BASE_URL: 'http://192.168.1.150:5001/api',
```

### Step 3: Ensure Network Connectivity

1. **Same WiFi Network**: Make sure your phone and computer are on the same WiFi network
2. **Firewall**: Temporarily disable firewall or allow port 5001
3. **Test Connection**: Open your phone's browser and visit `http://YOUR_IP:5001/api/health`
   - You should see: `{"status":"OK","message":"TrafficAlert API is running"...}`

### Step 4: Start Your Servers

1. **Backend Server:**
   ```bash
   cd backend
   node server.js
   ```
   - Should show: "✅ TrafficAlert API Server running on port 5001"

2. **React Native App:**
   ```bash
   cd traffic-app
   npm start
   # or
   npx expo start
   ```

### Step 5: Test on Mobile Device

1. **Scan QR Code**: Use Expo Go app to scan the QR code
2. **Navigate to Login**: Go to Login screen in your app
3. **Test Registration**:
   - Go to Sign Up screen
   - Fill in: Name, Email, Password
   - Tap "Create Account"
   - Should show success message and navigate to main app

4. **Test Login**:
   - Use the same email/password you just registered
   - Tap "Login"
   - Should show success message and navigate to main app

## 🧪 Testing Scenarios

### Test 1: User Registration
```
Name: Test User
Email: test@example.com
Password: password123
```

### Test 2: User Login
```
Email: test@example.com
Password: password123
```

### Test 3: Error Handling
- Try login with wrong password
- Try registration with existing email
- Try with empty fields

## 🚨 Troubleshooting

### "Network Error" or "Connection Failed"
1. **Check IP Address**: Verify you're using the correct IP in `api.js`
2. **Check WiFi**: Ensure phone and computer are on same network
3. **Check Backend**: Verify backend is running on port 5001
4. **Test Browser**: Try `http://YOUR_IP:5001/api/health` in phone browser

### "Server Error" or "500 Error"
1. **Check Backend Logs**: Look at your backend terminal for error messages
2. **Check MongoDB**: Ensure MongoDB Atlas is connected
3. **Check Environment**: Verify `.env` file is configured

### App Crashes or Freezes
1. **Check React Native Logs**: Look at Metro bundler output
2. **Restart App**: Close and reopen the app
3. **Clear Cache**: `npx expo start --clear`

## 📊 Expected Results

### Successful Registration:
- ✅ User account created in MongoDB
- ✅ JWT token received and stored
- ✅ User redirected to main app
- ✅ User profile data available

### Successful Login:
- ✅ Authentication verified
- ✅ JWT token received and stored
- ✅ User redirected to main app
- ✅ User session maintained

## 🔍 Verification

After successful login/signup, you can verify:

1. **Backend Database**: Check MongoDB Atlas for new user record
2. **Backend Logs**: See login/registration logs in terminal
3. **App State**: User should be logged in and see main app
4. **Token Storage**: JWT token stored in AsyncStorage

## 📞 Next Steps

Once login/signup is working:
1. ✅ Test user authentication
2. 🔄 Implement traffic report creation
3. 🔄 Connect map functionality
4. 🔄 Add real-time features
5. 🔄 Implement notifications

## 💡 Tips

- **Keep Backend Running**: Don't close the backend terminal
- **Monitor Logs**: Watch both backend and React Native logs
- **Test Incrementally**: Test one feature at a time
- **Use Real Device**: Physical device testing is more reliable than emulator

Your backend is fully functional and ready for mobile testing! 🚀
