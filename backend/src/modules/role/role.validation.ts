import { z } from 'zod';

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50),
    description: z.string().max(255).optional(),
  }),
});

export const roleIdParamSchema = z.object({
  params: z.object({ roleId: z.string().uuid() }),
});

export const updateRoleSchema = z.object({
  params: z.object({ roleId: z.string().uuid() }),
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    description: z.string().max(255).optional(),
  }),
});

export const assignPermissionsSchema = z.object({
  params: z.object({ roleId: z.string().uuid() }),
  body: z.object({
    permissionIds: z.array(z.string().uuid()).min(1),
  }),
});