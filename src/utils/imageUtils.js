// Image utility functions for testing and validation

export const imageUtils = {
  // Test if an image URL is accessible
  testImageAccessibility: async (imageUrl) => {
    try {
      console.log('Testing image accessibility for:', imageUrl);
      
      const response = await fetch(imageUrl, { 
        method: 'HEAD',
        timeout: 10000 
      });
      
      console.log('Image accessibility test result:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        accessible: response.ok
      });
      
      return {
        accessible: response.ok,
        status: response.status,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      };
    } catch (error) {
      console.error('Image accessibility test failed:', error);
      return {
        accessible: false,
        error: error.message
      };
    }
  },

  // Test multiple image URLs
  testMultipleImages: async (imageUrls) => {
    const results = [];
    
    for (const url of imageUrls) {
      const result = await imageUtils.testImageAccessibility(url);
      results.push({ url, ...result });
    }
    
    return results;
  },

  // Validate image URL format
  validateImageUrl: (url) => {
    if (!url) return { valid: false, error: 'URL is empty' };
    
    try {
      const urlObj = new URL(url);
      const validProtocols = ['http:', 'https:'];
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      if (!validProtocols.includes(urlObj.protocol)) {
        return { valid: false, error: 'Invalid protocol' };
      }
      
      const hasValidExtension = validExtensions.some(ext => 
        urlObj.pathname.toLowerCase().includes(ext)
      );
      
      if (!hasValidExtension) {
        return { valid: false, error: 'Invalid image extension' };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' };
    }
  },

  // Get image info from URL
  getImageInfo: async (imageUrl) => {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      
      if (!response.ok) {
        return { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      return {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        lastModified: response.headers.get('last-modified'),
        cacheControl: response.headers.get('cache-control')
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}; 