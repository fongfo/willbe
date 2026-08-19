import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAssetReferences } from '../asset-references/useAssetReferences';
import { Badge, Button, Card, Screen } from '../components';
import { useFamilyMembers } from '../family-members/useFamilyMembers';
import { getRelationLabel } from '../family-members/relations';
import { useHandoverInstruction } from '../handover-instructions/useHandoverInstruction';
import type {
  HandoverInstruction,
  SaveHandoverInstructionInput
} from '../handover-instructions/handoverInstruction.types';
import { useRefreshOnFocus } from '../navigation/useRefreshOnFocus';
import { colors, fontSizes, radii, spacing } from '../theme/tokens';
import { useTrustedContacts } from '../trusted-contacts/useTrustedContacts';
import { buildEmergencyHandover } from './buildEmergencyHandover';

function stepAt(steps: readonly string[], index: number): string {
  return steps[index] ?? '';
}

interface HandoverInstructionEditorProps {
  instruction: Pick<HandoverInstruction, 'message' | 'firstSteps'>;
  save: (input: SaveHandoverInstructionInput) => Promise<HandoverInstruction>;
}

function HandoverInstructionEditor({
  instruction,
  save
}: HandoverInstructionEditorProps) {
  const [message, setMessage] = useState(instruction.message ?? '');
  const [stepOne, setStepOne] = useState(stepAt(instruction.firstSteps, 0));
  const [stepTwo, setStepTwo] = useState(stepAt(instruction.firstSteps, 1));
  const [stepThree, setStepThree] = useState(stepAt(instruction.firstSteps, 2));
  const [instructionError, setInstructionError] = useState<string | null>(null);
  const [savingInstruction, setSavingInstruction] = useState(false);
  const savedFirstSteps = instruction.firstSteps.filter((step) => step.trim().length > 0);

  async function handleInstructionSave(): Promise<void> {
    const firstSteps = [stepOne, stepTwo, stepThree]
      .map((step) => step.trim())
      .filter(Boolean);

    setSavingInstruction(true);
    setInstructionError(null);
    try {
      await save({
        message: message.trim() || null,
        firstSteps
      });
    } catch (err: unknown) {
      setInstructionError(
        err instanceof Error ? err.message : 'Unable to save handover message'
      );
    } finally {
      setSavingInstruction(false);
    }
  }

  return (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Message for trusted contacts</Text>
        <Badge
          label={instruction.message || savedFirstSteps.length > 0 ? 'Saved' : 'Draft'}
          tone={instruction.message || savedFirstSteps.length > 0 ? 'success' : 'warn'}
        />
      </View>
      <Text style={styles.bodyText}>
        Write the calm note and first actions your trusted contacts should see
        after verified emergency access.
      </Text>
      <TextInput
        accessibilityLabel="Handover message"
        multiline
        onChangeText={setMessage}
        placeholder="e.g. Take a breath. Call Sara first, then open the family folder."
        placeholderTextColor={colors.muted}
        style={[styles.input, styles.messageInput]}
        value={message}
      />
      <Text style={styles.label}>First steps</Text>
      <TextInput
        accessibilityLabel="First step 1"
        onChangeText={setStepOne}
        placeholder="Call the primary trusted contact"
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={stepOne}
      />
      <TextInput
        accessibilityLabel="First step 2"
        onChangeText={setStepTwo}
        placeholder="Open the saved family folder"
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={stepTwo}
      />
      <TextInput
        accessibilityLabel="First step 3"
        onChangeText={setStepThree}
        placeholder="Contact the lawyer or advisor listed below"
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={stepThree}
      />
      {instructionError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {instructionError}
        </Text>
      ) : null}
      <Button
        disabled={savingInstruction}
        label={savingInstruction ? 'Saving message...' : 'Save handover message'}
        onPress={handleInstructionSave}
      />
    </Card>
  );
}

export default function EmergencyHandoverScreen() {
  const family = useFamilyMembers();
  const contacts = useTrustedContacts();
  const assets = useAssetReferences();
  const instructionHook = useHandoverInstruction();
  useRefreshOnFocus(family.refresh);
  useRefreshOnFocus(contacts.refresh);
  useRefreshOnFocus(assets.refresh);
  useRefreshOnFocus(instructionHook.refresh);

  const loading = family.loading || contacts.loading || assets.loading || instructionHook.loading;
  const error = family.error ?? contacts.error ?? assets.error ?? instructionHook.error;
  const handover = buildEmergencyHandover({
    familyMembers: family.members,
    handoverInstruction: instructionHook.instruction,
    trustedContacts: contacts.contacts,
    assetReferences: assets.references
  });
  const editorKey = `${handover.instruction.message ?? ''}|${handover.instruction.firstSteps.join('|')}`;
  const savedFirstSteps = useMemo(
    () => handover.instruction.firstSteps.filter((step) => step.trim().length > 0),
    [handover.instruction.firstSteps]
  );

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

            <HandoverInstructionEditor
              key={editorKey}
              instruction={handover.instruction}
              save={instructionHook.save}
            />

            {handover.instruction.message || savedFirstSteps.length > 0 ? (
              <Card style={styles.messagePreviewCard}>
                {handover.instruction.message ? (
                  <>
                    <Text style={styles.previewEyebrow}>Message they will see</Text>
                    <Text style={styles.messageText}>{handover.instruction.message}</Text>
                  </>
                ) : null}
                {savedFirstSteps.length > 0 ? (
                  <View style={styles.previewSteps}>
                    <Text style={styles.previewEyebrow}>First steps</Text>
                    {savedFirstSteps.map((step, index) => (
                      <View key={`${step}-${index}`} style={styles.stepRow}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Card>
            ) : null}

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
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.white
  },
  messageInput: {
    minHeight: 96,
    textAlignVertical: 'top'
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted2
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
  messagePreviewCard: {
    gap: spacing.md,
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  previewEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.gold
  },
  messageText: {
    fontSize: 17,
    lineHeight: 25,
    color: colors.white,
    fontStyle: 'italic'
  },
  previewSteps: {
    gap: spacing.sm
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink
  },
  stepText: {
    flex: 1,
    fontSize: fontSizes.small,
    lineHeight: 20,
    color: colors.white
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
