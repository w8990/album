import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import { initDB, cleanExpiredSessions } from './db';
import { uploadDir } from './middleware/upload';

// 导入路由
import authRoutes from './routes/auth';
import filesRoutes from './routes/files';
import albumsRoutes from './routes/albums';
import socialRoutes from './routes/social';

const app = express();
const port = process.env.PORT || 3000;

// 启用 CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// 请求体大小限制
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(uploadDir, {
  maxAge: '1d',
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
    version: '2.0.0'
  });
});

// 挂载路由
app.use('/api/auth', authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/albums', albumsRoutes);
app.use('/api/social', socialRoutes);

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

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，开始优雅关闭...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信号，开始优雅关闭...');
  process.exit(0);
});

// 初始化数据库并启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await initDB();
    console.log('✅ 数据库初始化成功');

    // 启动服务器
    app.listen(port, () => {
      console.log(`✅ 服务器运行在 http://localhost:${port}`);
      console.log(`📁 上传目录: ${uploadDir}`);
      console.log(`🚀 API 文档: http://localhost:${port}/api/health`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer(); 