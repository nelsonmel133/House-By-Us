import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { COLORS, FONT, SPACING, RADIUS, SHADOW } from '../../constants';
import { Badge, TierBadge, StarRating, PriceTag, VerifiedBadge } from './index';
import { usePulseAnimation } from '../../hooks';
import { Animated } from 'react-native';
import type { Listing } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SPACING[4] * 2;
const CARD_IMAGE_HEIGHT = 200;

const BLURHASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

// ─── Utility Badge Strip ──────────────────────────────────────────────────────

const UtilityStrip = memo(function UtilityStrip({
  utilities,
}: {
  utilities: Listing['utilities'];
}) {
  const available = utilities.filter((u) => u.available).slice(0, 3);
  if (available.length === 0) return null;

  const icons: Record<string, string> = {
    solar: '☀️',
    borehole: '💧',
    generator: '⚡',
    wifi: '📶',
    parking: '🚗',
    security: '🔒',
    dstv: '📺',
    garden: '🌿',
  };

  return (
    <View style={styles.utilityStrip}>
      {available.map((u) => (
        <View key={u.id} style={styles.utilityChip}>
          <Text style={styles.utilityIcon}>{icons[u.id] ?? '•'}</Text>
          <Text style={styles.utilityLabel}>{u.label}</Text>
        </View>
      ))}
      {utilities.filter((u) => u.available).length > 3 && (
        <View style={styles.utilityChip}>
          <Text style={styles.utilityLabel}>
            +{utilities.filter((u) => u.available).length - 3} more
          </Text>
        </View>
      )}
    </View>
  );
});

// ─── Save Button ──────────────────────────────────────────────────────────────

const SaveButton = memo(function SaveButton({
  saved,
  onPress,
}: {
  saved: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={styles.saveBtn}
    >
      <Text style={{ fontSize: 18 }}>{saved ? '❤️' : '🤍'}</Text>
    </TouchableOpacity>
  );
});

// ─── Main ListingCard ─────────────────────────────────────────────────────────

interface ListingCardProps {
  listing: Listing;
  onPress: (listing: Listing) => void;
  onSave?: (listing: Listing, saved: boolean) => void;
  variant?: 'full' | 'compact' | 'horizontal';
  style?: ViewStyle;
  showDistance?: boolean;
}

