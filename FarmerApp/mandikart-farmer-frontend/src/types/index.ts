/**
 * MandiKart — Core Domain Types
 *
 * Strict TypeScript interfaces for the entire farmer journey.
 * No `any`. Shared types organised in one place.
 */

// ── Farmer ─────────────────────────────────────────────────

export interface Farmer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  profileImageUrl?: string;
  avatarUrl?: string;
  language: 'en' | 'hi' | 'or' | 'mr' | 'pa' | 'ta' | 'te' | 'bn' | 'gu' | 'kn' | string;
  isFPOMember: boolean;
  fpoId?: string;
  isVerified: boolean;
  state?: string;
  district?: string;
  taluka?: string;
  village?: string;
  farmSizeAcres?: number | string;
  primaryCrops?: string[];
  ownershipType?: string;
  isNewUser?: boolean;
  createdAt: string;
}

export interface FPO {
  id: string;
  name: string;
  registrationNumber: string;
  location: Location;
  memberCount: number;
  contactPhone: string;
}

// ── Farm ───────────────────────────────────────────────────

export interface FarmDetails {
  id: string;
  farmerId: string;
  farmName?: string;
  location: Location;
  areaInAcres: number;
  crops: string[];
  irrigationType?: 'rainfed' | 'irrigated' | 'mixed';
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  district?: string;
  state?: string;
  pincode?: string;
}

// ── Produce ────────────────────────────────────────────────

export type ProduceStatus = 'available' | 'listed' | 'partially_sold' | 'sold';
export type QualityGrade = 'A' | 'B' | 'C';

export interface Produce {
  id: string;
  farmerId: string;
  cropName: string;
  cropCategory: string;
  quantity: number;
  unit: string;
  qualityGrade: QualityGrade;
  availableFrom: string;
  availableTo?: string;
  status: ProduceStatus;
  imageUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Market ─────────────────────────────────────────────────

export interface MarketPrice {
  cropName: string;
  market: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  date: string;
  source?: string;
}

export type DemandLevel = 'low' | 'moderate' | 'high' | 'very_high';

export interface MarketDemand {
  cropName: string;
  region: string;
  demandLevel: DemandLevel;
  lastUpdated: string;
}

// ── Buyer ──────────────────────────────────────────────────

export interface Buyer {
  id: string;
  name: string;
  businessName?: string;
  location: Location;
  isVerified: boolean;
  rating?: number;
  completedOrders?: number;
  profileImageUrl?: string;
}

export interface BuyerRequirement {
  buyerId: string;
  cropName: string;
  quantityMin: number;
  quantityMax: number;
  qualityGrade: QualityGrade;
  pricePerUnit: number;
  unit: string;
  demandLevel: DemandLevel;
  availableFrom: string;
  availableTo?: string;
}

// ── Selling Options & Matching ─────────────────────────────

export interface SellingOption {
  id: string;
  buyer: Buyer;
  requirement: BuyerRequirement;
  pricePerUnit: number;
  estimatedTransportCostPerUnit: number;
  estimatedOtherCostsPerUnit: number;
  estimatedNetReturnPerUnit: number;
  totalEstimatedGross: number;
  totalEstimatedTransport: number;
  totalEstimatedOtherCosts: number;
  totalEstimatedNetReturn: number;
  distanceKm: number;
  matchPercentage: number;
  matchReasons: MatchReason[];
  isRecommended: boolean;
  recommendationReasons?: string[];
}

export interface MatchReason {
  factor: string;
  matches: boolean;
  description: string;
}

// ── Purchase Request ───────────────────────────────────────

export type PurchaseRequestStatus =
  | 'draft'
  | 'sent'
  | 'buyer_reviewing'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export interface PurchaseRequest {
  id: string;
  farmerId: string;
  buyerId: string;
  buyer: Buyer;
  produceId: string;
  cropName: string;
  quantity: number;
  unit: string;
  qualityGrade: QualityGrade;
  pricePerUnit: number;
  estimatedGrossValue: number;
  estimatedTransportCost: number;
  estimatedOtherCosts: number;
  estimatedNetReturn: number;
  pickupLocation: Location;
  message?: string;
  status: PurchaseRequestStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Order ──────────────────────────────────────────────────

export type OrderStatus =
  | 'confirmed'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'payment_processing'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface Order {
  id: string;
  purchaseRequestId: string;
  farmerId: string;
  buyerId: string;
  buyer: Buyer;
  cropName: string;
  quantity: number;
  unit: string;
  qualityGrade: QualityGrade;
  pricePerUnit: number;
  grossValue: number;
  transportCost: number;
  otherCosts: number;
  netReturn: number;
  status: OrderStatus;
  pickup?: PickupInfo;
  delivery?: DeliveryInfo;
  payment?: PaymentInfo;
  createdAt: string;
  updatedAt: string;
}

// ── Pickup / Logistics ─────────────────────────────────────

export type PickupStatus = 'scheduled' | 'waiting' | 'accepted' | 'rejected' | 'completed';

export interface PickupInfo {
  collectionCentre?: string;
  location: Location;
  scheduledDate: string;
  scheduledTime: string;
  token?: string;
  status: PickupStatus;
}

export interface DeliveryInfo {
  pickupLocation: Location;
  deliveryLocation: Location;
  distanceKm: number;
  estimatedDeliveryDate?: string;
  status: 'picked_up' | 'in_transit' | 'delivered';
}

// ── Payment ────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PaymentInfo {
  id: string;
  orderId: string;
  grossValue: number;
  transportDeduction: number;
  otherDeductions: number;
  netAmount: number;
  status: PaymentStatus;
  paidAt?: string;
}

export interface EarningsSummary {
  totalEarnings: number;
  pendingPayments: number;
  completedTransactions: number;
}

export interface Transaction {
  id: string;
  orderId: string;
  cropName: string;
  buyerName: string;
  amount: number;
  type: 'credit' | 'debit';
  status: PaymentStatus;
  date: string;
}

// ── Notification ───────────────────────────────────────────

export type NotificationType =
  | 'order_update'
  | 'price_alert'
  | 'buyer_request'
  | 'payment'
  | 'general';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

// ─── FPO (Farmer Producer Organization) Types ─────────────────────────────────

export type FPORegistrationType = 'FPC' | 'COOPERATIVE' | 'TRUST' | 'PACS' | 'OTHER';

export type FPODesignation = 'CEO' | 'CHAIRMAN' | 'SECRETARY' | 'BOARD_MEMBER' | 'MANAGER' | 'OTHER';

export type FPOMemberStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'REJECTED';

export type FPOLotGrade = 'A' | 'B' | 'C' | 'UNGRADED';

export type FPOLotStatus = 'DRAFT' | 'GRADING' | 'LIVE' | 'CONTRACTED' | 'SOLD' | 'EXPIRED';

export type FPOProcurementStatus = 'COLLECTING_DEMAND' | 'SEEKING_QUOTES' | 'ORDER_PLACED' | 'DELIVERED';

export type FPOSchemeStatus = 'ELIGIBLE' | 'APPLIED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

/** Top-level FPO organization profile stored in the farmer's user record */
export interface FPODetails {
  fpoId?: string;
  fpoName: string;
  registrationNumber: string;
  registrationType: FPORegistrationType;
  yearOfFormation: number;
  nabardPromoted: boolean;
  promoterName?: string;

