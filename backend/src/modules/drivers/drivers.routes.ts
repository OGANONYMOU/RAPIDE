import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { upload } from '../../services/upload.service';
import {
  getDriverProfile,
  updateDriverProfile,
  uploadDocument,
  getEarnings,
  getDeliveryHistory,
  setOnlineStatus,
} from './drivers.controller';

const router = Router();
router.use(authenticate);
router.use(requireRole('DRIVER', 'ADMIN', 'SUPER_ADMIN'));

router.get('/me', getDriverProfile);
router.patch('/me', updateDriverProfile);
router.post('/me/documents', upload.fields([
  { name: 'nationalId', maxCount: 1 },
  { name: 'driverLicense', maxCount: 1 },
  { name: 'vehicleInsurance', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 },
]), uploadDocument);
router.get('/me/earnings', getEarnings);
router.get('/me/deliveries', getDeliveryHistory);
router.patch('/me/status', setOnlineStatus);

export default router;
