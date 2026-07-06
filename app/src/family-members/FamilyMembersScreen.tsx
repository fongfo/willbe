import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { colors, fontSizes, spacing } from '../theme/tokens';
import FamilyMemberForm from './FamilyMemberForm';
import FamilyMemberRow from './FamilyMemberRow';
import type { FamilyMember } from './familyMember.types';
import { useFamilyMembers } from './useFamilyMembers';

export default function FamilyMembersScreen() {
  const { members, loading, error, add, update, remove } = useFamilyMembers();
  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleDelete(member: FamilyMember): Promise<void> {
    setActionError(null);
    try {
      await remove(member.id);
      if (editing?.id === member.id) {
        setEditing(null);
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Could not delete member');
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Your family directory</Text>
        <Text style={styles.lede}>
          Add the people your plan is for. Locations and relationships only —
          never account numbers or passwords.
        </Text>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>People in the plan</Text>
          <Text style={styles.count}>{members.length}</Text>
        </View>

        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

        {loading ? (
          <ActivityIndicator color={colors.teal} accessibilityLabel="Loading" />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : members.length === 0 ? (
          <Text style={styles.empty}>No one added yet. Add your first person below.</Text>
        ) : (
          <View style={styles.list}>
            {members.map((member) => (
              <FamilyMemberRow
                key={member.id}
                member={member}
                onDelete={(target) => void handleDelete(target)}
                onEdit={setEditing}
              />
            ))}
          </View>
        )}

        <FamilyMemberForm
          key={editing?.id ?? 'new-family-member'}
          initialValue={editing ?? undefined}
          onCancel={editing ? () => setEditing(null) : undefined}
          onSubmit={async (input) => {
            setActionError(null);
            if (editing) {
              await update(editing.id, input);
              setEditing(null);
              return;
            }
            await add(input);
          }}
        />
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
