import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  initDB, 
  insertFileInfo, 
  getFileList, 
  deleteFile, 
  getFileInfo, 
  searchFiles, 
  getFileStats,
  createAlbum,
  getAlbums,
  getAlbumInfo,
  getAlbumFiles,
  updateAlbum,
  deleteAlbum,
  moveFileToAlbum,
  moveFilesToAlbum
} from './db';

const app = express();
const port = process.env.PORT || 3000;

// 启用 CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// 请求体大小限制
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 创建上传目录
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名，保留原始扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// 文件过滤器 - 更严格的文件类型检查
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 允许的图片类型
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  // 允许的视频类型
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/wmv'];
  
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 10 // 最多同时上传10个文件
  }
});

// 初始化数据库
initDB().catch(console.error);

// 中间件
app.use('/uploads', express.static(uploadDir, {
  maxAge: '1d', // 缓存1天
  etag: true
}));

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// 文件统计接口
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getFileStats();
    res.json(stats);
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({ 
      error: '获取统计信息失败',
      code: 'STATS_ERROR'
    });
  }
});

// 文件上传接口 - 支持单文件和多文件
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const albumId = req.body.album_id ? parseInt(req.body.album_id) : undefined;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ 
        error: '没有上传文件',
        code: 'NO_FILES'
      });
    }

    const uploadResults = [];
    const errors = [];

    for (const file of files) {
      try {
        const fileInfo = {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: `/uploads/${file.filename}`,
          album_id: albumId
        };

        // 保存文件信息到数据库
        const result = await insertFileInfo(fileInfo);
        const id = (result as any).insertId;

        uploadResults.push({
          id,
          ...fileInfo,
          created_at: new Date().toISOString()
        });
      } catch (error) {
        console.error(`保存文件 ${file.originalname} 信息失败:`, error);
        errors.push({
          filename: file.originalname,
          error: '保存文件信息失败'
        });
        
        // 删除上传的文件
        const filePath = path.join(uploadDir, file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    if (uploadResults.length === 0) {
      return res.status(500).json({ 
        error: '所有文件上传失败',
        code: 'ALL_FAILED',
        details: errors
      });
    }

    const response = {
      success: uploadResults,
      errors: errors.length > 0 ? errors : undefined,
      message: `成功上传 ${uploadResults.length} 个文件${errors.length > 0 ? `，${errors.length} 个失败` : ''}`
    };

    res.json(response);
  } catch (error) {
    console.error('上传失败:', error);
    
    // 清理可能已上传的文件
    if (req.files) {
      const files = req.files as Express.Multer.File[];
      files.forEach(file => {
        const filePath = path.join(uploadDir, file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '上传失败',
      code: 'UPLOAD_ERROR'
    });
  }
});

// 单文件上传接口（向后兼容）
app.post('/api/upload-single', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: '没有上传文件',
        code: 'NO_FILE'
      });
    }

    const albumId = req.body.album_id ? parseInt(req.body.album_id) : undefined;

    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      album_id: albumId
    };

    const result = await insertFileInfo(fileInfo);
    const id = (result as any).insertId;

    res.json({
      id,
      ...fileInfo,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('上传失败:', error);
    
    // 删除可能已上传的文件
    if (req.file) {
      const filePath = path.join(uploadDir, req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '上传失败',
      code: 'UPLOAD_ERROR'
    });
  }
});

// 获取文件列表接口 - 支持分页和搜索
app.get('/api/files', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const type = req.query.type as string; // 'image' 或 'video'
    const sortBy = req.query.sortBy as string || 'created_at';
    const sortOrder = req.query.sortOrder as string || 'DESC';
    const albumIdParam = req.query.album_id as string;

    // 处理相册ID参数
    let albumId: number | 'default' | null | undefined = undefined;
    if (albumIdParam !== undefined) {
      if (albumIdParam === '' || albumIdParam === 'null') {
        albumId = null; // 显示所有文件
      } else if (albumIdParam === 'default') {
        albumId = 'default'; // 默认相册（album_id 为 NULL）
      } else {
        const parsedAlbumId = parseInt(albumIdParam);
        if (!isNaN(parsedAlbumId)) {
          albumId = parsedAlbumId; // 指定相册ID
        }
      }
    }

    let files;
    
    if (search || type || albumId !== undefined) {
      files = await searchFiles({
        search,
        type,
        page,
        limit,
        sortBy,
        sortOrder,
        albumId
      });
    } else {
      files = await getFileList({
        page,
        limit,
        sortBy,
        sortOrder,
        albumId
      });
    }

    res.json(files);
  } catch (error) {
    console.error('获取文件列表失败:', error);
    res.status(500).json({ 
      error: '获取文件列表失败',
      code: 'LIST_ERROR'
    });
  }
});

