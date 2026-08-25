import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';

export const listPermissions = () => {
  return prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
};

export const createPermission = async (data: {
  name: string;
  resource: string;
  action: string;
  description?: string;
}) => {
  const existing = await prisma.permission.findFirst({
    where: { OR: [{ name: data.name }, { resource: data.resource, action: data.action }] },
  });
  if (existing) {
    throw ApiError.conflict('A permission with this name or resource/action already exists');
  }
  return prisma.permission.create({ data });
};

export const deletePermission = async (permissionId: string) => {
  const existing = await prisma.permission.findUnique({ where: { id: permissionId } });
  if (!existing) {
    throw ApiError.notFound('Permission not found');
  }
  await prisma.permission.delete({ where: { id: permissionId } });
};