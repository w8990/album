export interface User {
  id: number
  username: string
  email: string
  display_name: string
  avatar_url?: string
  bio?: string
  location?: string
  website?: string
  created_at: string
  last_login_at?: string
}

export interface LoginForm {
  login: string // 用户名或邮箱
  password: string
  remember?: boolean
}

export interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
  display_name: string
  bio?: string
  location?: string
  website?: string
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: User
    token: string
    expires_at: string
  }
  message?: string
  error?: string
  code?: string
}

export interface UserStats {
  albums_count: number
  files_count: number
  followers_count: number
  following_count: number
  likes_count: number
} 