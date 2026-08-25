import { z } from 'zod';

export const createPermissionSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    resource: z.string().min(1).max(50),
    action: z.string().min(1).max(50),
    description: z.string().max(255).optional(),
  }),
});