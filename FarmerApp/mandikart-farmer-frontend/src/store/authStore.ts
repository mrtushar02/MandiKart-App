import { create } from 'zustand';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Farmer } from '@/types';

export interface UserProfile {
  id?: string;
  name?: string;
  fullName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  countryCode?: string;
  email?: string;
  isEmailVerified?: boolean;
  avatarUri?: string;
  district?: string;
  state?: string;
  city?: string;
  village?: string;
  experience?: string;
  farmerType?: string;
  /** 'INDIVIDUAL' for solo farmer, 'FPO' for FPO representative */
  role?: 'INDIVIDUAL' | 'FPO' | string;
  farmSize?: string;
  farmSizeAcres?: string | number;
  farmSizeUnit?: string;
  crops?: string[];
  isOwner?: boolean;
  language?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  /** FPO-specific organization details. Populated only when role === 'FPO' */
  fpoDetails?: {
    fpoId?: string;
    fpoName?: string;
    registrationNumber?: string;
    registrationType?: string;
    yearOfFormation?: number;
    nabardPromoted?: boolean;
    promoterName?: string;

    representativeName?: string;
    designation?: string;
    representativeMobile?: string;
    representativeWhatsApp?: string;
    representativeEmail?: string;
    representativeAvatarUri?: string;
    experienceYears?: number;

    state?: string;
    district?: string;
    block?: string;
    headquartersVillage?: string;
    villagesCovered?: string[];

    memberCount?: number;
    femaleMemberPercent?: number;
    primaryCrops?: string[];
    annualTurnoverBracket?: string;

    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountType?: 'CURRENT' | 'SAVINGS';

    totalInventoryMT?: number;
    pendingMemberRequests?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

interface AuthState {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isHydrated: boolean;
  farmer: Farmer | null;
  user: UserProfile | null;
  token: string | null;
  phoneNumber: string;

  // Actions
  hydrateAuth: () => Promise<void>;
  setPhoneNumber: (phone: string) => void;
  setUser: (user: Partial<UserProfile>) => void;
  setIsAuthenticated: (value: boolean) => void;
  setAuthenticated: (token: string, farmer: Farmer) => void;
  setOnboarded: (value: boolean) => void;
  updateFarmer: (updates: Partial<Farmer>) => void;
  completeOnboarding: (userUpdates?: Partial<UserProfile>, farmerUpdates?: Partial<Farmer>) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEYS = {
  TOKEN: 'mandikart_farmer_token',
  USER: 'mandikart_farmer_user',
  FARMER: 'mandikart_farmer_data',
  IS_ONBOARDED: 'mandikart_farmer_is_onboarded',
};

const isStorageAccessible = () => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }
  return true;
};

const persistAuth = async (token: string, user: UserProfile, farmer: Farmer, isOnboarded?: boolean) => {
  if (!isStorageAccessible()) return;
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    await AsyncStorage.setItem(STORAGE_KEYS.FARMER, JSON.stringify(farmer));
    if (isOnboarded !== undefined) {
      await AsyncStorage.setItem(STORAGE_KEYS.IS_ONBOARDED, isOnboarded ? 'true' : 'false');
    }
  } catch {}
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.FARMER, JSON.stringify(farmer));
      if (isOnboarded !== undefined) {
        localStorage.setItem(STORAGE_KEYS.IS_ONBOARDED, isOnboarded ? 'true' : 'false');
      }
    }
  } catch {}
};

const clearPersistedAuth = async () => {
  if (!isStorageAccessible()) return;
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    await AsyncStorage.removeItem(STORAGE_KEYS.FARMER);
    await AsyncStorage.removeItem(STORAGE_KEYS.IS_ONBOARDED);
  } catch {}
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.FARMER);
      localStorage.removeItem(STORAGE_KEYS.IS_ONBOARDED);
    }
  } catch {}
};

const getStoredAuthSync = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const user = localStorage.getItem(STORAGE_KEYS.USER);
      const farmer = localStorage.getItem(STORAGE_KEYS.FARMER);
      if (token && user) {
        return {
          isAuthenticated: true,
          token,
          user: JSON.parse(user),
          farmer: farmer ? JSON.parse(farmer) : null,
        };
      }
    }
  } catch {}
  return { isAuthenticated: false, token: null, user: null, farmer: null };
};

const initialAuth = getStoredAuthSync();

const DEFAULT_FALLBACK_FARMER: any = {
  id: '',
  fullName: 'Farmer',
  phone: '',
  state: '',
  district: '',
  preferredLanguage: 'en',
  isVerified: false,
  role: 'FARMER',
};

