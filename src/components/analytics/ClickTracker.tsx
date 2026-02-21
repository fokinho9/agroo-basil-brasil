import { useEffect, useCallback, useRef } from 'react';
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

export function ClickTracker() {
  const bufferRef = useRef<any[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (bufferRef.current.length === 0) return;
    const batch = [...bufferRef.current];
    bufferRef.current = [];
    try {
      await supabase.from('click_events').insert(batch);
    } catch (e) {
      // silent fail
    }
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      const scrollY = window.scrollY;
      const y = e.clientY + scrollY;

      bufferRef.current.push({
        session_id: getSessionId(),
        path: window.location.pathname,
        x: e.clientX,
        y,
        viewport_width: window.innerWidth,
        viewport_height: document.documentElement.scrollHeight,
        element_tag: target.tagName?.toLowerCase() || null,
        element_text: target.textContent?.slice(0, 50) || null,
      });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, 2000);
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      flush();
    };
  }, [flush]);

  return null;
}
