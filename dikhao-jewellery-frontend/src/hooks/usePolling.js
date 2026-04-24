import { useEffect, useRef } from 'react';

// Calls `fn` every `intervalMs`. Stops when fn returns truthy `stop` or on unmount.
// fn signature: async () => { stop?: boolean }
export function usePolling(fn, intervalMs = 3000) {
  const savedFn = useRef(fn);
  useEffect(() => { savedFn.current = fn; }, [fn]);

  useEffect(() => {
    let cancelled = false;
    let timer;
    const tick = async () => {
      if (cancelled) return;
      try {
        const result = await savedFn.current();
        if (result?.stop) return;
      } catch {}
      timer = setTimeout(tick, intervalMs);
    };
    tick();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [intervalMs]);
}
