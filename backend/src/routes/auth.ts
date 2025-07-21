import express from 'express';
import bcrypt from 'bcryptjs';
import { 
  createUser, 
  getUserByUsername, 
  getUserByEmail, 
  getUserById,
  getUserWithPasswordById,
  updateUser, 
  updateLastLogin,
  createUserSession,
  deleteUserSession,
  getUserStats,
  createPasswordResetToken,
  validatePasswordResetToken,
  usePasswordResetToken,
  updateUserPassword
} from '../db';
import { authenticateToken } from '../middleware/auth';
import { generateSessionToken } from '../utils/session';
import { upload } from '../middleware/upload';

const router = express.Router();

// 用户注册
router.post('/register', async (req, res) => {
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

    // 创建用户
    const result = await createUser({
      username,
      email,
      password,
      display_name,
      bio,
      location,
      website
    });

    const userId = (result as any).insertId;

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
router.post('/login', async (req, res) => {
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
router.post('/logout', authenticateToken, async (req, res) => {
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
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
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
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
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

// 上传用户头像
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user!.id;
    
    if (!req.file) {
      return res.status(400).json({ 
        error: '没有上传头像文件',
        code: 'NO_FILE_UPLOADED'
      });
    }

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        error: '头像只支持 JPG、PNG、GIF、WebP 格式',
        code: 'INVALID_FILE_TYPE'
      });
    }

    // 检查文件大小 (2MB)
    if (req.file.size > 2 * 1024 * 1024) {
      return res.status(400).json({ 
        error: '头像文件大小不能超过 2MB',
        code: 'FILE_TOO_LARGE'
      });
    }

    // 构建头像URL
    const avatarUrl = `/uploads/${req.file.filename}`;

    // 更新用户头像
    const success = await updateUser(userId, {
      avatar_url: avatarUrl
    });

    if (!success) {
      return res.status(500).json({ 
        error: '更新头像失败',
        code: 'UPDATE_AVATAR_ERROR'
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
        },
        avatar_url: avatarUrl
      },
      message: '头像上传成功'
    });
  } catch (error) {
    console.error('上传头像失败:', error);
    res.status(500).json({ 
      error: '上传头像失败',
      code: 'UPLOAD_AVATAR_ERROR'
    });
  }
});

// 获取指定用户的统计数据
router.get('/users/:userId/stats', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ 
        error: '无效的用户ID',
        code: 'INVALID_USER_ID'
      });
    }

    // 检查用户是否存在
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    const stats = await getUserStats(userId);

    res.json({ 
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({ 
      error: '获取用户统计失败',
      code: 'GET_USER_STATS_ERROR'
    });
  }
});

// 忘记密码 - 发送重置链接
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: '邮箱为必填项',
        code: 'MISSING_EMAIL'
      });
    }

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: '邮箱格式不正确',
        code: 'INVALID_EMAIL'
      });
    }

    // 查找用户
    const user = await getUserByEmail(email);
    if (!user) {
      // 为了安全，即使用户不存在也返回成功消息
      return res.json({
        success: true,
        message: '如果该邮箱已注册，您将收到密码重置邮件'
      });
    }

    // 创建密码重置令牌
    const resetToken = await createPasswordResetToken(user.id);

    // 这里应该发送邮件，但由于没有邮件服务配置，我们暂时返回令牌用于测试
    // 在生产环境中，应该发送包含重置链接的邮件到用户邮箱
    console.log(`密码重置令牌 (测试用): ${resetToken}`);
    console.log(`重置链接: http://localhost:5173/reset-password?token=${resetToken}`);

    res.json({
      success: true,
      message: '如果该邮箱已注册，您将收到密码重置邮件',
      // 仅在开发环境中返回令牌
      ...(process.env.NODE_ENV === 'development' && { 
        resetToken, 
        resetUrl: `http://localhost:5173/reset-password?token=${resetToken}` 
      })
    });
  } catch (error) {
    console.error('发送密码重置邮件失败:', error);
    res.status(500).json({
      error: '发送密码重置邮件失败',
      code: 'FORGOT_PASSWORD_ERROR'
    });
  }
});

// 重置密码
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: '重置令牌和新密码为必填项',
        code: 'MISSING_FIELDS'
      });
    }

    // 验证密码长度
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: '密码长度至少6个字符',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // 验证重置令牌
    const resetTokenData = await validatePasswordResetToken(token);
    if (!resetTokenData) {
      return res.status(400).json({
        error: '重置令牌无效或已过期',
        code: 'INVALID_TOKEN'
      });
    }

    // 加密新密码
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 更新用户密码
    const success = await updateUserPassword(resetTokenData.user_id, passwordHash);
    if (!success) {
      return res.status(500).json({
        error: '密码更新失败',
        code: 'UPDATE_PASSWORD_ERROR'
      });
    }

    // 标记令牌为已使用
    await usePasswordResetToken(token);

    res.json({
      success: true,
      message: '密码重置成功，请使用新密码登录'
    });
  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({
      error: '重置密码失败',
      code: 'RESET_PASSWORD_ERROR'
    });
  }
});

// 修改密码
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: '当前密码和新密码为必填项',
        code: 'MISSING_FIELDS'
      });
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: '新密码长度至少6个字符',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // 获取用户信息（包含密码哈希）
    const user = await getUserWithPasswordById(userId);
    if (!user) {
      console.error('用户不存在:', userId);
      return res.status(404).json({
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }
    
    console.log('找到用户，准备验证密码:', user.username);

    // 验证当前密码
    console.log('验证当前密码...');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      console.log('当前密码验证失败');
      return res.status(400).json({
        error: '当前密码不正确',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }
    
    console.log('当前密码验证成功');

    // 检查新密码是否与当前密码相同
    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) {
      return res.status(400).json({
        error: '新密码不能与当前密码相同',
        code: 'SAME_PASSWORD'
      });
    }

    // 加密新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 更新密码
    console.log('准备更新密码到数据库...');
    const success = await updateUserPassword(userId, newPasswordHash);
    console.log('密码更新结果:', success);
    
    if (!success) {
      console.error('密码更新失败');
      return res.status(500).json({
        error: '密码更新失败',
        code: 'UPDATE_PASSWORD_ERROR'
      });
    }
    
    console.log('密码更新成功');

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      error: '修改密码失败',
      code: 'CHANGE_PASSWORD_ERROR'
    });
  }
});

export default router; 
 