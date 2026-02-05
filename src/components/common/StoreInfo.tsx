import { MapPin, Instagram, Clock, Phone } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function StoreInfo() {
  const { data: settings } = useSiteSettings();
  
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

  return (
    <div className="bg-secondary text-secondary-foreground py-3">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{storeInfo.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>{storeInfo.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{storeInfo.hours}</span>
          </div>
          <button 
            onClick={handleInstagramClick}
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <Instagram className="h-4 w-4" />
            <span>{storeInfo.instagram}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
