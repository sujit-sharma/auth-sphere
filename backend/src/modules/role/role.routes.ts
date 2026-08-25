import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermissions } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as roleController from './role.controller';
import {
  assignPermissionsSchema,
  createRoleSchema,
  roleIdParamSchema,
  updateRoleSchema,
} from './role.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermissions('roles:read'), roleController.listRoles);
router.get(
  '/:roleId',
  requirePermissions('roles:read'),
  validate(roleIdParamSchema),
  roleController.getRole,
);
router.post('/', requirePermissions('roles:write'), validate(createRoleSchema), roleController.createRole);
router.patch(
  '/:roleId',
  requirePermissions('roles:write'),
  validate(updateRoleSchema),
  roleController.updateRole,
);
router.delete(
  '/:roleId',
  requirePermissions('roles:delete'),
  validate(roleIdParamSchema),
  roleController.deleteRole,
);
router.put(
  '/:roleId/permissions',
  requirePermissions('roles:write'),
  validate(assignPermissionsSchema),
  roleController.assignPermissions,
);

export default router;