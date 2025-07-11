// User utility functions for debugging and data management

import { supabase } from '../services/supabaseClient';

export const userUtils = {
  // Get current user with detailed logging
  getCurrentUserWithDetails: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return null;
      }

      console.log('Raw user data from Supabase:', user);
      console.log('User metadata:', user.user_metadata);
      console.log('Avatar URL in metadata:', user.user_metadata?.avatar_url);

      // Also get profile from users table
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.log('Error fetching profile:', error);
      } else {
        console.log('Profile data from users table:', profile);
      }

      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Get only the auth user data (without profile merge)
  getAuthUserOnly: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return null;
      }

      console.log('Auth user only:', user);
      console.log('Auth user metadata:', user.user_metadata);
      console.log('Auth user avatar URL:', user.user_metadata?.avatar_url);

      return user;
    } catch (error) {
      console.error('Error getting auth user:', error);
      return null;
    }
  },

  // Update user metadata with avatar URL
  updateAvatarUrl: async (avatarUrl) => {
    try {
      console.log('Updating avatar URL:', avatarUrl);
      
      const { data: { user }, error } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl }
      });

      if (error) {
        console.error('Error updating user metadata:', error);
        throw error;
      }

      console.log('User metadata updated successfully:', user);
      console.log('New avatar URL:', user.user_metadata?.avatar_url);
      
      return user;
    } catch (error) {
      console.error('Error in updateAvatarUrl:', error);
      throw error;
    }
  },

  // Verify avatar URL is properly stored
  verifyAvatarUrl: async () => {
    try {
      const user = await userUtils.getCurrentUserWithDetails();
      if (!user) {
        console.log('No user to verify');
        return false;
      }

      const avatarUrl = user.user_metadata?.avatar_url;
      console.log('Verification - Avatar URL:', avatarUrl);
      
      if (avatarUrl) {
        // Test if the URL is accessible
        try {
          const response = await fetch(avatarUrl, { method: 'HEAD' });
          console.log('Avatar URL accessibility test:', response.ok);
          return response.ok;
        } catch (fetchError) {
          console.log('Avatar URL accessibility test failed:', fetchError);
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error verifying avatar URL:', error);
      return false;
    }
  },

  // Clear avatar URL (for testing)
  clearAvatarUrl: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.updateUser({
        data: { avatar_url: null }
      });

      if (error) {
        console.error('Error clearing avatar URL:', error);
        throw error;
      }

      console.log('Avatar URL cleared successfully');
      return user;
    } catch (error) {
      console.error('Error in clearAvatarUrl:', error);
      throw error;
    }
  }
}; 