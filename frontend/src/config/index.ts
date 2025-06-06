// API基础URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// API端点
export const API_ENDPOINTS = {
  UPLOAD: `${API_BASE_URL}/api/upload`,
  FILES: `${API_BASE_URL}/api/files`,
  FILE: (id: number) => `${API_BASE_URL}/api/files/${id}`,
  // 注意：uploads端点不需要在这里定义，因为我们直接使用后端返回的url
}; 