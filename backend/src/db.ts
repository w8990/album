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
    
    // 创建相册表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${ALBUMS_TABLE} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cover_image_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_created_at (created_at)
      )
    `);
    
    // 创建文件表（增加相册ID字段）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        originalname VARCHAR(255) NOT NULL,
        mimetype VARCHAR(100) NOT NULL,
        size INT NOT NULL,
        url VARCHAR(255) NOT NULL,
        album_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_mimetype (mimetype),
        INDEX idx_created_at (created_at),
        INDEX idx_originalname (originalname),
        INDEX idx_album_id (album_id),
        FOREIGN KEY (album_id) REFERENCES ${ALBUMS_TABLE}(id) ON DELETE SET NULL
      )
    `);
    
    // 检查是否需要添加album_id列（为了兼容现有数据）
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'album_id'
    `, [DB_NAME, TABLE_NAME]);
    
    if ((columns as any[]).length === 0) {
      await pool.query(`ALTER TABLE ${TABLE_NAME} ADD COLUMN album_id INT DEFAULT NULL`);
      await pool.query(`ALTER TABLE ${TABLE_NAME} ADD INDEX idx_album_id (album_id)`);
      await pool.query(`ALTER TABLE ${TABLE_NAME} ADD FOREIGN KEY (album_id) REFERENCES ${ALBUMS_TABLE}(id) ON DELETE SET NULL`);
    }
    
    // 创建默认相册
    const [defaultAlbumResult] = await pool.query(`
      SELECT id FROM ${ALBUMS_TABLE} WHERE name = '默认相册'
    `);
    
    if ((defaultAlbumResult as any[]).length === 0) {
      await pool.query(`
        INSERT INTO ${ALBUMS_TABLE} (name, description) 
        VALUES ('默认相册', '系统默认相册，用于存放未分类的文件')
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
      // 默认相册：album_id 为 NULL
      whereClause = 'WHERE album_id IS NULL';
    } else if (albumId !== undefined && albumId !== null) {
      // 指定相册
      whereClause = 'WHERE album_id = ?';
      queryParams.push(albumId);
    }
    // 如果 albumId 为 null 或 undefined，则不添加筛选条件，显示所有文件

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