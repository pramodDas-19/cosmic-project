// Environment configuration for Vercel deployment

interface EnvironmentConfig {
  API_BASE_URL: string;
  SOCKET_URL: string;
  FILE_BASE_URL: string;
  NODE_ENV: string;
}

// Get environment variables with proper fallbacks
const getEnvVar = (key: string, fallback: string): string => {
  // Check if we're in browser environment
  if (typeof window !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || fallback;
  }
  return fallback;
};

// Check if we're in production based on multiple indicators
const isProductionEnv = (): boolean => {
  // Check Vite mode
  if (import.meta.env?.MODE === 'production') return true;
  
  // Check if we're on Vercel (production deployment)
  if (import.meta.env?.VITE_VERCEL_ENV === 'production') return true;
  
  // Check if we're accessing from a production domain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') return true;
  }
  
  // Check NODE_ENV
  if (import.meta.env?.NODE_ENV === 'production') return true;
  
  return false;
};

// Production environment (Vercel + Render)
const productionConfig: EnvironmentConfig = {
  API_BASE_URL: 'https://cosmicproject-backend-1.onrender.com/api',
  SOCKET_URL: 'https://cosmicproject-backend-1.onrender.com',
  FILE_BASE_URL: 'https://cosmicproject-backend-1.onrender.com',
  NODE_ENV: 'production'
};

// Development environment (localhost)
const developmentConfig: EnvironmentConfig = {
  // For local development, use localhost:5000, otherwise use Render URL
  API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 
    typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('192.168.'))
      ? 'http://localhost:5000/api'
      : 'https://cosmicproject-backend-1.onrender.com/api'
  ),
  SOCKET_URL: getEnvVar('VITE_SOCKET_URL', 
    typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('192.168.'))
      ? 'http://localhost:5000'
      : 'https://cosmicproject-backend-1.onrender.com'
  ),
  FILE_BASE_URL: getEnvVar('VITE_FILE_BASE_URL', 
    typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('192.168.'))
      ? 'http://localhost:5000'
      : 'https://cosmicproject-backend-1.onrender.com'
  ),
  NODE_ENV: 'development'
};

// Determine current environment config
const getCurrentEnvironment = (): EnvironmentConfig => {
  // Check if we're accessing from local network (192.168.x.x or localhost)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalNetwork = hostname === 'localhost' || 
                          hostname === '127.0.0.1' || 
                          hostname.startsWith('192.168.') ||
                          hostname.startsWith('10.') ||
                          hostname.startsWith('172.');
    
    // If on local network, use localhost backend (unless explicitly overridden)
    if (isLocalNetwork) {
      const viteApiUrl = getEnvVar('VITE_API_BASE_URL', '');
      // If VITE_API_BASE_URL is set and points to localhost, use it
      // Otherwise, use default localhost config
      if (viteApiUrl && viteApiUrl.includes('localhost')) {
        return {
          API_BASE_URL: viteApiUrl,
          SOCKET_URL: getEnvVar('VITE_SOCKET_URL', 'http://localhost:5000'),
          FILE_BASE_URL: getEnvVar('VITE_FILE_BASE_URL', 'http://localhost:5000'),
          NODE_ENV: 'development'
        };
      } else if (!viteApiUrl) {
        // No env vars set, use localhost defaults
        return developmentConfig;
      }
    }
    
    // Check if we're on Vercel (production deployment)
    if (hostname.includes('vercel.app') || hostname.includes('cosmic-projectfrontend')) {
      return productionConfig;
    }
  }
  
  // Check environment variables
  const viteApiUrl = getEnvVar('VITE_API_BASE_URL', '');
  const viteSocketUrl = getEnvVar('VITE_SOCKET_URL', '');
  const viteFileUrl = getEnvVar('VITE_FILE_BASE_URL', '');
  
  if (viteApiUrl && viteSocketUrl && viteFileUrl) {
    return {
      API_BASE_URL: viteApiUrl,
      SOCKET_URL: viteSocketUrl,
      FILE_BASE_URL: viteFileUrl,
      NODE_ENV: viteApiUrl.includes('localhost') ? 'development' : 'production'
    };
  }
  
  // Otherwise use environment detection
  return isProductionEnv() ? productionConfig : developmentConfig;
};

// Export current environment config
export const env = getCurrentEnvironment();

// Export individual values for convenience
export const API_BASE_URL = env.API_BASE_URL;
export const SOCKET_URL = env.SOCKET_URL;
export const FILE_BASE_URL = env.FILE_BASE_URL;
export const NODE_ENV = env.NODE_ENV;

// Utility functions
export const isDevelopment = () => NODE_ENV === 'development';
export const isProduction = () => NODE_ENV === 'production';

export default env;