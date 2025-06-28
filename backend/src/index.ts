import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
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
  moveFilesToAlbum,
  // 社交功能
  getFileListWithSocial,
  toggleLike,
  toggleFavorite,
  getFileComments,
  addComment,
  deleteComment,
  getFileWithSocialInfo,
  // 用户系统
  createUser,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  updateUser,
  updateLastLogin,
  createUserSession,
  validateUserSession,
  deleteUserSession,
  cleanExpiredSessions,
  followUser,
  unfollowUser,
  isFollowing,
  getUserFollowing,
  getUserFollowers,
  getUserStats,
  getUserPosts,
  getUserFavorites,
  insertFileInfoWithUser,
  toggleLikeWithUserId,
  toggleFavoriteWithUserId,
  addCommentWithUserId,
  deleteCommentWithUserId
} from './db';

const app = express();
const port = process.env.PORT || 3000;

// 启用 CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // 为了兼容一些旧版浏览器
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

// ================== 社交功能 API ==================

// 获取带社交统计的文件列表
app.get('/api/social/files', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sortBy = req.query.sortBy as string || 'created_at';
    const sortOrder = req.query.sortOrder as string || 'DESC';
    const albumIdParam = req.query.album_id as string;
    const userId = req.query.user_id as string || 'anonymous';

    // 处理相册ID参数
    let albumId: number | 'default' | null | undefined = undefined;
    if (albumIdParam !== undefined) {
      if (albumIdParam === '' || albumIdParam === 'null') {
        albumId = null;
      } else if (albumIdParam === 'default') {
        albumId = 'default';
      } else {
        const parsedAlbumId = parseInt(albumIdParam);
        if (!isNaN(parsedAlbumId)) {
          albumId = parsedAlbumId;
        }
      }
    }

    const files = await getFileListWithSocial({
      page,
      limit,
      sortBy,
      sortOrder,
      albumId,
      userId
    });

    res.json(files);
  } catch (error) {
    console.error('获取社交文件列表失败:', error);
    res.status(500).json({ 
      error: '获取社交文件列表失败',
      code: 'SOCIAL_LIST_ERROR'
    });
  }
});

// 获取单个文件的社交信息
app.get('/api/social/files/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.query.user_id as string || 'anonymous';

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ 
        error: '无效的文件ID',
        code: 'INVALID_ID'
      });
    }

    const fileInfo = await getFileWithSocialInfo(id, userId);
    if (!fileInfo) {
      return res.status(404).json({ 
        error: '文件不存在',
        code: 'FILE_NOT_FOUND'
      });
    }

    res.json(fileInfo);
  } catch (error) {
    console.error('获取文件社交信息失败:', error);
    res.status(500).json({ 
      error: '获取文件社交信息失败',
      code: 'SOCIAL_INFO_ERROR'
    });
  }
});

// 点赞/取消点赞
app.post('/api/social/files/:id/like', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const { user_id = 'anonymous', user_name = '匿名用户' } = req.body;

    if (isNaN(fileId) || fileId <= 0) {
      return res.status(400).json({ 
        error: '无效的文件ID',
        code: 'INVALID_ID'
      });
    }

    const result = await toggleLike(fileId, user_id, user_name);
    
    res.json({ 
      success: true,
      data: result,
      message: result.isLiked ? '点赞成功' : '取消点赞成功'
    });
  } catch (error) {
    console.error('切换点赞状态失败:', error);
    res.status(500).json({ 
      error: '操作失败',
      code: 'TOGGLE_LIKE_ERROR'
    });
  }
});

// 收藏/取消收藏
app.post('/api/social/files/:id/favorite', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const { user_id = 'anonymous', user_name = '匿名用户' } = req.body;

    if (isNaN(fileId) || fileId <= 0) {
      return res.status(400).json({ 
        error: '无效的文件ID',
        code: 'INVALID_ID'
      });
    }

    const result = await toggleFavorite(fileId, user_id, user_name);
    
    res.json({ 
      success: true,
      data: result,
      message: result.isFavorited ? '收藏成功' : '取消收藏成功'
    });
  } catch (error) {
    console.error('切换收藏状态失败:', error);
    res.status(500).json({ 
      error: '操作失败',
      code: 'TOGGLE_FAVORITE_ERROR'
    });
  }
});

