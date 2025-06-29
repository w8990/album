// 相册API服务 - 主入口文件
// 整合所有拆分的模块，保持向后兼容
import authService from './authService.js'
import userService from './userService.js'
import socialService from './socialService.js'
import albumManagementService from './albumManagementService.js'

class AlbumService {
  constructor() {
    // 将各个服务模块的实例绑定到当前实例
    this.authService = authService
    this.userService = userService
    this.socialService = socialService
    this.albumManagementService = albumManagementService
  }

  // ===================== 认证相关API - 代理到authService =====================
  
  get token() { return this.authService.token }
  get user() { return this.authService.user }
  
  setToken(token) { return this.authService.setToken(token) }
  getAuthHeaders() { return this.authService.getAuthHeaders() }
  async initUser() { return this.authService.initUser() }
  async register(userData) { return this.authService.register(userData) }
  async login(loginData) { return this.authService.login(loginData) }
  async logout() { return this.authService.logout() }
  async getCurrentUser() { return this.authService.getCurrentUser() }
  async updateProfile(userData) { return this.authService.updateProfile(userData) }
  async uploadAvatar(file) { return this.authService.uploadAvatar(file) }
  isLoggedIn() { return this.authService.isLoggedIn() }
  getUser() { return this.authService.getUser() }
  async getMonthlyStats() { return this.authService.getMonthlyStats() }

  // ===================== 用户相关API - 代理到userService =====================
  
  async getUserProfile(userId) { return this.userService.getUserProfile(userId) }
  async getUserPosts(userId, params = {}) { return this.userService.getUserPosts(userId, params) }
  async getUserFavorites(userId, params = {}) { return this.userService.getUserFavorites(userId, params) }
  async followUser(userId) { return this.userService.followUser(userId) }
  async unfollowUser(userId) { return this.userService.unfollowUser(userId) }
  async getFollowing(userId, params = {}) { return this.userService.getFollowing(userId, params) }
  async getFollowers(userId, params = {}) { return this.userService.getFollowers(userId, params) }
  async getUserStats(userId) { return this.userService.getUserStats(userId) }

  // ===================== 社交动态相关API - 代理到socialService =====================
  
  async getSocialPosts(params = {}) { return this.socialService.getSocialPosts(params) }
  async createPost(postData) { return this.socialService.createPost(postData) }
  async togglePostLike(postId, isLiked) { return this.socialService.togglePostLike(postId, isLiked) }
  async togglePostFavorite(postId, isFavorited) { return this.socialService.togglePostFavorite(postId, isFavorited) }
  async getPostComments(postId) { return this.socialService.getPostComments(postId) }
  async addPostComment(postId, content) { return this.socialService.addPostComment(postId, content) }
  async deletePost(postId) { return this.socialService.deletePost(postId) }
  async incrementViews(fileId) { return this.socialService.incrementViews(fileId) }

  // ===================== 兼容旧接口 =====================
  async toggleLike(albumId, isLiked) { return this.togglePostLike(albumId, isLiked) }
  async toggleFavorite(albumId, isFavorited) { return this.togglePostFavorite(albumId, isFavorited) }
  async getComments(albumId) { return this.getPostComments(albumId) }
  async addComment(albumId, content) { return this.addPostComment(albumId, content) }

  // ===================== 相册管理API - 代理到albumManagementService =====================
  
  async createAlbum(albumData) { return this.albumManagementService.createAlbum(albumData) }
  async getAlbums(params = {}) { return this.albumManagementService.getAlbums(params) }
  async updateAlbum(albumId, albumData) { return this.albumManagementService.updateAlbum(albumId, albumData) }
  async deleteAlbum(albumId) { return this.albumManagementService.deleteAlbum(albumId) }
  async getAlbumById(id) { return this.albumManagementService.getAlbumById(id) }
  async getAlbumFiles(albumId, params = {}) { return this.albumManagementService.getAlbumFiles(albumId, params) }
}

// 导出单例
export default new AlbumService() 