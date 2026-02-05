import { MapPin, Instagram, Clock, Phone } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
export function StoreInfo() {
  const {
    data: settings
  } = useSiteSettings();
  const storeInfo = settings?.store || {
    address: 'Rua das Flores, 123 - Centro',
    city: 'São Paulo - SP',
    hours: 'Seg-Sex: 8h às 18h | Sáb: 8h às 12h',
    phone: '(11) 99999-9999',
    instagram: '@agroshop'
  };
  const handleInstagramClick = () => {
    const username = storeInfo.instagram.replace('@', '');
    window.open(`https://instagram.com/${username}`, '_blank');
  };
  return;
}