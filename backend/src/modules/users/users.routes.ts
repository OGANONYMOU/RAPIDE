// users.routes.ts
import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
router.use(authenticate);

router.get('/saved-addresses', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cp = await prisma.customerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!cp) throw new AppError('Profile not found', 404);
    const addresses = await prisma.savedAddress.findMany({ where: { customerProfileId: cp.id } });
    res.json({ success: true, data: addresses });
  } catch (e) { next(e); }
});

router.post('/saved-addresses', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cp = await prisma.customerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!cp) throw new AppError('Profile not found', 404);
    const { label, address, lat, lng, isDefault } = req.body;
    if (isDefault) await prisma.savedAddress.updateMany({ where: { customerProfileId: cp.id }, data: { isDefault: false } });
    const saved = await prisma.savedAddress.create({ data: { customerProfileId: cp.id, label, address, lat, lng, isDefault: !!isDefault } });
    res.status(201).json({ success: true, data: saved });
  } catch (e) { next(e); }
});

router.delete('/saved-addresses/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.savedAddress.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Address deleted' });
  } catch (e) { next(e); }
});

export default router;
