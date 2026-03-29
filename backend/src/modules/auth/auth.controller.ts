import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../config/database';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../config/jwt';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phone, password, firstName, lastName, role = 'CUSTOMER', language = 'FR' } = req.body;

    if (!email || !phone || !password || !firstName || !lastName) {
      throw new AppError('All fields are required', 400);
    }

    const allowedRoles: UserRole[] = ['CUSTOMER', 'DRIVER'];
    if (!allowedRoles.includes(role)) {
      throw new AppError('Invalid role for self-registration', 400);
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existing) {
      throw new AppError('An account with this email or phone already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const emailVerifyToken = uuid();

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        firstName,
        lastName,
        role,
        language,
        emailVerifyToken,
        status: 'PENDING_VERIFICATION',
      },
    });

    // Create role-specific profile and wallet
    await prisma.$transaction(async (tx) => {
      if (role === 'CUSTOMER') {
        await tx.customerProfile.create({ data: { userId: user.id } });
      } else if (role === 'DRIVER') {
        const { vehicleType } = req.body;
        if (!vehicleType) throw new AppError('Vehicle type required for driver registration', 400);
        await tx.driverProfile.create({ data: { userId: user.id, vehicleType, status: 'PENDING_APPROVAL' } });
      }
      await tx.wallet.create({ data: { userId: user.id } });
    });

    res.status(201).json({
      success: true,
      message: role === 'DRIVER'
        ? 'Registration successful. Your account is pending admin approval.'
        : 'Registration successful. Please verify your email.',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email and password are required', 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('Invalid credentials', 401);

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new AppError('Invalid credentials', 401);

    if (user.status === 'SUSPENDED') throw new AppError('Your account has been suspended', 403);

    // Check driver approval status
    if (user.role === 'DRIVER') {
      const driver = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
      if (driver?.status === 'PENDING_APPROVAL') {
        throw new AppError('Your driver account is pending admin approval', 403);
      }
      if (driver?.status === 'REJECTED') {
        throw new AppError('Your driver application was not approved', 403);
      }
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          language: user.language,
          avatarUrl: user.avatarUrl,
          status: user.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw new AppError('Refresh token required', 400);

    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.status === 'SUSPENDED') throw new AppError('Invalid refresh token', 401);

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch (error) {
    next(new AppError('Invalid or expired refresh token', 401));
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = async (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

// ─── Get Current User ─────────────────────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        role: true, status: true, language: true, avatarUrl: true,
        emailVerified: true, phoneVerified: true, lastLoginAt: true, createdAt: true,
        wallet: { select: { balance: true, currency: true } },
        customerProfile: { select: { id: true } },
        driverProfile: {
          select: {
            id: true, status: true, vehicleType: true, isOnline: true,
            rating: true, totalDeliveries: true,
          },
        },
      },
    });

    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ─── Update Profile ───────────────────────────────────────────────────────────
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phone, language } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { firstName, lastName, phone, language },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, language: true },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) throw new AppError('Both passwords required', 400);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError('User not found', 404);

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new AppError('Current password is incorrect', 400);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (user) {
      const token = uuid();
      const exp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordToken: token, resetPasswordExp: exp },
      });
      // TODO: Send email with reset link
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) throw new AppError('Token and new password required', 400);

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExp: { gt: new Date() },
      },
    });
    if (!user) throw new AppError('Invalid or expired reset token', 400);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetPasswordToken: null, resetPasswordExp: null },
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── Verify Email ─────────────────────────────────────────────────────────────
export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
    if (!user) throw new AppError('Invalid verification token', 400);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null, status: 'ACTIVE' },
    });

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};
