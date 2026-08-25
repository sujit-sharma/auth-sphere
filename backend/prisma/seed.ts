import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { name: 'users:read', resource: 'users', action: 'read', description: 'View users' },
  { name: 'users:write', resource: 'users', action: 'write', description: 'Create/update users' },
  { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
  { name: 'roles:read', resource: 'roles', action: 'read', description: 'View roles' },
  { name: 'roles:write', resource: 'roles', action: 'write', description: 'Create/update roles' },
  { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete roles' },
];

async function main() {
  await Promise.all(
    PERMISSIONS.map((permission) =>
      prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission,
      }),
    ),
  );

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Full access to all resources' },
  });

  await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'user', description: 'Default role for regular users' },
  });

  const allPermissions = await prisma.permission.findMany();
  await Promise.all(
    allPermissions.map((permission) =>
      prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: permission.id },
      }),
    ),
  );

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@auth-sphere.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      isEmailVerified: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  console.log(`Seed complete. Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });