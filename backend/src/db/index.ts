// 导出数据库连接
export { pool, DB_NAME } from './connection';

// 导出数据库初始化
export { initDB, TABLE_NAME, ALBUMS_TABLE } from './init';

// 导出文件相关操作
export {
  insertFileInfo,
  insertFileInfoWithUser,
  getFileList,
  searchFiles,
  getFileStats,
  getFileInfo,
  deleteFile,
  moveFileToAlbum,
  moveFilesToAlbum,
  incrementFileViews,
  getUserTotalViews
} from './files';

// 导出相册相关操作
export {
  createAlbum,
  getAlbums,
  getAlbumInfo,
  getAlbumFiles,
  updateAlbum,
  deleteAlbum
} from './albums';

// 导出用户相关操作
export {
  createUser,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  updateUser,
  updateLastLogin,
  followUser,
  unfollowUser,
  isFollowing,
  getUserFollowing,
  getUserFollowers,
  getUserStats,
  getUserPosts,
  getUserFavorites
} from './users';

// 导出社交功能
export {
  getFileSocialStats,
  isUserLiked,
  isUserFavorited,
  toggleLike,
  toggleLikeWithUserId,
  toggleFavorite,
  toggleFavoriteWithUserId,
  getFileComments,
  addComment,
  addCommentWithUserId,
  deleteComment,
  deleteCommentWithUserId,
  getFileWithSocialInfo,
  getFileListWithSocial
} from './social';

// 导出会话管理
export {
  createUserSession,
  validateUserSession,
  deleteUserSession,
  cleanExpiredSessions
} from './sessions'; 