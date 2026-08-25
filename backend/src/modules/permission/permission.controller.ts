import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as permissionService from './permission.service';

export const listPermissions = asyncHandler(async (_req: Request, res: Response) => {
  const permissions = await permissionService.listPermissions();
  res.status(200).json({ success: true, data: { permissions } });
});

export const createPermission = asyncHandler(async (req: Request, res: Response) => {
  const permission = await permissionService.createPermission(req.body);
  res.status(201).json({ success: true, data: { permission } });
});

export const deletePermission = asyncHandler(async (req: Request, res: Response) => {
  await permissionService.deletePermission(req.params.permissionId as string);
  res.status(204).send();
});