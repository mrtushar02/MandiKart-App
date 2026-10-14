/**
 * MandiKart — Farmer App Suppliers Routes
 */

import { Router } from 'express';
import { SuppliersController } from '../controllers/suppliers.controller.js';

export const suppliersRouter = Router();

suppliersRouter.get('/', SuppliersController.listSuppliers);
suppliersRouter.get('/:id', SuppliersController.getSupplierById);
suppliersRouter.get('/:id/verification', SuppliersController.getSupplierVerification);
suppliersRouter.get('/:id/documents/:docId/preview', SuppliersController.previewDocument);
