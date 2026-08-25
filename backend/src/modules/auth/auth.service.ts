import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signAccessToken } from '../../utils/jwt';
import {
  generateRefreshTokenValue,
  getRefreshTokenExpiry,
  hashRefreshToken,
} from '../../utils/refreshToken';
import { AuthenticatedUser, RequestMeta, TokenPair } from './auth.types';

const userWithAccessInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  },
} as const;

const toAuthenticatedUser = (
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } & {
    roles: Array<{
      role: {
        name: string;
        permissions: Array<{ permission: { name: string } }>;
      };
    }>;
  },
): AuthenticatedUser => {
  const roles = user.roles.map((userRole) => userRole.role.name);
  const permissions = Array.from(
    new Set(
      user.roles.flatMap((userRole) =>
        userRole.role.permissions.map((rolePermission) => rolePermission.permission.name),
      ),
    ),
  );

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles,
    permissions,
  };
};

const issueTokenPair = async (
  authenticatedUser: AuthenticatedUser,
  meta: RequestMeta,
): Promise<TokenPair> => {
  const accessToken = signAccessToken({
    sub: authenticatedUser.id,
    email: authenticatedUser.email,
    roles: authenticatedUser.roles,
    permissions: authenticatedUser.permissions,
  });

  const refreshToken = generateRefreshTokenValue();
  await prisma.refreshToken.create({
    data: {
      userId: authenticatedUser.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: getRefreshTokenExpiry(),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    },
  });

  return { accessToken, refreshToken };
};

export const register = async (input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<AuthenticatedUser> => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const defaultRole = await prisma.role.findUnique({ where: { name: 'user' } });

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      roles: defaultRole ? { create: [{ roleId: defaultRole.id }] } : undefined,
    },
    include: userWithAccessInclude,
  });

  return toAuthenticatedUser(user);
};

export const login = async (
  input: { email: string; password: string },
  meta: RequestMeta,
): Promise<{ user: AuthenticatedUser; tokens: TokenPair }> => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: userWithAccessInclude,
  });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Account is disabled');
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const authenticatedUser = toAuthenticatedUser(user);
  const tokens = await issueTokenPair(authenticatedUser, meta);

  return { user: authenticatedUser, tokens };
};

export const refresh = async (
  refreshTokenValue: string,
  meta: RequestMeta,
): Promise<{ user: AuthenticatedUser; tokens: TokenPair }> => {
  const tokenHash = hashRefreshToken(refreshTokenValue);
  const storedToken = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!storedToken) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  if (storedToken.revokedAt) {
    // Reuse of a revoked token indicates possible theft — revoke the whole session chain.
    await prisma.refreshToken.updateMany({
      where: { userId: storedToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw ApiError.unauthorized('Refresh token has already been used');
  }

  if (storedToken.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token has expired');
  }

  const user = await prisma.user.findUnique({
    where: { id: storedToken.userId },
    include: userWithAccessInclude,
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Account is no longer active');
  }

  const authenticatedUser = toAuthenticatedUser(user);
  const tokens = await issueTokenPair(authenticatedUser, meta);

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date(), replacedByTokenHash: hashRefreshToken(tokens.refreshToken) },
  });

  return { user: authenticatedUser, tokens };
};

export const logout = async (refreshTokenValue: string): Promise<void> => {
  const tokenHash = hashRefreshToken(refreshTokenValue);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const logoutAll = async (userId: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const getAuthenticatedUser = async (userId: string): Promise<AuthenticatedUser> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userWithAccessInclude,
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return toAuthenticatedUser(user);
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await logoutAll(userId);
};