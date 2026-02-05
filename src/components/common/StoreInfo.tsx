import { MapPin, Instagram, Clock, Phone } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
export function StoreInfo() {
  const {
    data: settings
  } = useSiteSettings();
  const storeInfo = settings?.store || {
    address: 'Av. Brasil, Centro',
    city: 'Tangará da Serra - MT',
    hours: 'Seg-Sex: 8h às 18h | Sáb: 8h às 12h',
    phone: '(65) 99999-9999',
    instagram: '@agrobrasil'
  };
  const handleInstagramClick = () => {
    const username = storeInfo.instagram.replace('@', '');
    window.open(`https://instagram.com/${username}`, '_blank');
  };
  return <div className="bg-secondary text-secondary-foreground py-3">
      
    </div>;
}