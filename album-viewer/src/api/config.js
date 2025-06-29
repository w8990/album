// API配置
export const API_BASE_URL = 'http://localhost:3000/api'

// 通用响应处理
export const handleApiResponse = async (response) => {
  const data = await response.json()
  return data
}

// 通用错误处理
export const handleApiError = (error, operation) => {
  console.error(`${operation}失败:`, error)
  return { success: false, message: `网络错误，${operation}失败` }
} 