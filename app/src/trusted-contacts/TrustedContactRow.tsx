import { StyleSheet, Text, View } from 'react-native';
import Badge from '../components/Badge';
import { getRelationLabel } from '../family-members/relations';
import { getInitials } from '../family-members/initials';
import { colors, radii } from '../theme/tokens';
import type { TrustedContact } from './trustedContact.types';
import { getRoleLabel } from './roles';

interface TrustedContactRowProps {
  contact: TrustedContact;
}

export default function TrustedContactRow({ contact }: TrustedContactRowProps) {
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
      <Badge label={verified ? 'Verified' : 'Pending'} tone={verified ? 'success' : 'warn'} />
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
  }
});
