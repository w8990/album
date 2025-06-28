import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const DB_NAME = 'album';
const TABLE_NAME = 'files';
const ALBUMS_TABLE = 'albums';

// 数据库连接配置
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '899022', // 请修改为您的数据库密码
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 初始化数据库和表
export async function initDB() {
  try {
    // 创建数据库
    await pool.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
    
    // 使用数据库
    await pool.query(`USE ${DB_NAME}`);
    
    // 创建用户表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        avatar_url VARCHAR(255),
        bio TEXT,
        location VARCHAR(100),
        website VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP NULL,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_created_at (created_at),
        INDEX idx_active (is_active)
      )
    `);
    
    // 创建相册表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${ALBUMS_TABLE} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cover_image_id INT,
        user_id INT NOT NULL,
        privacy_level ENUM('public', 'private', 'friends') DEFAULT 'public',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_user_id (user_id),
        INDEX idx_privacy (privacy_level),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // 创建文件表（增加用户ID字段）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        originalname VARCHAR(255) NOT NULL,
        mimetype VARCHAR(100) NOT NULL,
        size INT NOT NULL,
        url VARCHAR(255) NOT NULL,
        album_id INT DEFAULT NULL,
        user_id INT NOT NULL,
        caption TEXT,
        tags JSON,
        location VARCHAR(255),
        privacy_level ENUM('public', 'private', 'friends') DEFAULT 'public',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_mimetype (mimetype),
        INDEX idx_created_at (created_at),
        INDEX idx_originalname (originalname),
        INDEX idx_album_id (album_id),
        INDEX idx_user_id (user_id),
        INDEX idx_privacy (privacy_level),
        FOREIGN KEY (album_id) REFERENCES ${ALBUMS_TABLE}(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // 创建点赞表（修改为关联用户表）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_like (file_id, user_id),
        INDEX idx_file_id (file_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (file_id) REFERENCES ${TABLE_NAME}(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 创建收藏表（修改为关联用户表）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_favorite (file_id, user_id),
        INDEX idx_file_id (file_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (file_id) REFERENCES ${TABLE_NAME}(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 创建评论表（修改为关联用户表）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        parent_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_file_id (file_id),
        INDEX idx_user_id (user_id),
        INDEX idx_parent_id (parent_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (file_id) REFERENCES ${TABLE_NAME}(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
      )
    `);

    // 创建关注表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS follows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        follower_id INT NOT NULL,
        following_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_follow (follower_id, following_id),
        INDEX idx_follower (follower_id),
        INDEX idx_following (following_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
        CHECK (follower_id != following_id)
      )
    `);

    // 创建用户会话表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_token (session_token),
        INDEX idx_expires (expires_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // 检查并添加新字段（为了兼容现有数据）
    const checkAndAddColumns = async () => {
      // 检查files表是否需要添加user_id字段
      const [filesColumns] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'user_id'
      `, [DB_NAME, TABLE_NAME]);
      
      if ((filesColumns as any[]).length === 0) {
        await pool.query(`ALTER TABLE ${TABLE_NAME} ADD COLUMN user_id INT NOT NULL DEFAULT 1`);
        await pool.query(`ALTER TABLE ${TABLE_NAME} ADD INDEX idx_user_id (user_id)`);
        await pool.query(`ALTER TABLE ${TABLE_NAME} ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
      }

      // 检查albums表是否需要添加user_id字段
      const [albumsColumns] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'user_id'
      `, [DB_NAME, ALBUMS_TABLE]);
      
      if ((albumsColumns as any[]).length === 0) {
        await pool.query(`ALTER TABLE ${ALBUMS_TABLE} ADD COLUMN user_id INT NOT NULL DEFAULT 1`);
        await pool.query(`ALTER TABLE ${ALBUMS_TABLE} ADD INDEX idx_user_id (user_id)`);
        await pool.query(`ALTER TABLE ${ALBUMS_TABLE} ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
      }
    };
    
    // 创建默认管理员用户
    const [defaultUserResult] = await pool.query(`
      SELECT id FROM users WHERE username = 'admin'
    `);
    
    if ((defaultUserResult as any[]).length === 0) {
      await pool.query(`
        INSERT INTO users (username, email, password_hash, display_name, avatar_url, bio) 
        VALUES ('admin', 'admin@example.com', '$2b$10$default_hash', '管理员', '', '系统默认管理员账户')
      `);
    }

    // 创建默认普通用户
    const [guestUserResult] = await pool.query(`
      SELECT id FROM users WHERE username = 'guest'
    `);
    
    if ((guestUserResult as any[]).length === 0) {
      await pool.query(`
        INSERT INTO users (username, email, password_hash, display_name, avatar_url, bio) 
        VALUES ('guest', 'guest@example.com', '$2b$10$default_hash', '访客用户', '', '系统默认访客账户')
      `);
    }

    await checkAndAddColumns();
    
    // 创建默认相册（关联到管理员用户）
    const [defaultAlbumResult] = await pool.query(`
      SELECT id FROM ${ALBUMS_TABLE} WHERE name = '默认相册'
    `);
    
    if ((defaultAlbumResult as any[]).length === 0) {
      await pool.query(`
        INSERT INTO ${ALBUMS_TABLE} (name, description, user_id) 
        VALUES ('默认相册', '系统默认相册，用于存放未分类的文件', 1)
      `);
    }
    
    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 插入文件信息
export async function insertFileInfo(file: {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
  album_id?: number;
}) {
  try {
    const [result] = await pool.query(
      `INSERT INTO ${TABLE_NAME} (filename, originalname, mimetype, size, url, album_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [file.filename, file.originalname, file.mimetype, file.size, file.url, file.album_id || null]
    );
    return result;
  } catch (error) {
    console.error('插入文件信息失败:', error);
    throw error;
  }
}

// 获取文件列表（支持分页）
export async function getFileList(options?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  albumId?: number | 'default' | null;
}) {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      albumId
    } = options || {};

    const offset = (page - 1) * limit;
    const validSortBy = ['id', 'originalname', 'size', 'created_at'].includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    let whereClause = '';
    let queryParams: any[] = [];

    // 处理相册筛选
    if (albumId === 'default') {
      whereClause = 'WHERE album_id IS NULL';
    } else if (albumId !== undefined && albumId !== null) {
      whereClause = 'WHERE album_id = ?';
      queryParams.push(albumId);
    }

    // 获取总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM ${TABLE_NAME} ${whereClause}`,
      queryParams
    );
    const total = (countResult as any[])[0].total;

    // 获取分页数据
    const [rows] = await pool.query(`
      SELECT * FROM ${TABLE_NAME} 
      ${whereClause}
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

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
    console.error('获取文件列表失败:', error);
    throw error;
  }
}

// 搜索文件
export async function searchFiles(options: {
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  albumId?: number | 'default' | null;
}) {
  try {
    const {
      search,
      type,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      albumId
    } = options;

    const offset = (page - 1) * limit;
    const validSortBy = ['id', 'originalname', 'size', 'created_at'].includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    let whereConditions = [];
    let queryParams: any[] = [];

    // 相册筛选
    if (albumId === 'default') {
      whereConditions.push('album_id IS NULL');
    } else if (albumId !== undefined && albumId !== null) {
      whereConditions.push('album_id = ?');
      queryParams.push(albumId);
    }

    // 搜索条件
    if (search) {
      whereConditions.push('originalname LIKE ?');
      queryParams.push(`%${search}%`);
    }

    // 文件类型过滤
    if (type) {
      if (type === 'image') {
        whereConditions.push('mimetype LIKE ?');
        queryParams.push('image/%');
      } else if (type === 'video') {
        whereConditions.push('mimetype LIKE ?');
        queryParams.push('video/%');
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 获取总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM ${TABLE_NAME} ${whereClause}`,
      queryParams
    );
    const total = (countResult as any[])[0].total;

    // 获取分页数据
    const [rows] = await pool.query(`
      SELECT * FROM ${TABLE_NAME} 
      ${whereClause}
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        search,
        type,
        albumId
      }
    };
  } catch (error) {
    console.error('搜索文件失败:', error);
    throw error;
  }
}

// 获取文件统计信息
export async function getFileStats() {
  try {
    // 总文件数
    const [totalResult] = await pool.query(
      `SELECT COUNT(*) as total FROM ${TABLE_NAME}`
    );
    const totalFiles = (totalResult as any[])[0].total;

    // 总文件大小
    const [sizeResult] = await pool.query(
      `SELECT SUM(size) as totalSize FROM ${TABLE_NAME}`
    );
    const totalSize = (sizeResult as any[])[0].totalSize || 0;

    // 图片文件数
    const [imageResult] = await pool.query(
      `SELECT COUNT(*) as imageCount FROM ${TABLE_NAME} WHERE mimetype LIKE 'image/%'`
    );
    const imageCount = (imageResult as any[])[0].imageCount;

    // 视频文件数
    const [videoResult] = await pool.query(
      `SELECT COUNT(*) as videoCount FROM ${TABLE_NAME} WHERE mimetype LIKE 'video/%'`
    );
    const videoCount = (videoResult as any[])[0].videoCount;

    // 最近7天上传数
    const [recentResult] = await pool.query(
      `SELECT COUNT(*) as recentCount FROM ${TABLE_NAME} WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    const recentCount = (recentResult as any[])[0].recentCount;

    // 按日期统计最近30天
    const [dailyStatsResult] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(size) as totalSize
      FROM ${TABLE_NAME} 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // 按文件类型统计
    const [typeStatsResult] = await pool.query(`
      SELECT 
        CASE 
          WHEN mimetype LIKE 'image/%' THEN 'image'
          WHEN mimetype LIKE 'video/%' THEN 'video'
          ELSE 'other'
        END as type,
        COUNT(*) as count,
        SUM(size) as totalSize
      FROM ${TABLE_NAME}
      GROUP BY type
    `);

    return {
      overview: {
        totalFiles,
        totalSize,
        imageCount,
        videoCount,
        recentCount
      },
      dailyStats: dailyStatsResult,
      typeStats: typeStatsResult
    };
  } catch (error) {
    console.error('获取统计信息失败:', error);
    throw error;
  }
}

