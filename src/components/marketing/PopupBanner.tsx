import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const POPUP_DISMISSED_KEY = 'popup_dismissed_';

export function PopupBanner() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: popups } = useQuery({
    queryKey: ['active-popups'],
    queryFn: async () => {
      const { data, error } = await supabase.from('popup_banners').select('*').eq('active', true);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });

  const popup = popups?.[0]; // Show first active popup

  useEffect(() => {
    if (!popup) return;
    if (popup.show_once && sessionStorage.getItem(POPUP_DISMISSED_KEY + popup.id)) return;

    const timer = setTimeout(() => setVisible(true), (popup.delay_seconds || 3) * 1000);
    return () => clearTimeout(timer);
  }, [popup]);

  const dismiss = () => {
    setVisible(false);
    if (popup?.show_once) sessionStorage.setItem(POPUP_DISMISSED_KEY + popup.id, '1');
  };

  const handleEmailSubmit = async () => {
    if (!emailInput.trim()) return;
    await supabase.from('email_captures').insert({ email: emailInput.trim(), source: 'popup' });
    setSubmitted(true);
    setTimeout(dismiss, 2000);
  };

  if (!visible || !popup) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/50 animate-in fade-in duration-300" onClick={dismiss}>
      <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
        <button onClick={dismiss} className="absolute top-3 right-3 z-10 p-1 rounded-full bg-background/80 hover:bg-muted transition-colors">
          <X className="h-5 w-5" />
        </button>

        {popup.image_url && popup.popup_type === 'banner' && (
          <img src={popup.image_url} alt="" className="w-full h-48 object-cover" />
        )}

        <div className="p-6 text-center">
          {popup.title && <h3 className="text-xl font-bold text-foreground mb-2">{popup.title}</h3>}
          {popup.description && <p className="text-muted-foreground mb-4">{popup.description}</p>}

          {popup.popup_type === 'email_capture' ? (
            submitted ? (
              <p className="text-primary font-medium">✓ Cadastrado com sucesso!</p>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Seu melhor email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                />
                <Button onClick={handleEmailSubmit}>{popup.button_text || 'Enviar'}</Button>
              </div>
            )
          ) : (
            <Link to={popup.button_link || '/produtos'} onClick={dismiss}>
              <Button className="w-full">{popup.button_text || 'Ver Oferta'}</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
