import { Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { VehicleType } from '@prisma/client';

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const getDashboardStats = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalUsers, totalDrivers, activeDrivers, pendingDrivers,
      totalOrders, todayOrders, monthOrders,
      deliveredOrders, cancelledOrders,
      totalRevenue, monthRevenue, todayRevenue,
      pendingTickets,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.driverProfile.count(),
      prisma.driverProfile.count({ where: { status: 'ONLINE' } }),
      prisma.driverProfile.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'COMPLETED', paidAt: { gte: thisMonth } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'COMPLETED', paidAt: { gte: today } }, _sum: { amount: true } }),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    ]);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers },
        drivers: { total: totalDrivers, active: activeDrivers, pending: pendingDrivers },
        orders: {
          total: totalOrders, today: todayOrders, month: monthOrders,
          delivered: deliveredOrders, cancelled: cancelledOrders,
          completionRate: totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0,
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          month: monthRevenue._sum.amount || 0,
          today: todayRevenue._sum.amount || 0,
        },
        support: { pendingTickets },
      },
    });
  } catch (e) { next(e); }
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const getAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { period = '30' } = req.query;
    const days = Number(period);
    const startDate = new Date(); startDate.setDate(startDate.getDate() - days);

    // Orders by day
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, status: true, totalPrice: true, vehicleType: true },
    });

    // Group by date
    const byDate: Record<string, { orders: number; revenue: number }> = {};
    orders.forEach((o) => {
      const date = o.createdAt.toISOString().split('T')[0];
      if (!byDate[date]) byDate[date] = { orders: 0, revenue: 0 };
      byDate[date].orders++;
      if (o.status === 'DELIVERED') byDate[date].revenue += o.totalPrice;
    });

    // By vehicle type
    const byVehicle: Record<string, number> = {};
    orders.forEach((o) => {
      byVehicle[o.vehicleType] = (byVehicle[o.vehicleType] || 0) + 1;
    });

    res.json({
      success: true,
      data: { byDate: Object.entries(byDate).map(([date, d]) => ({ date, ...d })), byVehicle },
    });
  } catch (e) { next(e); }
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const listUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', search, status, role } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (search) where.OR = [
      { firstName: { contains: String(search), mode: 'insensitive' } },
      { lastName: { contains: String(search), mode: 'insensitive' } },
      { email: { contains: String(search), mode: 'insensitive' } },
    ];
    if (status) where.status = status;
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true, phone: true,
          role: true, status: true, createdAt: true, lastLoginAt: true,
          wallet: { select: { balance: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: users, meta: { page: Number(page), limit: Number(limit), total } });
  } catch (e) { next(e); }
};

export const updateUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    await prisma.user.update({ where: { id: req.params.id }, data: { status } });
    res.json({ success: true, message: 'User status updated' });
  } catch (e) { next(e); }
};

// ─── Drivers ──────────────────────────────────────────────────────────────────
export const listDrivers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', status, vehicleType } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (vehicleType) where.vehicleType = vehicleType;

    const [drivers, total] = await Promise.all([
      prisma.driverProfile.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
        },
      }),
      prisma.driverProfile.count({ where }),
    ]);

    res.json({ success: true, data: drivers, meta: { page: Number(page), limit: Number(limit), total } });
  } catch (e) { next(e); }
};

export const approveDriver = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.driverProfile.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: req.user!.id },
    });
    // Activate user account
    const driver = await prisma.driverProfile.findUnique({ where: { id: req.params.id } });
    if (driver) await prisma.user.update({ where: { id: driver.userId }, data: { status: 'ACTIVE' } });

    res.json({ success: true, message: 'Driver approved successfully' });
  } catch (e) { next(e); }
};

export const rejectDriver = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    await prisma.driverProfile.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', rejectionReason: reason },
    });
    res.json({ success: true, message: 'Driver application rejected' });
  } catch (e) { next(e); }
};

// ─── Orders ───────────────────────────────────────────────────────────────────
export const listOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) where.orderNumber = { contains: String(search), mode: 'insensitive' };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: {
          customer: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
          driver: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
          payment: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ success: true, data: orders, meta: { page: Number(page), limit: Number(limit), total } });
  } catch (e) { next(e); }
};