// 获取单个文件信息
export async function getFileInfo(id: number) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );
    return (rows as any[])[0];
  } catch (error) {
    console.error('获取文件信息失败:', error);
    throw error;
  }
}

// 删除文件
export async function deleteFile(id: number) {
  try {
    // 获取文件信息
    const [rows] = await pool.query(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );
    
    if ((rows as any[]).length === 0) {
      return false; // 文件不存在
    }
    
    const file = (rows as any[])[0];
    
    // 删除物理文件
    const filePath = path.join(__dirname, '../uploads', file.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error('删除物理文件失败:', error);
        // 继续删除数据库记录，即使物理文件删除失败
      }
    }
    
    // 删除数据库记录
    const [result] = await pool.query(
      `DELETE FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );
    
    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('删除文件失败:', error);
    throw error;
  }
}

// ========== 相册相关操作 ==========

// 创建相册
export async function createAlbum(album: {
  name: string;
  description?: string;
}) {
  try {
    const [result] = await pool.query(
      `INSERT INTO ${ALBUMS_TABLE} (name, description) VALUES (?, ?)`,
      [album.name, album.description || null]
    );
    return result;
  } catch (error) {
    console.error('创建相册失败:', error);
    throw error;
  }
}

// 获取所有相册
export async function getAlbums() {
  try {
    const [albums] = await pool.query(`
      SELECT 
        a.*,
        CASE 
          WHEN a.name = '默认相册' THEN (SELECT COUNT(*) FROM ${TABLE_NAME} WHERE album_id IS NULL)
          ELSE (SELECT COUNT(*) FROM ${TABLE_NAME} WHERE album_id = a.id)
        END as file_count,
        CASE 
          WHEN a.name = '默认相册' THEN COALESCE((SELECT SUM(size) FROM ${TABLE_NAME} WHERE album_id IS NULL), 0)
          ELSE COALESCE((SELECT SUM(size) FROM ${TABLE_NAME} WHERE album_id = a.id), 0)
        END as total_size,
        CASE 
          WHEN a.name = '默认相册' THEN (SELECT url FROM ${TABLE_NAME} WHERE album_id IS NULL AND mimetype LIKE 'image/%' ORDER BY created_at DESC LIMIT 1)
          ELSE (SELECT url FROM ${TABLE_NAME} WHERE album_id = a.id AND mimetype LIKE 'image/%' ORDER BY created_at DESC LIMIT 1)
        END as cover_url
      FROM ${ALBUMS_TABLE} a
      ORDER BY a.created_at DESC
    `);
    return albums;
  } catch (error) {
    console.error('获取相册列表失败:', error);
    throw error;
  }
}

// 获取单个相册信息
export async function getAlbumInfo(id: number) {
  try {
    const [albums] = await pool.query(`
      SELECT 
        a.*,
        CASE 
          WHEN a.name = '默认相册' THEN (SELECT COUNT(*) FROM ${TABLE_NAME} WHERE album_id IS NULL)
          ELSE (SELECT COUNT(*) FROM ${TABLE_NAME} WHERE album_id = a.id)
        END as file_count,
        CASE 
          WHEN a.name = '默认相册' THEN COALESCE((SELECT SUM(size) FROM ${TABLE_NAME} WHERE album_id IS NULL), 0)
          ELSE COALESCE((SELECT SUM(size) FROM ${TABLE_NAME} WHERE album_id = a.id), 0)
        END as total_size
      FROM ${ALBUMS_TABLE} a
      WHERE a.id = ?
    `, [id]);
    
    return (albums as any[])[0];
  } catch (error) {
    console.error('获取相册信息失败:', error);
    throw error;
  }
}

// 获取相册中的文件
export async function getAlbumFiles(albumId: number | 'default', options?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options || {};

    const offset = (page - 1) * limit;
    const validSortBy = ['id', 'originalname', 'size', 'created_at'].includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    let whereClause: string;
    let queryParams: any[];

    if (albumId === 'default') {
      // 默认相册：查询 album_id 为 NULL 的文件
      whereClause = 'WHERE album_id IS NULL';
      queryParams = [];
    } else {
      // 指定相册：查询 album_id 等于指定ID的文件
      whereClause = 'WHERE album_id = ?';
      queryParams = [albumId];
    }

    // 获取总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM ${TABLE_NAME} ${whereClause}`,
      queryParams
    );
    const total = (countResult as any[])[0].total;

    // 获取分页数据
    const [rows] = await pool.query(`
      SELECT * FROM ${TABLE_NAME} 
      ${whereClause}
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

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
    console.error('获取相册文件失败:', error);
    throw error;
  }
}

// 更新相册信息
export async function updateAlbum(id: number, album: {
  name?: string;
  description?: string;
  cover_image_id?: number;
}) {
  try {
    const updateFields = [];
    const updateValues = [];

    if (album.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(album.name);
    }

    if (album.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(album.description);
    }

    if (album.cover_image_id !== undefined) {
      updateFields.push('cover_image_id = ?');
      updateValues.push(album.cover_image_id);
    }

    if (updateFields.length === 0) {
      return false;
    }

    updateValues.push(id);

    const [result] = await pool.query(
      `UPDATE ${ALBUMS_TABLE} SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('更新相册失败:', error);
    throw error;
  }
}

