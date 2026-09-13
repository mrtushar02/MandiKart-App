import { Router } from 'express';
import { requireAuth, requireRole, requireIdempotency } from '@mandikart/shared-core';
import { UserRole } from '@mandikart/shared-types';
import { AdminController } from '../controllers/admin.controller.js';

export const adminRouter = Router();

adminRouter.get('/metrics', AdminController.getPlatformMetrics);
adminRouter.get('/audit-logs', AdminController.getAuditLogs);
adminRouter.post('/farmers/:farmerId/verify', AdminController.verifyFarmerKyc);
adminRouter.get('/farmers', AdminController.getAllFarmers);
adminRouter.get('/users', AdminController.getAllUsers);
adminRouter.get('/ai-insights', AdminController.getAiInsights);

// Produce moderation routes
adminRouter.get('/produce', AdminController.getAllProduce);
adminRouter.post('/produce/:productId/approve', AdminController.approveProduce);
adminRouter.post('/produce/:productId/reject', AdminController.rejectProduce);

// Order management and escrow routes
adminRouter.get('/orders', AdminController.getAllOrders);
adminRouter.post('/orders/:orderId/accept', AdminController.acceptOrder);
adminRouter.post('/orders/:orderId/reject', AdminController.rejectOrder);
adminRouter.post('/orders/:orderId/status', AdminController.updateOrderStatus);
adminRouter.post('/orders/:orderId/release-escrow', AdminController.releaseEscrow);
adminRouter.post('/orders/:orderId/refund-buyer', AdminController.refundBuyer);

// Logistics and shipments
adminRouter.get('/shipments', AdminController.getAllShipments);

// Dispute resolution
adminRouter.get('/disputes', AdminController.getAllDisputes);
adminRouter.post('/disputes/:orderId/resolve', AdminController.resolveDispute);