// 获取文件评论列表
app.get('/api/social/files/:id/comments', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (isNaN(fileId) || fileId <= 0) {
      return res.status(400).json({ 
        error: '无效的文件ID',
        code: 'INVALID_ID'
      });
    }

    const comments = await getFileComments(fileId, { page, limit });
    
    res.json(comments);
  } catch (error) {
    console.error('获取评论列表失败:', error);
    res.status(500).json({ 
      error: '获取评论列表失败',
      code: 'GET_COMMENTS_ERROR'
    });
  }
});

// 添加评论
app.post('/api/social/files/:id/comments', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const { content, user_id = 'anonymous', user_name = '匿名用户', parent_id } = req.body;

    if (isNaN(fileId) || fileId <= 0) {
      return res.status(400).json({ 
        error: '无效的文件ID',
        code: 'INVALID_ID'
      });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ 
        error: '评论内容不能为空',
        code: 'EMPTY_CONTENT'
      });
    }

    const comment = await addComment(fileId, user_id, user_name, content.trim(), parent_id);
    
    res.json({ 
      success: true,
      data: comment,
      message: '评论成功'
    });
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({ 
      error: '添加评论失败',
      code: 'ADD_COMMENT_ERROR'
    });
  }
});

// 删除评论
app.delete('/api/social/comments/:id', async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const { user_id = 'anonymous' } = req.body;

    if (isNaN(commentId) || commentId <= 0) {
      return res.status(400).json({ 
        error: '无效的评论ID',
        code: 'INVALID_ID'
      });
    }

    const result = await deleteComment(commentId, user_id);
    
    if (!result) {
      return res.status(404).json({ 
        error: '评论不存在',
        code: 'COMMENT_NOT_FOUND'
      });
    }

    res.json({ 
      success: true,
      message: '删除评论成功'
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '删除评论失败',
      code: 'DELETE_COMMENT_ERROR'
    });
  }
});

// ===================== 身份验证中间件 =====================

// 生成会话令牌
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// 身份验证中间件
async function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-session-token'] as string;
    
    if (!token) {
      return res.status(401).json({ 
        error: '未提供认证令牌',
        code: 'NO_TOKEN'
      });
    }

    const session = await validateUserSession(token);
    
    if (!session) {
      return res.status(401).json({ 
        error: '无效的认证令牌',
        code: 'INVALID_TOKEN'
      });
    }

    // 将用户信息添加到请求对象
    (req as any).user = {
      id: session.user_id,
      username: session.username,
      display_name: session.display_name,
      avatar_url: session.avatar_url
    };

    next();
  } catch (error) {
    console.error('身份验证失败:', error);
    res.status(401).json({ 
      error: '身份验证失败',
      code: 'AUTH_ERROR'
    });
  }
}

// 可选身份验证中间件（不强制要求登录）
async function optionalAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-session-token'] as string;
    
    if (token) {
      const session = await validateUserSession(token);
      if (session) {
        (req as any).user = {
          id: session.user_id,
          username: session.username,
          display_name: session.display_name,
          avatar_url: session.avatar_url
        };
      }
    }

    next();
  } catch (error) {
    console.error('可选身份验证失败:', error);
    next(); // 继续执行，不阻止请求
  }
}

