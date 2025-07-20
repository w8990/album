import { pool } from './connection';
import crypto from 'crypto';

export interface PasswordResetToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  is_used: boolean;
  created_at: Date;
  used_at?: Date;
}

// 生成密码重置令牌
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// 创建密码重置令牌
export async function createPasswordResetToken(userId: number): Promise<string> {
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期

  // 先清除该用户的旧令牌
  await pool.query(
    'DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at < NOW()',
    [userId]
  );

  // 创建新令牌
  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );

  return token;
}

// 验证密码重置令牌
export async function validatePasswordResetToken(token: string): Promise<PasswordResetToken | null> {
  const [rows] = await pool.query(
    'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() AND is_used = FALSE',
    [token]
  );

  const tokens = rows as PasswordResetToken[];
  return tokens.length > 0 ? tokens[0] : null;
}

// 使用密码重置令牌
export async function usePasswordResetToken(token: string): Promise<boolean> {
  const [result] = await pool.query(
    'UPDATE password_reset_tokens SET is_used = TRUE, used_at = NOW() WHERE token = ? AND expires_at > NOW() AND is_used = FALSE',
    [token]
  );

  return (result as any).affectedRows > 0;
}

// 清理过期的密码重置令牌
export async function cleanExpiredPasswordResetTokens(): Promise<void> {
  await pool.query(
    'DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR is_used = TRUE'
  );
}

// 更新用户密码
export async function updateUserPassword(userId: number, newPasswordHash: string): Promise<boolean> {
  const [result] = await pool.query(
    'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [newPasswordHash, userId]
  );

  return (result as any).affectedRows > 0;
}