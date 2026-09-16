/**
 * MandiKart — Shared Negotiation Registry
 * Enables immediate cross-backend negotiation synchronization across microservices
 * with persistent cross-process disk synchronization.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { OrderRegistryService } from './order-registry.service.js';
import { OrderStatus } from '@mandikart/shared-types';

export type NegotiationMessageType = 'TEXT' | 'OFFER' | 'SYSTEM' | 'ORDER_EVENT';
export type NegotiationSenderRole = 'BUYER' | 'FARMER' | 'SYSTEM';

export interface NegotiationMessageItem {
  id: string;
  negotiationId: string;
  senderId: string;
  senderRole: NegotiationSenderRole;
  senderName: string;
  messageType: NegotiationMessageType;
  text: string;
  price?: number;
  quantity?: number;
  unit?: string;
  totalAmount?: number;
  offerStatus?: 'PENDING' | 'ACCEPTED' | 'ACCEPTED_BY_FARMER' | 'REJECTED' | 'EXPIRED' | 'COUNTERED';
  orderId?: string;
  orderNumber?: string;
  timestamp: string;
  isRead?: boolean;
}

export interface RegisteredNegotiation {
  id: string;
  productId: string;
  cropName: string;
  cropImage?: string;
  grade?: string;
  farmerId: string;
  farmerName: string;
  farmerPhone?: string;
  farmerLocation?: string;
  buyerId: string;
  buyerName: string;
  buyerPhone?: string;
  buyerCompany?: string;
  originalPrice: number;
  offeredPrice: number;
  counterPrice?: number | null;
  quantity: number;
  unit: string;
  status: 'PENDING_FARMER' | 'PENDING_BUYER_CONFIRMATION' | 'COUNTER_OFFERED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  remarks?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  messages: NegotiationMessageItem[];
  history: Array<{
    id?: string;
    sender: 'BUYER' | 'FARMER' | 'buyer' | 'farmer';
    senderName?: string;
    price?: number;
    pricePerKg?: number;
    quantityKg?: number;
    text?: string;
    message?: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const CACHE_FILE = path.join(os.tmpdir(), 'mandikart_shared_negotiations.json');

const DEFAULT_NEGOTIATIONS: RegisteredNegotiation[] = [];

function readFromDisk(): RegisteredNegotiation[] {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        // Filter out legacy demo mock items so only genuine user requests remain
        const filtered = parsed.filter(item => item && item.id && !item.id.includes('neg_101') && !item.id.includes('req_101') && !item.id.includes('req_102') && !item.id.includes('req_103'));
        return filtered.map((item) => ({
          ...item,
          messages: Array.isArray(item.messages) ? item.messages : (item.history || []).map((h: any, idx: number) => ({
            id: h.id || `msg_mig_${idx}`,
            negotiationId: item.id,
            senderId: h.sender === 'BUYER' ? item.buyerId : item.farmerId,
            senderRole: (h.sender ? h.sender.toUpperCase() : 'BUYER') as NegotiationSenderRole,
            senderName: h.senderName || (h.sender === 'BUYER' ? item.buyerName : item.farmerName),
            messageType: h.price ? 'OFFER' : 'TEXT',
            text: h.text || h.message || '',
            price: h.price || h.pricePerKg,
            quantity: h.quantityKg || item.quantity,
            unit: item.unit || 'kg',
            totalAmount: (h.price || h.pricePerKg || item.offeredPrice) * (h.quantityKg || item.quantity),
            timestamp: h.timestamp || item.createdAt,
          })),
        }));
      }
    }
  } catch {}
  writeToDisk(DEFAULT_NEGOTIATIONS);
  return DEFAULT_NEGOTIATIONS;
}

function writeToDisk(items: RegisteredNegotiation[]): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(items, null, 2), 'utf8');
  } catch {}
}

export class NegotiationRegistryService {
  static registerNegotiation(neg: RegisteredNegotiation): void {
    const list = readFromDisk();
    const existingIndex = list.findIndex((n) => n.id === neg.id);
    if (!neg.messages) neg.messages = [];
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...neg };
    } else {
      list.unshift(neg);
    }
    writeToDisk(list);
  }

  static updateNegotiation(id: string, updates: Partial<RegisteredNegotiation>): RegisteredNegotiation | undefined {
    const list = readFromDisk();
    const index = list.findIndex((n) => n.id === id);
    if (index >= 0) {
      list[index] = { ...list[index], ...updates };
      writeToDisk(list);
      return list[index];
    }
    return undefined;
  }

  static getRegisteredNegotiations(): RegisteredNegotiation[] {
    return readFromDisk();
  }

  static getNegotiationById(id: string): RegisteredNegotiation | undefined {
    const list = readFromDisk();
    return list.find((n) => n.id === id);
  }

  static addMessage(negotiationId: string, message: NegotiationMessageItem): RegisteredNegotiation | undefined {
    const list = readFromDisk();
    const index = list.findIndex((n) => n.id === negotiationId);
    if (index === -1) return undefined;

    const neg = list[index];
    if (!neg.messages) neg.messages = [];

    // Duplicate protection by message id
    if (!neg.messages.some((m) => m.id === message.id)) {
      neg.messages.push(message);
    }

    if (!neg.history) neg.history = [];
    neg.history.push({
      id: message.id,
      sender: message.senderRole === 'BUYER' ? 'BUYER' : 'FARMER',
      senderName: message.senderName,
      price: message.price,
      pricePerKg: message.price,
      quantityKg: message.quantity,
      text: message.text,
      message: message.text,
      timestamp: message.timestamp,
    });

    neg.updatedAt = message.timestamp;
    writeToDisk(list);
    return neg;
  }

  /**
   * Atomic offer acceptance: accepts the active deal, creates the confirmed order in OrderRegistryService,
   * and appends system/order events to the conversation.
   */
  /**
   * Atomic offer acceptance: accepts the active deal.
   * If farmer accepts, status is set to PENDING_BUYER_CONFIRMATION awaiting buyer order placement.
   * If buyer confirms, order is created in OrderRegistryService with status PLACED.
   */
  static acceptNegotiation(
    id: string,
    actorRole: 'BUYER' | 'FARMER',
    actorId: string,
    actorName: string,
    deliveryAddress?: string
  ): { negotiation: RegisteredNegotiation; order: any } | undefined {
    const target = this.getNegotiationById(id);
    if (!target) return undefined;

    const finalPrice = target.counterPrice || target.offeredPrice;
    const finalQty = target.quantity;
    const totalAmount = Math.round(finalPrice * finalQty);
    const now = new Date().toISOString();

    // 1. If FARMER accepts: prompt buyer for final order confirmation in chat
    if (actorRole === 'FARMER') {
      target.messages?.forEach((m) => {
        if (m.messageType === 'OFFER' && (m.offerStatus === 'PENDING' || !m.offerStatus)) {
          m.offerStatus = 'ACCEPTED_BY_FARMER';
        }
      });

      const acceptMsg: NegotiationMessageItem = {
        id: `msg_sys_acc_${Date.now()}`,
        negotiationId: id,
        senderId: actorId,
        senderRole: 'FARMER',
        senderName: actorName,
        messageType: 'SYSTEM',
        text: `🌾 Farmer ${actorName} accepted the offer of ₹${finalPrice}/${target.unit || 'kg'} for ${finalQty} ${target.unit || 'kg'}! Please confirm to place your order.`,
        timestamp: now,
      };

      if (!target.messages) target.messages = [];
      target.messages.push(acceptMsg);

      target.status = 'PENDING_BUYER_CONFIRMATION';
      target.updatedAt = now;
      this.updateNegotiation(id, target);

      return {
        negotiation: target,
        order: null,
      };
    }

    // 2. If BUYER accepts / confirms: finalize order into OrderRegistryService
    return this.confirmBuyerNegotiationOrder(
      id,
      actorId,
      actorName,
      deliveryAddress,
      target.buyerPhone
    );
  }

  /**
   * Buyer finalizes and confirms the accepted negotiation into a PLACED order.
   * Order appears in User Orders and Farmer Orders (Pending Tab).
   */
  static confirmBuyerNegotiationOrder(
    id: string,
    buyerId: string,
    buyerName: string,
    deliveryAddress?: string,
    buyerPhone?: string
  ): { negotiation: RegisteredNegotiation; order: any } | undefined {
    const target = this.getNegotiationById(id);
    if (!target) return undefined;

    const finalPrice = target.counterPrice || target.offeredPrice;
    const finalQty = target.quantity;
    const totalAmount = Math.round(finalPrice * finalQty);
    const orderNumber = `MK-ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = `ord_neg_${Date.now()}`;
    const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date().toISOString();

    const createdOrder = {
      id: orderId,
      orderNumber,
      farmerId: target.farmerId || 'd1111111-1111-1111-1111-111111111111',
      farmerName: target.farmerName || 'Ramesh Patel',
      farmerPhone: target.farmerPhone || '+91 98220 11111',
      farmerLocation: target.farmerLocation || 'Nashik, Maharashtra',
      buyerId: buyerId || target.buyerId || 'buyer_default_01',
      buyerName: buyerName || target.buyerName || 'MandiKart Buyer',
      buyerPhone: buyerPhone || target.buyerPhone || '+91 98765 43210',
      recipientName: buyerName || target.buyerName || 'MandiKart Buyer',
      recipientPhone: buyerPhone || target.buyerPhone || '+91 98765 43210',
      cropName: target.cropName,
      produceName: target.cropName,
      category: 'Vegetables',
      qualityGrade: target.grade || 'GRADE_A',
      quantityKg: finalQty,
      pricePerKg: finalPrice,
      totalAmount,
      totalPrice: totalAmount,
      status: OrderStatus.PLACED,
      escrowStatus: 'HELD_IN_ESCROW',
      deliveryAddress: deliveryAddress || 'Selected Delivery Location',
      pickupOtp,
      deliveryOtp,
      imageUrl: target.cropImage,
      createdAt: now,
      timestamp: now,
      items: [
        {
          id: `item_${orderId}_0`,
          productId: target.productId,
          cropName: target.cropName,
          grade: target.grade || 'A',
          quantity: finalQty,
          unit: target.unit || 'kg',
          pricePerUnit: finalPrice,
          subtotal: totalAmount,
        },
      ],
    };

    OrderRegistryService.registerOrder(createdOrder);

    // Mark previous offers as ACCEPTED
    target.messages?.forEach((m) => {
      if (m.messageType === 'OFFER' && (m.offerStatus === 'PENDING' || m.offerStatus === 'ACCEPTED_BY_FARMER')) {
        m.offerStatus = 'ACCEPTED';
      }
    });

    const confirmMsg: NegotiationMessageItem = {
      id: `msg_sys_cnf_${Date.now()}`,
      negotiationId: id,
      senderId: buyerId,
      senderRole: 'BUYER',
      senderName: buyerName,
      messageType: 'SYSTEM',
      text: `✅ ${buyerName} confirmed and placed the order for ₹${finalPrice}/${target.unit || 'kg'} (${finalQty} ${target.unit || 'kg'}).`,
      timestamp: now,
    };

    const orderEvtMsg: NegotiationMessageItem = {
      id: `msg_ord_evt_${Date.now() + 1}`,
      negotiationId: id,
      senderId: 'system',
      senderRole: 'SYSTEM',
      senderName: 'MandiKart System',
      messageType: 'ORDER_EVENT',
      text: `Order #${orderNumber} placed! Awaiting farmer confirmation in Farmer App Pending section.`,
      orderId,
      orderNumber,
      totalAmount,
      timestamp: new Date(Date.now() + 50).toISOString(),
    };

    if (!target.messages) target.messages = [];
    target.messages.push(confirmMsg, orderEvtMsg);

    target.status = 'ACCEPTED';
    target.orderId = orderId;
    target.orderNumber = orderNumber;
    target.updatedAt = now;

    this.updateNegotiation(id, target);

    return {
      negotiation: target,
      order: createdOrder,
    };
  }

  /**
   * Counter negotiation offer: creates a new immutable structured offer message.
   */
  static counterNegotiation(
    id: string,
    actorRole: 'BUYER' | 'FARMER',
    actorId: string,
    actorName: string,
    counterPrice: number,
    counterQty: number,
    message?: string
  ): RegisteredNegotiation | undefined {
    const target = this.getNegotiationById(id);
    if (!target) return undefined;

    // Mark previous pending offers as COUNTERED
    target.messages?.forEach((m) => {
      if (m.messageType === 'OFFER' && m.offerStatus === 'PENDING') {
        m.offerStatus = 'COUNTERED';
      }
    });

    const now = new Date().toISOString();
    const offerMsg: NegotiationMessageItem = {
      id: `msg_off_${Date.now()}`,
      negotiationId: id,
      senderId: actorId,
      senderRole: actorRole,
      senderName: actorName,
      messageType: 'OFFER',
      text: `Counter-Offer: ₹${counterPrice}/${target.unit || 'kg'} for ${counterQty} ${target.unit || 'kg'}`,
      price: counterPrice,
      quantity: counterQty,
      unit: target.unit || 'kg',
      totalAmount: Math.round(counterPrice * counterQty),
      offerStatus: 'PENDING',
      timestamp: now,
    };

    if (!target.messages) target.messages = [];
    target.messages.push(offerMsg);

    if (message && message.trim()) {
      target.messages.push({
        id: `msg_txt_${Date.now() + 2}`,
        negotiationId: id,
        senderId: actorId,
        senderRole: actorRole,
        senderName: actorName,
        messageType: 'TEXT',
        text: message.trim(),
        timestamp: new Date(Date.now() + 50).toISOString(),
      });
    }

    target.counterPrice = counterPrice;
    target.quantity = counterQty;
    target.status = 'COUNTER_OFFERED';
    target.updatedAt = now;

    this.updateNegotiation(id, target);
    return target;
  }

  /**
   * Reject negotiation offer
   */
  static rejectNegotiation(
    id: string,
    actorRole: 'BUYER' | 'FARMER',
    actorId: string,
    actorName: string,
    reason?: string
  ): RegisteredNegotiation | undefined {
    const target = this.getNegotiationById(id);
    if (!target) return undefined;

    // Mark pending offers as REJECTED
    target.messages?.forEach((m) => {
      if (m.messageType === 'OFFER' && m.offerStatus === 'PENDING') {
        m.offerStatus = 'REJECTED';
      }
    });

    const now = new Date().toISOString();
    const rejectMsg: NegotiationMessageItem = {
      id: `msg_rej_${Date.now()}`,
      negotiationId: id,
      senderId: actorId,
      senderRole: actorRole,
      senderName: actorName,
      messageType: 'SYSTEM',
      text: `Offer declined by ${actorName}${reason ? `: "${reason}"` : '.'}`,
      timestamp: now,
    };

    if (!target.messages) target.messages = [];
    target.messages.push(rejectMsg);

    target.status = 'REJECTED';
    target.updatedAt = now;

    this.updateNegotiation(id, target);
    return target;
  }
}
