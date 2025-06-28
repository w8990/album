// 扩展Express Request类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        display_name: string;
        avatar_url?: string;
      };
    }
  }
}

export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface File {
  id: number;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
  album_id?: number;
  user_id: number;
  caption?: string;
  tags?: string[];
  location?: string;
  privacy_level: 'public' | 'private' | 'friends';
  created_at: string;
}

export interface Album {
  id: number;
  name: string;
  description?: string;
  cover_image_id?: number;
  user_id: number;
  privacy_level: 'public' | 'private' | 'friends';
  created_at: string;
  updated_at: string;
  file_count?: number;
  total_size?: number;
  cover_url?: string;
}

export interface Comment {
  id: number;
  file_id: number;
  user_id: number;
  content: string;
  parent_id?: number;
  created_at: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export {}; // 确保这是一个模块 