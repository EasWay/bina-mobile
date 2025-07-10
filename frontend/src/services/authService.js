import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(email, password) {
    const response = await api.post('/api/auth/login', { email, password });
    const { access_token } = response.data;
    
    // Get user data with the token
    const userResponse = await api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    return {
      token: access_token,
      user: userResponse.data
    };
  },

  async register(email, password, full_name) {
    const response = await api.post('/api/auth/register', { 
      email, 
      password, 
      full_name 
    });
    const { access_token } = response.data;
    
    // Get user data with the token
    const userResponse = await api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    return {
      token: access_token,
      user: userResponse.data
    };
  },

  async getCurrentUser() {
    const response = await api.get('/api/auth/me');
    return response.data;
  }
};

export const productService = {
  async getProducts() {
    const response = await api.get('/api/products');
    return response.data;
  },

  async createProduct(productData) {
    const response = await api.post('/api/products', productData);
    return response.data;
  },

  async updateProduct(productId, productData) {
    const response = await api.put(`/api/products/${productId}`, productData);
    return response.data;
  },

  async deleteProduct(productId) {
    await api.delete(`/api/products/${productId}`);
  }
};

export const salesService = {
  async getSales() {
    const response = await api.get('/api/sales');
    return response.data;
  },

  async createSale(saleData) {
    const response = await api.post('/api/sales', saleData);
    return response.data;
  },

  async getSalesAnalytics() {
    const response = await api.get('/api/sales/analytics');
    return response.data;
  }
};

export const customerService = {
  async getCustomers() {
    const response = await api.get('/api/customers');
    return response.data;
  },

  async createCustomer(customerData) {
    const response = await api.post('/api/customers', customerData);
    return response.data;
  },

  async deleteCustomer(customerId) {
    await api.delete(`/api/customers/${customerId}`);
  }
};

export default api;