import { useEffect, useRef } from 'react';
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

export function ScrollTracker() {
  const location = useLocation();
  const maxDepthRef = useRef(0);
  const savedRef = useRef(false);

  useEffect(() => {
    maxDepthRef.current = 0;
    savedRef.current = false;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const depth = Math.round((scrollTop / docHeight) * 100);
      if (depth > maxDepthRef.current) {
        maxDepthRef.current = depth;
      }
    };

    const saveDepth = async () => {
      if (savedRef.current || maxDepthRef.current === 0) return;
      savedRef.current = true;
      try {
        await supabase.from('scroll_events').insert({
          session_id: getSessionId(),
          path: location.pathname,
          max_depth: maxDepthRef.current,
        });
      } catch (e) {
        // silent
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', saveDepth);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', saveDepth);
      saveDepth();
    };
  }, [location.pathname]);

  return null;
}
