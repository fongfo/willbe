import { fireEvent, render, screen } from '@testing-library/react-native';
import { KeyboardAvoidingView, Platform } from 'react-native';
import appConfig from '../app.json';
import AssistantTab from '../src/app/(tabs)/assistant';
import AiAssistantScreen from '../src/ai-assistant/AiAssistantScreen';
import * as chatApi from '../src/ai-assistant/chat.api';
import type { ChatReplyResponse } from '../src/ai-assistant/chat.types';

jest.mock('../src/ai-assistant/chat.api');

const mockedChatApi = chatApi as jest.Mocked<typeof chatApi>;

const reply: ChatReplyResponse = {
  message: 'Start with trusted contacts, then add asset references.',
  citations: [
    {
      id: 'plan',
      title: 'Pusaka planning flow',
      source: { document: 'Product FAQ', section: 'Getting started' },
      score: 0.88
    }
  ],
  disclaimerRequired: true,
  answerPolicy: {
    responseMode: 'grounded_rag_context_only',
    disclaimerRequired: true,
    prohibitedAdvice: ['financial', 'legal', 'insurance']
  },
  provider: {
    name: 'anthropic',
    model: 'claude-3-5-sonnet-latest'
  }
};

afterEach(() => jest.clearAllMocks());

describe('AiAssistantScreen', () => {
  it('renders the assistant intro and compliance notice', () => {
    render(<AiAssistantScreen />);

    expect(screen.getByText('AI assistant')).toBeTruthy();
    expect(screen.getByText(/does not provide legal/)).toBeTruthy();
    expect(screen.getByText(/Pusaka setup/)).toBeTruthy();
  });

  it('sends a message and renders the assistant reply with sources', async () => {
    mockedChatApi.sendChatMessage.mockResolvedValue(reply);

    render(<AiAssistantScreen />);

    fireEvent.changeText(
      screen.getByLabelText('Message AI assistant'),
      'How should I start?'
    );
    fireEvent.press(screen.getByText('Send'));

    expect(screen.getByText('How should I start?')).toBeTruthy();
    expect(await screen.findByText(reply.message)).toBeTruthy();
    expect(screen.getByText('Pusaka planning flow · Getting started')).toBeTruthy();
    expect(mockedChatApi.sendChatMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'How should I start?',
        locale: 'en',
        history: expect.any(Array)
      })
    );
  });

  it('keeps empty messages local and disables send', () => {
    render(<AiAssistantScreen />);

    fireEvent.press(screen.getByText('Send'));

    expect(mockedChatApi.sendChatMessage).not.toHaveBeenCalled();
  });

  it('relies on Android window resize without applying a second height adjustment', () => {
    const originalOs = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });

    try {
      const view = render(<AiAssistantScreen />).UNSAFE_getByType(
        KeyboardAvoidingView
      );

      expect(view.props.behavior).toBeUndefined();
      expect(view.props.enabled).toBe(false);
    } finally {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs });
    }
  });

  it('keeps padding-based keyboard avoidance on iOS', () => {
    const originalOs = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });

    try {
      const view = render(<AiAssistantScreen />).UNSAFE_getByType(
        KeyboardAvoidingView
      );

      expect(view.props.behavior).toBe('padding');
      expect(view.props.keyboardVerticalOffset).toBeGreaterThan(0);
    } finally {
      Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs });
    }
  });

  it('locks Android to resize the app window when the keyboard opens', () => {
    expect(appConfig.expo.android.softwareKeyboardLayoutMode).toBe('resize');
  });

  it('shows API errors without dropping the user message', async () => {
    mockedChatApi.sendChatMessage.mockRejectedValue(new Error('Chat unavailable'));

    render(<AiAssistantScreen />);

    fireEvent.changeText(screen.getByLabelText('Message AI assistant'), 'Help');
    fireEvent.press(screen.getByText('Send'));

    expect(await screen.findByText('Chat unavailable')).toBeTruthy();
    expect(screen.getByText('Help')).toBeTruthy();
  });

  it('is exposed through the assistant tab route', () => {
    render(<AssistantTab />);

    expect(screen.getByText('AI assistant')).toBeTruthy();
  });
});
