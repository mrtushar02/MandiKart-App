/**
 * MandiKart Farmer App — Sell Domain Store (Zustand)
 *
 * Core selling marketplace state:
 * - Verified buyers directory
 * - Buyer requests & negotiations with offer history
 * - Active selling listings created by farmer
 * - Sales history & transaction receipts
 * - Recommendation & matching engine
 * - Atomic order handoff contract
 */

import { create } from 'zustand';
import { useProduceStore } from './produceStore';
import { useOrderStore } from './orderStore';

export interface ExecuteSaleParams {
  cropId?: string;
  cropName: string;
  variety?: string;
  quantityKg: number;
  grade?: string;
  pricePerKg: number;
  buyerName: string;
  buyerType?: BuyerType | string;
  transportPerKg?: number;
  cropImage?: string;
  paymentMethod?: string;
  location?: string;
}

export type BuyerRequestStatus = 'New' | 'Pending' | 'Negotiating' | 'Accepted' | 'Rejected';
export type ListingStatus = 'Available' | 'Buyer Interested' | 'Under Discussion' | 'Reserved' | 'Sold';
export type BuyerType = 'Wholesale Buyer' | 'Food Processor' | 'Retail Chain Hub' | 'Institutional Buyer' | 'Exporter';

export interface NegotiationMessage {
  id: string;
  sender: 'buyer' | 'farmer';
  senderName: string;
  pricePerKg: number;
  quantityKg: number;
  message?: string;
  timestamp: string;
}

export interface BuyerProfile {
  id: string;
  name: string;
  businessType: BuyerType;
  verified: boolean;
  rating: number;
  totalDeals: number;
  location: string;
  distanceKm: number;
  avatar: string;
  paymentTerms: string;
  pickupPreference: string;
}

export interface BuyerRequest {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerType: BuyerType;
  verified: boolean;
  avatar: string;
  rating: number;
  cropName: string;
  variety?: string;
  quantityKg: number;
  unit?: string;
  qualityGrade: string;
  offerPricePerKg: number;
  marketReferencePricePerKg: number;
  distanceKm: number;
  estimatedTransportPerKg: number;
  estimatedNetReturnPerKg: number;
  pickupDate: string;
  receivedAt: string;
  expiresInHours: number;
  status: BuyerRequestStatus;
  history: NegotiationMessage[];
  farmerNote?: string;
  rejectionReason?: string;
}

export interface SellingListing {
  id: string;
  cropId: string;
  cropName: string;
  variety?: string;
  totalKg: number;
  availableKg: number;
  grade: string;
  targetPricePerKg: number;
  availableFrom: string;
  pickupLocation: string;
  notes?: string;
  status: ListingStatus;
  createdAt: string;
  interestedBuyersCount: number;
}

export interface CompletedSale {
  id: string;
  orderId: string;
  cropName: string;
  variety?: string;
  quantityKg: number;
  agreedPricePerKg: number;
  grossAmount: number;
  transportCost: number;
  platformFee: number;
  netPayout: number;
  buyerName: string;
  buyerType: BuyerType;
  saleDate: string;
  status: 'Completed' | 'Payment Pending' | 'In Transit';
  paymentMethod: string;
  transactionRef: string;
}

export interface SellingOpportunity {
  id: string;
  buyer: BuyerProfile;
  cropName: string;
  requiredKg: number;
  requiredGrade: string;
  offerPricePerKg: number;
  marketReferencePricePerKg: number;
  demandStatus: 'High' | 'Medium' | 'Low';
  estimatedTransportPerKg: number;
  estimatedNetReturnPerKg: number;
  matchScorePct: number;
  isRecommended: boolean;
  recommendationReason: string;
  matchChecklist: {
    cropMatches: boolean;
    quantityMatches: boolean;
    qualityMatches: boolean;
    locationSuitable: boolean;
    availabilityMatches: boolean;
  };
}

