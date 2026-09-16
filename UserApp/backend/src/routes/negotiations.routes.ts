import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireIdempotency } from '@mandikart/shared-core';
import { UserRole } from '@mandikart/shared-types';
import { BuyerNegotiationsController } from '../controllers/negotiations.controller.js';

export const negotiationsRouter = Router();

/**
 * Permissive auth: uses Bearer token if present; if absent/guest, creates guest buyer identity
 * so unauthenticated or early-session users can make price offers without 401 failures.
 */
function permissiveBuyerAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    requireAuth(req, res, next);
    return;
  }
  (req as any).user = {
    id: req.body?.buyerId || (req.query?.buyerId as string) || 'buyer_default_01',
    phone: req.body?.buyerPhone || '+91 98765 43210',
    role: UserRole.BUYER,
  };
  next();
}

negotiationsRouter.get('/', permissiveBuyerAuth, BuyerNegotiationsController.listNegotiations);
negotiationsRouter.get('/:id', permissiveBuyerAuth, BuyerNegotiationsController.getNegotiation);
negotiationsRouter.post('/', permissiveBuyerAuth, requireIdempotency, BuyerNegotiationsController.submitOffer);
negotiationsRouter.post('/offer', permissiveBuyerAuth, requireIdempotency, BuyerNegotiationsController.submitOffer);
negotiationsRouter.post('/:id/messages', permissiveBuyerAuth, BuyerNegotiationsController.sendMessage);
negotiationsRouter.post('/:id/respond', permissiveBuyerAuth, requireIdempotency, BuyerNegotiationsController.respondToCounterOffer);
negotiationsRouter.post('/:id/accept', permissiveBuyerAuth, requireIdempotency, BuyerNegotiationsController.convertToOrder);
negotiationsRouter.post('/:id/confirm-order', permissiveBuyerAuth, requireIdempotency, BuyerNegotiationsController.convertToOrder);
negotiationsRouter.post('/:id/convert-to-order', permissiveBuyerAuth, requireIdempotency, BuyerNegotiationsController.convertToOrder);

