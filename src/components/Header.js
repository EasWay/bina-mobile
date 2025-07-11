import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const getAvatarUrl = (userData) => {
  if (!userData) return null;
  return userData.user_metadata?.avatar_url || userData.avatar_url || null;
};

const Header = ({ 
  title, 
  subtitle, 
  showBack = false, 
  onBackPress,
  showProfile = true,
  onProfilePress,
  rightIcon,
  onRightPress,
  backgroundColor = '#f8fafc',
  textColor = '#374151'
}) => {
  const { user } = useAuth();

  return (
    <LinearGradient
      colors={['rgba(0, 117, 153, 0.7)', 'rgba(255, 0, 174, 0.9)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#007599" />
      
      <View style={styles.header}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={onBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={32} color="#ffffff" />
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: '#ffffff' }]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: '#ffffff' }]} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {/* Center Section */}
        <View style={styles.centerSection}>
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightIcon && (
            <TouchableOpacity 
              style={styles.rightButton} 
              onPress={onRightPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name={rightIcon} size={32} color="#ffffff" />
            </TouchableOpacity>
          )}
          
          {showProfile && user && (
            <TouchableOpacity 
              style={styles.profileButton} 
              onPress={onProfilePress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.profileAvatar}>
                {getAvatarUrl(user) ? (
                  <Image
                    source={{ uri: getAvatarUrl(user) }}
                    style={{ width: 60, height: 60, borderRadius: 30 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.profileInitial}>
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 50, // Account for status bar
    paddingBottom: 15,
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4.84,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftSection: {
    flex: 2,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backButton: {
    padding: 10,
  },
  titleContainer: {
    marginTop: 5,
  },
  rightButton: {
    padding: 10,
    marginRight: 16,
  },
  profileButton: {
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'left',
    marginTop: 2,
    opacity: 0.7,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileInitial: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Header; 