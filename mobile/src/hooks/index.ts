import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── useDebounce ──────────────────────────────────────────────────────────────

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

// ─── useStableCallback ────────────────────────────────────────────────────────

export function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef<T>(fn);
  useEffect(() => {
    ref.current = fn;
  }, [fn]);
  return useCallback((...args: any[]) => ref.current(...args), []) as T;
}

// ─── useSafeLayout ───────────────────────────────────────────────────────────

export function useSafeLayout() {
  const insets = useSafeAreaInsets();
  return {
    insets,
    headerPadding: insets.top + (Platform.OS === 'android' ? 8 : 0),
    bottomPadding: insets.bottom || 16,
    tabBarHeight: insets.bottom + (Platform.OS === 'ios' ? 49 : 56),
  };
}

// ─── useContactActions ────────────────────────────────────────────────────────

interface ContactOptions {
  phone: string;
  whatsapp: string;
  listingTitle?: string;
}

export function useContactActions({ phone, whatsapp, listingTitle }: ContactOptions) {
  const call = useCallback(() => {
    const tel = `tel:${phone}`;
    Linking.canOpenURL(tel).then((supported) => {
      if (supported) {
        Linking.openURL(tel);
      } else {
        Alert.alert('Cannot call', 'Phone calls are not supported on this device.');
      }
    });
  }, [phone]);

  const openWhatsApp = useCallback(() => {
    const message = listingTitle
      ? `Hi, I'm interested in your listing: "${listingTitle}". Is it still available?`
      : 'Hi, I found your listing on House-By-Us. Is it still available?';
    const encodedMessage = encodeURIComponent(message);
    const cleanNumber = whatsapp.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'WhatsApp not available',
        'Please install WhatsApp or use the call option.',
      );
    });
  }, [whatsapp, listingTitle]);

  const sms = useCallback(() => {
    const smsUrl = Platform.OS === 'ios'
      ? `sms:${phone}&body=${encodeURIComponent('Hi, I saw your listing on House-By-Us.')}`
      : `sms:${phone}?body=${encodeURIComponent('Hi, I saw your listing on House-By-Us.')}`;
    Linking.openURL(smsUrl).catch(() => {
      Alert.alert('Cannot send SMS', 'SMS is not available on this device.');
    });
  }, [phone]);

  return { call, openWhatsApp, sms };
}

// ─── useCountdown ─────────────────────────────────────────────────────────────

export function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState(() => targetDate.getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = targetDate.getTime() - Date.now();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const seconds = Math.floor((timeLeft / 1000) % 60);
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const expired = timeLeft <= 0;

  return { days, hours, minutes, seconds, expired };
}

// ─── usePrevious ─────────────────────────────────────────────────────────────

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// ─── useImagePreload ─────────────────────────────────────────────────────────

export function useImagePreload(urls: string[]) {
  const [loaded, setLoaded] = useState<Set<string>>(new Set());

  useEffect(() => {
    urls.forEach((url) => {
      if (!loaded.has(url)) {
        // In production with expo-image, use Image.prefetch()
        setLoaded((prev) => new Set([...prev, url]));
      }
    });
  }, [urls]);

  return { isLoaded: (url: string) => loaded.has(url) };
}

// ─── useFormatPrice ───────────────────────────────────────────────────────────

import type { PriceInfo } from '../types';

export function useFormatPrice() {
  const format = useCallback((price: PriceInfo, compact = false): string => {
    const symbols: Record<string, string> = { USD: '$', ZWG: 'ZWG ', ZAR: 'R' };
    const sym = symbols[price.currency] ?? price.currency + ' ';
    const amount = compact && price.amount >= 1000
      ? `${(price.amount / 1000).toFixed(1)}k`
      : price.amount.toLocaleString();
    const period = price.period === 'month' ? '/mo' : price.period === 'week' ? '/wk' : '/night';
    return `${sym}${amount}${period}`;
  }, []);

  return { format };
}

// ─── useAnimatedValue ────────────────────────────────────────────────────────

import { Animated } from 'react-native';

export function useAnimatedValue(initial: number) {
  const value = useRef(new Animated.Value(initial)).current;
  return value;
}

export function usePulseAnimation(active: boolean) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      scale.setValue(1);
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.85, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, scale, opacity]);

  return { scale, opacity };
}
