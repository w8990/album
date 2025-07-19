import { pool, DB_NAME } from './connection';

const TABLE_NAME = 'files';
const ALBUMS_TABLE = 'albums';

// 初始化数据库和表
export async function initDB() {
  try {
    // 创建数据库
    await pool.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
    
    // 使用数据库
    await pool.query(`USE ${DB_NAME}`);
    
    // 创建用户表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        avatar_url VARCHAR(255),
        bio TEXT,
        location VARCHAR(100),
        website VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP NULL,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_created_at (created_at),
        INDEX idx_active (is_active)
      )
    `);
    
    // 创建相册表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${ALBUMS_TABLE} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cover_image_id INT,
        user_id INT NOT NULL,
        privacy_level ENUM('public', 'private', 'friends') DEFAULT 'public',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_user_id (user_id),
        INDEX idx_privacy (privacy_level),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // 创建文件表（增加用户ID字段）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        originalname VARCHAR(255) NOT NULL,
        mimetype VARCHAR(100) NOT NULL,
        size INT NOT NULL,
        url VARCHAR(255) NOT NULL,
        album_id INT DEFAULT NULL,
        user_id INT NOT NULL,
        caption TEXT,
        tags JSON,
        location VARCHAR(255),
        privacy_level ENUM('public', 'private', 'friends') DEFAULT 'public',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_mimetype (mimetype),
        INDEX idx_created_at (created_at),
        INDEX idx_originalname (originalname),
        INDEX idx_album_id (album_id),
        INDEX idx_user_id (user_id),
        INDEX idx_privacy (privacy_level),
        FOREIGN KEY (album_id) REFERENCES ${ALBUMS_TABLE}(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // 创建点赞表（修改为关联用户表）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_like (file_id, user_id),
        INDEX idx_file_id (file_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (file_id) REFERENCES ${TABLE_NAME}(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 创建收藏表（修改为关联用户表）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_favorite (file_id, user_id),
        INDEX idx_file_id (file_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (file_id) REFERENCES ${TABLE_NAME}(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 创建评论表（修改为关联用户表）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        parent_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_file_id (file_id),
        INDEX idx_user_id (user_id),
        INDEX idx_parent_id (parent_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (file_id) REFERENCES ${TABLE_NAME}(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
      )
    `);

    // 创建关注表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS follows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        follower_id INT NOT NULL,
        following_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_follow (follower_id, following_id),
        INDEX idx_follower (follower_id),
        INDEX idx_following (following_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
        CHECK (follower_id != following_id)
      )
    `);

    // 创建用户会话表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_token (session_token),
        INDEX idx_expires (expires_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 创建登录尝试记录表（防爆破保护）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        identifier VARCHAR(100) NOT NULL COMMENT '用户名或邮箱或IP地址',
        attempt_count INT DEFAULT 1,
        first_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_locked BOOLEAN DEFAULT FALSE,
        locked_until TIMESTAMP NULL,
        INDEX idx_identifier (identifier),
        INDEX idx_last_attempt (last_attempt_at),
        INDEX idx_locked (is_locked, locked_until)
      )
    `);
    
    // 检查并添加新字段（为了兼容现有数据）
    await checkAndAddColumns();
    
    // 创建默认用户
    await createDefaultUsers();
    
    // 创建默认相册
    await createDefaultAlbum();
    
    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 检查并添加新字段（为了兼容现有数据）
async function checkAndAddColumns() {
  // 检查files表是否需要添加user_id字段
  const [filesColumns] = await pool.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'user_id'
  `, [DB_NAME, TABLE_NAME]);
  
  if ((filesColumns as any[]).length === 0) {
    await pool.query(`ALTER TABLE ${TABLE_NAME} ADD COLUMN user_id INT NOT NULL DEFAULT 1`);
    await pool.query(`ALTER TABLE ${TABLE_NAME} ADD INDEX idx_user_id (user_id)`);
    await pool.query(`ALTER TABLE ${TABLE_NAME} ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
  }

  // 检查files表是否需要添加views字段
  const [viewsColumns] = await pool.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'views'
  `, [DB_NAME, TABLE_NAME]);
  
  if ((viewsColumns as any[]).length === 0) {
    await pool.query(`ALTER TABLE ${TABLE_NAME} ADD COLUMN views INT NOT NULL DEFAULT 0`);
    await pool.query(`ALTER TABLE ${TABLE_NAME} ADD INDEX idx_views (views)`);
  }

  // 检查albums表是否需要添加user_id字段
  const [albumsColumns] = await pool.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'user_id'
  `, [DB_NAME, ALBUMS_TABLE]);
  
  if ((albumsColumns as any[]).length === 0) {
    await pool.query(`ALTER TABLE ${ALBUMS_TABLE} ADD COLUMN user_id INT NOT NULL DEFAULT 1`);
    await pool.query(`ALTER TABLE ${ALBUMS_TABLE} ADD INDEX idx_user_id (user_id)`);
    await pool.query(`ALTER TABLE ${ALBUMS_TABLE} ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
  }
}

// 创建默认用户
async function createDefaultUsers() {
  // 创建默认管理员用户
  const [defaultUserResult] = await pool.query(`
    SELECT id FROM users WHERE username = 'admin'
  `);
  
  if ((defaultUserResult as any[]).length === 0) {
    await pool.query(`
      INSERT INTO users (username, email, password_hash, display_name, avatar_url, bio) 
      VALUES ('admin', 'admin@example.com', '$2b$10$default_hash', '管理员', '', '系统默认管理员账户')
    `);
  }

  // 创建默认普通用户
  const [guestUserResult] = await pool.query(`
    SELECT id FROM users WHERE username = 'guest'
  `);
  
  if ((guestUserResult as any[]).length === 0) {
    await pool.query(`
      INSERT INTO users (username, email, password_hash, display_name, avatar_url, bio) 
      VALUES ('guest', 'guest@example.com', '$2b$10$default_hash', '访客用户', '', '系统默认访客账户')
    `);
  }
}

// 创建默认相册
async function createDefaultAlbum() {
  const [defaultAlbumResult] = await pool.query(`
    SELECT id FROM ${ALBUMS_TABLE} WHERE name = '默认相册'
  `);
  
  if ((defaultAlbumResult as any[]).length === 0) {
    await pool.query(`
      INSERT INTO ${ALBUMS_TABLE} (name, description, user_id) 
      VALUES ('默认相册', '系统默认相册，用于存放未分类的文件', 1)
    `);
  }
}

export { TABLE_NAME, ALBUMS_TABLE }; 