export const ListingCard = memo(
  function ListingCard({
    listing,
    onPress,
    onSave,
    variant = 'full',
    style,
    showDistance = false,
  }: ListingCardProps) {
    const isPremium = listing.tier === 'premium';
    const { scale, opacity } = usePulseAnimation(isPremium);

    const handlePress = useCallback(() => onPress(listing), [onPress, listing]);
    const handleSave = useCallback(
      () => onSave?.(listing, !listing.isSaved),
      [onSave, listing]
    );

    if (variant === 'horizontal') {
      return <HorizontalCard listing={listing} onPress={handlePress} onSave={handleSave} />;
    }

    if (variant === 'compact') {
      return <CompactCard listing={listing} onPress={handlePress} />;
    }

    return (
      <Animated.View style={[isPremium && { transform: [{ scale }], opacity }]}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.94}
          style={[styles.card, isPremium && styles.cardPremium, ...(SHADOW.md ? [SHADOW.md] : []), style]}
        >
          {/* ── Image Gallery Header ─────────────────── */}
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: listing.images[0] }}
              style={styles.cardImage}
              contentFit="cover"
              transition={250}
              placeholder={BLURHASH}
              cachePolicy="disk"
              recyclingKey={listing.id + '_0'}
            />

            {/* Gradient overlay for text legibility */}
            <View style={styles.imageOverlay} />

            {/* Top badges row */}
            <View style={styles.imageTopRow}>
              <TierBadge tier={listing.tier} />
              <SaveButton saved={listing.isSaved} onPress={handleSave} />
            </View>

            {/* Image count pill */}
            {listing.images.length > 1 && (
              <View style={styles.imageCountPill}>
                <Text style={styles.imageCountText}>
                  1 / {listing.images.length}
                </Text>
              </View>
            )}

            {/* Distance */}
            {showDistance && listing.distanceFromCbd !== undefined && (
              <View style={styles.distancePill}>
                <Text style={styles.distancePillText}>
                  {listing.distanceFromCbd.toFixed(1)} km from CBD
                </Text>
              </View>
            )}
          </View>

          {/* ── Card Body ───────────────────────────── */}
          <View style={styles.cardBody}>
            {/* Price + Room type row */}
            <View style={styles.priceRow}>
              <PriceTag price={listing.price} showNegotiable />
              <Badge
                label={listing.roomType === 'shared' ? 'Shared' : 'Private'}
                variant={listing.roomType === 'shared' ? 'info' : 'success'}
                size="sm"
              />
            </View>

            {/* Title */}
            <Text style={styles.cardTitle} numberOfLines={2}>
              {listing.title}
            </Text>

            {/* Suburb + City */}
            <Text style={styles.cardAddress} numberOfLines={1}>
              📍 {listing.suburb}, {listing.city}
            </Text>

            {/* Utilities */}
            <UtilityStrip utilities={listing.utilities} />

            {/* Footer: landlord + rating */}
            <View style={styles.cardFooter}>
              <View style={styles.landlordRow}>
                <Image
                  source={{ uri: listing.landlord.avatar ?? undefined }}
                  style={styles.landlordAvatar}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  placeholder={BLURHASH}
                />
                <View>
                  <View style={styles.landlordNameRow}>
                    <Text style={styles.landlordName} numberOfLines={1}>
                      {listing.landlord.name}
                    </Text>
                    {listing.landlord.verified && <VerifiedBadge size={12} />}
                  </View>
                  <Text style={styles.responseTime}>{listing.landlord.responseTime}</Text>
                </View>
              </View>
              <StarRating
                rating={listing.landlord.rating}
                reviewCount={listing.landlord.reviewCount}
                size="sm"
              />
            </View>
          </View>

          {/* Premium accent border */}
          {isPremium && <View style={styles.premiumAccentBar} />}
        </TouchableOpacity>
      </Animated.View>
    );
  },
  // Custom equality — skip re-render if listing data unchanged
  (prev, next) =>
    prev.listing.id === next.listing.id &&
    prev.listing.isSaved === next.listing.isSaved &&
    prev.variant === next.variant
);

// ─── Horizontal Card (bottom sheet variant) ───────────────────────────────────

