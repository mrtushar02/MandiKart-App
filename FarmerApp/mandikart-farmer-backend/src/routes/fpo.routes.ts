/**
 * MandiKart — Farmer Producer Organization (FPO) Routes
 */

import { Router } from 'express';
import { FPOController } from '../controllers/fpo.controller.js';

export const fpoRouter = Router();

// Profile & Lookup
fpoRouter.get('/details', FPOController.getDetails);
fpoRouter.post('/details', FPOController.saveDetails);
fpoRouter.put('/details', FPOController.saveDetails);
fpoRouter.get('/by-code/:code', FPOController.getByCode);

// Members Roster
fpoRouter.get('/members', FPOController.getMembers);
fpoRouter.post('/members', FPOController.addMember);
fpoRouter.put('/members/:id/status', FPOController.updateMemberStatus);

// Bulk Produce Lots
fpoRouter.get('/lots', FPOController.getLots);
fpoRouter.post('/lots', FPOController.createLot);
