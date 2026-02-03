import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingCart } from '@/components/cart/FloatingCart';
import { MiniFloatingCart } from '@/components/cart/MiniFloatingCart';
import { CartNotification } from '@/components/cart/CartNotification';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { StoreInfo } from '@/components/common/StoreInfo';
import { useCart } from '@/contexts/CartContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { lastAddedProduct, showNotification, setShowNotification, isOpen } = useCart();
  const isCheckout = location.pathname === '/checkout';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      
      {/* Store Info - show on all pages except checkout */}
      {!isCheckout && <StoreInfo />}
      
      <Footer />
      
      {/* Cart notification popup */}
      <CartNotification 
        product={lastAddedProduct}
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
      />
      
      {/* Mini floating cart button (when cart is closed) */}
      {!isOpen && <MiniFloatingCart />}
      
      {/* Full cart panel */}
      <FloatingCart />
      
      <WhatsAppButton />
    </div>
  );
}
