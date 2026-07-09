import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { Badge, Button, Card, Screen } from '../components';
import { colors, fontSizes, radii, spacing } from '../theme/tokens';
import { authenticateWithEmbeddedWallet } from './auth.api';
import type { AccountUser, AuthSession, SignInInput } from './auth.types';

function initials(name: string | null | undefined, email: string | null | undefined): string {
  const source = name?.trim() || email?.split('@')[0] || 'Pusaka User';
  const parts = source.split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? 'P'}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

function shortenAddress(address: string | null | undefined): string {
  if (!address) {
    return 'Pending wallet';
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface AccountRowProps {
  title: string;
  detail: string;
  badge?: string;
  danger?: boolean;
  onPress?: () => void;
}

function AccountRow({ title, detail, badge, danger = false, onPress }: AccountRowProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}
    >
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, danger && styles.dangerText]}>{title}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
      {badge ? <Badge label={badge} tone={danger ? 'warn' : 'success'} /> : null}
    </Pressable>
  );
}

interface AccountScreenProps {
  authenticate?: (input: SignInInput) => Promise<AuthSession>;
}

export default function AccountScreen({
  authenticate = authenticateWithEmbeddedWallet
}: AccountScreenProps) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [email, setEmail] = useState('aisyah.rahman@gmail.com');
  const [name, setName] = useState('Aisyah Rahman');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConsentImpact, setShowConsentImpact] = useState(false);
  const [frequency, setFrequency] = useState('Every 6 months');

  const signedIn = Boolean(user);
  const displayName = user?.name ?? 'Pusaka account';
  const displayEmail = user?.email ?? 'No email linked';
  const canSubmit = email.includes('@') && name.trim().length > 1 && !loading;
  const proofStatus = useMemo(
    () => (signedIn ? 'Last secured 2 days ago' : 'Sign in to create proof'),
    [signedIn]
  );

  async function handleSignIn(): Promise<void> {
    if (!canSubmit) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const session = await authenticate({
        email: email.trim(),
        name: name.trim()
      });
      setUser(session.user);
    } catch {
      setError('We could not create the account session. Check the API and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!signedIn) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Create your Pusaka account</Text>
          <Text style={styles.lede}>
            Sign in with email. Pusaka quietly creates a secure proof wallet for your
            plan, without crypto steps or seed phrases.
          </Text>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Web3 in Web2 sign in</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                accessibilityLabel="Name"
                autoCapitalize="words"
                onChangeText={setName}
                style={styles.input}
                value={name}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                accessibilityLabel="Email"
                autoCapitalize="none"
                inputMode="email"
                onChangeText={setEmail}
                style={styles.input}
                value={email}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              disabled={!canSubmit}
              label={loading ? 'Creating account...' : 'Continue with email'}
              onPress={handleSignIn}
            />
          </Card>

          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              The wallet is for Proof of Plan records only. Pusaka never asks for
              passwords, balances, private keys, or seed phrases.
            </Text>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(displayName, displayEmail)}</Text>
          </View>
          <View style={styles.profileCopy}>
            <Text style={styles.heading}>Account</Text>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{displayEmail}</Text>
          </View>
        </View>

        <Card style={styles.privacyCard}>
          <View style={styles.privacyHead}>
            <View style={styles.zkMark}>
              <Text style={styles.zkMarkText}>ZK</Text>
            </View>
            <Text style={styles.privacyTitle}>Zero-knowledge privacy</Text>
          </View>
          <Text style={styles.privacyText}>
            Your information is encrypted around keys you control. Pusaka stores where
            to look, never passwords, balances, account numbers, private keys, or seed
            phrases.
          </Text>
          <View style={styles.checkList}>
            <Text style={styles.checkItem}>No passwords, balances, or account numbers stored</Text>
            <Text style={styles.checkItem}>Export your plan references any time</Text>
            <Text style={styles.checkItem}>Only hashes are prepared for chain proof</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Proof of Plan</Text>
            <Badge label="Ready" tone="success" />
          </View>
          <Text style={styles.rowTitle}>Plan certificate</Text>
          <Text style={styles.rowDetail}>
            {proofStatus}. View the human-readable certificate before any advanced chain
            details.
          </Text>
          <View style={styles.walletStrip}>
            <Text style={styles.walletLabel}>Proof wallet</Text>
            <Text style={styles.walletValue}>{shortenAddress(user?.walletAddress)}</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Check-in rhythm</Text>
          {['Every 3 months', 'Every 6 months', 'Every 12 months'].map((option) => {
            const selected = option === frequency;
            return (
              <Pressable
                accessibilityLabel={`${option} check-in rhythm`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={option}
                onPress={() => setFrequency(option)}
                style={[styles.frequencyRow, selected && styles.frequencyRowSelected]}
              >
                <View style={[styles.radio, selected && styles.radioSelected]} />
                <Text style={styles.frequencyLabel}>{option}</Text>
              </Pressable>
            );
          })}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Emergency handoff</Text>
          <AccountRow
            badge="12 months"
            detail="After inactivity, Pusaka starts verifying trusted contacts before releasing instructions."
            title="If I become inactive"
          />
          <Button label="Test emergency handoff" onPress={() => undefined} variant="secondary" />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Privacy & Data</Text>
          <AccountRow
            badge="Available"
            detail="Download a portable copy of plan references and settings."
            title="Export my data"
          />
          <AccountRow
            detail="Stop overseas processing for wallet, AI, and infrastructure providers after impact review."
            danger
            onPress={() => setShowConsentImpact(true)}
            title="Withdraw consent"
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Security</Text>
          <AccountRow
            badge="Email"
            detail="Privy embedded wallet session, ready for production SDK integration."
            title="Login method"
          />
          <AccountRow
            detail="Wallet address is shown for transparency. Do not share seed phrases here."
            title="Advanced wallet details"
          />
        </Card>

        <Button label="Sign out" onPress={() => setUser(null)} variant="danger" />
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setShowConsentImpact(false)}
        transparent
        visible={showConsentImpact}
      >
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Withdraw consent?</Text>
            <Text style={styles.modalText}>
              Pusaka would stop overseas processing for wallet infrastructure, AI
              explanations, and cloud services where no other legal basis applies. This
              may pause Proof of Plan updates and emergency handoff automation.
            </Text>
            <Button
              label="Keep consent for now"
              onPress={() => setShowConsentImpact(false)}
              style={styles.modalAction}
            />
            <Button
              label="I understand the impact"
              onPress={() => setShowConsentImpact(false)}
              variant="danger"
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xxl
  },
  heading: {
    fontSize: fontSizes.heading,
    color: colors.ink,
    fontWeight: '500'
  },
  lede: {
    fontSize: fontSizes.small,
    lineHeight: 20,
    color: colors.muted2
  },
  card: {
    gap: spacing.md
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  profileCopy: {
    flex: 1
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal
  },
  avatarText: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.white
  },
  profileName: {
    marginTop: spacing.xs,
    fontSize: fontSizes.title,
    fontWeight: '700',
    color: colors.ink
  },
  profileEmail: {
    marginTop: 2,
    fontSize: fontSizes.small,
    color: colors.muted
  },
  privacyCard: {
    gap: spacing.md,
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  privacyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  zkMark: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(231, 193, 99, 0.18)'
  },
  zkMarkText: {
    color: colors.goldLight,
    fontSize: 13,
    fontWeight: '800'
  },
  privacyTitle: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: '#dff0ea'
  },
  privacyText: {
    fontSize: fontSizes.small,
    lineHeight: 21,
    color: '#bcd6ce'
  },
  checkList: {
    gap: spacing.sm
  },
  checkItem: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#dff0ea'
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted
  },
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm
  },
  rowPressed: {
    opacity: 0.7
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xs
  },
  rowTitle: {
    fontSize: fontSizes.title,
    fontWeight: '700',
    color: colors.ink
  },
  rowDetail: {
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.muted2
  },
  dangerText: {
    color: colors.dangerText
  },
  walletStrip: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: '#eef4f1'
  },
  walletLabel: {
    fontSize: fontSizes.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted
  },
  walletValue: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.ink
  },
  frequencyRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.white
  },
  frequencyRowSelected: {
    borderColor: colors.teal,
    backgroundColor: '#eef6f3'
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: '#c8d8d2'
  },
  radioSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.teal
  },
  frequencyLabel: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.ink
  },
  notice: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: '#eef4f1'
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted2
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
  error: {
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.dangerText
  },
  modalScrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(10, 31, 27, 0.56)'
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radii.xl,
    backgroundColor: colors.white
  },
  modalTitle: {
    fontSize: fontSizes.display,
    fontWeight: '800',
    color: colors.ink
  },
  modalText: {
    fontSize: fontSizes.body,
    lineHeight: 22,
    color: colors.muted2
  },
  modalAction: {
    marginTop: spacing.xs
  }
});
