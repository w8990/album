import express from 'express';
import { 
  insertFileInfo,
  insertFileInfoWithUser, 
  getFileList, 
  searchFiles, 
  getFileStats, 
  getFileInfo, 
  deleteFile,
  moveFileToAlbum,
  moveFilesToAlbum,
  getFileListWithSocial,
  incrementFileViews
} from '../db';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// 获取文件列表（支持社交统计）
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = req.query.sortBy as string || 'created_at';
    const sortOrder = req.query.sortOrder as string || 'DESC';
    const albumId = req.query.albumId as string;
    
    let parsedAlbumId: number | 'default' | null = null;
    if (albumId === 'default') {
      parsedAlbumId = 'default';
    } else if (albumId && albumId !== 'null') {
      parsedAlbumId = parseInt(albumId);
    }

    const userId = req.user?.id;
    const result = await getFileListWithSocial({
      page,
      limit,
      sortBy,
      sortOrder,
      albumId: parsedAlbumId,
      userId: userId?.toString()
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('获取文件列表失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取文件列表失败' 
    });
  }
});

// 搜索文件
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const search = req.query.search as string;
    const type = req.query.type as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = req.query.sortBy as string || 'created_at';
    const sortOrder = req.query.sortOrder as string || 'DESC';
    const albumId = req.query.albumId as string;
    
    let parsedAlbumId: number | 'default' | null = null;
    if (albumId === 'default') {
      parsedAlbumId = 'default';
    } else if (albumId && albumId !== 'null') {
      parsedAlbumId = parseInt(albumId);
    }

    const result = await searchFiles({
      search,
      type,
      page,
      limit,
      sortBy,
      sortOrder,
      albumId: parsedAlbumId
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('搜索文件失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '搜索文件失败' 
    });
  }
});

// 获取文件统计信息
router.get('/stats', async (req, res) => {
  try {
    const stats = await getFileStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取统计信息失败' 
    });
  }
});

// 获取单个文件信息
router.get('/:id', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const fileInfo = await getFileInfo(fileId);
    
    if (!fileInfo) {
      return res.status(404).json({ 
        success: false, 
        error: '文件不存在' 
      });
    }

    res.json({
      success: true,
      data: fileInfo
    });
  } catch (error) {
    console.error('获取文件信息失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取文件信息失败' 
    });
  }
});

// 上传文件（需要认证）
router.post('/upload', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    console.log('收到上传请求:', {
      files: req.files ? req.files.length : 0,
      body: req.body,
      user: req.user
    });

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      console.log('没有文件上传');
      return res.status(400).json({ 
        success: false, 
        error: '没有上传文件' 
      });
    }

    const uploadedFiles = [];
    const albumId = req.body.albumId ? parseInt(req.body.albumId) : undefined;
    
    // 确保用户已登录
    const userId = req.user!.id;

    console.log('处理文件上传:', { albumId, userId, fileCount: req.files.length });

    for (const file of req.files) {
      console.log('处理文件:', {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });

      const fileInfo = {
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `http://localhost:3000/uploads/${file.filename}`,
        album_id: albumId,
        user_id: userId
      };

      console.log('准备插入数据库:', fileInfo);
      const result = await insertFileInfo(fileInfo);
      console.log('数据库插入结果:', result);
      
      uploadedFiles.push({
        id: (result as any).insertId,
        ...fileInfo
      });
    }

    console.log('上传成功:', uploadedFiles.length);
    res.json({
      success: true,
      data: uploadedFiles,
      message: `成功上传 ${uploadedFiles.length} 个文件`
    });
  } catch (error) {
    console.error('上传文件失败详细错误:', error);
    res.status(500).json({ 
      success: false, 
      error: '上传文件失败: ' + (error instanceof Error ? error.message : String(error))
    });
  }
});

// 删除文件（暂时无需认证）
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const success = await deleteFile(fileId);
    
    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: '文件不存在' 
      });
    }

    res.json({
      success: true,
      message: '文件删除成功'
    });
  } catch (error) {
    console.error('删除文件失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '删除文件失败' 
    });
  }
});

// 移动文件到相册（暂时无需认证）
router.put('/:id/move', optionalAuth, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const albumId = req.body.albumId === null ? null : parseInt(req.body.albumId);
    
    const success = await moveFileToAlbum(fileId, albumId);
    
    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: '文件不存在' 
      });
    }

    res.json({
      success: true,
      message: '文件移动成功'
    });
  } catch (error) {
    console.error('移动文件失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '移动文件失败' 
    });
  }
});

// 批量移动文件到相册（暂时无需认证）
router.put('/batch/move', optionalAuth, async (req, res) => {
  try {
    const { fileIds, albumId } = req.body;
    
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: '请选择要移动的文件' 
      });
    }

    const parsedAlbumId = albumId === null ? null : parseInt(albumId);
    const success = await moveFilesToAlbum(fileIds, parsedAlbumId);
    
    if (!success) {
      return res.status(400).json({ 
        success: false, 
        error: '移动文件失败' 
      });
    }

    res.json({
      success: true,
      message: `成功移动 ${fileIds.length} 个文件`
    });
  } catch (error) {
    console.error('批量移动文件失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '批量移动文件失败' 
    });
  }
});

// 记录文件浏览量
router.post('/:id/view', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    
    if (!fileId || isNaN(fileId)) {
      return res.status(400).json({ 
        success: false, 
        error: '无效的文件ID' 
      });
    }

    // 检查文件是否存在
    const fileInfo = await getFileInfo(fileId);
    if (!fileInfo) {
      return res.status(404).json({ 
        success: false, 
        error: '文件不存在' 
      });
    }

    // 增加浏览量
    const success = await incrementFileViews(fileId);
    
    if (success) {
      res.json({
        success: true,
        message: '浏览量记录成功'
      });
    } else {
      res.status(500).json({
        success: false,
        error: '记录浏览量失败'
      });
    }
  } catch (error) {
    console.error('记录浏览量失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '记录浏览量失败' 
    });
  }
});

export default router; 