  representativeName: string;
  designation: FPODesignation;
  representativeMobile: string;
  representativeWhatsApp?: string;
  representativeEmail?: string;
  representativeAvatarUri?: string;
  experienceYears: number;

  state: string;
  district: string;
  block?: string;
  headquartersVillage: string;
  villagesCovered: string[];

  memberCount: number;
  femaleMemberPercent: number;
  primaryCrops: string[];
  annualTurnoverBracket: '<10L' | '10L-50L' | '50L-1Cr' | '>1Cr';

  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: 'CURRENT' | 'SAVINGS';

  totalInventoryMT?: number;
  pendingMemberRequests?: number;
}

/** An aggregate produce lot created by the FPO for bulk sale */
export interface FPOLot {
  id: string;
  fpoId: string;
  cropName: string;
  grade: FPOLotGrade;
  estimatedQtyMT: number;
  availableFromDate: string;
  availableToDate: string;
  storageLocation?: string;
  askPricePerKg: number;
  minimumBidPerKg?: number;
  status: FPOLotStatus;
  notes?: string;
  highestBidPerKg?: number;
  highestBidBuyer?: string;
  totalBids?: number;
  contributingMembers?: number;
  createdAt: string;
  updatedAt: string;
}

/** An individual farmer registered under an FPO */
export interface FPOMember {
  id: string;
  fpoId: string;
  farmerId: string;
  fullName: string;
  phone: string;
  village: string;
  district: string;
  landAcres: number;
  crops: string[];
  status: FPOMemberStatus;
  totalEarningsViaFPO?: number;
  totalDeliveredMT?: number;
  kccLimit?: number;
  kccBank?: string;
  joinedAt: string;
}

/** A collective procurement order managed by the FPO */
export interface FPOProcurement {
  id: string;
  fpoId: string;
  itemName: string;
  itemType: 'SEED' | 'FERTILIZER' | 'PESTICIDE' | 'EQUIPMENT' | 'OTHER';
  totalQuantity: number;
  unit: string;
  demandClosingDate: string;
  status: FPOProcurementStatus;
  bestQuotePrice?: number;
  bestQuoteSupplier?: string;
  savingVsMarket?: number;
  memberCount?: number;
  createdAt: string;
}

/** A government scheme the FPO qualifies for or has applied to */
export interface FPOScheme {
  id: string;
  schemeName: string;
  ministry: string;
  benefit: string;
  benefitAmount?: number;
  deadline?: string;
  status: FPOSchemeStatus;
  appliedAt?: string;
  qualificationReasons: string[];
  applyUrl?: string;
}

/** Institutional B2B Buyer for FPOs */
export interface FPOBuyer {
  id: string;
  companyName: string;
  buyerType: 'RETAIL_CHAIN' | 'PROCESSOR' | 'EXPORTER' | 'WHOLESALER' | 'INSTITUTION';
  verified: boolean;
  requiredCrops: string[];
  minLotMT: number;
  paymentTermDays: number;
  rating: number;
  location: string;
  activeContracts: number;
  contactPerson: string;
}

