import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import {
  multiFactor,
  TotpMultiFactorGenerator,
  TotpSecret,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

type EnrollStep = 'loading' | 'scan' | 'verify' | 'done';

export function MFAEnrollScreen({ navigation }: any) {
  const [step, setStep] = useState<EnrollStep>('loading');
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateSecret();
  }, []);

  const generateSecret = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be signed in to enable MFA.');
        navigation.goBack();
        return;
      }

      const session = await multiFactor(user).getSession();
      const secret = await TotpMultiFactorGenerator.generateSecret(session);

      const url = secret.generateQrCodeUrl(
        user.email || 'user',
        'Knead to Know'
      );

      setTotpSecret(secret);
      setQrCodeUrl(url);
      setSecretKey(secret.secretKey);
      setStep('scan');
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Re-authentication Required',
          'For security, please sign out and sign back in, then try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', err.message || 'Failed to generate secret.');
        navigation.goBack();
      }
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    if (!totpSecret) return;

    setVerifying(true);
    setError(null);

    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(
        totpSecret,
        verificationCode
      );

      await multiFactor(auth.currentUser!).enroll(assertion, 'Authenticator App');
      setStep('done');
    } catch (err: any) {
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid code. Please check your authenticator app and try again.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  // Loading state
  if (step === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.amber} />
        <Text style={styles.loadingText}>Generating secret...</Text>
      </View>
    );
  }

  // Success state
  if (step === 'done') {
    return (
      <View style={styles.centered}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>MFA Enabled</Text>
        <Text style={styles.successText}>
          Your account is now protected with two-factor authentication.
          You'll need your authenticator app each time you sign in.
        </Text>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Step 1: Scan QR Code */}
      {step === 'scan' && (
        <>
          <Text style={styles.stepLabel}>STEP 1 OF 2</Text>
          <Text style={styles.heading}>Set Up Authenticator</Text>
          <Text style={styles.description}>
            Open your authenticator app (Google Authenticator, Authy, etc.) and
            add a new account. Enter the setup key below, or tap "Copy Setup
            Link" to paste the full URI into your app.
          </Text>

          <Text style={styles.manualLabel}>ACCOUNT</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Knead to Know ({auth.currentUser?.email})</Text>
          </View>

          <Text style={styles.manualLabel}>SETUP KEY</Text>
          <TouchableOpacity
            style={styles.secretKeyBox}
            onPress={() => {
              Clipboard.setString(secretKey);
              Alert.alert('Copied', 'Setup key copied to clipboard.');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.secretKeyText} selectable>
              {secretKey}
            </Text>
            <Text style={styles.copyHint}>Tap to copy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.copyLinkButton}
            onPress={() => {
              Clipboard.setString(qrCodeUrl);
              Alert.alert('Copied', 'Setup link copied. You can paste this in some authenticator apps.');
            }}
          >
            <Text style={styles.copyLinkText}>Copy Setup Link</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setStep('verify')}
          >
            <Text style={styles.primaryButtonText}>I've Added It</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Step 2: Verify Code */}
      {step === 'verify' && (
        <>
          <Text style={styles.stepLabel}>STEP 2 OF 2</Text>
          <Text style={styles.heading}>Enter Verification Code</Text>
          <Text style={styles.description}>
            Enter the 6-digit code shown in your authenticator app to verify
            the setup.
          </Text>

          <TextInput
            style={styles.codeInput}
            value={verificationCode}
            onChangeText={(text) => {
              setVerificationCode(text.replace(/[^0-9]/g, '').slice(0, 6));
              setError(null);
            }}
            placeholder="000000"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.primaryButton, verifying && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={verifying}
          >
            {verifying ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Verify & Enable MFA</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setStep('scan');
              setVerificationCode('');
              setError(null);
            }}
          >
            <Text style={styles.backButtonText}>Back to QR Code</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    padding: spacing.xxl,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  stepLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.amber,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  heading: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  manualLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  infoBox: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  infoText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  secretKeyBox: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.amber,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  secretKeyText: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 3,
  },
  copyHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  copyLinkButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  copyLinkText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.amber,
  },
  codeInput: {
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontFamily: fonts.mono,
    fontSize: 32,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#E24B4A',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.amber,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: '#fff',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  backButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.amber,
  },
  successIcon: {
    fontSize: 48,
    color: colors.success,
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  successText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  doneButton: {
    backgroundColor: colors.amber,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xxxl,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: '#fff',
  },
});
