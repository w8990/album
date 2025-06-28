import { Request, Response, NextFunction } from 'express';
import { validateUserSession } from '../db';

// 必须认证的中间件
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: '缺少访问令牌',
        code: 'NO_TOKEN'
      });
    }

    const sessionInfo = await validateUserSession(token);
    if (!sessionInfo) {
      return res.status(401).json({ 
        success: false, 
        error: '无效的访问令牌',
        code: 'INVALID_TOKEN'
      });
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: sessionInfo.user_id,
      username: sessionInfo.username,
      display_name: sessionInfo.display_name,
      avatar_url: sessionInfo.avatar_url
    };

    next();
  } catch (error) {
    console.error('认证失败:', error);
    res.status(403).json({ 
      success: false, 
      error: '认证失败',
      code: 'AUTH_FAILED'
    });
  }
}

// 可选认证的中间件（不强制要求登录）
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const sessionInfo = await validateUserSession(token);
      if (sessionInfo) {
        // 如果有有效令牌，添加用户信息
        req.user = {
          id: sessionInfo.user_id,
          username: sessionInfo.username,
          display_name: sessionInfo.display_name,
          avatar_url: sessionInfo.avatar_url
        };
      }
    }

    // 无论是否有令牌都继续执行
    next();
  } catch (error) {
    console.error('可选认证失败:', error);
    // 可选认证失败不阻止请求，继续执行
    next();
  }
} 
 