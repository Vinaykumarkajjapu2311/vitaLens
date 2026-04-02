import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/expo';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { tokenCache } from '../cache';
import '../i18n';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env');
}

const InitialLayout = () => {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        if (!userId) return;
        const status = await SecureStore.getItemAsync(`hasCompletedOnboarding_${userId}`);
        setIsOnboarded(status === 'true');
      } catch (err) {
        setIsOnboarded(false);
      }
    };
    if (isSignedIn) {
      checkOnboarding();
    } else {
      setIsOnboarded(null);
    }
  }, [isSignedIn, userId, segments]);

  useEffect(() => {
    if (!isLoaded) return;
    
    // If signed in, we must wait for isOnboarded to resolve before routing
    if (isSignedIn && isOnboarded === null) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (isSignedIn) {
      if (!isOnboarded && !inOnboarding) {
        router.replace('/onboarding');
      } else if (isOnboarded && (inAuthGroup || inOnboarding)) {
        router.replace('/');
      }
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    }
  }, [isSignedIn, isLoaded, isOnboarded, segments]);

  if (!isLoaded || (isSignedIn && isOnboarded === null)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ 
      contentStyle: { backgroundColor: colors.background },
      headerShown: false, 
    }}>
      <Stack.Screen name="(home)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
        <ClerkLoaded>
          <InitialLayout />
        </ClerkLoaded>
      </ClerkProvider>
    </ThemeProvider>
  );
}
