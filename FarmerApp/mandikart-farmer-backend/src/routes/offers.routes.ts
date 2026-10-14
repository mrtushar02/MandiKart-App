/**
 * MandiKart — Farmer App Offers & Negotiations Routes
 */

import { Router } from 'express';
import { requireIdempotency } from '@mandikart/shared-core';
import { FarmerOffersController } from '../controllers/offers.controller.js';

export const offersRouter = Router();

offersRouter.get('/', FarmerOffersController.listOffers);
offersRouter.get('/:id', FarmerOffersController.getOfferById);
offersRouter.post('/', FarmerOffersController.createOffer);
offersRouter.post('/:id/counter', FarmerOffersController.counterOffer);
offersRouter.post('/:id/accept', FarmerOffersController.acceptOffer);
offersRouter.post('/:id/reject', FarmerOffersController.rejectOffer);
offersRouter.get('/:id/messages', FarmerOffersController.getOfferMessages);
offersRouter.post('/:id/messages', FarmerOffersController.sendOfferMessage);
offersRouter.get('/:id/history', FarmerOffersController.getOfferHistory);
offersRouter.get('/:id/summary', FarmerOffersController.getOfferSummary);
