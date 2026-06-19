import React, { useCallback, useRef, useState, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Platform,
  FlatList,
  WebView,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, SPACING, RADIUS, SHADOW, PREMIUM_PLANS } from '../../constants';
import { Button, Badge, Divider } from '../common';
import { useOnboardingStore, useUploadStore } from '../../store';
import type { PaymentMethod, PremiumPlan } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const THUMB_SIZE = (SCREEN_WIDTH - SPACING[4] * 2 - SPACING[3] * 2) / 3;

// ─── Step Indicator ───────────────────────────────────────────────────────────

const StepIndicator = memo(function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <View style={stepStyles.row}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={i}>
            <View style={stepStyles.stepWrap}>
              <View
                style={[
                  stepStyles.circle,
                  done && stepStyles.circleDone,
                  active && stepStyles.circleActive,
                ]}
              >
                <Text
                  style={[
                    stepStyles.circleText,
                    (done || active) && stepStyles.circleTextActive,
                  ]}
                >
                  {done ? '✓' : String(i + 1)}
                </Text>
              </View>
              <Text
                style={[stepStyles.label, active && stepStyles.labelActive]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[stepStyles.connector, done && stepStyles.connectorDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
});

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[4],
  },
  stepWrap: { alignItems: 'center', gap: SPACING[1], flex: 0 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  circleDone: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  circleActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  circleText: {
    fontSize: FONT.sizes.xs,
    fontWeight: FONT.weights.bold,
    color: COLORS.inkFaint,
  },
  circleTextActive: { color: '#FFFFFF' },
  label: {
    fontSize: FONT.sizes.xs,
    color: COLORS.inkFaint,
    fontWeight: FONT.weights.medium,
    maxWidth: 60,
    textAlign: 'center',
  },
  labelActive: { color: COLORS.brand, fontWeight: FONT.weights.semibold },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginTop: 14,
    marginHorizontal: 2,
  },
  connectorDone: { backgroundColor: COLORS.accent },
});

// ─── Step 0: Role Picker ──────────────────────────────────────────────────────

