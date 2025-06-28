import express from 'express';
import { 
  createAlbum,
  getAlbums,
  getAlbumInfo,
  getAlbumFiles,
  updateAlbum,
  deleteAlbum
} from '../db';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = express.Router();

// 获取相册列表（无需认证）
router.get('/', async (req, res) => {
  try {
    const albums = await getAlbums();
    res.json({
      success: true,
      data: albums
    });
  } catch (error) {
    console.error('获取相册列表失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取相册列表失败' 
    });
  }
});

// 获取单个相册信息（无需认证）
router.get('/:id', async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);
    const albumInfo = await getAlbumInfo(albumId);
    
    if (!albumInfo) {
      return res.status(404).json({ 
        success: false, 
        error: '相册不存在' 
      });
    }

    res.json({
      success: true,
      data: albumInfo
    });
  } catch (error) {
    console.error('获取相册信息失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取相册信息失败' 
    });
  }
});

// 获取相册中的文件（可选认证）
router.get('/:id/files', optionalAuth, async (req, res) => {
  try {
    const albumIdParam = req.params.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = req.query.sortBy as string || 'created_at';
    const sortOrder = req.query.sortOrder as string || 'DESC';
    
    let parsedAlbumId: number | 'default';
    if (albumIdParam === 'default') {
      parsedAlbumId = 'default';
    } else {
      parsedAlbumId = parseInt(albumIdParam);
    }

    const result = await getAlbumFiles(parsedAlbumId, {
      page,
      limit,
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('获取相册文件失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取相册文件失败' 
    });
  }
});

// 创建相册（暂时无需认证，使用默认用户）
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: '相册名称不能为空' 
      });
    }

    const result = await createAlbum({
      name: name.trim(),
      description: description?.trim()
    });

    res.json({
      success: true,
      data: {
        id: (result as any).insertId,
        name: name.trim(),
        description: description?.trim()
      },
      message: '相册创建成功'
    });
  } catch (error) {
    console.error('创建相册失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '创建相册失败' 
    });
  }
});

// 更新相册信息（暂时无需认证）
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);
    const { name, description, cover_image_id } = req.body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (cover_image_id !== undefined) updateData.cover_image_id = cover_image_id;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: '没有提供更新数据' 
      });
    }

    const success = await updateAlbum(albumId, updateData);
    
    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: '相册不存在' 
      });
    }

    res.json({
      success: true,
      message: '相册更新成功'
    });
  } catch (error) {
    console.error('更新相册失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '更新相册失败' 
    });
  }
});

// 删除相册（暂时无需认证）
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);
    
    const success = await deleteAlbum(albumId);
    
    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: '相册不存在' 
      });
    }

    res.json({
      success: true,
      message: '相册删除成功'
    });
  } catch (error) {
    if (error instanceof Error && error.message === '不能删除默认相册') {
      return res.status(400).json({ 
        success: false, 
        error: '不能删除默认相册' 
      });
    }
    
    console.error('删除相册失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '删除相册失败' 
    });
  }
});

export default router; 