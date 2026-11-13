import { useEffect } from 'react';
import { reviewsApi } from '@/api/reviewsApi';

let eventQueue = Promise.resolve();
export function recordJourney(draftId, screenId, kind, details = {}) {
  if (!draftId || !screenId) return;
  const width = window.innerWidth;
  if (!crypto.randomUUID) return;
  const event = { id: crypto.randomUUID(), screenId, kind,
    device: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop', ...details };
  // Best effort only. Tracking never blocks saving, navigation, or submission.
  eventQueue = eventQueue.then(() => reviewsApi.journeyEvent(draftId, event)).catch(() => {});
}

export function useJourneyScreen(draftId, screenId) {
  useEffect(() => {
    if (!draftId || !screenId) return;
    recordJourney(draftId, screenId, 'view');
    let previous = performance.now();
    let visible = document.visibilityState === 'visible';
    function flush() {
      const now = performance.now();
      const activeMs = visible ? Math.min(30000, Math.max(0, Math.round(now - previous))) : 0;
      previous = now;
      if (activeMs > 0) recordJourney(draftId, screenId, 'active', { activeMs });
    }
    function visibility() { flush(); visible = document.visibilityState === 'visible'; }
    const timer = window.setInterval(flush, 15000);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', flush);
    return () => {
      flush(); window.clearInterval(timer);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [draftId, screenId]);
}
