import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useRefreshOnFocus } from '../src/navigation/useRefreshOnFocus';

const focusCallbacks: (() => void | (() => void))[] = [];

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    focusCallbacks.push(callback);
  }
}));

interface RefreshOptions {
  signal?: AbortSignal;
}

function RefreshHarness({ refresh }: { refresh: (options?: RefreshOptions) => Promise<void> }) {
  useRefreshOnFocus(refresh);
  return <Text>ready</Text>;
}

afterEach(() => {
  focusCallbacks.length = 0;
  jest.clearAllMocks();
});

describe('useRefreshOnFocus', () => {
  it('skips the initial focus and refreshes on later focus events', () => {
    const refresh = jest.fn(async (_options?: RefreshOptions) => undefined);
    render(<RefreshHarness refresh={refresh} />);

    expect(focusCallbacks).toHaveLength(1);
    focusCallbacks[0]();
    expect(refresh).not.toHaveBeenCalled();

    focusCallbacks[0]();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) });
  });

  it('aborts an in-flight refresh when focus is cleaned up', () => {
    const refresh = jest.fn(async (_options?: RefreshOptions) => undefined);
    render(<RefreshHarness refresh={refresh} />);

    focusCallbacks[0]();
    const cleanup = focusCallbacks[0]();
    const signal = refresh.mock.calls[0][0]?.signal;
    expect(signal?.aborted).toBe(false);

    if (cleanup) {
      cleanup();
    }

    expect(signal?.aborted).toBe(true);
  });
});
