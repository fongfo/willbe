import { Pressable, StyleSheet, Text, View } from 'react-native';
import Badge from '../components/Badge';
import { getRelationLabel } from '../family-members/relations';
import { getInitials } from '../family-members/initials';
import { colors, radii, spacing } from '../theme/tokens';
import type { TrustedContact } from './trustedContact.types';
import { getRoleLabel } from './roles';

interface TrustedContactRowProps {
  contact: TrustedContact;
  onDelete: (contact: TrustedContact) => void;
  onEdit: (contact: TrustedContact) => void;
}

export default function TrustedContactRow({
  contact,
  onDelete,
  onEdit
}: TrustedContactRowProps) {
  const subtitle = `${getRelationLabel(contact.relation)} · ${getRoleLabel(contact.role)}`;
  const verified = contact.verificationStatus === 'VERIFIED';

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{contact.name}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.trailing}>
        <Badge label={verified ? 'Verified' : 'Pending'} tone={verified ? 'success' : 'warn'} />
        <View style={styles.actions}>
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
            style={[styles.actionButton, styles.deleteButton]}
          >
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    borderRadius: 15,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border
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
  trailing: {
    alignItems: 'flex-end',
    gap: spacing.xs
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs
  },
  actionButton: {
    minWidth: 54,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: '#eef5f2'
  },
  deleteButton: {
    backgroundColor: colors.dangerBg
  },
  actionText: {
    color: colors.tealDark,
    fontSize: 12,
    fontWeight: '700'
  },
  deleteText: {
    color: colors.dangerText
  }
});
