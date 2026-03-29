import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import {
  getDashboardStats,
  listUsers,
  updateUserStatus,
  listDrivers,
  approveDriver,
  rejectDriver,
  listOrders,
  listBusinesses,
  verifyBusiness,
  getPricingRules,
  upsertPricingRule,
  listPromoCodes,
  createPromoCode,
  togglePromoCode,
  listSupportTickets,
  assignTicket,
  resolveTicket,
  getAnalytics,
  listBanners,
  upsertBanner,
  listFaqs,
  upsertFaq,
} from './admin.controller';

const router = Router();
router.use(authenticate);
router.use(requireRole('ADMIN', 'SUPER_ADMIN'));

// Dashboard
router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);

// Users
router.get('/users', listUsers);
router.patch('/users/:id/status', updateUserStatus);

// Drivers
router.get('/drivers', listDrivers);
router.post('/drivers/:id/approve', approveDriver);
router.post('/drivers/:id/reject', rejectDriver);

// Orders
router.get('/orders', listOrders);

// Businesses
router.get('/businesses', listBusinesses);
router.patch('/businesses/:id/verify', verifyBusiness);

// Pricing
router.get('/pricing', getPricingRules);
router.put('/pricing/:vehicleType', upsertPricingRule);

// Promo Codes
router.get('/promos', listPromoCodes);
router.post('/promos', createPromoCode);
router.patch('/promos/:id/toggle', togglePromoCode);

// Support
router.get('/support', listSupportTickets);
router.patch('/support/:id/assign', assignTicket);
router.patch('/support/:id/resolve', resolveTicket);

// Content
router.get('/banners', listBanners);
router.put('/banners/:id?', upsertBanner);
router.get('/faqs', listFaqs);
router.put('/faqs/:id?', upsertFaq);

export default router;
