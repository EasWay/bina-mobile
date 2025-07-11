# Bina Mobile App

A React Native mobile application for business management, built with Expo.

## Features

- **Authentication**: Secure login with Supabase
- **Dashboard**: Business overview with charts and analytics
- **Inventory Management**: Track products and stock levels
- **Sales Tracking**: Record and monitor sales transactions
- **KYC Management**: Customer verification and records
- **Profile Management**: User settings and app statistics

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device (for testing)

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend/mobile
npm install
```

### 2. Configure Supabase

Update the Supabase configuration in `src/services/supabaseClient.js`:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

### 3. Start the Development Server

```bash
npm start
```

This will open the Expo development server. You can:
- Scan the QR code with Expo Go app on your phone
- Press 'a' to open on Android emulator
- Press 'i' to open on iOS simulator

## Project Structure

```
mobile/
├── src/
│   ├── components/          # React Native components
│   │   ├── Dashboard.js
│   │   ├── Inventory.js
│   │   ├── KYC.js
│   │   ├── Login.js
│   │   ├── Profile.js
│   │   └── Sales.js
│   ├── context/            # React Context for state management
│   │   └── AuthContext.js
│   └── services/           # API services
│       ├── authService.js
│       └── supabaseClient.js
├── App.js                  # Main app component
└── package.json           # Dependencies
```

## Key Dependencies

- **@react-navigation/native**: Navigation framework
- **@react-navigation/bottom-tabs**: Bottom tab navigation
- **@react-navigation/stack**: Stack navigation
- **@supabase/supabase-js**: Supabase client
- **expo-secure-store**: Secure storage for tokens
- **react-native-chart-kit**: Charts and graphs
- **@expo/vector-icons**: Icon library

## Development Notes

### Authentication
- Uses Supabase for authentication
- Tokens stored securely using `expo-secure-store`
- Automatic session management

### Navigation
- Bottom tab navigation for main screens
- Stack navigation for authentication flow
- Protected routes based on authentication state

### Styling
- Custom StyleSheet components
- Consistent color scheme with web version
- Responsive design for different screen sizes

### Data Management
- Mock data currently used for development
- Ready for API integration
- State management with React Context

## Building for Production

### Android
```bash
expo build:android
```

### iOS
```bash
expo build:ios
```

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `expo start -c`
2. **Dependencies issues**: Delete `node_modules` and run `npm install`
3. **Expo Go connection**: Ensure phone and computer are on same network

### Development Tips

- Use Expo Go for rapid development and testing
- Enable hot reloading for faster development
- Use React Native Debugger for debugging
- Test on both iOS and Android devices

## Next Steps

1. **API Integration**: Replace mock data with real API calls
2. **Push Notifications**: Implement push notifications
3. **Offline Support**: Add offline functionality
4. **Performance**: Optimize for better performance
5. **Testing**: Add unit and integration tests

## Contributing

1. Follow the existing code style
2. Test on both iOS and Android
3. Update documentation for new features
4. Ensure all features work offline when possible 