// 获取单个文件信息接口
app.get('/api/files/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ 
        error: '无效的文件ID',
        code: 'INVALID_ID'
      });
    }

    const fileInfo = await getFileInfo(id);
    if (!fileInfo) {
      return res.status(404).json({ 
        error: '文件不存在',
        code: 'FILE_NOT_FOUND'
      });
    }

    // 检查物理文件是否存在
    const filePath = path.join(uploadDir, (fileInfo as any).filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: '文件已损坏或不存在',
        code: 'PHYSICAL_FILE_NOT_FOUND'
      });
    }

    res.json(fileInfo);
  } catch (error) {
    console.error('获取文件信息失败:', error);
    res.status(500).json({ 
      error: '获取文件信息失败',
      code: 'FILE_INFO_ERROR'
    });
  }
});

// 下载文件接口
app.get('/api/download/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ 
        error: '无效的文件ID',
        code: 'INVALID_ID'
      });
    }

    const fileInfo = await getFileInfo(id) as any;
    if (!fileInfo) {
      return res.status(404).json({ 
        error: '文件不存在',
        code: 'FILE_NOT_FOUND'
      });
    }

    const filePath = path.join(uploadDir, fileInfo.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: '文件已损坏或不存在',
        code: 'PHYSICAL_FILE_NOT_FOUND'
      });
    }

    // 设置响应头
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.originalname)}"`);
    res.setHeader('Content-Type', fileInfo.mimetype);
    res.setHeader('Content-Length', fileInfo.size);

    // 发送文件
    res.sendFile(filePath);
  } catch (error) {
    console.error('下载文件失败:', error);
    res.status(500).json({ 
      error: '下载文件失败',
      code: 'DOWNLOAD_ERROR'
    });
  }
});

// 删除文件接口
app.delete('/api/files/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ 
        error: '无效的文件ID',
        code: 'INVALID_ID'
      });
    }

    const result = await deleteFile(id);
    
    if (!result) {
      return res.status(404).json({ 
        error: '文件不存在',
        code: 'FILE_NOT_FOUND'
      });
    }

    res.json({ 
      message: '文件删除成功',
      id
    });
  } catch (error) {
    console.error('删除文件失败:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '删除文件失败',
      code: 'DELETE_ERROR'
    });
  }
});

// 批量删除文件接口
app.delete('/api/files/batch', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        error: '请提供要删除的文件ID列表',
        code: 'INVALID_IDS'
      });
    }

    const results: {
      success: number[];
      failed: Array<{id: number; error: string}>;
    } = {
      success: [],
      failed: []
    };

    for (const id of ids) {
      try {
        const deleted = await deleteFile(parseInt(id));
        if (deleted) {
          results.success.push(id);
        } else {
          results.failed.push({ id, error: '文件不存在' });
        }
      } catch (error) {
        results.failed.push({ 
          id, 
          error: error instanceof Error ? error.message : '删除失败' 
        });
      }
    }

    res.json({
      message: `成功删除 ${results.success.length} 个文件，${results.failed.length} 个失败`,
      results
    });
  } catch (error) {
    console.error('批量删除失败:', error);
    res.status(500).json({ 
      error: '批量删除失败',
      code: 'BATCH_DELETE_ERROR'
    });
  }
});

