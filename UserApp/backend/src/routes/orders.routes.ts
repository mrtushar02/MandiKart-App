import { Router } from 'express';
import { requireAuth, optionalAuth, requireIdempotency } from '@mandikart/shared-core';
import { BuyerOrdersController } from '../controllers/orders.controller.js';

export const ordersRouter = Router();

ordersRouter.post('/', requireAuth, requireIdempotency, BuyerOrdersController.placeOrder);
ordersRouter.get('/', optionalAuth, BuyerOrdersController.listOrders);
ordersRouter.get('/:id', optionalAuth, BuyerOrdersController.getOrderById);
ordersRouter.post('/:id/confirm-delivery', requireAuth, requireIdempotency, BuyerOrdersController.confirmDelivery);
ordersRouter.post('/:id/cancel', requireAuth, requireIdempotency, BuyerOrdersController.cancelOrder);
ordersRouter.post('/:id/dispute', requireAuth, requireIdempotency, BuyerOrdersController.raiseDispute);