// ===================== 用户系统API =====================

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, display_name, bio, location, website } = req.body;

    // 验证必填字段
    if (!username || !email || !password || !display_name) {
      return res.status(400).json({ 
        error: '用户名、邮箱、密码和显示名称为必填项',
        code: 'MISSING_FIELDS'
      });
    }

    // 验证用户名格式
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ 
        error: '用户名只能包含字母、数字和下划线，长度3-20个字符',
        code: 'INVALID_USERNAME'
      });
    }

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        error: '邮箱格式不正确',
        code: 'INVALID_EMAIL'
      });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({ 
        error: '密码长度至少6个字符',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await getUserByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ 
        error: '用户名已存在',
        code: 'USERNAME_EXISTS'
      });
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await getUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ 
        error: '邮箱已被注册',
        code: 'EMAIL_EXISTS'
      });
    }

    // 哈希密码
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const userId = await createUser({
      username,
      email,
      password_hash,
      display_name,
      bio,
      location,
      website
    });

    // 创建会话
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天后过期
    await createUserSession(userId, sessionToken, expiresAt);

    // 更新最后登录时间
    await updateLastLogin(userId);

    // 获取完整用户信息
    const user = await getUserById(userId);

    res.json({ 
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          bio: user.bio,
          location: user.location,
          website: user.website,
          created_at: user.created_at
        },
        token: sessionToken,
        expires_at: expiresAt
      },
      message: '注册成功'
    });
  } catch (error) {
    console.error('用户注册失败:', error);
    res.status(500).json({ 
      error: '注册失败',
      code: 'REGISTER_ERROR'
    });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { login, password } = req.body; // login 可以是用户名或邮箱

    if (!login || !password) {
      return res.status(400).json({ 
        error: '用户名/邮箱和密码为必填项',
        code: 'MISSING_FIELDS'
      });
    }

    // 尝试通过用户名或邮箱查找用户
    let user = await getUserByUsername(login);
    if (!user && login.includes('@')) {
      user = await getUserByEmail(login);
    }

    if (!user) {
      return res.status(400).json({ 
        error: '用户名或密码错误',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        error: '用户名或密码错误',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // 创建会话
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天后过期
    await createUserSession(user.id, sessionToken, expiresAt);

    // 更新最后登录时间
    await updateLastLogin(user.id);

    res.json({ 
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          bio: user.bio,
          location: user.location,
          website: user.website,
          created_at: user.created_at
        },
        token: sessionToken,
        expires_at: expiresAt
      },
      message: '登录成功'
    });
  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({ 
      error: '登录失败',
      code: 'LOGIN_ERROR'
    });
  }
});

// 用户登出
app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-session-token'] as string;
    
    if (token) {
      await deleteUserSession(token);
    }

    res.json({ 
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('用户登出失败:', error);
    res.status(500).json({ 
      error: '登出失败',
      code: 'LOGOUT_ERROR'
    });
  }
});

// 获取当前用户信息
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = await getUserById(userId);
    const stats = await getUserStats(userId);

    if (!user) {
      return res.status(404).json({ 
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({ 
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          bio: user.bio,
          location: user.location,
          website: user.website,
          created_at: user.created_at,
          last_login_at: user.last_login_at
        },
        stats
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ 
      error: '获取用户信息失败',
      code: 'GET_USER_ERROR'
    });
  }
});

// 更新用户信息
app.put('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { display_name, bio, location, website, email } = req.body;

    // 如果要更新邮箱，检查是否已被其他用户使用
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ 
          error: '邮箱格式不正确',
          code: 'INVALID_EMAIL'
        });
      }

      const existingUser = await getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ 
          error: '邮箱已被其他用户使用',
          code: 'EMAIL_EXISTS'
        });
      }
    }

    const success = await updateUser(userId, {
      display_name,
      bio,
      location,
      website,
      email
    });

    if (!success) {
      return res.status(400).json({ 
        error: '没有可更新的字段',
        code: 'NO_FIELDS_TO_UPDATE'
      });
    }

    // 获取更新后的用户信息
    const user = await getUserById(userId);

    res.json({ 
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          bio: user.bio,
          location: user.location,
          website: user.website
        }
      },
      message: '用户信息更新成功'
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ 
      error: '更新用户信息失败',
      code: 'UPDATE_USER_ERROR'
    });
  }
});

// 获取用户详情（公开信息）
app.get('/api/users/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const viewerId = (req as any).user?.id;

    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ 
        error: '无效的用户ID',
        code: 'INVALID_USER_ID'
      });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    const stats = await getUserStats(userId);
    
    // 检查关注状态（如果访问者已登录）
    let isCurrentUserFollowing = false;
    if (viewerId && viewerId !== userId) {
      isCurrentUserFollowing = await isFollowing(viewerId, userId);
    }

    res.json({ 
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          bio: user.bio,
          location: user.location,
          website: user.website,
          created_at: user.created_at
        },
        stats,
        isFollowing: isCurrentUserFollowing,
        isOwnProfile: viewerId === userId
      }
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({ 
      error: '获取用户详情失败',
      code: 'GET_USER_PROFILE_ERROR'
    });
  }
});

