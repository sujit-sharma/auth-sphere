import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermissions } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as userController from './user.controller';
import {
  assignRolesSchema,
  listUsersSchema,
  updateUserSchema,
  userIdParamSchema,
} from './user.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermissions('users:read'), validate(listUsersSchema), userController.listUsers);
router.get(
  '/:userId',
  requirePermissions('users:read'),
  validate(userIdParamSchema),
  userController.getUser,
);
router.patch(
  '/:userId',
  requirePermissions('users:write'),
  validate(updateUserSchema),
  userController.updateUser,
);
router.delete(
  '/:userId',
  requirePermissions('users:delete'),
  validate(userIdParamSchema),
  userController.deleteUser,
);
router.put(
  '/:userId/roles',
  requirePermissions('users:write'),
  validate(assignRolesSchema),
  userController.assignRoles,
);

export default router;