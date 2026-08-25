import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
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
type AuthMode = 'planner' | 'contact';
type LoadingStep = 'send' | 'verify' | null;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_SECONDS = 30;
const CONTACT_EMERGENCY_ROUTE = '/contact-emergency' as Href;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 429) {
    return 'Too many attempts. Wait a few minutes, then try again.';
  }
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

export default function AuthScreen() {
  const { error: sessionError, sendEmailCode, verifyEmailCode } = useAccountAuth();
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>('email');
  const [authMode, setAuthMode] = useState<AuthMode>('planner');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>(null);
  const [resendRemainingSeconds, setResendRemainingSeconds] = useState(0);

  const normalizedEmail = email.trim();
  const emailIsValid = emailPattern.test(normalizedEmail);
  const showEmailError = emailTouched && normalizedEmail.length > 0 && !emailIsValid;
  const codeIsValid = code.trim().length >= 4;
  const canSubmit = !loadingStep && (step === 'email' ? emailIsValid : codeIsValid);
  const canResendCode = emailIsValid && !loadingStep && resendRemainingSeconds === 0;
  const helperText = useMemo(() => {
    if (showEmailError) {
      return 'Use a valid email address, like aisyah@example.com.';
    }
    if (!normalizedEmail) {
      return authMode === 'contact'
        ? 'Use the email your planner invited as a trusted contact.'
        : 'Enter your email to continue.';
    }
    return 'We will send a one-time verification code.';
  }, [authMode, normalizedEmail, showEmailError]);
  const heading =
    authMode === 'contact' ? 'Emergency contact sign-in' : 'Protect your family plan';
  const lede =
    authMode === 'contact'
      ? 'Sign in with the email your planner invited. After verification, you will enter emergency contact mode.'
      : 'Sign in or create an account with email. Pusaka prepares a secure proof wallet quietly, without seed phrases or crypto steps.';

  useEffect(() => {
    if (step !== 'code' || resendRemainingSeconds === 0) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setResendRemainingSeconds((remainingSeconds) => Math.max(remainingSeconds - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendRemainingSeconds, step]);

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
        setResendRemainingSeconds(RESEND_COOLDOWN_SECONDS);
        setStep('code');
        return;
      }

      await verifyEmailCode({
        email: normalizedEmail,
        code: code.trim()
      });
      if (authMode === 'contact') {
        router.replace(CONTACT_EMERGENCY_ROUTE);
      }
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
    setResendRemainingSeconds(0);
  }

  async function handleResendCode(): Promise<void> {
    if (!canResendCode) {
      return;
    }

    setError(null);
    setLoadingStep('send');
    try {
      await sendEmailCode(normalizedEmail);
      setResendRemainingSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (caughtError: unknown) {
      setError(
        errorMessage(caughtError, 'We could not resend the code. Check your connection and try again.')
      );
    } finally {
      setLoadingStep(null);
    }
  }

  function handleSelectContactMode(): void {
    setAuthMode('contact');
    setStep('email');
    setCode('');
    setError(null);
    setResendRemainingSeconds(0);
  }

  function handleSelectPlannerMode(): void {
    setAuthMode('planner');
    setStep('email');
    setCode('');
    setError(null);
    setResendRemainingSeconds(0);
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.brand}>Pusaka</Text>
          <Text style={styles.heading}>{heading}</Text>
          <Text style={styles.lede}>{lede}</Text>
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
                  <Text style={styles.linkText}>Change email</Text>
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
                accessibilityState={{ disabled: !canResendCode }}
                disabled={!canResendCode}
                onPress={handleResendCode}
                style={styles.resendButton}
              >
                <Text style={[styles.resendText, !canResendCode && styles.resendTextDisabled]}>
                  {resendRemainingSeconds > 0
                    ? `Resend code in ${resendRemainingSeconds}s`
                    : 'Resend code'}
                </Text>
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

          {authMode === 'planner' ? (
            <Button
              label="I am an emergency contact"
              onPress={handleSelectContactMode}
              variant="secondary"
            />
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={handleSelectPlannerMode}
              style={styles.modeBackButton}
            >
              <Text style={styles.linkText}>Sign in as planner instead</Text>
            </Pressable>
          )}
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
  modeBackButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center'
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
  resendTextDisabled: {
    color: colors.muted2
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
