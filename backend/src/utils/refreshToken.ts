import { createHash, randomBytes } from 'crypto';
import ms from 'ms';
import { env } from '../config/env';

export const generateRefreshTokenValue = (): string => randomBytes(64).toString('hex');

export const hashRefreshToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export const getRefreshTokenExpiry = (): Date => {
  const durationMs = ms(env.JWT_REFRESH_EXPIRES_IN);
  return new Date(Date.now() + durationMs);
};