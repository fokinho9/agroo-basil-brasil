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
      className={`fixed left-4 md:left-6 z-40 bg-success hover:bg-success/90 text-success-foreground rounded-full p-3 md:p-4 shadow-lg transition-all hover:scale-110 animate-bounce-subtle ${
        isFloatingBuyVisible ? 'bottom-24' : 'bottom-6'
      }`}
      aria-label="Falar pelo WhatsApp"
    >
      <MessageCircle className="h-5 w-5 md:h-6 md:w-6" />
    </button>
  );
}

