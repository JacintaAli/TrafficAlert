# TrafficAlert - React Native Traffic Reporting App

A crowdsourced traffic reporting mobile application built with React Native and Expo.

## Features

- **Real-time Location Services**: Uses GPS to get current location and show nearby traffic reports
- **Interactive Maps**: Google Maps integration with custom markers for different incident types
- **Report Incidents**: Submit traffic reports with location, type, description, and photos
- **Route Suggestions**: Get route recommendations with real-time traffic information
- **Social Feed**: View and interact with community-submitted traffic reports
- **User Profiles**: Track your submitted reports and app statistics

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Configure Google Maps API:
   - Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the following APIs:
     - Maps SDK for Android
     - Maps SDK for iOS
     - Geocoding API
     - Places API
   - Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` in `app.json` with your actual API key

4. Start the development server:
   \`\`\`bash
   expo start
   \`\`\`

### Location Permissions

The app requires location permissions to function properly:

- **iOS**: Location permission is requested automatically when the app starts
- **Android**: Location permission is requested automatically when the app starts

### Key Components

- **useLocation Hook**: Custom hook for managing location services
- **MapComponent**: Reusable map component with markers and user location
- **HomeScreen**: Main screen with map view and nearby reports
- **ReportIncidentScreen**: Form for submitting new traffic reports
- **RouteSuggestionScreen**: Route planning with real location data

### API Integration

Currently uses dummy data for demonstration. To integrate with a real backend:

1. Replace dummy data in screens with API calls
2. Implement authentication system
3. Add real-time updates using WebSockets or push notifications
4. Integrate with traffic data providers

### Building for Production

\`\`\`bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android
\`\`\`

## License

MIT License
