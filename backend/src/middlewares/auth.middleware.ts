import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/jwt';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(ApiError.unauthorized('Missing or malformed Authorization header'));
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized('Access token expired'));
      return;
    }
    next(ApiError.unauthorized('Invalid access token'));
  }
};