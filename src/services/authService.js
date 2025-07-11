import { supabase } from './supabaseClient';
import * as SecureStore from 'expo-secure-store';

class AuthService {
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Store token securely
        await SecureStore.setItemAsync('token', data.session.access_token);
        
        // Fetch user profile from 'users' table
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (userError) throw userError;
        
        return { token: data.session.access_token, user };
      }

      throw new Error('Login failed');
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  }

  async register(email, password, fullName) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        await SecureStore.setItemAsync('token', data.session.access_token);
        return { token: data.session.access_token, user: data.user };
      }

      throw new Error('Registration failed');
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  async getCurrentUser() {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      console.log('getCurrentUser - Raw auth user:', user);
      console.log('getCurrentUser - user.user_metadata:', user.user_metadata);

      // Get user profile from users table
      let profile = null;
      try {
        const { data: profileData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.log('Error fetching profile from users table:', error);
          // Continue without profile data
        } else {
          profile = profileData;
          console.log('getCurrentUser - Profile from users table:', profile);
        }
      } catch (profileError) {
        console.log('Exception fetching profile:', profileError);
        // Continue without profile data
      }
      
      // Merge auth user metadata with profile data (if available)
      const userWithMetadata = {
        ...(profile || {}),
        user_metadata: user.user_metadata,
        email: user.email,
        id: user.id,
        // Ensure we have the basic user info even if profile fetch fails
        created_at: profile?.created_at || user.created_at,
        full_name: profile?.full_name || user.user_metadata?.full_name || user.email
      };
      
      console.log('getCurrentUser - Final userWithMetadata:', userWithMetadata);
      
      return userWithMetadata;
    } catch (error) {
      console.error('getCurrentUser error:', error);
      await SecureStore.deleteItemAsync('token');
      return null;
    }
  }

  async logout() {
    try {
      await supabase.auth.signOut();
      await SecureStore.deleteItemAsync('token');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Force refresh user data from Supabase auth
  async refreshUserData() {
    try {
      console.log('Refreshing user data from Supabase auth...');
      
      // Get fresh user data from Supabase auth
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting user from auth:', error);
        return null;
      }
      
      if (!user) {
        console.log('No user found in auth');
        return null;
      }
      
      console.log('Fresh auth user data:', user);
      console.log('Fresh user metadata:', user.user_metadata);
      
      return user;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return null;
    }
  }
}

export const authService = new AuthService();

export const productService = {
  async getProducts(userId) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async createProduct(productData) {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateProduct(productId, productData) {
    // Handle both int_id and regular id for backward compatibility
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('int_id', productId) // Try int_id first
      .select()
      .single();
    
    if (error) {
      // If int_id doesn't work, try regular id
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)
        .select()
        .single();
      
      if (fallbackError) throw fallbackError;
      return fallbackData;
    }
    
    return data;
  },

  async deleteProduct(productId) {
    // Try int_id first, then fall back to regular id
    let { error } = await supabase
      .from('products')
      .delete()
      .eq('int_id', productId);
    
    if (error) {
      // If int_id doesn't work, try regular id
      const { error: fallbackError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (fallbackError) throw fallbackError;
    }
  }
};

export const salesService = {
  async getSales(userId) {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async createSale(saleData) {
    const { data, error } = await supabase
      .from('sales')
      .insert([saleData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSale(saleId) {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', saleId);
    if (error) throw error;
  },

  async getSalesAnalytics(userId) {
    // Fetch all sales for the user
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    
    // Aggregate in frontend
    const total_sales = data.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
    
    // Sales by date for chart
    const sales_by_date = {};
    data.forEach(sale => {
      const date = sale.date ? new Date(sale.date).toLocaleDateString() : 'Unknown';
      sales_by_date[date] = (sales_by_date[date] || 0) + Number(sale.total_amount);
    });
    
    // Top products
    const productMap = {};
    data.forEach(sale => {
      if (!productMap[sale.product_name]) {
        productMap[sale.product_name] = { quantity_sold: 0, total_revenue: 0 };
      }
      productMap[sale.product_name].quantity_sold += Number(sale.quantity_sold);
      productMap[sale.product_name].total_revenue += Number(sale.total_amount);
    });
    
    const top_products = Object.entries(productMap)
      .map(([product_name, stats]) => ({ product_name, ...stats }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 5);
    
    return { total_sales, sales_by_date, top_products };
  }
};

export const customerService = {
  async getCustomers(userId) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async createCustomer(customerData) {
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCustomer(customerId, customerData) {
    const { data, error } = await supabase
      .from('customers')
      .update(customerData)
      .eq('id', customerId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCustomer(customerId) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);
    if (error) throw error;
  }
}; 