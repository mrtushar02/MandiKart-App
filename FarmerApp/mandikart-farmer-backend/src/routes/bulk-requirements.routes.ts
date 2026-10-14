/**
 * MandiKart — Farmer App Bulk Requirements Routes
 */

import { Router } from 'express';
import { requireIdempotency } from '@mandikart/shared-core';
import { FarmerBulkRequirementsController } from '../controllers/bulk-requirements.controller.js';

export const bulkRequirementsRouter = Router();

bulkRequirementsRouter.get('/', FarmerBulkRequirementsController.listRequirements);
bulkRequirementsRouter.post('/', requireIdempotency, FarmerBulkRequirementsController.createRequirement);
bulkRequirementsRouter.get('/:id', FarmerBulkRequirementsController.getRequirementById);
bulkRequirementsRouter.put('/:id', requireIdempotency, FarmerBulkRequirementsController.updateRequirement);
bulkRequirementsRouter.delete('/:id', FarmerBulkRequirementsController.deleteRequirement);
bulkRequirementsRouter.post('/:id/cancel', requireIdempotency, FarmerBulkRequirementsController.cancelRequirement);
bulkRequirementsRouter.get('/:id/matches', FarmerBulkRequirementsController.getMatches);
bulkRequirementsRouter.get('/:id/fulfillment', FarmerBulkRequirementsController.getFulfillmentPlan);
bulkRequirementsRouter.post('/:id/allocate', requireIdempotency, FarmerBulkRequirementsController.saveFulfillmentPlan);
bulkRequirementsRouter.post('/:id/quote', requireIdempotency, FarmerBulkRequirementsController.submitQuote);
