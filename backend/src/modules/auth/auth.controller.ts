import { Request, Response } from 'express';
import { env, isProduction } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { asyncHandler } from '../../utils/asyncHandler';
import * as authService from './auth.service';
import { RequestMeta } from './auth.types';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
};

const getRequestMeta = (req: Request): RequestMeta => ({
  userAgent: req.headers['user-agent'],
  ipAddress: req.ip,
});

const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  res.status(201).json({ success: true, data: { user } });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, tokens } = await authService.login(req.body, getRequestMeta(req));
  setRefreshCookie(res, tokens.refreshToken);
  res.status(200).json({ success: true, data: { user, accessToken: tokens.accessToken } });
});

export const refreshTokens = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];
  if (!refreshToken) {
    throw ApiError.unauthorized('Missing refresh token');
  }

  const { user, tokens } = await authService.refresh(refreshToken, getRequestMeta(req));
  setRefreshCookie(res, tokens.refreshToken);
  res.status(200).json({ success: true, data: { user, accessToken: tokens.accessToken } });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME];
  if (refreshToken) {
    await authService.logout(refreshToken);
  }
  clearRefreshCookie(res);
  res.status(204).send();
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  await authService.logoutAll(req.user!.sub);
  clearRefreshCookie(res);
  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getAuthenticatedUser(req.user!.sub);
  res.status(200).json({ success: true, data: { user } });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.sub, currentPassword, newPassword);
  clearRefreshCookie(res);
  res.status(204).send();
});