/**
 * MandiKart — UserApp Negotiations Controller
 * Handles buyer price offers, negotiation tracking, real-time messaging, and responses to farmer counter-offers.
 */

import { Request, Response } from 'express';
import { UserRole } from '@mandikart/shared-types';
import { auditLog, NegotiationRegistryService, NegotiationMessageItem, OrderRegistryService } from '@mandikart/shared-core';

export class BuyerNegotiationsController {
  static async listNegotiations(req: Request, res: Response): Promise<void> {
    const buyerId = req.user?.id || 'buyer_default_01';
    const regList = NegotiationRegistryService.getRegisteredNegotiations();
    const items = regList.filter((n) => !buyerId || n.buyerId === buyerId || buyerId.includes('buyer'));
    res.status(200).json({
      data: items,
      meta: { total: items.length },
      error: null,
    });
  }

  static async getNegotiation(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);
    let neg: any = NegotiationRegistryService.getNegotiationById(id);
    if (!neg) {
      const order = OrderRegistryService.getOrderById(id);
      if (order) {
        const priceNum = order.pricePerKg || 30;
        const qtyNum = order.quantity || order.quantityKg || 100;
        neg = {
          id: order.id,
          productId: order.items?.[0]?.productId || 'prod_default',
          cropName: order.cropName || order.produceName || order.items?.[0]?.cropName || 'Fresh Produce',
          cropImage: order.cropImage || order.imageUrl || order.items?.[0]?.imageUrl || '',
          grade: order.grade || 'A',
          farmerId: order.farmerId || 'd1111111-1111-1111-1111-111111111111',
          farmerName: order.farmerName || 'Ramesh Patel',
          buyerId: order.buyerId || 'buyer_default_01',
          buyerName: order.buyerName || order.customerName || 'MandiKart Buyer',
          buyerPhone: order.buyerPhone || order.customerPhone || '+91 98765 43210',
          originalPrice: priceNum,
          offeredPrice: priceNum,
          counterPrice: null,
          quantity: qtyNum,
          unit: 'kg',
          status: 'PENDING_FARMER',
          remarks: `Order #${order.orderNumber || order.id} discussion`,
          messages: [
            {
              id: `msg_order_${order.id}_init`,
              negotiationId: order.id,
              senderId: order.buyerId || 'buyer_default_01',
              senderRole: 'BUYER',
              senderName: order.buyerName || order.customerName || 'MandiKart Buyer',
              messageType: 'OFFER',
              text: `Order Requirement: ₹${priceNum}/kg for ${qtyNum} kg`,
              price: priceNum,
              quantity: qtyNum,
              unit: 'kg',
              totalAmount: order.totalAmount || priceNum * qtyNum,
              offerStatus: 'PENDING',
              timestamp: order.createdAt || new Date().toISOString(),
            },
          ],
          updatedAt: order.updatedAt || new Date().toISOString(),
        };
        NegotiationRegistryService.registerNegotiation(neg);
      }
    }

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
    const buyerId = req.user?.id || 'buyer_default_01';
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

    let target: any = NegotiationRegistryService.getNegotiationById(id);
    if (!target) {
      const order = OrderRegistryService.getOrderById(id);
      if (order) {
        target = {
          id: order.id,
          productId: order.items?.[0]?.productId || 'prod_default',
          cropName: order.cropName || order.produceName || 'Fresh Produce',
          cropImage: order.cropImage || order.imageUrl || '',
          farmerId: order.farmerId || 'd1111111-1111-1111-1111-111111111111',
          farmerName: order.farmerName || 'Ramesh Patel',
          buyerId,
          buyerName: order.buyerName || order.customerName || 'MandiKart Buyer',
          offeredPrice: order.pricePerKg || 30,
          originalPrice: order.pricePerKg || 30,
          quantity: order.quantity || 100,
          unit: 'kg',
          status: 'PENDING_FARMER',
          messages: [],
          updatedAt: new Date().toISOString(),
        };
        NegotiationRegistryService.registerNegotiation(target);
      }
    }

    if (!target) {
      res.status(404).json({
        data: null,
        meta: null,
        error: { code: 'NOT_FOUND', message: 'Negotiation not found' },
      });
      return;
    }

