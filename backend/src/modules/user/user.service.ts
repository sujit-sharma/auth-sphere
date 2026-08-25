import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';

const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isActive: true,
  isEmailVerified: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    select: {
      role: { select: { id: true, name: true } },
    },
  },
} as const;

export const listUsers = async (params: { page: number; pageSize: number; search?: string }) => {
  const where = params.search
    ? {
        OR: [
          { email: { contains: params.search } },
          { firstName: { contains: params.search } },
          { lastName: { contains: params.search } },
        ],
      }
    : undefined;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: publicUserSelect,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { total, page: params.page, pageSize: params.pageSize, users };
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
};

export const updateUser = async (
  userId: string,
  data: { firstName?: string; lastName?: string; isActive?: boolean },
) => {
  await getUserById(userId);
  return prisma.user.update({ where: { id: userId }, data, select: publicUserSelect });
};

export const deleteUser = async (userId: string) => {
  await getUserById(userId);
  await prisma.user.delete({ where: { id: userId } });
};

export const assignRoles = async (userId: string, roleIds: string[]) => {
  await getUserById(userId);

  const roles = await prisma.role.findMany({ where: { id: { in: roleIds } } });
  if (roles.length !== roleIds.length) {
    throw ApiError.badRequest('One or more role IDs are invalid');
  }

  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId } }),
    prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({ userId, roleId })),
    }),
  ]);

  return getUserById(userId);
};