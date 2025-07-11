// Network utility functions for the mobile app

export const networkUtils = {
  // Check if device has internet connectivity
  checkConnectivity: async () => {
    try {
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      console.log('Network connectivity check failed:', error);
      return false;
    }
  },

  // Check if Supabase is reachable
  checkSupabaseConnectivity: async () => {
    try {
      const response = await fetch('https://qebpnpzoqmyrudxgxckn.supabase.co/rest/v1/', {
        method: 'HEAD',
        timeout: 10000,
      });
      return response.ok;
    } catch (error) {
      console.log('Supabase connectivity check failed:', error);
      return false;
    }
  },

  // Get network status with detailed information
  getNetworkStatus: async () => {
    const internetConnected = await networkUtils.checkConnectivity();
    const supabaseConnected = await networkUtils.checkSupabaseConnectivity();
    
    return {
      internetConnected,
      supabaseConnected,
      fullyConnected: internetConnected && supabaseConnected,
    };
  },

  // Retry function with exponential backoff
  retryWithBackoff: async (fn, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },
}; 