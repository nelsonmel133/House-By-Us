import { create } from 'zustand';
import type { ListingFilters, MapRegion, OnboardingState, OnboardingRole } from '../types';
import { DEFAULT_FILTERS, HARARE_REGION } from '../constants';

// ─── Filter Store ─────────────────────────────────────────────────────────────

interface FilterStore {
  filters: ListingFilters;
  isFilterSheetOpen: boolean;
  pendingFilters: ListingFilters;
  setFilter: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => void;
  setPendingFilter: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => void;
  applyPendingFilters: () => void;
  resetFilters: () => void;
  openFilterSheet: () => void;
  closeFilterSheet: () => void;
  activeFilterCount: () => number;
}

export const useFilterStore = create<FilterStore>((set, get) => ({
  filters: DEFAULT_FILTERS,
  pendingFilters: DEFAULT_FILTERS,
  isFilterSheetOpen: false,

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  setPendingFilter: (key, value) =>
    set((s) => ({ pendingFilters: { ...s.pendingFilters, [key]: value } })),

  applyPendingFilters: () =>
    set((s) => ({ filters: s.pendingFilters, isFilterSheetOpen: false })),

  resetFilters: () =>
    set({ filters: DEFAULT_FILTERS, pendingFilters: DEFAULT_FILTERS }),

  openFilterSheet: () =>
    set((s) => ({ isFilterSheetOpen: true, pendingFilters: s.filters })),

  closeFilterSheet: () =>
    set({ isFilterSheetOpen: false }),

  activeFilterCount: () => {
    const { filters } = get();
    let count = 0;
    if (filters.priceMin > 0 || filters.priceMax < 1000) count++;
    if (filters.roomTypes.length > 0) count++;
    if (filters.utilities.length > 0) count++;
    if (filters.verifiedOnly) count++;
    if (filters.availableNow) count++;
    return count;
  },
}));

// ─── Map Store ────────────────────────────────────────────────────────────────

interface MapStore {
  region: MapRegion;
  selectedListingId: string | null;
  isBottomSheetExpanded: boolean;
  bottomSheetIndex: number;
  setRegion: (region: MapRegion) => void;
  selectListing: (id: string | null) => void;
  setBottomSheetIndex: (index: number) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  region: HARARE_REGION,
  selectedListingId: null,
  isBottomSheetExpanded: false,
  bottomSheetIndex: 0,

  setRegion: (region) => set({ region }),
  selectListing: (id) =>
    set({ selectedListingId: id, bottomSheetIndex: id ? 1 : 0 }),
  setBottomSheetIndex: (index) =>
    set({ bottomSheetIndex: index, isBottomSheetExpanded: index > 1 }),
}));

// ─── Onboarding Store ─────────────────────────────────────────────────────────

interface OnboardingStore extends OnboardingState {
  hasCompletedOnboarding: boolean;
  setRole: (role: OnboardingRole) => void;
  completeStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  role: null,
  completedSteps: [],
  currentStep: 0,
  hasCompletedOnboarding: false,

  setRole: (role) => set({ role }),

  completeStep: (step) =>
    set((s) => ({
      completedSteps: s.completedSteps.includes(step)
        ? s.completedSteps
        : [...s.completedSteps, step],
    })),

  nextStep: () =>
    set((s) => {
      const newStep = s.currentStep + 1;
      return {
        currentStep: newStep,
        completedSteps: s.completedSteps.includes(s.currentStep)
          ? s.completedSteps
          : [...s.completedSteps, s.currentStep],
      };
    }),

  prevStep: () =>
    set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),

  completeOnboarding: () =>
    set({ hasCompletedOnboarding: true }),

  resetOnboarding: () =>
    set({
      role: null,
      completedSteps: [],
      currentStep: 0,
      hasCompletedOnboarding: false,
    }),
}));

// ─── Upload Store ─────────────────────────────────────────────────────────────

import type { MediaAsset } from '../types';

interface UploadStore {
  assets: MediaAsset[];
  isUploading: boolean;
  totalProgress: number;
  addAsset: (asset: Omit<MediaAsset, 'uploadProgress' | 'uploadStatus'>) => void;
  removeAsset: (uri: string) => void;
  updateAssetProgress: (uri: string, progress: number, status?: MediaAsset['uploadStatus']) => void;
  clearAssets: () => void;
  reorderAssets: (from: number, to: number) => void;
}

export const useUploadStore = create<UploadStore>((set, get) => ({
  assets: [],
  isUploading: false,
  totalProgress: 0,

  addAsset: (asset) =>
    set((s) => ({
      assets: [
        ...s.assets,
        { ...asset, uploadProgress: 0, uploadStatus: 'idle' },
      ],
    })),

  removeAsset: (uri) =>
    set((s) => ({ assets: s.assets.filter((a) => a.uri !== uri) })),

  updateAssetProgress: (uri, progress, status) =>
    set((s) => {
      const updated = s.assets.map((a) =>
        a.uri === uri
          ? { ...a, uploadProgress: progress, ...(status ? { uploadStatus: status } : {}) }
          : a
      );
      const totalProgress =
        updated.reduce((sum, a) => sum + a.uploadProgress, 0) / Math.max(updated.length, 1);
      const isUploading = updated.some((a) => a.uploadStatus === 'uploading');
      return { assets: updated, totalProgress, isUploading };
    }),

  clearAssets: () =>
    set({ assets: [], isUploading: false, totalProgress: 0 }),

  reorderAssets: (from, to) =>
    set((s) => {
      const assets = [...s.assets];
      const [moved] = assets.splice(from, 1);
      assets.splice(to, 0, moved);
      return { assets };
    }),
}));
