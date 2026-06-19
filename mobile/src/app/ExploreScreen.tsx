import React, {
  useRef,
  useCallback,
  useMemo,
  useState,
  memo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type Region,
} from 'react-native-maps';
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, SPACING, RADIUS, SHADOW, HARARE_REGION, LAYOUT } from '../../constants';
import { useMapStore, useFilterStore } from '../../store';
import { useListingsInRegion } from '../../lib/api';
import { useDebounce } from '../../hooks';
import { MapPriceTag } from '../common';
import { ListingCard, ListingCardSkeleton } from '../common/ListingCard';
import { FilterSheet, FilterButton } from './FilterSheet';
import type { Listing, MapRegion } from '../../types';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const MAP_STYLE = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#c9e8f5' }],
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry.fill',
    stylers: [{ color: '#f0ebe5' }],
  },
];

// ─── Custom Marker ─────────────────────────────────────────────────────────────

const ListingMarker = memo(function ListingMarker({
  listing,
  selected,
  onPress,
}: {
  listing: Listing;
  selected: boolean;
  onPress: (id: string) => void;
}) {
  return (
    <Marker
      key={listing.id}
      coordinate={listing.coordinates}
      onPress={() => onPress(listing.id)}
      tracksViewChanges={selected} // perf: only re-render selected marker
      anchor={{ x: 0.5, y: 1 }}
    >
      <MapPriceTag
        price={listing.price}
        selected={selected}
        premium={listing.tier === 'premium'}
      />
    </Marker>
  );
});

// ─── Bottom Sheet Header ──────────────────────────────────────────────────────

const BottomSheetHeader = memo(function BottomSheetHeader({
  count,
  loading,
  suburb,
}: {
  count: number;
  loading: boolean;
  suburb?: string;
}) {
  return (
    <View style={bsStyles.header}>
      <View style={bsStyles.handle} />
      <View style={bsStyles.headerRow}>
        <View>
          <Text style={bsStyles.headerCount}>
            {loading ? 'Loading…' : `${count} place${count !== 1 ? 's' : ''}`}
          </Text>
          {suburb && (
            <Text style={bsStyles.headerSuburb}>in {suburb}</Text>
          )}
        </View>
        <View style={bsStyles.sortRow}>
          <TouchableOpacity style={bsStyles.sortBtn} activeOpacity={0.75}>
            <Text style={bsStyles.sortBtnText}>Sort: Newest ▾</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const bsStyles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.surface,
    paddingTop: SPACING[2],
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING[3],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerCount: {
    fontSize: FONT.sizes.lg,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
  },
  headerSuburb: {
    fontSize: FONT.sizes.sm,
    color: COLORS.inkLight,
    marginTop: 2,
  },
  sortRow: { flexDirection: 'row', gap: SPACING[2] },
  sortBtn: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1] + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortBtnText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.inkMedium,
    fontWeight: FONT.weights.medium,
  },
});

// ─── Explore Screen ───────────────────────────────────────────────────────────

interface ExploreScreenProps {
  onListingPress: (listing: Listing) => void;
}

