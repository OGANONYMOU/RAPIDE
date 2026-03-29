import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    res.json({ success: true, data: tickets });
  } catch (e) { next(e); }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { subject, description, orderId } = req.body;
    if (!subject || !description) throw new AppError('Subject and description required', 400);
    const ticket = await prisma.supportTicket.create({
      data: { userId: req.user!.id, subject, description, orderId: orderId || null },
    });
    res.status(201).json({ success: true, data: ticket });
  } catch (e) { next(e); }
});

router.post('/:id/messages', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    if (!message) throw new AppError('Message required', 400);
    const msg = await prisma.ticketMessage.create({
      data: { ticketId: req.params.id, senderId: req.user!.id, senderRole: req.user!.role, message },
    });
    res.status(201).json({ success: true, data: msg });
  } catch (e) { next(e); }
});

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) throw new AppError('Ticket not found', 404);
    res.json({ success: true, data: ticket });
  } catch (e) { next(e); }
});

export default router;
