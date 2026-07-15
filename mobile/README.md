# House-By-Us — Mobile App

Student-first rental discovery platform for Harare, Zimbabwe. Built with React Native (Expo), TypeScript, React Query, and native maps.

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| Framework | React Native + Expo | ~52 |
| Language | TypeScript | ^5.3 |
| Navigation | React Navigation | ^6 |
| State / Server | React Query + Zustand | ^5 + ^5 |
| Maps | react-native-maps | 1.18 |
| Image loading | expo-image | ~2.0 |
| Photo picker | expo-image-picker | ~15 |
| Bottom sheet | @gorhom/bottom-sheet | ^4.6 |
| API client | tRPC client | ^11 |

---

## Project Structure

```
house-by-us/
├── App.tsx                          Root entry, providers, navigation shell
├── app.json                         Expo config (Maps API keys, permissions)
├── babel.config.js                  Babel + Reanimated plugin
├── tsconfig.json                    Strict TypeScript config with path aliases
├── package.json
└── src/
    ├── types/
    │   └── index.ts                 All TypeScript domain types
    ├── constants/
    │   └── index.ts                 Design tokens, Harare map config, plan data
    ├── store/
    │   └── index.ts                 Zustand stores (filters, map, onboarding, uploads)
    ├── hooks/
    │   └── index.ts                 useDebounce, useContactActions, usePulseAnimation…
    ├── lib/
    │   └── api.ts                   React Query hooks + mock data layer
    ├── components/
    │   ├── common/
    │   │   ├── index.tsx            Button, Badge, Chip, PriceTag, StarRating, Skeleton…
    │   │   └── ListingCard.tsx      Full / Horizontal / Compact card variants
    │   └── explore/
    │       └── FilterSheet.tsx      Price slider, utility checkboxes, toggle filters
    └── app/
        ├── ExploreScreen.tsx        Map-first view + bottom sheet listings
        ├── ListingDetailScreen.tsx  Parallax gallery + sticky bottom action bar
        └── OnboardingScreen.tsx     Role picker, photo upload, premium payment
```

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-org/house-by-us-mobile.git
cd house-by-us-mobile
npm install

# 2. Add Google Maps API keys to app.json
#    Replace YOUR_IOS_GOOGLE_MAPS_API_KEY and YOUR_ANDROID_GOOGLE_MAPS_API_KEY

# 3. Run on device / simulator
npx expo start

# iOS simulator
npx expo start --ios

# Android emulator
npx expo start --android
```

---

## Google Maps Setup

### Android
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Maps SDK for Android**
3. Create an API key and restrict it to your Android app package `zw.co.housebyus.app`
4. Paste it into `app.json` → `android.config.googleMaps.apiKey`

### iOS
1. Enable **Maps SDK for iOS** in the same project
2. Create a separate iOS-restricted API key
3. Paste it into `app.json` → `ios.config.googleMapsApiKey`

---

## Key Architecture Decisions

### 1. Map performance
- `tracksViewChanges={false}` on non-selected `<Marker>` components — prevents React re-renders on every map frame
- `scrollEventThrottle={16}` on the parallax scroll for 60fps parallax
- Region changes debounced 600ms before triggering new listing queries
- `moveOnMarkerPress={false}` prevents jarring auto-pan on iOS

### 2. Image caching (expo-image)
Every `<Image>` in the app uses:
- `cachePolicy="disk"` for listing gallery images — survives app restart
- `cachePolicy="memory-disk"` for avatars — fast in-session access
- `cachePolicy="memory"` for upload previews — ephemeral, no disk waste
- `recyclingKey` prop on list images — recycles native image views in FlashList / FlatList without layout flicker
- `placeholder={BLURHASH}` — shows a warm placeholder while loading, never a blank box

### 3. List rendering
- All card components wrapped in `React.memo()` with custom equality functions
- `keyExtractor` and `renderItem` stabilised with `useCallback` to prevent FlatList re-renders
- Listing cards use `useCallback` for press handlers to avoid child re-renders
- `BottomSheetFlatList` from `@gorhom/bottom-sheet` for the explore sheet — uses the sheet's internal scroll engine for native-feel momentum

### 4. State management split
- **React Query**: all server state (listings, conversations, landlord profiles)
- **Zustand**: pure UI state (active filters, map region, selected listing, bottom sheet index, upload queue)
- No prop drilling — screens read from stores and query hooks directly

### 5. Optimistic updates
`useToggleSave` performs an optimistic cache update before the network round-trip:
```ts
onMutate: async ({ listingId, saved }) => {
  await queryClient.cancelQueries(...)
  const prev = queryClient.getQueryData(...)
  queryClient.setQueryData(listingId, { ...prev, isSaved: saved })
  return { prev } // rollback context
}
```

### 6. Safe area handling
`useSafeLayout()` hook unifies `useSafeAreaInsets()` with platform-specific corrections:
- Android adds 8px to `headerPadding` for the status bar gap
- iOS bottom padding falls back to 16 when `insets.bottom === 0` (non-notch devices)

---

## Payment Gateway Integration

The Premium Upgrades screen opens a `WebView` overlay pointing to the selected gateway:

| Method | URL | Notes |
|---|---|---|
| EcoCash | `https://ecocash.co.zw/pay` | USSD fallback via `tel:*151*2#` |
| Paynow | `https://www.paynow.co.zw` | Redirect + webhook confirmation |
| InnBucks | `https://innbucks.co.zw` | QR or USSD code delivery |
| Stripe | `https://checkout.stripe.com` | Card, Apple Pay, Google Pay |

