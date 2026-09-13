/**
 * MandiKart — Canonical Core Interfaces & Standard API Envelope
 */

import { OrderStatus, UserRole, ProduceGrade, BuyerTarget, QuantityUnit, DisputeStatus } from '../enums/orderStatus.js';

// Standard API Response Envelope
export interface ApiResponse<T = any> {
  data: T | null;
  meta: ApiMeta | null;
  error: ApiError | null;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  timestamp?: string;
  [key: string]: any;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// User & Farmer Entities
export interface User {
  id: string;
  phone: string;
  email?: string | null;
  role: UserRole;
  createdAt: string;
}

export interface Farmer {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
  preferredLanguage: string;
  avatarUrl?: string | null;
  aadhaarLast4?: string | null;
  isVerified: boolean;
  state: string;
  district: string;
  taluka?: string | null;
  village?: string | null;
  farmSizeAcres: number;
  ownershipType: string;
  primaryCrops: string[];
  upiId?: string | null;
  bankAccountLast4?: string | null;
  bankIfsc?: string | null;
  bankAccountName?: string | null;
  fpoId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Product Entity
export interface Product {
  id: string;
  farmerId: string;
  cropName: string;
  cropVariety?: string | null;
  grade: ProduceGrade;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  quantityUnit: QuantityUnit | string;
  basePricePerUnit: number;
  minOrderQuantity: number;
  targetBuyer: BuyerTarget;
  images: string[];
  pickupAddress?: string | null;
  pickupLatitude?: number | null;
  pickupLongitude?: number | null;
  isActive: boolean;
  harvestDate?: string | null;
  shelfLifeDays: number;
  createdAt: string;
  updatedAt: string;
}

// Order & Order Item Entities
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  cropName: string;
  grade: ProduceGrade;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  farmerId: string;
  buyerId: string;
  buyerName?: string;
  buyerPhone?: string;
  status: OrderStatus;
  totalAmount: number;
  platformFee: number;
  farmerPayoutAmount: number;
  pickupOtp?: string | null;
  deliveryOtp?: string | null;
  pickupScheduledAt?: string | null;
  driverId?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  vehicleNumber?: string | null;
  cancellationReason?: string | null;
  disputeReason?: string | null;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedBy: string;
  role: UserRole;
  remarks?: string | null;
  createdAt: string;
}

// Market Price Entity
export interface MarketPrice {
  id: string;
  state: string;
  district: string;
  marketMandiName: string;
  commodity: string;
  variety?: string | null;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  priceDate: string;
  createdAt: string;
}

// Negotiation Entity
export interface Negotiation {
  id: string;
  orderId?: string | null;
  productId: string;
  buyerId: string;
  farmerId: string;
  originalPrice: number;
  offeredPrice: number;
  counterPrice?: number | null;
  quantity: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

// User Consent, Cookies & App Permissions
export interface AppPermissions {
  location: boolean;
  camera: boolean;
  notifications: boolean;
  storage?: boolean;
}

export interface ConsentInput {
  termsAndConditions: boolean;
  privacyPolicy: boolean;
  cookiesConsent: boolean;
  permissions?: AppPermissions;
  version?: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  role: UserRole;
  hasAcceptedConsent: boolean;
  requiresConsent: boolean;
  termsAndConditions: boolean;
  privacyPolicy: boolean;
  cookiesConsent: boolean;
  permissions: AppPermissions;
  version: string;
  ipAddress?: string;
  userAgent?: string;
  acceptedAt?: string | null;
  updatedAt: string;
}

// In-App and Push Notifications
export type NotificationType = 'ORDER_UPDATE' | 'PRICE_ALERT' | 'NEGOTIATION' | 'SYSTEM';

export interface NotificationItem {
  id: string;
  userId: string;
  role: UserRole;
  title: string;
  body: string;
  type: NotificationType;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface DevicePushTokenRecord {
  id: string;
  userId: string;
  role: UserRole;
  token: string;
  deviceType: 'android' | 'ios' | 'web';
  lastSeenAt: string;
}

export type BuyerType = 'RETAIL' | 'BULK';

export interface Buyer {
  id: string;
  phone: string;
  email?: string | null;
  fullName: string;
  avatarUrl?: string | null;
  buyerType: BuyerType;
  companyName?: string | null;
  gstin?: string | null;
  addresses: Array<{
    id: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    isDefault?: boolean;
  }>;
  isVerified: boolean;
  preferredLanguage: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type EscrowStatus = 'HELD' | 'RELEASED' | 'REFUNDED' | 'DISPUTED_HOLD';

export interface PaymentRecord {
  id: string;
  orderId: string;
  buyerId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeChargeId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  escrowStatus: EscrowStatus;
  paymentMethod: string;
  metadata?: Record<string, any>;
  escrowReleasedAt?: string | null;
  refundedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeRecord {
  id: string;
  orderId: string;
  buyerId?: string | null;
  farmerId: string;
  reason: string;
  evidencePhotos: string[];
  disputedAmount: number;
  status: DisputeStatus;
  adminNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FarmPlot {
  id: string;
  farmerId: string;
  surveyNumber: string;
  landAreaAcres: number;
  ownershipType: string;
  soilType?: string | null;
  irrigationSource?: string | null;
  plotImageUrl?: string | null;
  doc712Url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OtpChannel = 'SMS' | 'EMAIL' | 'WHATSAPP';

export interface OtpRecord {
  id: string;
  identifier: string;
  codeHash: string;
  channel: OtpChannel;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  expiresAt: string;
  verifiedAt?: string | null;
  createdAt: string;
}

export type PayoutStatus = 'INITIATED' | 'PROCESSING' | 'SETTLED' | 'FAILED';

export interface FarmerPayout {
  id: string;
  farmerId: string;
  amount: number;
  currency: string;
  bankName: string;
  bankAccountLast4: string;
  ifscCode: string;
  utrNumber: string;
  status: PayoutStatus;
  stripePayoutId?: string;
  remainingBalance?: number;
  transferredAt: string;
  createdAt: string;
}

export interface WithdrawRequest {
  amount: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
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
  // Organization identity
  fpoId?: string;
  fpoName: string;
  registrationNumber: string;
  registrationType: FPORegistrationType;
  yearOfFormation: number;
  nabardPromoted: boolean;
  promoterName?: string;

  // Representative (CEO/Chairman) info
  representativeName: string;
  designation: FPODesignation;
  representativeMobile: string;
  representativeWhatsApp?: string;
  representativeEmail?: string;
  representativeAvatarUri?: string;
  experienceYears: number;

  // Geography
  state: string;
  district: string;
  block?: string;
  headquartersVillage: string;
  villagesCovered: string[];

  // Scale
  memberCount: number;
  femaleMemberPercent: number;
  primaryCrops: string[];
  annualTurnoverBracket: '<10L' | '10L-50L' | '50L-1Cr' | '>1Cr';

  // Bank
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: 'CURRENT' | 'SAVINGS';

  // Computed / operational
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

export * from './location.types.js';






