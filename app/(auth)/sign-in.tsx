import { useOAuth, useSignIn } from '@clerk/expo';
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
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { useTheme } from '../../context/ThemeContext';
import { useWarmUpBrowser } from '../hooks/useWarmUpBrowser';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  useWarmUpBrowser();
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();
  const { t, i18n } = useTranslation();
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
    if (!signIn) return;

    const { error } = await signIn.password({ emailAddress, password });
    if (error) { console.error(JSON.stringify(error, null, 2)); return; }

    if (signIn.status === 'complete') {
      await signIn.finalize();
    } else if (signIn.status === 'needs_second_factor') {
      // MFA handling logic
    } else if (signIn.status === 'needs_client_trust') {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === 'email_code',
      );
      if (emailCodeFactor) await signIn.mfa.sendEmailCode();
    } else {
      console.error('Sign-in attempt not complete:', signIn);
    }
  };

  const handleVerify = async () => {
    if (!signIn) return;
    await signIn.mfa.verifyEmailCode({ code });

    if (signIn.status === 'complete') {
      await signIn.finalize();
    } else {
      console.error('Sign-in attempt not complete:', signIn);
    }
  };

  if (signIn?.status === 'needs_client_trust') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          <Card elevated>
            <Text variant="h3" align="center" style={{ marginBottom: 24 }}>VERIFY YOUR ACCOUNT</Text>

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
              onPress={() => signIn.mfa.sendEmailCode()}
              style={{ marginTop: 12 }}
            />

            <Button
              title="Start over"
              variant="ghost"
              onPress={() => signIn.reset()}
              style={{ marginTop: 8 }}
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
          <Text variant="h1" align="center" style={{ marginBottom: 8 }}>{t('welcome')}</Text>
          <Text variant="body" color={colors.textSecondary} align="center">{t('subtitle')}</Text>
        </View>

        {/* Login Card */}
        <Card elevated style={{ paddingBottom: 32 }}>
          <Text variant="h4" align="center" style={{ marginBottom: 24, letterSpacing: 0.5 }}>{t('welcome_back')}</Text>

          <Input
            label={t('email')}
            autoCapitalize="none"
            value={emailAddress}
            placeholder="name@example.com"
            onChangeText={setEmailAddress}
            keyboardType="email-address"
            error={errors?.fields?.identifier?.message as string}
          />

          <Input
            label={t('password')}
            value={password}
            placeholder="••••••••"
            secureTextEntry={true}
            onChangeText={setPassword}
            error={errors?.fields?.password?.message as string}
          />

          <Button
            title={t('sign_in')}
            onPress={handleSubmit}
            disabled={!emailAddress || !password || fetchStatus === 'fetching'}
            loading={fetchStatus === 'fetching'}
            style={{ marginTop: 6 }}
          />

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text variant="caption" weight="bold" color={colors.textSecondary} style={{ marginHorizontal: 12 }}>{t('or')}</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Social Auth (Google OAuth) */}
          <Button
            title={t('google')}
            variant="outline"
            icon={<AntDesign name="google" size={18} color="red" />}
            onPress={handleGoogleOAuth}
            style={{ borderColor: colors.border }}
          />

          {/* Sign Up Link */}
          <Link href="/(auth)/sign-up" asChild>
            <Pressable style={styles.signUpLinkContainer}>
              <Text variant="caption" color={colors.primary} weight="bold" style={{ letterSpacing: 0.5 }}>{t('signup_link')}</Text>
            </Pressable>
          </Link>

          {/* Bottom Language Pills */}
          <View style={styles.languageContainer}>
            {['EN', 'తెలుగు', 'HI', 'ES', 'FR', 'DE'].map((lang) => {
              const isActive = i18n.language === lang;
              return (
                <Pressable
                  key={lang}
                  style={[
                    styles.languagePill,
                    { backgroundColor: isActive ? colors.primary : (isDark ? colors.secondary : '#f1f5f9') },
                    isActive && { shadowColor: isDark ? 'transparent' : colors.primary, elevation: 4 }
                  ]}
                  onPress={() => i18n.changeLanguage(lang)}
                >
                  <Text
                    variant="caption"
                    color={isActive ? '#fff' : colors.textSecondary}
                    weight="bold"
                    style={lang === 'తెలుగు' ? { fontSize: 9 } : { fontSize: 11 }}
                  >
                    {lang}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
  signUpLinkContainer: { marginTop: 28, alignItems: 'center', paddingVertical: 8 },
  languageContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32, gap: 10, flexWrap: 'wrap' },
  languagePill: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
});