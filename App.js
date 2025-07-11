import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import Login from './src/components/Login';
import Dashboard from './src/components/Dashboard';
import Inventory from './src/components/Inventory';
import Customer from './src/components/Customer';
import Profile from './src/components/Profile';
import Sales from './src/components/Sales';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Ignore specific warnings that are known issues
LogBox.ignoreLogs([
  'Unsupported top level event type "topInsetsChange"',
  'Warning: Failed prop type',
]);

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Inventory') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Sales') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
          } else if (route.name === 'Customer') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color || theme.text} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.secondaryText,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Inventory" component={Inventory} />
      <Tab.Screen name="Sales" component={Sales} />
      <Tab.Screen name="Customer" component={Customer} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

function Navigation() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Login" component={Login} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <StatusBar style="auto" />
            <Navigation />
          </AuthProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
