import React, {
  useRef,
  useCallback,
  useState,
  memo,
  useMemo,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Share,
  Platform,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, SPACING, RADIUS, SHADOW } from '../../constants';
import { useListingDetail, useToggleSave } from '../../lib/api';
import {
  Badge,
  TierBadge,
  RoomTypeBadge,
  StarRating,
  PriceTag,
  Button,
  Divider,
  VerifiedBadge,
  SectionHeader,
} from '../common';
import { usePulseAnimation, useContactActions } from '../../hooks';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 300;
const PARALLAX_FACTOR = 0.4;
const BLURHASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

// ─── Image Gallery Carousel ───────────────────────────────────────────────────

const GalleryCarousel = memo(function GalleryCarousel({
  images,
  scrollY,
}: {
  images: string[];
  scrollY: Animated.Value;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const translateY = scrollY.interpolate({
    inputRange: [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
    outputRange: [HEADER_HEIGHT * PARALLAX_FACTOR, 0, -HEADER_HEIGHT * PARALLAX_FACTOR],
    extrapolate: 'clamp',
  });

  const onScroll = useCallback(
    (e: any) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setActiveIndex(idx);
    },
    []
  );

  return (
    <Animated.View
      style={[galleryStyles.wrap, { transform: [{ translateY }] }]}
    >
      <FlatList
        ref={listRef}
        data={images}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <Image
            source={{ uri: item }}
            style={{ width: SCREEN_WIDTH, height: HEADER_HEIGHT + 40 }}
            contentFit="cover"
            transition={250}
            placeholder={BLURHASH}
            cachePolicy="disk"
            recyclingKey={`gallery_${index}`}
          />
        )}
      />

      {/* Dot indicators */}
      <View style={galleryStyles.dots}>
        {images.map((_, i) => (
          <View
            key={i}
            style={[
              galleryStyles.dot,
              i === activeIndex && galleryStyles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Image counter */}
      <View style={galleryStyles.counter}>
        <Text style={galleryStyles.counterText}>
          {activeIndex + 1} / {images.length}
        </Text>
      </View>
    </Animated.View>
  );
});

const galleryStyles = StyleSheet.create({
  wrap: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  dots: {
    position: 'absolute',
    bottom: SPACING[4],
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING[1],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 18,
  },
  counter: {
    position: 'absolute',
    top: SPACING[4],
    right: SPACING[4],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING[2] + 2,
    paddingVertical: 4,
  },
  counterText: {
    color: '#FFF',
    fontSize: FONT.sizes.xs,
    fontWeight: FONT.weights.semibold,
  },
});

// ─── Utility Grid ─────────────────────────────────────────────────────────────

const UtilityGrid = memo(function UtilityGrid({
  utilities,
}: {
  utilities: { id: string; label: string; available: boolean }[];
}) {
  const icons: Record<string, string> = {
    solar: '☀️', borehole: '💧', generator: '⚡',
    wifi: '📶', dstv: '📺', parking: '🚗',
    security: '🔒', garden: '🌿',
  };

  return (
    <View style={detailStyles.utilityGrid}>
      {utilities.map((u) => (
        <View
          key={u.id}
          style={[
            detailStyles.utilityCell,
            !u.available && detailStyles.utilityCellUnavailable,
          ]}
        >
          <Text
            style={[
              detailStyles.utilityCellIcon,
              !u.available && { opacity: 0.3 },
            ]}
          >
            {icons[u.id] ?? '•'}
          </Text>
          <Text
            style={[
              detailStyles.utilityCellLabel,
              !u.available && detailStyles.utilityCellLabelUnavailable,
            ]}
          >
            {u.label}
          </Text>
          {!u.available && (
            <Text style={detailStyles.utilityCellUnavailableTag}>✕</Text>
          )}
        </View>
      ))}
    </View>
  );
});

// ─── Landlord Section ─────────────────────────────────────────────────────────

const LandlordSection = memo(function LandlordSection({
  landlord,
}: {
  landlord: any;
}) {
  return (
    <View style={detailStyles.landlordCard}>
      <View style={detailStyles.landlordRow}>
        <Image
          source={{ uri: landlord.avatar ?? undefined }}
          style={detailStyles.landlordAvatar}
          contentFit="cover"
          cachePolicy="memory-disk"
          placeholder={BLURHASH}
        />
        <View style={{ flex: 1 }}>
          <View style={detailStyles.landlordNameRow}>
            <Text style={detailStyles.landlordName}>{landlord.name}</Text>
            {landlord.verified && <VerifiedBadge size={16} />}
          </View>
          <Text style={detailStyles.landlordMeta}>
            Member since {landlord.memberSince} · {landlord.totalListings} listings
          </Text>
          <StarRating rating={landlord.rating} reviewCount={landlord.reviewCount} />
        </View>
      </View>
      <View style={detailStyles.responseRow}>
        <Text style={detailStyles.responseIcon}>⚡</Text>
        <Text style={detailStyles.responseText}>{landlord.responseTime}</Text>
      </View>
    </View>
  );
});

// ─── Rules Section ────────────────────────────────────────────────────────────

const RulesSection = memo(function RulesSection({ rules }: { rules: string[] }) {
  if (rules.length === 0) return null;
  return (
    <View>
      <SectionHeader title="House rules" style={{ marginBottom: SPACING[3] }} />
      {rules.map((rule, i) => (
        <View key={i} style={detailStyles.ruleRow}>
          <Text style={detailStyles.ruleDot}>•</Text>
          <Text style={detailStyles.ruleText}>{rule}</Text>
        </View>
      ))}
    </View>
  );
});

// ─── Premium Banner ───────────────────────────────────────────────────────────

const PremiumBanner = memo(function PremiumBanner({ tier }: { tier: string }) {
  const { scale, opacity } = usePulseAnimation(tier === 'premium');
  if (tier === 'standard') return null;

  return (
    <Animated.View style={[detailStyles.premiumBanner, { transform: [{ scale }], opacity }]}>
      <Text style={detailStyles.premiumBannerText}>
        {tier === 'premium' ? '⭐ Premium Featured — Verified top listing' : '✦ Featured Listing'}
      </Text>
    </Animated.View>
  );
});

// ─── Sticky Bottom Action Bar ─────────────────────────────────────────────────

interface BottomBarProps {
  price: any;
  phone: string;
  whatsapp: string;
  title: string;
  onMessage: () => void;
}

const StickyBottomBar = memo(function StickyBottomBar({
  price,
  phone,
  whatsapp,
  title,
  onMessage,
}: BottomBarProps) {
  const insets = useSafeAreaInsets();
  const { call, openWhatsApp } = useContactActions({ phone, whatsapp, listingTitle: title });

  return (
    <View
      style={[
        detailStyles.bottomBar,
        { paddingBottom: insets.bottom + SPACING[3] },
        ...(SHADOW.xl ? [SHADOW.xl] : []),
      ]}
    >
      <View style={detailStyles.bottomBarLeft}>
        <PriceTag price={price} showNegotiable />
        <Text style={detailStyles.bottomBarPriceNote}>per month</Text>
      </View>

      <View style={detailStyles.bottomBarActions}>
        {/* Call */}
        <TouchableOpacity
          onPress={call}
          activeOpacity={0.8}
          style={detailStyles.callBtn}
        >
          <Text style={detailStyles.callBtnIcon}>📞</Text>
        </TouchableOpacity>

        {/* WhatsApp */}
        <TouchableOpacity
          onPress={openWhatsApp}
          activeOpacity={0.8}
          style={detailStyles.whatsappBtn}
        >
          <Text style={detailStyles.whatsappBtnIcon}>💬</Text>
          <Text style={detailStyles.whatsappBtnLabel}>WhatsApp</Text>
        </TouchableOpacity>

        {/* In-app message */}
        <Button
          label="Message"
          onPress={onMessage}
          variant="primary"
          size="md"
          style={{ borderRadius: RADIUS.full }}
        />
      </View>
    </View>
  );
});

// ─── Main ListingDetailScreen ─────────────────────────────────────────────────

interface ListingDetailScreenProps {
  listingId: string;
  onBack: () => void;
  onMessage: () => void;
}

export default function ListingDetailScreen({
  listingId,
  onBack,
  onMessage,
}: ListingDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { data: listing, isLoading, error } = useListingDetail(listingId);
  const toggleSave = useToggleSave();
  const [showFullDesc, setShowFullDesc] = useState(false);

  const headerOpacity = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT - 80, HEADER_HEIGHT - 30],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleSave = useCallback(() => {
    if (!listing) return;
    toggleSave.mutate({ listingId: listing.id, saved: !listing.isSaved });
  }, [listing, toggleSave]);

  const handleShare = useCallback(async () => {
    if (!listing) return;
    try {
      await Share.share({
        title: listing.title,
        message: `Check out this listing on House-By-Us: ${listing.title} in ${listing.suburb} for $${listing.price.amount}/mo`,
      });
    } catch {}
  }, [listing]);

  if (isLoading || !listing) {
    return (
      <View style={[detailStyles.root, { paddingTop: insets.top }]}>
        <View style={detailStyles.loadingHeader} />
        <View style={{ padding: SPACING[4], gap: SPACING[3] }}>
          {[200, 140, 100, 80].map((w, i) => (
            <View key={i} style={{ height: 16, width: w, backgroundColor: COLORS.border, borderRadius: 8 }} />
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[detailStyles.root, detailStyles.errorWrap]}>
        <Text style={detailStyles.errorText}>Could not load this listing.</Text>
        <Button label="Go back" onPress={onBack} variant="secondary" size="md" style={{ marginTop: SPACING[4] }} />
      </View>
    );
  }

  const availableDate = new Date(listing.availableFrom).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <View style={detailStyles.root}>
      {/* ── Animated sticky header ─────────────── */}
      <Animated.View
        style={[
          detailStyles.stickyHeader,
          { paddingTop: insets.top, opacity: headerOpacity },
        ]}
      >
        <TouchableOpacity onPress={onBack} activeOpacity={0.8} style={detailStyles.stickyBackBtn}>
          <Text style={detailStyles.stickyBackIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={detailStyles.stickyTitle} numberOfLines={1}>
          {listing.title}
        </Text>
        <TouchableOpacity onPress={handleShare} style={detailStyles.stickyShareBtn}>
          <Text style={{ fontSize: 18 }}>⬆</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Floating back/share (before scroll) ─ */}
      <View style={[detailStyles.floatingBtns, { top: insets.top + SPACING[2] }]}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.85}
          style={[detailStyles.floatingBtn, ...(SHADOW.sm ? [SHADOW.sm] : [])]}
        >
          <Text style={detailStyles.floatingBtnIcon}>‹</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: SPACING[2] }}>
          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.85}
            style={[detailStyles.floatingBtn, ...(SHADOW.sm ? [SHADOW.sm] : [])]}
          >
            <Text style={{ fontSize: 16 }}>⬆</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.85}
            style={[detailStyles.floatingBtn, ...(SHADOW.sm ? [SHADOW.sm] : [])]}
          >
            <Text style={{ fontSize: 16 }}>{listing.isSaved ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable body ─────────────────── */}
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Parallax image gallery */}
        <GalleryCarousel images={listing.images} scrollY={scrollY} />

        {/* Content area */}
        <View style={detailStyles.contentWrap}>
          {/* Premium banner */}
          <PremiumBanner tier={listing.tier} />

          {/* Badges row */}
          <View style={detailStyles.badgeRow}>
            <TierBadge tier={listing.tier} />
            <RoomTypeBadge roomType={listing.roomType} />
            <Badge
              label={listing.status === 'active' ? '✓ Available' : 'Not available'}
              variant={listing.status === 'active' ? 'success' : 'error'}
              size="sm"
            />
          </View>

          {/* Title + price */}
          <Text style={detailStyles.title}>{listing.title}</Text>

          <View style={detailStyles.priceAvailRow}>
            <PriceTag price={listing.price} showNegotiable />
            <Text style={detailStyles.availFrom}>From {availableDate}</Text>
          </View>

          {/* Address */}
          <TouchableOpacity style={detailStyles.addressRow} activeOpacity={0.75}>
            <Text style={detailStyles.addressIcon}>📍</Text>
            <View>
              <Text style={detailStyles.addressMain}>{listing.address}</Text>
              <Text style={detailStyles.addressSub}>
                {listing.suburb} · {listing.distanceFromCbd?.toFixed(1)} km from CBD
              </Text>
            </View>
            <Text style={detailStyles.mapChevron}>›</Text>
          </TouchableOpacity>

          <Divider style={{ marginVertical: SPACING[4] }} />

          {/* Description */}
          <View style={detailStyles.section}>
            <SectionHeader title="About this place" />
            <Text
              style={detailStyles.descText}
              numberOfLines={showFullDesc ? undefined : 4}
            >
              {listing.description}
            </Text>
            {listing.description.length > 150 && (
              <TouchableOpacity
                onPress={() => setShowFullDesc((v) => !v)}
                activeOpacity={0.75}
              >
                <Text style={detailStyles.showMoreBtn}>
                  {showFullDesc ? 'Show less ↑' : 'Show more ↓'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Divider style={{ marginVertical: SPACING[4] }} />

          {/* Utilities */}
          <View style={detailStyles.section}>
            <SectionHeader title="Utilities & features" />
            <UtilityGrid utilities={listing.utilities} />
          </View>

          <Divider style={{ marginVertical: SPACING[4] }} />

          {/* Amenities */}
          {listing.amenities.length > 0 && (
            <>
              <View style={detailStyles.section}>
                <SectionHeader title="What's included" />
                <View style={detailStyles.amenityGrid}>
                  {listing.amenities.map((a) => (
                    <View key={a} style={detailStyles.amenityItem}>
                      <Text style={detailStyles.amenityCheck}>✓</Text>
                      <Text style={detailStyles.amenityText}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Divider style={{ marginVertical: SPACING[4] }} />
            </>
          )}

          {/* Landlord */}
          <View style={detailStyles.section}>
            <SectionHeader title="Your landlord" />
            <LandlordSection landlord={listing.landlord} />
          </View>

          <Divider style={{ marginVertical: SPACING[4] }} />

          {/* Rules */}
          <View style={detailStyles.section}>
            <RulesSection rules={listing.rules} />
          </View>

          <Divider style={{ marginVertical: SPACING[4] }} />

          {/* Stats */}
          <View style={detailStyles.statsRow}>
            <View style={detailStyles.statItem}>
              <Text style={detailStyles.statValue}>{listing.viewCount}</Text>
              <Text style={detailStyles.statLabel}>Views</Text>
            </View>
            <View style={detailStyles.statItem}>
              <Text style={detailStyles.statValue}>{listing.savedCount}</Text>
              <Text style={detailStyles.statLabel}>Saves</Text>
            </View>
            <View style={detailStyles.statItem}>
              <Text style={detailStyles.statValue}>
                {new Date(listing.createdAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
              </Text>
              <Text style={detailStyles.statLabel}>Listed</Text>
            </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* ── Sticky Bottom Actions ──────────────── */}
      <StickyBottomBar
        price={listing.price}
        phone={listing.landlord.phone}
        whatsapp={listing.landlord.whatsapp}
        title={listing.title}
        onMessage={onMessage}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const detailStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.canvas },
  loadingHeader: { height: HEADER_HEIGHT, backgroundColor: COLORS.border },
  errorWrap: { alignItems: 'center', justifyContent: 'center', padding: SPACING[8] },
  errorText: { fontSize: FONT.sizes.md, color: COLORS.inkMedium, textAlign: 'center' },

  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  stickyBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyBackIcon: {
    fontSize: 28,
    color: COLORS.ink,
    lineHeight: 32,
  },
  stickyTitle: {
    flex: 1,
    fontSize: FONT.sizes.base,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
    textAlign: 'center',
    marginHorizontal: SPACING[2],
  },
  stickyShareBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  floatingBtns: {
    position: 'absolute',
    left: SPACING[4],
    right: SPACING[4],
    zIndex: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floatingBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  floatingBtnIcon: {
    fontSize: 22,
    color: COLORS.ink,
    lineHeight: 26,
  },

  contentWrap: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    marginTop: -RADIUS['2xl'],
    paddingTop: SPACING[5],
  },

  premiumBanner: {
    marginHorizontal: SPACING[4],
    marginBottom: SPACING[3],
    backgroundColor: COLORS.goldSurface,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderWidth: 1,
    borderColor: COLORS.goldLight + '66',
  },
  premiumBannerText: {
    fontSize: FONT.sizes.sm,
    fontWeight: FONT.weights.semibold,
    color: COLORS.gold,
    textAlign: 'center',
  },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[2],
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[3],
  },

  title: {
    fontSize: FONT.sizes['2xl'],
    fontWeight: FONT.weights.heavy,
    color: COLORS.ink,
    lineHeight: FONT.sizes['2xl'] * 1.25,
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[3],
    letterSpacing: -0.4,
  },

  priceAvailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    marginBottom: SPACING[3],
  },
  availFrom: {
    fontSize: FONT.sizes.sm,
    color: COLORS.inkLight,
    fontWeight: FONT.weights.medium,
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    backgroundColor: COLORS.surfaceWarm,
    marginHorizontal: SPACING[4],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addressIcon: { fontSize: 18 },
  addressMain: {
    fontSize: FONT.sizes.base,
    fontWeight: FONT.weights.semibold,
    color: COLORS.ink,
  },
  addressSub: {
    fontSize: FONT.sizes.sm,
    color: COLORS.inkLight,
    marginTop: 2,
  },
  mapChevron: {
    marginLeft: 'auto',
    fontSize: 22,
    color: COLORS.inkFaint,
  },

  section: {
    paddingHorizontal: SPACING[4],
  },
  descText: {
    fontSize: FONT.sizes.base,
    color: COLORS.inkMedium,
    lineHeight: FONT.sizes.base * FONT.lineHeights.relaxed,
  },
  showMoreBtn: {
    marginTop: SPACING[2],
    fontSize: FONT.sizes.base,
    fontWeight: FONT.weights.semibold,
    color: COLORS.brand,
  },

  utilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[2],
  },
  utilityCell: {
    width: (SCREEN_WIDTH - SPACING[4] * 2 - SPACING[2] * 3) / 4,
    alignItems: 'center',
    paddingVertical: SPACING[3],
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING[1],
  },
  utilityCellUnavailable: {
    opacity: 0.45,
  },
  utilityCellIcon: { fontSize: 22 },
  utilityCellLabel: {
    fontSize: FONT.sizes.xs,
    color: COLORS.inkMedium,
    fontWeight: FONT.weights.medium,
    textAlign: 'center',
  },
  utilityCellLabelUnavailable: { color: COLORS.inkFaint },
  utilityCellUnavailableTag: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 9,
    color: COLORS.error,
    fontWeight: FONT.weights.bold,
  },

  amenityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[2],
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    width: '47%',
    paddingVertical: SPACING[1],
  },
  amenityCheck: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: FONT.weights.bold,
  },
  amenityText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.inkMedium,
    fontWeight: FONT.weights.medium,
    flex: 1,
  },

  landlordCard: {
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.lg,
    padding: SPACING[4],
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING[3],
  },
  landlordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  landlordAvatar: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
  },
  landlordNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    marginBottom: 3,
  },
  landlordName: {
    fontSize: FONT.sizes.md,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
  },
  landlordMeta: {
    fontSize: FONT.sizes.sm,
    color: COLORS.inkLight,
    marginBottom: SPACING[1],
  },
  responseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  responseIcon: { fontSize: 14 },
  responseText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.inkMedium,
    fontWeight: FONT.weights.medium,
  },

  ruleRow: {
    flexDirection: 'row',
    gap: SPACING[2],
    paddingVertical: SPACING[2],
  },
  ruleDot: {
    fontSize: FONT.sizes.base,
    color: COLORS.brand,
    marginTop: 2,
  },
  ruleText: {
    fontSize: FONT.sizes.base,
    color: COLORS.inkMedium,
    flex: 1,
    lineHeight: FONT.sizes.base * FONT.lineHeights.normal,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[4],
    backgroundColor: COLORS.surfaceWarm,
    marginHorizontal: SPACING[4],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING[6],
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: {
    fontSize: FONT.sizes.xl,
    fontWeight: FONT.weights.heavy,
    color: COLORS.ink,
  },
  statLabel: {
    fontSize: FONT.sizes.xs,
    color: COLORS.inkFaint,
    fontWeight: FONT.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[3],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBarLeft: { gap: 2 },
  bottomBarPriceNote: {
    fontSize: FONT.sizes.xs,
    color: COLORS.inkFaint,
  },
  bottomBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  callBtnIcon: { fontSize: 20 },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    height: 44,
    paddingHorizontal: SPACING[3],
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.whatsapp,
  },
  whatsappBtnIcon: { fontSize: 18 },
  whatsappBtnLabel: {
    color: '#FFF',
    fontSize: FONT.sizes.base,
    fontWeight: FONT.weights.semibold,
  },
});
