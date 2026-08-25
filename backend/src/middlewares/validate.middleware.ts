import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

export const validate = (schema: AnyZodObject) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body ?? req.body;
      req.params = parsed.params ?? req.params;
      Object.assign(req.query, parsed.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(ApiError.badRequest('Validation failed', error.flatten().fieldErrors));
        return;
      }
      next(error);
    }
  };
};