import { Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';

export const getDriverProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const driver = await prisma.driverProfile.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true, language: true } },
      },
    });
    if (!driver) throw new AppError('Driver profile not found', 404);
    res.json({ success: true, data: driver });
  } catch (e) { next(e); }
};

export const updateDriverProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { vehiclePlate, vehicleModel, vehicleYear, vehicleColor } = req.body;
    const driver = await prisma.driverProfile.update({
      where: { userId: req.user!.id },
      data: { vehiclePlate, vehicleModel, vehicleYear: vehicleYear ? Number(vehicleYear) : undefined, vehicleColor },
    });
    res.json({ success: true, data: driver });
  } catch (e) { next(e); }
};

export const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Record<string, Express.Multer.File[]>;
    const updates: Record<string, string> = {};

    if (files.nationalId?.[0]) updates.nationalIdUrl = `/uploads/${files.nationalId[0].filename}`;
    if (files.driverLicense?.[0]) updates.driverLicenseUrl = `/uploads/${files.driverLicense[0].filename}`;
    if (files.vehicleInsurance?.[0]) updates.vehicleInsuranceUrl = `/uploads/${files.vehicleInsurance[0].filename}`;
    if (files.profilePhoto?.[0]) {
      updates.profilePhotoUrl = `/uploads/${files.profilePhoto[0].filename}`;
      await prisma.user.update({ where: { id: req.user!.id }, data: { avatarUrl: updates.profilePhotoUrl } });
    }

    const driver = await prisma.driverProfile.update({ where: { userId: req.user!.id }, data: updates });
    res.json({ success: true, data: driver });
  } catch (e) { next(e); }
};

export const getEarnings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const driver = await prisma.driverProfile.findUnique({ where: { userId: req.user!.id } });
    if (!driver) throw new AppError('Driver profile not found', 404);

    const { period = 'week' } = req.query;
    const now = new Date();
    let startDate = new Date();
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
    else startDate.setFullYear(now.getFullYear() - 1);

    const [earnings, totalEarnings, totalDeliveries] = await Promise.all([
      prisma.driverEarning.findMany({
        where: { driverProfileId: driver.id, createdAt: { gte: startDate } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.driverEarning.aggregate({
        where: { driverProfileId: driver.id, createdAt: { gte: startDate } },
        _sum: { netAmount: true },
      }),
      prisma.driverEarning.count({
        where: { driverProfileId: driver.id, createdAt: { gte: startDate } },
      }),
    ]);

    res.json({
      success: true,
      data: {
        earnings,
        summary: {
          totalEarnings: totalEarnings._sum.netAmount || 0,
          totalDeliveries,
          period,
          allTimeEarnings: driver.totalEarnings,
          allTimeDeliveries: driver.totalDeliveries,
          rating: driver.rating,
        },
      },
    });
  } catch (e) { next(e); }
};

export const getDeliveryHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const driver = await prisma.driverProfile.findUnique({ where: { userId: req.user!.id } });
    if (!driver) throw new AppError('Driver profile not found', 404);

    const { page = '1', limit = '20', status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { driverProfileId: driver.id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, orderNumber: true, status: true, pickupAddress: true,
          dropoffAddress: true, totalPrice: true, driverEarning: true,
          deliveredAt: true, createdAt: true, ratings: { select: { score: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
      meta: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (e) { next(e); }
};

export const setOnlineStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { isOnline } = req.body;
    const driver = await prisma.driverProfile.findUnique({ where: { userId: req.user!.id } });
    if (!driver) throw new AppError('Driver profile not found', 404);
    if (driver.status === 'PENDING_APPROVAL') throw new AppError('Account pending approval', 403);

    await prisma.driverProfile.update({
      where: { id: driver.id },
      data: { isOnline, status: isOnline ? 'ONLINE' : 'OFFLINE' },
    });
    res.json({ success: true, data: { isOnline } });
  } catch (e) { next(e); }
};