export interface BulkCommercialDemand {
  id: string;
  buyerId?: string;
  buyerName: string;
  buyerPhone?: string;
  buyerCompany?: string;
  buyerType: 'Food Processor' | 'Retail Chain Hub' | 'Institutional Buyer' | 'Exporter' | 'Wholesaler' | string;
  cropName: string;
  grade?: 'A' | 'B' | 'C' | string;
  requiredQuantity?: number;
  quantityUnit?: 'quintal' | 'tonne' | 'kg' | string;
  maxTargetPricePerUnit?: number;
  deliveryLocation?: string;
  requiredByDate?: string;
  status: 'OPEN' | 'MATCHED' | 'NEGOTIATING' | 'FULFILLED' | 'PARTIALLY_FILLED' | 'CLOSED' | string;
  matchedSupplierCount?: number;
  inspectionRequirement?: string;
  paymentTerms: string;
  createdAt?: string;

  // Additional rich matching & pricing fields
  targetPricePerKg?: number;
  marketBenchmarkPricePerKg?: number;
  minVolumeKg?: number;
  maxVolumeKg?: number;
  urgency?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'FLEXIBLE' | string;
  deliveryDepot?: string;
  distanceKm?: number;
  qualityStandard?: string;
  deadlineDate?: string;
  verifiedBuyer?: boolean;
  logisticsArrangedBy?: 'BUYER' | 'SELLER' | 'MANDIKART_ASSISTED' | string;
  allowPartialFulfillment?: boolean;
  matchScore?: number;
  matchReasons?: string[];
}

interface SellStoreState {
  buyers: BuyerProfile[];
  requests: BuyerRequest[];
  bulkDemands: BulkCommercialDemand[];
  listings: SellingListing[];
  salesHistory: CompletedSale[];

  // Actions
  executeSale: (params: ExecuteSaleParams) => { success: boolean; orderId?: string; saleId?: string; error?: string };
  acceptRequest: (requestId: string) => { success: boolean; orderId?: string; error?: string };
  counterOffer: (requestId: string, counterPrice: number, counterQty: number, message?: string) => void;
  rejectRequest: (requestId: string, reason?: string) => void;
  createListing: (listing: Omit<SellingListing, 'id' | 'createdAt' | 'interestedBuyersCount'>) => SellingListing;
  getOpportunitiesForCrop: (cropName: string, availableKg: number, grade: string) => SellingOpportunity[];
  getRequestById: (requestId: string) => BuyerRequest | undefined;
  getSaleById: (saleId: string) => CompletedSale | undefined;
  mergeBackendNegotiations: (negList: any[]) => void;
  fetchBulkDemands: (cropFilter?: string) => Promise<void>;
  submitBulkQuote: (id: string, priceOrData: any, qty?: number, notes?: string) => Promise<any>;
}

// Initial Realistic Buyers
const INITIAL_BUYERS: BuyerProfile[] = [
  {
    id: 'buyer_abc',
    name: 'ABC Foods & Agro Procurements',
    businessType: 'Food Processor',
    verified: true,
    rating: 4.8,
    totalDeals: 1240,
    location: 'Nashik Industrial Area, MIDC',
    distanceKm: 40,
    avatar: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&auto=format&fit=crop&q=80',
    paymentTerms: 'Instant Bank Transfer upon Weighbridge slip',
    pickupPreference: 'Buyer vehicle farmgate pickup',
  },
  {
    id: 'buyer_freshmart',
    name: 'FreshMart Supermarkets Regional Hub',
    businessType: 'Retail Chain Hub',
    verified: true,
    rating: 4.9,
    totalDeals: 2150,
    location: 'Kalyan Logistics Park',
    distanceKm: 48,
    avatar: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=120&auto=format&fit=crop&q=80',
    paymentTerms: 'MandiKart Escrow (Released in 12h)',
    pickupPreference: 'Daily morning farmgate collection',
  },
  {
    id: 'buyer_reliance',
    name: 'Reliance Fresh Sourcing Center',
    businessType: 'Retail Chain Hub',
    verified: true,
    rating: 4.7,
    totalDeals: 3400,
    location: 'Bhiwandi Sourcing Terminal',
    distanceKm: 65,
    avatar: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=120&auto=format&fit=crop&q=80',
    paymentTerms: 'Direct IMPS / NEFT on dispatch',
    pickupPreference: 'Dedicated Reefer Truck provided',
  },
  {
    id: 'buyer_local',
    name: 'Kalyan Wholesale APMC Traders',
    businessType: 'Wholesale Buyer',
    verified: true,
    rating: 4.6,
    totalDeals: 880,
    location: 'Kalyan APMC Yard',
    distanceKm: 32,
    avatar: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=120&auto=format&fit=crop&q=80',
    paymentTerms: 'Same-day bank settlement',
    pickupPreference: 'Mandi drop or shared transit',
  },
];

