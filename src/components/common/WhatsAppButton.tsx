import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useFloatingButton } from '@/contexts/FloatingButtonContext';
import { createWhatsAppLink } from '@/lib/utils';
import { useUtmDefaults, appendUtmToUrl } from '@/hooks/useUtmDefaults';

const quickMessages = [
  {
    label: '🛒 Dúvida sobre produto',
    message: 'Olá! Gostaria de saber mais sobre um produto que vi no site.',
  },
  {
    label: '📦 Rastrear meu pedido',
    message: 'Olá! Gostaria de rastrear meu pedido. Pode me ajudar?',
  },
  {
    label: '💬 Falar com atendente',
    message: 'Olá! Preciso de ajuda com minha compra.',
  },
];

export function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: settings } = useSiteSettings();
  const { isFloatingBuyVisible } = useFloatingButton();
  const utmDefaults = useUtmDefaults();

  const whatsappSettings = settings?.whatsapp || {
    number: '5511972238165',
    message: 'Olá! Vim do site e gostaria de mais informações.',
  };

  const sendMessage = (msg: string) => {
    const siteUrl = window.location.origin;
    const trackedUrl = appendUtmToUrl(siteUrl, {
      utm_source: utmDefaults.whatsapp_source,
      utm_medium: utmDefaults.whatsapp_medium,
      utm_campaign: utmDefaults.whatsapp_campaign || 'whatsapp-button',
    });
    const fullMessage = `${msg}\n\n${trackedUrl}`;
    window.open(createWhatsAppLink(whatsappSettings.number, fullMessage), '_blank');
    setIsOpen(false);
  };

  return (
    <div className={`fixed left-4 md:left-6 z-40 ${isFloatingBuyVisible ? 'bottom-28 md:bottom-32' : 'bottom-6 md:bottom-8'}`}>
      {/* Chat popup */}
      {isOpen && (
        <div className="mb-3 bg-card border border-border rounded-2xl shadow-2xl w-72 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="bg-success px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-success-foreground" />
              <span className="text-success-foreground font-semibold text-sm">WhatsApp</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-success-foreground/80 hover:text-success-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              Olá! Como podemos te ajudar? Escolha uma opção:
            </p>
            {quickMessages.map((qm, i) => (
              <button
                key={i}
                onClick={() => sendMessage(qm.message)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-border bg-muted/50 hover:bg-accent hover:border-accent text-sm text-foreground transition-colors text-left"
              >
                <span>{qm.label}</span>
                <Send className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-success hover:bg-success/90 text-success-foreground rounded-full p-5 md:p-6 shadow-xl transition-all hover:scale-110 animate-bounce-subtle"
        aria-label="Falar pelo WhatsApp"
      >
        {isOpen ? <X className="h-7 w-7 md:h-8 md:w-8" /> : <MessageCircle className="h-7 w-7 md:h-8 md:w-8" />}
      </button>
    </div>
  );
}
