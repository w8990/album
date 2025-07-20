import { pool } from './connection';
import { TABLE_NAME } from './init';

// 获取文件的社交统计信息
export async function getFileSocialStats(fileId: number) {
  try {
    // 获取点赞数
    const [likesResult] = await pool.query(
      'SELECT COUNT(*) as count FROM likes WHERE file_id = ?',
      [fileId]
    );
    const likes = (likesResult as any[])[0].count;

    // 获取收藏数
    const [favoritesResult] = await pool.query(
      'SELECT COUNT(*) as count FROM favorites WHERE file_id = ?',
      [fileId]
    );
    const favorites = (favoritesResult as any[])[0].count;

    // 获取评论数
    const [commentsResult] = await pool.query(
      'SELECT COUNT(*) as count FROM comments WHERE file_id = ?',
      [fileId]
    );
    const comments = (commentsResult as any[])[0].count;

    return {
      likes,
      favorites,
      comments
    };
  } catch (error) {
    console.error('获取文件社交统计失败:', error);
    throw error;
  }
}

// 检查用户是否点赞了文件
export async function isUserLiked(fileId: number, userId: string | number) {
  try {
    const [result] = await pool.query(
      'SELECT id FROM likes WHERE file_id = ? AND user_id = ?',
      [fileId, userId]
    );
    return (result as any[]).length > 0;
  } catch (error) {
    console.error('检查点赞状态失败:', error);
    throw error;
  }
}

// 检查用户是否收藏了文件
export async function isUserFavorited(fileId: number, userId: string | number) {
  try {
    const [result] = await pool.query(
      'SELECT id FROM favorites WHERE file_id = ? AND user_id = ?',
      [fileId, userId]
    );
    return (result as any[]).length > 0;
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    throw error;
  }
}

// 点赞/取消点赞（兼容字符串用户ID）
export async function toggleLike(fileId: number, userId: string, userName: string) {
  try {
    // 检查是否已点赞
    const isLiked = await isUserLiked(fileId, userId);
    
    if (isLiked) {
      // 取消点赞
      await pool.query(
        'DELETE FROM likes WHERE file_id = ? AND user_id = ?',
        [fileId, userId]
      );
    } else {
      // 添加点赞
      await pool.query(
        'INSERT INTO likes (file_id, user_id) VALUES (?, ?)',
        [fileId, userId]
      );
    }

    // 返回新的统计信息
    const stats = await getFileSocialStats(fileId);
    return {
      isLiked: !isLiked,
      likes: stats.likes
    };
  } catch (error) {
    console.error('切换点赞状态失败:', error);
    throw error;
  }
}

// 点赞/取消点赞（数字用户ID）
export async function toggleLikeWithUserId(fileId: number, userId: number) {
  try {
    // 检查是否已点赞
    const [existing] = await pool.query(
      'SELECT id FROM likes WHERE file_id = ? AND user_id = ?',
      [fileId, userId]
    );
    
    const isLiked = (existing as any[]).length > 0;
    
    if (isLiked) {
      // 取消点赞
      await pool.query(
        'DELETE FROM likes WHERE file_id = ? AND user_id = ?',
        [fileId, userId]
      );
    } else {
      // 添加点赞
      await pool.query(
        'INSERT INTO likes (file_id, user_id) VALUES (?, ?)',
        [fileId, userId]
      );
    }

    // 返回新的统计信息
    const stats = await getFileSocialStats(fileId);
    return {
      isLiked: !isLiked,
      likes: stats.likes
    };
  } catch (error) {
    console.error('切换点赞状态失败:', error);
    throw error;
  }
}

// 收藏/取消收藏（兼容字符串用户ID）
export async function toggleFavorite(fileId: number, userId: string, userName: string) {
  try {
    // 检查是否已收藏
    const isFavorited = await isUserFavorited(fileId, userId);
    
    if (isFavorited) {
      // 取消收藏
      await pool.query(
        'DELETE FROM favorites WHERE file_id = ? AND user_id = ?',
        [fileId, userId]
      );
    } else {
      // 添加收藏
      await pool.query(
        'INSERT INTO favorites (file_id, user_id) VALUES (?, ?)',
        [fileId, userId]
      );
    }

    // 返回新的状态
    return {
      isFavorited: !isFavorited
    };
  } catch (error) {
    console.error('切换收藏状态失败:', error);
    throw error;
  }
}