const DEFAULT_FALLBACK_USER: UserProfile = {
  id: '',
  name: 'Farmer',
  fullName: 'Farmer',
  phone: '',
  state: '',
  district: '',
  isVerified: false,
  role: 'FARMER',
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: initialAuth.isAuthenticated,
  isOnboarded: Boolean(initialAuth.farmer?.village && (initialAuth.farmer?.farmSizeAcres || (initialAuth.farmer as any)?.farm_size_acres)),
  isHydrated: false,
  farmer: initialAuth.farmer,
  user: initialAuth.user,
  token: initialAuth.token,
  phoneNumber: initialAuth.user?.phone || '',

  hydrateAuth: async () => {
    if (!isStorageAccessible()) {
      set({ isHydrated: true });
      return;
    }
    try {
      let token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      let userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      let farmerStr = await AsyncStorage.getItem(STORAGE_KEYS.FARMER);
      let onboardedStr = await AsyncStorage.getItem(STORAGE_KEYS.IS_ONBOARDED);

      if (!token && typeof window !== 'undefined' && window.localStorage) {
        token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        userStr = localStorage.getItem(STORAGE_KEYS.USER);
        farmerStr = localStorage.getItem(STORAGE_KEYS.FARMER);
        onboardedStr = localStorage.getItem(STORAGE_KEYS.IS_ONBOARDED);
      }

      if (token && (userStr || farmerStr)) {
        const user = userStr ? JSON.parse(userStr) : null;
        const farmer = farmerStr ? JSON.parse(farmerStr) : null;
        const fAny = (farmer || {}) as any;
        const uAny = (user || {}) as any;

        const hasExplicitOnboarded =
          onboardedStr === 'true' ||
          uAny.isOnboarded === true ||
          uAny.isProfileCompleted === true ||
          fAny.isProfileCompleted === true;

        const isFPOComplete =
          uAny.role === 'FPO' && Boolean(uAny.fpoDetails?.fpoName || uAny.village);

        const isFarmerComplete = Boolean(
          (fAny.village || uAny.village) &&
          (fAny.farm_size_acres || fAny.farmSizeAcres || uAny.farmSizeAcres)
        );

        const hasCompletedOnboarding = hasExplicitOnboarded || isFPOComplete || isFarmerComplete;

        set({
          isAuthenticated: true,
          isOnboarded: hasCompletedOnboarding,
          token,
          user,
          farmer,
          isHydrated: true,
        });
        return;
      }
    } catch (e) {
      console.warn('[authStore] hydrateAuth error:', e);
    }
    set({ isHydrated: true });
  },

  setPhoneNumber: (phoneNumber) => set({ phoneNumber }),

  setUser: (updates) =>
    set((state) => {
      const updatedUser = state.user ? { ...state.user, ...updates } : (updates as UserProfile);
      if (state.token) {
        persistAuth(state.token, updatedUser, state.farmer || ({} as any), state.isOnboarded);
      }
      return { user: updatedUser };
    }),

  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  setAuthenticated: (token, farmer) => {
    const fAny = farmer as any;
    const userProfile: UserProfile = {
      id: farmer.id,
      name: farmer.fullName,
      fullName: farmer.fullName,
      phone: farmer.phone,
      email: fAny.email || '',
      state: fAny.state || '',
      district: fAny.district || '',
      village: fAny.village || '',
      farmSizeAcres: fAny.farm_size_acres || fAny.farmSizeAcres || 0,
      crops: fAny.primary_crops || fAny.crops || [],
      avatarUri: fAny.avatar_url || fAny.avatarUrl || '',
      isVerified: farmer.isVerified,
      role: 'FARMER',
    };
    const hasCompletedOnboarding = Boolean(
      (fAny.village || userProfile.village) &&
      (fAny.farm_size_acres || fAny.farmSizeAcres || userProfile.farmSizeAcres)
    );
    persistAuth(token, userProfile, farmer, hasCompletedOnboarding);
    set({
      isAuthenticated: true,
      isOnboarded: hasCompletedOnboarding,
      token,
      farmer,
      user: userProfile,
      isHydrated: true,
    });
  },

  setOnboarded: (isOnboarded) => {
    set({ isOnboarded });
    AsyncStorage.setItem(STORAGE_KEYS.IS_ONBOARDED, isOnboarded ? 'true' : 'false').catch(() => {});
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEYS.IS_ONBOARDED, isOnboarded ? 'true' : 'false');
    }
  },

  updateFarmer: (updates) =>
    set((state) => {
      const updatedFarmer = state.farmer ? { ...state.farmer, ...updates } : null;
      if (updatedFarmer && state.token && state.user) {
        persistAuth(state.token, state.user, updatedFarmer, state.isOnboarded);
      }
      return { farmer: updatedFarmer };
    }),

  completeOnboarding: async (userUpdates, farmerUpdates) => {
    const state = useAuthStore.getState();
    const currentUser = state.user || ({} as UserProfile);
    const currentFarmer = state.farmer || ({} as Farmer);

    const mergedUser: UserProfile = {
      ...currentUser,
      ...userUpdates,
      isOnboarded: true,
      isProfileCompleted: true,
    };

    const village = (farmerUpdates as any)?.village || userUpdates?.village || currentFarmer.village || currentUser.village || '';
    const farmAcres = (farmerUpdates as any)?.farmSizeAcres || (userUpdates?.farmSizeAcres ? Number(userUpdates.farmSizeAcres) : undefined) || currentFarmer.farmSizeAcres || (currentUser.farmSizeAcres ? Number(currentUser.farmSizeAcres) : 5);

    const mergedFarmer: Farmer = {
      ...currentFarmer,
      ...farmerUpdates,
      village,
      farmSizeAcres: farmAcres,
      isVerified: true,
      isProfileCompleted: true,
    } as any;

    set({
      user: mergedUser,
      farmer: mergedFarmer,
      isOnboarded: true,
      isAuthenticated: true,
    });

    const token = state.token || 'mock_farmer_token_active';
    await persistAuth(token, mergedUser, mergedFarmer, true);
  },

  logout: () => {
    clearPersistedAuth();
    set({
      isAuthenticated: false,
      isOnboarded: false,
      farmer: null,
      user: null,
      token: null,
      phoneNumber: '',
      isHydrated: true,
    });
  },
}));

// Auto-hydrate immediately upon module load
useAuthStore.getState().hydrateAuth();

