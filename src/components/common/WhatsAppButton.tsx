import { MessageCircle } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useFloatingButton } from '@/contexts/FloatingButtonContext';
import { createWhatsAppLink } from '@/lib/utils';

export function WhatsAppButton() {
  const { data: settings } = useSiteSettings();
  const { isFloatingBuyVisible } = useFloatingButton();

  const whatsappSettings = settings?.whatsapp || {
    number: '5511972238165',
    message: 'Olá! Vim do site e gostaria de mais informações.',
  };

  const handleClick = () => {
    window.open(createWhatsAppLink(whatsappSettings.number, whatsappSettings.message), '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed left-4 md:left-6 z-40 bg-success hover:bg-success/90 text-success-foreground rounded-full p-5 md:p-6 shadow-xl transition-all hover:scale-110 animate-bounce-subtle ${
        isFloatingBuyVisible ? 'bottom-28 md:bottom-32' : 'bottom-6 md:bottom-8'
      }`}
      aria-label="Falar pelo WhatsApp"
    >
      <MessageCircle className="h-7 w-7 md:h-8 md:w-8" />
    </button>
  );
}

