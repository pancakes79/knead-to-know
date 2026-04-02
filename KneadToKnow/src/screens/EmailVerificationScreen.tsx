import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { auth as firebaseAuth } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

export function EmailVerificationScreen() {
  const { user, signOut, resendVerificationEmail, refreshUser } = useAuth();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleResend = useCallback(async () => {
    setSending(true);
    try {
      await resendVerificationEmail();
      Alert.alert('Email Sent', 'A new verification email has been sent. Check your inbox.');
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        Alert.alert('Too Many Requests', 'Please wait a moment before requesting another email.');
      } else {
        Alert.alert('Error', err.message || 'Failed to send verification email.');
      }
    } finally {
      setSending(false);
    }
  }, [resendVerificationEmail]);

  const handleCheckVerification = useCallback(async () => {
    setChecking(true);
    try {
      await refreshUser();
      // If still not verified after refresh, tell the user
      if (!firebaseAuth.currentUser?.emailVerified) {
        Alert.alert(
          'Not Yet Verified',
          'Your email hasn\'t been verified yet. Please check your inbox and click the verification link.'
        );
      }
    } catch (err: any) {
      Alert.alert('Error', 'Could not check verification status. Please try again.');
    } finally {
      setChecking(false);
    }
  }, [refreshUser]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📧</Text>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.description}>
        We sent a verification link to:
      </Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.description}>
        Please check your inbox and click the link to verify your email address.
        You'll need a verified email to use the app.
      </Text>

      <TouchableOpacity
        style={[styles.primaryButton, checking && styles.buttonDisabled]}
        onPress={handleCheckVerification}
        disabled={checking}
      >
        {checking ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>I've Verified My Email</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, sending && styles.buttonDisabled]}
        onPress={handleResend}
        disabled={sending}
      >
        {sending ? (
          <ActivityIndicator color={colors.amber} size="small" />
        ) : (
          <Text style={styles.secondaryButtonText}>Resend Verification Email</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  email: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.amber,
    marginBottom: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.amber,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: '#fff',
  },
  secondaryButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.amber,
  },
  secondaryButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.amber,
  },
  signOutButton: {
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  signOutText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textMuted,
  },
});
