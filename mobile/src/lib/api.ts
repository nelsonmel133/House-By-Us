import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Listing,
  ListingFilters,
  MapRegion,
  PaginatedResponse,
  Conversation,
  Message,
} from '../types';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockLandlord = {
  id: 'l1',
  name: 'Tendai Moyo',
  phone: '+263771234567',
  whatsapp: '+263771234567',
  avatar: 'https://i.pravatar.cc/150?img=12',
  verified: true,
  responseTime: 'Usually within 1 hour',
  memberSince: '2023-01',
  totalListings: 4,
  rating: 4.8,
  reviewCount: 23,
};

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'listing_001',
    title: 'Cosy bedsitter near UZ campus',
    description:
      'Quiet, self-contained bedsitter walking distance to UZ gate 3. Pre-paid electricity, own bathroom, small kitchenette. Borehole water ensures supply even during ZINWA outages.',
    roomType: 'bedsitter',
    status: 'active',
    tier: 'premium',
    price: { amount: 80, currency: 'USD', period: 'month', negotiable: true },
    coordinates: { latitude: -17.7872, longitude: 31.0456 },
    address: '14 Fletcher Road, Avondale',
    suburb: 'Avondale',
    city: 'Harare',
    images: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    ],
    landlord: mockLandlord,
    utilities: [
      { id: 'borehole', label: 'Borehole water', icon: 'droplets', available: true },
      { id: 'solar', label: 'Solar backup', icon: 'sun', available: true },
      { id: 'wifi', label: 'Wi-Fi included', icon: 'wifi', available: false },
      { id: 'parking', label: 'Parking', icon: 'car', available: true },
    ],
    amenities: ['Private bathroom', 'Kitchenette', 'Pre-paid electricity', 'Iron gate'],
    rules: ['No loud music after 10pm', 'No pets', 'Students preferred'],
    availableFrom: '2025-02-01',
    createdAt: '2025-01-10T08:00:00Z',
    viewCount: 342,
    savedCount: 28,
    isSaved: false,
    distanceFromCbd: 4.2,
  },
  {
    id: 'listing_002',
    title: 'Shared room — 2 students max, Hatfield',
    description:
      'Modern shared room in a 3-bed house. Kitchen, lounge, and garden shared with 4 other quiet students. 5 mins from Harare Poly and Sam Levy.',
    roomType: 'shared',
    status: 'active',
    tier: 'featured',
    price: { amount: 45, currency: 'USD', period: 'month', negotiable: false },
    coordinates: { latitude: -17.8456, longitude: 31.0623 },
    address: '7 Meredith Drive, Hatfield',
    suburb: 'Hatfield',
    city: 'Harare',
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    ],
    landlord: { ...mockLandlord, id: 'l2', name: 'Rudo Chikwanda', rating: 4.5, reviewCount: 11 },
    utilities: [
      { id: 'borehole', label: 'Borehole water', icon: 'droplets', available: true },
      { id: 'solar', label: 'Solar backup', icon: 'sun', available: false },
      { id: 'wifi', label: 'Wi-Fi included', icon: 'wifi', available: true },
      { id: 'security', label: '24hr security', icon: 'shield', available: true },
    ],
    amenities: ['Shared kitchen', 'Lounge', 'Garden', 'Study nook'],
    rules: ['Students only', 'No overnight guests', 'Keep common areas clean'],
    availableFrom: '2025-01-15',
    createdAt: '2025-01-08T10:00:00Z',
    viewCount: 218,
    savedCount: 14,
    isSaved: true,
    distanceFromCbd: 7.1,
  },
  {
    id: 'listing_003',
    title: 'Self-contained single — Borrowdale',
    description:
      'Spacious self-contained room in a secure complex. Prepaid electricity. Landlord on-site. Ideal for a professional or postgrad student.',
    roomType: 'single',
    status: 'active',
    tier: 'standard',
    price: { amount: 120, currency: 'USD', period: 'month', negotiable: true },
    coordinates: { latitude: -17.7566, longitude: 31.0850 },
    address: 'Plot 22, Borrowdale Road',
    suburb: 'Borrowdale',
    city: 'Harare',
    images: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
    ],
    landlord: { ...mockLandlord, id: 'l3', name: 'Farai Dube', rating: 4.9, reviewCount: 37 },
    utilities: [
      { id: 'borehole', label: 'Borehole water', icon: 'droplets', available: true },
      { id: 'solar', label: 'Solar backup', icon: 'sun', available: true },
      { id: 'generator', label: 'Generator', icon: 'zap', available: true },
      { id: 'parking', label: 'Parking', icon: 'car', available: true },
      { id: 'security', label: '24hr security', icon: 'shield', available: true },
    ],
    amenities: ['En-suite bathroom', 'DSTV connection', 'Garden view', 'Built-in wardrobe'],
    rules: ['No smoking', 'No parties'],
    availableFrom: '2025-02-01',
    createdAt: '2025-01-05T14:00:00Z',
    viewCount: 487,
    savedCount: 52,
    isSaved: false,
    distanceFromCbd: 12.4,
  },
  {
    id: 'listing_004',
    title: '2-bed flat — Glen View 7',
    description:
      'Spacious 2-bedroom flat with lounge and dining area. Ideal for two students sharing costs. Tuck shop and kombis at the gate.',
    roomType: '2bed',
    status: 'active',
    tier: 'standard',
    price: { amount: 160, currency: 'USD', period: 'month', negotiable: true },
    coordinates: { latitude: -17.8934, longitude: 30.9867 },
    address: '45 Seke Road, Glen View 7',
    suburb: 'Glen View',
    city: 'Harare',
    images: [
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800',
      'https://images.unsplash.com/photo-1617098900591-3f90928e8c54?w=800',
    ],
    landlord: { ...mockLandlord, id: 'l4', name: 'Blessing Ncube', rating: 4.3, reviewCount: 8 },
    utilities: [
      { id: 'borehole', label: 'Borehole water', icon: 'droplets', available: false },
      { id: 'solar', label: 'Solar backup', icon: 'sun', available: false },
      { id: 'wifi', label: 'Wi-Fi included', icon: 'wifi', available: false },
    ],
    amenities: ['2 bedrooms', 'Lounge', 'Kitchen', 'Balcony'],
    rules: ['Keep noise down', 'Rent due 1st of month'],
    availableFrom: '2025-01-20',
    createdAt: '2025-01-12T09:00:00Z',
    viewCount: 156,
    savedCount: 9,
    isSaved: false,
    distanceFromCbd: 8.9,
  },
  {
    id: 'listing_005',
    title: 'Studio flat, Mt Pleasant — solar & borehole',
    description:
      'Modern studio in a quiet residential area. Uninterrupted power and water. Close to Westgate and American Embassy area.',
    roomType: 'studio',
    status: 'active',
    tier: 'featured',
    price: { amount: 200, currency: 'USD', period: 'month', negotiable: false },
    coordinates: { latitude: -17.7789, longitude: 31.0411 },
    address: '3 Barwick Drive, Mt Pleasant',
    suburb: 'Mt Pleasant',
    city: 'Harare',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    ],
    landlord: { ...mockLandlord, id: 'l5', name: 'Nyasha Mhuru', rating: 5.0, reviewCount: 19 },
    utilities: [
      { id: 'borehole', label: 'Borehole water', icon: 'droplets', available: true },
      { id: 'solar', label: 'Solar backup', icon: 'sun', available: true },
      { id: 'wifi', label: 'Wi-Fi included', icon: 'wifi', available: true },
      { id: 'parking', label: 'Parking', icon: 'car', available: true },
      { id: 'dstv', label: 'DSTV', icon: 'tv', available: true },
    ],
    amenities: ['Open-plan kitchen', 'Air conditioning', 'Built-in wardrobe', 'En-suite'],
    rules: ['No smoking indoors', 'No subletting'],
    availableFrom: '2025-02-15',
    createdAt: '2025-01-14T11:00:00Z',
    viewCount: 601,
    savedCount: 67,
    isSaved: true,
    distanceFromCbd: 9.3,
  },
];