// 获取用户动态列表
app.get('/api/users/:id/posts', optionalAuthMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const viewerId = (req as any).user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ 
        error: '无效的用户ID',
        code: 'INVALID_USER_ID'
      });
    }

    const result = await getUserPosts(userId, { page, limit, viewerId });

    res.json({ 
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取用户动态失败:', error);
    res.status(500).json({ 
      error: '获取用户动态失败',
      code: 'GET_USER_POSTS_ERROR'
    });
  }
});

// 获取用户收藏列表
app.get('/api/users/:id/favorites', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUserId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ 
        error: '无效的用户ID',
        code: 'INVALID_USER_ID'
      });
    }

    // 只允许查看自己的收藏
    if (userId !== currentUserId) {
      return res.status(403).json({ 
        error: '无权查看他人收藏',
        code: 'FORBIDDEN'
      });
    }

    const result = await getUserFavorites(userId, { page, limit });

    res.json({ 
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取用户收藏失败:', error);
    res.status(500).json({ 
      error: '获取用户收藏失败',
      code: 'GET_USER_FAVORITES_ERROR'
    });
  }
});

// 关注用户
app.post('/api/users/:id/follow', authMiddleware, async (req, res) => {
  try {
    const followingId = parseInt(req.params.id);
    const followerId = (req as any).user.id;

    if (isNaN(followingId) || followingId <= 0) {
      return res.status(400).json({ 
        error: '无效的用户ID',
        code: 'INVALID_USER_ID'
      });
    }

    if (followingId === followerId) {
      return res.status(400).json({ 
        error: '不能关注自己',
        code: 'CANNOT_FOLLOW_SELF'
      });
    }

    // 检查目标用户是否存在
    const targetUser = await getUserById(followingId);
    if (!targetUser) {
      return res.status(404).json({ 
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    const success = await followUser(followerId, followingId);
    
    res.json({ 
      success: true,
      data: { isFollowing: success },
      message: success ? '关注成功' : '已经关注过该用户'
    });
  } catch (error) {
    console.error('关注用户失败:', error);
    res.status(500).json({ 
      error: '关注用户失败',
      code: 'FOLLOW_USER_ERROR'
    });
  }
});

// 取消关注用户
app.delete('/api/users/:id/follow', authMiddleware, async (req, res) => {
  try {
    const followingId = parseInt(req.params.id);
    const followerId = (req as any).user.id;

    if (isNaN(followingId) || followingId <= 0) {
      return res.status(400).json({ 
        error: '无效的用户ID',
        code: 'INVALID_USER_ID'
      });
    }

    const success = await unfollowUser(followerId, followingId);
    
    res.json({ 
      success: true,
      data: { isFollowing: false },
      message: success ? '取消关注成功' : '您未关注该用户'
    });
  } catch (error) {
    console.error('取消关注失败:', error);
    res.status(500).json({ 
      error: '取消关注失败',
      code: 'UNFOLLOW_USER_ERROR'
    });
  }
});

// 获取用户关注列表
app.get('/api/users/:id/following', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ 
        error: '无效的用户ID',
        code: 'INVALID_USER_ID'
      });
    }

    const result = await getUserFollowing(userId, { page, limit });

    res.json({ 
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取关注列表失败:', error);
    res.status(500).json({ 
      error: '获取关注列表失败',
      code: 'GET_FOLLOWING_ERROR'
    });
  }
});

// 获取用户粉丝列表
app.get('/api/users/:id/followers', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ 
        error: '无效的用户ID',
        code: 'INVALID_USER_ID'
      });
    }

    const result = await getUserFollowers(userId, { page, limit });

    res.json({ 
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取粉丝列表失败:', error);
    res.status(500).json({ 
      error: '获取粉丝列表失败',
      code: 'GET_FOLLOWERS_ERROR'
    });
  }
});

// ===================== 更新后的社交功能API（使用真实用户ID） =====================

// 修改社交动态列表API以支持用户系统
app.get('/api/social/files', optionalAuthMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const userId = (req as any).user?.id; // 可选的用户ID

    console.log('请求动态列表参数:', { page, limit, userId })

    const files = await getFileListWithSocial({
      page,
      limit,
      userId: userId?.toString() // 转换为字符串以兼容现有方法
    });

    console.log('响应数据:', files)
    res.json(files);
  } catch (error) {
    console.error('获取动态列表失败:', error);
    res.status(500).json({ 
      error: '获取动态列表失败',
      code: 'SOCIAL_LIST_ERROR'
    });
  }
});