// Initial Incoming Buyer Requests (Empty by default — populated live from real buyer submissions)
const INITIAL_REQUESTS: BuyerRequest[] = [];

// Initial Listings (Populated dynamically from farmer's active produce inventory)
const INITIAL_LISTINGS: SellingListing[] = [];

// Initial Sales History (Populated dynamically from completed orders)
const INITIAL_SALES: CompletedSale[] = [];

export const useSellStore = create<SellStoreState>((set, get) => ({
  buyers: INITIAL_BUYERS,
  requests: INITIAL_REQUESTS,
  bulkDemands: [],
  listings: INITIAL_LISTINGS,
  salesHistory: INITIAL_SALES,

  executeSale: (params: ExecuteSaleParams) => {
    const produceStore = useProduceStore.getState();
    const matchingCrop = params.cropId
      ? produceStore.getCropById(params.cropId)
      : produceStore.crops.find(
          (c) => c.cropName.toLowerCase() === params.cropName.toLowerCase()
        );

    if (matchingCrop && matchingCrop.availableKg < params.quantityKg) {
      return {
        success: false,
        error: `Insufficient available stock. You have ${matchingCrop.availableKg.toLocaleString()} kg available, but attempted to sell ${params.quantityKg.toLocaleString()} kg.`,
      };
    }

    const grossVal = params.quantityKg * params.pricePerKg;
    const transportTotal = Math.round(params.quantityKg * (params.transportPerKg ?? 0.8));
    const netTotal = grossVal - transportTotal;
    const saleId = `sale_${Date.now()}`;

    // 1. Deduct from produceStore
    if (matchingCrop) {
      const remainingAvailable = Math.max(0, matchingCrop.availableKg - params.quantityKg);
      const updatedSold = (matchingCrop.soldKg || 0) + params.quantityKg;
      produceStore.updateCropDetails(matchingCrop.id, {
        availableKg: remainingAvailable,
        soldKg: updatedSold,
        totalKg: remainingAvailable + matchingCrop.reservedKg + updatedSold,
      });
    }

    // 2. Create real order in orderStore
    const newOrder = useOrderStore.getState().createOrderFromSale({
      cropName: params.cropName,
      cropVariety: params.variety || matchingCrop?.variety || 'Harvest Batch',
      grade: params.grade || matchingCrop?.grade || 'Grade A',
      quantityKg: params.quantityKg,
      cropImage: params.cropImage || matchingCrop?.imageUri,
      buyerName: params.buyerName,
      buyerType: typeof params.buyerType === 'string' ? params.buyerType : undefined,
      ratePerKg: params.pricePerKg,
      grossAmount: grossVal,
      transportDeduction: transportTotal,
      netPayout: netTotal,
      location: params.location || matchingCrop?.location || 'Farmgate, Main Farm Storage',
      paymentMode: params.paymentMethod || 'MandiKart Escrow Guaranteed',
    });

    const orderId = newOrder.orderNumber;

    // 3. Record in salesHistory
    const completedSale: CompletedSale = {
      id: saleId,
      orderId: orderId,
      cropName: params.cropName,
      variety: params.variety || matchingCrop?.variety,
      quantityKg: params.quantityKg,
      agreedPricePerKg: params.pricePerKg,
      grossAmount: grossVal,
      transportCost: transportTotal,
      platformFee: 0,
      netPayout: netTotal,
      buyerName: params.buyerName,
      buyerType: (params.buyerType as BuyerType) || 'Food Processor',
      saleDate: 'Today (Just now)',
      status: 'In Transit',
      paymentMethod: params.paymentMethod || 'MandiKart Escrow (Guaranteed)',
      transactionRef: `TXN-${orderId.replace('#', '')}`,
    };

    set((state) => ({
      salesHistory: [completedSale, ...state.salesHistory],
    }));

    return { success: true, orderId, saleId };
  },

  acceptRequest: (requestId: string) => {
    const req = get().requests.find((r) => r.id === requestId);
    if (!req) {
      return { success: false, error: 'Request not found' };
    }

    // Safety check against produce inventory
    const produceStore = useProduceStore.getState();
    const matchingCrop = produceStore.crops.find(
      (c) => c.cropName.toLowerCase() === req.cropName.toLowerCase()
    );

    if (matchingCrop && matchingCrop.availableKg < req.quantityKg) {
      return {
        success: false,
        error: `Insufficient available stock. You have ${matchingCrop.availableKg.toLocaleString()} kg available, but the buyer requested ${req.quantityKg.toLocaleString()} kg.`,
      };
    }

    const grossVal = req.quantityKg * req.offerPricePerKg;
    const transportTotal = Math.round(req.quantityKg * req.estimatedTransportPerKg);
    const netTotal = grossVal - transportTotal;
    const saleId = `sale_${Date.now()}`;

    // 1. Move available inventory to sold in produceStore
    if (matchingCrop) {
      const remainingAvailable = Math.max(0, matchingCrop.availableKg - req.quantityKg);
      const updatedSold = (matchingCrop.soldKg || 0) + req.quantityKg;
      produceStore.updateCropDetails(matchingCrop.id, {
        availableKg: remainingAvailable,
        soldKg: updatedSold,
        totalKg: remainingAvailable + matchingCrop.reservedKg + updatedSold,
      });
    }

    // 2. Create real order in orderStore
    const newOrder = useOrderStore.getState().createOrderFromSale({
      cropName: req.cropName,
      cropVariety: req.variety || matchingCrop?.variety || 'Harvest Batch',
      grade: req.qualityGrade || matchingCrop?.grade || 'Grade A',
      quantityKg: req.quantityKg,
      cropImage: matchingCrop?.imageUri || req.avatar,
      buyerName: req.buyerName,
      buyerType: req.buyerType,
      ratePerKg: req.offerPricePerKg,
      grossAmount: grossVal,
      transportDeduction: transportTotal,
      netPayout: netTotal,
      location: matchingCrop?.location || 'Farmgate, Main Farm Storage',
      paymentMode: 'Direct Bank Settlement (Escrow)',
    });

    const orderId = newOrder.orderNumber;

    // 3. Mark request as Accepted & record in salesHistory
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === requestId ? { ...r, status: 'Accepted' } : r
      ),
      salesHistory: [
        {
          id: saleId,
          orderId: orderId,
          cropName: req.cropName,
          variety: req.variety,
          quantityKg: req.quantityKg,
          agreedPricePerKg: req.offerPricePerKg,
          grossAmount: grossVal,
          transportCost: transportTotal,
          platformFee: 0,
          netPayout: netTotal,
          buyerName: req.buyerName,
          buyerType: req.buyerType,
          saleDate: 'Today (Just now)',
          status: 'In Transit',
          paymentMethod: 'Direct Bank Settlement (Escrow)',
          transactionRef: `TXN-${orderId.replace('#', '')}`,
        },
        ...state.salesHistory,
      ],
    }));

    // 4. Trigger backend negotiation acceptance
    try {
      const { apiClient } = require('@/services/apiClient');
      apiClient.acceptNegotiation(requestId).catch((e: any) => {
        console.warn('[sellStore] Backend negotiation accept sync:', e);
      });
    } catch {}

    return { success: true, orderId };
  },

  counterOffer: (requestId: string, counterPrice: number, counterQty: number, message?: string) => {
    try {
      const { apiClient } = require('@/services/apiClient');
      apiClient.respondToNegotiation(requestId, 'COUNTER', counterPrice, counterQty, message).catch((e: any) => {
        console.warn('[sellStore] Backend counter sync:', e);
      });
    } catch {}

    set((state) => ({
      requests: state.requests.map((r) => {
        if (r.id === requestId) {
          const newMsg: NegotiationMessage = {
            id: `msg_${Date.now()}`,
            sender: 'farmer',
            senderName: 'You',
            pricePerKg: counterPrice,
            quantityKg: counterQty,
            message: message || `Countered at ₹${counterPrice}/kg for ${counterQty} kg.`,
            timestamp: 'Just now',
          };
          return {
            ...r,
            offerPricePerKg: counterPrice,
            quantityKg: counterQty,
            status: 'Negotiating',
            history: [...r.history, newMsg],
          };
        }
        return r;
      }),
    }));
  },

  rejectRequest: (requestId: string, reason?: string) => {
    try {
      const { apiClient } = require('@/services/apiClient');
      apiClient.respondToNegotiation(requestId, 'REJECT', undefined, undefined, reason).catch((e: any) => {
        console.warn('[sellStore] Backend reject sync:', e);
      });
    } catch {}

    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === requestId
          ? { ...r, status: 'Rejected', rejectionReason: reason || 'Not suitable' }
          : r
      ),
    }));
  },

  createListing: (listingData) => {
    const newListing: SellingListing = {
      ...listingData,
      id: `list_${Date.now()}`,
      createdAt: 'Today',
      interestedBuyersCount: 1,
    };

    set((state) => ({
      listings: [newListing, ...state.listings],
    }));

    return newListing;
  },

  getOpportunitiesForCrop: (cropName: string, availableKg: number, grade: string) => {
    const buyers = get().buyers;
    const bulkDemands = get().bulkDemands || [];

    // Filter matching bulk commercial demands
    const matchingBulk = bulkDemands.filter(
      (d) => !cropName || d.cropName.toLowerCase().includes(cropName.toLowerCase()) || cropName.toLowerCase().includes(d.cropName.toLowerCase())
    );

    const bulkOpps: SellingOpportunity[] = matchingBulk.map((demand, bIdx) => {
      const pricePerKg = demand.targetPricePerKg || (demand.quantityUnit === 'quintal'
        ? (demand.maxTargetPricePerUnit || 2500) / 100
        : demand.quantityUnit === 'tonne'
        ? (demand.maxTargetPricePerUnit || 25000) / 1000
        : (demand.maxTargetPricePerUnit || 25));
      const requiredKg = demand.minVolumeKg || (demand.quantityUnit === 'quintal'
        ? (demand.requiredQuantity || 10) * 100
        : demand.quantityUnit === 'tonne'
        ? (demand.requiredQuantity || 1) * 1000
        : (demand.requiredQuantity || 1000));
      const transportEst = 0.75;
      const estNet = Math.max(1, Math.round((pricePerKg - transportEst) * 100) / 100);

      const buyerProf: BuyerProfile = {
        id: demand.buyerId || demand.id || 'buyer_bulk',
        name: demand.buyerCompany || demand.buyerName || 'Commercial Buyer',
        businessType: (demand.buyerType || 'Food Processor') as BuyerType,
        verified: demand.verifiedBuyer ?? true,
        rating: 4.9,
        totalDeals: 350,
        location: demand.deliveryDepot || demand.deliveryLocation || 'Nashik Central Depot',
        distanceKm: demand.distanceKm || 25,
        avatar: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&auto=format&fit=crop&q=80',
        paymentTerms: demand.paymentTerms || 'Bank Transfer on Delivery',
        pickupPreference: 'Direct Farmgate Collection',
      };

      return {
        id: `opp_bulk_${demand.id}`,
        buyer: buyerProf,
        cropName: demand.cropName,
        requiredKg: Math.min(availableKg, requiredKg),
        requiredGrade: demand.grade ? `Grade ${demand.grade}` : (demand.qualityStandard || 'Grade A'),
        offerPricePerKg: pricePerKg,
        marketReferencePricePerKg: Math.round(pricePerKg * 0.96),
        demandStatus: 'High',
        estimatedTransportPerKg: transportEst,
        estimatedNetReturnPerKg: estNet,
        matchScorePct: 96 - bIdx * 2,
        isRecommended: bIdx === 0,
        recommendationReason: `Direct commercial bulk demand (${requiredKg.toLocaleString()} kg) from ${buyerProf.name}. Verified buyer with guaranteed escrow.`,
        matchChecklist: {
          cropMatches: true,
          quantityMatches: availableKg >= 100,
          qualityMatches: true,
          locationSuitable: true,
          availabilityMatches: true,
        },
      };
    });

    const standardOpps = buyers.map((buyer, index) => {
      // Benchmark adjustments based on crop
      let basePrice = 22;
      let marketRef = 22;
      let demand: 'High' | 'Medium' | 'Low' = 'High';

      if (cropName.toLowerCase().includes('tomato')) {
        basePrice = 20;
        marketRef = 18;
      } else if (cropName.toLowerCase().includes('potato')) {
        basePrice = 21;
        marketRef = 20;
      } else if (cropName.toLowerCase().includes('wheat')) {
        basePrice = 29;
        marketRef = 28.5;
      }

      // Slightly vary offers by buyer type
      const priceModifier = index === 0 ? 2.5 : index === 1 ? 1.8 : index === 2 ? 3.0 : 0.5;
      const offer = basePrice + priceModifier;
      const transportPerKg = Number((buyer.distanceKm * 0.035).toFixed(2));
      const estNet = Number((offer - transportPerKg).toFixed(2));

      // Match score calculation
      const matchScore = index === 0 ? 94 : index === 1 ? 89 : index === 2 ? 85 : 78;

      return {
        id: `opp_${buyer.id}_${cropName}`,
        buyer,
        cropName,
        requiredKg: Math.min(availableKg, 1500),
        requiredGrade: grade || 'Grade A',
        offerPricePerKg: offer,
        marketReferencePricePerKg: marketRef,
        demandStatus: demand,
        estimatedTransportPerKg: transportPerKg,
        estimatedNetReturnPerKg: estNet,
        matchScorePct: matchScore,
        isRecommended: bulkOpps.length === 0 && index === 0,
        recommendationReason:
          index === 0
            ? "Your quantity and Grade A quality match this buyer's requirement, and the estimated transport cost is relatively low."
            : `Verified buyer with ${buyer.totalDeals}+ completed deals and prompt farmgate collection.`,
        matchChecklist: {
          cropMatches: true,
          quantityMatches: availableKg >= 200,
          qualityMatches: true,
          locationSuitable: buyer.distanceKm <= 75,
          availabilityMatches: true,
        },
      };
    });

    return [...bulkOpps, ...standardOpps];
  },

  getRequestById: (requestId: string) => {
    return get().requests.find((r) => r.id === requestId);
  },

  getSaleById: (saleId: string) => {
    return get().salesHistory.find((s) => s.id === saleId);
  },

  mergeBackendNegotiations: (negList: any[]) => {
    set((state) => {
      // Filter out legacy mock items from existing state
      const currentReqs = [...state.requests].filter(
        (r) =>
          r &&
          r.id &&
          !r.id.startsWith('req_10') &&
          !r.id.startsWith('neg_101') &&
          !r.buyerName.includes('ABC Foods') &&
          !r.buyerName.includes('FreshMart') &&
          !r.buyerName.includes('Kalyan Wholesale')
      );
      const newMapped: BuyerRequest[] = [];

      for (const neg of negList) {
        if (!neg || !neg.id) continue;
        const offerPrice = Number(neg.counterPrice || neg.offeredPrice || 25);
        const statusMap: Record<string, BuyerRequestStatus> = {
          PENDING_FARMER: 'New',
          COUNTER_OFFERED: 'Negotiating',
          ACCEPTED: 'Accepted',
          REJECTED: 'Rejected',
        };

        const history: NegotiationMessage[] = (neg.history || []).map((h: any, idx: number) => ({
          id: h.id || `msg_${idx}`,
          sender: (h.sender || '').toLowerCase().includes('farmer') ? 'farmer' : 'buyer',
          senderName: h.senderName || ((h.sender || '').toLowerCase().includes('farmer') ? 'You' : (neg.buyerName || 'Buyer')),
          pricePerKg: Number(h.price || h.pricePerKg || offerPrice),
          quantityKg: Number(h.quantityKg || neg.quantity || 100),
          message: h.text || h.message || 'Negotiation message',
          timestamp: h.timestamp ? new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        }));

        const isBulkFpo = neg.id?.startsWith('breq_') || neg.buyerCompany?.includes('FPO') || neg.unit === 'quintal' || neg.unit === 'tonne';
        const determinedBuyerType: BuyerType = (neg.buyerType as BuyerType) || (isBulkFpo ? 'Institutional Buyer' : (Number(neg.quantity || 0) >= 50 ? 'Wholesale Buyer' : 'Retail Chain Hub'));

        const mapped: BuyerRequest = {
          id: neg.id,
          buyerId: neg.buyerId || 'buyer_1',
          buyerName: neg.buyerName || 'MandiKart Buyer',
          buyerType: determinedBuyerType,
          verified: true,
          avatar: neg.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          rating: 4.8,
          cropName: neg.cropName || 'Produce',
          variety: neg.grade ? `Grade ${neg.grade}` : (neg.variety || 'Standard'),
          quantityKg: Number(neg.quantity || 100),
          unit: neg.unit || 'kg',
          qualityGrade: neg.grade ? `Grade ${neg.grade}` : 'Grade A',
          offerPricePerKg: offerPrice,
          marketReferencePricePerKg: Math.round(offerPrice * 0.95),
          distanceKm: 15,
          estimatedTransportPerKg: 0.8,
          estimatedNetReturnPerKg: Math.round((offerPrice - 0.8) * 100) / 100,
          pickupDate: neg.remarks ? `${neg.remarks}` : 'Immediate Farmgate Pickup',
          receivedAt: neg.createdAt ? new Date(neg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          expiresInHours: 24,
          status: statusMap[neg.status] || 'Negotiating',
          farmerNote: neg.farmerNote,
          rejectionReason: neg.rejectionReason,
          history: history.length > 0 ? history : [
            {
              id: `msg_init`,
              sender: 'buyer',
              senderName: neg.buyerName || 'Buyer',
              pricePerKg: offerPrice,
              quantityKg: Number(neg.quantity || 100),
              message: neg.remarks || `Inquiry for ${neg.quantity || 100} ${neg.unit || 'kg'} ${neg.cropName || 'produce'} at ₹${offerPrice}/${neg.unit || 'kg'}`,
              timestamp: 'Recently',
            }
          ],
        };


        const existingIdx = currentReqs.findIndex((r) => r.id === neg.id);
        if (existingIdx >= 0) {
          currentReqs[existingIdx] = mapped;
        } else {
          newMapped.push(mapped);
        }
      }

      return {
        requests: [...newMapped, ...currentReqs],
      };
    });
  },

  fetchBulkDemands: async (cropFilter?: string) => {
    try {
      const { apiClient } = require('@/services/apiClient');
      const demands = await apiClient.getBulkRequirements(cropFilter);
      if (Array.isArray(demands) && demands.length > 0) {
        const enriched = demands.map((d: any) => ({
          ...d,
          targetPricePerKg: d.targetPricePerKg || d.maxTargetPricePerUnit || 25,
          marketBenchmarkPricePerKg: d.marketBenchmarkPricePerKg || Math.round((d.targetPricePerKg || d.maxTargetPricePerUnit || 25) * 0.92),
          minVolumeKg: d.minVolumeKg || d.requiredQuantity || 1000,
          maxVolumeKg: d.maxVolumeKg || (d.requiredQuantity ? d.requiredQuantity * 2 : 5000),
          deliveryDepot: d.deliveryDepot || d.deliveryLocation || 'Nashik Central Depot',
          urgency: d.urgency || 'HIGH',
          qualityStandard: d.qualityStandard || `Grade ${d.grade || 'A'} Standard`,
          deadlineDate: d.deadlineDate || d.requiredByDate || 'Within 7 Days',
          verifiedBuyer: d.verifiedBuyer ?? true,
          distanceKm: d.distanceKm || 35,
          logisticsArrangedBy: d.logisticsArrangedBy || 'BUYER',
        }));
        set({ bulkDemands: enriched });
      }
    } catch (e) {
      console.warn('fetchBulkDemands error:', e);
    }
  },

  submitBulkQuote: async (id: string, priceOrData: any, qty?: number, notes?: string) => {
    const { apiClient } = require('@/services/apiClient');
    const quoteData = typeof priceOrData === 'object'
      ? priceOrData
      : { quotedPricePerUnit: priceOrData, offeredQuantity: qty || 0, notes };
    const res = await apiClient.submitBulkQuote(id, quoteData);
    // Refresh demands after quote
    get().fetchBulkDemands().catch(() => {});
    return res;
  },
}));