const HorizontalCard = memo(function HorizontalCard({
  listing,
  onPress,
  onSave,
}: {
  listing: Listing;
  onPress: () => void;
  onSave: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={[styles.hCard, ...(SHADOW.sm ? [SHADOW.sm] : [])]}
    >
      <Image
        source={{ uri: listing.images[0] }}
        style={styles.hCardImage}
        contentFit="cover"
        transition={200}
        placeholder={BLURHASH}
        cachePolicy="disk"
        recyclingKey={listing.id + '_h'}
      />
      <View style={styles.hCardBody}>
        <View style={styles.hCardTopRow}>
          <TierBadge tier={listing.tier} />
          <SaveButton saved={listing.isSaved} onPress={onSave} />
        </View>
        <Text style={styles.hCardTitle} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={styles.hCardAddress} numberOfLines={1}>
          📍 {listing.suburb}
        </Text>
        <View style={styles.hCardFooter}>
          <PriceTag price={listing.price} compact />
          <StarRating rating={listing.landlord.rating} size="sm" />
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Compact Card (search result row) ────────────────────────────────────────

const CompactCard = memo(function CompactCard({
  listing,
  onPress,
}: {
  listing: Listing;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={styles.compactCard}
    >
      <Image
        source={{ uri: listing.images[0] }}
        style={styles.compactImage}
        contentFit="cover"
        transition={200}
        placeholder={BLURHASH}
        cachePolicy="disk"
        recyclingKey={listing.id + '_c'}
      />
      <View style={styles.compactBody}>
        <Text style={styles.compactTitle} numberOfLines={1}>{listing.title}</Text>
        <Text style={styles.compactAddress} numberOfLines={1}>
          {listing.suburb} · {listing.city}
        </Text>
        <PriceTag price={listing.price} compact />
      </View>
      <Text style={styles.compactChevron}>›</Text>
    </TouchableOpacity>
  );
});

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

export const ListingCardSkeleton = memo(function ListingCardSkeleton() {
  return (
    <View style={[styles.card, ...(SHADOW.sm ? [SHADOW.sm] : [])]}>
      <View style={[styles.cardImage, { backgroundColor: COLORS.border }]} />
      <View style={styles.cardBody}>
        <View style={{ height: 14, width: '40%', backgroundColor: COLORS.border, borderRadius: RADIUS.xs, marginBottom: SPACING[2] }} />
        <View style={{ height: 18, width: '80%', backgroundColor: COLORS.border, borderRadius: RADIUS.xs, marginBottom: SPACING[2] }} />
        <View style={{ height: 13, width: '60%', backgroundColor: COLORS.border, borderRadius: RADIUS.xs, marginBottom: SPACING[3] }} />
        <View style={{ height: 13, width: '50%', backgroundColor: COLORS.border, borderRadius: RADIUS.xs }} />
      </View>
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING[4],
  },
  cardPremium: {
    borderWidth: 1.5,
    borderColor: COLORS.goldLight + '80',
  },
  imageWrap: {
    width: '100%',
    height: CARD_IMAGE_HEIGHT,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: CARD_IMAGE_HEIGHT,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  imageTopRow: {
    position: 'absolute',
    top: SPACING[3],
    left: SPACING[3],
    right: SPACING[3],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  imageCountPill: {
    position: 'absolute',
    bottom: SPACING[3],
    right: SPACING[3],
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING[2],
    paddingVertical: 3,
  },
  imageCountText: {
    color: '#FFFFFF',
    fontSize: FONT.sizes.xs,
    fontWeight: FONT.weights.medium,
  },
  distancePill: {
    position: 'absolute',
    bottom: SPACING[3],
    left: SPACING[3],
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING[2],
    paddingVertical: 3,
  },
  distancePillText: {
    color: '#FFFFFF',
    fontSize: FONT.sizes.xs,
    fontWeight: FONT.weights.medium,
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: SPACING[4],
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  cardTitle: {
    fontSize: FONT.sizes.md,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
    lineHeight: FONT.sizes.md * FONT.lineHeights.snug,
    marginBottom: SPACING[1],
  },
  cardAddress: {
    fontSize: FONT.sizes.sm,
    color: COLORS.inkLight,
    marginBottom: SPACING[3],
  },
  utilityStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[1],
    marginBottom: SPACING[3],
  },
  utilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.xs,
    paddingHorizontal: SPACING[2],
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  utilityIcon: { fontSize: 10 },
  utilityLabel: {
    fontSize: FONT.sizes.xs,
    color: COLORS.inkMedium,
    fontWeight: FONT.weights.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingTop: SPACING[3],
    marginTop: SPACING[1],
  },
  landlordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    flex: 1,
  },
  landlordAvatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
  },
  landlordNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  landlordName: {
    fontSize: FONT.sizes.sm,
    fontWeight: FONT.weights.semibold,
    color: COLORS.inkMedium,
    maxWidth: 120,
  },
  responseTime: {
    fontSize: FONT.sizes.xs,
    color: COLORS.inkFaint,
  },
  premiumAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.gold,
  },

  // Horizontal card
  hCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: SPACING[3],
    width: SCREEN_WIDTH - SPACING[4] * 2,
  },
  hCardImage: {
    width: 110,
    height: 110,
  },
  hCardBody: {
    flex: 1,
    padding: SPACING[3],
  },
  hCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[1],
  },
  hCardTitle: {
    fontSize: FONT.sizes.base,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
    lineHeight: FONT.sizes.base * FONT.lineHeights.snug,
    marginBottom: SPACING[1],
  },
  hCardAddress: {
    fontSize: FONT.sizes.xs,
    color: COLORS.inkLight,
    marginBottom: SPACING[2],
  },
  hCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },

  // Compact card
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING[3],
    marginBottom: SPACING[2],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    gap: SPACING[3],
  },
  compactImage: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.border,
  },
  compactBody: {
    flex: 1,
    gap: 3,
  },
  compactTitle: {
    fontSize: FONT.sizes.base,
    fontWeight: FONT.weights.semibold,
    color: COLORS.ink,
  },
  compactAddress: {
    fontSize: FONT.sizes.xs,
    color: COLORS.inkLight,
  },
  compactChevron: {
    fontSize: 24,
    color: COLORS.inkFaint,
    marginLeft: SPACING[1],
  },
});
