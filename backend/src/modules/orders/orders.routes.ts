import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  rateOrder,
  getOrderChat,
  sendChatMessage,
  uploadProofOfDelivery,
} from './orders.controller';
import { upload } from '../../services/upload.service';

const router = Router();
router.use(authenticate);

router.post('/', requireRole('CUSTOMER'), createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', requireRole('DRIVER', 'ADMIN', 'SUPER_ADMIN'), updateOrderStatus);
router.patch('/:id/cancel', cancelOrder);
router.post('/:id/rating', requireRole('CUSTOMER'), rateOrder);
router.get('/:id/chat', getOrderChat);
router.post('/:id/chat', sendChatMessage);
router.post('/:id/proof', requireRole('DRIVER'), upload.single('proof'), uploadProofOfDelivery);

export default router;
