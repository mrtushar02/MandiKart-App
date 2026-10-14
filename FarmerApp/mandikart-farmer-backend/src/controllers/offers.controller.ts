/**
 * MandiKart — Farmer App Offers & Negotiations Controller
 *
 * Manages commercial procurement offers:
 * - Incoming offers from verified suppliers for published requirements
 * - Outgoing purchase requests sent by farmers to suppliers
 * - Detailed commercial terms (base price, freight, APMC cess, delivery, payment)
 * - Multi-round negotiation history and counteroffers
 * - Strict status guards (prevents modifying accepted/rejected/expired offers)
 */

import { Request, Response } from 'express';
import { auditLog } from '@mandikart/shared-core';
import { UserRole } from '@mandikart/shared-types';

export interface OfferHistoryStep {
  stepId: string;
  actorRole: 'SUPPLIER' | 'FARMER';
  actorName: string;
  action: 'INITIAL_OFFER' | 'COUNTER_OFFER' | 'ACCEPTED' | 'REJECTED';
  unitPrice: number;
  quantity: number;
  unit: string;
  deliveryDate?: string;
  deliveryTerms?: string;
  paymentTerms?: string;
  notes?: string;
  timestamp: string;
}

export interface ProcurementOffer {
  id: string;
  requirementId: string;
  requirementTitle: string;
  direction: 'INCOMING' | 'OUTGOING'; // INCOMING = from supplier, OUTGOING = from farmer
  supplierId: string;
  supplierName: string;
  supplierType: 'FPO_CLUSTER' | 'COOPERATIVE' | 'WHOLESALE_AGGREGATOR' | 'COMMERCIAL_FARM';
  isVerified: boolean;
  contactPerson?: string;
  phone?: string;
  cropName: string;
  grade: string;
  variety: string;
  quantity: number;
  unit: 'quintal' | 'tonne' | 'kg';
  unitPrice: number;
  targetPrice: number;
  priceDiffPerUnit: number;
  deliveryCost: number;
  isDeliveryCostEstimated: boolean;
  taxesAndCess: number; // 1% APMC cess
  handlingCost: number;
  volumeDiscount: number;
  totalLandedAmount: number;
  costPerUnitLanded: number;
  deliveryDate: string;
  deliveryLocation: string;
  deliveryTerms: 'SELLER_DELIVERY' | 'FARM_GATE_PICKUP' | 'MANDIKART_3PL';
  paymentTerms: string;
  advanceRequiredPct: number;
  validityUntil: string;
  status: 'PENDING_FARMER' | 'PENDING_SUPPLIER' | 'ACCEPTED' | 'COUNTERED' | 'REJECTED' | 'EXPIRED' | 'DRAFT';
  notes?: string;
  history: OfferHistoryStep[];
  createdAt: string;
  updatedAt: string;
}

