import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Timer, X } from 'lucide-react';

export function CountdownBar() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [dismissed, setDismissed] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['countdown-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('key, value').in('key', ['countdown_end', 'countdown_text']);
      const map: Record<string, string> = {};
      for (const s of data || []) map[s.key] = (s.value as any)?.value || '';
      return map;
    },
    staleTime: 60000,
  });

  const endDate = settings?.countdown_end ? new Date(settings.countdown_end) : null;
  const text = settings?.countdown_text || '';

  useEffect(() => {
    if (!endDate || isNaN(endDate.getTime())) return;

    const update = () => {
      const diff = endDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endDate?.getTime()]);

  if (!endDate || isNaN(endDate.getTime()) || dismissed) return null;
  if (endDate.getTime() <= Date.now()) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="w-full bg-destructive text-destructive-foreground py-2 px-4 relative">
      <div className="container mx-auto flex items-center justify-center gap-3 text-sm">
        <Timer className="h-4 w-4 flex-shrink-0 animate-pulse" />
        {text && <span className="font-medium hidden sm:inline">{text}</span>}
        <div className="flex items-center gap-1 font-mono font-bold tabular-nums">
          <span className="bg-background/20 rounded px-1.5 py-0.5">{pad(timeLeft.hours)}</span>
          <span>:</span>
          <span className="bg-background/20 rounded px-1.5 py-0.5">{pad(timeLeft.minutes)}</span>
          <span>:</span>
          <span className="bg-background/20 rounded px-1.5 py-0.5">{pad(timeLeft.seconds)}</span>
        </div>
      </div>
      <button onClick={() => setDismissed(true)} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
