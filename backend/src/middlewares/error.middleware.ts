import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger';
import { isProduction } from '../config/env';
import { ApiError } from '../utils/ApiError';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof ApiError) {
    if (error.statusCode >= 500) {
      logger.error({ err: error, path: req.originalUrl }, error.message);
    }
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      details: error.details,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    res.status(409).json({
      success: false,
      message: 'A record with the given unique field already exists',
    });
    return;
  }

  logger.error({ err: error, path: req.originalUrl }, 'Unhandled error');
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    stack: isProduction ? undefined : (error as Error)?.stack,
  });
};