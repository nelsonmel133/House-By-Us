import React, { memo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, SPACING, RADIUS, SHADOW, UTILITY_OPTIONS, ROOM_TYPE_LABELS } from '../../constants';
import { Button, Chip, Divider, SectionHeader } from '../common';
import { useFilterStore } from '../../store';
import type { RoomType } from '../../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;
const PRICE_MAX = 1000;

// ─── Price Range Slider ───────────────────────────────────────────────────────

interface PriceSliderProps {
  min: number;
  max: number;
  rangeMin: number;
  rangeMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
}

const PriceSlider = memo(function PriceSlider({
  min,
  max,
  rangeMin,
  rangeMax,
  onChangeMin,
  onChangeMax,
}: PriceSliderProps) {
  const trackWidth = useRef(0);
  const lowX = useRef(new Animated.Value((rangeMin / PRICE_MAX) * 100)).current;
  const highX = useRef(new Animated.Value((rangeMax / PRICE_MAX) * 100)).current;

  const lowVal = useRef(rangeMin);
  const highVal = useRef(rangeMax);

  const createPanResponder = useCallback(
    (type: 'low' | 'high') => {
      let startX = 0;
      let startVal = 0;

      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startX = type === 'low' ? lowVal.current : highVal.current;
          startVal = startX;
        },
        onPanResponderMove: (_, gestureState) => {
          if (trackWidth.current === 0) return;
          const delta = (gestureState.dx / trackWidth.current) * PRICE_MAX;
          let newVal = Math.round((startVal + delta) / 10) * 10;
          newVal = Math.max(min, Math.min(max, newVal));

          if (type === 'low') {
            newVal = Math.min(newVal, highVal.current - 50);
            lowVal.current = newVal;
            lowX.setValue((newVal / PRICE_MAX) * 100);
            onChangeMin(newVal);
          } else {
            newVal = Math.max(newVal, lowVal.current + 50);
            highVal.current = newVal;
            highX.setValue((newVal / PRICE_MAX) * 100);
            onChangeMax(newVal);
          }
        },
      });
    },
    [min, max, onChangeMin, onChangeMax, lowX, highX]
  );

  const lowPanResponder = useRef(createPanResponder('low')).current;
  const highPanResponder = useRef(createPanResponder('high')).current;

  const leftPct = (rangeMin / PRICE_MAX) * 100;
  const rightPct = (rangeMax / PRICE_MAX) * 100;

  return (
    <View style={sliderStyles.wrap}>
      {/* Labels */}
      <View style={sliderStyles.labelRow}>
        <View style={sliderStyles.priceLabel}>
          <Text style={sliderStyles.priceLabelText}>Min</Text>
          <Text style={sliderStyles.priceValue}>${rangeMin}</Text>
        </View>
        <View style={[sliderStyles.priceLabel, { alignItems: 'flex-end' }]}>
          <Text style={sliderStyles.priceLabelText}>Max</Text>
          <Text style={sliderStyles.priceValue}>
            {rangeMax >= PRICE_MAX ? `$${PRICE_MAX}+` : `$${rangeMax}`}
          </Text>
        </View>
      </View>

      {/* Track */}
      <View
        style={sliderStyles.track}
        onLayout={(e) => {
          trackWidth.current = e.nativeEvent.layout.width;
        }}
      >
        {/* Inactive left */}
        <View style={[sliderStyles.trackInactive, { width: `${leftPct}%` }]} />

        {/* Active range */}
        <View
          style={[
            sliderStyles.trackActive,
            { width: `${rightPct - leftPct}%` },
          ]}
        />

        {/* Inactive right */}
        <View style={[sliderStyles.trackInactive, { width: `${100 - rightPct}%` }]} />

        {/* Low thumb */}
        <Animated.View
          {...lowPanResponder.panHandlers}
          style={[
            sliderStyles.thumb,
            { left: `${leftPct}%`, marginLeft: -12 },
          ]}
        >
          <View style={sliderStyles.thumbInner} />
        </Animated.View>

        {/* High thumb */}
        <Animated.View
          {...highPanResponder.panHandlers}
          style={[
            sliderStyles.thumb,
            { left: `${rightPct}%`, marginLeft: -12 },
          ]}
        >
          <View style={sliderStyles.thumbInner} />
        </Animated.View>
      </View>
    </View>
  );
});

