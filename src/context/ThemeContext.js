import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

const lightTheme = {
  mode: 'light',
  background: '#fdf2f8',
  card: '#fff',
  text: '#111827',
  secondaryText: '#6b7280',
  accent: '#ec4899',
  border: '#e5e7eb',
  icon: '#8b5cf6',
  danger: '#ef4444',
  white: '#fff',
  primary: '#ec4899',
  inputBackground: '#f9fafb',
  success: '#22c55e',
  successBackground: '#f0fdf4',
  info: '#3b82f6',
  infoBackground: '#eff6ff',
};

const darkTheme = {
  mode: 'dark',
  background: '#18181b',
  card: '#27272a',
  text: '#f3f4f6',
  secondaryText: '#a1a1aa',
  accent: '#ec4899',
  border: '#3f3f46',
  icon: '#a78bfa',
  danger: '#ef4444',
  white: '#18181b',
  primary: '#ec4899',
  inputBackground: '#3f3f46',
  success: '#22c55e',
  successBackground: '#064e3b',
  info: '#3b82f6',
  infoBackground: '#1e3a8a',
};

export const ThemeProvider = ({ children }) => {
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const theme = darkModeEnabled ? darkTheme : lightTheme;

  useEffect(() => {
    (async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('darkModeEnabled');
        if (storedTheme !== null) {
          setDarkModeEnabled(storedTheme === 'true');
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('darkModeEnabled', darkModeEnabled ? 'true' : 'false');
  }, [darkModeEnabled]);

  const toggleTheme = () => setDarkModeEnabled((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ darkModeEnabled, setDarkModeEnabled, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 