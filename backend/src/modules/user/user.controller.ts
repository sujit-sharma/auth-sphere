import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as userService from './user.service';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, search } = req.query as unknown as {
    page: number;
    pageSize: number;
    search?: string;
  };
  const result = await userService.listUsers({ page, pageSize, search });
  res.status(200).json({ success: true, data: result });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.userId as string);
  res.status(200).json({ success: true, data: { user } });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateUser(req.params.userId as string, req.body);
  res.status(200).json({ success: true, data: { user } });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await userService.deleteUser(req.params.userId as string);
  res.status(204).send();
});

export const assignRoles = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.assignRoles(req.params.userId as string, req.body.roleIds);
  res.status(200).json({ success: true, data: { user } });
});