// 删除相册
export async function deleteAlbum(id: number) {
  try {
    // 检查是否为默认相册
    const [albumInfo] = await pool.query(
      `SELECT name FROM ${ALBUMS_TABLE} WHERE id = ?`,
      [id]
    );

    if ((albumInfo as any[]).length === 0) {
      return false; // 相册不存在
    }

    if ((albumInfo as any[])[0].name === '默认相册') {
      throw new Error('不能删除默认相册');
    }

    // 将相册中的文件移动到默认相册
    const [defaultAlbum] = await pool.query(
      `SELECT id FROM ${ALBUMS_TABLE} WHERE name = '默认相册'`
    );

    if ((defaultAlbum as any[]).length > 0) {
      const defaultAlbumId = (defaultAlbum as any[])[0].id;
      await pool.query(
        `UPDATE ${TABLE_NAME} SET album_id = ? WHERE album_id = ?`,
        [defaultAlbumId, id]
      );
    }

    // 删除相册
    const [result] = await pool.query(
      `DELETE FROM ${ALBUMS_TABLE} WHERE id = ?`,
      [id]
    );

    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('删除相册失败:', error);
    throw error;
  }
}

// 移动文件到相册
export async function moveFileToAlbum(fileId: number, albumId: number | null) {
  try {
    const [result] = await pool.query(
      `UPDATE ${TABLE_NAME} SET album_id = ? WHERE id = ?`,
      [albumId, fileId]
    );

    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('移动文件到相册失败:', error);
    throw error;
  }
}

