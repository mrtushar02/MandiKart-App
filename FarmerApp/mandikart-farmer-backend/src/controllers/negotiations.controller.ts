/**
 * MandiKart — Farmer App Negotiations Controller
 * Handles farmer viewing, chatting, and responding to buyer price negotiations.
 */

import { Request, Response } from 'express';
import { NegotiationRegistryService, NegotiationMessageItem, auditLog } from '@mandikart/shared-core';
import { UserRole } from '@mandikart/shared-types';

export class FarmerNegotiationsController {
  static async listNegotiations(req: Request, res: Response): Promise<void> {
    const farmerId = req.user?.id || 'd1111111-1111-1111-1111-111111111111';
    const list = NegotiationRegistryService.getRegisteredNegotiations();
    const demoFarmerIds = [
      'd1111111-1111-1111-1111-111111111111',
      'farmer_ramesh_01',
      'farmer_ramesh',
      'farmer-1',
      'frm-101',
    ];
    const isDemo = demoFarmerIds.includes(farmerId) || farmerId.includes('d1111111') || farmerId.includes('farmer');
    const filtered = list.filter((n) => {
      if (!n.farmerId) return true;
      if (n.farmerId === farmerId) return true;
      // Direct FPO bulk requirements or open buyer offers are broadcast to all farmers
      if (n.id?.startsWith('breq_') || n.buyerCompany?.includes('FPO')) return true;
      if (isDemo) return true;
      if (demoFarmerIds.includes(n.farmerId) || n.farmerId.includes('farmer') || n.farmerId.includes('d1111111')) return true;
      return false;
    });
    res.status(200).json({
      data: filtered,
      meta: { total: filtered.length },
      error: null,
    });
  }


  static async getNegotiation(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    const neg = NegotiationRegistryService.getNegotiationById(id);
    if (!neg) {
      res.status(404).json({
        data: null,
        meta: null,
        error: { code: 'NOT_FOUND', message: 'Negotiation not found' },
      });
      return;
    }
    res.status(200).json({
      data: neg,
      meta: null,
      error: null,
    });
  }

  static async sendMessage(req: Request, res: Response): Promise<void> {
    const farmerId = req.user?.id || 'd1111111-1111-1111-1111-111111111111';
    const id = String(req.params.id);
    const { text, messageId } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({
        data: null,
        meta: null,
        error: { code: 'VALIDATION_ERROR', message: 'Text message is required' },
      });
      return;
    }

    const target = NegotiationRegistryService.getNegotiationById(id);
    if (!target) {
      res.status(404).json({
        data: null,
        meta: null,
        error: { code: 'NOT_FOUND', message: 'Negotiation not found' },
      });
      return;
    }

    const newMsg: NegotiationMessageItem = {
      id: messageId || `msg_f_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      negotiationId: id,
      senderId: farmerId,
      senderRole: 'FARMER',
      senderName: target.farmerName || 'Farmer (You)',
      messageType: 'TEXT',
      text: text.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    const updated = NegotiationRegistryService.addMessage(id, newMsg);

    res.status(201).json({
      data: newMsg,
      meta: { negotiation: updated },
      error: null,
    });
  }

  static async respondToNegotiation(req: Request, res: Response): Promise<void> {
    const farmerId = req.user?.id || 'd1111111-1111-1111-1111-111111111111';
    const id = String(req.params.id);
    const { action, counterPrice, counterQty, message, rejectionReason, deliveryAddress } = req.body;

    const target = NegotiationRegistryService.getNegotiationById(id);
    if (!target) {
      res.status(404).json({
        data: null,
        meta: null,
        error: { code: 'NOT_FOUND', message: 'Negotiation not found' },
      });
      return;
    }

    let resultData: any = target;

    if (action === 'ACCEPT') {
      const resAcc = NegotiationRegistryService.acceptNegotiation(
        id,
        'FARMER',
        farmerId,
        target.farmerName || 'Farmer (You)',
        deliveryAddress
      );
      if (!resAcc) {
        res.status(400).json({
          data: null,
          meta: null,
          error: { code: 'ACCEPT_FAILED', message: 'Failed to accept negotiation' },
        });
        return;
      }
      resultData = resAcc.negotiation;
    } else if (action === 'REJECT' || action === 'DECLINE') {
      const updated = NegotiationRegistryService.rejectNegotiation(
        id,
        'FARMER',
        farmerId,
        target.farmerName || 'Farmer (You)',
        rejectionReason || message
      );
      resultData = updated || target;
    } else if (action === 'COUNTER') {
      if (!counterPrice) {
        res.status(400).json({
          data: null,
          meta: null,
          error: { code: 'VALIDATION_ERROR', message: 'counterPrice is required for COUNTER action' },
        });
        return;
      }
      const updated = NegotiationRegistryService.counterNegotiation(
        id,
        'FARMER',
        farmerId,
        target.farmerName || 'Farmer (You)',
        Number(counterPrice),
        Number(counterQty || target.quantity),
        message
      );
      resultData = updated || target;
    } else {
      res.status(400).json({
        data: null,
        meta: null,
        error: { code: 'VALIDATION_ERROR', message: `Unknown action: ${action}` },
      });
      return;
    }

    await auditLog({
      actorId: farmerId,
      role: UserRole.FARMER,
      action: `FARMER_NEGOTIATION_${action}`,
      resourceType: 'PRODUCT',
      resourceId: id,
      metadata: { action, counterPrice, status: resultData.status },
    });

    res.status(200).json({
      data: resultData,
      meta: null,
      error: null,
    });
  }
}
