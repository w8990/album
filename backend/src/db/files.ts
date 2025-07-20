import fs from 'fs';
import path from 'path';
import { pool } from './connection';
import { TABLE_NAME } from './init';

// 插入文件信息（原版本，向后兼容）
export async function insertFileInfo(file: {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
  album_id?: number;
  user_id?: number;
}) {
  try {
    const [result] = await pool.query(
      `INSERT INTO ${TABLE_NAME} (filename, originalname, mimetype, size, url, album_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [file.filename, file.originalname, file.mimetype, file.size, file.url, file.album_id || null, file.user_id || 1]
    );
    return result;
  } catch (error) {
    console.error('插入文件信息失败:', error);
    throw error;
  }
}

// 插入文件信息（带用户ID）
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
    const filePath = path.join(__dirname, '../../uploads', file.filename);
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

// 增加文件浏览量
export async function incrementFileViews(fileId: number) {
  try {
    const [result] = await pool.query(
      `UPDATE ${TABLE_NAME} SET views = views + 1 WHERE id = ?`,
      [fileId]
    );

    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('增加浏览量失败:', error);
    throw error;
  }
}

// 获取用户总浏览量
export async function getUserTotalViews(userId: number) {
  try {
    const [result] = await pool.query(
      `SELECT SUM(views) as totalViews FROM ${TABLE_NAME} WHERE user_id = ?`,
      [userId]
    );

    return (result as any[])[0].totalViews || 0;
  } catch (error) {
    console.error('获取用户总浏览量失败:', error);
    throw error;
  }
} 