    const newMsg: NegotiationMessageItem = {
      id: messageId || `msg_b_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      negotiationId: id,
      senderId: buyerId,
      senderRole: 'BUYER',
      senderName: target.buyerName || 'Buyer (You)',
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

  static async submitOffer(req: Request, res: Response): Promise<void> {
    const buyerId = req.user?.id || 'buyer_default_01';
    const {
      productId,
      cropName,
      cropImage,
      grade,
      farmerId,
      farmerName,
      buyerName,
      buyerPhone,
      originalPrice,
      offeredPrice,
      quantity,
      unit,
      remarks,
    } = req.body;

    if (!productId || !offeredPrice || !quantity) {
      res.status(400).json({
        data: null,
        meta: null,
        error: { code: 'VALIDATION_ERROR', message: 'productId, offeredPrice, and quantity are required' },
      });
      return;
    }

    const negotiationId = `neg_${Date.now()}`;
    const now = new Date().toISOString();
    const qtyNum = Number(quantity);
    const priceNum = Number(offeredPrice);

    const initialMessages: NegotiationMessageItem[] = [
      {
        id: `msg_init_${Date.now()}`,
        negotiationId,
        senderId: buyerId,
        senderRole: 'BUYER',
        senderName: buyerName || 'MandiKart Buyer',
        messageType: 'OFFER',
        text: `Initial Offer: ₹${priceNum}/${unit || 'kg'} for ${qtyNum} ${unit || 'kg'}`,
        price: priceNum,
        quantity: qtyNum,
        unit: unit || 'kg',
        totalAmount: Math.round(priceNum * qtyNum),
        offerStatus: 'PENDING',
        timestamp: now,
      },
    ];

    if (remarks && remarks.trim()) {
      initialMessages.push({
        id: `msg_init_txt_${Date.now() + 1}`,
        negotiationId,
        senderId: buyerId,
        senderRole: 'BUYER',
        senderName: buyerName || 'MandiKart Buyer',
        messageType: 'TEXT',
        text: remarks.trim(),
        timestamp: new Date(Date.now() + 50).toISOString(),
      });
    }

    const newNeg = {
      id: negotiationId,
      productId,
      cropName: cropName || 'Produce',
      cropImage: cropImage || '',
      grade: grade || 'A',
      farmerId: farmerId || 'd1111111-1111-1111-1111-111111111111',
      farmerName: farmerName || 'Ramesh Patel',
      buyerId,
      buyerName: buyerName || 'MandiKart Buyer',
      buyerPhone: buyerPhone || '+91 98765 43210',
      originalPrice: Number(originalPrice) || priceNum * 1.1,
      offeredPrice: priceNum,
      counterPrice: null,
      quantity: qtyNum,
      unit: unit || 'kg',
      status: 'PENDING_FARMER' as const,
      remarks: remarks || null,
      messages: initialMessages,
      history: [
        {
          id: `msg_hist_${Date.now()}`,
          sender: 'BUYER' as const,
          senderName: buyerName || 'MandiKart Buyer',
          price: priceNum,
          pricePerKg: priceNum,
          quantityKg: qtyNum,
          text: remarks || `Offer of ₹${priceNum}/${unit || 'kg'} submitted for ${qtyNum} ${unit || 'kg'}.`,
          message: remarks || `Offer of ₹${priceNum}/${unit || 'kg'} submitted for ${qtyNum} ${unit || 'kg'}.`,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    NegotiationRegistryService.registerNegotiation(newNeg as any);

    await auditLog({
      actorId: buyerId,
      role: UserRole.BUYER,
      action: 'SUBMIT_PRICE_OFFER',
      resourceType: 'PRODUCT',
      resourceId: productId,
      metadata: { offeredPrice, quantity },
    });

    res.status(201).json({
      data: newNeg,
      meta: null,
      error: null,
    });
  }

  static async respondToCounterOffer(req: Request, res: Response): Promise<void> {
    const buyerId = req.user?.id || 'buyer_default_01';
    const negotiationId = String(req.params.id);
    const { action, counterPrice, remarks, deliveryAddress } = req.body;

    if (!action || !['ACCEPT', 'REJECT', 'COUNTER'].includes(action)) {
      res.status(400).json({
        data: null,
        meta: null,
        error: { code: 'VALIDATION_ERROR', message: "action must be 'ACCEPT', 'REJECT', or 'COUNTER'" },
      });
      return;
    }

    const target = NegotiationRegistryService.getNegotiationById(negotiationId);
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
        negotiationId,
        'BUYER',
        buyerId,
        target.buyerName || 'Buyer (You)',
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
    } else if (action === 'REJECT') {
      const updated = NegotiationRegistryService.rejectNegotiation(
        negotiationId,
        'BUYER',
        buyerId,
        target.buyerName || 'Buyer (You)',
        remarks
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
        negotiationId,
        'BUYER',
        buyerId,
        target.buyerName || 'Buyer (You)',
        Number(counterPrice),
        target.quantity,
        remarks
      );
      resultData = updated || target;
    }

    await auditLog({
      actorId: buyerId,
      role: UserRole.BUYER,
      action: `NEGOTIATION_${action}`,
      resourceType: 'PRODUCT',
      resourceId: negotiationId,
      metadata: { action, counterPrice },
    });

    res.status(200).json({
      data: resultData,
      meta: null,
      error: null,
    });
  }

  static async convertToOrder(req: Request, res: Response): Promise<void> {
    const buyerId = req.user?.id || 'buyer_default_01';
    const negotiationId = String(req.params.id);
    const { deliveryAddress } = req.body;

    const target = NegotiationRegistryService.getNegotiationById(negotiationId);
    if (!target) {
      res.status(404).json({
        data: null,
        meta: null,
        error: { code: 'NOT_FOUND', message: 'Negotiation not found' },
      });
      return;
    }

    const resAcc = NegotiationRegistryService.acceptNegotiation(
      negotiationId,
      'BUYER',
      buyerId,
      target.buyerName || 'Buyer',
      deliveryAddress
    );

    if (!resAcc) {
      res.status(400).json({
        data: null,
        meta: null,
        error: { code: 'ORDER_CREATION_FAILED', message: 'Failed to accept offer and create order' },
      });
      return;
    }

    res.status(201).json({
      data: {
        negotiation: resAcc.negotiation,
        order: resAcc.order,
      },
      meta: null,
      error: null,
    });
  }
}
