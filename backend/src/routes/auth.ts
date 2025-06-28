import express from 'express';
import bcrypt from 'bcryptjs';
import { 
  createUser, 
  getUserByUsername, 
  getUserByEmail, 
  getUserById, 
  updateUser, 
  updateLastLogin,
  createUserSession,
  deleteUserSession,
  getUserStats
} from '../db';
import { authenticateToken } from '../middleware/auth';
import { generateSessionToken } from '../utils/session';

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

export default router; 
 