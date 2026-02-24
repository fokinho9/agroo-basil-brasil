import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'agroshop_session_id';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

interface SectionTime {
  sectionId: string;
  startTime: number | null;
  totalMs: number;
}

/**
 * Tracks how long each data-section element is visible on screen.
 * Add data-section="section-name" to any element you want to track.
 * Batches inserts on page leave for performance.
 */
export function SectionTracker() {
  const location = useLocation();
  const sectionsRef = useRef<Map<string, SectionTime>>(new Map());
  const savedRef = useRef(false);

  const flush = useCallback(async () => {
    if (savedRef.current) return;
    savedRef.current = true;

    const now = performance.now();
    const rows: { session_id: string; path: string; section_id: string; time_visible_ms: number }[] = [];
    const sessionId = getSessionId();
    const path = location.pathname;

    for (const [, sec] of sectionsRef.current) {
      let total = sec.totalMs;
      if (sec.startTime !== null) {
        total += now - sec.startTime;
      }
      if (total > 500) { // only save if visible > 500ms
        rows.push({
          session_id: sessionId,
          path,
          section_id: sec.sectionId,
          time_visible_ms: Math.round(total),
        });
      }
    }

    if (rows.length > 0) {
      try {
        await supabase.from('section_views').insert(rows);
      } catch {
        // silent
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    sectionsRef.current = new Map();
    savedRef.current = false;

    const elements = document.querySelectorAll('[data-section]');
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const now = performance.now();
        for (const entry of entries) {
          const sectionId = (entry.target as HTMLElement).dataset.section!;
          let sec = sectionsRef.current.get(sectionId);
          if (!sec) {
            sec = { sectionId, startTime: null, totalMs: 0 };
            sectionsRef.current.set(sectionId, sec);
          }

          if (entry.isIntersecting) {
            if (sec.startTime === null) sec.startTime = now;
          } else {
            if (sec.startTime !== null) {
              sec.totalMs += now - sec.startTime;
              sec.startTime = null;
            }
          }
        }
      },
      { threshold: 0.3 }
    );

    elements.forEach((el) => observer.observe(el));

    const handleBeforeUnload = () => flush();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      observer.disconnect();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      flush();
    };
  }, [location.pathname, flush]);

  return null;
}
