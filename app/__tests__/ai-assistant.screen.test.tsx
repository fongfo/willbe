import { act, fireEvent, render, screen } from '@testing-library/react-native';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from 'react-native';
import appConfig from '../app.json';
import AssistantTab from '../src/app/(tabs)/assistant';
import AiAssistantScreen from '../src/ai-assistant/AiAssistantScreen';
import * as chatApi from '../src/ai-assistant/chat.api';
import type { ChatReplyResponse } from '../src/ai-assistant/chat.types';
import { spacing } from '../src/theme/tokens';

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

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

function setPlatform(os: 'android' | 'ios'): () => void {
  const originalOs = Platform.OS;
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
  return () => Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs });
}

function mockAndroidKeyboard(initialWindowHeight = 800) {
  let windowHeight = initialWindowHeight;
  const keyboardListeners: Partial<
    Record<
      Parameters<typeof Keyboard.addListener>[0],
      Parameters<typeof Keyboard.addListener>[1]
    >
  > = {};
  let dimensionListener: Parameters<typeof Dimensions.addEventListener>[1] | null = null;

  jest.spyOn(Dimensions, 'get').mockImplementation((dimension) => ({
    width: 390,
    height: dimension === 'window' ? windowHeight : initialWindowHeight,
    scale: 1,
    fontScale: 1
  }));
  jest.spyOn(Dimensions, 'addEventListener').mockImplementation((_type, listener) => {
    dimensionListener = listener;
    return { remove: jest.fn() } as unknown as ReturnType<typeof Dimensions.addEventListener>;
  });
  jest.spyOn(Keyboard, 'addListener').mockImplementation((eventName, listener) => {
    keyboardListeners[eventName] = listener;
    return { remove: jest.fn() } as unknown as ReturnType<typeof Keyboard.addListener>;
  });

  return {
    showKeyboard(height: number): void {
      keyboardListeners.keyboardDidShow?.({
        duration: 0,
        easing: 'keyboard',
        endCoordinates: {
          screenX: 0,
          screenY: windowHeight - height,
          width: 390,
          height
        }
      });
    },
    hideKeyboard(): void {
      keyboardListeners.keyboardDidHide?.({
        duration: 0,
        easing: 'keyboard',
        endCoordinates: {
          screenX: 0,
          screenY: windowHeight,
          width: 390,
          height: 0
        }
      });
    },
    resizeWindow(height: number): void {
      windowHeight = height;
      dimensionListener?.({
        window: {
          width: 390,
          height,
          scale: 1,
          fontScale: 1
        },
        screen: {
          width: 390,
          height: initialWindowHeight,
          scale: 1,
          fontScale: 1
        }
      });
    }
  };
}

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

  it('keeps Android KeyboardAvoidingView disabled while using a composer inset fallback', () => {
    const restorePlatform = setPlatform('android');

    try {
      const view = render(<AiAssistantScreen />).UNSAFE_getByType(
        KeyboardAvoidingView
      );

      expect(view.props.behavior).toBeUndefined();
      expect(view.props.enabled).toBe(false);
    } finally {
      restorePlatform();
    }
  });

  it('adds Android composer clearance when the keyboard opens without window resize', () => {
    const restorePlatform = setPlatform('android');
    const keyboard = mockAndroidKeyboard();

    try {
      render(<AiAssistantScreen />);

      act(() => keyboard.showKeyboard(300));

      const composerStyle = StyleSheet.flatten(screen.getByTestId('ai-composer').props.style);
      expect(composerStyle.paddingBottom).toBe(spacing.sm + 300);

      act(() => keyboard.hideKeyboard());

      const resetStyle = StyleSheet.flatten(screen.getByTestId('ai-composer').props.style);
      expect(resetStyle.paddingBottom).toBe(spacing.sm);
    } finally {
      restorePlatform();
    }
  });

  it('only adds the Android keyboard clearance not already handled by window resize', () => {
    const restorePlatform = setPlatform('android');
    const keyboard = mockAndroidKeyboard();

    try {
      render(<AiAssistantScreen />);

      act(() => {
        keyboard.resizeWindow(600);
        keyboard.showKeyboard(300);
      });

      const composerStyle = StyleSheet.flatten(screen.getByTestId('ai-composer').props.style);
      expect(composerStyle.paddingBottom).toBe(spacing.sm + 100);
    } finally {
      restorePlatform();
    }
  });

  it('keeps padding-based keyboard avoidance on iOS', () => {
    const restorePlatform = setPlatform('ios');

    try {
      const view = render(<AiAssistantScreen />).UNSAFE_getByType(
        KeyboardAvoidingView
      );

      expect(view.props.behavior).toBe('padding');
      expect(view.props.keyboardVerticalOffset).toBeGreaterThan(0);
    } finally {
      restorePlatform();
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
