import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PageView {
  id: string;
  session_id: string;
  path: string;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  source_label: string;
  device_type: string;
  browser: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  created_at: string;
}

export function usePageViews24h() {
  return useQuery({
    queryKey: ['page-views-24h'],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data || []) as PageView[];
    },
    refetchInterval: 30000, // every 30s
  });
}

export function useRealtimeVisitors() {
  return useQuery({
    queryKey: ['realtime-visitors'],
    queryFn: async () => {
      // "Online" = had a page view in the last 5 minutes
      const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('page_views')
        .select('session_id, source_label, path, device_type, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Deduplicate by session_id (keep latest)
      const seen = new Map<string, any>();
      for (const row of data || []) {
        if (!seen.has(row.session_id)) {
          seen.set(row.session_id, row);
        }
      }
      return Array.from(seen.values());
    },
    refetchInterval: 10000, // every 10s
  });
}