// ─── Query Key Factory ────────────────────────────────────────────────────────

export const queryKeys = {
  listings: {
    all: ['listings'] as const,
    filtered: (filters: Partial<ListingFilters>) => ['listings', 'filtered', filters] as const,
    map: (region: MapRegion) => ['listings', 'map', region] as const,
    detail: (id: string) => ['listings', 'detail', id] as const,
    infinite: (filters: Partial<ListingFilters>) => ['listings', 'infinite', filters] as const,
  },
  conversations: {
    all: ['conversations'] as const,
    detail: (id: string) => ['conversations', id] as const,
  },
  user: {
    profile: ['user', 'profile'] as const,
    saved: ['user', 'saved'] as const,
  },
};

// ─── Simulated API delay ──────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function filterListings(listings: Listing[], filters: Partial<ListingFilters>): Listing[] {
  return listings.filter((l) => {
    if (filters.priceMin !== undefined && l.price.amount < filters.priceMin) return false;
    if (filters.priceMax !== undefined && l.price.amount > filters.priceMax) return false;
    if (filters.roomTypes && filters.roomTypes.length > 0) {
      if (!filters.roomTypes.includes(l.roomType)) return false;
    }
    if (filters.utilities && filters.utilities.length > 0) {
      const hasAll = filters.utilities.every((uid) =>
        l.utilities.some((u) => u.id === uid && u.available)
      );
      if (!hasAll) return false;
    }
    if (filters.verifiedOnly && !l.landlord.verified) return false;
    return true;
  });
}

