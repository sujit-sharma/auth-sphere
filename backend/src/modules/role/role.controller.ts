import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as roleService from './role.service';

export const listRoles = asyncHandler(async (_req: Request, res: Response) => {
  const roles = await roleService.listRoles();
  res.status(200).json({ success: true, data: { roles } });
});

export const getRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await roleService.getRoleById(req.params.roleId as string);
  res.status(200).json({ success: true, data: { role } });
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await roleService.createRole(req.body);
  res.status(201).json({ success: true, data: { role } });
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await roleService.updateRole(req.params.roleId as string, req.body);
  res.status(200).json({ success: true, data: { role } });
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  await roleService.deleteRole(req.params.roleId as string);
  res.status(204).send();
});

export const assignPermissions = asyncHandler(async (req: Request, res: Response) => {
  const role = await roleService.assignPermissions(
    req.params.roleId as string,
    req.body.permissionIds,
  );
  res.status(200).json({ success: true, data: { role } });
});