// 收藏/取消收藏（数字用户ID）
export async function toggleFavoriteWithUserId(fileId: number, userId: number) {
  try {
    // 检查是否已收藏
    const [existing] = await pool.query(
      'SELECT id FROM favorites WHERE file_id = ? AND user_id = ?',
      [fileId, userId]
    );
    
    const isFavorited = (existing as any[]).length > 0;
    
    if (isFavorited) {
      // 取消收藏
      await pool.query(
        'DELETE FROM favorites WHERE file_id = ? AND user_id = ?',
        [fileId, userId]
      );
    } else {
      // 添加收藏
      await pool.query(
        'INSERT INTO favorites (file_id, user_id) VALUES (?, ?)',
        [fileId, userId]
      );
    }

    return {
      isFavorited: !isFavorited
    };
  } catch (error) {
    console.error('切换收藏状态失败:', error);
    throw error;
  }
}

// 获取文件评论列表
export async function getFileComments(fileId: number, options?: {
  page?: number;
  limit?: number;
}) {
  try {
    const { page = 1, limit = 20 } = options || {};
    const offset = (page - 1) * limit;

    // 获取评论列表（按时间倒序）
    const [comments] = await pool.query(`
      SELECT 
        c.id,
        c.file_id,
        c.user_id,
        c.content,
        c.parent_id,
        c.created_at,
        u.username,
        u.display_name,
        u.avatar_url
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.file_id = ? 
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [fileId, limit, offset]);

    // 获取总数
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM comments WHERE file_id = ?',
      [fileId]
    );
    const total = (countResult as any[])[0].total;

    return {
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('获取评论列表失败:', error);
    throw error;
  }
}

// 添加评论（兼容字符串用户ID）
export async function addComment(fileId: number, userId: string, userName: string, content: string, parentId?: number) {
  try {
    const [result] = await pool.query(
      'INSERT INTO comments (file_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
      [fileId, userId, content, parentId || null]
    );

    const commentId = (result as any).insertId;

    // 返回新添加的评论
    const [newComment] = await pool.query(
      'SELECT id, user_id, content, parent_id, created_at FROM comments WHERE id = ?',
      [commentId]
    );

    return (newComment as any[])[0];
  } catch (error) {
    console.error('添加评论失败:', error);
    throw error;
  }
}

// 添加评论（数字用户ID）
export async function addCommentWithUserId(fileId: number, userId: number, content: string, parentId?: number) {
  try {
    const [result] = await pool.query(
      'INSERT INTO comments (file_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
      [fileId, userId, content, parentId || null]
    );

    const commentId = (result as any).insertId;

    // 返回新添加的评论（包含用户信息）
    const [newComment] = await pool.query(`
      SELECT 
        c.id, c.file_id, c.user_id, c.content, c.parent_id, c.created_at,
        u.username, u.display_name, u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [commentId]);

    return (newComment as any[])[0];
  } catch (error) {
    console.error('添加评论失败:', error);
    throw error;
  }
}

// 删除评论（兼容字符串用户ID）
export async function deleteComment(commentId: number, userId: string) {
  try {
    // 检查评论是否属于该用户
    const [comment] = await pool.query(
      'SELECT user_id FROM comments WHERE id = ?',
      [commentId]
    );

    if ((comment as any[]).length === 0) {
      return false; // 评论不存在
    }

    if ((comment as any[])[0].user_id !== userId) {
      throw new Error('无权删除该评论');
    }

    // 删除评论（会级联删除子评论）
    const [result] = await pool.query(
      'DELETE FROM comments WHERE id = ?',
      [commentId]
    );

    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('删除评论失败:', error);
    throw error;
  }
}

// 删除评论（数字用户ID）
export async function deleteCommentWithUserId(commentId: number, userId: number) {
  try {
    // 检查评论是否属于该用户
    const [comment] = await pool.query(
      'SELECT user_id FROM comments WHERE id = ?',
      [commentId]
    );

    if ((comment as any[]).length === 0) {
      return false; // 评论不存在
    }

    if ((comment as any[])[0].user_id !== userId) {
      throw new Error('无权删除该评论');
    }

    // 删除评论（会级联删除子评论）
    const [result] = await pool.query(
      'DELETE FROM comments WHERE id = ?',
      [commentId]
    );

    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('删除评论失败:', error);
    throw error;
  }
}

