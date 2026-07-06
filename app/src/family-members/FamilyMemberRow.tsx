import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme/tokens';
import type { FamilyMember } from './familyMember.types';
import { getRelationLabel } from './relations';
import { getInitials } from './initials';

interface FamilyMemberRowProps {
  member: FamilyMember;
  onDelete: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
}

/** Builds the "Spouse · Petaling Jaya" style subtitle from the prototype. */
function buildSubtitle(member: FamilyMember): string {
  const relation = getRelationLabel(member.relation);
  return member.detail ? `${relation} · ${member.detail}` : relation;
}

export default function FamilyMemberRow({
  member,
  onDelete,
  onEdit
}: FamilyMemberRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(member.name)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={styles.subtitle}>{buildSubtitle(member)}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={`Edit ${member.name}`}
          accessibilityRole="button"
          onPress={() => onEdit(member)}
          style={styles.actionButton}
        >
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={`Delete ${member.name}`}
          accessibilityRole="button"
          onPress={() => onDelete(member)}
          style={[styles.actionButton, styles.deleteButton]}
        >
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 13,
    borderRadius: 15,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14
  },
  content: {
    flex: 1,
    gap: spacing.xs / 2
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
  actions: {
    gap: spacing.xs
  },
  actionButton: {
    minWidth: 58,
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
