import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      next(ApiError.forbidden('Insufficient role'));
      return;
    }
    next();
  };
};

export const requirePermissions = (...allowedPermissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    const hasPermission = allowedPermissions.every((permission) =>
      req.user!.permissions.includes(permission),
    );
    if (!hasPermission) {
      next(ApiError.forbidden('Insufficient permissions'));
      return;
    }
    next();
  };
};