// 获取文件的扩展信息（包含社交统计）
export async function getFileWithSocialInfo(fileId: number, userId?: string) {
  try {
    // 获取文件基本信息
    const [fileResult] = await pool.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [fileId]
    );
    const fileInfo = (fileResult as any[])[0];
    if (!fileInfo) {
      return null;
    }

    // 获取社交统计
    const stats = await getFileSocialStats(fileId);

    // 检查用户点赞和收藏状态
    let isLiked = false;
    let isFavorited = false;
    
    if (userId) {
      isLiked = await isUserLiked(fileId, userId);
      isFavorited = await isUserFavorited(fileId, userId);
    }

    // 获取最新的2条评论作为预览
    const commentsData = await getFileComments(fileId, { page: 1, limit: 2 });

    return {
      ...fileInfo,
      ...stats,
      isLiked,
      isFavorited,
      latestComments: commentsData.data
    };
  } catch (error) {
    console.error('获取文件扩展信息失败:', error);
    throw error;
  }
}

// 获取带社交统计的文件列表（批量优化版本）
export async function getFileListWithSocial(options?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  albumId?: number | 'default' | null;
  userId?: string;
}) {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      albumId,
      userId
    } = options || {};

    const offset = (page - 1) * limit;
    const validSortBy = ['id', 'originalname', 'size', 'created_at'].includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    let whereClause = '';
    let countQueryParams: any[] = [];
    let mainQueryParams: any[] = [];

    // 处理相册筛选和用户权限
    let conditions = [];
    
    if (albumId === 'default') {
      conditions.push('f.album_id IS NULL');
    } else if (albumId !== undefined && albumId !== null) {
      conditions.push('f.album_id = ?');
      countQueryParams.push(albumId);
      mainQueryParams.push(albumId);
    }
    
    // 添加用户权限过滤：每个用户只能看到自己的文件
    if (userId) {
      conditions.push('f.user_id = ?');
      countQueryParams.push(userId);
      mainQueryParams.push(userId);
    } else {
      // 未登录用户暂时不能看到任何文件（或者可以看到默认用户的文件）
      conditions.push('f.user_id = 1'); // 只显示默认用户的文件
      countQueryParams.push(1);
      mainQueryParams.push(1);
    }
    
    whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // 获取总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM ${TABLE_NAME} f ${whereClause}`,
      countQueryParams
    );
    const total = (countResult as any[])[0].total;

    // 获取文件列表并关联社交统计
    const [rows] = await pool.query(`
      SELECT 
        f.*,
        u.username, u.display_name, u.avatar_url,
        COALESCE(like_stats.like_count, 0) as likes,
        COALESCE(favorite_stats.favorite_count, 0) as favorites,
        COALESCE(comment_stats.comment_count, 0) as comments,
        ${userId ? 'CASE WHEN user_likes.file_id IS NOT NULL THEN 1 ELSE 0 END as isLiked,' : '0 as isLiked,'}
        ${userId ? 'CASE WHEN user_favorites.file_id IS NOT NULL THEN 1 ELSE 0 END as isFavorited' : '0 as isFavorited'}
      FROM ${TABLE_NAME} f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN (
        SELECT file_id, COUNT(*) as like_count 
        FROM likes 
        GROUP BY file_id
      ) like_stats ON f.id = like_stats.file_id
      LEFT JOIN (
        SELECT file_id, COUNT(*) as favorite_count 
        FROM favorites 
        GROUP BY file_id
      ) favorite_stats ON f.id = favorite_stats.file_id
      LEFT JOIN (
        SELECT file_id, COUNT(*) as comment_count 
        FROM comments 
        GROUP BY file_id
      ) comment_stats ON f.id = comment_stats.file_id
      ${userId ? `LEFT JOIN likes user_likes ON f.id = user_likes.file_id AND user_likes.user_id = ?` : ''}
      ${userId ? `LEFT JOIN favorites user_favorites ON f.id = user_favorites.file_id AND user_favorites.user_id = ?` : ''}
      ${whereClause}
      ORDER BY f.${validSortBy} ${validSortOrder}
      LIMIT ? OFFSET ?
    `, [
      ...(userId ? [userId, userId] : []),
      ...mainQueryParams, 
      limit, 
      offset
    ]);

    // 为每个文件获取最新的2条评论
    const filesWithComments = await Promise.all(
      (rows as any[]).map(async (file) => {
        const commentsData = await getFileComments(file.id, { page: 1, limit: 2 });
        return {
          ...file,
          shares: 0, // 分享功能暂时设为0
          latestComments: commentsData.data
        };
      })
    );

    return {
      data: filesWithComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('获取带社交统计的文件列表失败:', error);
    throw error;
  }
} 