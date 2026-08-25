import { z } from 'zod';

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ userId: z.string().uuid() }),
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const assignRolesSchema = z.object({
  params: z.object({ userId: z.string().uuid() }),
  body: z.object({
    roleIds: z.array(z.string().uuid()).min(1),
  }),
});