import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { COLORS, FONT, SPACING, RADIUS, SHADOW } from '../../constants';
import type { PriceInfo, TierType, RoomType } from '../../types';
import { useFormatPrice } from '../../hooks';
import { ROOM_TYPE_LABELS } from '../../constants';

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button = memo(function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  style,
  labelStyle,
  fullWidth = false,
}: ButtonProps) {
  const variantStyles = {
    primary: {
      container: { backgroundColor: COLORS.brand },
      label: { color: '#FFFFFF' },
      pressed: { backgroundColor: COLORS.brandDark },
    },
    secondary: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: COLORS.brand,
      },
      label: { color: COLORS.brand },
      pressed: { backgroundColor: COLORS.brandSurface },
    },
    ghost: {
      container: { backgroundColor: 'transparent' },
      label: { color: COLORS.inkMedium },
      pressed: { backgroundColor: COLORS.surfaceWarm },
    },
    danger: {
      container: { backgroundColor: COLORS.error },
      label: { color: '#FFFFFF' },
      pressed: { backgroundColor: '#9B2B20' },
    },
    whatsapp: {
      container: { backgroundColor: COLORS.whatsapp },
      label: { color: '#FFFFFF' },
      pressed: { backgroundColor: COLORS.whatsappDark },
    },
  };

  const sizeStyles = {
    sm: {
      container: { paddingHorizontal: SPACING[3], paddingVertical: SPACING[2], borderRadius: RADIUS.sm },
      label: { fontSize: FONT.sizes.sm, fontWeight: FONT.weights.semibold },
    },
    md: {
      container: { paddingHorizontal: SPACING[5], paddingVertical: SPACING[3] + 2, borderRadius: RADIUS.md },
      label: { fontSize: FONT.sizes.base, fontWeight: FONT.weights.semibold },
    },
    lg: {
      container: { paddingHorizontal: SPACING[6], paddingVertical: SPACING[4], borderRadius: RADIUS.lg },
      label: { fontSize: FONT.sizes.md, fontWeight: FONT.weights.bold },
    },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.btnBase,
        v.container,
        s.container,
        fullWidth && { alignSelf: 'stretch' },
        isDisabled && styles.btnDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'ghost' ? COLORS.brand : '#FFF'}
        />
      ) : (
        <>
          {iconLeft && <View style={styles.btnIconLeft}>{iconLeft}</View>}
          <Text style={[v.label, s.label, labelStyle]}>{label}</Text>
          {iconRight && <View style={styles.btnIconRight}>{iconRight}</View>}
        </>
      )}
    </TouchableOpacity>
  );
});

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  label: string;
  variant?: 'brand' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'gold';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge = memo(function Badge({
  label,
  variant = 'neutral',
  size = 'md',
  style,
}: BadgeProps) {
  const variantMap = {
    brand: { bg: COLORS.brandSurface, text: COLORS.brand, border: COLORS.brandLight + '44' },
    success: { bg: COLORS.successSurface, text: COLORS.success, border: COLORS.accentLight + '44' },
    warning: { bg: COLORS.warningSurface, text: COLORS.warning, border: COLORS.gold + '44' },
    error: { bg: COLORS.errorSurface, text: COLORS.error, border: COLORS.error + '44' },
    info: { bg: COLORS.infoSurface, text: COLORS.info, border: COLORS.info + '44' },
    neutral: { bg: COLORS.surfaceWarm, text: COLORS.inkMedium, border: COLORS.border },
    gold: { bg: COLORS.goldSurface, text: COLORS.gold, border: COLORS.goldLight + '44' },
  };

  const v = variantMap[variant];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          paddingHorizontal: isSmall ? SPACING[2] : SPACING[3],
          paddingVertical: isSmall ? 2 : SPACING[1],
        },
        style,
      ]}
    >
      <Text
        style={{
          color: v.text,
          fontSize: isSmall ? FONT.sizes.xs : FONT.sizes.sm,
          fontWeight: FONT.weights.semibold,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
});

// ─── Tier Badge ───────────────────────────────────────────────────────────────

export const TierBadge = memo(function TierBadge({ tier }: { tier: TierType }) {
  if (tier === 'standard') return null;
  return (
    <Badge
      label={tier === 'premium' ? '⭐ Premium' : '✦ Featured'}
      variant={tier === 'premium' ? 'gold' : 'brand'}
      size="sm"
    />
  );
});

// ─── Room Type Badge ──────────────────────────────────────────────────────────

export const RoomTypeBadge = memo(function RoomTypeBadge({ roomType }: { roomType: RoomType }) {
  return (
    <Badge
      label={ROOM_TYPE_LABELS[roomType] ?? roomType}
      variant="neutral"
      size="sm"
    />
  );
});

// ─── Price Tag ────────────────────────────────────────────────────────────────

interface PriceTagProps {
  price: PriceInfo;
  compact?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  showNegotiable?: boolean;
}

export const PriceTag = memo(function PriceTag({
  price,
  compact = false,
  style,
  textStyle,
  showNegotiable = false,
}: PriceTagProps) {
  const { format } = useFormatPrice();
  const formatted = format(price, compact);

  return (
    <View style={[styles.priceTagWrap, style]}>
      <Text style={[styles.priceTagText, textStyle]}>{formatted}</Text>
      {showNegotiable && price.negotiable && (
        <Text style={styles.priceNegotiable}> · negotiable</Text>
      )}
    </View>
  );
});