// 清理孤立文件接口（管理员功能）
app.post('/api/admin/cleanup', async (req, res) => {
  try {
    const result = await getFileList({ page: 1, limit: 10000 });
    const files = result.data as any[];
    const dbFiles = new Set(files.map(f => f.filename));
    
    // 读取上传目录中的所有文件
    const physicalFiles = fs.readdirSync(uploadDir);
    const orphanedFiles = physicalFiles.filter(file => !dbFiles.has(file));
    
    let deletedCount = 0;
    for (const file of orphanedFiles) {
      try {
        const filePath = path.join(uploadDir, file);
        fs.unlinkSync(filePath);
        deletedCount++;
      } catch (error) {
        console.error(`删除孤立文件 ${file} 失败:`, error);
      }
    }

    res.json({
      message: `清理完成，删除了 ${deletedCount} 个孤立文件`,
      deletedCount,
      totalOrphaned: orphanedFiles.length
    });
  } catch (error) {
    console.error('清理孤立文件失败:', error);
    res.status(500).json({ 
      error: '清理失败',
      code: 'CLEANUP_ERROR'
    });
  }
});

// ========== 相册相关接口 ==========

// 创建相册
app.post('/api/albums', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        error: '相册名称不能为空',
        code: 'INVALID_NAME'
      });
    }

    const result = await createAlbum({ name: name.trim(), description });
    const id = (result as any).insertId;

    res.json({
      id,
      name: name.trim(),
      description,
      created_at: new Date().toISOString(),
      message: '相册创建成功'
    });
  } catch (error) {
    console.error('创建相册失败:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '创建相册失败',
      code: 'CREATE_ALBUM_ERROR'
    });
  }
});

// 获取所有相册
app.get('/api/albums', async (req, res) => {
  try {
    const albums = await getAlbums();
    res.json(albums);
  } catch (error) {
    console.error('获取相册列表失败:', error);
    res.status(500).json({ 
      error: '获取相册列表失败',
      code: 'GET_ALBUMS_ERROR'
    });
  }
});

// 获取单个相册信息
app.get('/api/albums/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ 
        error: '无效的相册ID',
        code: 'INVALID_ID'
      });
    }

    const album = await getAlbumInfo(id);
    if (!album) {
      return res.status(404).json({ 
        error: '相册不存在',
        code: 'ALBUM_NOT_FOUND'
      });
    }

    res.json(album);
  } catch (error) {
    console.error('获取相册信息失败:', error);
    res.status(500).json({ 
      error: '获取相册信息失败',
      code: 'GET_ALBUM_ERROR'
    });
  }
});

// 获取相册中的文件
app.get('/api/albums/:id/files', async (req, res) => {
  try {
    const idParam = req.params.id;
    let albumId: number | 'default';
    
    if (idParam === 'default') {
      albumId = 'default';
    } else {
      const parsedId = parseInt(idParam);
      if (isNaN(parsedId) || parsedId <= 0) {
        return res.status(400).json({ 
          error: '无效的相册ID',
          code: 'INVALID_ID'
        });
      }
      albumId = parsedId;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = req.query.sortBy as string || 'created_at';
    const sortOrder = req.query.sortOrder as string || 'DESC';

    const result = await getAlbumFiles(albumId, { page, limit, sortBy, sortOrder });
    res.json(result);
  } catch (error) {
    console.error('获取相册文件失败:', error);
    res.status(500).json({ 
      error: '获取相册文件失败',
      code: 'GET_ALBUM_FILES_ERROR'
    });
  }
});

// 更新相册信息
app.put('/api/albums/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ 
        error: '无效的相册ID',
        code: 'INVALID_ID'
      });
    }

    const { name, description, cover_image_id } = req.body;
    
    if (name !== undefined && (!name || name.trim() === '')) {
      return res.status(400).json({ 
        error: '相册名称不能为空',
        code: 'INVALID_NAME'
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (cover_image_id !== undefined) updateData.cover_image_id = cover_image_id;

    const result = await updateAlbum(id, updateData);
    
    if (!result) {
      return res.status(404).json({ 
        error: '相册不存在或无更新内容',
        code: 'ALBUM_NOT_FOUND_OR_NO_CHANGES'
      });
    }

    res.json({ 
      message: '相册更新成功',
      id
    });
  } catch (error) {
    console.error('更新相册失败:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '更新相册失败',
      code: 'UPDATE_ALBUM_ERROR'
    });
  }
});

