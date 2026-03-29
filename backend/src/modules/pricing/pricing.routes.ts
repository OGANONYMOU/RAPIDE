// pricing.routes.ts
import { Router } from 'express';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { authenticate } from '../../middleware/auth';
import { calculatePrice } from '../../services/pricing.service';

const router = Router();
router.use(authenticate);

router.post('/estimate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { vehicleType = 'BIKE', packageSize = 'SMALL', deliveryType = 'STANDARD',
      pickupLat, pickupLng, dropoffLat, dropoffLng } = req.body;

    const R = 6371;
    const dLat = ((dropoffLat - pickupLat) * Math.PI) / 180;
    const dLng = ((dropoffLng - pickupLng) * Math.PI) / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(pickupLat*Math.PI/180)*Math.cos(dropoffLat*Math.PI/180)*Math.sin(dLng/2)**2;
    const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const pricing = await calculatePrice({ vehicleType, packageSize, deliveryType, distanceKm });
    res.json({ success: true, data: { ...pricing, distanceKm: Math.round(distanceKm * 10) / 10 } });
  } catch (e) { next(e); }
});

export default router;
