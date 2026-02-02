// src/config/environment.ts
// Environment configuration (Vite + React)

interface EnvironmentConfig {
  API_BASE_URL: string;
  SOCKET_URL: string;
  FILE_BASE_URL: string;
  NODE_ENV: "development" | "production";
}

/**
 * Detect if we are running locally
 */
const isLocalhost = (): boolean => {
  if (typeof window === "undefined") return false;

  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.startsWith("172.")
  );
};

/**
 * Production config (Render backend)
 */
const productionConfig: EnvironmentConfig = {
  API_BASE_URL: "https://cosmic-project-1.onrender.com/api",
  SOCKET_URL: "https://cosmic-project-1.onrender.com",
  FILE_BASE_URL: "https://cosmic-project-1.onrender.com",
  NODE_ENV: "production",
};

/**
 * Development config (Local backend)
 */
const developmentConfig: EnvironmentConfig = {
  API_BASE_URL: "http://localhost:5000/api",
  SOCKET_URL: "http://localhost:5000",
  FILE_BASE_URL: "http://localhost:5000",
  NODE_ENV: "development",
};

/**
 * Pick correct environment
 */
const getEnvironment = (): EnvironmentConfig => {
  // Explicit Vite env override (if set)
  if (import.meta.env.VITE_API_BASE_URL) {
    return {
      API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      SOCKET_URL:
        import.meta.env.VITE_SOCKET_URL ||
        import.meta.env.VITE_API_BASE_URL,
      FILE_BASE_URL:
        import.meta.env.VITE_FILE_BASE_URL ||
        import.meta.env.VITE_API_BASE_URL,
      NODE_ENV:
        import.meta.env.MODE === "production"
          ? "production"
          : "development",
    };
  }

  // Auto detect
  if (isLocalhost()) {
    return developmentConfig;
  }

  return productionConfig;
};

// Final environment
export const env = getEnvironment();

// Named exports
export const API_BASE_URL = env.API_BASE_URL;
export const SOCKET_URL = env.SOCKET_URL;
export const FILE_BASE_URL = env.FILE_BASE_URL;
export const NODE_ENV = env.NODE_ENV;

// Helpers
export const isDevelopment = NODE_ENV === "development";
export const isProduction = NODE_ENV === "production";

export default env;