export default function ExploreScreen({ onListingPress }: ExploreScreenProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const { region, setRegion, selectedListingId, selectListing, bottomSheetIndex, setBottomSheetIndex } =
    useMapStore();
  const { filters } = useFilterStore();

  const [mapRegion, setMapRegion] = useState<MapRegion>(region);
  const debouncedRegion = useDebounce(mapRegion, 600);

  const { data: listings = [], isLoading } = useListingsInRegion(debouncedRegion, filters);

  const snapPoints = useMemo(() => ['22%', '52%', '92%'], []);

  const handleRegionChangeComplete = useCallback(
    (newRegion: Region) => {
      setMapRegion(newRegion);
      setRegion(newRegion);
    },
    [setRegion]
  );

  const handleMarkerPress = useCallback(
    (id: string) => {
      selectListing(id);
      bottomSheetRef.current?.snapToIndex(1);
      // Animate map to selected listing
      const listing = listings.find((l) => l.id === id);
      if (listing) {
        mapRef.current?.animateToRegion(
          {
            ...listing.coordinates,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          },
          400
        );
      }
    },
    [listings, selectListing]
  );

  const handleListingPress = useCallback(
    (listing: Listing) => {
      onListingPress(listing);
    },
    [onListingPress]
  );

  const handleMapPress = useCallback(() => {
    selectListing(null);
  }, [selectListing]);

  const renderListing = useCallback(
    ({ item }: { item: Listing }) => (
      <View style={exploreStyles.listingItem}>
        <ListingCard
          listing={item}
          onPress={handleListingPress}
          variant="horizontal"
          showDistance
        />
      </View>
    ),
    [handleListingPress]
  );

  const renderSkeleton = useCallback(
    () => (
      <View style={exploreStyles.listingItem}>
        <ListingCardSkeleton />
      </View>
    ),
    []
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={0}
        appearsOnIndex={2}
        opacity={0.3}
      />
    ),
    []
  );

  const keyExtractor = useCallback((item: Listing) => item.id, []);

  const currentSuburb = useMemo(() => {
    if (!selectedListingId) return undefined;
    return listings.find((l) => l.id === selectedListingId)?.suburb;
  }, [selectedListingId, listings]);

  return (
    <View style={exploreStyles.root}>
      {/* ── Map ─────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={HARARE_REGION}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPress={handleMapPress}
        customMapStyle={MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        mapPadding={{ top: 0, right: 0, bottom: SCREEN_HEIGHT * 0.25, left: 0 }}
      >
        {listings.map((listing) => (
          <ListingMarker
            key={listing.id}
            listing={listing}
            selected={listing.id === selectedListingId}
            onPress={handleMarkerPress}
          />
        ))}
      </MapView>

      {/* ── Top Bar: Search + Filter ────────── */}
      <View
        style={[
          exploreStyles.topBar,
          { paddingTop: insets.top + SPACING[2] },
        ]}
      >
        <TouchableOpacity
          style={[exploreStyles.searchBar, ...(SHADOW.md ? [SHADOW.md] : [])]}
          activeOpacity={0.85}
        >
          <Text style={exploreStyles.searchIcon}>🔍</Text>
          <Text style={exploreStyles.searchPlaceholder}>Search Harare…</Text>
        </TouchableOpacity>
        <FilterButton />
      </View>

      {/* ── Location Shortcut Pills ─────────── */}
      <View style={exploreStyles.suburbPillsWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={exploreStyles.suburbPillsContent}
          data={['Avondale', 'Hatfield', 'Borrowdale', 'Mt Pleasant', 'Msasa', 'Glen View']}
          keyExtractor={(s) => s}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[exploreStyles.suburbPill, ...(SHADOW.sm ? [SHADOW.sm] : [])]}
              activeOpacity={0.8}
              onPress={() => {
                // Animate map to suburb
              }}
            >
              <Text style={exploreStyles.suburbPillText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* ── My Location Button ──────────────── */}
      <TouchableOpacity
        style={[exploreStyles.myLocationBtn, { bottom: SCREEN_HEIGHT * 0.24 }, ...(SHADOW.md ? [SHADOW.md] : [])]}
        activeOpacity={0.85}
        onPress={() => {
          mapRef.current?.animateToRegion(HARARE_REGION, 600);
        }}
      >
        <Text style={{ fontSize: 18 }}>📍</Text>
      </TouchableOpacity>

      {/* ── Bottom Sheet ────────────────────── */}
      <BottomSheet
        ref={bottomSheetRef}
        index={bottomSheetIndex}
        snapPoints={snapPoints}
        onChange={setBottomSheetIndex}
        backdropComponent={renderBackdrop}
        backgroundStyle={exploreStyles.sheetBackground}
        handleComponent={() => null}
        enablePanDownToClose={false}
        enableOverDrag={false}
        animateOnMount={false}
      >
        <BottomSheetHeader
          count={listings.length}
          loading={isLoading}
          suburb={currentSuburb}
        />
        <BottomSheetFlatList
          data={isLoading ? Array(3).fill(null) : listings}
          keyExtractor={(item, idx) => (item ? item.id : `skel_${idx}`)}
          renderItem={isLoading ? renderSkeleton : renderListing}
          contentContainerStyle={exploreStyles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !isLoading ? (
              <View style={exploreStyles.emptySheet}>
                <Text style={exploreStyles.emptyEmoji}>🏘️</Text>
                <Text style={exploreStyles.emptyTitle}>No listings here</Text>
                <Text style={exploreStyles.emptyDesc}>
                  Pan the map or adjust your filters to find places to stay.
                </Text>
              </View>
            ) : null
          }
        />
      </BottomSheet>

      {/* ── Filter Sheet Modal ──────────────── */}
      <FilterSheet />
    </View>
  );
}

const exploreStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
    gap: SPACING[2],
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { fontSize: 15 },
  searchPlaceholder: {
    fontSize: FONT.sizes.base,
    color: COLORS.inkFaint,
    fontWeight: FONT.weights.medium,
  },
  suburbPillsWrap: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
  },
  suburbPillsContent: {
    paddingHorizontal: SPACING[4],
    gap: SPACING[2],
  },
  suburbPill: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1] + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suburbPillText: {
    fontSize: FONT.sizes.sm,
    fontWeight: FONT.weights.semibold,
    color: COLORS.ink,
  },
  myLocationBtn: {
    position: 'absolute',
    right: SPACING[4],
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetBackground: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
  },
  listContent: {
    paddingVertical: SPACING[3],
  },
  listingItem: {
    paddingHorizontal: SPACING[4],
  },
  emptySheet: {
    alignItems: 'center',
    paddingVertical: SPACING[10],
    paddingHorizontal: SPACING[6],
  },
  emptyEmoji: { fontSize: 40, marginBottom: SPACING[3] },
  emptyTitle: {
    fontSize: FONT.sizes.lg,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
    marginBottom: SPACING[2],
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: FONT.sizes.base,
    color: COLORS.inkLight,
    textAlign: 'center',
    lineHeight: FONT.sizes.base * 1.55,
  },
});