const INITIAL_OFFERS: ProcurementOffer[] = [
  {
    id: 'OFFER-2026-8801',
    requirementId: 'breq_rel_onion_101',
    requirementTitle: 'Red Onion Grade A Bulk Sourcing',
    direction: 'INCOMING',
    supplierId: 'sup_fpo_pimpalgaon_01',
    supplierName: 'Pimpalgaon Farmer Producer Co. Ltd.',
    supplierType: 'FPO_CLUSTER',
    isVerified: true,
    contactPerson: 'Kailash Sonawane',
    phone: '+91 98221 44520',
    cropName: 'Red Onion',
    grade: 'Grade A',
    variety: 'Nasik Red / Garwa',
    quantity: 25,
    unit: 'quintal',
    unitPrice: 2304,
    targetPrice: 2400,
    priceDiffPerUnit: -96,
    deliveryCost: 2520,
    isDeliveryCostEstimated: false,
    taxesAndCess: 576,
    handlingCost: 375,
    volumeDiscount: 0,
    totalLandedAmount: 61071,
    costPerUnitLanded: 2443,
    deliveryDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    deliveryLocation: 'Pune Wholesale Mandi, Market Yard Depot',
    deliveryTerms: 'SELLER_DELIVERY',
    paymentTerms: 'Direct Escrow (T+1 on weighbridge slip)',
    advanceRequiredPct: 0,
    validityUntil: new Date(Date.now() + 48 * 3600000).toISOString(),
    status: 'PENDING_FARMER',
    notes: 'Grade A double-mesh sorted, curing verified. Ready for immediate dispatch in 50kg ventilated mesh bags.',
    history: [
      {
        stepId: 'step_1',
        actorRole: 'SUPPLIER',
        actorName: 'Pimpalgaon Farmer Producer Co. Ltd.',
        action: 'INITIAL_OFFER',
        unitPrice: 2304,
        quantity: 25,
        unit: 'quintal',
        deliveryDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
        deliveryTerms: 'SELLER_DELIVERY',
        paymentTerms: 'Direct Escrow (T+1 on weighbridge slip)',
        notes: 'Submitted initial competitive quote below tender target price.',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'OFFER-2026-8802',
    requirementId: 'breq_rel_onion_101',
    requirementTitle: 'Red Onion Grade A Bulk Sourcing',
    direction: 'INCOMING',
    supplierId: 'sup_fpo_sahyadri_02',
    supplierName: 'Sahyadri Agro Farmers Cluster Hub',
    supplierType: 'COOPERATIVE',
    isVerified: true,
    contactPerson: 'Sanjay Deshmukh',
    phone: '+91 94220 18834',
    cropName: 'Red Onion',
    grade: 'Grade A',
    variety: 'Nasik Garwa',
    quantity: 25,
    unit: 'quintal',
    unitPrice: 2352,
    targetPrice: 2400,
    priceDiffPerUnit: -48,
    deliveryCost: 3600,
    isDeliveryCostEstimated: false,
    taxesAndCess: 588,
    handlingCost: 450,
    volumeDiscount: 0,
    totalLandedAmount: 63438,
    costPerUnitLanded: 2538,
    deliveryDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    deliveryLocation: 'Pune Wholesale Mandi, Market Yard Depot',
    deliveryTerms: 'SELLER_DELIVERY',
    paymentTerms: 'Escrow settlement after quality acceptance',
    advanceRequiredPct: 10,
    validityUntil: new Date(Date.now() + 72 * 3600000).toISOString(),
    status: 'COUNTERED',
    notes: 'Central packhouse graded with electronic size grading.',
    history: [
      {
        stepId: 'step_1',
        actorRole: 'SUPPLIER',
        actorName: 'Sahyadri Agro Farmers Cluster Hub',
        action: 'INITIAL_OFFER',
        unitPrice: 2380,
        quantity: 25,
        unit: 'quintal',
        deliveryTerms: 'SELLER_DELIVERY',
        notes: 'Initial tender quote.',
        timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
      },
      {
        stepId: 'step_2',
        actorRole: 'FARMER',
        actorName: 'Farmer (You)',
        action: 'COUNTER_OFFER',
        unitPrice: 2340,
        quantity: 25,
        unit: 'quintal',
        notes: 'Requested price adjustment for parity with Pimpalgaon FPO.',
        timestamp: new Date(Date.now() - 3600000 * 10).toISOString(),
      },
      {
        stepId: 'step_3',
        actorRole: 'SUPPLIER',
        actorName: 'Sahyadri Agro Farmers Cluster Hub',
        action: 'COUNTER_OFFER',
        unitPrice: 2352,
        quantity: 25,
        unit: 'quintal',
        notes: 'Revised counteroffer with 10% advance guarantee.',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'OFFER-2026-8803',
    requirementId: 'breq_itc_wheat_102',
    requirementTitle: 'Sharbati Wheat Processing Demand',
    direction: 'OUTGOING',
    supplierId: 'sup_grain_niphad_03',
    supplierName: 'Niphad Taluka Kisan Sangh (Grain Hub)',
    supplierType: 'WHOLESALE_AGGREGATOR',
    isVerified: true,
    contactPerson: 'Bhausaheb Shinde',
    phone: '+91 98902 33119',
    cropName: 'Sharbati Wheat',
    grade: 'Grade A',
    variety: 'Sharbati Premium',
    quantity: 50,
    unit: 'quintal',
    unitPrice: 2800,
    targetPrice: 2850,
    priceDiffPerUnit: -50,
    deliveryCost: 9500,
    isDeliveryCostEstimated: true,
    taxesAndCess: 1400,
    handlingCost: 600,
    volumeDiscount: 0,
    totalLandedAmount: 151500,
    costPerUnitLanded: 3030,
    deliveryDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
    deliveryLocation: 'Indore Central Silo, Bypass Terminal',
    deliveryTerms: 'MANDIKART_3PL',
    paymentTerms: 'Bank Transfer against Loading Slip',
    advanceRequiredPct: 15,
    validityUntil: new Date(Date.now() + 36 * 3600000).toISOString(),
    status: 'PENDING_SUPPLIER',
    notes: 'Farmer submitted purchase request for certified moisture <11% Sharbati wheat.',
    history: [
      {
        stepId: 'step_1',
        actorRole: 'FARMER',
        actorName: 'Farmer (You)',
        action: 'INITIAL_OFFER',
        unitPrice: 2800,
        quantity: 50,
        unit: 'quintal',
        deliveryTerms: 'MANDIKART_3PL',
        notes: 'Submitted formal purchase request.',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'OFFER-2026-8804',
    requirementId: 'breq_agro_tomato_103',
    requirementTitle: 'Tomato Processing Procurement',
    direction: 'OUTGOING',
    supplierId: 'sup_kisan_dindori_04',
    supplierName: 'Dindori Organic Growers Producer Co.',
    supplierType: 'FPO_CLUSTER',
    isVerified: true,
    contactPerson: 'Sunita Gaikwad',
    phone: '+91 97631 88204',
    cropName: 'Tomato',
    grade: 'Grade A',
    variety: 'Hybrid Firm Ripe',
    quantity: 30,
    unit: 'quintal',
    unitPrice: 1820,
    targetPrice: 1850,
    priceDiffPerUnit: -30,
    deliveryCost: 4320,
    isDeliveryCostEstimated: false,
    taxesAndCess: 546,
    handlingCost: 600,
    volumeDiscount: 1638,
    totalLandedAmount: 58428,
    costPerUnitLanded: 1948,
    deliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    deliveryLocation: 'Nashik Processing Plant, Dindori Road',
    deliveryTerms: 'SELLER_DELIVERY',
    paymentTerms: 'Direct Escrow (T+1)',
    advanceRequiredPct: 0,
    validityUntil: new Date(Date.now() - 12 * 3600000).toISOString(), // Expired draft for testing
    status: 'DRAFT',
    notes: 'Draft purchase request prepared by sourcing manager.',
    history: [],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

export class FarmerOffersController {
  /**
   * GET /api/v1/offers
   * List offers with filtering by direction, status, requirementId, supplierId, and search
   */
  static async listOffers(req: Request, res: Response): Promise<void> {
    try {
      const { direction, status, requirementId, supplierId, search } = req.query as Record<string, string>;
      let list = [...INITIAL_OFFERS];

      if (direction) {
        list = list.filter((o) => o.direction === direction.toUpperCase());
      }
      if (status && status !== 'ALL') {
        list = list.filter((o) => o.status === status.toUpperCase());
      }
      if (requirementId) {
        list = list.filter((o) => o.requirementId === requirementId);
      }
      if (supplierId) {
        list = list.filter((o) => o.supplierId === supplierId);
      }
      if (search) {
        const q = search.toLowerCase().trim();
        list = list.filter(
          (o) =>
            o.cropName.toLowerCase().includes(q) ||
            o.supplierName.toLowerCase().includes(q) ||
            o.requirementTitle.toLowerCase().includes(q) ||
            o.id.toLowerCase().includes(q)
        );
      }

      res.status(200).json({
        data: list,
        meta: { total: list.length },
        error: null,
      });
    } catch (err: any) {
      res.status(500).json({ data: null, error: { message: err.message } });
    }
  }

  /**
   * GET /api/v1/offers/:id
   * Retrieve complete offer details with commercial line items and history
   */
  static async getOfferById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const offer = INITIAL_OFFERS.find((o) => o.id === id);

      if (!offer) {
        res.status(404).json({
          data: null,
          error: { code: 'NOT_FOUND', message: `Offer #${id} not found.` },
        });
        return;
      }

      res.status(200).json({ data: offer, error: null });
    } catch (err: any) {
      res.status(500).json({ data: null, error: { message: err.message } });
    }
  }

  /**
   * POST /api/v1/offers
   * Make a new purchase offer from farmer to supplier
   */
  static async createOffer(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body || {};
      const {
        requirementId,
        requirementTitle,
        supplierId,
        supplierName,
        supplierType,
        cropName,
        grade,
        quantity,
        unit,
        unitPrice,
        targetPrice,
        deliveryDate,
        deliveryLocation,
        deliveryTerms,
        paymentTerms,
        notes,
        isDraft,
      } = body;

      if (!supplierId || !quantity || !unitPrice) {
        res.status(400).json({
          data: null,
          error: { message: 'supplierId, quantity, and unitPrice are required.' },
        });
        return;
      }

      const qtyNum = Number(quantity);
      const priceNum = Number(unitPrice);
      const produceCost = qtyNum * priceNum;
      const freightEstimate = Math.round(qtyNum * 35);
      const cess = Math.round(produceCost * 0.01);
      const handling = Math.round(qtyNum * 15);
      const landedTotal = produceCost + freightEstimate + cess + handling;
      const unitLanded = Math.round((landedTotal / qtyNum) * 100) / 100;

      const newId = `OFFER-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toISOString();

      const newOffer: ProcurementOffer = {
        id: newId,
        requirementId: requirementId || `REQ-${Date.now()}`,
        requirementTitle: requirementTitle || `${cropName || 'Produce'} Procurement Request`,
        direction: 'OUTGOING',
        supplierId,
        supplierName: supplierName || 'Verified Supplier',
        supplierType: supplierType || 'FPO_CLUSTER',
        isVerified: true,
        cropName: cropName || 'Produce',
        grade: grade || 'Grade A',
        variety: 'Standard Grade',
        quantity: qtyNum,
        unit: unit || 'quintal',
        unitPrice: priceNum,
        targetPrice: targetPrice || priceNum,
        priceDiffPerUnit: targetPrice ? priceNum - targetPrice : 0,
        deliveryCost: freightEstimate,
        isDeliveryCostEstimated: true,
        taxesAndCess: cess,
        handlingCost: handling,
        volumeDiscount: 0,
        totalLandedAmount: landedTotal,
        costPerUnitLanded: unitLanded,
        deliveryDate: deliveryDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        deliveryLocation: deliveryLocation || 'Destination Depot',
        deliveryTerms: deliveryTerms || 'SELLER_DELIVERY',
        paymentTerms: paymentTerms || 'Direct Escrow (T+1 on weighbridge slip)',
        advanceRequiredPct: 0,
        validityUntil: new Date(Date.now() + 48 * 3600000).toISOString(),
        status: isDraft ? 'DRAFT' : 'PENDING_SUPPLIER',
        notes: notes || '',
        history: isDraft
          ? []
          : [
              {
                stepId: `step_${Date.now()}`,
                actorRole: 'FARMER',
                actorName: 'Farmer (You)',
                action: 'INITIAL_OFFER',
                unitPrice: priceNum,
                quantity: qtyNum,
                unit: unit || 'quintal',
                deliveryDate,
                deliveryTerms,
                paymentTerms,
                notes,
                timestamp: now,
              },
            ],
        createdAt: now,
        updatedAt: now,
      };

      INITIAL_OFFERS.unshift(newOffer);

      await auditLog({
        actorId: (req as any).user?.id || 'farmer_user_01',
        role: UserRole.FARMER,
        action: 'CREATE_PROCUREMENT_OFFER',
        resourceType: 'PRODUCT',
        resourceId: newId,
        metadata: { supplierId, quantity: qtyNum, unitPrice: priceNum, isDraft },
      });

      res.status(201).json({
        data: newOffer,
        meta: { message: isDraft ? 'Draft offer saved' : 'Purchase offer submitted to supplier successfully' },
        error: null,
      });
    } catch (err: any) {
      res.status(500).json({ data: null, error: { message: err.message } });
    }
  }

  /**
   * POST /api/v1/offers/:id/counter
   * Submit a counteroffer on an existing offer, preserving full audit history
   */
  static async counterOffer(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const offerIdx = INITIAL_OFFERS.findIndex((o) => o.id === id);

      if (offerIdx === 0 && !INITIAL_OFFERS[offerIdx]) {
        res.status(404).json({ data: null, error: { message: 'Offer not found' } });
        return;
      }

      const offer = INITIAL_OFFERS[offerIdx];
      if (!offer) {
        res.status(404).json({ data: null, error: { message: 'Offer not found' } });
        return;
      }

      // Finalized guard
      if (offer.status === 'ACCEPTED' || offer.status === 'REJECTED' || offer.status === 'EXPIRED') {
        res.status(400).json({
          data: null,
          error: {
            message: `Cannot counteroffer an offer that is already ${offer.status}.`,
          },
        });
        return;
      }

      const {
        counterPricePerUnit,
        counterQuantity,
        deliveryDate,
        deliveryTerms,
        paymentTerms,
        notes,
      } = req.body || {};

      if (!counterPricePerUnit) {
        res.status(400).json({ data: null, error: { message: 'counterPricePerUnit is required.' } });
        return;
      }

      const newPrice = Number(counterPricePerUnit);
      const newQty = counterQuantity ? Number(counterQuantity) : offer.quantity;
      const produceCost = newQty * newPrice;
      const freight = offer.deliveryCost;
      const cess = Math.round(produceCost * 0.01);
      const handling = Math.round(newQty * 15);
      const totalLanded = produceCost + freight + cess + handling;
      const unitLanded = Math.round((totalLanded / newQty) * 100) / 100;
      const now = new Date().toISOString();

      const newStep: OfferHistoryStep = {
        stepId: `step_${Date.now()}`,
        actorRole: 'FARMER',
        actorName: 'Farmer (You)',
        action: 'COUNTER_OFFER',
        unitPrice: newPrice,
        quantity: newQty,
        unit: offer.unit,
        deliveryDate: deliveryDate || offer.deliveryDate,
        deliveryTerms: deliveryTerms || offer.deliveryTerms,
        paymentTerms: paymentTerms || offer.paymentTerms,
        notes: notes || 'Farmer revised counteroffer terms.',
        timestamp: now,
      };

      const updatedOffer: ProcurementOffer = {
        ...offer,
        unitPrice: newPrice,
        quantity: newQty,
        priceDiffPerUnit: newPrice - offer.targetPrice,
        taxesAndCess: cess,
        handlingCost: handling,
        totalLandedAmount: totalLanded,
        costPerUnitLanded: unitLanded,
        deliveryDate: deliveryDate || offer.deliveryDate,
        deliveryTerms: deliveryTerms || offer.deliveryTerms,
        paymentTerms: paymentTerms || offer.paymentTerms,
        notes: notes || offer.notes,
        status: 'COUNTERED',
        direction: 'OUTGOING', // Sent to supplier for review
        history: [...offer.history, newStep],
        updatedAt: now,
      };

      INITIAL_OFFERS[offerIdx] = updatedOffer;

      await auditLog({
        actorId: (req as any).user?.id || 'farmer_user_01',
        role: UserRole.FARMER,
        action: 'SUBMIT_COUNTER_OFFER',
        resourceType: 'PRODUCT',
        resourceId: id,
        metadata: { newPrice, newQty, notes },
      });

      res.status(200).json({
        data: updatedOffer,
        meta: { message: 'Counteroffer submitted to supplier successfully.' },
        error: null,
      });
    } catch (err: any) {
      res.status(500).json({ data: null, error: { message: err.message } });
    }
  }

  /**
   * POST /api/v1/offers/:id/accept
   * Accept an incoming offer and establish procurement agreement
   */
  static async acceptOffer(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const offerIdx = INITIAL_OFFERS.findIndex((o) => o.id === id);

      if (offerIdx < 0 || !INITIAL_OFFERS[offerIdx]) {
        res.status(404).json({ data: null, error: { message: 'Offer not found' } });
        return;
      }

      const offer = INITIAL_OFFERS[offerIdx];
      if (offer.status === 'ACCEPTED') {
        res.status(400).json({ data: null, error: { code: 'ALREADY_ACCEPTED', message: 'Offer is already accepted and finalized.' } });
        return;
      }

      if (offer.status === 'REJECTED') {
        res.status(400).json({ data: null, error: { code: 'OFFER_REJECTED', message: 'Cannot accept an offer that has already been rejected.' } });
        return;
      }

      if (offer.validityUntil && new Date(offer.validityUntil).getTime() < Date.now()) {
        res.status(400).json({ data: null, error: { code: 'OFFER_EXPIRED', message: 'Offer validity period has expired. This offer can no longer be accepted.' } });
        return;
      }

      const now = new Date().toISOString();
      const contractNumber = `AGR-${offer.id.replace('OFFER-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const acceptStep: OfferHistoryStep = {
        stepId: `step_${Date.now()}`,
        actorRole: 'FARMER',
        actorName: 'Farmer (You)',
        action: 'ACCEPTED',
        unitPrice: offer.unitPrice,
        quantity: offer.quantity,
        unit: offer.unit,
        notes: `Commercial terms accepted. Binding procurement agreement #${contractNumber} established under MandiKart safe escrow.`,
        timestamp: now,
      };

      const updated: ProcurementOffer = {
        ...offer,
        status: 'ACCEPTED',
        history: [...offer.history, acceptStep],
        updatedAt: now,
      };

      INITIAL_OFFERS[offerIdx] = updated;

      await auditLog({
        actorId: (req as any).user?.id || 'farmer_user_01',
        role: UserRole.FARMER,
        action: 'ACCEPT_PROCUREMENT_OFFER',
        resourceType: 'PRODUCT',
        resourceId: id,
        metadata: { totalLandedAmount: offer.totalLandedAmount, contractNumber },
      });

      res.status(200).json({
        data: {
          ...updated,
          contractNumber,
          escrowReference: `ESC-${contractNumber}`,
        },
        meta: { message: `Offer accepted successfully. Agreement ${contractNumber} established.` },
        error: null,
      });
    } catch (err: any) {
      res.status(500).json({ data: null, error: { message: err.message } });
    }
  }

  /**
   * POST /api/v1/offers/:id/reject
   * Reject an incoming offer with structured reason
   */
  static async rejectOffer(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { reason } = req.body || {};
      const offerIdx = INITIAL_OFFERS.findIndex((o) => o.id === id);

      if (offerIdx < 0 || !INITIAL_OFFERS[offerIdx]) {
        res.status(404).json({ data: null, error: { message: 'Offer not found' } });
        return;
      }

      const offer = INITIAL_OFFERS[offerIdx];
      if (offer.status === 'ACCEPTED') {
        res.status(400).json({ data: null, error: { code: 'FINALIZED_CONTRACT', message: 'Cannot decline an offer that is already accepted and under contract.' } });
        return;
      }
      if (offer.status === 'REJECTED') {
        res.status(400).json({ data: null, error: { code: 'ALREADY_REJECTED', message: 'Offer is already rejected.' } });
        return;
      }

      const now = new Date().toISOString();

      const rejectStep: OfferHistoryStep = {
        stepId: `step_${Date.now()}`,
        actorRole: 'FARMER',
        actorName: 'Farmer (You)',
        action: 'REJECTED',
        unitPrice: offer.unitPrice,
        quantity: offer.quantity,
        unit: offer.unit,
        notes: reason || 'Commercial quote declined by buyer.',
        timestamp: now,
      };

      const updated: ProcurementOffer = {
        ...offer,
        status: 'REJECTED',
        history: [...offer.history, rejectStep],
        updatedAt: now,
      };

      INITIAL_OFFERS[offerIdx] = updated;

      await auditLog({
        actorId: (req as any).user?.id || 'farmer_user_01',
        role: UserRole.FARMER,
        action: 'REJECT_PROCUREMENT_OFFER',
        resourceType: 'PRODUCT',
        resourceId: id,
        metadata: { reason },
      });

      res.status(200).json({
        data: updated,
        meta: { message: 'Offer rejected.' },
        error: null,
      });
    } catch (err: any) {
      res.status(500).json({ data: null, error: { message: err.message } });
    }
  }

  /**
   * GET /api/v1/offers/:id/messages
   * Retrieve chronological chat messages for an offer negotiation
   */
  static async getOfferMessages(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const offer = INITIAL_OFFERS.find((o) => o.id === id);
      if (!offer) {
        res.status(404).json({ data: null, error: { message: `Offer #${id} not found.` } });
        return;
      }

      if (!OFFER_CHAT_MESSAGES[id]) {
        // Pre-populate with realistic conversation history matching offer
        OFFER_CHAT_MESSAGES[id] = [
          {
            id: `msg_init_${id}_1`,
            offerId: id,
            senderId: offer.supplierId,
            senderRole: 'SUPPLIER',
            senderName: offer.supplierName,
            text: `Namaskar! We have submitted our formal quote of ₹${offer.unitPrice}/${offer.unit} for your tender "${offer.requirementTitle}". Curing and sorting verified as Grade A.`,
            messageType: 'TERMS_PROPOSAL',
            proposedPrice: offer.unitPrice,
            proposedQuantity: offer.quantity,
            unit: offer.unit,
            deliveryDate: offer.deliveryDate,
            deliveryTerms: offer.deliveryTerms,
            timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
            deliveryStatus: 'READ',
          },
          {
            id: `msg_init_${id}_2`,
            offerId: id,
            senderId: 'farmer_user_01',
            senderRole: 'FARMER',
            senderName: 'Farmer (You)',
            text: `Thank you for the quick quote. Can you confirm if delivery can be scheduled by ${offer.deliveryDate} at our depot? Also please ensure double-mesh packing.`,
            messageType: 'TEXT',
            timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
            deliveryStatus: 'READ',
          },
          {
            id: `msg_init_${id}_3`,
            offerId: id,
            senderId: offer.supplierId,
            senderRole: 'SUPPLIER',
            senderName: offer.supplierName,
            text: `Yes, 50kg ventilated mesh bags are guaranteed. Weight slip will be provided on dispatch. Let us know if you want to proceed with contract confirmation.`,
            messageType: 'TEXT',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            deliveryStatus: 'DELIVERED',
          },
        ];
      }

      res.status(200).json({
        data: OFFER_CHAT_MESSAGES[id],
        meta: { count: OFFER_CHAT_MESSAGES[id].length },
        error: null,
      });
    } catch (err: any) {
      res.status(500).json({ data: null, error: { message: err.message } });
    }
  }

  /**
   * POST /api/v1/offers/:id/messages
   * Send a chat message or revised terms in negotiation thread
   */
  static async sendOfferMessage(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const offer = INITIAL_OFFERS.find((o) => o.id === id);
      if (!offer) {
        res.status(404).json({ data: null, error: { message: `Offer #${id} not found.` } });
        return;
      }

      const {
        text,
        messageType = 'TEXT',
        proposedPrice,
        proposedQuantity,
        unit,
        deliveryDate,
        deliveryTerms,
        clientMsgId,
      } = req.body || {};

      if (!text || !text.trim()) {
        res.status(400).json({ data: null, error: { message: 'Message text cannot be empty.' } });
        return;
      }

      if (!OFFER_CHAT_MESSAGES[id]) {
        OFFER_CHAT_MESSAGES[id] = [];
      }

      // Deduplication check: if clientMsgId matches an existing message, return it safely
      if (clientMsgId) {
        const existing = OFFER_CHAT_MESSAGES[id].find((m) => m.id === clientMsgId);
        if (existing) {
          res.status(200).json({ data: existing, meta: { deduplicated: true }, error: null });
          return;
        }
      }

      const newMsgId = clientMsgId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newMsg: OfferChatMessage = {
        id: newMsgId,
        offerId: id,
        senderId: (req as any).user?.id || 'farmer_user_01',
        senderRole: 'FARMER',
        senderName: 'Farmer (You)',
        text: text.trim(),
        messageType,
        proposedPrice: proposedPrice ? Number(proposedPrice) : undefined,
        proposedQuantity: proposedQuantity ? Number(proposedQuantity) : undefined,
        unit: unit || offer.unit,
        deliveryDate: deliveryDate || offer.deliveryDate,
        deliveryTerms: deliveryTerms || offer.deliveryTerms,
        timestamp: new Date().toISOString(),
        deliveryStatus: 'DELIVERED',
      };

      OFFER_CHAT_MESSAGES[id].push(newMsg);

      res.status(201).json({
        data: newMsg,
        meta: { message: 'Message delivered to supplier.' },
        error: null,
      });
    } catch (err: any) {
      res.status(500).json({ data: null, error: { message: err.message } });
    }
  }

  /**
   * GET /api/v1/offers/:id/history
   * Retrieve complete chronological history of negotiation rounds with step diffs
   */
  static async getOfferHistory(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const offer = INITIAL_OFFERS.find((o) => o.id === id);
      if (!offer) {
        res.status(404).json({ data: null, error: { message: `Offer #${id} not found.` } });
        return;
      }

      // Compute step-by-step diffs
      const steps = offer.history.map((step, idx) => {
        const prev = idx > 0 ? offer.history[idx - 1] : null;
        const priceDiff = prev ? step.unitPrice - prev.unitPrice : 0;
        const qtyDiff = prev ? step.quantity - prev.quantity : 0;
        const produceAmt = step.quantity * step.unitPrice;
        const cessAmt = Math.round(produceAmt * 0.01);
        const handlingAmt = Math.round(step.quantity * 15);
        const landedEst = produceAmt + offer.deliveryCost + cessAmt + handlingAmt;

        return {
          ...step,
          roundNumber: idx + 1,
          priceDiffFromPrevious: priceDiff,
          priceDiffPct: prev && prev.unitPrice > 0 ? Math.round((priceDiff / prev.unitPrice) * 1000) / 10 : 0,
          quantityDiffFromPrevious: qtyDiff,
          totalLandedAtStep: landedEst,
          effectiveCostPerUnit: Math.round((landedEst / step.quantity) * 100) / 100,
        };
      });

      res.status(200).json({
        data: {
          offerId: offer.id,
          requirementId: offer.requirementId,
          requirementTitle: offer.requirementTitle,
          supplierName: offer.supplierName,
          cropName: offer.cropName,
          currentStatus: offer.status,
          totalRounds: steps.length,
          steps,
        },
        error: null,
      });
    } catch (err: any) {
      res.status(500).json({ data: null, error: { message: err.message } });
    }
  }

  /**
   * GET /api/v1/offers/:id/summary
   * Retrieve executive summary of negotiation: initial vs current terms, confirmed/estimated savings, and next valid actions
   */
  static async getOfferSummary(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const offer = INITIAL_OFFERS.find((o) => o.id === id);
      if (!offer) {
        res.status(404).json({ data: null, error: { message: `Offer #${id} not found.` } });
        return;
      }

      const initialStep = offer.history[0] || {
        unitPrice: offer.targetPrice || offer.unitPrice,
        quantity: offer.quantity,
        deliveryDate: offer.deliveryDate,
        deliveryTerms: offer.deliveryTerms,
        paymentTerms: offer.paymentTerms,
      };

      const initialProduceCost = initialStep.quantity * initialStep.unitPrice;
      const initialTotalLanded =
        initialProduceCost +
        offer.deliveryCost +
        Math.round(initialProduceCost * 0.01) +
        Math.round(initialStep.quantity * 15);

      const savingsAmount = initialTotalLanded - offer.totalLandedAmount;
      const isConfirmedSavings = offer.status === 'ACCEPTED';

      let outstandingDecision = '';
      let nextValidActions: string[] = [];

      switch (offer.status) {
        case 'PENDING_FARMER':
          outstandingDecision = `Supplier ${offer.supplierName} quoted ₹${offer.unitPrice}/${offer.unit}. Action required: Review and Accept or Counter.`;
          nextValidActions = ['ACCEPT_OFFER', 'SUBMIT_COUNTER', 'DECLINE_OFFER', 'CHAT_WITH_SUPPLIER'];
          break;
        case 'PENDING_SUPPLIER':
        case 'COUNTERED':
          outstandingDecision = `Counteroffer of ₹${offer.unitPrice}/${offer.unit} submitted. Awaiting supplier acceptance or revision.`;
          nextValidActions = ['CHAT_WITH_SUPPLIER', 'REVISE_COUNTER'];
          break;
        case 'ACCEPTED':
          outstandingDecision = `Commercial terms finalized and bilateral contract generated. Sourcing commitment confirmed under safe escrow.`;
          nextValidActions = ['VIEW_CONTRACT', 'TRACK_DISPATCH', 'CHAT_WITH_SUPPLIER'];
          break;
        case 'REJECTED':
          outstandingDecision = `Negotiation closed without an agreement.`;
          nextValidActions = ['VIEW_MATCHES', 'RE_TENDER'];
          break;
        case 'DRAFT':
          outstandingDecision = `Purchase request draft saved. Submit when ready to send to supplier.`;
          nextValidActions = ['EDIT_OFFER', 'SUBMIT_OFFER'];
          break;
        default:
          outstandingDecision = `Offer validity concluded.`;
          nextValidActions = ['VIEW_MATCHES'];
      }

      res.status(200).json({
        data: {
          offerId: offer.id,
          requirementId: offer.requirementId,
          requirementTitle: offer.requirementTitle,
          supplierId: offer.supplierId,
          supplierName: offer.supplierName,
          supplierType: offer.supplierType,
          isVerified: offer.isVerified,
          cropName: offer.cropName,
          grade: offer.grade,
          variety: offer.variety,
          currentStatus: offer.status,
          totalNegotiationRounds: offer.history.length,
          initialTerms: {
            unitPrice: initialStep.unitPrice,
            quantity: initialStep.quantity,
            unit: offer.unit,
            deliveryDate: initialStep.deliveryDate || offer.deliveryDate,
            deliveryTerms: initialStep.deliveryTerms || offer.deliveryTerms,
            paymentTerms: initialStep.paymentTerms || offer.paymentTerms,
            totalLandedAmount: initialTotalLanded,
          },
          latestTerms: {
            unitPrice: offer.unitPrice,
            quantity: offer.quantity,
            unit: offer.unit,
            deliveryDate: offer.deliveryDate,
            deliveryTerms: offer.deliveryTerms,
            paymentTerms: offer.paymentTerms,
            totalLandedAmount: offer.totalLandedAmount,
          },
          deltas: {
            unitPriceDiff: offer.unitPrice - initialStep.unitPrice,
            unitPricePctDiff:
              initialStep.unitPrice > 0
                ? Math.round(((offer.unitPrice - initialStep.unitPrice) / initialStep.unitPrice) * 1000) / 10
                : 0,
            quantityDiff: offer.quantity - initialStep.quantity,
            landedCostDiff: offer.totalLandedAmount - initialTotalLanded,
          },
          costBreakdown: {
            produceBaseCost: offer.quantity * offer.unitPrice,
            deliveryFreightCost: offer.deliveryCost,
            taxesAndCessCost: offer.taxesAndCess,
            handlingCost: offer.handlingCost,
            totalLandedAmount: offer.totalLandedAmount,
            costPerUnitLanded: offer.costPerUnitLanded,
            unit: offer.unit,
          },
          savings: {
            amount: Math.abs(savingsAmount),
            isFavorable: savingsAmount >= 0,
            type: isConfirmedSavings ? 'CONFIRMED' : 'ESTIMATED',
            explanation: isConfirmedSavings
              ? 'Confirmed savings achieved through negotiated bilateral agreement'
              : 'Estimated potential savings subject to final supplier acceptance',
          },
          outstandingDecision,
          nextValidActions,
          updatedAt: offer.updatedAt,
        },
        error: null,
      });
    } catch (err: any) {
      res.status(500).json({ data: null, error: { message: err.message } });
    }
  }
}

// In-memory conversation store for offer negotiations
const OFFER_CHAT_MESSAGES: Record<string, OfferChatMessage[]> = {};

export interface OfferChatMessage {
  id: string;
  offerId: string;
  senderId: string;
  senderRole: 'FARMER' | 'SUPPLIER' | 'SYSTEM';
  senderName: string;
  text: string;
  messageType: 'TEXT' | 'TERMS_PROPOSAL' | 'SYSTEM_NOTICE';
  proposedPrice?: number;
  proposedQuantity?: number;
  unit?: string;
  deliveryDate?: string;
  deliveryTerms?: string;
  timestamp: string;
  deliveryStatus: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
}
