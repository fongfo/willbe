import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme/tokens';
import type { FamilyMember } from './familyMember.types';
import { getRelationLabel } from './relations';
import { getInitials } from './initials';

interface FamilyMemberRowProps {
  member: FamilyMember;
}

/** Builds the "Spouse · Petaling Jaya" style subtitle from the prototype. */
function buildSubtitle(member: FamilyMember): string {
  const relation = getRelationLabel(member.relation);
  return member.detail ? `${relation} · ${member.detail}` : relation;
}

export default function FamilyMemberRow({ member }: FamilyMemberRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(member.name)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={styles.subtitle}>{buildSubtitle(member)}</Text>
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
  }
});
