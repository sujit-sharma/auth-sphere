import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export const hashPassword = (plainText: string): Promise<string> => {
  return bcrypt.hash(plainText, env.BCRYPT_SALT_ROUNDS);
};

export const verifyPassword = (plainText: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(plainText, hash);
};