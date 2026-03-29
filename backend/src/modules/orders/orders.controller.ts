import { Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';
import { calculatePrice } from '../../services/pricing.service';
import { generateOrderNumber } from '../../utils/helpers';
import { io } from '../../index';

// ─── Create Order ─────────────────────────────────────────────────────────────
export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!customer) throw new AppError('Customer profile not found', 404);

    const {
      pickupAddress, pickupLat, pickupLng, pickupContactName, pickupContactPhone, pickupNotes,
      dropoffAddress, dropoffLat, dropoffLng, dropoffContactName, dropoffContactPhone, dropoffNotes,
      packageCategory = 'PARCEL', packageSize = 'SMALL', packageDescription, packageWeight, isFragile = false,
      deliveryType = 'STANDARD', vehicleType = 'BIKE', scheduledAt,
      paymentMethod = 'CASH', promoCode, businessId,
    } = req.body;

    if (!pickupAddress || !dropoffAddress || !dropoffContactName || !dropoffContactPhone) {
      throw new AppError('Pickup and dropoff details are required', 400);
    }

    // Calculate distance (simplified — real implementation uses Google Maps Distance Matrix)
    const distanceKm = calculateDistanceKm(pickupLat, pickupLng, dropoffLat, dropoffLng);

    // Get pricing
    const pricing = await calculatePrice({
      vehicleType,
      packageSize,
      deliveryType,
      distanceKm,
    });

    // Apply promo code if provided
    let promoDiscount = 0;
    let promoCodeRecord = null;
    if (promoCode) {
      promoCodeRecord = await prisma.promoCode.findFirst({
        where: { code: promoCode, isActive: true, expiresAt: { gt: new Date() } },
      });
      if (promoCodeRecord) {
        if (promoCodeRecord.discountType === 'PERCENTAGE') {
          promoDiscount = (pricing.totalPrice * promoCodeRecord.discountValue) / 100;
        } else {
          promoDiscount = promoCodeRecord.discountValue;
        }
        await prisma.promoCode.update({
          where: { id: promoCodeRecord.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const totalPrice = Math.max(0, pricing.totalPrice - promoDiscount);
    const driverEarning = totalPrice * 0.8; // 80% to driver, 20% platform fee

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        status: paymentMethod === 'CASH' ? 'SEARCHING_DRIVER' : 'PENDING_PAYMENT',
        customerProfileId: customer.id,
        businessId: businessId || null,
        pickupAddress, pickupLat, pickupLng, pickupContactName, pickupContactPhone, pickupNotes,
        dropoffAddress, dropoffLat, dropoffLng, dropoffContactName, dropoffContactPhone, dropoffNotes,
        packageCategory, packageSize, packageDescription, packageWeight, isFragile,
        deliveryType, vehicleType,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        estimatedDistance: distanceKm,
        basePrice: pricing.basePrice,
        distancePrice: pricing.distancePrice,
        urgencyFee: pricing.urgencyFee,
        vehicleFee: pricing.vehicleFee,
        promoDiscount,
        totalPrice,
        driverEarning,
        paymentMethod,
        promoCodeId: promoCodeRecord?.id || null,
      },
      include: {
        customer: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
      },
    });

    // Log initial status
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: order.status, changedBy: req.user!.id },
    });

    // Create payment record
    await prisma.payment.create({
      data: { orderId: order.id, amount: totalPrice, method: paymentMethod, status: 'PENDING' },
    });

    // Broadcast to available drivers (Socket.IO)
    if (order.status === 'SEARCHING_DRIVER') {
      io.to(`drivers_${vehicleType}`).emit('new_order_available', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        pickupAddress: order.pickupAddress,
        dropoffAddress: order.dropoffAddress,
        totalPrice: order.totalPrice,
        driverEarning: order.driverEarning,
        distanceKm,
      });
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// ─── Get Orders ───────────────────────────────────────────────────────────────
export const getOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '10', status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let where: Record<string, unknown> = {};

    if (req.user!.role === 'CUSTOMER') {
      const cp = await prisma.customerProfile.findUnique({ where: { userId: req.user!.id } });
      where = { customerProfileId: cp?.id };
    } else if (req.user!.role === 'DRIVER') {
      const dp = await prisma.driverProfile.findUnique({ where: { userId: req.user!.id } });
      where = { driverProfileId: dp?.id };
    }

    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
          driver: { include: { user: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } } } },
          ratings: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
      meta: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Order ─────────────────────────────────────────────────────────
