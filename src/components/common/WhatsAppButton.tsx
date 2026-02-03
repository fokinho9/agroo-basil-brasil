import { MessageCircle } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { createWhatsAppLink } from '@/lib/utils';

export function WhatsAppButton() {
  const { data: settings } = useSiteSettings();

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
      className="fixed bottom-6 left-6 z-40 bg-success hover:bg-success/90 text-success-foreground rounded-full p-4 shadow-lg transition-all hover:scale-110 animate-bounce-subtle"
      aria-label="Falar pelo WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}
