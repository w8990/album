import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { initDB, insertFileInfo } from './db';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 设置上传目录
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 配置 Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// 启动时初始化数据库
initDB().then(() => {
  console.log('数据库已初始化');
});

// 文件上传接口
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: '未检测到文件' });
    return;
  }
  const fileInfo = {
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
  };
  try {
    await insertFileInfo(fileInfo);
  } catch (e) {
    res.status(500).json({ message: '文件信息写入数据库失败', error: e });
    return;
  }
  res.json(fileInfo);
});

// 静态资源服务
app.use('/uploads', express.static(uploadDir));

app.listen(PORT, () => {
  console.log(`服务已启动: http://localhost:${PORT}`);
}); 