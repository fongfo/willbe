import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

interface RefreshOptions {
  signal?: AbortSignal;
}

type RefreshHandler = (options?: RefreshOptions) => Promise<void>;

export function useRefreshOnFocus(refresh: RefreshHandler): void {
  const didHandleInitialFocus = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!didHandleInitialFocus.current) {
        didHandleInitialFocus.current = true;
        return undefined;
      }

      const controller = new AbortController();
      void refresh({ signal: controller.signal });

      return () => controller.abort();
    }, [refresh])
  );
}