// ─── Listing Hooks ────────────────────────────────────────────────────────────

export function useListingsInRegion(region: MapRegion | null, filters: Partial<ListingFilters>) {
  return useQuery({
    queryKey: region ? queryKeys.listings.map(region) : queryKeys.listings.all,
    queryFn: async () => {
      await delay(300);
      if (!region) return filterListings(MOCK_LISTINGS, filters);
      // Filter by approximate map bounds
      const latDelta = region.latitudeDelta / 2;
      const lngDelta = region.longitudeDelta / 2;
      const visible = MOCK_LISTINGS.filter(
        (l) =>
          l.coordinates.latitude >= region.latitude - latDelta &&
          l.coordinates.latitude <= region.latitude + latDelta &&
          l.coordinates.longitude >= region.longitude - lngDelta &&
          l.coordinates.longitude <= region.longitude + lngDelta
      );
      return filterListings(visible, filters);
    },
    enabled: true,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useInfiniteListings(filters: Partial<ListingFilters>) {
  return useInfiniteQuery({
    queryKey: queryKeys.listings.infinite(filters),
    queryFn: async ({ pageParam = 1 }) => {
      await delay(400);
      const filtered = filterListings(MOCK_LISTINGS, filters);
      const pageSize = 10;
      const start = (pageParam - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);
      return {
        items,
        total: filtered.length,
        page: pageParam,
        pageSize,
        hasNextPage: start + pageSize < filtered.length,
      } as PaginatedResponse<Listing>;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    staleTime: 30_000,
  });
}

export function useListingDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.listings.detail(id),
    queryFn: async () => {
      await delay(200);
      const listing = MOCK_LISTINGS.find((l) => l.id === id);
      if (!listing) throw new Error('Listing not found');
      return listing;
    },
    staleTime: 60_000,
  });
}

export function useToggleSave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ listingId, saved }: { listingId: string; saved: boolean }) => {
      await delay(200);
      return { listingId, saved };
    },
    onMutate: async ({ listingId, saved }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.listings.detail(listingId) });
      const prev = queryClient.getQueryData<Listing>(queryKeys.listings.detail(listingId));
      if (prev) {
        queryClient.setQueryData(queryKeys.listings.detail(listingId), {
          ...prev,
          isSaved: saved,
          savedCount: saved ? prev.savedCount + 1 : prev.savedCount - 1,
        });
      }
      return { prev };
    },
    onError: (_err, { listingId }, context) => {
      if (context?.prev) {
        queryClient.setQueryData(queryKeys.listings.detail(listingId), context.prev);
      }
    },
  });
}

// ─── Message Hooks ────────────────────────────────────────────────────────────

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations.all,
    queryFn: async (): Promise<Conversation[]> => {
      await delay(300);
      return [
        {
          id: 'conv_001',
          listing: {
            id: 'listing_001',
            title: 'Cosy bedsitter near UZ campus',
            images: MOCK_LISTINGS[0].images,
            price: MOCK_LISTINGS[0].price,
          },
          otherParty: {
            id: 'l1',
            name: 'Tendai Moyo',
            avatar: 'https://i.pravatar.cc/150?img=12',
          },
          lastMessage: {
            id: 'm1',
            senderId: 'me',
            receiverId: 'l1',
            listingId: 'listing_001',
            content: 'Is the room still available for February?',
            createdAt: new Date(Date.now() - 3600_000).toISOString(),
            read: true,
          },
          unreadCount: 0,
        },
      ];
    },
    staleTime: 10_000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { conversationId: string; content: string }): Promise<Message> => {
      await delay(150);
      return {
        id: `m_${Date.now()}`,
        senderId: 'me',
        receiverId: 'other',
        listingId: 'listing_001',
        content: payload.content,
        createdAt: new Date().toISOString(),
        read: false,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
  });
}
