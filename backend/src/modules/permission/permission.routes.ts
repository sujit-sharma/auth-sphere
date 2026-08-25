import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermissions } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as permissionController from './permission.controller';
import { createPermissionSchema } from './permission.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermissions('roles:read'), permissionController.listPermissions);
router.post(
  '/',
  requirePermissions('roles:write'),
  validate(createPermissionSchema),
  permissionController.createPermission,
);
router.delete('/:permissionId', requirePermissions('roles:write'), permissionController.deletePermission);

export default router;