/**
 * Domain types for House-By-Us.
 *
 * In production these are NOT hand-written — they are inferred directly from
 * the backend router via `inferRouterOutputs<AppRouter>` (see `lib/trpc.ts`).
 * They're declared here so the standalone preview/demo data has a single
 * source of truth that matches the shape the real router would produce.
 */

export type HarareArea =
  | "Mount Pleasant"
  | "Belgravia"
  | "Avondale"
  | "Hillside"
  | "Msasa"
  | "Eastlea"
  | "Marlborough"
  | "Chinhoyi (CUT proximity)"
  | "Mabelreign"
  | "Greendale";

export type Utility =
  | "borehole"
  | "solar"
  | "wifi"
  | "prepaid_electricity"
  | "security_guard"
  | "fenced_yard"
  | "furnished"
  | "study_table";

export const UTILITY_LABELS: Record<Utility, string> = {
  borehole: "Borehole water",
  solar: "Solar power",
  wifi: "Wi-Fi included",
  prepaid_electricity: "Prepaid ZESA",
  security_guard: "Security guard",
  fenced_yard: "Fenced yard",
  furnished: "Furnished",
  study_table: "Study table",
};

export type VerificationStatus = "pending" | "verified" | "rejected";

export type RoomType = "single" | "shared_double" | "shared_triple" | "self_contained" | "cottage";

export interface LandlordSummary {
  id: string;
  name: string;
  avatarUrl?: string;
  isVerified: boolean;
  responseRateApprox: number; // 0-100
  memberSince: string; // ISO date
  phoneVisible: boolean;
}

export interface ListingMedia {
  id: string;
  url: string;
  type: "photo" | "video";
  caption?: string;
}

export interface ListingCoordinates {
  lat: number;
  lng: number;
}

export interface Listing {
  id: string;
  title: string;
  area: HarareArea;
  coordinates: ListingCoordinates;
  address: string;
  pricePerMonthUsd: number;
  roomType: RoomType;
  occupancyLimit: number;
  utilities: Utility[];
  media: ListingMedia[];
  verification: VerificationStatus;
  rating?: number;
  reviewCount: number;
  distanceToCampusKm?: number;
  houseRules: string[];
  description: string;
  landlord: LandlordSummary;
  createdAt: string;
}

export interface SearchFilters {
  query: string;
  areas: HarareArea[];
  priceMin: number;
  priceMax: number;
  utilities: Utility[];
  roomTypes: RoomType[];
  verifiedOnly: boolean;
}

export interface LandlordDashboardMetrics {
  totalViews: number;
  viewsDeltaPct: number;
  totalLeads: number;
  leadsDeltaPct: number;
  earningsUsd: number;
  earningsDeltaPct: number;
  activeListings: number;
}

export interface LeadRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  studentName: string;
  studentAvatarUrl?: string;
  message: string;
  requestedAt: string;
  status: "new" | "responded" | "closed";
  channel: "callback" | "message";
}

export interface MonetizationBoost {
  id: string;
  name: string;
  description: string;
  priceUsd: number;
  durationDays: number;
  icon: "rocket" | "shield" | "star";
}

export interface AdminQueueItem {
  id: string;
  listing: Listing;
  submittedAt: string;
  flagCount: number;
  documentsAttached: boolean;
}
