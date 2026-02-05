import { MapPin, Instagram, Clock, Phone } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function ProductStoreSection() {
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
    <section className="my-10">
      {/* Instagram CTA */}
      <div className="mb-6">
        <button
          onClick={handleInstagramClick}
          className="w-full group flex items-center justify-center gap-4 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 text-white rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] shadow-lg"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Instagram className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="text-xl font-bold">{storeInfo.instagram}</p>
            <p className="text-sm opacity-90">Siga-nos para novidades e promoções</p>
          </div>
        </button>
      </div>

      {/* Store Location Box */}
      <div className="bg-primary rounded-xl overflow-hidden shadow-xl">
        <div className="grid md:grid-cols-2">
          {/* Store Image */}
          <div className="relative h-64 md:h-auto">
            <img 
              src="https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&auto=format&fit=crop&q=60"
              alt="Nossa Loja"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent md:bg-gradient-to-r" />
            <div className="absolute bottom-4 left-4 md:hidden">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <MapPin className="h-6 w-6" />
                Nossa Loja
              </h3>
            </div>
          </div>

          {/* Store Info */}
          <div className="p-6 md:p-8 text-primary-foreground">
            <h3 className="text-2xl font-bold flex items-center gap-2 mb-4 hidden md:flex">
              <MapPin className="h-6 w-6" />
              Visite Nossa Loja
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-lg opacity-90">{storeInfo.address}</p>
                <p className="text-xl font-semibold">{storeInfo.city}</p>
              </div>
              
              <div className="flex items-center gap-3 opacity-90">
                <Clock className="h-5 w-5 flex-shrink-0" />
                <span>{storeInfo.hours}</span>
              </div>
              
              <div className="flex items-center gap-3 opacity-90">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">{storeInfo.phone}</span>
              </div>

              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(storeInfo.address + ', ' + storeInfo.city)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-5 py-3 rounded-lg transition-colors mt-4"
              >
                <MapPin className="h-5 w-5" />
                Ver no Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
