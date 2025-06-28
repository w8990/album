import crypto from 'crypto';

// 生成会话令牌
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
} 