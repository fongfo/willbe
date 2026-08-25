import { Pressable, StyleSheet, Text, View } from 'react-native';
import Badge from '../components/Badge';
import { getInitials } from '../family-members/initials';
import { getRelationLabel } from '../family-members/relations';
import { colors, radii, spacing } from '../theme/tokens';
import { getRoleLabel } from './roles';
import type { TrustedContact } from './trustedContact.types';

interface TrustedContactRowProps {
  contact: TrustedContact;
  inviteToken?: string;
  busyLabel?: string;
  onDelete: (contact: TrustedContact) => void;
  onEdit: (contact: TrustedContact) => void;
  onInvite: (contact: TrustedContact) => void;
  onRevokeInvite: (contact: TrustedContact) => void;
  onShareInvite: (contact: TrustedContact) => void;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return 'Not sent';
  }
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function isExpired(value: string | null | undefined): boolean {
  return value ? new Date(value) <= new Date() : false;
}

export default function TrustedContactRow({
  contact,
  inviteToken,
  busyLabel,
  onDelete,
  onEdit,
  onInvite,
  onRevokeInvite,
  onShareInvite
}: TrustedContactRowProps) {
  const subtitle = `${getRelationLabel(contact.relation)} · ${getRoleLabel(contact.role)}`;
  const verified = contact.verificationStatus === 'VERIFIED';
  const hasActiveInvite =
    Boolean(contact.inviteSentAt) &&
    !contact.inviteTokenUsedAt &&
    !isExpired(contact.inviteTokenExpiresAt);
  const expiredInvite =
    Boolean(contact.inviteSentAt) &&
    !contact.inviteTokenUsedAt &&
    isExpired(contact.inviteTokenExpiresAt);
  const inviteStatus = verified
    ? 'Verified'
    : expiredInvite
      ? 'Invite expired'
      : hasActiveInvite
        ? 'Invite sent'
        : 'Pending';
  const inviteTone = verified ? 'success' : expiredInvite ? 'danger' : 'warn';
  const inviteButtonLabel = contact.inviteSentAt ? 'Resend invite' : 'Send invite';
  const canInvite = Boolean(contact.email) && !verified;
  const canRevoke = hasActiveInvite && !verified;

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.name}>{contact.name}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {contact.email ? <Text style={styles.email}>{contact.email}</Text> : null}
        </View>
        <Badge label={inviteStatus} tone={inviteTone} />
      </View>

      {!verified ? (
        <View style={styles.inviteMeta}>
          <Text style={styles.metaText}>Sent: {formatDate(contact.inviteSentAt)}</Text>
          <Text style={styles.metaText}>Expires: {formatDate(contact.inviteTokenExpiresAt)}</Text>
          {!contact.email ? (
            <Text style={styles.warningText}>Add an email before sending an invite.</Text>
          ) : null}
        </View>
      ) : null}

      {inviteToken ? (
        <View style={styles.tokenBox}>
          <Text style={styles.tokenLabel}>One-time invite token</Text>
          <Text selectable style={styles.tokenText}>
            {inviteToken}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {!verified ? (
          <>
            <Pressable
              accessibilityLabel={`${inviteButtonLabel} to ${contact.name}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canInvite || Boolean(busyLabel) }}
              disabled={!canInvite || Boolean(busyLabel)}
              onPress={() => onInvite(contact)}
              style={[styles.actionButton, (!canInvite || busyLabel) && styles.disabledButton]}
            >
              <Text style={styles.actionText}>{busyLabel === 'invite' ? 'Sending...' : inviteButtonLabel}</Text>
            </Pressable>
            {canRevoke ? (
              <Pressable
                accessibilityLabel={`Revoke invite for ${contact.name}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: Boolean(busyLabel) }}
                disabled={Boolean(busyLabel)}
                onPress={() => onRevokeInvite(contact)}
                style={[styles.actionButton, styles.dangerButton, busyLabel && styles.disabledButton]}
              >
                <Text style={[styles.actionText, styles.dangerText]}>
                  {busyLabel === 'revoke' ? 'Revoking...' : 'Revoke invite'}
                </Text>
              </Pressable>
            ) : null}
            {inviteToken ? (
              <Pressable
                accessibilityLabel={`Share invite for ${contact.name}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: Boolean(busyLabel) }}
                disabled={Boolean(busyLabel)}
                onPress={() => onShareInvite(contact)}
                style={[styles.actionButton, busyLabel && styles.disabledButton]}
              >
                <Text style={styles.actionText}>Share invite</Text>
              </Pressable>
            ) : null}
          </>
        ) : null}
        <Pressable
          accessibilityLabel={`Edit ${contact.name}`}
          accessibilityRole="button"
          onPress={() => onEdit(contact)}
          style={styles.actionButton}
        >
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={`Delete ${contact.name}`}
          accessibilityRole="button"
          onPress={() => onDelete(contact)}
          style={[styles.actionButton, styles.dangerButton]}
        >
          <Text style={[styles.actionText, styles.dangerText]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.md,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    backgroundColor: '#1f6f8b',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15
  },
  content: {
    flex: 1,
    gap: 2
  },
  name: {
    fontWeight: '600',
    fontSize: 14.5,
    color: colors.ink
  },
  subtitle: {
    fontSize: 12.5,
    color: colors.muted
  },
  email: {
    fontSize: 12,
    color: colors.muted2
  },
  inviteMeta: {
    gap: spacing.xs,
    paddingLeft: 55
  },
  metaText: {
    fontSize: 12,
    color: colors.muted
  },
  warningText: {
    fontSize: 12,
    color: colors.dangerText,
    fontWeight: '600'
  },
  tokenBox: {
    gap: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: '#d8e3de',
    padding: spacing.sm,
    backgroundColor: '#f5faf8'
  },
  tokenLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  tokenText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.ink,
    fontWeight: '700'
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  actionButton: {
    minHeight: 36,
    minWidth: 82,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: '#eef5f2'
  },
  dangerButton: {
    backgroundColor: colors.dangerBg
  },
  disabledButton: {
    opacity: 0.5
  },
  actionText: {
    color: colors.tealDark,
    fontSize: 12,
    fontWeight: '700'
  },
  dangerText: {
    color: colors.dangerText
  }
});
