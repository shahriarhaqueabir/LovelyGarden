import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.headers['X-Request-Time'] = new Date().toISOString();
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('[API Error]', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
      
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear auth and redirect
          localStorage.removeItem('auth-token');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Access forbidden');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('API request failed');
      }
    } else if (error.request) {
      // Request made but no response
      console.error('[API No Response]', error.request);
    } else {
      // Error in setting up request
      console.error('[API Setup Error]', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper functions for common HTTP methods
export const http = {
  get: <T>(url: string, params?: object) => 
    apiClient.get<T>(url, { params }).then(res => res.data),
    
  post: <T>(url: string, data?: object) => 
    apiClient.post<T>(url, data).then(res => res.data),
    
  put: <T>(url: string, data?: object) => 
    apiClient.put<T>(url, data).then(res => res.data),
    
  patch: <T>(url: string, data?: object) => 
    apiClient.patch<T>(url, data).then(res => res.data),
    
  delete: <T>(url: string) => 
    apiClient.delete<T>(url).then(res => res.data),
};

export default apiClient;
