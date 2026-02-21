import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SESSION_KEY = 'agroshop_session_id';
const POLL_ANSWERED_PREFIX = 'agroshop_poll_';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

interface Poll {
  id: string;
  question: string;
  options: string[];
  show_on_pages: string[];
}

export function PollWidget() {
  const location = useLocation();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<number[]>([]);

  useEffect(() => {
    const fetchPoll = async () => {
      const { data } = await supabase
        .from('polls')
        .select('*')
        .eq('active', true)
        .limit(1)
        .single();

      if (data) {
        const opts = Array.isArray(data.options) ? data.options as string[] : [];
        const pages = Array.isArray(data.show_on_pages) ? data.show_on_pages : [];
        
        // Check if already answered
        if (sessionStorage.getItem(POLL_ANSWERED_PREFIX + data.id)) return;
        
        // Check if should show on this page
        if (pages.length > 0 && !pages.some((p: string) => location.pathname.startsWith(p))) return;

        setPoll({ ...data, options: opts, show_on_pages: pages });
      }
    };
    fetchPoll();
  }, [location.pathname]);

  if (!poll || dismissed) return null;

  const handleVote = async (index: number) => {
    setSelectedOption(index);
    try {
      await supabase.from('poll_responses').insert({
        poll_id: poll.id,
        option_index: index,
        session_id: getSessionId(),
      });
      sessionStorage.setItem(POLL_ANSWERED_PREFIX + poll.id, '1');

      // Fetch results
      const { data } = await supabase
        .from('poll_responses')
        .select('option_index')
        .eq('poll_id', poll.id);

      const counts = new Array(poll.options.length).fill(0);
      for (const r of data || []) {
        if (r.option_index < counts.length) counts[r.option_index]++;
      }
      setResults(counts);
      setSubmitted(true);
    } catch {
      toast.error('Erro ao enviar voto');
    }
  };

  const total = results.reduce((a, b) => a + b, 0);

  return (
    <div className="fixed bottom-24 left-4 z-40 w-72 bg-card border border-border rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm text-foreground">Enquete</h4>
        </div>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm text-foreground mb-3">{poll.question}</p>

      <div className="space-y-2">
        {poll.options.map((option, i) => {
          const pct = submitted && total > 0 ? Math.round((results[i] / total) * 100) : 0;
          return (
            <button
              key={i}
              onClick={() => !submitted && handleVote(i)}
              disabled={submitted}
              className={`w-full text-left text-sm p-2.5 rounded-lg border transition-all relative overflow-hidden ${
                submitted
                  ? selectedOption === i
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                  : 'border-border hover:border-primary hover:bg-primary/5 cursor-pointer'
              }`}
            >
              {submitted && (
                <div
                  className="absolute inset-0 bg-primary/10 transition-all"
                  style={{ width: `${pct}%` }}
                />
              )}
              <span className="relative z-10 flex justify-between">
                <span>{option}</span>
                {submitted && <span className="text-muted-foreground">{pct}%</span>}
              </span>
            </button>
          );
        })}
      </div>

      {submitted && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {total} voto{total !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
