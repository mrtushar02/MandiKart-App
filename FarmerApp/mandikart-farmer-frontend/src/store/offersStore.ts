/**
 * MandiKart Farmer App — Offers & Negotiations Domain Store
 *
 * Backs Screens 21 to 25:
 * - 21: Incoming Supplier Offers
 * - 22: Sent Purchase Requests
 * - 23: Offer Details
 * - 24: Make an Offer
 * - 25: Counteroffer
 */

import { create } from 'zustand';
import { apiClient } from '@/services/apiClient';

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
  direction: 'INCOMING' | 'OUTGOING';
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
  taxesAndCess: number;
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

const FALLBACK_OFFERS: ProcurementOffer[] = [
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
    validityUntil: new Date(Date.now() - 12 * 3600000).toISOString(),
    status: 'DRAFT',
    notes: 'Draft purchase request prepared by sourcing manager.',
    history: [],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

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

export interface OfferHistoryStepDetail extends OfferHistoryStep {
  roundNumber: number;
  priceDiffFromPrevious: number;
  priceDiffPct: number;
  quantityDiffFromPrevious: number;
  totalLandedAtStep: number;
  effectiveCostPerUnit: number;
}

export interface OfferHistoryResult {
  offerId: string;
  requirementId: string;
  requirementTitle: string;
  supplierName: string;
  cropName: string;
  currentStatus: string;
  totalRounds: number;
  steps: OfferHistoryStepDetail[];
}

export interface OfferSummaryResult {
  offerId: string;
  requirementId: string;
  requirementTitle: string;
  supplierId: string;
  supplierName: string;
  supplierType: string;
  isVerified: boolean;
  cropName: string;
  grade: string;
  variety: string;
  currentStatus: string;
  totalNegotiationRounds: number;
  initialTerms: {
    unitPrice: number;
    quantity: number;
    unit: string;
    deliveryDate: string;
    deliveryTerms: string;
    paymentTerms: string;
    totalLandedAmount: number;
  };
  latestTerms: {
    unitPrice: number;
    quantity: number;
    unit: string;
    deliveryDate: string;
    deliveryTerms: string;
    paymentTerms: string;
    totalLandedAmount: number;
  };
  deltas: {
    unitPriceDiff: number;
    unitPricePctDiff: number;
    quantityDiff: number;
    landedCostDiff: number;
  };
  costBreakdown: {
    produceBaseCost: number;
    deliveryFreightCost: number;
    taxesAndCessCost: number;
    handlingCost: number;
    totalLandedAmount: number;
    costPerUnitLanded: number;
    unit: string;
  };
  savings: {
    amount: number;
    isFavorable: boolean;
    type: 'CONFIRMED' | 'ESTIMATED';
    explanation: string;
  };
  outstandingDecision: string;
  nextValidActions: string[];
  updatedAt: string;
}

interface OffersState {
  incomingOffers: ProcurementOffer[];
  sentOffers: ProcurementOffer[];
  currentOffer: ProcurementOffer | null;
  messagesByOfferId: Record<string, OfferChatMessage[]>;
  historyByOfferId: Record<string, OfferHistoryResult>;
  summaryByOfferId: Record<string, OfferSummaryResult>;
  isLoading: boolean;
  error: string | null;

  fetchIncomingOffers: (params?: { requirementId?: string; status?: string; search?: string }) => Promise<ProcurementOffer[]>;
  fetchSentOffers: (params?: { requirementId?: string; status?: string; search?: string }) => Promise<ProcurementOffer[]>;
  fetchOfferById: (id: string) => Promise<ProcurementOffer | null>;
  createOffer: (offerData: any) => Promise<{ success: boolean; data?: ProcurementOffer; error?: string }>;
  counterOffer: (
    id: string,
    counterData: {
      counterPricePerUnit: number;
      counterQuantity?: number;
      deliveryDate?: string;
      deliveryTerms?: string;
      paymentTerms?: string;
      notes?: string;
    }
  ) => Promise<{ success: boolean; data?: ProcurementOffer; error?: string }>;
  acceptOffer: (id: string) => Promise<{ success: boolean; data?: ProcurementOffer; error?: string }>;
  rejectOffer: (id: string, reason?: string) => Promise<{ success: boolean; data?: ProcurementOffer; error?: string }>;

  fetchOfferMessages: (offerId: string) => Promise<OfferChatMessage[]>;
  sendOfferMessage: (
    offerId: string,
    messageData: {
      text: string;
      messageType?: 'TEXT' | 'TERMS_PROPOSAL' | 'SYSTEM_NOTICE';
      proposedPrice?: number;
      proposedQuantity?: number;
      unit?: string;
      deliveryDate?: string;
      deliveryTerms?: string;
      clientMsgId?: string;
    }
  ) => Promise<{ success: boolean; data?: OfferChatMessage; error?: string }>;
  fetchOfferHistory: (offerId: string) => Promise<OfferHistoryResult | null>;
  fetchOfferSummary: (offerId: string) => Promise<OfferSummaryResult | null>;
}

export const useOffersStore = create<OffersState>()((set, get) => ({
  incomingOffers: FALLBACK_OFFERS.filter((o) => o.direction === 'INCOMING'),
  sentOffers: FALLBACK_OFFERS.filter((o) => o.direction === 'OUTGOING'),
  currentOffer: null,
  messagesByOfferId: {},
  historyByOfferId: {},
  summaryByOfferId: {},
  isLoading: false,
  error: null,

  fetchIncomingOffers: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.getOffers({
        direction: 'INCOMING',
        requirementId: params?.requirementId,
        status: params?.status,
        search: params?.search,
      });
      if (Array.isArray(res) && res.length > 0) {
        set({ incomingOffers: res, isLoading: false });
        return res;
      }
    } catch (e: any) {
      console.warn('Backend getOffers incoming fallback:', e);
    }

    // Local fallback
    let list = FALLBACK_OFFERS.filter((o) => o.direction === 'INCOMING');
    if (params?.status && params.status !== 'ALL') {
      list = list.filter((o) => o.status === params.status);
    }
    if (params?.requirementId) {
      list = list.filter((o) => o.requirementId === params.requirementId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.cropName.toLowerCase().includes(q) ||
          o.supplierName.toLowerCase().includes(q) ||
          o.requirementTitle.toLowerCase().includes(q)
      );
    }

    set({ incomingOffers: list, isLoading: false });
    return list;
  },

  fetchSentOffers: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.getOffers({
        direction: 'OUTGOING',
        requirementId: params?.requirementId,
        status: params?.status,
        search: params?.search,
      });
      if (Array.isArray(res) && res.length > 0) {
        set({ sentOffers: res, isLoading: false });
        return res;
      }
    } catch (e: any) {
      console.warn('Backend getOffers sent fallback:', e);
    }

    // Local fallback
    let list = FALLBACK_OFFERS.filter((o) => o.direction === 'OUTGOING');
    if (params?.status && params.status !== 'ALL') {
      list = list.filter((o) => o.status === params.status);
    }
    if (params?.requirementId) {
      list = list.filter((o) => o.requirementId === params.requirementId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.cropName.toLowerCase().includes(q) ||
          o.supplierName.toLowerCase().includes(q) ||
          o.requirementTitle.toLowerCase().includes(q)
      );
    }

    set({ sentOffers: list, isLoading: false });
    return list;
  },

  fetchOfferById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.getOfferById(id);
      if (res && res.id) {
        set({ currentOffer: res, isLoading: false });
        return res;
      }
    } catch (e: any) {
      console.warn('Backend getOfferById fallback:', e);
    }

    const local = FALLBACK_OFFERS.find((o) => o.id === id) || null;
    set({ currentOffer: local, isLoading: false });
    return local;
  },

  createOffer: async (offerData) => {
    try {
      const res = await apiClient.createOffer(offerData);
      if (res && res.id) {
        set((state) => ({
          sentOffers: [res, ...state.sentOffers],
        }));
        return { success: true, data: res };
      }
    } catch (e: any) {
      console.warn('Backend createOffer fallback:', e);
    }

    // Local fallback creation
    const qtyNum = Number(offerData.quantity || 100);
    const priceNum = Number(offerData.unitPrice || 2400);
    const produceCost = qtyNum * priceNum;
    const freight = Math.round(qtyNum * 35);
    const cess = Math.round(produceCost * 0.01);
    const handling = Math.round(qtyNum * 15);
    const landedTotal = produceCost + freight + cess + handling;
    const unitLanded = Math.round((landedTotal / qtyNum) * 100) / 100;

    const newOffer: ProcurementOffer = {
      id: `OFFER-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      requirementId: offerData.requirementId || `REQ-${Date.now()}`,
      requirementTitle: offerData.requirementTitle || `${offerData.cropName || 'Produce'} Purchase Request`,
      direction: 'OUTGOING',
      supplierId: offerData.supplierId,
      supplierName: offerData.supplierName || 'Verified Supplier',
      supplierType: offerData.supplierType || 'FPO_CLUSTER',
      isVerified: true,
      cropName: offerData.cropName || 'Produce',
      grade: offerData.grade || 'Grade A',
      variety: offerData.variety || 'Standard Grade',
      quantity: qtyNum,
      unit: offerData.unit || 'quintal',
      unitPrice: priceNum,
      targetPrice: offerData.targetPrice || priceNum,
      priceDiffPerUnit: offerData.targetPrice ? priceNum - offerData.targetPrice : 0,
      deliveryCost: freight,
      isDeliveryCostEstimated: true,
      taxesAndCess: cess,
      handlingCost: handling,
      volumeDiscount: 0,
      totalLandedAmount: landedTotal,
      costPerUnitLanded: unitLanded,
      deliveryDate: offerData.deliveryDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      deliveryLocation: offerData.deliveryLocation || 'Destination Depot',
      deliveryTerms: offerData.deliveryTerms || 'SELLER_DELIVERY',
      paymentTerms: offerData.paymentTerms || 'Direct Escrow (T+1 on weighbridge slip)',
      advanceRequiredPct: 0,
      validityUntil: new Date(Date.now() + 48 * 3600000).toISOString(),
      status: offerData.isDraft ? 'DRAFT' : 'PENDING_SUPPLIER',
      notes: offerData.notes || '',
      history: offerData.isDraft
        ? []
        : [
            {
              stepId: `step_${Date.now()}`,
              actorRole: 'FARMER',
              actorName: 'Farmer (You)',
              action: 'INITIAL_OFFER',
              unitPrice: priceNum,
              quantity: qtyNum,
              unit: offerData.unit || 'quintal',
              notes: offerData.notes,
              timestamp: new Date().toISOString(),
            },
          ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    FALLBACK_OFFERS.unshift(newOffer);
    set((state) => ({
      sentOffers: [newOffer, ...state.sentOffers],
    }));

    return { success: true, data: newOffer };
  },

  counterOffer: async (id, counterData) => {
    try {
      const res = await apiClient.counterOffer(id, counterData);
      if (res && res.id) {
        set((state) => ({
          currentOffer: res,
          incomingOffers: state.incomingOffers.map((o) => (o.id === id ? res : o)),
          sentOffers: state.sentOffers.map((o) => (o.id === id ? res : o)),
        }));
        return { success: true, data: res };
      }
    } catch (e: any) {
      console.warn('Backend counterOffer fallback:', e);
    }

    const offer = get().currentOffer || FALLBACK_OFFERS.find((o) => o.id === id);
    if (!offer) {
      return { success: false, error: 'Offer not found' };
    }

    if (offer.status === 'ACCEPTED' || offer.status === 'REJECTED' || offer.status === 'EXPIRED') {
      return { success: false, error: `Cannot counteroffer an offer that is already ${offer.status}.` };
    }

    const newPrice = Number(counterData.counterPricePerUnit);
    const newQty = counterData.counterQuantity ? Number(counterData.counterQuantity) : offer.quantity;
    const produceCost = newQty * newPrice;
    const cess = Math.round(produceCost * 0.01);
    const handling = Math.round(newQty * 15);
    const totalLanded = produceCost + offer.deliveryCost + cess + handling;
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
      deliveryDate: counterData.deliveryDate || offer.deliveryDate,
      deliveryTerms: counterData.deliveryTerms || offer.deliveryTerms,
      paymentTerms: counterData.paymentTerms || offer.paymentTerms,
      notes: counterData.notes || 'Farmer revised counteroffer terms.',
      timestamp: now,
    };

    const updated: ProcurementOffer = {
      ...offer,
      unitPrice: newPrice,
      quantity: newQty,
      priceDiffPerUnit: newPrice - offer.targetPrice,
      taxesAndCess: cess,
      handlingCost: handling,
      totalLandedAmount: totalLanded,
      costPerUnitLanded: unitLanded,
      deliveryDate: counterData.deliveryDate || offer.deliveryDate,
      deliveryTerms: (counterData.deliveryTerms as any) || offer.deliveryTerms,
      paymentTerms: counterData.paymentTerms || offer.paymentTerms,
      notes: counterData.notes || offer.notes,
      status: 'COUNTERED',
      history: [...offer.history, newStep],
      updatedAt: now,
    };

    const idx = FALLBACK_OFFERS.findIndex((o) => o.id === id);
    if (idx >= 0) FALLBACK_OFFERS[idx] = updated;

    set((state) => ({
      currentOffer: updated,
      incomingOffers: state.incomingOffers.map((o) => (o.id === id ? updated : o)),
      sentOffers: state.sentOffers.map((o) => (o.id === id ? updated : o)),
    }));

    return { success: true, data: updated };
  },

  acceptOffer: async (id) => {
    try {
      const res = await apiClient.acceptOffer(id);
      if (res && res.id) {
        set((state) => ({
          currentOffer: res,
          incomingOffers: state.incomingOffers.map((o) => (o.id === id ? res : o)),
        }));
        return { success: true, data: res };
      }
    } catch (e: any) {
      console.warn('Backend acceptOffer fallback:', e);
    }

    const offer = get().currentOffer || FALLBACK_OFFERS.find((o) => o.id === id);
    if (!offer) return { success: false, error: 'Offer not found' };

    const now = new Date().toISOString();
    const updated: ProcurementOffer = {
      ...offer,
      status: 'ACCEPTED',
      history: [
        ...offer.history,
        {
          stepId: `step_${Date.now()}`,
          actorRole: 'FARMER',
          actorName: 'Farmer (You)',
          action: 'ACCEPTED',
          unitPrice: offer.unitPrice,
          quantity: offer.quantity,
          unit: offer.unit,
          notes: 'Commercial terms accepted. Escrow procurement contract generated.',
          timestamp: now,
        },
      ],
      updatedAt: now,
    };

    const idx = FALLBACK_OFFERS.findIndex((o) => o.id === id);
    if (idx >= 0) FALLBACK_OFFERS[idx] = updated;

    set((state) => ({
      currentOffer: updated,
      incomingOffers: state.incomingOffers.map((o) => (o.id === id ? updated : o)),
    }));

    return { success: true, data: updated };
  },

  rejectOffer: async (id, reason) => {
    try {
      const res = await apiClient.rejectOffer(id, reason);
      if (res && res.id) {
        set((state) => ({
          currentOffer: res,
          incomingOffers: state.incomingOffers.map((o) => (o.id === id ? res : o)),
        }));
        return { success: true, data: res };
      }
    } catch (e: any) {
      console.warn('Backend rejectOffer fallback:', e);
    }

    const offer = get().currentOffer || FALLBACK_OFFERS.find((o) => o.id === id);
    if (!offer) return { success: false, error: 'Offer not found' };

    const now = new Date().toISOString();
    const updated: ProcurementOffer = {
      ...offer,
      status: 'REJECTED',
      history: [
        ...offer.history,
        {
          stepId: `step_${Date.now()}`,
          actorRole: 'FARMER',
          actorName: 'Farmer (You)',
          action: 'REJECTED',
          unitPrice: offer.unitPrice,
          quantity: offer.quantity,
          unit: offer.unit,
          notes: reason || 'Offer declined.',
          timestamp: now,
        },
      ],
      updatedAt: now,
    };

    const idx = FALLBACK_OFFERS.findIndex((o) => o.id === id);
    if (idx >= 0) FALLBACK_OFFERS[idx] = updated;

    set((state) => ({
      currentOffer: updated,
      incomingOffers: state.incomingOffers.map((o) => (o.id === id ? updated : o)),
    }));

    return { success: true, data: updated };
  },

  fetchOfferMessages: async (offerId: string) => {
    try {
      const res = await apiClient.getOfferMessages(offerId);
      if (Array.isArray(res) && res.length > 0) {
        set((state) => ({
          messagesByOfferId: { ...state.messagesByOfferId, [offerId]: res },
        }));
        return res;
      }
    } catch (e: any) {
      console.warn('Backend getOfferMessages fallback:', e);
    }

    // Local fallback messages
    const existing = get().messagesByOfferId[offerId];
    if (existing && existing.length > 0) return existing;

    const offer = get().currentOffer || FALLBACK_OFFERS.find((o) => o.id === offerId);
    const initialMsgs: OfferChatMessage[] = [
      {
        id: `msg_fallback_${offerId}_1`,
        offerId,
        senderId: offer?.supplierId || 'sup_01',
        senderRole: 'SUPPLIER',
        senderName: offer?.supplierName || 'Verified Supplier',
        text: `Namaskar! We have submitted our initial quote of ₹${offer?.unitPrice || 2304}/${offer?.unit || 'quintal'} for your tender "${offer?.requirementTitle || 'Produce Sourcing'}". Grade A curing verified.`,
        messageType: 'TERMS_PROPOSAL',
        proposedPrice: offer?.unitPrice || 2304,
        proposedQuantity: offer?.quantity || 25,
        unit: offer?.unit || 'quintal',
        deliveryDate: offer?.deliveryDate,
        deliveryTerms: offer?.deliveryTerms,
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        deliveryStatus: 'READ',
      },
      {
        id: `msg_fallback_${offerId}_2`,
        offerId,
        senderId: 'farmer_user_01',
        senderRole: 'FARMER',
        senderName: 'Farmer (You)',
        text: `Thank you for the quote. Please confirm dispatch lead time and whether double-mesh bagging is included.`,
        messageType: 'TEXT',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        deliveryStatus: 'READ',
      },
      {
        id: `msg_fallback_${offerId}_3`,
        offerId,
        senderId: offer?.supplierId || 'sup_01',
        senderRole: 'SUPPLIER',
        senderName: offer?.supplierName || 'Verified Supplier',
        text: `Yes, 50kg ventilated mesh bags included. Dispatch ready within 2 business days. Let us know if terms are acceptable.`,
        messageType: 'TEXT',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        deliveryStatus: 'DELIVERED',
      },
    ];

    set((state) => ({
      messagesByOfferId: { ...state.messagesByOfferId, [offerId]: initialMsgs },
    }));
    return initialMsgs;
  },

  sendOfferMessage: async (offerId, messageData) => {
    try {
      const res = await apiClient.sendOfferMessage(offerId, messageData);
      if (res && res.id) {
        set((state) => {
          const list = state.messagesByOfferId[offerId] || [];
          // Deduplicate if already present
          const exists = list.some((m) => m.id === res.id || (messageData.clientMsgId && m.id === messageData.clientMsgId));
          const updated = exists ? list.map((m) => (m.id === res.id || m.id === messageData.clientMsgId ? res : m)) : [...list, res];
          return {
            messagesByOfferId: { ...state.messagesByOfferId, [offerId]: updated },
          };
        });
        return { success: true, data: res };
      }
    } catch (e: any) {
      console.warn('Backend sendOfferMessage fallback:', e);
    }

    // Local fallback message creation
    const newMsg: OfferChatMessage = {
      id: messageData.clientMsgId || `msg_local_${Date.now()}`,
      offerId,
      senderId: 'farmer_user_01',
      senderRole: 'FARMER',
      senderName: 'Farmer (You)',
      text: messageData.text.trim(),
      messageType: messageData.messageType || 'TEXT',
      proposedPrice: messageData.proposedPrice,
      proposedQuantity: messageData.proposedQuantity,
      unit: messageData.unit,
      deliveryDate: messageData.deliveryDate,
      deliveryTerms: messageData.deliveryTerms,
      timestamp: new Date().toISOString(),
      deliveryStatus: 'DELIVERED',
    };

    set((state) => {
      const list = state.messagesByOfferId[offerId] || [];
      return {
        messagesByOfferId: { ...state.messagesByOfferId, [offerId]: [...list, newMsg] },
      };
    });

    return { success: true, data: newMsg };
  },

  fetchOfferHistory: async (offerId: string) => {
    try {
      const res = await apiClient.getOfferHistory(offerId);
      if (res && res.steps) {
        set((state) => ({
          historyByOfferId: { ...state.historyByOfferId, [offerId]: res },
        }));
        return res;
      }
    } catch (e: any) {
      console.warn('Backend getOfferHistory fallback:', e);
    }

    // Local fallback history calculation
    const offer = get().currentOffer || FALLBACK_OFFERS.find((o) => o.id === offerId);
    if (!offer) return null;

    const steps: OfferHistoryStepDetail[] = offer.history.map((step, idx) => {
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

    const result: OfferHistoryResult = {
      offerId: offer.id,
      requirementId: offer.requirementId,
      requirementTitle: offer.requirementTitle,
      supplierName: offer.supplierName,
      cropName: offer.cropName,
      currentStatus: offer.status,
      totalRounds: steps.length,
      steps,
    };

    set((state) => ({
      historyByOfferId: { ...state.historyByOfferId, [offerId]: result },
    }));
    return result;
  },

  fetchOfferSummary: async (offerId: string) => {
    try {
      const res = await apiClient.getOfferSummary(offerId);
      if (res && res.offerId) {
        set((state) => ({
          summaryByOfferId: { ...state.summaryByOfferId, [offerId]: res },
        }));
        return res;
      }
    } catch (e: any) {
      console.warn('Backend getOfferSummary fallback:', e);
    }

    // Local fallback summary
    const offer = get().currentOffer || FALLBACK_OFFERS.find((o) => o.id === offerId);
    if (!offer) return null;

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
        outstandingDecision = `Supplier ${offer.supplierName} quoted ₹${offer.unitPrice}/${offer.unit}. Action required: Review and decide whether to Accept, Counter, or Decline.`;
        nextValidActions = ['ACCEPT_OFFER', 'SUBMIT_COUNTER', 'DECLINE_OFFER', 'CHAT_WITH_SUPPLIER'];
        break;
      case 'PENDING_SUPPLIER':
      case 'COUNTERED':
        outstandingDecision = `Counteroffer of ₹${offer.unitPrice}/${offer.unit} submitted. Awaiting supplier review or revised response.`;
        nextValidActions = ['CHAT_WITH_SUPPLIER', 'REVISE_COUNTER'];
        break;
      case 'ACCEPTED':
        outstandingDecision = `Commercial terms finalized and bilateral contract generated. Procurement commitment secured under safe escrow.`;
        nextValidActions = ['VIEW_CONTRACT', 'TRACK_DISPATCH', 'CHAT_WITH_SUPPLIER'];
        break;
      case 'REJECTED':
        outstandingDecision = `Negotiation closed without agreement.`;
        nextValidActions = ['VIEW_MATCHES', 'RE_TENDER'];
        break;
      default:
        outstandingDecision = `Draft or expired negotiation.`;
        nextValidActions = ['VIEW_MATCHES'];
    }

    const summary: OfferSummaryResult = {
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
    };

    set((state) => ({
      summaryByOfferId: { ...state.summaryByOfferId, [offerId]: summary },
    }));
    return summary;
  },
}));