// 批量移动文件到相册
export async function moveFilesToAlbum(fileIds: number[], albumId: number | null) {
  try {
    if (fileIds.length === 0) return false;

    const placeholders = fileIds.map(() => '?').join(',');
    const [result] = await pool.query(
      `UPDATE ${TABLE_NAME} SET album_id = ? WHERE id IN (${placeholders})`,
      [albumId, ...fileIds]
    );

    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('批量移动文件到相册失败:', error);
    throw error;
  }
}

// ================== 社交功能相关函数 ==================

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
export async function isUserLiked(fileId: number, userId: string) {
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
export async function isUserFavorited(fileId: number, userId: string) {
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

// 点赞/取消点赞
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
        'INSERT INTO likes (file_id, user_id, user_name) VALUES (?, ?, ?)',
        [fileId, userId, userName]
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

// 收藏/取消收藏
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
        'INSERT INTO favorites (file_id, user_id, user_name) VALUES (?, ?, ?)',
        [fileId, userId, userName]
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
        id,
        user_id,
        user_name,
        content,
        parent_id,
        created_at
      FROM comments 
      WHERE file_id = ? 
      ORDER BY created_at DESC
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

// 添加评论
export async function addComment(fileId: number, userId: string, userName: string, content: string, parentId?: number) {
  try {
    const [result] = await pool.query(
      'INSERT INTO comments (file_id, user_id, user_name, content, parent_id) VALUES (?, ?, ?, ?, ?)',
      [fileId, userId, userName, content, parentId || null]
    );

    const commentId = (result as any).insertId;

    // 返回新添加的评论
    const [newComment] = await pool.query(
      'SELECT id, user_id, user_name, content, parent_id, created_at FROM comments WHERE id = ?',
      [commentId]
    );

    return (newComment as any[])[0];
  } catch (error) {
    console.error('添加评论失败:', error);
    throw error;
  }
}

// 删除评论
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

// 获取文件的扩展信息（包含社交统计）
export async function getFileWithSocialInfo(fileId: number, userId?: string) {
  try {
    // 获取文件基本信息
    const fileInfo = await getFileInfo(fileId);
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
    let queryParams: any[] = [];

    // 处理相册筛选
    if (albumId === 'default') {
      whereClause = 'WHERE f.album_id IS NULL';
    } else if (albumId !== undefined && albumId !== null) {
      whereClause = 'WHERE f.album_id = ?';
      queryParams.push(albumId);
    }

    // 获取总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM ${TABLE_NAME} f ${whereClause}`,
      queryParams
    );
    const total = (countResult as any[])[0].total;

    // 获取文件列表并关联社交统计
    const [rows] = await pool.query(`
      SELECT 
        f.*,
        COALESCE(like_stats.like_count, 0) as likes,
        COALESCE(favorite_stats.favorite_count, 0) as favorites,
        COALESCE(comment_stats.comment_count, 0) as comments,
        ${userId ? 'CASE WHEN user_likes.file_id IS NOT NULL THEN 1 ELSE 0 END as isLiked,' : '0 as isLiked,'}
        ${userId ? 'CASE WHEN user_favorites.file_id IS NOT NULL THEN 1 ELSE 0 END as isFavorited' : '0 as isFavorited'}
      FROM ${TABLE_NAME} f
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
      ...queryParams, 
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
          views: 0,  // 浏览量功能暂时设为0
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

// ================== 用户系统相关函数 ==================

// 创建用户
export async function createUser(userData: {
  username: string;
  email: string;
  password_hash: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
}) {
  try {
    const [result] = await pool.query(
      `INSERT INTO users (username, email, password_hash, display_name, avatar_url, bio, location, website) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userData.username,
        userData.email,
        userData.password_hash,
        userData.display_name,
        userData.avatar_url || null,
        userData.bio || null,
        userData.location || null,
        userData.website || null
      ]
    );
    return (result as any).insertId;
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
      'SELECT id, username, email, display_name, avatar_url, bio, location, website, created_at, last_login_at FROM users WHERE id = ? AND is_active = TRUE',
      [id]
    );
    return (rows as any[])[0];
  } catch (error) {
    console.error('根据ID获取用户失败:', error);
    throw error;
  }
}

