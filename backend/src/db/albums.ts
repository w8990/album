import { pool } from './connection';
import { ALBUMS_TABLE, TABLE_NAME } from './init';

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