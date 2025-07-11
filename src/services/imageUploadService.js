import { supabase } from './supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { networkUtils } from '../utils/networkUtils';

export const imageUploadService = {
  // Request permissions for camera and photo library
  requestPermissions: async () => {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return {
        camera: cameraStatus === 'granted',
        library: libraryStatus === 'granted'
      };
    } catch (error) {
      return { camera: false, library: false };
    }
  },

  // Pick an image from gallery
  pickImage: async (source = 'library') => {
    try {
      const permissions = await imageUploadService.requestPermissions();
      
      if (source === 'camera' && !permissions.camera) {
        throw new Error('Camera permission not granted');
      }
      
      if (source === 'library' && !permissions.library) {
        throw new Error('Photo library permission not granted');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Revert to MediaTypeOptions for compatibility
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || !result.assets[0]) {
        return null;
      }

      return result.assets[0];
    } catch (error) {
      throw new Error(`Failed to pick image: ${error.message}`);
    }
  },

  // Upload image to Supabase storage
  uploadProfilePicture: async (imageAsset, userId) => {
    try {
      console.log('=== UPLOAD PROFILE PICTURE START ===');
      console.log('Image asset:', imageAsset);
      console.log('User ID:', userId);

      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required. Please login again.');
      }
      console.log('✅ Authentication check passed');

      if (!imageAsset.uri) {
        throw new Error('No image URI available');
      }
      console.log('✅ Image URI available:', imageAsset.uri);

      // Network check (only gate on internetConnected)
      const networkStatus = await networkUtils.getNetworkStatus();
      if (!networkStatus.internetConnected) {
        throw new Error('No internet connection detected. Please check your network and try again.');
      }
      console.log('✅ Internet connectivity check passed');

      // Compress image before upload
      console.log('Compressing image before upload...');
      const manipResult = await ImageManipulator.manipulateAsync(
        imageAsset.uri,
        [{ resize: { width: 256 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      console.log('✅ Image compressed:', manipResult);

      // Prepare file info
      const fileName = imageAsset.fileName || `profile_${Date.now()}.jpg`;
      const fileExt = 'jpg';
      const filePath = `${userId}/${fileName}`;
      const mimeType = 'image/jpeg';
      console.log('File info:', { fileName, fileExt, filePath, mimeType });

      // Prepare file object for upload
      const file = {
        uri: manipResult.uri,
        name: fileName,
        type: mimeType,
      };
      console.log('File object for upload:', file);

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: true,
        });
      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }
      console.log('✅ Upload to Supabase successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image.');
      }
      const imageUrl = urlData.publicUrl;
      console.log('✅ Public URL:', imageUrl);

      // Update user metadata with avatar URL
      console.log('Updating user profile with new avatar URL...');
      await imageUploadService.updateUserProfilePicture(imageUrl);
      console.log('✅ User profile updated with new avatar URL');

      return imageUrl;
    } catch (error) {
      console.error('Upload error details:', error);
      throw error;
    }
  },

  // Update user metadata with profile picture URL
  updateUserProfilePicture: async (imageUrl) => {
    try {
      console.log('Updating user metadata with avatar URL:', imageUrl);
      
      const { data: { user }, error } = await supabase.auth.updateUser({
        data: { avatar_url: imageUrl }
      });

      if (error) {
        console.error('Error updating user metadata:', error);
        throw new Error('Failed to update profile picture');
      }

      console.log('User metadata updated successfully:', user);
      return user;
    } catch (error) {
      console.error('Error in updateUserProfilePicture:', error);
      throw error;
    }
  },

  // Delete old profile picture from storage
  deleteProfilePicture: async (imageUrl) => {
    try {
      if (!imageUrl || !imageUrl.includes('avatars/')) {
        return;
      }

      const urlParts = imageUrl.split('avatars/');
      if (urlParts.length < 2) {
        return;
      }

      const filePath = urlParts[1];
      
      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) {
        // Silently fail - don't throw error for cleanup
        console.log('Failed to delete old profile picture:', error);
      }
    } catch (error) {
      // Silently fail - don't throw error for cleanup
      console.log('Error deleting old profile picture:', error);
    }
  }
}; 