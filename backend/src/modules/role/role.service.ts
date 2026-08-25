import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';

const roleWithPermissionsInclude = {
  permissions: { include: { permission: true } },
} as const;

const toRoleDto = (role: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  permissions: Array<{ permission: { id: string; name: string; resource: string; action: string } }>;
}) => ({
  id: role.id,
  name: role.name,
  description: role.description,
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
  permissions: role.permissions.map((rolePermission) => rolePermission.permission),
});

export const listRoles = async () => {
  const roles = await prisma.role.findMany({
    include: roleWithPermissionsInclude,
    orderBy: { name: 'asc' },
  });
  return roles.map(toRoleDto);
};

export const getRoleById = async (roleId: string) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: roleWithPermissionsInclude,
  });
  if (!role) {
    throw ApiError.notFound('Role not found');
  }
  return toRoleDto(role);
};

export const createRole = async (data: { name: string; description?: string }) => {
  const existing = await prisma.role.findUnique({ where: { name: data.name } });
  if (existing) {
    throw ApiError.conflict('A role with this name already exists');
  }
  const role = await prisma.role.create({ data, include: roleWithPermissionsInclude });
  return toRoleDto(role);
};

export const updateRole = async (
  roleId: string,
  data: { name?: string; description?: string },
) => {
  await getRoleById(roleId);
  const role = await prisma.role.update({
    where: { id: roleId },
    data,
    include: roleWithPermissionsInclude,
  });
  return toRoleDto(role);
};

export const deleteRole = async (roleId: string) => {
  await getRoleById(roleId);
  await prisma.role.delete({ where: { id: roleId } });
};

export const assignPermissions = async (roleId: string, permissionIds: string[]) => {
  await getRoleById(roleId);

  const permissions = await prisma.permission.findMany({ where: { id: { in: permissionIds } } });
  if (permissions.length !== permissionIds.length) {
    throw ApiError.badRequest('One or more permission IDs are invalid');
  }

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
    }),
  ]);

  return getRoleById(roleId);
};