// ─── Core Domain Types ────────────────────────────────────────────────────────

export type Currency = 'USD' | 'ZWG' | 'ZAR';

export type RoomType = 'single' | 'shared' | 'bedsitter' | 'studio' | '1bed' | '2bed' | '3bed+';

export type ListingStatus = 'active' | 'pending' | 'rented' | 'suspended';

export type TierType = 'standard' | 'featured' | 'premium';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Utility {
  id: string;
  label: string;
  icon: string;
  available: boolean;
}

export interface PriceInfo {
  amount: number;
  currency: Currency;
  period: 'month' | 'week' | 'night';
  negotiable: boolean;
}

export interface Landlord {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  avatar: string | null;
  verified: boolean;
  responseTime: string;
  memberSince: string;
  totalListings: number;
  rating: number;
  reviewCount: number;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  roomType: RoomType;
  status: ListingStatus;
  tier: TierType;
  price: PriceInfo;
  coordinates: Coordinates;
  address: string;
  suburb: string;
  city: string;
  images: string[];
  videoUrl?: string;
  landlord: Landlord;
  utilities: Utility[];
  amenities: string[];
  rules: string[];
  availableFrom: string;
  createdAt: string;
  viewCount: number;
  savedCount: number;
  isSaved: boolean;
  distanceFromCbd?: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

export interface ListingFilters {
  priceMin: number;
  priceMax: number;
  roomTypes: RoomType[];
  utilities: string[];
  maxDistanceFromCbd: number;
  availableNow: boolean;
  verifiedOnly: boolean;
  currency: Currency;
}

export const DEFAULT_FILTERS: ListingFilters = {
  priceMin: 0,
  priceMax: 1000,
  roomTypes: [],
  utilities: [],
  maxDistanceFromCbd: 30,
  availableNow: false,
  verifiedOnly: false,
  currency: 'USD',
};

// ─── Upload Types ─────────────────────────────────────────────────────────────

export interface UploadChunk {
  partNumber: number;
  uploadId: string;
  etag?: string;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  progress: number;
}

export interface MediaAsset {
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  fileSize?: number;
  mimeType?: string;
  uploadProgress: number;
  uploadStatus: 'idle' | 'uploading' | 'complete' | 'error';
  s3Key?: string;
}

// ─── Onboarding Types ─────────────────────────────────────────────────────────

export type OnboardingRole = 'student' | 'landlord' | null;

export interface OnboardingState {
  role: OnboardingRole;
  completedSteps: number[];
  currentStep: number;
}

// ─── Payment Types ────────────────────────────────────────────────────────────

export type PaymentMethod = 'ecocash' | 'paynow' | 'stripe' | 'innbucks';

export interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  priceUSD: number;
  priceZWG: number;
  durationDays: number;
  features: string[];
  popular: boolean;
}

// ─── Messaging Types ──────────────────────────────────────────────────────────

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  listingId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  listing: Pick<Listing, 'id' | 'title' | 'images' | 'price'>;
  otherParty: Pick<Landlord, 'id' | 'name' | 'avatar'>;
  lastMessage: Message;
  unreadCount: number;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}
