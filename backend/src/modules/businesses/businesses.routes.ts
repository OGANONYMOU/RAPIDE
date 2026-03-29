// businesses.routes.ts
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query;
    const where: Record<string, unknown> = { isActive: true, isVerified: true };
    if (type) where.type = type;
    const businesses = await prisma.business.findMany({ where, take: 50 });
    res.json({ success: true, data: businesses });
  } catch (e) { next(e); }
});

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, type, phone, email, address, lat, lng, description } = req.body;
    const biz = await prisma.business.create({ data: { name, type, ownerUserId: req.user!.id, phone, email, address, lat, lng, description } });
    res.status(201).json({ success: true, data: biz });
  } catch (e) { next(e); }
});

export default router;