// 删除相册
app.delete('/api/albums/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ 
        error: '无效的相册ID',
        code: 'INVALID_ID'
      });
    }

    const result = await deleteAlbum(id);
    
    if (!result) {
      return res.status(404).json({ 
        error: '相册不存在',
        code: 'ALBUM_NOT_FOUND'
      });
    }

    res.json({ 
      message: '相册删除成功，其中的文件已移动到默认相册',
      id
    });
  } catch (error) {
    console.error('删除相册失败:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '删除相册失败',
      code: 'DELETE_ALBUM_ERROR'
    });
  }
});

// 移动文件到相册
app.put('/api/files/:id/album', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId) || fileId <= 0) {
      return res.status(400).json({ 
        error: '无效的文件ID',
        code: 'INVALID_FILE_ID'
      });
    }

    const { album_id } = req.body;
    const albumId = album_id === null ? null : parseInt(album_id);

    if (albumId !== null && (isNaN(albumId) || albumId <= 0)) {
      return res.status(400).json({ 
        error: '无效的相册ID',
        code: 'INVALID_ALBUM_ID'
      });
    }

    const result = await moveFileToAlbum(fileId, albumId);
    
    if (!result) {
      return res.status(404).json({ 
        error: '文件不存在',
        code: 'FILE_NOT_FOUND'
      });
    }

    res.json({ 
      message: albumId ? '文件已移动到指定相册' : '文件已移出相册',
      file_id: fileId,
      album_id: albumId
    });
  } catch (error) {
    console.error('移动文件到相册失败:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '移动文件失败',
      code: 'MOVE_FILE_ERROR'
    });
  }
});

// 批量移动文件到相册
app.put('/api/files/batch/album', async (req, res) => {
  try {
    const { file_ids, album_id } = req.body;
    
    if (!Array.isArray(file_ids) || file_ids.length === 0) {
      return res.status(400).json({ 
        error: '请提供要移动的文件ID列表',
        code: 'INVALID_FILE_IDS'
      });
    }

    const albumId = album_id === null ? null : parseInt(album_id);

    if (albumId !== null && (isNaN(albumId) || albumId <= 0)) {
      return res.status(400).json({ 
        error: '无效的相册ID',
        code: 'INVALID_ALBUM_ID'
      });
    }

    const result = await moveFilesToAlbum(file_ids, albumId);
    
    if (!result) {
      return res.status(400).json({ 
        error: '没有文件被移动',
        code: 'NO_FILES_MOVED'
      });
    }

    res.json({ 
      message: albumId ? `成功将 ${file_ids.length} 个文件移动到指定相册` : `成功将 ${file_ids.length} 个文件移出相册`,
      file_count: file_ids.length,
      album_id: albumId
    });
  } catch (error) {
    console.error('批量移动文件到相册失败:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '批量移动文件失败',
      code: 'BATCH_MOVE_FILES_ERROR'
    });
  }
});

// 全局错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('全局错误:', err);

  // Multer 错误处理
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: '文件大小超过限制（最大100MB）',
        code: 'FILE_TOO_LARGE'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: '文件数量超过限制（最多10个）',
        code: 'TOO_MANY_FILES'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: '意外的文件字段',
        code: 'UNEXPECTED_FILE'
      });
    }
  }

  // 自定义错误
  if (err.message) {
    return res.status(400).json({ 
      error: err.message,
      code: 'CUSTOM_ERROR'
    });
  }

  // 默认错误
  res.status(500).json({ 
    error: '服务器内部错误',
    code: 'INTERNAL_ERROR'
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: '接口不存在',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，开始优雅关闭...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，开始优雅关闭...');
  process.exit(0);
});

// 启动服务器
app.listen(port, () => {
  console.log(`✅ 服务器运行在 http://localhost:${port}`);
  console.log(`📁 上传目录: ${uploadDir}`);
  console.log(`🚀 API 文档: http://localhost:${port}/api/health`);
}); 