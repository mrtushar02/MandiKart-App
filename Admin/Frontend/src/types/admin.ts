export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'MODERATOR' | 'DISPUTE_MANAGER';
  avatarUrl?: string;
  department: string;
}

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  period: string;
  iconName: string;
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'purple' | 'danger';
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  farmerName: string;
  buyerName: string;
  produceName: string;
  quantityKg: number;
  totalAmount: number;
  status: 'PLACED' | 'CONFIRMED' | 'PICKUP_SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPLETED' | 'DISPUTED';
  timestamp: string;
}

export interface AiInsight {
  id: string;
  title: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction: string;
  category: 'SPOILAGE_RISK' | 'PRICE_VOLATILITY' | 'LOGISTICS_BOTTLENECK';
  timestamp: string;
}

export interface RegionalActivity {
  region: string;
  state: string;
  activeFarmers: number;
  activeBuyers: number;
  volumeTons: number;
  healthScore: number;
}

export interface KycRecord {
  documentType: 'AADHAAR' | 'KHASRA_LAND_RECORD' | 'BANK_PASSBOOK';
  documentNumber: string;
  verifiedStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  uploadedAt: string;
  verifiedAt?: string;
}

export interface FarmerProduceListing {
  id: string;
  farmerId?: string;
  farmerName?: string;
  farmerCode?: string;
  cropName: string;
  category: string;
  availableKg: number;
  pricePerKg: number;
  qualityGrade: 'GRADE_A' | 'GRADE_B' | 'PREMIUM';
  harvestDate: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'ADMIN_APPROVED' | 'ACTIVE' | 'REJECTED' | 'SOLD_OUT' | 'UNPUBLISHED';
  mandiName?: string;
  submittedAt?: string;
  labCertificateNumber?: string;
  imageUrl?: string;
  images?: string[];
}

export interface FarmerUser {
  id: string;
  farmerCode: string;
  fullName: string;
  phone: string;
  mandiName: string;
  district: string;
  state: string;
  landAreaAcres: number;
  verificationStatus: 'VERIFIED' | 'PENDING_KYC' | 'SUSPENDED';
  rating: number;
  totalSalesAmount: number;
  joinedDate: string;
  avatarUrl?: string;
  kycRecords: KycRecord[];
  activeListings: FarmerProduceListing[];
}
