import { Href, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components';
import Screen from '../components/Screen';
import { colors, fontSizes, radii, spacing } from '../theme/tokens';
import { evaluateContacts } from './evaluateContacts';
import TrustedContactForm from './TrustedContactForm';
import TrustedContactRow from './TrustedContactRow';
import type { TrustedContact } from './trustedContact.types';
import { useTrustedContacts } from './useTrustedContacts';

interface TrustedContactsScreenProps {
  onContinue?: (route: Href) => void;
}

function defaultContinue(route: Href): void {
  router.push(route);
}

export default function TrustedContactsScreen({
  onContinue = defaultContinue
}: TrustedContactsScreenProps = {}) {
  const { contacts, loading, error, add, update, remove, invite, revokeInvite } =
    useTrustedContacts();
  const [editing, setEditing] = useState<TrustedContact | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [inviteTokens, setInviteTokens] = useState<Record<string, string>>({});
  const [busyContactId, setBusyContactId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'invite' | 'revoke' | null>(null);
  const evaluation = evaluateContacts(contacts);

  async function handleDelete(contact: TrustedContact): Promise<void> {
    setActionError(null);
    try {
      await remove(contact.id);
      setInviteTokens((current) => {
        const next = { ...current };
        delete next[contact.id];
        return next;
      });
      if (editing?.id === contact.id) {
        setEditing(null);
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Could not delete contact');
    }
  }

  async function handleInvite(contact: TrustedContact): Promise<void> {
    setActionError(null);
    setBusyContactId(contact.id);
    setBusyAction('invite');
    try {
      const created = await invite(contact.id);
      setInviteTokens((current) => ({
        ...current,
        [contact.id]: created.inviteToken
      }));
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Could not send invite');
    } finally {
      setBusyContactId(null);
      setBusyAction(null);
    }
  }

  async function handleRevokeInvite(contact: TrustedContact): Promise<void> {
    setActionError(null);
    setBusyContactId(contact.id);
    setBusyAction('revoke');
    try {
      await revokeInvite(contact.id);
      setInviteTokens((current) => {
        const next = { ...current };
        delete next[contact.id];
        return next;
      });
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Could not revoke invite');
    } finally {
      setBusyContactId(null);
      setBusyAction(null);
    }
  }

  async function handleShareInvite(contact: TrustedContact): Promise<void> {
    const token = inviteTokens[contact.id];
    if (!token) {
      return;
    }
    const expires = contact.inviteTokenExpiresAt
      ? new Intl.DateTimeFormat('en', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        }).format(new Date(contact.inviteTokenExpiresAt))
      : 'soon';
    await Share.share({
      message: [
        'You have been invited as an emergency contact for a Pusaka plan.',
        `Use this one-time invite token after signing in with ${contact.email ?? 'your invited email'}:`,
        token,
        `Expires: ${expires}`
      ].join('\n')
    });
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Who should your family turn to?</Text>
        <Text style={styles.lede}>
          Your trusted contacts. We suggest at least two, so no one is a single
          point of failure.
        </Text>

        {!loading && !error ? (
          <View
            accessibilityRole="summary"
            style={[
              styles.banner,
              evaluation.level === 'success' ? styles.bannerSuccess : styles.bannerWarn
            ]}
          >
            <Text
              style={[
                styles.bannerText,
                evaluation.level === 'success'
                  ? styles.bannerTextSuccess
                  : styles.bannerTextWarn
              ]}
            >
              {evaluation.message}
            </Text>
          </View>
        ) : null}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Trusted contacts</Text>
          <Text style={styles.count}>{contacts.length}</Text>
        </View>

        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

        {loading ? (
          <ActivityIndicator color={colors.teal} accessibilityLabel="Loading" />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : contacts.length === 0 ? (
          <Text style={styles.empty}>No contacts yet. Add your first below.</Text>
        ) : (
          <View style={styles.list}>
            {contacts.map((contact) => (
              <TrustedContactRow
                key={contact.id}
                busyLabel={busyContactId === contact.id ? busyAction ?? undefined : undefined}
                contact={contact}
                inviteToken={inviteTokens[contact.id]}
                onDelete={(target) => void handleDelete(target)}
                onEdit={setEditing}
                onInvite={(target) => void handleInvite(target)}
                onRevokeInvite={(target) => void handleRevokeInvite(target)}
                onShareInvite={(target) => void handleShareInvite(target)}
              />
            ))}
          </View>
        )}

        <TrustedContactForm
          key={editing?.id ?? 'new-trusted-contact'}
          initialValue={editing ?? undefined}
          onCancel={editing ? () => setEditing(null) : undefined}
          onSubmit={async (input) => {
            setActionError(null);
            if (editing) {
              const updated = await update(editing.id, input);
              if (updated.email !== editing.email) {
                setInviteTokens((current) => {
                  const next = { ...current };
                  delete next[editing.id];
                  return next;
                });
              }
              setEditing(null);
              return;
            }
            await add(input);
          }}
        />

        {!loading && !error && evaluation.level === 'success' && !editing ? (
          <Button
            label="Continue to asset references"
            onPress={() => onContinue('/asset-references')}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.xxl
  },
  heading: {
    fontSize: fontSizes.heading,
    color: colors.ink,
    fontWeight: '500'
  },
  lede: {
    fontSize: fontSizes.small,
    color: colors.muted,
    lineHeight: 20
  },
  banner: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md
  },
  bannerWarn: {
    backgroundColor: colors.warnBg
  },
  bannerSuccess: {
    backgroundColor: colors.successBg
  },
  bannerText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600'
  },
  bannerTextWarn: {
    color: colors.warnText
  },
  bannerTextSuccess: {
    color: colors.successText
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted
  },
  count: {
    fontSize: 12,
    color: colors.teal,
    fontWeight: '600'
  },
  list: {
    gap: spacing.sm
  },
  empty: {
    fontSize: fontSizes.small,
    color: colors.muted2
  },
  error: {
    fontSize: fontSizes.small,
    color: colors.dangerText
  }
});
