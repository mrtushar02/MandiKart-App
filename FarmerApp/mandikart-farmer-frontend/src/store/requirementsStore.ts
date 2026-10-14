/**
 * MandiKart Farmer App — Bulk Procurement Requirements Domain Store
 *
 * Implements full state management for the 7 Bulk Procurement Requirements screens:
 * 1. Requirements Dashboard Screen
 * 2. Create Requirement Screen
 * 3. Select Products Screen
 * 4. Product Specifications Screen
 * 5. Quantity & Budget Screen
 * 6. Delivery Requirements Screen
 * 7. Review Requirement Screen
 *
 * Guarantees persistent form draft state across backward/forward navigation,
 * accurate currency rounding, isolated mock fallback if backend is offline,
 * and seamless CRUD.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeAsyncStorage } from '@/utils/safeStorage';
import { apiClient } from '@/services/apiClient';

export type ProcurementType =
  | 'COMMERCIAL_AGGREGATION'
  | 'FARM_INPUTS'
  | 'WHOLESALE_CONTRACT'
  | 'EXPORT_POOL';

export type RequirementStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'MATCHED'
  | 'IN_NEGOTIATION'
  | 'FULFILLED'
  | 'CANCELLED';

export type ProcurementUrgency = 'URGENT' | 'STANDARD' | 'FLEXIBLE';

export type ProductUnit = 'kg' | 'quintal' | 'tonne' | 'bags';

export interface ProductSpecifications {
  variety?: string;
  grade?: string;
  sizeDiameter?: string;
  moistureLevel?: string;
  packaging?: string;
  sortingQuality?: string;
  specialInstructions?: string;
  organicCertified?: boolean;
  brandPreference?: string;
  purityPct?: string;
}

export interface RequirementProduct {
  productId: string;
  productName: string;
  category: string;
  variety: string;
  grade: string;
  imageUri?: string;
  specifications: ProductSpecifications;
  quantity: number;
  unit: ProductUnit;
  targetPricePerUnit: number;
  maxCeilingPricePerUnit?: number;
  totalBudget: number; // Precision-rounded
}

export interface RequirementDelivery {
  deliveryDate: string; // YYYY-MM-DD
  deliveryDateEnd?: string; // Optional end of range
  destinationType: 'FARM_GATE' | 'MANDI_YARD' | 'COLD_STORAGE' | 'CUSTOM_DEPOT';
  destinationName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  logisticsPreference: 'BUYER_COLLECTION' | 'SELLER_DELIVERY' | 'MANDIKART_ASSISTED';
  constraints: string[];
  unloadingDockRequired: boolean;
  weighbridgeSlipRequired: boolean;
  staggeredSchedule?: boolean;
}

export interface RecurringSchedule {
  id: string;
  requirementId: string;
  title: string;
  cropName: string;
  frequency: 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  quantityPerCycle: number;
  unit: ProductUnit;
  targetPricePerUnit: number;
  startDate: string;
  endDate?: string;
  totalCycles?: number;
  completedCycles: number;
  nextDispatchDate: string;
  preferredDeliveryDay: string; // e.g. 'Monday'
  bufferDays: number;
  autoPublishTender: boolean;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementRequirement {
  id: string;
  draftId?: string;
  title: string;
  procurementType: ProcurementType;
  urgency: ProcurementUrgency;
  status: RequirementStatus;
  products: RequirementProduct[];
  totalQuantity: number;
  primaryUnit: ProductUnit;
  totalBudget: number;
  currency: 'INR';
  delivery: RequirementDelivery;
  matchedSuppliersCount: number;
  version?: number;
  isRecurring?: boolean;
  recurringScheduleId?: string;
  recurringFrequency?: 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  cancellationReason?: string;
  cancellationNotes?: string;
  cancelledAt?: string;
  materialChangeNotice?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementRequirementDraft {
  id?: string;
  draftId: string;
  title: string;
  procurementType: ProcurementType;
  urgency: ProcurementUrgency;
  products: RequirementProduct[];
  delivery: RequirementDelivery;
  notes?: string;
  lastSavedStep: number;
}

export interface CatalogProductPreset {
  id: string;
  name: string;
  category: string;
  defaultVariety: string;
  defaultGrade: string;
  defaultUnit: ProductUnit;
  imageUri: string;
  benchmarkPrice: number;
  description: string;
  allowedUnits: ProductUnit[];
}

export const CATALOG_PRODUCTS: CatalogProductPreset[] = [
  {
    id: 'prod_onion_01',
    name: 'Red Onion',
    category: 'Vegetables',
    defaultVariety: 'Nashik Red Garwa',
    defaultGrade: 'Grade A',
    defaultUnit: 'quintal',
    imageUri: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80',
    benchmarkPrice: 2400,
    description: 'Nashik Garwa cured export quality, size 45mm+',
    allowedUnits: ['quintal', 'tonne', 'kg'],
  },
  {
    id: 'prod_tomato_02',
    name: 'Tomato Hybrid',
    category: 'Vegetables',
    defaultVariety: 'Abhinav Hybrid 1057',
    defaultGrade: 'Grade A',
    defaultUnit: 'quintal',
    imageUri: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80',
    benchmarkPrice: 1850,
    description: 'Firm ripe table and processing tomatoes in plastic crates',
    allowedUnits: ['quintal', 'tonne', 'kg'],
  },
  {
    id: 'prod_potato_03',
    name: 'Potato',
    category: 'Vegetables',
    defaultVariety: 'Kufri Jyoti / Pukhraj',
    defaultGrade: 'Grade A',
    defaultUnit: 'quintal',
    imageUri: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80',
    benchmarkPrice: 1750,
    description: 'Fresh dug table potato with minimal dirt, 50kg burlap bags',
    allowedUnits: ['quintal', 'tonne', 'kg'],
  },
  {
    id: 'prod_garlic_04',
    name: 'Garlic Desi',
    category: 'Vegetables',
    defaultVariety: 'Desi G2 Bulb',
    defaultGrade: 'Grade A',
    defaultUnit: 'quintal',
    imageUri: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=500&auto=format&fit=crop&q=80',
    benchmarkPrice: 11500,
    description: 'Sun-dried 35mm+ pungent white bulbs in ventilated mesh bags',
    allowedUnits: ['quintal', 'kg'],
  },
  {
    id: 'prod_wheat_05',
    name: 'Sharbati Wheat',
    category: 'Grains',
    defaultVariety: 'MP Sharbati Golden',
    defaultGrade: 'Grade A',
    defaultUnit: 'quintal',
    imageUri: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80',
    benchmarkPrice: 2850,
    description: 'Premium milling grade, moisture <11%, certified seed origin',
    allowedUnits: ['quintal', 'tonne', 'bags'],
  },
  {
    id: 'prod_basmati_06',
    name: 'Basmati Paddy / Rice',
    category: 'Grains',
    defaultVariety: '1121 Steam Basmati',
    defaultGrade: 'Grade A',
    defaultUnit: 'quintal',
    imageUri: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80',
    benchmarkPrice: 3800,
    description: 'Aromatic extra-long slender grain, sorted and clean',
    allowedUnits: ['quintal', 'tonne', 'bags'],
  },
  {
    id: 'prod_chana_07',
    name: 'Chana / Desi Chickpea',
    category: 'Pulses',
    defaultVariety: 'Vijay Desi Chana',
    defaultGrade: 'Grade A',
    defaultUnit: 'quintal',
    imageUri: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&auto=format&fit=crop&q=80',
    benchmarkPrice: 5600,
    description: 'Machine cleaned bold desi chana, moisture <10%',
    allowedUnits: ['quintal', 'tonne', 'bags'],
  },
  {
    id: 'prod_soybean_08',
    name: 'Soybean',
    category: 'Oilseeds',
    defaultVariety: 'JS-335 Yellow',
    defaultGrade: 'Grade A',
    defaultUnit: 'quintal',
    imageUri: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=500&auto=format&fit=crop&q=80',
    benchmarkPrice: 4650,
    description: 'Oil content >18.5%, foreign matter <1%, dry storage',
    allowedUnits: ['quintal', 'tonne'],
  },
  {
    id: 'prod_dap_09',
    name: 'IFFCO DAP 18:46:00',
    category: 'Inputs',
    defaultVariety: 'Granular Fertilizer',
    defaultGrade: 'Commercial Grade',
    defaultUnit: 'bags',
    imageUri: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=500&auto=format&fit=crop&q=80',
    benchmarkPrice: 1350,
    description: 'Original 50kg sealed bags, bulk collective FPO intake',
    allowedUnits: ['bags', 'tonne'],
  },
  {
    id: 'prod_urea_10',
    name: 'Neem Coated Urea',
    category: 'Inputs',
    defaultVariety: 'Prilled Slow-Release',
    defaultGrade: 'Commercial Grade',
    defaultUnit: 'bags',
    imageUri: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=500&auto=format&fit=crop&q=80',
    benchmarkPrice: 268,
    description: '45kg standard subsidized allocation bags',
    allowedUnits: ['bags', 'tonne'],
  },
];

// Helper: accurate rounded multiplication without float issues
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function calculateProductTotal(qty: number, pricePerUnit: number): number {
  const q = Math.max(0, qty || 0);
  const p = Math.max(0, pricePerUnit || 0);
  return roundCurrency(q * p);
}

export function calculateRequirementTotalBudget(products: RequirementProduct[]): number {
  const sum = products.reduce((acc, curr) => acc + (curr.totalBudget || 0), 0);
  return roundCurrency(sum);
}

const DEFAULT_REQUIREMENTS: ProcurementRequirement[] = [
  {
    id: 'REQ-2026-101',
    draftId: 'REQ-DRAFT-101',
    title: 'Nashik Onion Export Aggregation Pool',
    procurementType: 'EXPORT_POOL',
    urgency: 'STANDARD',
    status: 'OPEN',
    products: [
      {
        productId: 'prod_onion_01',
        productName: 'Red Onion',
        category: 'Vegetables',
        variety: 'Nashik Red Garwa',
        grade: 'Grade A',
        imageUri: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80',
        specifications: {
          variety: 'Nashik Red Garwa',
          grade: 'Grade A',
          sizeDiameter: '45mm - 55mm export size',
          sortingQuality: 'Double-mesh machine sorted, zero skin peeling',
          packaging: 'Ventilated Red Mesh Bags (50kg)',
          specialInstructions: 'Well cured necks, dry leaves trimmed to 1 inch',
          organicCertified: false,
        },
        quantity: 120,
        unit: 'quintal',
        targetPricePerUnit: 2350,
        maxCeilingPricePerUnit: 2500,
        totalBudget: 282000,
      },
    ],
    totalQuantity: 120,
    primaryUnit: 'quintal',
    totalBudget: 282000,
    currency: 'INR',
    delivery: {
      deliveryDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
      destinationType: 'COLD_STORAGE',
      destinationName: 'Pimpalgaon Export Hub & Cold Terminal',
      address: 'Plot 44, MIDC Agro Complex, Pimpalgaon Baswant',
      city: 'Nashik',
      state: 'Maharashtra',
      pincode: '422209',
      landmark: 'Near Highway Weighbridge 2',
      logisticsPreference: 'MANDIKART_ASSISTED',
      constraints: ['Weighbridge slip required', 'Unloading dock inspection mandatory'],
      unloadingDockRequired: true,
      weighbridgeSlipRequired: true,
      staggeredSchedule: false,
    },
    matchedSuppliersCount: 4,
    notes: 'Commercial export pool requirement for Dubai/Gulf container shipping.',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'REQ-2026-102',
    draftId: 'REQ-DRAFT-102',
    title: 'Kharif Input Collective Fertilizer Order',
    procurementType: 'FARM_INPUTS',
    urgency: 'URGENT',
    status: 'MATCHED',
    products: [
      {
        productId: 'prod_dap_09',
        productName: 'IFFCO DAP 18:46:00',
        category: 'Inputs',
        variety: 'Granular Phosphate',
        grade: 'Commercial Grade',
        imageUri: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=500&auto=format&fit=crop&q=80',
        specifications: {
          brandPreference: 'IFFCO / KRIBHCO certified',
          packaging: 'Original factory 50kg bags',
          specialInstructions: 'Immediate delivery for sowing window',
        },
        quantity: 300,
        unit: 'bags',
        targetPricePerUnit: 1350,
        totalBudget: 405000,
      },
    ],
    totalQuantity: 300,
    primaryUnit: 'bags',
    totalBudget: 405000,
    currency: 'INR',
    delivery: {
      deliveryDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
      destinationType: 'FARM_GATE',
      destinationName: 'Dindori Kisan FPO Aggregation Yard',
      address: 'Survey 112, Dindori Agro Centre',
      city: 'Dindori',
      state: 'Maharashtra',
      pincode: '422202',
      logisticsPreference: 'SELLER_DELIVERY',
      constraints: ['Direct offloading at warehouse'],
      unloadingDockRequired: false,
      weighbridgeSlipRequired: true,
    },
    matchedSuppliersCount: 6,
    notes: 'Member farmers pre-funded collective order.',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'REQ-DRAFT-90412',
    draftId: 'REQ-DRAFT-90412',
    title: 'Processing Tomato Summer Intake',
    procurementType: 'WHOLESALE_CONTRACT',
    urgency: 'STANDARD',
    status: 'DRAFT',
    products: [
      {
        productId: 'prod_tomato_02',
        productName: 'Tomato Hybrid',
        category: 'Vegetables',
        variety: 'Abhinav Hybrid 1057',
        grade: 'Grade A',
        imageUri: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80',
        specifications: {
          variety: 'Abhinav Hybrid',
          grade: 'Grade A',
          sortingQuality: 'Firm deep-red ripe, no mechanical punctures',
          packaging: 'Plastic Crates (25kg)',
        },
        quantity: 50,
        unit: 'quintal',
        targetPricePerUnit: 1800,
        totalBudget: 90000,
      },
    ],
    totalQuantity: 50,
    primaryUnit: 'quintal',
    totalBudget: 90000,
    currency: 'INR',
    delivery: {
      deliveryDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      destinationType: 'CUSTOM_DEPOT',
      destinationName: 'Kisan Food Processing Facility',
      address: 'Gate 2, MIDC Agro Park',
      city: 'Nashik',
      state: 'Maharashtra',
      pincode: '422010',
      logisticsPreference: 'BUYER_COLLECTION',
      constraints: ['Inspection before crate loading'],
      unloadingDockRequired: true,
      weighbridgeSlipRequired: false,
    },
    matchedSuppliersCount: 0,
    notes: 'Draft awaiting member committee approval.',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'REQ-2026-089',
    draftId: 'REQ-DRAFT-089',
    title: 'Lokwan Milling Wheat Sourcing',
    procurementType: 'COMMERCIAL_AGGREGATION',
    urgency: 'FLEXIBLE',
    status: 'FULFILLED',
    products: [
      {
        productId: 'prod_wheat_05',
        productName: 'Sharbati Wheat',
        category: 'Grains',
        variety: 'MP Sharbati Golden',
        grade: 'Grade A',
        imageUri: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80',
        specifications: {
          variety: 'MP Sharbati Golden',
          grade: 'Grade A',
          moistureLevel: '<10.5% dry',
          packaging: 'New Jute Bags (50kg)',
        },
        quantity: 200,
        unit: 'quintal',
        targetPricePerUnit: 2700,
        totalBudget: 540000,
      },
    ],
    totalQuantity: 200,
    primaryUnit: 'quintal',
    totalBudget: 540000,
    currency: 'INR',
    delivery: {
      deliveryDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      destinationType: 'MANDI_YARD',
      destinationName: 'Kalyan Wholesale APMC Silo Depot',
      address: 'Main Gate Yard Silo 3',
      city: 'Thane',
      state: 'Maharashtra',
      pincode: '421301',
      logisticsPreference: 'SELLER_DELIVERY',
      constraints: ['Quality moisture testing certificate'],
      unloadingDockRequired: true,
      weighbridgeSlipRequired: true,
    },
    matchedSuppliersCount: 8,
    notes: 'Consignment successfully accepted and settled via MandiKart Escrow.',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

interface RequirementsState {
  requirements: ProcurementRequirement[];
  activeDraft: ProcurementRequirementDraft | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  startNewDraft: (type?: ProcurementType) => string;
  updateActiveDraft: (partial: Partial<ProcurementRequirementDraft>) => void;
  toggleProductInDraft: (productPreset: CatalogProductPreset) => void;
  removeProductFromDraft: (productId: string) => void;
  updateProductSpecs: (productId: string, specs: Partial<ProductSpecifications>) => void;
  updateProductQuantityAndPrice: (
    productId: string,
    quantity: number,
    unit: ProductUnit,
    targetPrice: number,
    maxCeilingPrice?: number
  ) => void;
  updateDraftDelivery: (delivery: Partial<RequirementDelivery>) => void;
  saveDraft: () => Promise<{ success: boolean; id: string; error?: string }>;
  loadDraft: (draftOrReqId: string) => boolean;
  clearActiveDraft: () => void;
  publishRequirement: () => Promise<{
    success: boolean;
    requirement?: ProcurementRequirement;
    error?: string;
  }>;
  recurringSchedules: RecurringSchedule[];
  getRequirementById: (id: string) => ProcurementRequirement | undefined;
  publishRequirementById: (id: string) => Promise<{ success: boolean; error?: string }>;
  updateRequirement: (
    id: string,
    updates: Partial<ProcurementRequirement>,
    isMaterialChange?: boolean
  ) => Promise<{ success: boolean; version?: number; error?: string }>;
  cancelRequirement: (
    id: string,
    reason: string,
    notes?: string
  ) => Promise<{ success: boolean; error?: string }>;
  createRecurringSchedule: (
    schedule: Omit<RecurringSchedule, 'id' | 'completedCycles' | 'status' | 'createdAt' | 'updatedAt'>
  ) => Promise<{ success: boolean; scheduleId: string; error?: string }>;
  getRecurringScheduleByReqId: (reqId: string) => RecurringSchedule | undefined;
  toggleRecurringScheduleStatus: (scheduleId: string) => void;
  deleteRequirement: (id: string) => Promise<{ success: boolean }>;
  duplicateRequirement: (id: string) => string;
  syncWithBackend: () => Promise<void>;
}

export const useRequirementsStore = create<RequirementsState>()(
  persist(
    (set, get) => ({
      requirements: DEFAULT_REQUIREMENTS,
      recurringSchedules: [
        {
          id: 'SCHED-881290',
          requirementId: 'REQ-2026-101',
          title: 'Weekly Onion Export Batch Dispatch',
          cropName: 'Red Onion',
          frequency: 'WEEKLY',
          quantityPerCycle: 60,
          unit: 'quintal',
          targetPricePerUnit: 2350,
          startDate: new Date().toISOString().split('T')[0],
          totalCycles: 8,
          completedCycles: 1,
          nextDispatchDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          preferredDeliveryDay: 'Monday',
          bufferDays: 2,
          autoPublishTender: true,
          status: 'ACTIVE',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      activeDraft: null,
      isLoading: false,
      error: null,

      startNewDraft: (type: ProcurementType = 'COMMERCIAL_AGGREGATION') => {
        const draftId = `REQ-DRAFT-${Math.floor(100000 + Math.random() * 900000)}`;
        const initialDelivery: RequirementDelivery = {
          deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          destinationType: 'MANDI_YARD',
          destinationName: 'APMC Market Yard Central Depot',
          address: 'Main Gate Depot, Market Yard',
          city: 'Nashik',
          state: 'Maharashtra',
          pincode: '422003',
          logisticsPreference: 'MANDIKART_ASSISTED',
          constraints: ['Weighbridge slip required'],
          unloadingDockRequired: true,
          weighbridgeSlipRequired: true,
          staggeredSchedule: false,
        };

        const newDraft: ProcurementRequirementDraft = {
          draftId,
          title: 'Bulk Produce Procurement',
          procurementType: type,
          urgency: 'STANDARD',
          products: [],
          delivery: initialDelivery,
          notes: '',
          lastSavedStep: 1,
        };

        set({ activeDraft: newDraft, error: null });
        return draftId;
      },

      updateActiveDraft: (partial) => {
        const current = get().activeDraft;
        if (!current) return;
        set({ activeDraft: { ...current, ...partial } });
      },

      toggleProductInDraft: (preset: CatalogProductPreset) => {
        const current = get().activeDraft;
        if (!current) return;

        const existingIdx = current.products.findIndex((p) => p.productId === preset.id);
        let updatedProducts: RequirementProduct[] = [];

        if (existingIdx >= 0) {
          // Remove product
          updatedProducts = current.products.filter((p) => p.productId !== preset.id);
        } else {
          // Add product with safe defaults
          const defaultQty = preset.defaultUnit === 'bags' ? 100 : 50;
          const defaultPrice = preset.benchmarkPrice;
          const totalBudget = calculateProductTotal(defaultQty, defaultPrice);

          const newProduct: RequirementProduct = {
            productId: preset.id,
            productName: preset.name,
            category: preset.category,
            variety: preset.defaultVariety,
            grade: preset.defaultGrade,
            imageUri: preset.imageUri,
            specifications: {
              variety: preset.defaultVariety,
              grade: preset.defaultGrade,
              sizeDiameter: preset.category === 'Vegetables' ? '45mm+' : undefined,
              moistureLevel: preset.category === 'Grains' ? '<11%' : undefined,
              packaging:
                preset.category === 'Vegetables'
                  ? 'Mesh Bags (50kg)'
                  : preset.category === 'Inputs'
                  ? 'Factory Sealed Bags'
                  : 'New Jute Bags (50kg)',
              sortingQuality: 'Standard Sorting',
              organicCertified: false,
            },
            quantity: defaultQty,
            unit: preset.defaultUnit,
            targetPricePerUnit: defaultPrice,
            maxCeilingPricePerUnit: Math.round(defaultPrice * 1.08),
            totalBudget,
          };
          updatedProducts = [...current.products, newProduct];
        }

        // Auto update title if generic
        let updatedTitle = current.title;
        if (updatedProducts.length === 1) {
          updatedTitle = `${updatedProducts[0].productName} Procurement`;
        } else if (updatedProducts.length > 1) {
          updatedTitle = `${updatedProducts[0].productName} + ${updatedProducts.length - 1} Crops Pool`;
        }

        set({
          activeDraft: {
            ...current,
            products: updatedProducts,
            title: updatedTitle,
          },
        });
      },

      removeProductFromDraft: (productId: string) => {
        const current = get().activeDraft;
        if (!current) return;
        const updatedProducts = current.products.filter((p) => p.productId !== productId);
        set({
          activeDraft: {
            ...current,
            products: updatedProducts,
          },
        });
      },

      updateProductSpecs: (productId, specs) => {
        const current = get().activeDraft;
        if (!current) return;

        const updatedProducts = current.products.map((p) => {
          if (p.productId === productId) {
            return {
              ...p,
              variety: specs.variety || p.variety,
              grade: specs.grade || p.grade,
              specifications: {
                ...p.specifications,
                ...specs,
              },
            };
          }
          return p;
        });

        set({ activeDraft: { ...current, products: updatedProducts } });
      },

      updateProductQuantityAndPrice: (productId, quantity, unit, targetPrice, maxCeiling) => {
        const current = get().activeDraft;
        if (!current) return;

        const validQty = Math.max(0, quantity);
        const validPrice = Math.max(0, targetPrice);
        const totalBudget = calculateProductTotal(validQty, validPrice);

        const updatedProducts = current.products.map((p) => {
          if (p.productId === productId) {
            return {
              ...p,
              quantity: validQty,
              unit,
              targetPricePerUnit: validPrice,
              maxCeilingPricePerUnit: maxCeiling ? Math.max(validPrice, maxCeiling) : undefined,
              totalBudget,
            };
          }
          return p;
        });

        set({ activeDraft: { ...current, products: updatedProducts } });
      },

      updateDraftDelivery: (deliveryUpdates) => {
        const current = get().activeDraft;
        if (!current) return;
        set({
          activeDraft: {
            ...current,
            delivery: {
              ...current.delivery,
              ...deliveryUpdates,
            },
          },
        });
      },

      saveDraft: async () => {
        const draft = get().activeDraft;
        if (!draft) return { success: false, id: '', error: 'No active draft' };

        const id = draft.id || draft.draftId;
        const now = new Date().toISOString();
        const totalBudget = calculateRequirementTotalBudget(draft.products);
        const totalQuantity = draft.products.reduce((acc, p) => acc + (p.quantity || 0), 0);
        const primaryUnit = draft.products[0]?.unit || 'quintal';

        const savedReq: ProcurementRequirement = {
          id,
          draftId: draft.draftId,
          title: draft.title || 'Draft Bulk Requirement',
          procurementType: draft.procurementType,
          urgency: draft.urgency,
          status: 'DRAFT',
          products: draft.products,
          totalQuantity,
          primaryUnit,
          totalBudget,
          currency: 'INR',
          delivery: draft.delivery,
          matchedSuppliersCount: 0,
          notes: draft.notes,
          createdAt: now,
          updatedAt: now,
        };

        // Update list
        const list = get().requirements;
        const existingIdx = list.findIndex((r) => r.id === id || r.draftId === draft.draftId);
        let updatedList: ProcurementRequirement[];
        if (existingIdx >= 0) {
          updatedList = [...list];
          updatedList[existingIdx] = savedReq;
        } else {
          updatedList = [savedReq, ...list];
        }

        set({ requirements: updatedList, activeDraft: { ...draft, id } });

        // Sync with backend asynchronously (silent fallback)
        try {
          await apiClient.createBulkRequirement({
            ...savedReq,
            status: 'DRAFT',
          });
        } catch {}

        return { success: true, id };
      },

      loadDraft: (idOrDraftId: string) => {
        const req = get().requirements.find(
          (r) => r.id === idOrDraftId || r.draftId === idOrDraftId
        );
        if (!req) return false;

        const draft: ProcurementRequirementDraft = {
          id: req.id,
          draftId: req.draftId || req.id,
          title: req.title,
          procurementType: req.procurementType,
          urgency: req.urgency,
          products: req.products || [],
          delivery: req.delivery,
          notes: req.notes,
          lastSavedStep: 1,
        };

        set({ activeDraft: draft, error: null });
        return true;
      },

      clearActiveDraft: () => {
        set({ activeDraft: null });
      },

      publishRequirement: async () => {
        const draft = get().activeDraft;
        if (!draft) {
          return { success: false, error: 'No active requirement draft to publish.' };
        }

        if (draft.products.length === 0) {
          return { success: false, error: 'Please select at least one product before publishing.' };
        }

        const totalBudget = calculateRequirementTotalBudget(draft.products);
        const totalQuantity = draft.products.reduce((acc, p) => acc + (p.quantity || 0), 0);
        const primaryUnit = draft.products[0]?.unit || 'quintal';
        const now = new Date().toISOString();
        const publishedId = `REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

        const publishedReq: ProcurementRequirement = {
          id: publishedId,
          draftId: draft.draftId,
          title: draft.title || `${draft.products[0].productName} Bulk Procurement`,
          procurementType: draft.procurementType,
          urgency: draft.urgency,
          status: 'OPEN',
          products: draft.products,
          totalQuantity,
          primaryUnit,
          totalBudget,
          currency: 'INR',
          delivery: draft.delivery,
          matchedSuppliersCount: Math.floor(2 + Math.random() * 4),
          notes: draft.notes,
          createdAt: now,
          updatedAt: now,
        };

        set({ isLoading: true });
        try {
          // Attempt actual backend publish
          await apiClient.createBulkRequirement(publishedReq);
        } catch (e) {
          console.warn('Backend publish fallback to isolated local store:', e);
        }

        // Update in-memory state: remove the draft or mark published
        const list = get().requirements.filter((r) => r.draftId !== draft.draftId);
        set({
          requirements: [publishedReq, ...list],
          activeDraft: null,
          isLoading: false,
          error: null,
        });

        return { success: true, requirement: publishedReq };
      },

      deleteRequirement: async (id: string) => {
        const list = get().requirements.filter((r) => r.id !== id && r.draftId !== id);
        set({ requirements: list });

        try {
          await apiClient.deleteBulkRequirement(id);
        } catch {}

        return { success: true };
      },

      duplicateRequirement: (id: string) => {
        const req = get().requirements.find((r) => r.id === id);
        if (!req) return '';

        const newDraftId = `REQ-DRAFT-${Math.floor(100000 + Math.random() * 900000)}`;
        const duplicatedDraft: ProcurementRequirementDraft = {
          draftId: newDraftId,
          title: `${req.title} (Copy)`,
          procurementType: req.procurementType,
          urgency: req.urgency,
          products: req.products.map((p) => ({ ...p })),
          delivery: { ...req.delivery },
          notes: req.notes,
          lastSavedStep: 1,
        };

        set({ activeDraft: duplicatedDraft, error: null });
        return newDraftId;
      },

      getRequirementById: (id: string) => {
        return get().requirements.find((r) => r.id === id || r.draftId === id);
      },

      publishRequirementById: async (id: string) => {
        const item = get().requirements.find((r) => r.id === id || r.draftId === id);
        if (!item) return { success: false, error: 'Requirement not found.' };

        const updated: ProcurementRequirement = {
          ...item,
          status: 'OPEN',
          version: item.version || 1,
          updatedAt: new Date().toISOString(),
        };

        set({ isLoading: true });
        try {
          await apiClient.updateBulkRequirement(id, { status: 'OPEN' });
        } catch (e) {
          console.warn('Backend publish update fallback to local store:', e);
        }

        const list = get().requirements.map((r) => (r.id === id ? updated : r));
        set({ requirements: list, isLoading: false, error: null });
        return { success: true };
      },

      updateRequirement: async (id: string, updates: Partial<ProcurementRequirement>, isMaterialChange = false) => {
        const current = get().requirements.find((r) => r.id === id || r.draftId === id);
        if (!current) return { success: false, error: 'Requirement not found.' };

        const newVersion = isMaterialChange ? (current.version || 1) + 1 : (current.version || 1);
        const materialNotice = isMaterialChange
          ? `Specification revised to v${newVersion}. Bidding suppliers will receive an amendment update.`
          : current.materialChangeNotice;

        const mergedProducts = updates.products || current.products;
        const totalBudget = calculateRequirementTotalBudget(mergedProducts);
        const totalQuantity = mergedProducts.reduce((acc, p) => acc + (p.quantity || 0), 0);

        const updatedReq: ProcurementRequirement = {
          ...current,
          ...updates,
          version: newVersion,
          materialChangeNotice: materialNotice,
          totalBudget,
          totalQuantity,
          updatedAt: new Date().toISOString(),
        };

        set({ isLoading: true });
        try {
          await apiClient.updateBulkRequirement(id, updatedReq);
        } catch (e) {
          console.warn('Backend update fallback to local store:', e);
        }

        const list = get().requirements.map((r) => (r.id === id ? updatedReq : r));
        set({ requirements: list, isLoading: false, error: null });
        return { success: true, version: newVersion };
      },

      cancelRequirement: async (id: string, reason: string, notes = '') => {
        const current = get().requirements.find((r) => r.id === id || r.draftId === id);
        if (!current) return { success: false, error: 'Requirement not found.' };

        if (current.status === 'CANCELLED') {
          return { success: false, error: 'Requirement is already cancelled.' };
        }
        if (current.status === 'FULFILLED') {
          return { success: false, error: 'Cannot cancel a fulfilled contract.' };
        }

        const now = new Date().toISOString();
        const cancelledReq: ProcurementRequirement = {
          ...current,
          status: 'CANCELLED',
          cancellationReason: reason,
          cancellationNotes: notes,
          cancelledAt: now,
          updatedAt: now,
        };

        set({ isLoading: true });
        try {
          await apiClient.cancelBulkRequirement(id, { reason, notes });
        } catch (e) {
          console.warn('Backend cancel fallback to local store:', e);
        }

        const list = get().requirements.map((r) => (r.id === id ? cancelledReq : r));
        set({ requirements: list, isLoading: false, error: null });
        return { success: true };
      },

      createRecurringSchedule: async (scheduleInput) => {
        const scheduleId = `SCHED-${Math.floor(100000 + Math.random() * 900000)}`;
        const now = new Date().toISOString();

        const newSchedule: RecurringSchedule = {
          ...scheduleInput,
          id: scheduleId,
          completedCycles: 0,
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        };

        const currentReq = get().requirements.find((r) => r.id === scheduleInput.requirementId);
        let updatedRequirements = get().requirements;
        if (currentReq) {
          const updatedReq: ProcurementRequirement = {
            ...currentReq,
            isRecurring: true,
            recurringScheduleId: scheduleId,
            recurringFrequency: scheduleInput.frequency,
            updatedAt: now,
          };
          updatedRequirements = get().requirements.map((r) =>
            r.id === currentReq.id ? updatedReq : r
          );
        }

        set((state) => ({
          recurringSchedules: [newSchedule, ...state.recurringSchedules],
          requirements: updatedRequirements,
        }));

        return { success: true, scheduleId };
      },

      getRecurringScheduleByReqId: (reqId: string) => {
        return get().recurringSchedules.find((s) => s.requirementId === reqId);
      },

      toggleRecurringScheduleStatus: (scheduleId: string) => {
        set((state) => ({
          recurringSchedules: state.recurringSchedules.map((s) => {
            if (s.id !== scheduleId) return s;
            const newStatus = s.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
            return { ...s, status: newStatus, updatedAt: new Date().toISOString() };
          }),
        }));
      },

      syncWithBackend: async () => {
        set({ isLoading: true });
        try {
          const remoteDemands: any[] = await apiClient.getBulkRequirements();
          if (Array.isArray(remoteDemands) && remoteDemands.length > 0) {
            // Merge remote demands with local drafts
            const localDrafts = get().requirements.filter((r) => r.status === 'DRAFT');
            const mappedRemotes: ProcurementRequirement[] = remoteDemands.map((d) => {
              const unit = (d.quantityUnit || 'quintal') as ProductUnit;
              const qty = d.requiredQuantity || d.totalQuantity || 100;
              const price = d.maxTargetPricePerUnit || 2400;
              const budget = d.totalBudget || calculateProductTotal(qty, price);

              return {
                id: d.id,
                draftId: d.draftId || d.id,
                title: d.title || `${d.cropName || 'Produce'} Bulk Requirement`,
                procurementType: (d.buyerType as any) || 'COMMERCIAL_AGGREGATION',
                urgency: (d.urgency as any) || 'STANDARD',
                status: d.status === 'FULFILLED' ? 'FULFILLED' : d.status === 'DRAFT' ? 'DRAFT' : 'OPEN',
                products: d.products && d.products.length > 0 ? d.products : [
                  {
                    productId: `p_${d.id}`,
                    productName: d.cropName || 'Fresh Produce',
                    category: 'Vegetables',
                    variety: d.grade ? `Grade ${d.grade}` : 'Standard',
                    grade: d.grade ? `Grade ${d.grade}` : 'Grade A',
                    specifications: {
                      sortingQuality: d.inspectionRequirement || 'Standard Grade Sorting',
                    },
                    quantity: qty,
                    unit,
                    targetPricePerUnit: price,
                    totalBudget: budget,
                  },
                ],
                totalQuantity: qty,
                primaryUnit: unit,
                totalBudget: budget,
                currency: 'INR',
                delivery: d.delivery || {
                  deliveryDate: d.requiredByDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                  destinationType: 'MANDI_YARD',
                  destinationName: d.deliveryLocation || 'Nashik Central Depot',
                  address: d.deliveryLocation || 'Nashik Central Depot',
                  city: 'Nashik',
                  state: 'Maharashtra',
                  pincode: '422003',
                  logisticsPreference: 'MANDIKART_ASSISTED',
                  constraints: [],
                  unloadingDockRequired: true,
                  weighbridgeSlipRequired: true,
                },
                matchedSuppliersCount: d.matchedSupplierCount || 2,
                notes: d.notes,
                createdAt: d.createdAt || new Date().toISOString(),
                updatedAt: d.updatedAt || new Date().toISOString(),
              };
            });

            // Combine unique by ID
            const combined = [...localDrafts];
            for (const r of mappedRemotes) {
              if (!combined.some((c) => c.id === r.id)) {
                combined.push(r);
              }
            }
            set({ requirements: combined, isLoading: false, error: null });
            return;
          }
        } catch (e: any) {
          set({ error: e?.message || 'Failed to sync requirements', isLoading: false });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'mandikart-requirements-store',
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) =>
        ({
          requirements: state.requirements,
          activeDraft: state.activeDraft,
          recurringSchedules: state.recurringSchedules,
        } as any),
    }
  )
);