// ─── Map Price Tag (for map markers) ─────────────────────────────────────────

interface MapPriceTagProps {
  price: PriceInfo;
  selected?: boolean;
  premium?: boolean;
}

export const MapPriceTag = memo(function MapPriceTag({
  price,
  selected = false,
  premium = false,
}: MapPriceTagProps) {
  const { format } = useFormatPrice();
  return (
    <View
      style={[
        styles.mapTag,
        selected && styles.mapTagSelected,
        premium && styles.mapTagPremium,
        ...(SHADOW.sm ? [SHADOW.sm] : []),
      ]}
    >
      <Text
        style={[
          styles.mapTagText,
          selected && styles.mapTagTextSelected,
          premium && styles.mapTagTextPremium,
        ]}
      >
        {format(price, true)}
      </Text>
    </View>
  );
});

// ─── Star Rating ──────────────────────────────────────────────────────────────

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const StarRating = memo(function StarRating({
  rating,
  reviewCount,
  size = 'md',
  style,
}: StarRatingProps) {
  const isSmall = size === 'sm';
  return (
    <View style={[styles.starRow, style]}>
      <Text style={{ fontSize: isSmall ? FONT.sizes.sm : FONT.sizes.base }}>★</Text>
      <Text
        style={[
          styles.ratingText,
          { fontSize: isSmall ? FONT.sizes.sm : FONT.sizes.base },
        ]}
      >
        {rating.toFixed(1)}
      </Text>
      {reviewCount !== undefined && (
        <Text
          style={[
            styles.reviewCount,
            { fontSize: isSmall ? FONT.sizes.xs : FONT.sizes.sm },
          ]}
        >
          ({reviewCount})
        </Text>
      )}
    </View>
  );
});

// ─── Chip ─────────────────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const Chip = memo(function Chip({ label, selected = false, onPress, style }: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        style,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
});

// ─── Divider ──────────────────────────────────────────────────────────────────

export const Divider = memo(function Divider({
  style,
  inset = 0,
}: {
  style?: ViewStyle;
  inset?: number;
}) {
  return (
    <View
      style={[
        { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginHorizontal: inset },
        style,
      ]}
    />
  );
});

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

export const EmptyState = memo(function EmptyState({
  emoji,
  title,
  description,
  action,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.emptyWrap, style]}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && <Text style={styles.emptyDesc}>{description}</Text>}
      {action && (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant="primary"
          size="md"
          style={{ marginTop: SPACING[4] }}
        />
      )}
    </View>
  );
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export const Skeleton = memo(function Skeleton({
  width,
  height,
  borderRadius = RADIUS.sm,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: COLORS.border,
        },
        style,
      ]}
    />
  );
});

// ─── Verified Badge ───────────────────────────────────────────────────────────

export const VerifiedBadge = memo(function VerifiedBadge({ size = 14 }: { size?: number }) {
  return (
    <View style={[styles.verifiedBadge, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }]}>
      <Text style={{ fontSize: size - 4, color: '#fff' }}>✓</Text>
    </View>
  );
});

// ─── Section Header ───────────────────────────────────────────────────────────

export const SectionHeader = memo(function SectionHeader({
  title,
  action,
  style,
}: {
  title: string;
  action?: { label: string; onPress: () => void };
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.sectionHeaderRow, style]}>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress} activeOpacity={0.7}>
          <Text style={styles.sectionHeaderAction}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  btnBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnIconLeft: { marginRight: SPACING[2] },
  btnIconRight: { marginLeft: SPACING[2] },

  badge: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },

  priceTagWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceTagText: {
    fontSize: FONT.sizes.lg,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
    letterSpacing: -0.3,
  },
  priceNegotiable: {
    fontSize: FONT.sizes.sm,
    color: COLORS.inkLight,
    fontWeight: FONT.weights.regular,
  },

  mapTag: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1] + 2,
    borderWidth: 1.5,
    borderColor: COLORS.ink,
  },
  mapTagSelected: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  mapTagPremium: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  mapTagText: {
    fontSize: FONT.sizes.sm,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
    letterSpacing: -0.2,
  },
  mapTagTextSelected: { color: '#FFFFFF' },
  mapTagTextPremium: { color: '#FFFFFF' },

  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontWeight: FONT.weights.semibold,
    color: COLORS.ink,
  },
  reviewCount: {
    color: COLORS.inkLight,
    fontWeight: FONT.weights.regular,
  },

  chip: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  chipText: {
    fontSize: FONT.sizes.sm,
    fontWeight: FONT.weights.medium,
    color: COLORS.inkMedium,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: FONT.weights.semibold,
  },

  emptyWrap: {
    alignItems: 'center',
    paddingVertical: SPACING[12],
    paddingHorizontal: SPACING[6],
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING[4],
  },
  emptyTitle: {
    fontSize: FONT.sizes.lg,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  emptyDesc: {
    fontSize: FONT.sizes.base,
    color: COLORS.inkLight,
    textAlign: 'center',
    lineHeight: FONT.sizes.base * FONT.lineHeights.relaxed,
  },

  verifiedBadge: {
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING[3],
  },
  sectionHeaderTitle: {
    fontSize: FONT.sizes.md,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
  },
  sectionHeaderAction: {
    fontSize: FONT.sizes.sm,
    fontWeight: FONT.weights.semibold,
    color: COLORS.brand,
  },
});
