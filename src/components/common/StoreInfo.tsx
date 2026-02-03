import { MapPin, Instagram, Clock, Phone } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function StoreInfo() {
  const { data: settings } = useSiteSettings();
  
  const storeInfo = settings?.store || {
    address: 'Rua das Flores, 123 - Centro',
    city: 'São Paulo - SP',
    hours: 'Seg-Sex: 8h às 18h | Sáb: 8h às 12h',
    phone: '(11) 99999-9999',
    instagram: '@agroshop',
  };

  const handleInstagramClick = () => {
    const username = storeInfo.instagram.replace('@', '');
    window.open(`https://instagram.com/${username}`, '_blank');
  };

  return (
    <section className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Location Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              Visite Nossa Loja
            </h3>
            <div className="space-y-3">
              <p className="text-lg opacity-90">
                {storeInfo.address}
              </p>
              <p className="text-lg font-medium">
                {storeInfo.city}
              </p>
              <div className="flex items-center gap-2 opacity-90">
                <Clock className="h-5 w-5" />
                <span>{storeInfo.hours}</span>
              </div>
              <div className="flex items-center gap-2 opacity-90">
                <Phone className="h-5 w-5" />
                <span>{storeInfo.phone}</span>
              </div>
            </div>
          </div>

          {/* Instagram CTA */}
          <div className="flex flex-col items-center md:items-end space-y-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Instagram className="h-6 w-6" />
              Siga-nos no Instagram
            </h3>
            <button
              onClick={handleInstagramClick}
              className="group flex items-center gap-3 bg-primary-foreground/10 hover:bg-primary-foreground/20 backdrop-blur-sm border border-primary-foreground/30 rounded-full px-6 py-4 transition-all duration-300 hover:scale-105"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                <Instagram className="h-7 w-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold">{storeInfo.instagram}</p>
                <p className="text-sm opacity-80">Novidades e promoções exclusivas</p>
              </div>
            </button>
            <p className="text-sm opacity-70 text-center md:text-right">
              🌿 Dicas de cultivo • 🛒 Ofertas especiais • 📸 Produtos em destaque
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
