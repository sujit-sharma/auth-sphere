import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import roleRoutes from '../modules/role/role.routes';
import permissionRoutes from '../modules/permission/permission.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok' } });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);

export default router;