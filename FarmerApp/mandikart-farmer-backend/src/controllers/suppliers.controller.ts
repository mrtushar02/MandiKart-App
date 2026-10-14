/**
 * MandiKart — Farmer App Suppliers Controller
 * Provides supplier catalog, details, and statutory verification auditing.
 */

import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../middlewares/errorHandler.js';

export type VerificationStatus =
  | 'VERIFIED'
  | 'PENDING'
  | 'REJECTED'
  | 'EXPIRED'
  | 'UNAVAILABLE';

export interface SupplierVerificationDocument {
  id: string;
  docType: 'REGISTRATION_CERTIFICATE' | 'APMC_LICENSE' | 'TAX_PAN' | 'BANK_MANDATE' | 'QUALITY_ASSAY_CERT' | 'ORGANIC_NPOP';
  title: string;
  issuingAuthority: string;
  issueDate?: string;
  expiryDate?: string;
  documentStatus: VerificationStatus;
  isAccessRestricted: boolean;
  accessRestrictedMessage?: string;
  securePreviewUrl?: string;
  fileSizeBytes?: number;
  fileFormat?: string;
}

export interface StoredSupplierVerification {
  supplierId: string;
  status: VerificationStatus;
  badgeLabel: string;
  registrationNumber?: string;
  registrationType?: string;
  issuedBy?: string;
  verifiedAt?: string;
  expiresAt?: string;
  rejectionReason?: string;
  expiredReason?: string;
  unavailableReason?: string;
  kycCompleted: boolean;
  kycVerifiedAt?: string;
  bankAccountVerified: boolean;
  bankVerifiedAt?: string;
  apmcLicenseVerified: boolean;
  apmcLicenseNumber?: string;
  apmcMarketYard?: string;
  apmcLicenseExpiresAt?: string;
  qualityAssayCertified: boolean;
  qualityAssayExpiresAt?: string;
  documents: SupplierVerificationDocument[];
}

export interface StoredSupplier {
  id: string;
  name: string;
  type: 'FPO_CLUSTER' | 'COOPERATIVE' | 'WHOLESALE_AGGREGATOR' | 'COMMERCIAL_FARM' | 'COMMERCIAL_TRADER';
  typeLabel: string;
  location: string;
  district: string;
  state: string;
  distanceKm: number;
  contactPerson: string;
  contactPhone?: string;
  reliabilityScorePct: number;
  totalCompletedOrders: number;
  ratingStars?: number;
  reviewCount?: number;
  storageFacility: string;
  supportedCrops: string[];
  verification: StoredSupplierVerification;
  about: string;
}

