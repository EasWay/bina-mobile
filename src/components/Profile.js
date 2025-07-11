import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Header from './Header';
import { imageUploadService } from '../services/imageUploadService';
import { networkUtils } from '../utils/networkUtils';
import { authService } from '../services/authService';
import { userUtils } from '../utils/userUtils';
import { imageUtils } from '../utils/imageUtils';
import { useTheme } from '../context/ThemeContext';

function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const { darkModeEnabled, setDarkModeEnabled, theme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Debug logging
  console.log('Profile component - user:', user);
  console.log('Profile component - user?.user_metadata:', user?.user_metadata);
  console.log('Profile component - user?.user_metadata?.avatar_url:', user?.user_metadata?.avatar_url);
  console.log('Profile component - user?.avatar_url:', user?.avatar_url);
  
  // Helper function to get avatar URL from user data
  const getAvatarUrl = (userData) => {
    if (!userData) return null;
    return userData.user_metadata?.avatar_url || userData.avatar_url || null;
  };
  
  const currentAvatarUrl = getAvatarUrl(user);
  console.log('Profile component - currentAvatarUrl:', currentAvatarUrl);

  // Reset image error when user changes
  React.useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      setImageError(false);
      console.log('Resetting image error state for new avatar URL');
    }
  }, [user?.user_metadata?.avatar_url]);

  // Debug function to check user metadata
  const debugUserMetadata = async () => {
    try {
      console.log('=== DEBUG USER METADATA ===');
      await userUtils.getCurrentUserWithDetails();
      await userUtils.verifyAvatarUrl();
      console.log('=== END DEBUG ===');
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  // Force refresh user data
  const forceRefreshUser = async () => {
    try {
      console.log('=== FORCE REFRESH USER DATA ===');
      const freshUser = await authService.refreshUserData();
      if (freshUser) {
        await refreshUser();
        console.log('User data refreshed successfully');
      } else {
        console.log('Failed to refresh user data');
      }
    } catch (error) {
      console.error('Force refresh error:', error);
    }
  };

  // Test auth user only
  const testAuthUserOnly = async () => {
    try {
      console.log('=== TEST AUTH USER ONLY ===');
      const authUser = await userUtils.getAuthUserOnly();
      if (authUser) {
        console.log('Auth user has metadata:', !!authUser.user_metadata);
        console.log('Auth user avatar URL:', authUser.user_metadata?.avatar_url);
      }
    } catch (error) {
      console.error('Test auth user error:', error);
    }
  };

  // Test image URL accessibility
  const testImageUrl = async () => {
    try {
      console.log('=== TEST IMAGE URL ACCESSIBILITY ===');
      const avatarUrl = getAvatarUrl(user);
      console.log('Testing avatar URL:', avatarUrl);
      
      if (avatarUrl) {
        // Validate URL format first
        const validation = imageUtils.validateImageUrl(avatarUrl);
        console.log('URL validation:', validation);
        
        if (!validation.valid) {
          console.log('❌ Invalid image URL format:', validation.error);
          return;
        }
        
        // Test accessibility
        const accessibility = await imageUtils.testImageAccessibility(avatarUrl);
        console.log('Image accessibility test:', accessibility);
        
        if (accessibility.accessible) {
          console.log('✅ Image URL is accessible');
          
          // Get additional image info
          const imageInfo = await imageUtils.getImageInfo(avatarUrl);
          console.log('Image info:', imageInfo);
          
          // Test if we can actually load the image
          console.log('Testing actual image loading...');
          const imgResponse = await fetch(avatarUrl);
          console.log('Image fetch response:', {
            status: imgResponse.status,
            contentType: imgResponse.headers.get('content-type'),
            contentLength: imgResponse.headers.get('content-length')
          });
        } else {
          console.log('❌ Image URL is not accessible:', accessibility.error || `HTTP ${accessibility.status}`);
        }
      } else {
        console.log('❌ No avatar URL available');
      }
    } catch (error) {
      console.error('❌ Error testing image URL:', error);
    }
  };

  // Reset image error and force reload
  const resetImageError = () => {
    console.log('=== RESETTING IMAGE ERROR ===');
    setImageError(false);
    console.log('Image error state reset to false');
  };

  // Delete current image and try uploading new one
  const deleteAndReupload = async () => {
    try {
      console.log('=== DELETE AND REUPLOAD ===');
      const currentAvatarUrl = getAvatarUrl(user);
      
      if (currentAvatarUrl) {
        console.log('Deleting current image:', currentAvatarUrl);
        await imageUploadService.deleteProfilePicture(currentAvatarUrl);
        console.log('Current image deleted');
      }
      
      // Clear the avatar URL from user metadata
      await userUtils.updateAvatarUrl(null);
      console.log('Avatar URL cleared from metadata');
      
      // Refresh user data
      await refreshUser();
      console.log('User data refreshed');
      
      Alert.alert('Success', 'Current image deleted. You can now upload a new image.');
    } catch (error) {
      console.error('Error deleting image:', error);
      Alert.alert('Error', 'Failed to delete current image');
    }
  };

  const handleProfilePictureUpload = async () => {
    try {
      setUploading(true);
      setImageError(false);
      console.log('=== STARTING UPLOAD PROCESS ===');
      // Pre-check network connectivity
      let networkStatus;
      try {
        networkStatus = await networkUtils.getNetworkStatus();
        console.log('Network status:', networkStatus);
        if (!networkStatus.internetConnected) {
          Alert.alert(
            'Network Error',
            'Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
          return;
        }
        console.log('✅ Internet connectivity check passed');
      } catch (networkError) {
        console.error('Network check error:', networkError);
        Alert.alert(
          'Network Error',
          'Unable to check network connectivity. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Step 1: Pick image from library
      const imageAsset = await imageUploadService.pickImage('library');
      if (!imageAsset) {
        return; // User cancelled
      }
      console.log('Image selected for upload:', imageAsset);

      // Step 2: Upload to Supabase
      let imageUrl;
      try {
        imageUrl = await imageUploadService.uploadProfilePicture(imageAsset, user.id);
        console.log('Upload successful, URL:', imageUrl);
      } catch (uploadError) {
        console.error('Upload failed:', uploadError);
        Alert.alert(
          'Upload Failed',
          uploadError.message || 'Failed to upload profile picture. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Step 3: Refresh user data to show updated profile picture
      try {
        await refreshUser();
        console.log('User data refreshed');
      } catch (refreshError) {
        console.error('Failed to refresh user data:', refreshError);
      }

    } catch (error) {
      console.error('Error in profile picture upload flow:', error);
      Alert.alert(
        'Error',
        error.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 'account',
      title: 'Account Settings',
      icon: 'person',
      color: '#3b82f6',
      onPress: () => Alert.alert('Account Settings', 'Account settings feature coming soon'),
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: 'shield-checkmark',
      color: '#22c55e',
      onPress: () => Alert.alert('Security', 'Security settings feature coming soon'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications',
      color: '#f59e0b',
      onPress: () => Alert.alert('Notifications', 'Notification settings feature coming soon'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle',
      color: '#6b7280',
      onPress: () => Alert.alert('Help', 'Help and support feature coming soon'),
    },
    {
      id: 'about',
      title: 'About',
      icon: 'information-circle',
      color: '#8b5cf6',
      onPress: () => Alert.alert('About', 'Bina Business App v1.0.0\n\nA comprehensive business management solution for small businesses in Ghana.'),
    },
  ];

  // Handle image loading errors
  const handleImageError = (error) => {
    console.log('Image loading error:', error);
    console.log('Failed to load image from URL:', getAvatarUrl(user));
    setImageError(true);
  };

  // Handle successful image load
  const handleImageLoad = () => {
    console.log('Image loaded successfully from URL:', getAvatarUrl(user));
    setImageError(false);
  };

  // Render profile image with fallback
  const renderProfileImage = () => {
    if (uploading) {
      return (
        <View style={{ backgroundColor: theme.background, padding: 10 }}>
          <ActivityIndicator size="large" color={theme.primary} />
          {uploading && (
            <Text style={{ color: theme.text, textAlign: 'center', marginTop: 10 }}>Uploading...</Text>
          )}
        </View>
      );
    }

    // Use the helper function to get avatar URL
    const avatarUrl = getAvatarUrl(user);
    
    console.log('Rendering profile image with URL:', avatarUrl);
    console.log('Image error state:', imageError);
    
    if (avatarUrl && !imageError) {
      return (
        <Image 
          source={{ 
            uri: avatarUrl,
            headers: {
              'Cache-Control': 'no-cache'
            }
          }} 
          style={styles.avatarImage}
          onError={handleImageError}
          onLoad={handleImageLoad}
          resizeMode="cover"
          // Add timeout for image loading
          timeout={10000}
        />
      );
    }

    // Fallback: Default icon
    console.log('Using fallback icon - no avatar URL or image error');
    return <Ionicons name="person" size={40} color="#ec4899" />;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header 
        title="Profile"
        subtitle="Manage your account"
        showProfile={false}
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >

        {/* User Info Card */}
        <View style={[styles.userCard, { backgroundColor: theme.card }]}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={handleProfilePictureUpload}
            disabled={uploading}
          >
            <View style={[styles.avatar, { backgroundColor: theme.avatarBackground }]}>
              {renderProfileImage()}
            </View>
            <View style={styles.uploadOverlay}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.user_metadata?.full_name || user?.full_name || 'User'}
            </Text>
            <Text style={[styles.userRole, { color: theme.secondaryText }]}>Business Owner</Text>
            {uploading && (
              <Text style={[styles.uploadingText, { color: theme.primary }]}>Uploading...</Text>
            )}
          </View>
        </View>

        {/* Quick Settings */}
        <View style={[styles.section]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Settings</Text>
          
          <View style={[styles.settingItem, { backgroundColor: theme.card }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={24} color="#f59e0b" />
              <Text style={[styles.settingTitle, { color: theme.text }]}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#d1d5db', true: '#ec4899' }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#ffffff'}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: theme.card }]}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon" size={24} color="#8b5cf6" />
              <Text style={[styles.settingTitle, { color: theme.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#d1d5db', true: '#ec4899' }}
              thumbColor={darkModeEnabled ? '#ffffff' : '#ffffff'}
            />
          </View>
        </View>

        {/* Menu Items */}
        <View style={[styles.section]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>
          
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { backgroundColor: theme.card }]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemContent}>
                <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={[styles.menuTitle, { color: theme.text }]}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Debug Buttons (temporary) */}
        {/* (Remove all debug/test buttons) */}
        {/* Logout Button */}
        <View style={[styles.logoutSection, { backgroundColor: theme.card }]}>
          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.primary }]} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="white" />
            <Text style={[styles.logoutText, { color: 'white' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fdf2f8', // This line is removed as per edit hint
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    // color: '#111827', // This line is removed as per edit hint
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    // color: '#6b7280', // This line is removed as per edit hint
  },
  userCard: {
    // backgroundColor: 'white', // This line is removed as per edit hint
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    // backgroundColor: '#fdf2f8', // This line is removed as per edit hint
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  uploadOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#ec4899',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    // color: '#111827', // This line is removed as per edit hint
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    // color: '#6b7280', // This line is removed as per edit hint
    marginBottom: 4,
  },
  uploadingText: {
    fontSize: 12,
    // color: '#ec4899', // This line is removed as per edit hint
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    // color: '#111827', // This line is removed as per edit hint
    marginBottom: 12,
    marginHorizontal: 20,
  },
  settingItem: {
    // backgroundColor: 'white', // This line is removed as per edit hint
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    // color: '#111827', // This line is removed as per edit hint
    marginLeft: 12,
  },
  menuItem: {
    // backgroundColor: 'white', // This line is removed as per edit hint
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 16,
    // color: '#111827', // This line is removed as per edit hint
    marginLeft: 12,
  },
  logoutSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButton: {
    // backgroundColor: '#ef4444', // This line is removed as per edit hint
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    // color: 'white', // This line is removed as per edit hint
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginHorizontal: 20,
  },
  debugText: {
    // color: '#6b7280', // This line is removed as per edit hint
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default Profile; 