// 修改点赞API以使用真实用户ID
app.post('/api/social/files/:id/like', authMiddleware, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    if (isNaN(fileId) || fileId <= 0) {
      return res.status(400).json({ 
        error: '无效的文件ID',
        code: 'INVALID_ID'
      });
    }

    const result = await toggleLikeWithUserId(fileId, userId);
    
    res.json({ 
      success: true,
      data: result,
      message: result.isLiked ? '点赞成功' : '取消点赞成功'
    });
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({ 
      error: '操作失败',
      code: 'TOGGLE_LIKE_ERROR'
    });
  }
});

// 修改收藏API以使用真实用户ID
app.post('/api/social/files/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    if (isNaN(fileId) || fileId <= 0) {
      return res.status(400).json({ 
        error: '无效的文件ID',
        code: 'INVALID_ID'
      });
    }

    const result = await toggleFavoriteWithUserId(fileId, userId);
    
    res.json({ 
      success: true,
      data: result,
      message: result.isFavorited ? '收藏成功' : '取消收藏成功'
    });
  } catch (error) {
    console.error('收藏操作失败:', error);
    res.status(500).json({ 
      error: '操作失败',
      code: 'TOGGLE_FAVORITE_ERROR'
    });
  }
});

// 修改添加评论API以使用真实用户ID
app.post('/api/social/files/:id/comments', authMiddleware, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const userId = (req as any).user.id;
    const { content, parent_id } = req.body;

    if (isNaN(fileId) || fileId <= 0) {
      return res.status(400).json({ 
        error: '无效的文件ID',
        code: 'INVALID_ID'
      });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ 
        error: '评论内容不能为空',
        code: 'EMPTY_CONTENT'
      });
    }

    const comment = await addCommentWithUserId(fileId, userId, content.trim(), parent_id);
    
    res.json({ 
      success: true,
      data: comment,
      message: '评论成功'
    });
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({ 
      error: '添加评论失败',
      code: 'ADD_COMMENT_ERROR'
    });
  }
});

// 修改删除评论API以使用真实用户ID
app.delete('/api/social/comments/:id', authMiddleware, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    if (isNaN(commentId) || commentId <= 0) {
      return res.status(400).json({ 
        error: '无效的评论ID',
        code: 'INVALID_ID'
      });
    }

    const result = await deleteCommentWithUserId(commentId, userId);
    
    if (!result) {
      return res.status(404).json({ 
        error: '评论不存在',
        code: 'COMMENT_NOT_FOUND'
      });
    }

    res.json({ 
      success: true,
      message: '删除评论成功'
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '删除评论失败',
      code: 'DELETE_COMMENT_ERROR'
    });
  }
});

// 修改上传API以关联用户
app.post('/api/upload', authMiddleware, upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const albumId = req.body.album_id ? parseInt(req.body.album_id) : undefined;
    const userId = (req as any).user.id;
    const { caption, tags, location, privacy_level } = req.body;
    
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
          album_id: albumId,
          user_id: userId,
          caption: caption || '',
          tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
          location: location || '',
          privacy_level: privacy_level || 'public'
        };

        // 保存文件信息到数据库
        const result = await insertFileInfoWithUser(fileInfo);
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
    
    // 清理已上传的文件
    const files = req.files as Express.Multer.File[];
    if (files) {
      files.forEach(file => {
        const filePath = path.join(uploadDir, file.filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (cleanupError) {
            console.error('清理文件失败:', cleanupError);
          }
        }
      });
    }

    res.status(500).json({ 
      error: error instanceof Error ? error.message : '上传失败',
      code: 'UPLOAD_ERROR'
    });
  }
});

// 定期清理过期会话
setInterval(async () => {
  try {
    const cleaned = await cleanExpiredSessions();
    if (cleaned > 0) {
      console.log(`清理了 ${cleaned} 个过期会话`);
    }
  } catch (error) {
    console.error('清理过期会话失败:', error);
  }
}, 60 * 60 * 1000); // 每小时执行一次

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