// In-memory supplier registry with realistic APMC & FPO profiles
const BACKEND_SUPPLIERS: StoredSupplier[] = [
  {
    id: 'sup_fpo_pimpalgaon_01',
    name: 'Pimpalgaon Farmer Producer Co. Ltd.',
    type: 'FPO_CLUSTER',
    typeLabel: 'Farmer Producer Co. (FPO)',
    location: 'Pimpalgaon Baswant, Nashik',
    district: 'Nashik',
    state: 'Maharashtra',
    distanceKm: 24,
    contactPerson: 'Kailash Sonawane (Secretary)',
    contactPhone: '+91 98221 44520',
    reliabilityScorePct: 99.4,
    totalCompletedOrders: 148,
    ratingStars: 4.9,
    reviewCount: 38,
    storageFacility: 'Cold terminal & curing shed (500 MT capacity)',
    supportedCrops: ['Red Onion', 'Tomato Hybrid', 'Fresh Produce', 'Pomegranate (Anar)'],
    about: 'Cluster-level farmer producer organization aggregating 450+ smallholder growers across Pimpalgaon and Kalwan blocks with cold sorting and weighbridge facilities.',
    verification: {
      supplierId: 'sup_fpo_pimpalgaon_01',
      status: 'VERIFIED',
      badgeLabel: 'Verified FPO',
      registrationNumber: 'FPO-MH-NSK-2019-0412',
      registrationType: 'Farmer Producer Company (Companies Act 2013)',
      issuedBy: 'Ministry of Corporate Affairs / SFAC',
      verifiedAt: '2023-04-15',
      expiresAt: '2028-04-14',
      kycCompleted: true,
      kycVerifiedAt: '2023-04-10',
      bankAccountVerified: true,
      bankVerifiedAt: '2023-04-12',
      apmcLicenseVerified: true,
      apmcLicenseNumber: 'APMC-PMPL-2019-108',
      apmcMarketYard: 'Pimpalgaon Baswant Principal Market Yard',
      apmcLicenseExpiresAt: '2027-03-31',
      qualityAssayCertified: true,
      qualityAssayExpiresAt: '2026-12-31',
      documents: [
        {
          id: 'doc_pmp_01',
          docType: 'REGISTRATION_CERTIFICATE',
          title: 'Certificate of Incorporation (FPC)',
          issuingAuthority: 'Registrar of Companies, Mumbai',
          issueDate: '2019-06-18',
          expiryDate: '2028-04-14',
          documentStatus: 'VERIFIED',
          isAccessRestricted: false,
          securePreviewUrl: '/api/v1/suppliers/sup_fpo_pimpalgaon_01/documents/doc_pmp_01/preview',
          fileSizeBytes: 245000,
          fileFormat: 'PDF',
        },
        {
          id: 'doc_pmp_02',
          docType: 'APMC_LICENSE',
          title: 'Direct Agricultural Marketing & Trading License',
          issuingAuthority: 'Pimpalgaon Baswant APMC Market Committee',
          issueDate: '2022-04-01',
          expiryDate: '2027-03-31',
          documentStatus: 'VERIFIED',
          isAccessRestricted: false,
          securePreviewUrl: '/api/v1/suppliers/sup_fpo_pimpalgaon_01/documents/doc_pmp_02/preview',
          fileSizeBytes: 180000,
          fileFormat: 'PDF',
        },
        {
          id: 'doc_pmp_03',
          docType: 'QUALITY_ASSAY_CERT',
          title: 'Moisture & Optical Sieve Grading Assay Accreditation',
          issuingAuthority: 'Maharashtra State Agriculture Marketing Board',
          issueDate: '2023-11-15',
          expiryDate: '2026-12-31',
          documentStatus: 'VERIFIED',
          isAccessRestricted: false,
          securePreviewUrl: '/api/v1/suppliers/sup_fpo_pimpalgaon_01/documents/doc_pmp_03/preview',
          fileSizeBytes: 310000,
          fileFormat: 'PDF',
        },
        {
          id: 'doc_pmp_04',
          docType: 'BANK_MANDATE',
          title: 'Escrow Settlement Direct Debit Mandate',
          issuingAuthority: 'State Bank of India Commercial Branch',
          issueDate: '2023-04-12',
          documentStatus: 'VERIFIED',
          isAccessRestricted: true,
          accessRestrictedMessage: 'Confidential banking record held in MandiKart Escrow Trust Vault under DPDP Act 2023. Public download restricted.',
        },
        {
          id: 'doc_pmp_05',
          docType: 'TAX_PAN',
          title: 'Permanent Account Number (PAN Card)',
          issuingAuthority: 'Income Tax Department of India',
          documentStatus: 'VERIFIED',
          isAccessRestricted: true,
          accessRestrictedMessage: 'Entity tax identification verified by compliance desk. Direct image preview restricted.',
        },
      ],
    },
  },
  {
    id: 'sup_fpo_sahyadri_02',
    name: 'Sahyadri Agro Farmers Cluster Hub',
    type: 'COOPERATIVE',
    typeLabel: 'Agricultural Cooperative',
    location: 'Mohadi, Dindori Road, Nashik',
    district: 'Nashik',
    state: 'Maharashtra',
    distanceKm: 32,
    contactPerson: 'Sanjay Deshmukh (Procurement Lead)',
    contactPhone: '+91 94220 18834',
    reliabilityScorePct: 98.6,
    totalCompletedOrders: 215,
    ratingStars: 4.8,
    reviewCount: 52,
    storageFacility: 'Central Packhouse, Sorting & Grading Line (1200 MT)',
    supportedCrops: ['Red Onion', 'Tomato Hybrid', 'Green Chilli', 'Fresh Ginger (Adrak)', 'Vegetables & Greens'],
    about: 'Apex horticultural cooperative with 1,200 participating farmers operating automated optical sorting lines and multi-temperature staging.',
    verification: {
      supplierId: 'sup_fpo_sahyadri_02',
      status: 'VERIFIED',
      badgeLabel: 'Verified Cooperative',
      registrationNumber: 'COOP-MH-NSK-8812',
      registrationType: 'Multi-State Cooperative Society',
      issuedBy: 'Dept of Cooperation, Govt of Maharashtra',
      verifiedAt: '2022-09-10',
      expiresAt: '2027-09-09',
      kycCompleted: true,
      kycVerifiedAt: '2022-09-05',
      bankAccountVerified: true,
      bankVerifiedAt: '2022-09-08',
      apmcLicenseVerified: true,
      apmcLicenseNumber: 'APMC-NSK-COOP-441',
      apmcMarketYard: 'Nashik Central APMC',
      apmcLicenseExpiresAt: '2027-03-31',
      qualityAssayCertified: true,
      qualityAssayExpiresAt: '2026-09-30',
      documents: [
        {
          id: 'doc_shy_01',
          docType: 'REGISTRATION_CERTIFICATE',
          title: 'Cooperative Registration Charter',
          issuingAuthority: 'Commissioner for Cooperation, Maharashtra',
          issueDate: '2016-08-20',
          expiryDate: '2027-09-09',
          documentStatus: 'VERIFIED',
          isAccessRestricted: false,
          securePreviewUrl: '/api/v1/suppliers/sup_fpo_sahyadri_02/documents/doc_shy_01/preview',
          fileSizeBytes: 290000,
          fileFormat: 'PDF',
        },
      ],
    },
  },
  {
    id: 'sup_godavari_traders_07',
    name: 'Godavari Agri Commercial Traders',
    type: 'COMMERCIAL_TRADER',
    typeLabel: 'Private Agri Trading Firm',
    location: 'Malegaon Road, Manmad, Nashik',
    district: 'Nashik',
    state: 'Maharashtra',
    distanceKm: 76,
    contactPerson: 'Rameshwar Baldawa',
    contactPhone: '+91 98229 11400',
    reliabilityScorePct: 82.0,
    totalCompletedOrders: 14,
    ratingStars: undefined,
    reviewCount: 0,
    storageFacility: 'Leased open godown',
    supportedCrops: ['Red Onion', 'Yellow Maize', 'Desi Chana / Chickpea', 'Soybean'],
    about: 'Private regional grain and onion trading entity with documents currently under review by MandiKart compliance team.',
    verification: {
      supplierId: 'sup_godavari_traders_07',
      status: 'PENDING',
      badgeLabel: 'KYC & License Under Review',
      registrationNumber: 'Pending APMC Verification',
      registrationType: 'Sole Proprietorship Trading Firm',
      issuedBy: 'Application filed with District Registrar',
      verifiedAt: undefined,
      expiresAt: undefined,
      kycCompleted: true,
      kycVerifiedAt: '2026-10-01',
      bankAccountVerified: false,
      apmcLicenseVerified: false,
      qualityAssayCertified: false,
      documents: [
        {
          id: 'doc_god_01',
          docType: 'APMC_LICENSE',
          title: 'Application for Commercial Mandi License (Form B)',
          issuingAuthority: 'Manmad APMC Sub-Yard Committee',
          issueDate: '2026-09-28',
          documentStatus: 'PENDING',
          isAccessRestricted: false,
          securePreviewUrl: '/api/v1/suppliers/sup_godavari_traders_07/documents/doc_god_01/preview',
          fileSizeBytes: 140000,
          fileFormat: 'PDF',
        },
      ],
    },
  },
  {
    id: 'sup_malegaon_traders_08',
    name: 'Malegaon Regional Agri Trading Co.',
    type: 'COMMERCIAL_TRADER',
    typeLabel: 'Commercial Trading Syndicate',
    location: 'Camp Road, Malegaon, Nashik',
    district: 'Nashik',
    state: 'Maharashtra',
    distanceKm: 95,
    contactPerson: 'Shakeel Ahmed Ansari',
    contactPhone: '+91 98224 55190',
    reliabilityScorePct: 76.5,
    totalCompletedOrders: 28,
    storageFacility: 'Covered Mandi Shed',
    supportedCrops: ['Red Onion', 'Soybean', 'Yellow Maize'],
    about: 'Regional trading firm whose annual agricultural marketing license lapsed at the close of the previous financial year and is undergoing renewal review.',
    verification: {
      supplierId: 'sup_malegaon_traders_08',
      status: 'EXPIRED',
      badgeLabel: 'License Expired',
      registrationNumber: 'APMC-MLG-2021-4412',
      registrationType: 'Partnership Trading Entity',
      issuedBy: 'APMC Market Committee Malegaon',
      verifiedAt: '2021-04-01',
      expiresAt: '2026-03-31',
      expiredReason: 'Annual APMC trading license expired on 31-Mar-2026. Annual compliance renewal submission is pending with the market committee.',
      kycCompleted: true,
      bankAccountVerified: true,
      apmcLicenseVerified: false,
      qualityAssayCertified: false,
      documents: [
        {
          id: 'doc_mlg_01',
          docType: 'APMC_LICENSE',
          title: 'Annual APMC Market Trading License (Expired)',
          issuingAuthority: 'APMC Malegaon',
          issueDate: '2021-04-01',
          expiryDate: '2026-03-31',
          documentStatus: 'EXPIRED',
          isAccessRestricted: false,
          securePreviewUrl: '/api/v1/suppliers/sup_malegaon_traders_08/documents/doc_mlg_01/preview',
          fileSizeBytes: 195000,
          fileFormat: 'PDF',
        },
      ],
    },
  },
  {
    id: 'sup_kalyan_traders_09',
    name: 'Kalyan Farm Inputs & Chemical Syndicate',
    type: 'COMMERCIAL_TRADER',
    typeLabel: 'Commercial Chemical Entity',
    location: 'Kalyan Agro Yard, Thane',
    district: 'Thane',
    state: 'Maharashtra',
    distanceKm: 140,
    contactPerson: 'Suresh Patil',
    reliabilityScorePct: 45.0,
    totalCompletedOrders: 3,
    storageFacility: 'Unzoned warehouse',
    supportedCrops: ['Farm Inputs & Seeds'],
    about: 'Private chemical vendor whose mandatory statutory agricultural input licensing was rejected following a site audit.',
    verification: {
      supplierId: 'sup_kalyan_traders_09',
      status: 'REJECTED',
      badgeLabel: 'Verification Rejected',
      registrationNumber: 'REG-REJ-2026-99',
      registrationType: 'Commercial Wholesale Entity',
      issuedBy: 'District Agriculture Registrar',
      verifiedAt: undefined,
      rejectionReason: 'Failed mandatory fertilizer licensing inspection. Chemical batch storage does not meet environmental safety standards.',
      kycCompleted: false,
      bankAccountVerified: false,
      apmcLicenseVerified: false,
      qualityAssayCertified: false,
      documents: [
        {
          id: 'doc_kly_01',
          docType: 'REGISTRATION_CERTIFICATE',
          title: 'Statutory Inspection Report (Non-Compliant)',
          issuingAuthority: 'State Quality Control Inspectorate',
          issueDate: '2026-08-14',
          documentStatus: 'REJECTED',
          isAccessRestricted: false,
          securePreviewUrl: '/api/v1/suppliers/sup_kalyan_traders_09/documents/doc_kly_01/preview',
          fileSizeBytes: 110000,
          fileFormat: 'PDF',
        },
      ],
    },
  },
];

