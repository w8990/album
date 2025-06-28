import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import albumService from '../api/albumService.js'

export const useFavoritesStore = defineStore('favorites', () => {
  // 状态
  const favoritePhotos = ref([])
  const favoriteAlbums = ref([])
  const followingUsers = ref([])
  const isLoading = ref(false)

  // 计算属性
  const favoritesCount = computed(() => ({
    photos: favoritePhotos.value.length,
    albums: favoriteAlbums.value.length,
    users: followingUsers.value.length
  }))

  // 检查是否收藏了某张照片
  const isPhotoFavorited = computed(() => (photoId) => {
    return favoritePhotos.value.some(photo => photo.id === photoId)
  })

  // 检查是否收藏了某个相册
  const isAlbumFavorited = computed(() => (albumId) => {
    return favoriteAlbums.value.some(album => album.id === albumId)
  })

  // 检查是否关注了某个用户
  const isUserFollowed = computed(() => (userId) => {
    return followingUsers.value.some(user => user.id === userId)
  })

  // 收藏照片
  const favoritePhoto = async (photo) => {
    try {
      isLoading.value = true
      
      const result = await albumService.togglePostFavorite(photo.id, true)
      
      if (result.success) {
        const favoriteData = {
          ...photo,
          favoriteAt: new Date().toISOString()
        }
        
        favoritePhotos.value.unshift(favoriteData)
        return { success: true, message: '收藏成功' }
      } else {
        return { success: false, message: result.message || '收藏失败' }
      }
    } catch (error) {
      console.error('收藏照片失败:', error)
      return { success: false, message: '网络错误，收藏失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 取消收藏照片
  const unfavoritePhoto = async (photoId) => {
    try {
      isLoading.value = true
      
      const result = await albumService.togglePostFavorite(photoId, false)
      
      if (result.success) {
        const index = favoritePhotos.value.findIndex(photo => photo.id === photoId)
        if (index > -1) {
          favoritePhotos.value.splice(index, 1)
        }
        return { success: true, message: '已取消收藏' }
      } else {
        return { success: false, message: result.message || '操作失败' }
      }
    } catch (error) {
      console.error('取消收藏失败:', error)
      return { success: false, message: '网络错误，操作失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 收藏相册
  const favoriteAlbum = async (album) => {
    try {
      isLoading.value = true
      
      const result = await albumService.togglePostFavorite(album.id, true)
      
      if (result.success) {
        const favoriteData = {
          ...album,
          favoriteAt: new Date().toISOString().split('T')[0]
        }
        
        favoriteAlbums.value.unshift(favoriteData)
        return { success: true, message: '收藏成功' }
      } else {
        return { success: false, message: result.message || '收藏失败' }
      }
    } catch (error) {
      console.error('收藏相册失败:', error)
      return { success: false, message: '网络错误，收藏失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 取消收藏相册
  const unfavoriteAlbum = async (albumId) => {
    try {
      isLoading.value = true
      
      const result = await albumService.togglePostFavorite(albumId, false)
      
      if (result.success) {
        const index = favoriteAlbums.value.findIndex(album => album.id === albumId)
        if (index > -1) {
          favoriteAlbums.value.splice(index, 1)
        }
        return { success: true, message: '已取消收藏' }
      } else {
        return { success: false, message: result.message || '操作失败' }
      }
    } catch (error) {
      console.error('取消收藏失败:', error)
      return { success: false, message: '网络错误，操作失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 关注用户
  const followUser = async (user) => {
    try {
      isLoading.value = true
      
      const result = await albumService.followUser(user.id)
      
      if (result.success) {
        const followData = {
          ...user,
          followAt: new Date().toISOString().split('T')[0]
        }
        
        followingUsers.value.unshift(followData)
        return { success: true, message: '关注成功' }
      } else {
        return { success: false, message: result.message || '关注失败' }
      }
    } catch (error) {
      console.error('关注用户失败:', error)
      return { success: false, message: '网络错误，关注失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 取消关注用户
  const unfollowUser = async (userId) => {
    try {
      isLoading.value = true
      
      const result = await albumService.unfollowUser(userId)
      
      if (result.success) {
        const index = followingUsers.value.findIndex(user => user.id === userId)
        if (index > -1) {
          followingUsers.value.splice(index, 1)
        }
        return { success: true, message: '已取消关注' }
      } else {
        return { success: false, message: result.message || '操作失败' }
      }
    } catch (error) {
      console.error('取消关注失败:', error)
      return { success: false, message: '网络错误，操作失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 切换照片收藏状态
  const togglePhotoFavorite = async (photo) => {
    if (isPhotoFavorited.value(photo.id)) {
      return await unfavoritePhoto(photo.id)
    } else {
      return await favoritePhoto(photo)
    }
  }

  // 切换相册收藏状态
  const toggleAlbumFavorite = async (album) => {
    if (isAlbumFavorited.value(album.id)) {
      return await unfavoriteAlbum(album.id)
    } else {
      return await favoriteAlbum(album)
    }
  }

  // 切换用户关注状态
  const toggleUserFollow = async (user) => {
    if (isUserFollowed.value(user.id)) {
      return await unfollowUser(user.id)
    } else {
      return await followUser(user)
    }
  }

  // 初始化收藏数据
  const initializeFavorites = async (userId) => {
    try {
      isLoading.value = true
      
      // 并行获取收藏数据
      const [photosResult, albumsResult, usersResult] = await Promise.allSettled([
        albumService.getUserFavorites(userId, { type: 'photos' }),
        albumService.getUserFavorites(userId, { type: 'albums' }),
        albumService.getFollowing(userId)
      ])

      // 处理收藏照片
      if (photosResult.status === 'fulfilled' && photosResult.value.success) {
        favoritePhotos.value = photosResult.value.data.favorites.map(fav => ({
          id: fav.post.id,
          title: fav.post.title || fav.post.content,
          thumbnail: fav.post.images?.[0],
          author: fav.post.author?.nickname || fav.post.author?.username,
          views: fav.post.views || 0,
          likes: fav.post.likes || 0,
          favoriteAt: fav.createdAt
        }))
      }

      // 处理收藏相册
      if (albumsResult.status === 'fulfilled' && albumsResult.value.success) {
        favoriteAlbums.value = albumsResult.value.data.favorites.map(fav => ({
          id: fav.post.id,
          title: fav.post.title || fav.post.content,
          cover: fav.post.images?.[0],
          author: fav.post.author?.nickname || fav.post.author?.username,
          photoCount: fav.post.images?.length || 0,
          views: fav.post.views || 0,
          likes: fav.post.likes || 0,
          favoriteAt: fav.createdAt?.split('T')[0]
        }))
      }

      // 处理关注用户
      if (usersResult.status === 'fulfilled' && usersResult.value.success) {
        followingUsers.value = usersResult.value.data.following.map(follow => ({
          id: follow.following.id,
          username: follow.following.username,
          nickname: follow.following.nickname,
          avatar: follow.following.avatar,
          bio: follow.following.bio,
          albumCount: follow.following.albumCount || 0,
          followersCount: follow.following.followersCount || 0,
          followAt: follow.createdAt?.split('T')[0]
        }))
      }
      
    } catch (error) {
      console.error('初始化收藏数据失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  // 清空所有收藏数据
  const clearAllFavorites = () => {
    favoritePhotos.value = []
    favoriteAlbums.value = []
    followingUsers.value = []
  }

  return {
    // 状态
    favoritePhotos,
    favoriteAlbums,
    followingUsers,
    isLoading,
    
    // 计算属性
    favoritesCount,
    isPhotoFavorited,
    isAlbumFavorited,
    isUserFollowed,
    
    // 方法
    favoritePhoto,
    unfavoritePhoto,
    favoriteAlbum,
    unfavoriteAlbum,
    followUser,
    unfollowUser,
    togglePhotoFavorite,
    toggleAlbumFavorite,
    toggleUserFollow,
    initializeFavorites,
    clearAllFavorites
  }
}) 