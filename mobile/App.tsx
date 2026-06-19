import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { COLORS, FONT, SPACING, RADIUS, SHADOW } from './src/constants';
import { useOnboardingStore } from './src/store';
import type { Listing } from './src/types';

// ─── Screens ──────────────────────────────────────────────────────────────────

import ExploreScreen from './src/app/ExploreScreen';
import ListingDetailScreen from './src/app/ListingDetailScreen';
import OnboardingScreen from './src/app/OnboardingScreen';

// ─── QueryClient ──────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// ─── Navigation Types ─────────────────────────────────────────────────────────

type RootStackParamList = {
  Tabs: undefined;
  ListingDetail: { listingId: string };
  Onboarding: undefined;
};

type TabParamList = {
  Explore: undefined;
  Saved: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// ─── Placeholder Screens ──────────────────────────────────────────────────────

function SavedScreen() {
  return (
    <View style={placeholderStyles.root}>
      <Text style={placeholderStyles.emoji}>❤️</Text>
      <Text style={placeholderStyles.title}>Saved listings</Text>
      <Text style={placeholderStyles.desc}>
        Listings you save while browsing appear here for quick access.
      </Text>
    </View>
  );
}

function MessagesScreen() {
  return (
    <View style={placeholderStyles.root}>
      <Text style={placeholderStyles.emoji}>💬</Text>
      <Text style={placeholderStyles.title}>Messages</Text>
      <Text style={placeholderStyles.desc}>
        Your conversations with landlords appear here.
      </Text>
    </View>
  );
}

function ProfileScreen() {
  const { resetOnboarding } = useOnboardingStore();
  return (
    <View style={placeholderStyles.root}>
      <Text style={placeholderStyles.emoji}>👤</Text>
      <Text style={placeholderStyles.title}>Profile</Text>
      <Text style={placeholderStyles.desc}>Manage your account and preferences.</Text>
      <TouchableOpacity
        onPress={resetOnboarding}
        activeOpacity={0.8}
        style={placeholderStyles.devBtn}
      >
        <Text style={placeholderStyles.devBtnText}>↩ Reset onboarding (dev)</Text>
      </TouchableOpacity>
    </View>
  );
}

const placeholderStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING[8],
  },
  emoji: { fontSize: 48, marginBottom: SPACING[4] },
  title: {
    fontSize: FONT.sizes['2xl'],
    fontWeight: FONT.weights.heavy,
    color: COLORS.ink,
    marginBottom: SPACING[2],
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  desc: {
    fontSize: FONT.sizes.base,
    color: COLORS.inkLight,
    textAlign: 'center',
    lineHeight: FONT.sizes.base * FONT.lineHeights.relaxed,
  },
  devBtn: {
    marginTop: SPACING[6],
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceWarm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  devBtnText: {
    fontSize: FONT.sizes.sm,
    color: COLORS.inkLight,
    fontWeight: FONT.weights.medium,
  },
});

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────

const TAB_ICONS: Record<string, { icon: string; label: string }> = {
  Explore: { icon: '🗺️', label: 'Explore' },
  Saved: { icon: '❤️', label: 'Saved' },
  Messages: { icon: '💬', label: 'Messages' },
  Profile: { icon: '👤', label: 'Profile' },
};

function CustomTabBar({
  state,
  descriptors,
  navigation,
}: {
  state: any;
  descriptors: any;
  navigation: any;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        tabStyles.tabBar,
        {
          paddingBottom: insets.bottom || SPACING[3],
          height: 56 + (insets.bottom || SPACING[3]),
        },
        ...(SHADOW.lg ? [SHADOW.lg] : []),
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const { icon, label } = TAB_ICONS[route.name] ?? { icon: '•', label: route.name };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={tabStyles.tabItem}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
          >
            <View style={[tabStyles.tabIconWrap, isFocused && tabStyles.tabIconWrapActive]}>
              <Text style={tabStyles.tabIcon}>{icon}</Text>
            </View>
            <Text
              style={[
                tabStyles.tabLabel,
                isFocused && tabStyles.tabLabelActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    paddingTop: SPACING[2],
    paddingHorizontal: SPACING[2],
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabIconWrap: {
    width: 40,
    height: 32,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: COLORS.brandSurface,
  },
  tabIcon: { fontSize: 18 },
  tabLabel: {
    fontSize: FONT.sizes.xs,
    fontWeight: FONT.weights.medium,
    color: COLORS.inkFaint,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: COLORS.brand,
    fontWeight: FONT.weights.semibold,
  },
});

// ─── Explore Stack ─────────────────────────────────────────────────────────────

const ExploreStack = createNativeStackNavigator<{
  ExploreMap: undefined;
  Detail: { listingId: string };
}>();

function ExploreStackNavigator() {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen name="ExploreMap" component={ExploreMapScreen} />
      <ExploreStack.Screen
        name="Detail"
        component={DetailScreenWrapper}
        options={{
          animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
          gestureEnabled: true,
        }}
      />
    </ExploreStack.Navigator>
  );
}

// Bridge components so we can use hooks inside stack screens
function ExploreMapScreen({ navigation }: { navigation: any }) {
  const handleListingPress = useCallback(
    (listing: Listing) => {
      navigation.navigate('Detail', { listingId: listing.id });
    },
    [navigation]
  );
  return <ExploreScreen onListingPress={handleListingPress} />;
}

function DetailScreenWrapper({ route, navigation }: { route: any; navigation: any }) {
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleMessage = useCallback(
    () => navigation.navigate('Messages' as never),
    [navigation]
  );
  return (
    <ListingDetailScreen
      listingId={route.params.listingId}
      onBack={handleBack}
      onMessage={handleMessage}
    />
  );
}

// ─── Main Tab Navigator ────────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Explore" component={ExploreStackNavigator} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

function AppNavigator() {
  const { hasCompletedOnboarding } = useOnboardingStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasCompletedOnboarding ? (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ animation: 'fade' }}
          />
        ) : (
          <Stack.Screen
            name="Tabs"
            component={MainTabs}
            options={{ animation: 'fade' }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <StatusBar
              barStyle="dark-content"
              backgroundColor={COLORS.canvas}
              translucent={Platform.OS === 'android'}
            />
            <AppNavigator />
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
