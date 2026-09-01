import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { getCategoryLabel } from '../asset-references/categories';
import { useAccountAuth } from '../account/AccountAuthContext';
import { Button, Screen } from '../components';
import { getRelationLabel } from '../family-members/relations';
import { colors, fontSizes, radii, spacing } from '../theme/tokens';
import { useContactEmergencyAccess } from './useContactEmergencyAccess';
import type { EmergencyAccessStatus } from './emergencyAccess.types';

const WAITING_STATUSES = new Set<EmergencyAccessStatus>([
  'REQUESTED',
  'COOLING_OFF',
  'SECONDARY_REVIEW'
]);

function plannerName(name: string | null | undefined): string {
  return name?.trim() || 'the planner';
}

function statusLabel(status: EmergencyAccessStatus | null): string {
  if (!status) {
    return 'Ready to request';
  }
  const labels: Record<EmergencyAccessStatus, string> = {
    REQUESTED: 'Request received',
    COOLING_OFF: 'Waiting for review',
    SECONDARY_REVIEW: 'Secondary review',
    ACTIVE: 'Emergency mode active',
    DENIED: 'Request denied',
    REJECTED_BY_OWNER: 'Rejected by planner',
    SUSPENDED: 'Access revoked',
    CLOSED: 'Access closed',
    EXPIRED: 'Access expired'
  };
  return labels[status];
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'Not set';
  }
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function Section({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InviteTokenForm({
  inviteToken,
  submitting,
  onChangeInviteToken,
  onSubmitInviteToken
}: {
  inviteToken: string;
  submitting: boolean;
  onChangeInviteToken: (value: string) => void;
  onSubmitInviteToken: () => void;
}) {
  return (
    <View style={styles.form}>
      <Text style={styles.fieldLabel}>Invite token</Text>
      <TextInput
        accessibilityLabel="Trusted contact invite token"
        autoCapitalize="none"
        onChangeText={onChangeInviteToken}
        placeholder="Paste the one-time token"
        placeholderTextColor="#7c8f88"
        style={styles.singleLineInput}
        value={inviteToken}
      />
      <Button
        disabled={inviteToken.trim().length < 24 || submitting}
        label={submitting ? 'Binding invite...' : 'Bind invite'}
        onPress={onSubmitInviteToken}
      />
    </View>
  );
}

export default function ContactEmergencyModeScreen() {
  const { signOut } = useAccountAuth();
  const emergency = useContactEmergencyAccess();
  const [inviteToken, setInviteToken] = useState('');
  const assignment = emergency.selectedAssignment;
  const currentStatus = emergency.currentRequest?.status ?? null;
  const isWaiting = currentStatus ? WAITING_STATUSES.has(currentStatus) : false;
  const canBackupReview =
    assignment?.role === 'BACKUP' &&
    currentStatus === 'SECONDARY_REVIEW' &&
    emergency.currentRequest?.reviewRole === 'BACKUP_REVIEWER';
  const isActive = currentStatus === 'ACTIVE';
  const shouldShowHandover = Boolean(assignment);

  async function submitInviteToken(): Promise<void> {
    const token = inviteToken.trim();
    if (token.length < 24) {
      return;
    }
    try {
      await emergency.bindInviteToken(token);
      setInviteToken('');
    } catch {
      // The hook exposes the user-facing error.
    }
  }

  return (
    <Screen padded={false} safeStyle={styles.screen} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <Text style={styles.kicker}>Pusaka emergency contact</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void signOut()}
              style={styles.signOutButton}
            >
              <Text style={styles.signOutButtonText}>Sign out</Text>
            </Pressable>
          </View>
          <Text style={styles.heading}>Emergency mode</Text>
          <Text style={styles.lede}>
            A read-only space for contacting the right people and finding where to look.
          </Text>
        </View>

        {emergency.loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.goldLight} accessibilityLabel="Loading emergency mode" />
            <Text style={styles.mutedText}>Checking your emergency contact access...</Text>
          </View>
        ) : !assignment ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>No verified assignment</Text>
            <Text style={styles.panelText}>
              This account is not currently verified as a trusted contact for a Pusaka plan.
            </Text>
            {emergency.error ? (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {emergency.error}
              </Text>
            ) : null}
            <InviteTokenForm
              inviteToken={inviteToken}
              onChangeInviteToken={setInviteToken}
              onSubmitInviteToken={submitInviteToken}
              submitting={emergency.submitting}
            />
          </View>
        ) : (
          <>
            <View style={styles.statusPanel}>
              <Text style={styles.statusLabel}>Contact Home</Text>
              <Text style={styles.statusTitle}>
                You are a trusted contact for {plannerName(assignment.planner.name)}.
              </Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>{statusLabel(currentStatus)}</Text>
              </View>
              <Text style={styles.panelText}>
                Your read-only emergency handover is available now.
              </Text>
              {emergency.assignments.length > 1 ? (
                <View style={styles.assignmentList}>
                  {emergency.assignments.map((option) => {
                    const selected = option.id === assignment.id;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        key={option.id}
                        onPress={() => void emergency.selectAssignment(option.id)}
                        style={[
                          styles.assignmentButton,
                          selected && styles.assignmentButtonSelected
                        ]}
                      >
                        <Text
                          style={[
                            styles.assignmentButtonText,
                            selected && styles.assignmentButtonTextSelected
                          ]}
                        >
                          {plannerName(option.planner.name)}
                        </Text>
                        <Text style={styles.assignmentStatus}>
                          {statusLabel(option.latestRequest?.status ?? null)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>

            {emergency.error ? (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {emergency.error}
              </Text>
            ) : null}

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Bind Invite Token</Text>
              <Text style={styles.panelText}>
                Add another planner invitation to this emergency contact account.
              </Text>
              <InviteTokenForm
                inviteToken={inviteToken}
                onChangeInviteToken={setInviteToken}
                onSubmitInviteToken={submitInviteToken}
                submitting={emergency.submitting}
              />
            </View>

            {isWaiting ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Waiting for Review</Text>
                <Text style={styles.panelText}>
                  The planner has been notified. Access opens only after the review rules pass.
                </Text>
                <Text style={styles.detailLine}>
                  Cooling-off ends: {formatDate(emergency.currentRequest?.coolingOffEndsAt ?? null)}
                </Text>
              </View>
            ) : null}

            {canBackupReview ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Backup Confirmation</Text>
                <Text style={styles.panelText}>
                  Another trusted contact requested emergency access. Confirm only if the
                  planner cannot respond and the family needs the plan now.
                </Text>
                <View style={styles.actionGroup}>
                  <Button
                    disabled={emergency.submitting}
                    label={emergency.submitting ? 'Confirming...' : 'Confirm and activate'}
                    onPress={emergency.confirmBackupReview}
                  />
                  <Button
                    disabled={emergency.submitting}
                    label="Deny request"
                    onPress={emergency.denyBackupReview}
                    variant="danger"
                  />
                </View>
              </View>
            ) : null}

            {shouldShowHandover ? (
              <View style={styles.activeArea}>
                {emergency.handoverLoading ? (
                  <ActivityIndicator color={colors.goldLight} accessibilityLabel="Loading handover" />
                ) : emergency.handover ? (
                  <>
                    <Section title="Contacts & First Steps">
                      {emergency.handover.instruction.message ? (
                        <Text style={styles.message}>{emergency.handover.instruction.message}</Text>
                      ) : null}
                      {emergency.handover.steps.map((step, index) => (
                        <View key={`${step}-${index}`} style={styles.stepRow}>
                          <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>{index + 1}</Text>
                          </View>
                          <Text style={styles.stepText}>{step}</Text>
                        </View>
                      ))}
                      {emergency.handover.contacts.map((contact) => (
                        <View key={`${contact.name}-${contact.phone}`} style={styles.infoRow}>
                          <Text style={styles.infoTitle}>{contact.name}</Text>
                          <Text style={styles.infoText}>
                            {contact.role} · {getRelationLabel(contact.relation)} · {contact.phone}
                          </Text>
                          {contact.email ? <Text style={styles.infoText}>{contact.email}</Text> : null}
                        </View>
                      ))}
                    </Section>

                    <Section title="Family Context">
                      {emergency.handover.family.map((member) => (
                        <View key={`${member.name}-${member.relation}`} style={styles.infoRow}>
                          <Text style={styles.infoTitle}>{member.name}</Text>
                          <Text style={styles.infoText}>{getRelationLabel(member.relation)}</Text>
                          {member.detail ? <Text style={styles.infoText}>{member.detail}</Text> : null}
                        </View>
                      ))}
                    </Section>

                    <Section title="Where to Look">
                      {emergency.handover.locations.map((location) => (
                        <View key={`${location.category}-${location.name}`} style={styles.infoRow}>
                          <Text style={styles.infoTitle}>{location.name}</Text>
                          <Text style={styles.infoText}>{getCategoryLabel(location.category)}</Text>
                          <Text style={styles.infoText}>
                            {location.locationHint || 'No location hint saved'}
                          </Text>
                        </View>
                      ))}
                    </Section>

                    {isActive ? (
                      <View style={styles.panel}>
                        <Text style={styles.panelTitle}>Close Access</Text>
                        <Text style={styles.panelText}>
                          Close this access when the urgent coordination is complete.
                        </Text>
                        <Button
                          disabled={emergency.submitting}
                          label={emergency.submitting ? 'Closing access...' : 'Close emergency access'}
                          onPress={emergency.closeAccess}
                          variant="danger"
                        />
                      </View>
                    ) : null}
                  </>
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const emergencyBg = '#081f1b';
const emergencyPanel = '#102f29';
const emergencyBorder = '#245248';
const emergencyText = '#f4f1e8';
const emergencyMuted = '#b9cac4';

const styles = StyleSheet.create({
  screen: {
    backgroundColor: emergencyBg
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl
  },
  hero: {
    gap: spacing.sm
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between'
  },
  kicker: {
    flex: 1,
    fontSize: fontSizes.caption,
    fontWeight: '800',
    color: colors.goldLight,
    textTransform: 'uppercase'
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: emergencyBorder,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  signOutButtonText: {
    color: emergencyText,
    fontSize: fontSizes.caption,
    fontWeight: '800'
  },
  heading: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: emergencyText
  },
  lede: {
    fontSize: fontSizes.lead,
    lineHeight: 23,
    color: emergencyMuted
  },
  centerState: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md
  },
  mutedText: {
    fontSize: fontSizes.small,
    color: emergencyMuted
  },
  statusPanel: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radii.lg,
    padding: spacing.lg,
    backgroundColor: '#123a32'
  },
  statusLabel: {
    fontSize: fontSizes.caption,
    fontWeight: '800',
    color: colors.goldLight,
    textTransform: 'uppercase'
  },
  statusTitle: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    color: emergencyText
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gold
  },
  statusPillText: {
    fontSize: fontSizes.small,
    fontWeight: '800',
    color: colors.ink
  },
  panel: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: emergencyBorder,
    borderRadius: radii.lg,
    padding: spacing.lg,
    backgroundColor: emergencyPanel
  },
  panelTitle: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: emergencyText
  },
  panelText: {
    fontSize: fontSizes.small,
    lineHeight: 20,
    color: emergencyMuted
  },
  errorText: {
    fontSize: fontSizes.small,
    lineHeight: 20,
    color: '#ffc9b8'
  },
  form: {
    gap: spacing.md
  },
  fieldLabel: {
    fontSize: fontSizes.small,
    fontWeight: '800',
    color: emergencyText
  },
  singleLineInput: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: emergencyBorder,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.body,
    color: emergencyText,
    backgroundColor: emergencyBg
  },
  detailLine: {
    fontSize: fontSizes.small,
    fontWeight: '700',
    color: emergencyText
  },
  assignmentList: {
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  assignmentButton: {
    minHeight: 52,
    gap: spacing.xs,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: emergencyBorder,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: emergencyBg
  },
  assignmentButtonSelected: {
    borderColor: colors.goldLight,
    backgroundColor: '#2b4b3a'
  },
  assignmentButtonText: {
    fontSize: fontSizes.small,
    fontWeight: '800',
    color: emergencyMuted
  },
  assignmentButtonTextSelected: {
    color: emergencyText
  },
  assignmentStatus: {
    fontSize: fontSizes.caption,
    color: emergencyMuted
  },
  activeArea: {
    gap: spacing.lg
  },
  actionGroup: {
    gap: spacing.sm
  },
  section: {
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: emergencyBorder,
    paddingTop: spacing.lg
  },
  sectionTitle: {
    fontSize: fontSizes.caption,
    fontWeight: '800',
    color: colors.goldLight,
    textTransform: 'uppercase'
  },
  message: {
    fontSize: 18,
    lineHeight: 27,
    fontStyle: 'italic',
    color: emergencyText
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldLight
  },
  stepNumberText: {
    fontSize: fontSizes.small,
    fontWeight: '800',
    color: colors.ink
  },
  stepText: {
    flex: 1,
    fontSize: fontSizes.lead,
    lineHeight: 22,
    color: emergencyText
  },
  infoRow: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: emergencyBorder,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: '#0c2722'
  },
  infoTitle: {
    fontSize: fontSizes.title,
    fontWeight: '800',
    color: emergencyText
  },
  infoText: {
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: emergencyMuted
  }
});
