import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { Badge, Card, Screen } from '../components';
import { colors, fontSizes, radii, spacing } from '../theme/tokens';
import type { ChatMessage } from './chat.types';
import { useAiAssistant } from './useAiAssistant';

interface AiAssistantScreenProps {
  assistant?: ReturnType<typeof useAiAssistant>;
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View
      style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble
      ]}
    >
      <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>
        {message.content}
      </Text>
    </View>
  );
}

export default function AiAssistantScreen({ assistant }: AiAssistantScreenProps) {
  const fallbackAssistant = useAiAssistant();
  const { messages, latestReply, sending, error, send } =
    assistant ?? fallbackAssistant;
  const [draft, setDraft] = useState('');
  const trimmedDraft = draft.trim();

  async function handleSend(): Promise<void> {
    if (!trimmedDraft || sending) {
      return;
    }
    const outgoing = trimmedDraft;
    setDraft('');
    await send(outgoing);
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? spacing.xl : 0}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.heading}>AI assistant</Text>
            <Text style={styles.lede}>
              Ask about setup, trusted contacts, readiness gaps, or handover steps.
            </Text>
          </View>
          <Badge label="Beta" tone="warn" />
        </View>

        <Card style={styles.notice}>
          <Text style={styles.noticeText}>
            Pusaka AI gives product guidance only. It does not provide legal,
            financial, or insurance advice.
          </Text>
        </Card>

        <ScrollView
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message, index) => (
            <Bubble key={`${message.role}-${index}-${message.content}`} message={message} />
          ))}

          {sending ? (
            <View style={[styles.bubble, styles.assistantBubble, styles.loadingBubble]}>
              <ActivityIndicator color={colors.teal} accessibilityLabel="Assistant is replying" />
              <Text style={styles.loadingText}>Drafting a response</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {latestReply?.citations.length ? (
            <View style={styles.sources}>
              <Text style={styles.sourcesTitle}>Sources</Text>
              {latestReply.citations.slice(0, 2).map((citation) => (
                <Text key={citation.id} style={styles.sourceText}>
                  {citation.title} · {citation.source.section}
                </Text>
              ))}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Message AI assistant"
            editable={!sending}
            multiline
            onChangeText={setDraft}
            placeholder="Ask how Pusaka works..."
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={draft}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: sending || !trimmedDraft }}
            disabled={sending || !trimmedDraft}
            onPress={() => void handleSend()}
            style={[
              styles.sendButton,
              (sending || !trimmedDraft) && styles.sendButtonDisabled
            ]}
          >
            <Text style={styles.sendLabel}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  headerText: {
    flex: 1,
    gap: spacing.xs
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
  notice: {
    padding: spacing.md,
    borderColor: colors.borderSoft,
    backgroundColor: colors.successBg
  },
  noticeText: {
    fontSize: fontSizes.small,
    lineHeight: 19,
    color: colors.ink
  },
  messages: {
    flexGrow: 1,
    gap: spacing.sm,
    paddingBottom: spacing.lg
  },
  bubble: {
    maxWidth: '86%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.teal
  },
  bubbleText: {
    fontSize: fontSizes.body,
    lineHeight: 21,
    color: colors.ink
  },
  userBubbleText: {
    color: colors.white
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  loadingText: {
    fontSize: fontSizes.small,
    color: colors.muted2
  },
  error: {
    fontSize: fontSizes.small,
    color: colors.dangerText
  },
  sources: {
    gap: spacing.xs,
    paddingTop: spacing.xs
  },
  sourcesTitle: {
    fontSize: fontSizes.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted
  },
  sourceText: {
    fontSize: fontSizes.caption,
    lineHeight: 16,
    color: colors.muted2
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 112,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    color: colors.ink,
    fontSize: fontSizes.body,
    lineHeight: 20
  },
  sendButton: {
    minWidth: 72,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.teal
  },
  sendButtonDisabled: {
    opacity: 0.5
  },
  sendLabel: {
    fontSize: fontSizes.body,
    fontWeight: '700',
    color: colors.white
  }
});
