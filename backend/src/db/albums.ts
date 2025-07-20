import { pool } from './connection';
import { ALBUMS_TABLE, TABLE_NAME } from './init';

// 创建相册
export async function createAlbum(album: {
  name: string;
  description?: string;
  userId?: number;
}) {
  try {
    const [result] = await pool.query(
      `INSERT INTO ${ALBUMS_TABLE} (name, description, user_id) VALUES (?, ?, ?)`,
      [album.name, album.description || null, album.userId || 1]
    );
    return result;
  } catch (error) {
    console.error('创建相册失败:', error);
    throw error;
  }
}

// 获取用户的所有相册
export async function getAlbums(userId?: number) {
  try {
    let whereClause = '';
    let queryParams: any[] = [];
    
    if (userId) {
      whereClause = 'WHERE a.user_id = ?';
      queryParams = [userId];
    }
    
    const [albums] = await pool.query(`
      SELECT 
        a.*,
        u.username as owner_username,
        u.display_name as owner_display_name,
        CASE 
          WHEN a.name = '默认相册' AND a.user_id = ? THEN (SELECT COUNT(*) FROM ${TABLE_NAME} WHERE album_id IS NULL AND user_id = ?)
          ELSE (SELECT COUNT(*) FROM ${TABLE_NAME} WHERE album_id = a.id AND user_id = a.user_id)
        END as file_count,
        CASE 
          WHEN a.name = '默认相册' AND a.user_id = ? THEN COALESCE((SELECT SUM(size) FROM ${TABLE_NAME} WHERE album_id IS NULL AND user_id = ?), 0)
          ELSE COALESCE((SELECT SUM(size) FROM ${TABLE_NAME} WHERE album_id = a.id AND user_id = a.user_id), 0)
        END as total_size,
        CASE 
          WHEN a.name = '默认相册' AND a.user_id = ? THEN (SELECT url FROM ${TABLE_NAME} WHERE album_id IS NULL AND user_id = ? AND mimetype LIKE 'image/%' ORDER BY created_at ASC LIMIT 1)
          ELSE (SELECT url FROM ${TABLE_NAME} WHERE album_id = a.id AND user_id = a.user_id AND mimetype LIKE 'image/%' ORDER BY created_at ASC LIMIT 1)
        END as cover_url
      FROM ${ALBUMS_TABLE} a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
    `, [...queryParams, userId, userId, userId, userId, userId, userId]);
    return albums;
  } catch (error) {
    console.error('获取相册列表失败:', error);
    throw error;
  }
}

// 获取单个相册信息
export async function getAlbumInfo(id: number, userId?: number) {
  try {
    const [albums] = await pool.query(`
      SELECT 
        a.*,
        u.username as owner_username,
        u.display_name as owner_display_name,
        CASE 
          WHEN a.name = '默认相册' AND a.user_id = a.user_id THEN (SELECT COUNT(*) FROM ${TABLE_NAME} WHERE album_id IS NULL AND user_id = a.user_id)
          ELSE (SELECT COUNT(*) FROM ${TABLE_NAME} WHERE album_id = a.id AND user_id = a.user_id)
        END as file_count,
        CASE 
          WHEN a.name = '默认相册' AND a.user_id = a.user_id THEN COALESCE((SELECT SUM(size) FROM ${TABLE_NAME} WHERE album_id IS NULL AND user_id = a.user_id), 0)
          ELSE COALESCE((SELECT SUM(size) FROM ${TABLE_NAME} WHERE album_id = a.id AND user_id = a.user_id), 0)
        END as total_size
      FROM ${ALBUMS_TABLE} a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = ? ${userId ? 'AND a.user_id = ?' : ''}
    `, userId ? [id, userId] : [id]);
    
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
  userId?: number;
}) {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      userId
    } = options || {};

    const offset = (page - 1) * limit;
    const validSortBy = ['id', 'originalname', 'size', 'created_at'].includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    let whereClause: string;
    let queryParams: any[];

    if (albumId === 'default') {
      // 默认相册：查询 album_id 为 NULL 且属于指定用户的文件
      if (userId) {
        whereClause = 'WHERE album_id IS NULL AND user_id = ?';
        queryParams = [userId];
      } else {
        whereClause = 'WHERE album_id IS NULL';
        queryParams = [];
      }
    } else {
      // 指定相册：查询 album_id 等于指定ID且属于指定用户的文件
      if (userId) {
        whereClause = 'WHERE album_id = ? AND user_id = ?';
        queryParams = [albumId, userId];
      } else {
        whereClause = 'WHERE album_id = ?';
        queryParams = [albumId];
      }
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
}, userId?: number) {
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
    if (userId) {
      updateValues.push(userId);
    }

    const whereClause = userId ? 'WHERE id = ? AND user_id = ?' : 'WHERE id = ?';
    const [result] = await pool.query(
      `UPDATE ${ALBUMS_TABLE} SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP ${whereClause}`,
      updateValues
    );

    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('更新相册失败:', error);
    throw error;
  }
}

// 删除相册
export async function deleteAlbum(id: number, userId?: number) {
  try {
    // 检查是否为默认相册且用户是否有权限
    const whereClause = userId ? 'WHERE id = ? AND user_id = ?' : 'WHERE id = ?';
    const queryParams = userId ? [id, userId] : [id];
    
    const [albumInfo] = await pool.query(
      `SELECT name, user_id FROM ${ALBUMS_TABLE} ${whereClause}`,
      queryParams
    );

    if ((albumInfo as any[]).length === 0) {
      return false; // 相册不存在或无权删除
    }

    if ((albumInfo as any[])[0].name === '默认相册') {
      throw new Error('不能删除默认相册');
    }

    const albumUserId = (albumInfo as any[])[0].user_id;

    // 将相册中的文件移动到该用户的默认相册
    const [defaultAlbum] = await pool.query(
      `SELECT id FROM ${ALBUMS_TABLE} WHERE name = '默认相册' AND user_id = ?`,
      [albumUserId]
    );

    if ((defaultAlbum as any[]).length > 0) {
      const defaultAlbumId = (defaultAlbum as any[])[0].id;
      await pool.query(
        `UPDATE ${TABLE_NAME} SET album_id = ? WHERE album_id = ? AND user_id = ?`,
        [defaultAlbumId, id, albumUserId]
      );
    } else {
      // 如果没有默认相册，将文件设为NULL（无相册）
      await pool.query(
        `UPDATE ${TABLE_NAME} SET album_id = NULL WHERE album_id = ? AND user_id = ?`,
        [id, albumUserId]
      );
    }

    // 删除相册
    const [result] = await pool.query(
      `DELETE FROM ${ALBUMS_TABLE} ${whereClause}`,
      queryParams
    );

    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error('删除相册失败:', error);
    throw error;
  }
} 