The WebView's `onNavigationStateChange` handler detects `success` or `complete` in the final redirect URL to dismiss the overlay and confirm the plan activation.

### Connecting real gateways
Replace the static `PAYMENT_URLS` object in `OnboardingScreen.tsx` with tRPC mutations that:
1. Create a server-side checkout session
2. Return the gateway-specific payment URL with pre-filled amount, reference, and return URL
3. Poll or receive webhooks to confirm payment and activate the listing tier

---

## S3 Multipart Upload Flow

The `PhotoUploadStep` component simulates chunked uploads. To connect real S3:

```ts
// 1. Request presigned multipart upload from your API
const { uploadId, key } = await trpc.media.initiateMultipart.mutate({
  filename: asset.uri.split('/').pop()!,
  mimeType: asset.mimeType!,
});

// 2. Split file into 5MB chunks and upload each part
const CHUNK_SIZE = 5 * 1024 * 1024;
const parts = [];
for (let i = 0; i < totalChunks; i++) {
  const { presignedUrl } = await trpc.media.getPartUrl.mutate({
    uploadId,
    key,
    partNumber: i + 1,
  });
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: chunk,
    headers: { 'Content-Type': asset.mimeType! },
  });
  parts.push({ PartNumber: i + 1, ETag: response.headers.get('ETag')! });
  updateAssetProgress(asset.uri, ((i + 1) / totalChunks) * 100);
}

// 3. Complete the multipart upload
await trpc.media.completeMultipart.mutate({ uploadId, key, parts });
```

---

## Connecting tRPC

Replace the mock `useListingsInRegion`, `useListingDetail`, etc. in `src/lib/api.ts` with real tRPC procedures:

```ts
// src/lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@house-by-us/api'; // shared router types

export const trpc = createTRPCReact<AppRouter>();

// In App.tsx, wrap with:
// <trpc.Provider client={trpcClient} queryClient={queryClient}>
```

All React Query hooks in `api.ts` map directly to tRPC procedures — swap `queryFn` bodies for `trpc.listings.getInRegion.query(...)` calls.

---

## Environment Variables

Create a `.env` file at project root (use `expo-constants` to access):

```env
EXPO_PUBLIC_API_BASE_URL=https://api.housebyus.co.zw
EXPO_PUBLIC_S3_BUCKET=house-by-us-media
EXPO_PUBLIC_GOOGLE_MAPS_KEY_ANDROID=YOUR_KEY
EXPO_PUBLIC_GOOGLE_MAPS_KEY_IOS=YOUR_KEY
```

---

## Build & Deploy (EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure (first time)
eas build:configure

# Build for internal testing
eas build --profile preview --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## Design System

### Color palette
| Token | Hex | Usage |
|---|---|---|
| `brand` | `#C25B3F` | CTAs, active states, selected filters |
| `brandSurface` | `#FDF1EE` | Card backgrounds when selected |
| `accent` | `#2B7A4B` | Verified badges, success states, checkmarks |
| `gold` | `#D4A017` | Premium tier badges and borders |
| `ink` | `#1A1512` | Primary text |
| `inkLight` | `#6B5E57` | Secondary text, descriptions |
| `canvas` | `#FAFAF8` | Screen backgrounds |
| `surface` | `#FFFFFF` | Cards, sheets, modals |
| `whatsapp` | `#25D366` | WhatsApp action button |

All colours have a warm undertone — referencing Harare's red soil and sun-baked brick aesthetic.

### Typography
Inter / System font stack. Sizes from 10px (`xs`) to 42px (`5xl`). Weights: 400 / 500 / 600 / 700 / 800.

---

## Localization Notes

- All prices display in USD by default (the dominant rental currency in Harare)
- ZWG (Zimbabwe Gold) equivalents shown on premium plan cards
- WhatsApp deep-links include country code `+263` prefix
- Phone number format: `+263 77 123 4567` (Econet/Netone/Telecel)
- EcoCash USSD code `*151*2#` can be used as a fallback for users without data

---

## License

Proprietary. All rights reserved — House-By-Us Zimbabwe (Pvt) Ltd.
