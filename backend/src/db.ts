import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const DB_NAME = 'album';
const TABLE_NAME = 'files';

// 数据库连接配置
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '899022', // 请修改为您的数据库密码
  database: DB_NAME, // 添加数据库名称
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 初始化数据库和表
export async function initDB() {
  try {
    // 创建数据库
    await pool.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
    
    // 使用数据库
    await pool.query(`USE ${DB_NAME}`);
    
    // 创建文件表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        originalname VARCHAR(255) NOT NULL,
        mimetype VARCHAR(100) NOT NULL,
        size INT NOT NULL,
        url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 插入文件信息
export async function insertFileInfo(file: {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
}) {
  try {
    const [result] = await pool.query(
      `INSERT INTO ${TABLE_NAME} (filename, originalname, mimetype, size, url) VALUES (?, ?, ?, ?, ?)`,
      [file.filename, file.originalname, file.mimetype, file.size, file.url]
    );
    return result;
  } catch (error) {
    console.error('插入文件信息失败:', error);
    throw error;
  }
}

// 获取文件列表
export async function getFileList() {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM ${TABLE_NAME} 
      ORDER BY created_at DESC
    `);
    console.log('获取到的文件数量:', (rows as any[]).length);
    return rows;
  } catch (error) {
    console.error('获取文件列表失败:', error);
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
    return rows[0];
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
    
    if (!rows[0]) {
      throw new Error('文件不存在');
    }
    
    const file = rows[0] as any;
    
    // 删除物理文件
    const filePath = path.join(__dirname, '../uploads', file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // 删除数据库记录
    await pool.query(
      `DELETE FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );
    
    return true;
  } catch (error) {
    console.error('删除文件失败:', error);
    throw error;
  }
} 