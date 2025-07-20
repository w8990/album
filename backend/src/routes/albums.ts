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

// 获取相册列表（需要认证）
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const albums = await getAlbums(userId);
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

// 获取单个相册信息（需要认证）
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);
    const userId = req.user.id;
    const albumInfo = await getAlbumInfo(albumId, userId);
    
    if (!albumInfo) {
      return res.status(404).json({ 
        success: false, 
        error: '相册不存在或无权访问' 
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

// 获取相册中的文件（需要认证）
router.get('/:id/files', authenticateToken, async (req, res) => {
  try {
    const albumIdParam = req.params.id;
    const userId = req.user.id;
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
      sortOrder,
      userId
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

// 创建相册（需要认证）
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: '相册名称不能为空' 
      });
    }

    const result = await createAlbum({
      name: name.trim(),
      description: description?.trim(),
      userId
    });

    res.json({
      success: true,
      data: {
        id: (result as any).insertId,
        name: name.trim(),
        description: description?.trim(),
        userId
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

// 更新相册信息（需要认证）
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);
    const userId = req.user.id;
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

    const success = await updateAlbum(albumId, updateData, userId);
    
    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: '相册不存在或无权修改' 
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

// 删除相册（需要认证）
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const albumId = parseInt(req.params.id);
    const userId = req.user.id;
    
    const success = await deleteAlbum(albumId, userId);
    
    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: '相册不存在或无权删除' 
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