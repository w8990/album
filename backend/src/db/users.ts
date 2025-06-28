import bcrypt from 'bcryptjs';
import { pool } from './connection';

// 创建用户
export async function createUser(user: {
  username: string;
  email?: string;
  password: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
}) {
  try {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    const [result] = await pool.query(
      `INSERT INTO users (username, email, password_hash, display_name, avatar_url, bio, location, website) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.username,
        user.email || null,
        hashedPassword,
        user.display_name,
        user.avatar_url || null,
        user.bio || null,
        user.location || null,
        user.website || null
      ]
    );
    
    return result;
  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  }
}

// 根据用户名获取用户
export async function getUserByUsername(username: string) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
      [username]
    );
    return (rows as any[])[0];
  } catch (error) {
    console.error('根据用户名获取用户失败:', error);
    throw error;
  }
}

// 根据邮箱获取用户
export async function getUserByEmail(email: string) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );
    return (rows as any[])[0];
  } catch (error) {
    console.error('根据邮箱获取用户失败:', error);
    throw error;
  }
}

// 根据ID获取用户
export async function getUserById(id: number) {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, display_name, avatar_url, bio, location, website, created_at, updated_at, last_login_at FROM users WHERE id = ? AND is_active = TRUE',
      [id]
    );
    return (rows as any[])[0];
  } catch (error) {
    console.error('根据ID获取用户失败:', error);
    throw error;
  }
}

// 更新用户信息
export async function updateUser(id: number, updates: {
  email?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
}) {
  try {
    const updateFields = [];
    const updateValues = [];

    if (updates.email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(updates.email);
    }

    if (updates.display_name !== undefined) {
      updateFields.push('display_name = ?');
      updateValues.push(updates.display_name);
    }

    if (updates.avatar_url !== undefined) {
      updateFields.push('avatar_url = ?');
      updateValues.push(updates.avatar_url);
    }

    if (updates.bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(updates.bio);
    }

    if (updates.location !== undefined) {
      updateFields.push('location = ?');
      updateValues.push(updates.location);
    }

    if (updates.website !== undefined) {
      updateFields.push('website = ?');
      updateValues.push(updates.website);
    }

    if (updateFields.length === 0) {
      return false;
    }

    updateValues.push(id);

    const [result] = await pool.query(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw error;
  }
}

// 更新用户最后登录时间
export async function updateLastLogin(id: number) {
  try {
    const [result] = await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('更新最后登录时间失败:', error);
    throw error;
  }
}

// 关注用户
export async function followUser(followerId: number, followingId: number) {
  try {
    const [result] = await pool.query(
      'INSERT IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)',
      [followerId, followingId]
    );
    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('关注用户失败:', error);
    throw error;
  }
}

// 取消关注用户
export async function unfollowUser(followerId: number, followingId: number) {
  try {
    const [result] = await pool.query(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );
    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('取消关注用户失败:', error);
    throw error;
  }
}

// 检查是否已关注
export async function isFollowing(followerId: number, followingId: number) {
  try {
    const [rows] = await pool.query(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );
    return (rows as any[]).length > 0;
  } catch (error) {
    console.error('检查关注状态失败:', error);
    throw error;
  }
}

// 获取用户关注列表
export async function getUserFollowing(userId: number, options?: {
  page?: number;
  limit?: number;
}) {
  try {
    const { page = 1, limit = 20 } = options || {};
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio, f.created_at as followed_at
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ? AND u.is_active = TRUE
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM follows f JOIN users u ON f.following_id = u.id WHERE f.follower_id = ? AND u.is_active = TRUE',
      [userId]
    );
    const total = (countResult as any[])[0].total;

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('获取关注列表失败:', error);
    throw error;
  }
}

// 获取用户粉丝列表
export async function getUserFollowers(userId: number, options?: {
  page?: number;
  limit?: number;
}) {
  try {
    const { page = 1, limit = 20 } = options || {};
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio, f.created_at as followed_at
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ? AND u.is_active = TRUE
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM follows f JOIN users u ON f.follower_id = u.id WHERE f.following_id = ? AND u.is_active = TRUE',
      [userId]
    );
    const total = (countResult as any[])[0].total;

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('获取粉丝列表失败:', error);
    throw error;
  }
}

// 获取用户统计信息
export async function getUserStats(userId: number) {
  try {
    // 发布的文件数量
    const [postsResult] = await pool.query(
      'SELECT COUNT(*) as count FROM files WHERE user_id = ?',
      [userId]
    );
    const posts = (postsResult as any[])[0].count;

    // 关注数量
    const [followingResult] = await pool.query(
      'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?',
      [userId]
    );
    const following = (followingResult as any[])[0].count;

    // 粉丝数量
    const [followersResult] = await pool.query(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = ?',
      [userId]
    );
    const followers = (followersResult as any[])[0].count;

    // 获得的点赞数
    const [likesResult] = await pool.query(
      'SELECT COUNT(*) as count FROM likes l JOIN files f ON l.file_id = f.id WHERE f.user_id = ?',
      [userId]
    );
    const likes = (likesResult as any[])[0].count;

    // 收藏数量
    const [favoritesResult] = await pool.query(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
      [userId]
    );
    const favorites = (favoritesResult as any[])[0].count;

    return {
      posts,
      following,
      followers,
      likes,
      favorites
    };
  } catch (error) {
    console.error('获取用户统计失败:', error);
    throw error;
  }
}

// 获取用户发布的文件
export async function getUserPosts(userId: number, options?: {
  page?: number;
  limit?: number;
}) {
  try {
    const { page = 1, limit = 20 } = options || {};
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(`
      SELECT f.*, 
        COALESCE(like_stats.like_count, 0) as likes,
        COALESCE(favorite_stats.favorite_count, 0) as favorites,
        COALESCE(comment_stats.comment_count, 0) as comments
      FROM files f
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
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM files WHERE user_id = ?',
      [userId]
    );
    const total = (countResult as any[])[0].total;

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('获取用户发布的文件失败:', error);
    throw error;
  }
}

// 获取用户收藏的文件
export async function getUserFavorites(userId: number, options?: {
  page?: number;
  limit?: number;
}) {
  try {
    const { page = 1, limit = 20 } = options || {};
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(`
      SELECT f.*, u.username, u.display_name, u.avatar_url,
        COALESCE(like_stats.like_count, 0) as likes,
        COALESCE(favorite_stats.favorite_count, 0) as favorites,
        COALESCE(comment_stats.comment_count, 0) as comments,
        fav.created_at as favorited_at
      FROM favorites fav
      JOIN files f ON fav.file_id = f.id
      JOIN users u ON f.user_id = u.id
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
      WHERE fav.user_id = ? AND u.is_active = TRUE
      ORDER BY fav.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM favorites fav JOIN files f ON fav.file_id = f.id JOIN users u ON f.user_id = u.id WHERE fav.user_id = ? AND u.is_active = TRUE',
      [userId]
    );
    const total = (countResult as any[])[0].total;

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('获取用户收藏的文件失败:', error);
    throw error;
  }
} 
 