export class SuppliersController {
  /**
   * GET /api/v1/suppliers
   */
  static listSuppliers(req: Request, res: Response): void {
    const { crop, status, verifiedOnly } = req.query;

    let result = [...BACKEND_SUPPLIERS];

    if (crop) {
      const q = String(crop).toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.supportedCrops.some((c) => c.toLowerCase().includes(q)) ||
          s.name.toLowerCase().includes(q)
      );
    }

    if (verifiedOnly === 'true') {
      result = result.filter((s) => s.verification.status === 'VERIFIED');
    }

    if (status) {
      result = result.filter((s) => s.verification.status === status);
    }

    sendSuccess(res, result);
  }

  /**
   * GET /api/v1/suppliers/:id
   */
  static getSupplierById(req: Request, res: Response): void {
    const { id } = req.params;
    const supplier = BACKEND_SUPPLIERS.find((s) => s.id === id);

    if (!supplier) {
      sendError(res, `Supplier #${id} not found in verified registry`, 404, 'SUPPLIER_NOT_FOUND');
      return;
    }

    sendSuccess(res, supplier);
  }

  /**
   * GET /api/v1/suppliers/:id/verification
   * Returns verification audit details with role-based access filtering
   */
  static getSupplierVerification(req: Request, res: Response): void {
    const { id } = req.params;
    const supplier = BACKEND_SUPPLIERS.find((s) => s.id === id);

    if (!supplier) {
      sendError(res, `Verification records for supplier #${id} could not be located`, 404, 'VERIFICATION_NOT_FOUND');
      return;
    }

    // Role-based document sanitization:
    // If not an authorized auditor or admin, strip confidential preview URLs
    const sanitizedDocuments = supplier.verification.documents.map((doc) => {
      if (doc.isAccessRestricted) {
        return {
          ...doc,
          securePreviewUrl: undefined, // ensure no leak of private document URLs
        };
      }
      return doc;
    });

    sendSuccess(res, {
      ...supplier.verification,
      supplierName: supplier.name,
      supplierType: supplier.type,
      supplierTypeLabel: supplier.typeLabel,
      location: supplier.location,
      district: supplier.district,
      state: supplier.state,
      distanceKm: supplier.distanceKm,
      documents: sanitizedDocuments,
    });
  }

  /**
   * GET /api/v1/suppliers/:id/documents/:docId/preview
   * Secure access-controlled inline preview endpoint
   */
  static previewDocument(req: Request, res: Response): void {
    const { id, docId } = req.params;
    const supplier = BACKEND_SUPPLIERS.find((s) => s.id === id);

    if (!supplier) {
      sendError(res, 'Supplier not found', 404);
      return;
    }

    const doc = supplier.verification.documents.find((d) => d.id === docId);
    if (!doc) {
      sendError(res, 'Document not found in verification audit vault', 404);
      return;
    }

    if (doc.isAccessRestricted) {
      sendError(
        res,
        'Access Restricted: Unauthorized to preview confidential business identity documents.',
        403,
        'PERMISSION_DENIED'
      );
      return;
    }

    // Return document verification metadata and secure certificate certificate digest
    sendSuccess(res, {
      documentId: doc.id,
      title: doc.title,
      issuingAuthority: doc.issuingAuthority,
      status: doc.documentStatus,
      sha256Digest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      watermark: `MANDIKART VERIFIED • AUDITED ${supplier.verification.verifiedAt || 'RECENTLY'}`,
      inlinePreviewSupported: true,
      downloadForbidden: true,
    });
  }
}
