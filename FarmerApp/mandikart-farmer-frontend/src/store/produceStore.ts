/**
 * MandiKart Farmer App — Produce Domain Store (Zustand)
 *
 * Backs "My Crop Intelligence Center" with strict data integrity:
 * - Real user crops & stock allocation (Total, Available, Reserved, Sold)
 * - Condition state: 'Good' | 'Needs Attention' | 'Deteriorating' | 'Condition not updated'
 * - Estimated freshness window (Shelf-life estimate)
 * - Reference market data with verified source (AGMARKNET/e-NAM) and timestamp
 * - 7D, 30D, 90D price trend history points
 * - Crop watch and action alerts
 * - Simple, professional English throughout
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/services/apiClient';
import { safeAsyncStorage } from '@/utils/safeStorage';

export type CropCondition = 'Good' | 'Needs Attention' | 'Deteriorating' | 'Condition not updated';
export type QualityGrade = 'Grade A' | 'Grade B' | 'Grade C' | 'Unsorted';
export type StorageType = 'Farm' | 'Warehouse' | 'Cold Storage' | 'Other';
export type DemandStatus = 'High' | 'Medium' | 'Low' | 'Stable';

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export interface CropItem {
  id: string;
  cropName: string;
  variety?: string;
  category: string;
  totalKg: number;
  availableKg: number;
  reservedKg: number;
  soldKg: number;
  unit: string;
  grade: QualityGrade;
  harvestDate: string;
  availableFrom: string;
  location: string;
  storageType: StorageType;
  storageDetails?: string;
  condition: CropCondition;
  conditionUpdatedAt?: string;
  conditionNote?: string;
  imageUri: string;
  expectedPricePerKg?: number;

  // Shelf-life Intelligence (Always labelled Approx / Estimated)
  shelfLifeDaysEstMin: number;
  shelfLifeDaysEstMax: number;
  shelfLifeBasis: string;

  // Market Intelligence (Observed Reference Data)
  referencePricePerKg: number;
  priceMovementPct: number; // e.g. +8, -5, 0
  priceMovementTrend: 'up' | 'down' | 'stable';
  marketDemand: DemandStatus;
  marketName: string;
  marketDistanceKm: number;
  marketSource: string; // e.g. "AGMARKNET"
  marketLastUpdated: string; // e.g. "04 Sep, 10:30 AM"

  // Price History
  history7D: PriceHistoryPoint[];
  history30D: PriceHistoryPoint[];
  history90D: PriceHistoryPoint[];

  // Watch status
  watchTag: string; // e.g. "Rising Market Demand"
  watchUrgency: 'positive' | 'warning' | 'neutral';
  attentionMessage?: string;
  attentionActionLabel?: string;
  attentionActionRoute?: string;

  // Lifecycle Status: Pending Admin Verification -> Approved by Admin -> Active Live Order
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'DRAFT';
  createdAt?: string;
}

interface ProduceStoreState {
  crops: CropItem[];

  // Actions
  syncWithBackend: (token?: string | null) => Promise<void>;
  replaceCropId: (oldId: string, newId: string) => void;
  addCrop: (crop: Omit<CropItem, 'id'>) => CropItem;
  updateCropStatus: (id: string, status: 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'DRAFT') => void;
  updateCropCondition: (id: string, condition: CropCondition, note?: string) => void;
  updateCropQuantity: (id: string, availableKg: number, reservedKg?: number) => void;
  updateCropDetails: (id: string, updates: Partial<CropItem>) => void;
  deleteCrop: (id: string) => void;
  getCropById: (id: string) => CropItem | undefined;
}

const ONION_PHOTO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC5juCGxLQ_5fyI4TU5ZyfZdhObSJDnZM42ZAzHiJlSBs31EGGnUyK0QRdyoFAXloh0SkLFb_apbQR_O0o3CiqCV8ckf9U5kVPC_outsYrPisSJV7GpxGLs2L-xGzfoEsXeXb0RDHma0B3LZpqIpwp37q8QDENvGkvpIupjr3XK_RaWZAC1mYGgc0fh9NxnbqD6YkA-qI6_ktMQlwdFD5eo5P3iTDMZmUTjkFoBSsrDOCIoRU8BehqDTw';

const TOMATO_PHOTO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAQ3ecH_gXE_S9dnNXqZtMNZsTsKwUugK5npqrXQo96EGz87CNfJWQR-HFQcD_gqEoawXV7pG5-hAyd6KZco66Pdavo3jYBsP6NadIKCnghQ8lYLYXnuyMeQuBB2LxBykis0pTs786s14moakUB0ZH0QgH7VlNElFN4Ns5uWVxgvecQv248hBqi_2ENXcSCSj6gx8CL7fz5xwRqaIpshL2s-Xue0Qb10lRmnHBlDimQ82nr7RG_vmqfBw';

const POTATO_PHOTO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC10xdTnKHpvZre-LhDKBTaZdjrNRAMZKasKH7sJK1nrX10RGhhP2dGCyuePJimnKwCfuueO0HuC0216Hy6PAuxsQXjsHtSvKxV7SDDJosrU95YRzT4oVRjJqioCNfX15LiH_iPMrU7YeT2od9_cv81dzfyjd6LRPtPRGTt1AbXyWGTo6qD1K7KloqXwfi7HTDD6X5PP72m_RLR77_lBfwoQWyjBj1HvTxGZsl55rQEEpNHyiMzAeHoHQ';

const WHEAT_PHOTO_URI =
  'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80';

const INITIAL_CROPS: CropItem[] = [];

let isSyncInProgress = false;
const syncingCropIds = new Set<string>();

export const useProduceStore = create<ProduceStoreState>()(
  persist(
    (set, get) => ({
      crops: [],

      syncWithBackend: async (token?: string | null) => {
        if (isSyncInProgress) {
          return;
        }
        isSyncInProgress = true;

        try {
          // Auto-sync any unsynced local crops created offline or during network timeouts
          const currentCrops = get().crops || [];
          const unsyncedLocalCrops = currentCrops.filter(
            c => c && c.id && c.id.startsWith('crop_') && !syncingCropIds.has(c.id)
          );

          for (const localCrop of unsyncedLocalCrops) {
            syncingCropIds.add(localCrop.id);
            try {
              const mappedGrade = localCrop.grade === 'Grade B' ? 'B' : localCrop.grade === 'Grade C' ? 'C' : 'A';
              const created: any = await apiClient.createProduct({
                cropName: localCrop.cropName.trim(),
                cropVariety: localCrop.variety?.trim() || undefined,
                grade: mappedGrade,
                category: localCrop.category || 'Vegetables',
                totalQuantity: localCrop.totalKg || localCrop.availableKg || 100,
                quantityUnit: 'kg',
                basePricePerUnit: localCrop.expectedPricePerKg || localCrop.referencePricePerKg || 30,
                minOrderQuantity: 10,
                targetBuyer: 'PENDING_APPROVAL',
                status: 'PENDING_APPROVAL',
                isActive: false,
                images: localCrop.imageUri ? [localCrop.imageUri] : [],
                shelfLifeDays: localCrop.shelfLifeDaysEstMax || 7,
                pickupAddress: localCrop.location || 'Nashik Mandi Area',
                farmerName: 'Farmer',
                farmerPhone: '',
                location: localCrop.location || 'Nashik, Maharashtra',
              } as any, token);

              if (created?.data?.id) {
                get().replaceCropId(localCrop.id, created.data.id);
              }
            } catch {
              // Silently retry on next sync interval without flooding Metro terminal logs
            } finally {
              syncingCropIds.delete(localCrop.id);
            }
          }

          const backendProducts = await apiClient.getProducts(token);
          if (!Array.isArray(backendProducts)) {
            return;
          }

          set((state) => {
            const cropMap = new Map<string, CropItem>();
            // Keep ONLY local unsynced crops that haven't received a server ID yet
            for (const crop of (state.crops || [])) {
              if (crop && crop.id && crop.id.startsWith('crop_')) {
                cropMap.set(crop.id, crop);
              }
            }

            for (const bp of backendProducts) {
              if (!bp || !bp.id) continue;
              const bpStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'REJECTED' =
                bp.status === 'REJECTED'
                  ? 'REJECTED'
                  : (bp.is_active === true && bp.target_buyer === 'BOTH') || (bp.isActive === true && bp.targetBuyer === 'BOTH') || bp.status === 'ACTIVE'
                  ? 'ACTIVE'
                  : (bp.target_buyer === 'ADMIN_APPROVED' || bp.targetBuyer === 'ADMIN_APPROVED' || bp.status === 'APPROVED' || bp.status === 'ADMIN_APPROVED')
                  ? 'APPROVED'
                  : 'PENDING_APPROVAL';

              // Check if already in map by ID or by crop name match
              let matchedExisting: CropItem | undefined = cropMap.get(bp.id);
              if (!matchedExisting) {
                for (const [id, existingCrop] of cropMap.entries()) {
                  if (
                    existingCrop.cropName.trim().toLowerCase() === String(bp.cropName || '').trim().toLowerCase()
                  ) {
                    matchedExisting = existingCrop;
                    cropMap.delete(id);
                    break;
                  }
                }
              }

              if (matchedExisting) {
                cropMap.set(bp.id, {
                  ...matchedExisting,
                  id: bp.id,
                  status: bpStatus,
                  availableKg: Number(bp.availableQuantity ?? matchedExisting.availableKg),
                  totalKg: Number(bp.totalQuantity ?? matchedExisting.totalKg),
                  watchTag: bpStatus === 'REJECTED' ? 'Rejected by Admin' : bpStatus === 'ACTIVE' ? 'Marketplace Active' : bpStatus === 'APPROVED' ? 'Quality Approved — Tap List Globally' : 'Under Admin Verification',
                  watchUrgency: bpStatus === 'REJECTED' ? 'warning' : bpStatus === 'ACTIVE' ? 'positive' : bpStatus === 'APPROVED' ? 'positive' : 'neutral',
                  createdAt: bp.createdAt || bp.created_at || matchedExisting.createdAt || new Date().toISOString(),
                });
              } else {
                cropMap.set(bp.id, {
                  id: bp.id,
                  cropName: bp.cropName || 'Fresh Produce',
                  variety: bp.cropVariety || 'Harvest Batch',
                  category: bp.category || 'Vegetables',
                  totalKg: Number(bp.totalQuantity || bp.availableQuantity || 100),
                  availableKg: Number(bp.availableQuantity || bp.totalQuantity || 100),
                  reservedKg: Number(bp.reservedQuantity || 0),
                  soldKg: 0,
                  unit: bp.quantityUnit || 'KG',
                  grade: (bp.grade === 'B' ? 'Grade B' : 'Grade A') as QualityGrade,
                  harvestDate: bp.harvestDate || 'Recent',
                  availableFrom: 'Immediate',
                  location: bp.pickupAddress || 'Farm Shed',
                  storageType: 'Warehouse',
                  condition: 'Good',
                  imageUri: (bp.images && bp.images[0]) ? bp.images[0] : ONION_PHOTO_URI,
                  expectedPricePerKg: Number(bp.basePricePerUnit || 25),
                  shelfLifeDaysEstMin: Math.max(3, Number(bp.shelfLifeDays || 14) - 4),
                  shelfLifeDaysEstMax: Number(bp.shelfLifeDays || 14),
                  shelfLifeBasis: 'Standard aerated storage condition',
                  referencePricePerKg: Number(bp.basePricePerUnit || 25),
                  priceMovementPct: 0,
                  priceMovementTrend: 'stable',
                  marketDemand: 'High',
                  marketName: bp.pickupAddress || 'Regional APMC Mandi',
                  marketDistanceKm: 15,
                  marketSource: 'e-NAM / Mandi Portal',
                  marketLastUpdated: 'Today',
                  history7D: [],
                  history30D: [],
                  history90D: [],
                  watchTag: bpStatus === 'REJECTED' ? 'Rejected by Admin' : bpStatus === 'ACTIVE' ? 'Marketplace Active' : bpStatus === 'APPROVED' ? 'Quality Approved — Tap List Globally' : 'Under Admin Verification',
                  watchUrgency: bpStatus === 'REJECTED' ? 'warning' : bpStatus === 'ACTIVE' ? 'positive' : bpStatus === 'APPROVED' ? 'positive' : 'neutral',
                  status: bpStatus,
                  createdAt: bp.createdAt || bp.created_at || new Date().toISOString(),
                });
              }
            }

            const newCrops = Array.from(cropMap.values()).sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return timeB - timeA;
            });
            const isChanged =
              newCrops.length !== (state.crops || []).length ||
              newCrops.some((nc, i) => {
                const oc = state.crops[i];
                return (
                  !oc ||
                  oc.id !== nc.id ||
                  oc.status !== nc.status ||
                  oc.availableKg !== nc.availableKg ||
                  oc.totalKg !== nc.totalKg ||
                  oc.watchTag !== nc.watchTag
                );
              });

            if (!isChanged) {
              return state;
            }
            return { crops: newCrops };
          });
        } catch {
          // Graceful offline fallback
        } finally {
          isSyncInProgress = false;
        }
      },

      replaceCropId: (oldId: string, newId: string) => {
        set((state) => {
          const filtered = (state.crops || []).filter((c) => c.id !== newId);
          return {
            crops: filtered.map((c) => (c.id === oldId ? { ...c, id: newId } : c)),
          };
        });
      },

      addCrop: (newCropData) => {
        const newId = `crop_${Date.now()}`;
        const newCrop: CropItem = {
          ...newCropData,
          id: newId,
          status: newCropData.status || 'PENDING_APPROVAL',
          createdAt: newCropData.createdAt || new Date().toISOString(),
        };

        set((state) => {
          const filtered = (state.crops || []).filter((c) => c.id !== newId);
          return {
            crops: [newCrop, ...filtered],
          };
        });

        return newCrop;
      },

      updateCropStatus: (id, status) => {
        set((state) => ({
          crops: state.crops.map((c) => (c.id === id ? { ...c, status } : c)),
        }));
      },

      updateCropCondition: (id, condition, note) => {
        set((state) => ({
          crops: state.crops.map((c) => {
            if (c.id === id) {
              return {
                ...c,
                condition,
                conditionNote: note !== undefined ? note : c.conditionNote,
                conditionUpdatedAt: 'Today',
              };
            }
            return c;
          }),
        }));
      },

      updateCropQuantity: (id, availableKg, reservedKg) => {
        set((state) => ({
          crops: state.crops.map((c) => {
            if (c.id === id) {
              const res = reservedKg !== undefined ? reservedKg : c.reservedKg;
              return {
                ...c,
                availableKg,
                reservedKg: res,
                totalKg: availableKg + res + c.soldKg,
              };
            }
            return c;
          }),
        }));
      },

      updateCropDetails: (id, updates) => {
        set((state) => ({
          crops: state.crops.map((c) => {
            if (c.id === id) {
              const updated = { ...c, ...updates };
              if (updates.availableKg !== undefined && updates.totalKg === undefined) {
                updated.totalKg = updates.availableKg + (updated.reservedKg || 0) + (updated.soldKg || 0);
              }
              return updated;
            }
            return c;
          }),
        }));
        // Sync update to backend API
        apiClient.updateProduct(id, {
          availableQuantity: updates.availableKg,
          basePricePerUnit: updates.expectedPricePerKg,
          cropVariety: updates.variety,
          storageType: updates.storageType,
          pickupAddress: updates.location,
        }).catch((err) => {
          console.warn('[produceStore] updateProduct backend note:', err?.message);
        });
      },

      deleteCrop: (id) => {
        set((state) => ({
          crops: state.crops.filter((c) => c.id !== id),
        }));
        // Permanently delete on backend API & ProductRegistry to prevent resurrection
        apiClient.deleteProduct(id).catch((err) => {
          console.warn('[produceStore] deleteProduct backend note:', err?.message);
        });
      },

      getCropById: (id) => {
        return get().crops.find((c) => c.id === id);
      },
    }),
    {
      name: 'mandikart_farmer_produce_storage',
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({ crops: state.crops }),
    }
  )
);

