// API 配置
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  API_PREFIX: '/api',
  TIMEOUT: 10000,
}

export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  
  // 文件相关
  FILES: {
    UPLOAD: '/files/upload',
    LIST: '/files',
    DELETE: '/files',
    DOWNLOAD: '/files/download',
  },
  
  // 相册相关
  ALBUMS: {
    LIST: '/albums',
    CREATE: '/albums',
    UPDATE: '/albums',
    DELETE: '/albums',
  },
}

// 完整的API URL
export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${endpoint}`
}

export default API_CONFIG 