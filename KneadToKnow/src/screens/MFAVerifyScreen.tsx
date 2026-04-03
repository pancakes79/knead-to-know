import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  MultiFactorResolver,
  TotpMultiFactorGenerator,
} from 'firebase/auth';
import { colors, fonts, spacing, borderRadius } from '../constants/theme';

interface MFAVerifyScreenProps {
  resolver: MultiFactorResolver;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MFAVerifyScreen({ resolver, onSuccess, onCancel }: MFAVerifyScreenProps) {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      // Find the TOTP hint
      const totpHint = resolver.hints.find(
        (hint) => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID
      );

      if (!totpHint) {
        setError('No authenticator app enrolled. Please contact support.');
        setVerifying(false);
        return;
      }

      const assertion = TotpMultiFactorGenerator.assertionForSignIn(
        totpHint.uid,
        code
      );

      await resolver.resolveSignIn(assertion);
      onSuccess();
    } catch (err: any) {
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid code. Please check your authenticator app and try again.');
      } else {
        setError(err.message || 'Verification failed.');
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.heading}>Two-Factor Authentication</Text>
        <Text style={styles.description}>
          Enter the 6-digit code from your authenticator app to sign in.
        </Text>

        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={(text) => {
            setCode(text.replace(/[^0-9]/g, '').slice(0, 6));
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
          style={[styles.verifyButton, verifying && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={verifying}
        >
          {verifying ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'center',
  },
  content: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  heading: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
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
    width: '100%',
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#E24B4A',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  verifyButton: {
    backgroundColor: colors.amber,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: '#fff',
  },
  cancelButton: {
    paddingVertical: spacing.lg,
  },
  cancelButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textMuted,
  },
});
