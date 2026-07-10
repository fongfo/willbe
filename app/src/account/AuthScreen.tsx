import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { ApiError } from '../api/errors';
import { Button, Card, Screen } from '../components';
import { colors, fontSizes, radii, spacing } from '../theme/tokens';
import { useAccountAuth } from './AccountAuthContext';

type AuthStep = 'email' | 'code';
type LoadingStep = 'send' | 'verify' | null;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 429) {
    return 'Too many attempts. Wait a few minutes, then try again.';
  }
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

export default function AuthScreen() {
  const { error: sessionError, sendEmailCode, verifyEmailCode } = useAccountAuth();
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>(null);

  const normalizedEmail = email.trim();
  const emailIsValid = emailPattern.test(normalizedEmail);
  const showEmailError = emailTouched && normalizedEmail.length > 0 && !emailIsValid;
  const codeIsValid = code.trim().length >= 4;
  const canSubmit = !loadingStep && (step === 'email' ? emailIsValid : codeIsValid);
  const helperText = useMemo(() => {
    if (showEmailError) {
      return 'Use a valid email address, like aisyah@example.com.';
    }
    if (!normalizedEmail) {
      return 'Enter your email to continue.';
    }
    return 'We will send a one-time verification code.';
  }, [normalizedEmail, showEmailError]);

  async function handleSubmit(): Promise<void> {
    setEmailTouched(true);
    if (!canSubmit) {
      return;
    }

    setError(null);
    setLoadingStep(step === 'email' ? 'send' : 'verify');
    try {
      if (step === 'email') {
        await sendEmailCode(normalizedEmail);
        setStep('code');
        return;
      }

      await verifyEmailCode({
        email: normalizedEmail,
        code: code.trim()
      });
    } catch (caughtError: unknown) {
      setError(
        errorMessage(
          caughtError,
          step === 'email'
            ? 'We could not send the code. Check your connection and try again.'
            : 'That code did not work. Check the email and try again.'
        )
      );
    } finally {
      setLoadingStep(null);
    }
  }

  function handleChangeEmail(): void {
    setStep('email');
    setCode('');
    setError(null);
  }

  async function handleResendCode(): Promise<void> {
    if (!emailIsValid || loadingStep) {
      return;
    }

    setError(null);
    setLoadingStep('send');
    try {
      await sendEmailCode(normalizedEmail);
    } catch (caughtError: unknown) {
      setError(
        errorMessage(caughtError, 'We could not resend the code. Check your connection and try again.')
      );
    } finally {
      setLoadingStep(null);
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.brand}>Pusaka</Text>
          <Text style={styles.heading}>Protect your family plan</Text>
          <Text style={styles.lede}>
            Sign in or create an account with email. Pusaka prepares a secure proof
            wallet quietly, without seed phrases or crypto steps.
          </Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.stepPills}>
            <View style={[styles.stepPill, styles.stepPillActive]}>
              <Text style={styles.stepPillText}>Email</Text>
            </View>
            <View style={[styles.stepPill, step === 'code' && styles.stepPillActive]}>
              <Text style={styles.stepPillText}>Code</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              accessibilityHint="Enter your email address to receive a verification code."
              accessibilityLabel="Email"
              autoCapitalize="none"
              autoComplete="email"
              editable={step === 'email' && !loadingStep}
              inputMode="email"
              onBlur={() => setEmailTouched(true)}
              onChangeText={(value) => {
                setEmail(value);
                setError(null);
              }}
              style={[
                styles.input,
                showEmailError && styles.inputError,
                step === 'code' && styles.inputReadonly
              ]}
              textContentType="emailAddress"
              value={email}
            />
            <Text style={[styles.helper, showEmailError && styles.errorText]}>
              {helperText}
            </Text>
          </View>

          {step === 'code' ? (
            <View style={styles.fieldGroup}>
              <View style={styles.codeHeader}>
                <View style={styles.codeCopy}>
                  <Text style={styles.label}>Verification code</Text>
                  <Text style={styles.helper}>Code sent to {normalizedEmail}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleChangeEmail}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>Change</Text>
                </Pressable>
              </View>
              <TextInput
                accessibilityHint="Enter the one-time code from your email."
                accessibilityLabel="Verification code"
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={8}
                onChangeText={(value) => {
                  setCode(value);
                  setError(null);
                }}
                style={[styles.input, styles.codeInput]}
                textContentType="oneTimeCode"
                value={code}
              />
                <Pressable
                accessibilityRole="button"
                disabled={Boolean(loadingStep)}
                onPress={handleResendCode}
                style={styles.resendButton}
              >
                <Text style={styles.resendText}>Resend code</Text>
              </Pressable>
            </View>
          ) : null}

          {sessionError ? <Text style={styles.statusText}>{sessionError}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            disabled={!canSubmit}
            label={
              loadingStep === 'send'
                ? 'Sending code...'
                : loadingStep === 'verify'
                  ? 'Verifying code...'
                  : step === 'email'
                    ? 'Continue with email'
                    : 'Verify and continue'
            }
            onPress={handleSubmit}
          />
        </Card>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Pusaka never asks for passwords, balances, private keys, or seed phrases.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xxl
  },
  header: {
    gap: spacing.sm
  },
  brand: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: colors.teal
  },
  heading: {
    fontSize: fontSizes.heading,
    fontWeight: '700',
    color: colors.ink
  },
  lede: {
    fontSize: fontSizes.lead,
    lineHeight: 22,
    color: colors.muted2
  },
  card: {
    gap: spacing.md
  },
  stepPills: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  stepPill: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: '#eef4f1'
  },
  stepPillActive: {
    backgroundColor: '#dcefe9'
  },
  stepPillText: {
    fontSize: fontSizes.caption,
    fontWeight: '800',
    color: colors.tealDark
  },
  fieldGroup: {
    gap: spacing.xs
  },
  label: {
    fontSize: fontSizes.small,
    fontWeight: '700',
    color: colors.ink
  },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    fontSize: fontSizes.body,
    color: colors.ink,
    backgroundColor: colors.white
  },
  inputError: {
    borderColor: colors.dangerText,
    backgroundColor: colors.dangerBg
  },
  inputReadonly: {
    color: colors.muted2,
    backgroundColor: '#eef4f1'
  },
  helper: {
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.muted2
  },
  statusText: {
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.muted2
  },
  errorText: {
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.dangerText
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  codeCopy: {
    flex: 1
  },
  linkButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm
  },
  linkText: {
    fontSize: fontSizes.small,
    fontWeight: '800',
    color: colors.teal
  },
  codeInput: {
    letterSpacing: 3,
    fontWeight: '700'
  },
  resendButton: {
    minHeight: 44,
    justifyContent: 'center'
  },
  resendText: {
    fontSize: fontSizes.small,
    fontWeight: '700',
    color: colors.teal
  },
  notice: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: '#eef4f1'
  },
  noticeText: {
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.muted2
  }
});