// ─── Businesses ───────────────────────────────────────────────────────────────
export const listBusinesses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (type) where.type = type;

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      prisma.business.count({ where }),
    ]);
    res.json({ success: true, data: businesses, meta: { page: Number(page), limit: Number(limit), total } });
  } catch (e) { next(e); }
};

export const verifyBusiness = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.business.update({ where: { id: req.params.id }, data: { isVerified: true } });
    res.json({ success: true, message: 'Business verified' });
  } catch (e) { next(e); }
};

// ─── Pricing ──────────────────────────────────────────────────────────────────
export const getPricingRules = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rules = await prisma.pricingRule.findMany({ orderBy: { vehicleType: 'asc' } });
    res.json({ success: true, data: rules });
  } catch (e) { next(e); }
};

export const upsertPricingRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vehicleType = req.params.vehicleType as VehicleType;
    const { name, basePrice, pricePerKm, minimumPrice, minimumDistance, isActive } = req.body;

    const rule = await prisma.pricingRule.upsert({
      where: { id: req.body.id || 'new' },
      update: { name, basePrice: Number(basePrice), pricePerKm: Number(pricePerKm), minimumPrice: Number(minimumPrice), minimumDistance: Number(minimumDistance), isActive },
      create: { name, vehicleType, basePrice: Number(basePrice), pricePerKm: Number(pricePerKm), minimumPrice: Number(minimumPrice), minimumDistance: Number(minimumDistance || 1), isActive: true },
    });
    res.json({ success: true, data: rule });
  } catch (e) { next(e); }
};

// ─── Promo Codes ──────────────────────────────────────────────────────────────
export const listPromoCodes = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const promos = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: promos });
  } catch (e) { next(e); }
};

export const createPromoCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code, description, discountType, discountValue, maxUses, minOrderValue, expiresAt } = req.body;
    const promo = await prisma.promoCode.create({
      data: { code: code.toUpperCase(), description, discountType, discountValue: Number(discountValue), maxUses: maxUses ? Number(maxUses) : null, minOrderValue: minOrderValue ? Number(minOrderValue) : null, expiresAt: expiresAt ? new Date(expiresAt) : null },
    });
    res.status(201).json({ success: true, data: promo });
  } catch (e) { next(e); }
};

export const togglePromoCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const promo = await prisma.promoCode.findUnique({ where: { id: req.params.id } });
    if (!promo) throw new AppError('Promo code not found', 404);
    await prisma.promoCode.update({ where: { id: req.params.id }, data: { isActive: !promo.isActive } });
    res.json({ success: true, message: 'Promo code updated' });
  } catch (e) { next(e); }
};

// ─── Support ──────────────────────────────────────────────────────────────────
export const listSupportTickets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, email: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      }),
      prisma.supportTicket.count({ where }),
    ]);
    res.json({ success: true, data: tickets, meta: { page: Number(page), limit: Number(limit), total } });
  } catch (e) { next(e); }
};

export const assignTicket = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.supportTicket.update({ where: { id: req.params.id }, data: { assignedTo: req.user!.id, status: 'IN_PROGRESS' } });
    res.json({ success: true, message: 'Ticket assigned' });
  } catch (e) { next(e); }
};

export const resolveTicket = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.supportTicket.update({ where: { id: req.params.id }, data: { status: 'RESOLVED', resolvedAt: new Date() } });
    res.json({ success: true, message: 'Ticket resolved' });
  } catch (e) { next(e); }
};

// ─── Content ──────────────────────────────────────────────────────────────────
export const listBanners = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, data: banners });
  } catch (e) { next(e); }
};

export const upsertBanner = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const banner = id
      ? await prisma.banner.update({ where: { id }, data })
      : await prisma.banner.create({ data });
    res.json({ success: true, data: banner });
  } catch (e) { next(e); }
};

export const listFaqs = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const faqs = await prisma.faq.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, data: faqs });
  } catch (e) { next(e); }
};

export const upsertFaq = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const faq = id
      ? await prisma.faq.update({ where: { id }, data })
      : await prisma.faq.create({ data });
    res.json({ success: true, data: faq });
  } catch (e) { next(e); }
};