export const getOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { include: { user: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } } } },
        driver: { include: { user: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } } } },
        business: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        ratings: true,
        payment: true,
      },
    });

    if (!order) throw new AppError('Order not found', 404);
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// ─── Update Order Status ──────────────────────────────────────────────────────
export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, note } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError('Order not found', 404);

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status,
        ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
        ...(status === 'CANCELLED' && { cancelledAt: new Date(), cancelledBy: req.user!.id }),
      },
    });

    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status, note, changedBy: req.user!.id },
    });

    // Handle driver assignment
    if (status === 'DRIVER_ASSIGNED' && req.user!.role === 'DRIVER') {
      const driver = await prisma.driverProfile.findUnique({ where: { userId: req.user!.id } });
      if (driver) {
        await prisma.order.update({ where: { id: order.id }, data: { driverProfileId: driver.id } });
        await prisma.driverProfile.update({ where: { id: driver.id }, data: { status: 'ON_DELIVERY' } });
      }
    }

    // Handle delivery completion - create earnings record
    if (status === 'DELIVERED') {
      if (order.driverProfileId) {
        await prisma.driverEarning.create({
          data: {
            driverProfileId: order.driverProfileId,
            orderId: order.id,
            amount: order.totalPrice,
            platformFee: order.totalPrice * 0.2,
            netAmount: order.driverEarning,
          },
        });
        await prisma.driverProfile.update({
          where: { id: order.driverProfileId },
          data: {
            totalDeliveries: { increment: 1 },
            totalEarnings: { increment: order.driverEarning },
            status: 'ONLINE',
          },
        });
        // Credit driver wallet
        const driverUser = await prisma.driverProfile.findUnique({
          where: { id: order.driverProfileId },
          include: { user: { include: { wallet: true } } },
        });
        if (driverUser?.user.wallet) {
          await prisma.wallet.update({
            where: { id: driverUser.user.wallet.id },
            data: { balance: { increment: order.driverEarning } },
          });
          await prisma.transaction.create({
            data: {
              walletId: driverUser.user.wallet.id,
              type: 'DRIVER_EARNING',
              amount: order.driverEarning,
              balanceBefore: driverUser.user.wallet.balance,
              balanceAfter: driverUser.user.wallet.balance + order.driverEarning,
              reference: `EARN-${order.orderNumber}`,
              description: `Earning for order ${order.orderNumber}`,
            },
          });
        }
      }
      // Mark payment as completed for cash
      if (order.paymentMethod === 'CASH') {
        await prisma.payment.update({ where: { orderId: order.id }, data: { status: 'COMPLETED', paidAt: new Date() } });
      }
    }

    // Notify customer via Socket.IO
    io.to(`order_${order.id}`).emit('order_status_updated', { orderId: order.id, status, note });

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// ─── Cancel Order ─────────────────────────────────────────────────────────────
export const cancelOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw new AppError('Order not found', 404);

    const cancellableStatuses = ['DRAFT', 'PENDING_PAYMENT', 'PAID', 'SEARCHING_DRIVER', 'DRIVER_ASSIGNED'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new AppError('This order cannot be cancelled at this stage', 400);
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: reason, cancelledBy: req.user!.id },
    });
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: 'CANCELLED', note: reason, changedBy: req.user!.id },
    });

    io.to(`order_${order.id}`).emit('order_status_updated', { orderId: order.id, status: 'CANCELLED' });

    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

// ─── Rate Order ───────────────────────────────────────────────────────────────
export const rateOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { score, comment } = req.body;
    if (!score || score < 1 || score > 5) throw new AppError('Score must be between 1 and 5', 400);

    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { customer: true } });
    if (!order) throw new AppError('Order not found', 404);
    if (order.status !== 'DELIVERED') throw new AppError('Can only rate delivered orders', 400);
    if (!order.driverProfileId) throw new AppError('No driver to rate', 400);

    const rating = await prisma.rating.upsert({
      where: { orderId_customerProfileId: { orderId: order.id, customerProfileId: order.customerProfileId } },
      update: { score, comment },
      create: {
        orderId: order.id,
        customerProfileId: order.customerProfileId,
        driverProfileId: order.driverProfileId,
        score,
        comment,
      },
    });

    // Recalculate driver average rating
    const avgRating = await prisma.rating.aggregate({
      where: { driverProfileId: order.driverProfileId },
      _avg: { score: true },
    });
    await prisma.driverProfile.update({
      where: { id: order.driverProfileId },
      data: { rating: avgRating._avg.score || 0 },
    });

    res.json({ success: true, data: rating });
  } catch (error) {
    next(error);
  }
};

// ─── Order Chat ───────────────────────────────────────────────────────────────
export const getOrderChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const messages = await prisma.orderChat.findMany({
      where: { orderId: req.params.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

export const sendChatMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) throw new AppError('Message cannot be empty', 400);

    const msg = await prisma.orderChat.create({
      data: {
        orderId: req.params.id,
        senderId: req.user!.id,
        senderRole: req.user!.role,
        message: message.trim(),
      },
    });

    io.to(`order_${req.params.id}`).emit('new_chat_message', msg);
    res.status(201).json({ success: true, data: msg });
  } catch (error) {
    next(error);
  }
};

// ─── Proof of Delivery ────────────────────────────────────────────────────────
export const uploadProofOfDelivery = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError('Proof of delivery image required', 400);
    const { note } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;

    await prisma.order.update({
      where: { id: req.params.id },
      data: { proofOfDeliveryUrl: imageUrl, proofOfDeliveryNote: note },
    });

    res.json({ success: true, data: { imageUrl } });
  } catch (error) {
    next(error);
  }
};

// ─── Haversine Distance Helper ────────────────────────────────────────────────
function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function toRad(deg: number) { return (deg * Math.PI) / 180; }
