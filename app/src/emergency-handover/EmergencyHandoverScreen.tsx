import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAssetReferences } from '../asset-references/useAssetReferences';
import { Badge, Card, Screen } from '../components';
import { useFamilyMembers } from '../family-members/useFamilyMembers';
import { getRelationLabel } from '../family-members/relations';
import { useRefreshOnFocus } from '../navigation/useRefreshOnFocus';
import { colors, fontSizes, radii, spacing } from '../theme/tokens';
import { useTrustedContacts } from '../trusted-contacts/useTrustedContacts';
import { buildEmergencyHandover } from './buildEmergencyHandover';

export default function EmergencyHandoverScreen() {
  const family = useFamilyMembers();
  const contacts = useTrustedContacts();
  const assets = useAssetReferences();
  useRefreshOnFocus(family.refresh);
  useRefreshOnFocus(contacts.refresh);
  useRefreshOnFocus(assets.refresh);

  const loading = family.loading || contacts.loading || assets.loading;
  const error = family.error ?? contacts.error ?? assets.error;
  const handover = buildEmergencyHandover({
    familyMembers: family.members,
    trustedContacts: contacts.contacts,
    assetReferences: assets.references
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Emergency handover</Text>
        <Text style={styles.lede}>
          A calm, read-only preview of who to contact first and where your family
          should look for key records.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.teal} accessibilityLabel="Loading handover" />
        ) : error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : (
          <>
            <Card style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>Sensitive details stay out</Text>
              <Text style={styles.noticeText}>
                This preview shows names, roles, phone numbers, and location hints only.
                It never displays account numbers, balances, passwords, or private keys.
              </Text>
            </Card>

            <Card style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Protected family</Text>
                <Badge label={`${handover.protectedNames.length}`} tone="success" />
              </View>
              {handover.protectedNames.length === 0 ? (
                <Text style={styles.empty}>No family members recorded yet.</Text>
              ) : (
                <Text style={styles.bodyText}>{handover.protectedNames.join(', ')}</Text>
              )}
            </Card>

            <Card style={styles.sectionCard}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>First call</Text>
                <Badge label={handover.primaryContact ? 'Ready' : 'Missing'} tone={handover.primaryContact ? 'success' : 'danger'} />
              </View>
              {handover.primaryContact ? (
                <View style={styles.contactBlock}>
                  <Text style={styles.primaryName}>{handover.primaryContact.name}</Text>
                  <Text style={styles.bodyText}>
                    {getRelationLabel(handover.primaryContact.relation)} · {handover.primaryContact.phone}
                  </Text>
                  {handover.primaryContact.email ? (
                    <Text style={styles.bodyText}>{handover.primaryContact.email}</Text>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.empty}>Add a trusted contact to create a first call.</Text>
              )}
            </Card>

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Backup contacts</Text>
              <Text style={styles.count}>{handover.backupContacts.length}</Text>
            </View>
            {handover.backupContacts.length === 0 ? (
              <Text style={styles.empty}>No backup contacts ready yet.</Text>
            ) : (
              <View style={styles.list}>
                {handover.backupContacts.map((contact) => (
                  <Card key={contact.id} style={styles.listCard}>
                    <Text style={styles.itemTitle}>{contact.name}</Text>
                    <Text style={styles.bodyText}>
                      {getRelationLabel(contact.relation)} · {contact.phone}
                    </Text>
                  </Card>
                ))}
              </View>
            )}

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Where to look</Text>
              <Text style={styles.count}>{handover.documentedAssets.length}</Text>
            </View>
            {handover.documentedAssets.length === 0 ? (
              <Text style={styles.empty}>No findable asset references yet.</Text>
            ) : (
              <View style={styles.list}>
                {handover.documentedAssets.map((reference) => (
                  <Card key={reference.id} style={styles.listCard}>
                    <Text style={styles.itemTitle}>{reference.name}</Text>
                    <Text style={styles.bodyText}>{reference.locationHint}</Text>
                  </Card>
                ))}
              </View>
            )}

            {handover.undocumentedAssets.length > 0 ? (
              <Card style={styles.warningCard}>
                <Text style={styles.warningTitle}>Needs location hints</Text>
                <Text style={styles.warningText}>
                  {handover.undocumentedAssets.length} asset reference needs a place to look
                  before it can appear in the handover preview.
                </Text>
              </Card>
            ) : null}

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Handover gaps</Text>
              <Text style={styles.count}>{handover.gaps.length}</Text>
            </View>
            {handover.gaps.length === 0 ? (
              <View style={styles.readyBox}>
                <Text style={styles.readyTitle}>Preview ready</Text>
                <Text style={styles.readyText}>
                  Your emergency handover has a first contact, backup, family context,
                  and at least one findable asset reference.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {handover.gaps.map((gap) => (
                  <Card key={gap.id} style={styles.listCard}>
                    <Text style={styles.itemTitle}>{gap.title}</Text>
                    <Text style={styles.bodyText}>{gap.detail}</Text>
                  </Card>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
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
    color: colors.muted,
    lineHeight: 20
  },
  error: {
    fontSize: fontSizes.small,
    color: colors.dangerText
  },
  noticeCard: {
    gap: spacing.xs,
    backgroundColor: colors.warnBg,
    borderColor: colors.goldLight
  },
  noticeTitle: {
    fontSize: fontSizes.title,
    fontWeight: '700',
    color: colors.warnText
  },
  noticeText: {
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.ink
  },
  sectionCard: {
    gap: spacing.sm
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
  count: {
    fontSize: 12,
    color: colors.teal,
    fontWeight: '600'
  },
  contactBlock: {
    gap: spacing.xs
  },
  primaryName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink
  },
  list: {
    gap: spacing.sm
  },
  listCard: {
    gap: spacing.xs
  },
  itemTitle: {
    fontSize: fontSizes.title,
    fontWeight: '700',
    color: colors.ink
  },
  bodyText: {
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.muted2
  },
  empty: {
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.muted2
  },
  warningCard: {
    gap: spacing.xs,
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder
  },
  warningTitle: {
    fontSize: fontSizes.title,
    fontWeight: '700',
    color: colors.dangerText
  },
  warningText: {
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.ink
  },
  readyBox: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.successBg
  },
  readyTitle: {
    fontSize: fontSizes.title,
    fontWeight: '700',
    color: colors.successText
  },
  readyText: {
    marginTop: spacing.xs,
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.ink
  }
});
