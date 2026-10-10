import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Minimal data-fetching hook.
 *   const { data, loading, error, run } = useAsync(() => adminApi.dashboard(), []);
 * `run` re-executes the fetcher (used by pull-to-refresh and mutations).
 */
export function useAsync(fetcher, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mounted.current) setData(result);
      return result;
    } catch (err) {
      if (mounted.current) setError(err);
      throw err;
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) run().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, immediate]);

  return { data, loading, refreshing, error, run, setData };
}

/** Re-run the fetcher every time the screen regains focus (keeps dashboards live). */
export function useReloadOnFocus(run) {
  useFocusEffect(
    useCallback(() => {
      run().catch(() => {});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [run]),
  );
}

export default useAsync;
