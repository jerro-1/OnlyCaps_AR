import { useEffect, useRef } from 'react';

// Calls `onIntersect` once the returned ref's element scrolls near the
// viewport, so a product grid can load more items on its own instead of
// behind a "Load more" button. Pass `enabled: false` once there's nothing
// left to load, so it stops watching.
export function useInfiniteScroll(onIntersect, enabled = true) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onIntersect();
      },
      { rootMargin: '600px' } // start loading well before the user actually hits bottom
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [onIntersect, enabled]);

  return sentinelRef;
}
