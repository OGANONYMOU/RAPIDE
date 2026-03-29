import { Server as SocketServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../config/jwt';
import { prisma } from '../config/database';
import { logger } from '../config/logger';

interface AuthSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const initSocketHandlers = (io: SocketServer) => {
  // Auth middleware for socket connections
  io.use(async (socket: AuthSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      socket.userRole = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: AuthSocket) => {
    logger.info(`Socket connected: ${socket.id} | User: ${socket.userId}`);

    // ─── Driver Location Updates ─────────────────────────────────────────────
    socket.on('driver:update_location', async ({ lat, lng }) => {
      if (socket.userRole !== 'DRIVER') return;

      try {
        const driver = await prisma.driverProfile.findUnique({ where: { userId: socket.userId } });
        if (!driver) return;

        await prisma.driverProfile.update({
          where: { id: driver.id },
          data: { currentLat: lat, currentLng: lng, lastLocationAt: new Date() },
        });

        // Find active order for this driver and broadcast to order room
        const activeOrder = await prisma.order.findFirst({
          where: { driverProfileId: driver.id, status: { in: ['DRIVER_EN_ROUTE_PICKUP', 'PICKED_UP', 'IN_TRANSIT'] } },
        });

        if (activeOrder) {
          io.to(`order_${activeOrder.id}`).emit('driver:location_updated', { lat, lng, driverId: driver.id });
        }
      } catch (err) {
        logger.error('Error updating driver location:', err);
      }
    });

    // ─── Driver Go Online/Offline ────────────────────────────────────────────
    socket.on('driver:set_online', async ({ isOnline, vehicleType }) => {
      if (socket.userRole !== 'DRIVER') return;

      try {
        const driver = await prisma.driverProfile.findUnique({ where: { userId: socket.userId } });
        if (!driver || driver.status === 'PENDING_APPROVAL') return;

        await prisma.driverProfile.update({
          where: { id: driver.id },
          data: { isOnline, status: isOnline ? 'ONLINE' : 'OFFLINE' },
        });

        if (isOnline && vehicleType) {
          socket.join(`drivers_${vehicleType}`);
          logger.info(`Driver ${socket.userId} joined room drivers_${vehicleType}`);
        } else {
          socket.rooms.forEach((room) => { if (room.startsWith('drivers_')) socket.leave(room); });
        }

        socket.emit('driver:status_updated', { isOnline });
      } catch (err) {
        logger.error('Error updating driver status:', err);
      }
    });

    // ─── Join Order Room ─────────────────────────────────────────────────────
    socket.on('join_order', (orderId: string) => {
      socket.join(`order_${orderId}`);
      logger.info(`User ${socket.userId} joined order room: order_${orderId}`);
    });

    socket.on('leave_order', (orderId: string) => {
      socket.leave(`order_${orderId}`);
    });

    // ─── Accept / Reject Order (Driver) ─────────────────────────────────────
    socket.on('driver:accept_order', async ({ orderId }) => {
      if (socket.userRole !== 'DRIVER') return;

      try {
        const driver = await prisma.driverProfile.findUnique({ where: { userId: socket.userId } });
        if (!driver || !driver.isOnline) return;

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order || order.status !== 'SEARCHING_DRIVER') {
          socket.emit('driver:order_accept_failed', { message: 'Order no longer available' });
          return;
        }

        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'DRIVER_ASSIGNED', driverProfileId: driver.id },
        });
        await prisma.driverProfile.update({ where: { id: driver.id }, data: { status: 'ON_DELIVERY' } });
        await prisma.orderStatusHistory.create({
          data: { orderId, status: 'DRIVER_ASSIGNED', changedBy: socket.userId },
        });

        // Notify customer
        io.to(`order_${orderId}`).emit('order_status_updated', {
          orderId,
          status: 'DRIVER_ASSIGNED',
          driver: { id: driver.id, vehicleType: driver.vehicleType, rating: driver.rating },
        });

        socket.emit('driver:order_accepted', { orderId });
      } catch (err) {
        logger.error('Error accepting order:', err);
      }
    });

    // ─── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${socket.id} | User: ${socket.userId}`);

      if (socket.userRole === 'DRIVER' && socket.userId) {
        try {
          const driver = await prisma.driverProfile.findUnique({ where: { userId: socket.userId } });
          if (driver && driver.status === 'ONLINE') {
            await prisma.driverProfile.update({
              where: { id: driver.id },
              data: { isOnline: false, status: 'OFFLINE' },
            });
          }
        } catch (err) {
          logger.error('Error setting driver offline on disconnect:', err);
        }
      }
    });
  });
};