// 更新用户信息
export async function updateUser(id: number, userData: {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  email?: string;
}) {
  try {
    const updateFields = [];
    const updateValues = [];

    if (userData.display_name !== undefined) {
      updateFields.push('display_name = ?');
      updateValues.push(userData.display_name);
    }
    if (userData.avatar_url !== undefined) {
      updateFields.push('avatar_url = ?');
      updateValues.push(userData.avatar_url);
    }
    if (userData.bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(userData.bio);
    }
    if (userData.location !== undefined) {
      updateFields.push('location = ?');
      updateValues.push(userData.location);
    }
    if (userData.website !== undefined) {
      updateFields.push('website = ?');
      updateValues.push(userData.website);
    }
    if (userData.email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(userData.email);
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
    await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
  } catch (error) {
    console.error('更新最后登录时间失败:', error);
    throw error;
  }
}

// 创建用户会话
export async function createUserSession(userId: number, sessionToken: string, expiresAt: Date) {
  try {
    const [result] = await pool.query(
      'INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
      [userId, sessionToken, expiresAt]
    );
    return (result as any).insertId;
  } catch (error) {
    console.error('创建用户会话失败:', error);
    throw error;
  }
}

// 验证用户会话
export async function validateUserSession(sessionToken: string) {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, u.id as user_id, u.username, u.display_name, u.avatar_url 
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.expires_at > NOW() AND u.is_active = TRUE
    `, [sessionToken]);
    
    return (rows as any[])[0];
  } catch (error) {
    console.error('验证用户会话失败:', error);
    throw error;
  }
}

// 删除用户会话
export async function deleteUserSession(sessionToken: string) {
  try {
    const [result] = await pool.query(
      'DELETE FROM user_sessions WHERE session_token = ?',
      [sessionToken]
    );
    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('删除用户会话失败:', error);
    throw error;
  }
}

// 清理过期会话
export async function cleanExpiredSessions() {
  try {
    const [result] = await pool.query(
      'DELETE FROM user_sessions WHERE expires_at <= NOW()'
    );
    return (result as any).affectedRows;
  } catch (error) {
    console.error('清理过期会话失败:', error);
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

// 检查是否关注用户
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

// 获取用户的关注列表
export async function getUserFollowing(userId: number, options?: { page?: number; limit?: number }) {
  try {
    const { page = 1, limit = 20 } = options || {};
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(`
      SELECT 
        u.id, u.username, u.display_name, u.avatar_url, u.bio,
        f.created_at as followed_at
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
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  } catch (error) {
    console.error('获取关注列表失败:', error);
    throw error;
  }
}

