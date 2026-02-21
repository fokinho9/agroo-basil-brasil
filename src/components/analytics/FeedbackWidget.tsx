import { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SESSION_KEY = 'agroshop_session_id';
const FEEDBACK_SENT_KEY = 'agroshop_feedback_sent';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const emojis = [
  { value: 1, emoji: '😡', label: 'Péssimo' },
  { value: 2, emoji: '😕', label: 'Ruim' },
  { value: 3, emoji: '😐', label: 'Ok' },
  { value: 4, emoji: '😊', label: 'Bom' },
  { value: 5, emoji: '🤩', label: 'Ótimo' },
];

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(() => !!sessionStorage.getItem(FEEDBACK_SENT_KEY));

  if (submitted) return null;

  const handleSubmit = async () => {
    if (!rating) return;
    try {
      await supabase.from('feedback').insert({
        session_id: getSessionId(),
        path: window.location.pathname,
        rating,
        comment: comment.trim() || null,
      });
      sessionStorage.setItem(FEEDBACK_SENT_KEY, '1');
      setSubmitted(true);
      setIsOpen(false);
      toast.success('Obrigado pelo feedback!');
    } catch {
      toast.error('Erro ao enviar feedback');
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 z-40 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:scale-105 transition-transform"
          aria-label="Dar feedback"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-72 bg-card border border-border rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm text-foreground">Como está sua experiência?</h4>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex justify-between mb-4">
            {emojis.map((e) => (
              <button
                key={e.value}
                onClick={() => setRating(e.value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                  rating === e.value 
                    ? 'bg-primary/10 scale-110' 
                    : 'hover:bg-muted'
                }`}
              >
                <span className="text-2xl">{e.emoji}</span>
                <span className="text-[10px] text-muted-foreground">{e.label}</span>
              </button>
            ))}
          </div>

          {rating && (
            <>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Algum comentário? (opcional)"
                className="w-full bg-muted border-0 rounded-lg p-2 text-sm resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary mb-3"
                maxLength={500}
              />
              <Button size="sm" className="w-full gap-2" onClick={handleSubmit}>
                <Send className="h-3 w-3" />
                Enviar
              </Button>
            </>
          )}
        </div>
      )}
    </>
  );
}