const RolePickerStep = memo(function RolePickerStep() {
  const { role, setRole, nextStep } = useOnboardingStore();

  const roles = [
    {
      id: 'student',
      emoji: '🎓',
      title: 'Student / Renter',
      desc: 'Browse verified rooms and flats near your campus or workplace across Harare.',
      highlights: ['Filter by suburb', 'Compare utilities', 'Message landlords instantly'],
    },
    {
      id: 'landlord',
      emoji: '🏘️',
      title: 'Landlord / Agent',
      desc: 'List your property and reach thousands of students and young professionals.',
      highlights: ['Free listing', 'Photo/video uploads', 'Premium placement options'],
    },
  ];

  return (
    <ScrollView
      contentContainerStyle={roleStyles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={roleStyles.heading}>Welcome to{'\n'}House-By-Us</Text>
      <Text style={roleStyles.subheading}>
        Zimbabwe's first student-first rental platform. How will you use it?
      </Text>

      {roles.map((r) => (
        <TouchableOpacity
          key={r.id}
          activeOpacity={0.85}
          onPress={() => setRole(r.id as 'student' | 'landlord')}
          style={[
            roleStyles.card,
            role === r.id && roleStyles.cardSelected,
            ...(SHADOW.md ? [SHADOW.md] : []),
          ]}
        >
          <View style={roleStyles.cardTop}>
            <Text style={roleStyles.cardEmoji}>{r.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={roleStyles.cardTitle}>{r.title}</Text>
              <Text style={roleStyles.cardDesc}>{r.desc}</Text>
            </View>
            <View
              style={[
                roleStyles.radioOuter,
                role === r.id && roleStyles.radioOuterSelected,
              ]}
            >
              {role === r.id && <View style={roleStyles.radioInner} />}
            </View>
          </View>
          <View style={roleStyles.highlightList}>
            {r.highlights.map((h) => (
              <View key={h} style={roleStyles.highlightRow}>
                <Text style={roleStyles.highlightCheck}>✓</Text>
                <Text style={roleStyles.highlightText}>{h}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      ))}

      <Button
        label={role ? 'Continue →' : 'Pick your role to continue'}
        onPress={nextStep}
        disabled={!role}
        variant="primary"
        size="lg"
        fullWidth
        style={{ marginTop: SPACING[4] }}
      />
    </ScrollView>
  );
});

const roleStyles = StyleSheet.create({
  container: { padding: SPACING[4], paddingBottom: SPACING[10] },
  heading: {
    fontSize: FONT.sizes['4xl'],
    fontWeight: FONT.weights.heavy,
    color: COLORS.ink,
    letterSpacing: -0.8,
    marginBottom: SPACING[2],
    lineHeight: FONT.sizes['4xl'] * 1.1,
  },
  subheading: {
    fontSize: FONT.sizes.base,
    color: COLORS.inkLight,
    lineHeight: FONT.sizes.base * FONT.lineHeights.relaxed,
    marginBottom: SPACING[6],
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING[4],
    marginBottom: SPACING[3],
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: SPACING[3],
  },
  cardSelected: {
    borderColor: COLORS.brand,
    backgroundColor: COLORS.brandSurface,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING[3],
  },
  cardEmoji: { fontSize: 36 },
  cardTitle: {
    fontSize: FONT.sizes.md,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: FONT.sizes.sm,
    color: COLORS.inkLight,
    lineHeight: FONT.sizes.sm * FONT.lineHeights.relaxed,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: COLORS.brand },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.brand,
  },
  highlightList: {
    gap: SPACING[1] + 2,
    paddingLeft: SPACING[1],
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  highlightCheck: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: FONT.weights.bold,
  },
  highlightText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.inkMedium,
  },
});

// ─── Step 1: Photo Upload (Landlord) ─────────────────────────────────────────

const PhotoUploadStep = memo(function PhotoUploadStep() {
  const { nextStep, prevStep } = useOnboardingStore();
  const { assets, addAsset, removeAsset, updateAssetProgress, reorderAssets } = useUploadStore();

  const requestPermission = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please allow access to your photo library in Settings to upload photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  }, []);

  const pickImages = useCallback(async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.85,
      orderedSelection: true,
      exif: false,
    });

    if (result.canceled) return;

    result.assets.forEach((asset) => {
      addAsset({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize ?? undefined,
        mimeType: asset.mimeType ?? undefined,
        s3Key: undefined,
      });
    });
  }, [addAsset, requestPermission]);

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera permission needed', 'Please allow camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      exif: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    addAsset({
      uri: asset.uri,
      type: 'image',
      width: asset.width,
      height: asset.height,
      mimeType: asset.mimeType ?? undefined,
    });
  }, [addAsset]);

  // Simulate chunked S3 upload
  const simulateUpload = useCallback(
    async (uri: string) => {
      updateAssetProgress(uri, 0, 'uploading');
      const CHUNKS = 5;
      for (let i = 1; i <= CHUNKS; i++) {
        await new Promise((r) => setTimeout(r, 300));
        updateAssetProgress(uri, (i / CHUNKS) * 100, i === CHUNKS ? 'complete' : 'uploading');
      }
    },
    [updateAssetProgress]
  );

  const uploadAll = useCallback(async () => {
    const pending = assets.filter((a) => a.uploadStatus === 'idle');
    await Promise.all(pending.map((a) => simulateUpload(a.uri)));
  }, [assets, simulateUpload]);

  const idleCount = assets.filter((a) => a.uploadStatus === 'idle').length;
  const doneCount = assets.filter((a) => a.uploadStatus === 'complete').length;

  return (
    <ScrollView
      contentContainerStyle={uploadStyles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={uploadStyles.heading}>Add photos & videos</Text>
      <Text style={uploadStyles.subheading}>
        Listings with 5+ photos get 3× more enquiries. Add your best shots first — that's your cover image.
      </Text>

      {/* Tips */}
      {assets.length === 0 && (
        <View style={uploadStyles.tipsCard}>
          {[
            '📸 Shoot in natural daylight',
            '🛏  Include bedroom, bathroom, kitchen',
            '🌿 Show outdoor areas & security features',
            '☀️ Solar/borehole panels impress students',
          ].map((tip) => (
            <Text key={tip} style={uploadStyles.tip}>{tip}</Text>
          ))}
        </View>
      )}

      {/* Asset Grid */}
      {assets.length > 0 && (
        <View style={uploadStyles.grid}>
          {assets.map((asset, idx) => (
            <View key={asset.uri} style={uploadStyles.thumb}>
              <Image
                source={{ uri: asset.uri }}
                style={uploadStyles.thumbImage}
                contentFit="cover"
                cachePolicy="memory"
              />
              {/* Cover label */}
              {idx === 0 && (
                <View style={uploadStyles.coverLabel}>
                  <Text style={uploadStyles.coverLabelText}>Cover</Text>
                </View>
              )}
              {/* Progress overlay */}
              {asset.uploadStatus === 'uploading' && (
                <View style={uploadStyles.progressOverlay}>
                  <Text style={uploadStyles.progressText}>
                    {Math.round(asset.uploadProgress)}%
                  </Text>
                </View>
              )}
              {/* Done checkmark */}
              {asset.uploadStatus === 'complete' && (
                <View style={uploadStyles.doneOverlay}>
                  <Text style={uploadStyles.doneIcon}>✓</Text>
                </View>
              )}
              {/* Remove button */}
              <TouchableOpacity
                style={uploadStyles.removeBtn}
                onPress={() => removeAsset(asset.uri)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={uploadStyles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Add more */}
          <TouchableOpacity
            style={uploadStyles.addMoreBtn}
            onPress={pickImages}
            activeOpacity={0.8}
          >
            <Text style={uploadStyles.addMoreIcon}>+</Text>
            <Text style={uploadStyles.addMoreText}>Add more</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pick / Camera buttons */}
      {assets.length === 0 && (
        <View style={uploadStyles.pickBtns}>
          <Button
            label="📷  Take a photo"
            onPress={takePhoto}
            variant="secondary"
            size="lg"
            fullWidth
            style={{ marginBottom: SPACING[3] }}
          />
          <Button
            label="🖼  Choose from library"
            onPress={pickImages}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>
      )}

      {/* Upload all */}
      {idleCount > 0 && (
        <Button
          label={`Upload ${idleCount} file${idleCount !== 1 ? 's' : ''} to cloud`}
          onPress={uploadAll}
          variant="primary"
          size="lg"
          fullWidth
          style={{ marginTop: SPACING[4] }}
        />
      )}

      {/* Upload summary */}
      {assets.length > 0 && (
        <Text style={uploadStyles.uploadSummary}>
          {doneCount}/{assets.length} uploaded
          {idleCount > 0 ? ` · ${idleCount} pending` : ' — all done ✓'}
        </Text>
      )}

      <Divider style={{ marginVertical: SPACING[4] }} />

      <View style={uploadStyles.navRow}>
        <Button label="← Back" onPress={prevStep} variant="ghost" size="md" />
        <Button
          label={assets.length > 0 ? 'Continue →' : 'Skip for now →'}
          onPress={nextStep}
          variant="primary"
          size="md"
        />
      </View>
    </ScrollView>
  );
});

const uploadStyles = StyleSheet.create({
  container: { padding: SPACING[4], paddingBottom: SPACING[10] },
  heading: {
    fontSize: FONT.sizes['3xl'],
    fontWeight: FONT.weights.heavy,
    color: COLORS.ink,
    letterSpacing: -0.5,
    marginBottom: SPACING[2],
  },
  subheading: {
    fontSize: FONT.sizes.base,
    color: COLORS.inkLight,
    lineHeight: FONT.sizes.base * FONT.lineHeights.relaxed,
    marginBottom: SPACING[5],
  },
  tipsCard: {
    backgroundColor: COLORS.infoSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING[4],
    gap: SPACING[2],
    marginBottom: SPACING[5],
    borderWidth: 1,
    borderColor: COLORS.info + '33',
  },
  tip: {
    fontSize: FONT.sizes.sm,
    color: COLORS.info,
    fontWeight: FONT.weights.medium,
    lineHeight: FONT.sizes.sm * 1.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[3],
    marginBottom: SPACING[4],
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.border,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  coverLabel: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  coverLabelText: {
    color: '#FFF',
    fontSize: FONT.sizes.xs,
    fontWeight: FONT.weights.bold,
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: '#FFF',
    fontSize: FONT.sizes.base,
    fontWeight: FONT.weights.bold,
  },
  doneOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneIcon: { color: '#FFF', fontSize: 12, fontWeight: FONT.weights.bold },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { color: '#FFF', fontSize: 10, fontWeight: FONT.weights.bold },
  addMoreBtn: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[1],
    backgroundColor: COLORS.surfaceWarm,
  },
  addMoreIcon: { fontSize: 28, color: COLORS.inkFaint },
  addMoreText: { fontSize: FONT.sizes.xs, color: COLORS.inkFaint, fontWeight: FONT.weights.medium },
  pickBtns: { gap: SPACING[2] },
  uploadSummary: {
    textAlign: 'center',
    fontSize: FONT.sizes.sm,
    color: COLORS.inkLight,
    marginTop: SPACING[3],
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

// ─── Step 2: Premium Upgrades ─────────────────────────────────────────────────

const PlanCard = memo(function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: PremiumPlan;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onSelect(plan.id)}
      activeOpacity={0.85}
      style={[
        premiumStyles.planCard,
        selected && premiumStyles.planCardSelected,
        plan.popular && premiumStyles.planCardPopular,
        ...(SHADOW.sm ? [SHADOW.sm] : []),
      ]}
    >
      {plan.popular && (
        <View style={premiumStyles.popularBadge}>
          <Text style={premiumStyles.popularBadgeText}>Most popular</Text>
        </View>
      )}
      <View style={premiumStyles.planTop}>
        <View style={{ flex: 1 }}>
          <Text style={premiumStyles.planName}>{plan.name}</Text>
          <Text style={premiumStyles.planDesc}>{plan.description}</Text>
          <Text style={premiumStyles.planDuration}>{plan.durationDays} days</Text>
        </View>
        <View style={premiumStyles.planPriceCol}>
          <Text style={premiumStyles.planPriceUSD}>${plan.priceUSD}</Text>
          <Text style={premiumStyles.planPriceZWG}>ZWG {plan.priceZWG}</Text>
        </View>
        <View style={[premiumStyles.radio, selected && premiumStyles.radioSelected]}>
          {selected && <View style={premiumStyles.radioInner} />}
        </View>
      </View>
      <View style={premiumStyles.planFeatures}>
        {plan.features.map((f) => (
          <View key={f} style={premiumStyles.featureRow}>
            <Text style={premiumStyles.featureCheck}>✓</Text>
            <Text style={premiumStyles.featureText}>{f}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
});

const PaymentMethodRow = memo(function PaymentMethodRow({
  method,
  selected,
  onSelect,
}: {
  method: { id: PaymentMethod; label: string; logo: string; desc: string };
  selected: boolean;
  onSelect: (id: PaymentMethod) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onSelect(method.id)}
      activeOpacity={0.8}
      style={[premiumStyles.payRow, selected && premiumStyles.payRowSelected]}
    >
      <Text style={premiumStyles.payLogo}>{method.logo}</Text>
      <View style={{ flex: 1 }}>
        <Text style={premiumStyles.payLabel}>{method.label}</Text>
        <Text style={premiumStyles.payDesc}>{method.desc}</Text>
      </View>
      <View style={[premiumStyles.radio, selected && premiumStyles.radioSelected]}>
        {selected && <View style={premiumStyles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
});

const PAYMENT_METHODS: { id: PaymentMethod; label: string; logo: string; desc: string }[] = [
  { id: 'ecocash', label: 'EcoCash', logo: '📱', desc: 'Pay with your Econet mobile wallet' },
  { id: 'paynow', label: 'Paynow', logo: '🇿🇼', desc: 'Zimbabwe online payment gateway' },
  { id: 'innbucks', label: 'InnBucks', logo: '💛', desc: 'Pay with InnBucks wallet or USSD' },
  { id: 'stripe', label: 'Card (Visa / Mastercard)', logo: '💳', desc: 'International card via Stripe' },
];

const PAYMENT_URLS: Record<PaymentMethod, string> = {
  ecocash: 'https://ecocash.co.zw/pay',
  paynow: 'https://www.paynow.co.zw',
  innbucks: 'https://innbucks.co.zw',
  stripe: 'https://checkout.stripe.com',
};

const PremiumUpgradeStep = memo(function PremiumUpgradeStep() {
  const { prevStep, completeOnboarding } = useOnboardingStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');

  const selectedPlan = PREMIUM_PLANS.find((p) => p.id === selectedPlanId);

  const handlePay = useCallback(() => {
    if (!selectedPlanId || !selectedMethod) return;
    const url = PAYMENT_URLS[selectedMethod];
    setWebViewUrl(url);
    setShowWebView(true);
  }, [selectedPlanId, selectedMethod]);

  if (showWebView) {
    return (
      <View style={{ flex: 1 }}>
        <View style={premiumStyles.webViewHeader}>
          <TouchableOpacity
            onPress={() => setShowWebView(false)}
            style={premiumStyles.webViewBack}
            activeOpacity={0.8}
          >
            <Text style={premiumStyles.webViewBackText}>← Back</Text>
          </TouchableOpacity>
          <Text style={premiumStyles.webViewTitle}>
            {PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.label}
          </Text>
          <View style={{ width: 60 }} />
        </View>
        <WebView
          source={{ uri: webViewUrl }}
          onNavigationStateChange={(navState) => {
            if (navState.url.includes('success') || navState.url.includes('complete')) {
              setShowWebView(false);
              Alert.alert(
                'Payment successful!',
                `Your ${selectedPlan?.name} plan is now active. Your listing will be promoted within minutes.`,
                [{ text: 'Continue', onPress: completeOnboarding }]
              );
            }
          }}
          startInLoadingState
          style={{ flex: 1 }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={premiumStyles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={premiumStyles.heading}>Boost your listing</Text>
      <Text style={premiumStyles.subheading}>
        Standard listings are free. Upgrade to get seen first by students searching in your area.
      </Text>

      {/* Plans */}
      {PREMIUM_PLANS.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          selected={selectedPlanId === plan.id}
          onSelect={setSelectedPlanId}
        />
      ))}

      {/* Payment methods (conditional) */}
      {selectedPlanId && (
        <>
          <Divider style={{ marginVertical: SPACING[5] }} />
          <Text style={premiumStyles.payHeading}>Pay with</Text>
          <Text style={premiumStyles.paySubheading}>
            All local Zimbabwe payment methods accepted
          </Text>
          {PAYMENT_METHODS.map((m) => (
            <PaymentMethodRow
              key={m.id}
              method={m}
              selected={selectedMethod === m.id}
              onSelect={setSelectedMethod}
            />
          ))}

          {/* Order summary */}
          {selectedMethod && selectedPlan && (
            <View style={premiumStyles.summaryCard}>
              <Text style={premiumStyles.summaryTitle}>Order summary</Text>
              <View style={premiumStyles.summaryRow}>
                <Text style={premiumStyles.summaryLabel}>{selectedPlan.name}</Text>
                <Text style={premiumStyles.summaryValue}>${selectedPlan.priceUSD} USD</Text>
              </View>
              <View style={premiumStyles.summaryRow}>
                <Text style={premiumStyles.summaryLabel}>ZWG equivalent</Text>
                <Text style={premiumStyles.summaryValueSecondary}>
                  ZWG {selectedPlan.priceZWG}
                </Text>
              </View>
              <View style={premiumStyles.summaryRow}>
                <Text style={premiumStyles.summaryLabel}>Duration</Text>
                <Text style={premiumStyles.summaryValue}>{selectedPlan.durationDays} days</Text>
              </View>
              <Divider style={{ marginVertical: SPACING[3] }} />
              <Button
                label={`Pay ${selectedMethod === 'stripe' ? `$${selectedPlan.priceUSD}` : `ZWG ${selectedPlan.priceZWG}`} with ${PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.label}`}
                onPress={handlePay}
                variant="primary"
                size="lg"
                fullWidth
              />
            </View>
          )}
        </>
      )}

      <Divider style={{ marginVertical: SPACING[4] }} />

      <View style={premiumStyles.navRow}>
        <Button label="← Back" onPress={prevStep} variant="ghost" size="md" />
        <Button
          label="Skip, list for free →"
          onPress={completeOnboarding}
          variant="ghost"
          size="md"
          labelStyle={{ color: COLORS.inkLight }}
        />
      </View>
    </ScrollView>
  );
});

const premiumStyles = StyleSheet.create({
  container: { padding: SPACING[4], paddingBottom: SPACING[10] },
  heading: {
    fontSize: FONT.sizes['3xl'],
    fontWeight: FONT.weights.heavy,
    color: COLORS.ink,
    letterSpacing: -0.5,
    marginBottom: SPACING[2],
  },
  subheading: {
    fontSize: FONT.sizes.base,
    color: COLORS.inkLight,
    lineHeight: FONT.sizes.base * FONT.lineHeights.relaxed,
    marginBottom: SPACING[5],
  },
  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING[4],
    marginBottom: SPACING[3],
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: SPACING[3],
    position: 'relative',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: COLORS.brand,
    backgroundColor: COLORS.brandSurface,
  },
  planCardPopular: {
    borderColor: COLORS.gold,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    borderBottomLeftRadius: RADIUS.md,
  },
  popularBadgeText: {
    color: '#FFF',
    fontSize: FONT.sizes.xs,
    fontWeight: FONT.weights.bold,
    letterSpacing: 0.3,
  },
  planTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING[3],
  },
  planName: {
    fontSize: FONT.sizes.md,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
    marginBottom: 3,
  },
  planDesc: {
    fontSize: FONT.sizes.sm,
    color: COLORS.inkLight,
    lineHeight: FONT.sizes.sm * 1.45,
    marginBottom: 4,
  },
  planDuration: {
    fontSize: FONT.sizes.xs,
    color: COLORS.inkFaint,
    fontWeight: FONT.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  planPriceCol: { alignItems: 'flex-end', gap: 2, minWidth: 70 },
  planPriceUSD: {
    fontSize: FONT.sizes.xl,
    fontWeight: FONT.weights.heavy,
    color: COLORS.ink,
    letterSpacing: -0.3,
  },
  planPriceZWG: {
    fontSize: FONT.sizes.xs,
    color: COLORS.inkLight,
    fontWeight: FONT.weights.medium,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioSelected: { borderColor: COLORS.brand },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.brand,
  },
  planFeatures: { gap: SPACING[1] + 2 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  featureCheck: { color: COLORS.accent, fontSize: 13, fontWeight: FONT.weights.bold },
  featureText: { fontSize: FONT.sizes.sm, color: COLORS.inkMedium },
  payHeading: {
    fontSize: FONT.sizes.lg,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
    marginBottom: SPACING[1],
  },
  paySubheading: {
    fontSize: FONT.sizes.sm,
    color: COLORS.inkLight,
    marginBottom: SPACING[3],
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING[2],
  },
  payRowSelected: {
    borderColor: COLORS.brand,
    backgroundColor: COLORS.brandSurface,
  },
  payLogo: { fontSize: 28 },
  payLabel: {
    fontSize: FONT.sizes.base,
    fontWeight: FONT.weights.semibold,
    color: COLORS.ink,
    marginBottom: 2,
  },
  payDesc: { fontSize: FONT.sizes.xs, color: COLORS.inkLight },
  summaryCard: {
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.xl,
    padding: SPACING[4],
    marginTop: SPACING[4],
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryTitle: {
    fontSize: FONT.sizes.base,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
    marginBottom: SPACING[3],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  summaryLabel: { fontSize: FONT.sizes.sm, color: COLORS.inkLight },
  summaryValue: {
    fontSize: FONT.sizes.base,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
  },
  summaryValueSecondary: {
    fontSize: FONT.sizes.sm,
    fontWeight: FONT.weights.medium,
    color: COLORS.inkMedium,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  webViewBack: { width: 60 },
  webViewBackText: {
    fontSize: FONT.sizes.base,
    color: COLORS.brand,
    fontWeight: FONT.weights.semibold,
  },
  webViewTitle: {
    fontSize: FONT.sizes.base,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
  },
});

// ─── Student: Quick Onboarding ────────────────────────────────────────────────

const StudentStep = memo(function StudentStep() {
  const { nextStep, prevStep, completeOnboarding } = useOnboardingStore();

  return (
    <ScrollView
      contentContainerStyle={studentStyles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={studentStyles.heading}>Find your place{'\n'}in Harare 🏠</Text>
      <Text style={studentStyles.subheading}>
        You're one step away from browsing hundreds of verified rooms and flats near your campus.
      </Text>

      {[
        { emoji: '🗺️', title: 'Map-first search', desc: 'Explore listings pinned on a live Harare map. Zoom to your university or workplace.' },
        { emoji: '💧', title: 'Utility filters', desc: 'Filter by solar backup, borehole water, Wi-Fi — the stuff that actually matters in Zim.' },
        { emoji: '💬', title: 'Direct contact', desc: 'WhatsApp or call landlords instantly. No middleman, no delays.' },
        { emoji: '🔒', title: 'Verified landlords', desc: 'Look for the blue tick. Verified landlords have been vetted by our team.' },
      ].map((item) => (
        <View key={item.title} style={studentStyles.featureCard}>
          <Text style={studentStyles.featureEmoji}>{item.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={studentStyles.featureTitle}>{item.title}</Text>
            <Text style={studentStyles.featureDesc}>{item.desc}</Text>
          </View>
        </View>
      ))}

      <Button
        label="Start exploring →"
        onPress={completeOnboarding}
        variant="primary"
        size="lg"
        fullWidth
        style={{ marginTop: SPACING[4] }}
      />
      <Button
        label="← Back"
        onPress={prevStep}
        variant="ghost"
        size="md"
        style={{ marginTop: SPACING[2], alignSelf: 'center' }}
      />
    </ScrollView>
  );
});

const studentStyles = StyleSheet.create({
  container: { padding: SPACING[4], paddingBottom: SPACING[10] },
  heading: {
    fontSize: FONT.sizes['3xl'],
    fontWeight: FONT.weights.heavy,
    color: COLORS.ink,
    letterSpacing: -0.5,
    marginBottom: SPACING[2],
    lineHeight: FONT.sizes['3xl'] * 1.15,
  },
  subheading: {
    fontSize: FONT.sizes.base,
    color: COLORS.inkLight,
    lineHeight: FONT.sizes.base * FONT.lineHeights.relaxed,
    marginBottom: SPACING[5],
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING[4],
    paddingVertical: SPACING[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  featureEmoji: { fontSize: 28, marginTop: 2 },
  featureTitle: {
    fontSize: FONT.sizes.base,
    fontWeight: FONT.weights.bold,
    color: COLORS.ink,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: FONT.sizes.sm,
    color: COLORS.inkLight,
    lineHeight: FONT.sizes.sm * FONT.lineHeights.relaxed,
  },
});

// ─── Main Onboarding Screen ───────────────────────────────────────────────────

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { role, currentStep } = useOnboardingStore();

  const landlordSteps = ['Your role', 'Add photos', 'Go premium'];
  const studentSteps = ['Your role', 'Get started'];

  const steps = role === 'landlord' ? landlordSteps : studentSteps;

  const renderStep = () => {
    if (currentStep === 0) return <RolePickerStep />;
    if (role === 'student') return <StudentStep />;
    if (role === 'landlord') {
      if (currentStep === 1) return <PhotoUploadStep />;
      if (currentStep === 2) return <PremiumUpgradeStep />;
    }
    return <RolePickerStep />;
  };

  return (
    <View style={[onboardStyles.root, { paddingTop: insets.top }]}>
      {/* Logo */}
      <View style={onboardStyles.logoRow}>
        <Text style={onboardStyles.logo}>House-By-Us</Text>
        {role && (
          <Badge
            label={role === 'student' ? '🎓 Student' : '🏘️ Landlord'}
            variant="brand"
            size="sm"
          />
        )}
      </View>

      {/* Step indicator (after role is picked) */}
      {currentStep > 0 && role && (
        <StepIndicator steps={steps} current={currentStep} />
      )}

      {/* Step content */}
      <View style={{ flex: 1 }}>{renderStep()}</View>
    </View>
  );
}

const onboardStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[4],
    paddingBottom: SPACING[2],
  },
  logo: {
    fontSize: FONT.sizes.xl,
    fontWeight: FONT.weights.heavy,
    color: COLORS.brand,
    letterSpacing: -0.4,
  },
});
