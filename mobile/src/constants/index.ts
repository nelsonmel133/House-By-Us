import { Platform, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Brand Palette ────────────────────────────────────────────────────────────
// Signature: warm terracotta-tinged sand meets deep charcoal — evoking
// sunbaked Harare brick and the red soil of Zimbabwe's highveld.

export const COLORS = {
  // Core brand
  brand: '#C25B3F',          // Harare brick-terracotta — primary CTA
  brandLight: '#E8795F',     // Hover/lighter variant
  brandDark: '#9C3D27',      // Pressed state
  brandSurface: '#FDF1EE',   // Lightest tint, notification backgrounds

  // Accent
  accent: '#2B7A4B',         // Savannah green — verified badges, success
  accentLight: '#4CAF72',
  accentSurface: '#EBF7F0',

  // Premium gold
  gold: '#D4A017',
  goldLight: '#F0C940',
  goldSurface: '#FEF9E7',

  // Neutrals — warm undertone to match Harare context
  ink: '#1A1512',            // Near-black, primary text
  inkMedium: '#3D3530',      // Secondary text
  inkLight: '#6B5E57',       // Tertiary/placeholder
  inkFaint: '#9C918C',       // Disabled states

  // Surfaces
  canvas: '#FAFAF8',         // Page background
  surface: '#FFFFFF',        // Cards, sheets
  surfaceWarm: '#F5F3F0',    // Input backgrounds
  border: '#E8E3DF',         // Dividers
  borderStrong: '#C8BDB7',   // Focused borders

  // Semantic
  success: '#2B7A4B',
  successSurface: '#EBF7F0',
  warning: '#C68B00',
  warningSurface: '#FEF3CC',
  error: '#C0392B',
  errorSurface: '#FDECEA',
  info: '#1A6B9A',
  infoSurface: '#E3F2FD',

  // Map
  mapMarker: '#C25B3F',
  mapMarkerSelected: '#9C3D27',
  mapCluster: '#2B7A4B',

  // Social
  whatsapp: '#25D366',
  whatsappDark: '#1DA851',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const FONT = {
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 34,
    '5xl': 42,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
  lineHeights: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.65,
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const SPACING = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

// ─── Border Radii ─────────────────────────────────────────────────────────────

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const SHADOW = {
  sm: Platform.select({
    ios: {
      shadowColor: '#1A1512',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#1A1512',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 10,
    },
    android: { elevation: 5 },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#1A1512',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
    },
    android: { elevation: 10 },
  }),
  xl: Platform.select({
    ios: {
      shadowColor: '#1A1512',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.16,
      shadowRadius: 32,
    },
    android: { elevation: 20 },
  }),
} as const;

// ─── Layout ───────────────────────────────────────────────────────────────────

export const LAYOUT = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  contentPadding: 16,
  cardGap: 12,
  mapBottomSheetSnapPoints: ['25%', '55%', '90%'],
  headerHeight: Platform.select({ ios: 44, android: 56, default: 56 }),
  tabBarHeight: Platform.select({ ios: 83, android: 60, default: 60 }),
  bottomActionBarHeight: 80,
} as const;

// ─── Map Configuration ────────────────────────────────────────────────────────

export const HARARE_REGION = {
  latitude: -17.8252,
  longitude: 31.0335,
  latitudeDelta: 0.15,
  longitudeDelta: 0.12,
};

export const HARARE_SUBURBS = [
  { id: 'avondale', label: 'Avondale', coords: { latitude: -17.7997, longitude: 31.0183 } },
  { id: 'borrowdale', label: 'Borrowdale', coords: { latitude: -17.7566, longitude: 31.0850 } },
  { id: 'mabelreign', label: 'Mabelreign', coords: { latitude: -17.8034, longitude: 30.9956 } },
  { id: 'mount_pleasant', label: 'Mt Pleasant', coords: { latitude: -17.7789, longitude: 31.0411 } },
  { id: 'glen_view', label: 'Glen View', coords: { latitude: -17.8934, longitude: 30.9867 } },
  { id: 'highfield', label: 'Highfield', coords: { latitude: -17.8670, longitude: 31.0067 } },
  { id: 'hatfield', label: 'Hatfield', coords: { latitude: -17.8456, longitude: 31.0623 } },
  { id: 'msasa', label: 'Msasa', coords: { latitude: -17.8189, longitude: 31.1089 } },
  { id: 'greendale', label: 'Greendale', coords: { latitude: -17.8012, longitude: 31.1189 } },
  { id: 'eastlea', label: 'Eastlea', coords: { latitude: -17.8289, longitude: 31.0723 } },
];

// ─── Utility Definitions ──────────────────────────────────────────────────────

export const UTILITY_OPTIONS = [
  { id: 'solar', label: 'Solar backup', icon: 'sun' },
  { id: 'borehole', label: 'Borehole water', icon: 'droplets' },
  { id: 'generator', label: 'Generator', icon: 'zap' },
  { id: 'wifi', label: 'Wi-Fi included', icon: 'wifi' },
  { id: 'dstv', label: 'DSTV', icon: 'tv' },
  { id: 'parking', label: 'Parking', icon: 'car' },
  { id: 'security', label: '24hr security', icon: 'shield' },
  { id: 'garden', label: 'Shared garden', icon: 'trees' },
] as const;

export const ROOM_TYPE_LABELS: Record<string, string> = {
  single: 'Single room',
  shared: 'Shared room',
  bedsitter: 'Bedsitter',
  studio: 'Studio',
  '1bed': '1-bedroom flat',
  '2bed': '2-bedroom flat',
  '3bed+': '3+ bedroom house',
};

// ─── Premium Plans ────────────────────────────────────────────────────────────

export const PREMIUM_PLANS = [
  {
    id: 'boost_7',
    name: 'Quick Boost',
    description: 'Appear at the top of search for 7 days',
    priceUSD: 3,
    priceZWG: 40,
    durationDays: 7,
    features: ['Priority placement', 'Featured badge', 'Analytics dashboard'],
    popular: false,
  },
  {
    id: 'featured_30',
    name: 'Featured Listing',
    description: 'Premium placement + map highlight for 30 days',
    priceUSD: 9,
    priceZWG: 122,
    durationDays: 30,
    features: [
      'Top map marker',
      'Featured badge',
      'Premium analytics',
      'Priority support',
      'Verified label',
    ],
    popular: true,
  },
  {
    id: 'agency_90',
    name: 'Agency Pack',
    description: 'Up to 10 listings featured for 90 days',
    priceUSD: 25,
    priceZWG: 339,
    durationDays: 90,
    features: [
      'Up to 10 listings',
      'All Featured benefits',
      'Agency profile page',
      'Lead capture forms',
      'WhatsApp broadcast list',
    ],
    popular: false,
  },
];