const sliderStyles = StyleSheet.create({
  wrap: { paddingTop: SPACING[2], paddingBottom: SPACING[4] },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING[4],
  },
  priceLabel: { gap: 2 },
  priceLabelText: { fontSize: FONT.sizes.xs, color: COLORS.inkLight, fontWeight: FONT.weights.medium },
  priceValue: { fontSize: FONT.sizes.lg, fontWeight: FONT.weights.bold, color: COLORS.ink },
  track: {
    height: 4,
    borderRadius: 2,
    flexDirection: 'row',
    position: 'relative',
    alignItems: 'center',
    marginHorizontal: SPACING[3],
  },
  trackActive: { height: 4, backgroundColor: COLORS.brand },
  trackInactive: { height: 4, backgroundColor: COLORS.border },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    top: -10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  thumbInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.brand,
  },
});

// ─── Utility Checkbox Row ─────────────────────────────────────────────────────

const UtilityRow = memo(function UtilityRow({
  id,
  label,
  selected,
  onToggle,
}: {
  id: string;
  label: string;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const icons: Record<string, string> = {
    solar: '☀️', borehole: '💧', generator: '⚡',
    wifi: '📶', dstv: '📺', parking: '🚗',
    security: '🔒', garden: '🌿',
  };

  return (
    <TouchableOpacity
      onPress={() => onToggle(id)}
      activeOpacity={0.75}
      style={[filterStyles.utilityRow, selected && filterStyles.utilityRowSelected]}
    >
      <Text style={filterStyles.utilityIcon}>{icons[id] ?? '•'}</Text>
      <Text style={[filterStyles.utilityLabel, selected && filterStyles.utilityLabelSelected]}>
        {label}
      </Text>
      <View style={[filterStyles.checkbox, selected && filterStyles.checkboxSelected]}>
        {selected && <Text style={filterStyles.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
});

// ─── Filter Sheet ─────────────────────────────────────────────────────────────

const ROOM_TYPES: RoomType[] = ['single', 'shared', 'bedsitter', 'studio', '1bed', '2bed', '3bed+'];

export const FilterSheet = memo(function FilterSheet() {
  const {
    isFilterSheetOpen,
    pendingFilters,
    setPendingFilter,
    applyPendingFilters,
    resetFilters,
    closeFilterSheet,
    activeFilterCount,
  } = useFilterStore();

  const insets = useSafeAreaInsets();

  const toggleRoomType = useCallback(
    (rt: RoomType) => {
      const current = pendingFilters.roomTypes;
      const next = current.includes(rt)
        ? current.filter((r) => r !== rt)
        : [...current, rt];
      setPendingFilter('roomTypes', next);
    },
    [pendingFilters.roomTypes, setPendingFilter]
  );

  const toggleUtility = useCallback(
    (uid: string) => {
      const current = pendingFilters.utilities;
      const next = current.includes(uid)
        ? current.filter((u) => u !== uid)
        : [...current, uid];
      setPendingFilter('utilities', next);
    },
    [pendingFilters.utilities, setPendingFilter]
  );

  const activeCount = activeFilterCount();

  return (
    <Modal
      visible={isFilterSheetOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeFilterSheet}
    >
      <View style={[filterStyles.sheet, { paddingBottom: insets.bottom }]}>
        {/* Handle bar */}
        <View style={filterStyles.handle} />

        {/* Header */}
        <View style={filterStyles.header}>
          <TouchableOpacity onPress={closeFilterSheet} activeOpacity={0.7}>
            <Text style={filterStyles.cancelBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={filterStyles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={resetFilters} activeOpacity={0.7}>
            <Text style={filterStyles.clearBtn}>Clear all</Text>
          </TouchableOpacity>
        </View>

        <Divider />

        {/* Scrollable content */}
        <ScrollView
          style={filterStyles.scroll}
          contentContainerStyle={filterStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Price Range */}
          <View style={filterStyles.section}>
            <SectionHeader title="Price range (USD / month)" />
            <PriceSlider
              min={0}
              max={PRICE_MAX}
              rangeMin={pendingFilters.priceMin}
              rangeMax={pendingFilters.priceMax}
              onChangeMin={(v) => setPendingFilter('priceMin', v)}
              onChangeMax={(v) => setPendingFilter('priceMax', v)}
            />
          </View>

          <Divider inset={SPACING[4]} style={{ marginVertical: SPACING[2] }} />

          {/* Room Type */}
          <View style={filterStyles.section}>
            <SectionHeader title="Room type" />
            <View style={filterStyles.chipGrid}>
              {ROOM_TYPES.map((rt) => (
                <Chip
                  key={rt}
                  label={ROOM_TYPE_LABELS[rt] ?? rt}
                  selected={pendingFilters.roomTypes.includes(rt)}
                  onPress={() => toggleRoomType(rt)}
                />
              ))}
            </View>
          </View>

          <Divider inset={SPACING[4]} style={{ marginVertical: SPACING[2] }} />

          {/* Utilities & Amenities */}
          <View style={filterStyles.section}>
            <SectionHeader title="Utilities & features" />
            {UTILITY_OPTIONS.map((u) => (
              <UtilityRow
                key={u.id}
                id={u.id}
                label={u.label}
                selected={pendingFilters.utilities.includes(u.id)}
                onToggle={toggleUtility}
              />
            ))}
          </View>

          <Divider inset={SPACING[4]} style={{ marginVertical: SPACING[2] }} />

          {/* Quick toggles */}
          <View style={filterStyles.section}>
            <SectionHeader title="Quick filters" />
            <View style={filterStyles.toggleRow}>
              <Text style={filterStyles.toggleLabel}>Available now only</Text>
              <TouchableOpacity
                onPress={() =>
                  setPendingFilter('availableNow', !pendingFilters.availableNow)
                }
                activeOpacity={0.8}
                style={[
                  filterStyles.toggle,
                  pendingFilters.availableNow && filterStyles.toggleActive,
                ]}
              >
                <View
                  style={[
                    filterStyles.toggleThumb,
                    pendingFilters.availableNow && filterStyles.toggleThumbActive,
                  ]}
                />
              </TouchableOpacity>
            </View>
            <View style={filterStyles.toggleRow}>
              <Text style={filterStyles.toggleLabel}>Verified landlords only</Text>
              <TouchableOpacity
                onPress={() =>
                  setPendingFilter('verifiedOnly', !pendingFilters.verifiedOnly)
                }
                activeOpacity={0.8}
                style={[
                  filterStyles.toggle,
                  pendingFilters.verifiedOnly && filterStyles.toggleActive,
                ]}
              >
                <View
                  style={[
                    filterStyles.toggleThumb,
                    pendingFilters.verifiedOnly && filterStyles.toggleThumbActive,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Apply Button */}
        <View style={[filterStyles.applyWrap, ...(SHADOW.lg ? [SHADOW.lg] : [])]}>
          <Button
            label={activeCount > 0 ? `Show listings (${activeCount} filters active)` : 'Show listings'}
            onPress={applyPendingFilters}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
});

// ─── Filter Button (trigger) ──────────────────────────────────────────────────

export const FilterButton = memo(function FilterButton() {
  const { openFilterSheet, activeFilterCount } = useFilterStore();
  const count = activeFilterCount();

  return (
    <TouchableOpacity
      onPress={openFilterSheet}
      activeOpacity={0.85}
      style={[filterStyles.filterBtn, ...(SHADOW.md ? [SHADOW.md] : [])]}
    >
      <Text style={filterStyles.filterBtnIcon}>⚙</Text>
      <Text style={filterStyles.filterBtnLabel}>Filters</Text>
      {count > 0 && (
        <View style={filterStyles.filterBtnBadge}>
          <Text style={filterStyles.filterBtnBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const filterStyles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginTop: SPACING[2],
    marginBottom: SPACING[2],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
  },
  headerTitle: {
    fontSize: FONT.sizes.md,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
  },
  cancelBtn: {
    fontSize: FONT.sizes.base,
    color: COLORS.inkMedium,
    fontWeight: FONT.weights.medium,
  },
  clearBtn: {
    fontSize: FONT.sizes.base,
    color: COLORS.brand,
    fontWeight: FONT.weights.semibold,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: SPACING[6] },
  section: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[4],
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[2],
  },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    gap: SPACING[3],
  },
  utilityRowSelected: {
    backgroundColor: COLORS.brandSurface,
    marginHorizontal: -SPACING[4],
    paddingHorizontal: SPACING[4],
    borderRadius: 0,
  },
  utilityIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  utilityLabel: {
    flex: 1,
    fontSize: FONT.sizes.base,
    color: COLORS.inkMedium,
    fontWeight: FONT.weights.medium,
  },
  utilityLabelSelected: { color: COLORS.brand, fontWeight: FONT.weights.semibold },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.xs,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  checkmark: { color: '#FFF', fontSize: 12, fontWeight: FONT.weights.bold },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  toggleLabel: {
    fontSize: FONT.sizes.base,
    color: COLORS.inkMedium,
    fontWeight: FONT.weights.medium,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleActive: { backgroundColor: COLORS.brand },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2 },
      android: { elevation: 2 },
    }),
  },
  toggleThumbActive: { alignSelf: 'flex-end' },
  applyWrap: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[3],
    paddingBottom: SPACING[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2] + 2,
    borderWidth: 1.5,
    borderColor: COLORS.ink,
  },
  filterBtnIcon: { fontSize: 14 },
  filterBtnLabel: {
    fontSize: FONT.sizes.base,
    fontWeight: FONT.weights.semibold,
    color: COLORS.ink,
  },
  filterBtnBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnBadgeText: {
    color: '#FFF',
    fontSize: FONT.sizes.xs,
    fontWeight: FONT.weights.bold,
  },
});
