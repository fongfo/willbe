import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, Screen } from '../components';
import { colors, fontSizes, radii, spacing } from '../theme/tokens';
import {
  CheckInFrequency,
  cloudProviderOptions,
  frequencyOptions
} from './checkInOptions';

export default function CheckInCloudScreen() {
  const [frequency, setFrequency] = useState<CheckInFrequency>('QUARTERLY');
  const [selectedProvider, setSelectedProvider] = useState(cloudProviderOptions[0].value);
  const [connectedProvider, setConnectedProvider] = useState<string | null>(null);

  const selectedFrequency = useMemo(
    () => frequencyOptions.find((option) => option.value === frequency),
    [frequency]
  );
  const selectedCloudProvider = useMemo(
    () => cloudProviderOptions.find((option) => option.value === selectedProvider),
    [selectedProvider]
  );
  const isConnected = connectedProvider === selectedProvider;

  function handleConnectionToggle(): void {
    setConnectedProvider(isConnected ? null : selectedProvider);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Keep the plan fresh</Text>
        <Text style={styles.lede}>
          Choose how often Pusaka should prompt a family check-in, then connect the
          cloud folder your family already uses.
        </Text>

        <Card style={styles.card}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Check-in frequency</Text>
            <Badge label={selectedFrequency?.label ?? 'Quarterly'} tone="warn" />
          </View>

          <View style={styles.optionList}>
            {frequencyOptions.map((option) => {
              const selected = option.value === frequency;
              return (
                <Pressable
                  key={option.value}
                  accessibilityLabel={`${option.label} check-in frequency`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setFrequency(option.value)}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <View style={styles.radioWrap}>
                    <View style={[styles.radio, selected && styles.radioSelected]} />
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Cloud folder</Text>
            <Badge label={isConnected ? 'Connected' : 'Not connected'} tone="warn" />
          </View>

          <View style={styles.optionList}>
            {cloudProviderOptions.map((provider) => {
              const selected = provider.value === selectedProvider;
              return (
                <Pressable
                  key={provider.value}
                  accessibilityLabel={`${provider.label} cloud provider`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedProvider(provider.value)}
                  style={[styles.cloudOption, selected && styles.optionSelected]}
                >
                  <View style={styles.providerMark}>
                    <Text style={styles.providerInitials}>{provider.initials}</Text>
                  </View>
                  <View style={styles.optionCopy}>
                    <Text style={styles.optionLabel}>{provider.label}</Text>
                    <Text style={styles.optionDescription}>{provider.description}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Button
            label={isConnected ? `Disconnect ${selectedCloudProvider?.label}` : `Connect ${selectedCloudProvider?.label}`}
            onPress={handleConnectionToggle}
            variant={isConnected ? 'secondary' : 'primary'}
            style={styles.connectButton}
          />
        </Card>

        <View style={styles.summary} accessibilityRole="summary">
          <Text style={styles.summaryTitle}>Current setup</Text>
          <Text style={styles.summaryText}>
            Next review cadence: {selectedFrequency?.label}. Cloud status:{' '}
            {connectedProvider ? `Connected to ${selectedCloudProvider?.label}.` : 'No folder connected yet.'}
          </Text>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Pusaka stores review cadence and folder labels only. It does not read
            files, sync document contents, or store cloud passwords in this preview.
          </Text>
        </View>
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
  card: {
    gap: spacing.md
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted
  },
  optionList: {
    gap: spacing.sm
  },
  option: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.white
  },
  cloudOption: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.white
  },
  optionSelected: {
    borderColor: colors.teal,
    backgroundColor: '#eef6f3'
  },
  radioWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: '#c8d8d2'
  },
  radioSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.teal
  },
  providerMark: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink
  },
  providerInitials: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white
  },
  optionCopy: {
    flex: 1,
    gap: spacing.xs
  },
  optionLabel: {
    fontSize: fontSizes.title,
    fontWeight: '700',
    color: colors.ink
  },
  optionDescription: {
    fontSize: fontSizes.small,
    color: colors.muted2,
    lineHeight: 19
  },
  connectButton: {
    marginTop: spacing.xs
  },
  summary: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.successBg
  },
  summaryTitle: {
    fontSize: fontSizes.small,
    fontWeight: '700',
    color: colors.successText
  },
  summaryText: {
    marginTop: spacing.xs,
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.ink
  },
  notice: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: '#eef4f1'
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted2
  }
});
