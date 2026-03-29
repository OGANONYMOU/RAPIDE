// payments.routes.ts
import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

// Get wallet balance and transactions
router.get('/wallet', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.id },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!wallet) throw new AppError('Wallet not found', 404);
    res.json({ success: true, data: wallet });
  } catch (e) { next(e); }
});

// Top up wallet (mock - real integration depends on gateway)
router.post('/wallet/topup', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) throw new AppError('Invalid amount', 400);

    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet) throw new AppError('Wallet not found', 404);

    const updated = await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: Number(amount) } },
    });

    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'WALLET_TOPUP',
        amount: Number(amount),
        balanceBefore: wallet.balance,
        balanceAfter: updated.balance,
        reference: `TOP-${Date.now()}`,
        description: 'Wallet top-up',
      },
    });

    res.json({ success: true, data: { balance: updated.balance } });
  } catch (e) { next(e); }
});

// Pay for order with wallet
router.post('/orders/:orderId/pay-wallet', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
    if (!order) throw new AppError('Order not found', 404);
    if (order.status !== 'PENDING_PAYMENT') throw new AppError('Order is not awaiting payment', 400);

    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet) throw new AppError('Wallet not found', 404);
    if (wallet.balance < order.totalPrice) throw new AppError('Insufficient wallet balance', 400);

    await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: order.totalPrice } },
      });
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'ORDER_PAYMENT',
          amount: order.totalPrice,
          balanceBefore: wallet.balance,
          balanceAfter: updatedWallet.balance,
          reference: `PAY-${order.orderNumber}`,
          description: `Payment for order ${order.orderNumber}`,
        },
      });
      await tx.payment.update({
        where: { orderId: order.id },
        data: { status: 'COMPLETED', paidAt: new Date() },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'SEARCHING_DRIVER', paymentStatus: 'COMPLETED' },
      });
    });

    res.json({ success: true, message: 'Payment successful' });
  } catch (e) { next(e); }
});

export default router;
