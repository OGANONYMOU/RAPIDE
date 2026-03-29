// tracking.routes.ts
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
router.use(authenticate);

router.get('/orders/:orderId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      select: {
        id: true, orderNumber: true, status: true,
        pickupAddress: true, pickupLat: true, pickupLng: true,
        dropoffAddress: true, dropoffLat: true, dropoffLng: true,
        estimatedDistance: true, estimatedDuration: true,
        driver: {
          select: {
            id: true, currentLat: true, currentLng: true, lastLocationAt: true,
            vehicleType: true, vehiclePlate: true, rating: true,
            user: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } },
          },
        },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new AppError('Order not found', 404);
    res.json({ success: true, data: order });
  } catch (e) { next(e); }
});

export default router;
