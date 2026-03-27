import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { useAuth } from '../hooks/useAuth';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

WebBrowser.maybeCompleteAuthSession();

type AuthMode = 'sign_in' | 'sign_up';

export function SignInScreen() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── Google Auth Setup ───
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  redirectUri: 'com.loafsloaves.kneadtoknow:/oauth2redirect',
});

  // Handle Google response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token, access_token } = googleResponse.params;
      handleGoogleSignIn(id_token, access_token);
    }
  }, [googleResponse]);

  // ─── Email handlers ───

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    if (mode === 'sign_up' && !displayName.trim()) {
      Alert.alert('Missing Name', 'Please enter your name.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'sign_up') {
        await signUpWithEmail(email.trim(), password, displayName.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (error: any) {
      const msg = getAuthErrorMessage(error.code);
      Alert.alert('Authentication Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Google handler ───

  const handleGoogleSignIn = async (idToken: string, accessToken?: string) => {
    setLoading(true);
    try {
      await signInWithGoogle(idToken, accessToken);
    } catch (error: any) {
      Alert.alert('Google Sign-In Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Friendly error messages ───

  function getAuthErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
        return 'No account found with this email. Want to sign up instead?';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email. Try signing in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header / Branding ── */}
        <View style={styles.header}>
          <Text style={styles.brand}>Knead{'\n'}to Know</Text>
          <Text style={styles.tagline}>SOURDOUGH COMPANION</Text>
        </View>

        {/* ── Social Sign-In Buttons ── */}
        <View style={styles.socialSection}>
          {/* Google */}
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => googlePromptAsync()}
            disabled={loading}
          >
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* ── Divider ── */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── Email Form ── */}
        <View style={styles.form}>
          {mode === 'sign_up' && (
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoComplete="name"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'sign_up' ? 'new-password' : 'current-password'}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {mode === 'sign_up' ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Toggle Mode ── */}
        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => {
            setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in');
            setPassword('');
          }}
        >
          <Text style={styles.toggleText}>
            {mode === 'sign_in'
              ? "Don't have an account? "
              : 'Already have an account? '}
          </Text>
          <Text style={styles.toggleLink}>
            {mode === 'sign_in' ? 'Sign Up' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  brand: {
    fontFamily: fonts.headingHeavy,
    fontSize: 42,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 46,
  },
  tagline: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 2.5,
    marginTop: 6,
  },
  socialSection: {
    gap: spacing.sm + 2,
    marginBottom: spacing.xl,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm + 2,
    padding: spacing.md + 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.amber,
  },
  socialText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  form: {
    gap: spacing.sm + 2,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md + 2,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
  },
  submitButton: {
    backgroundColor: colors.amber,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  submitText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  toggleLink: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.amber,
  },
});
