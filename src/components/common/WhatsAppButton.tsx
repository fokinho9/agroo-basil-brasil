import { MessageCircle } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useFloatingButton } from '@/contexts/FloatingButtonContext';
import { createWhatsAppLink } from '@/lib/utils';

export function WhatsAppButton() {
  const { data: settings } = useSiteSettings();
  const { isFloatingBuyVisible } = useFloatingButton();

  const whatsappSettings = settings?.whatsapp || {
    number: '5511999999999',
    message: 'Olá! Vim do site e gostaria de mais informações.',
  };

  const handleClick = () => {
    window.open(createWhatsAppLink(whatsappSettings.number, whatsappSettings.message), '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed left-4 md:left-6 z-40 bg-success hover:bg-success/90 text-success-foreground rounded-full p-4 md:p-5 shadow-lg transition-all hover:scale-110 animate-bounce-subtle ${
        isFloatingBuyVisible ? 'bottom-24' : 'bottom-6'
      }`}
      aria-label="Falar pelo WhatsApp"
    >
      <MessageCircle className="h-6 w-6 md:h-7 md:w-7" />
    </button>
  );
}