// 获取用户的粉丝列表
export async function getUserFollowers(userId: number, options?: { page?: number; limit?: number }) {
  try {
    const { page = 1, limit = 20 } = options || {};
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(`
      SELECT 
        u.id, u.username, u.display_name, u.avatar_url, u.bio,
        f.created_at as followed_at
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
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  } catch (error) {
    console.error('获取粉丝列表失败:', error);
    throw error;
  }
}

// 获取用户统计信息
export async function getUserStats(userId: number) {
  try {
    // 获取动态数量
    const [postsResult] = await pool.query(
      `SELECT COUNT(*) as count FROM ${TABLE_NAME} WHERE user_id = ?`,
      [userId]
    );
    const postsCount = (postsResult as any[])[0].count;

    // 获取关注数量
    const [followingResult] = await pool.query(
      'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?',
      [userId]
    );
    const followingCount = (followingResult as any[])[0].count;

    // 获取粉丝数量
    const [followersResult] = await pool.query(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = ?',
      [userId]
    );
    const followersCount = (followersResult as any[])[0].count;

    // 获取获得的点赞数量
    const [likesResult] = await pool.query(`
      SELECT COUNT(*) as count FROM likes l 
      JOIN ${TABLE_NAME} f ON l.file_id = f.id 
      WHERE f.user_id = ?
    `, [userId]);
    const likesCount = (likesResult as any[])[0].count;

    return {
      posts: postsCount,
      following: followingCount,
      followers: followersCount,
      likes: likesCount
    };
  } catch (error) {
    console.error('获取用户统计信息失败:', error);
    throw error;
  }
}

// 获取用户动态（包含社交统计）
export async function getUserPosts(userId: number, options?: {
  page?: number;
  limit?: number;
  viewerId?: number;
}) {
  try {
    const { page = 1, limit = 20, viewerId } = options || {};
    const offset = (page - 1) * limit;

    // 获取用户的动态，包含社交统计
    const [rows] = await pool.query(`
      SELECT 
        f.*,
        u.username, u.display_name, u.avatar_url,
        COALESCE(like_stats.like_count, 0) as likes,
        COALESCE(favorite_stats.favorite_count, 0) as favorites,
        COALESCE(comment_stats.comment_count, 0) as comments,
        ${viewerId ? 'CASE WHEN user_likes.file_id IS NOT NULL THEN 1 ELSE 0 END as isLiked,' : '0 as isLiked,'}
        ${viewerId ? 'CASE WHEN user_favorites.file_id IS NOT NULL THEN 1 ELSE 0 END as isFavorited' : '0 as isFavorited'}
      FROM ${TABLE_NAME} f
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
      ${viewerId ? `LEFT JOIN likes user_likes ON f.id = user_likes.file_id AND user_likes.user_id = ?` : ''}
      ${viewerId ? `LEFT JOIN favorites user_favorites ON f.id = user_favorites.file_id AND user_favorites.user_id = ?` : ''}
      WHERE f.user_id = ? AND u.is_active = TRUE
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [
      ...(viewerId ? [viewerId, viewerId] : []),
      userId,
      limit,
      offset
    ]);

    // 获取总数
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM ${TABLE_NAME} f JOIN users u ON f.user_id = u.id WHERE f.user_id = ? AND u.is_active = TRUE`,
      [userId]
    );
    const total = (countResult as any[])[0].total;

    // 为每个动态获取最新评论
    const postsWithComments = await Promise.all(
      (rows as any[]).map(async (post) => {
        const commentsData = await getFileComments(post.id, { page: 1, limit: 2 });
        return {
          ...post,
          shares: 0,
          views: 0,
          latestComments: commentsData.data
        };
      })
    );

    return {
      data: postsWithComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('获取用户动态失败:', error);
    throw error;
  }
}

// 获取用户收藏的动态
export async function getUserFavorites(userId: number, options?: {
  page?: number;
  limit?: number;
}) {
  try {
    const { page = 1, limit = 20 } = options || {};
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(`
      SELECT 
        f.*,
        u.username, u.display_name, u.avatar_url,
        fav.created_at as favorited_at,
        COALESCE(like_stats.like_count, 0) as likes,
        COALESCE(favorite_stats.favorite_count, 0) as favorites,
        COALESCE(comment_stats.comment_count, 0) as comments,
        CASE WHEN user_likes.file_id IS NOT NULL THEN 1 ELSE 0 END as isLiked,
        1 as isFavorited
      FROM favorites fav
      JOIN ${TABLE_NAME} f ON fav.file_id = f.id
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
      LEFT JOIN likes user_likes ON f.id = user_likes.file_id AND user_likes.user_id = ?
      WHERE fav.user_id = ? AND u.is_active = TRUE
      ORDER BY fav.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, userId, limit, offset]);

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM favorites fav JOIN ${TABLE_NAME} f ON fav.file_id = f.id JOIN users u ON f.user_id = u.id WHERE fav.user_id = ? AND u.is_active = TRUE`,
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
    console.error('获取用户收藏失败:', error);
    throw error;
  }
}

// 修改现有方法以支持用户ID

// 修改插入文件信息方法
export async function insertFileInfoWithUser(file: {
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
  privacy_level?: 'public' | 'private' | 'friends';
}) {
  try {
    const [result] = await pool.query(
      `INSERT INTO ${TABLE_NAME} (filename, originalname, mimetype, size, url, album_id, user_id, caption, tags, location, privacy_level) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        file.filename,
        file.originalname,
        file.mimetype,
        file.size,
        file.url,
        file.album_id || null,
        file.user_id,
        file.caption || null,
        file.tags ? JSON.stringify(file.tags) : null,
        file.location || null,
        file.privacy_level || 'public'
      ]
    );
    return result;
  } catch (error) {
    console.error('插入文件信息失败:', error);
    throw error;
  }
}

// 修改点赞方法以使用用户ID
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

// 修改收藏方法以使用用户ID
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

// 修改评论方法以使用用户ID
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

// 修改删除评论方法以使用用户ID
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