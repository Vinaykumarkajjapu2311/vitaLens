import { useAuth, useOAuth, useSignUp } from '@clerk/expo';
import { AntDesign } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Link, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useWarmUpBrowser } from '../hooks/useWarmUpBrowser';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { useTheme } from '../../context/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  useWarmUpBrowser();
  const { signUp, errors, fetchStatus } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { isSignedIn, signOut } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');

  const handleGoogleOAuth = React.useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/', { scheme: 'vitalens' }),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error('OAuth error', err);
    }
  }, [startOAuthFlow]);

  const handleSubmit = async () => {
    if (!signUp) return;

    const { error } = await signUp.password({ emailAddress, password });
    if (error) { console.error(JSON.stringify(error, null, 2)); return; }

    if (!error) await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    if (!signUp) return;

    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === 'complete') {
      try {
        await signOut();
      } catch (err) {
        console.error('Error signing out after sign up:', err);
      }
      router.replace('/(auth)/sign-in');
    } else {
      console.error('Sign-up attempt not complete:', signUp);
    }
  };

  if (signUp?.status === 'complete' || isSignedIn) {
    return null;
  }

  if (
    signUp?.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0
  ) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          <Card elevated>
            <Text variant="h3" align="center" style={{ marginBottom: 24 }}>VERIFY YOUR EMAIL</Text>

            <Input
              label="VERIFICATION CODE"
              value={code}
              placeholder="Enter your verification code"
              onChangeText={setCode}
              keyboardType="numeric"
              error={errors?.fields?.code?.message as string}
            />

            <Button
              title="VERIFY"
              onPress={handleVerify}
              disabled={fetchStatus === 'fetching'}
              loading={fetchStatus === 'fetching'}
              style={{ marginTop: 12 }}
            />

            <Button
              title="I need a new code"
              variant="ghost"
              onPress={() => signUp.verifications.sendEmailCode()}
              style={{ marginTop: 12 }}
            />
          </Card>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary, shadowColor: isDark ? 'transparent' : colors.primary }]}>
            <Text style={styles.logoText}>V</Text>
          </View>
          <Text variant="h1" align="center" style={{ marginBottom: 8 }}>Join VitaLens</Text>
          <Text variant="body" color={colors.textSecondary} align="center">Create an account to start your journey</Text>
        </View>

        {/* Sign Up Card */}
        <Card elevated style={{ marginTop: 'auto', marginBottom: 'auto', paddingBottom: 32 }}>
          <Text variant="h4" align="center" style={{ marginBottom: 24, letterSpacing: 0.5 }}>CREATE ACCOUNT</Text>

          <Input
            label="EMAIL ADDRESS"
            autoCapitalize="none"
            value={emailAddress}
            placeholder="name@example.com"
            onChangeText={setEmailAddress}
            keyboardType="email-address"
            error={errors?.fields?.emailAddress?.message as string}
          />

          <Input
            label="PASSWORD"
            value={password}
            placeholder="••••••••"
            secureTextEntry={true}
            onChangeText={setPassword}
            error={errors?.fields?.password?.message as string}
          />

          <Button
            title="SIGN UP"
            onPress={handleSubmit}
            disabled={!emailAddress || !password || fetchStatus === 'fetching'}
            loading={fetchStatus === 'fetching'}
            style={{ marginTop: 6 }}
          />

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text variant="caption" weight="bold" color={colors.textSecondary} style={{ marginHorizontal: 12 }}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Social Auth (Google OAuth) */}
          <Button
            title="Continue with Google"
            variant="outline"
            icon={<AntDesign name="google" size={18} color="#EA4335" />}
            onPress={handleGoogleOAuth}
            style={{ borderColor: colors.border }}
          />

          {/* Log In Link */}
          <Link href="/(auth)/sign-in" asChild>
            <Pressable style={styles.loginLinkContainer}>
              <Text variant="caption" color={colors.primary} weight="bold" style={{ letterSpacing: 0.5 }}>Already have an account? Sign in</Text>
            </Pressable>
          </Link>

          <View nativeID="clerk-captcha" />
        </Card>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center', justifyContent: 'center' },
  headerContainer: { alignItems: 'center', marginBottom: 40 },
  logoContainer: { width: 64, height: 64, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 26 },
  dividerLine: { flex: 1, height: 1 },
  loginLinkContainer: { marginTop: 28, alignItems: 'center', paddingVertical: 8 },
});