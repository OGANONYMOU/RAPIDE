import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { prisma } from '../../config/database';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const lang = (req.headers['accept-language']?.includes('en') ? 'EN' : 'FR') as 'EN' | 'FR';

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user!.id },
        skip, take: Number(limit), orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
    ]);

    // Return localized title/body
    const localized = notifications.map((n) => ({
      ...n,
      title: lang === 'EN' && n.titleEn ? n.titleEn : n.title,
      body: lang === 'EN' && n.bodyEn ? n.bodyEn : n.body,
    }));

    res.json({ success: true, data: localized, meta: { unreadCount } });
  } catch (e) { next(e); }
});

router.patch('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (e) { next(e); }
});

router.patch('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
