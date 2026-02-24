import { ReactNode, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingCart } from '@/components/cart/FloatingCart';
import { MiniFloatingCart } from '@/components/cart/MiniFloatingCart';
import { CartNotification } from '@/components/cart/CartNotification';
import { WhatsAppButton } from '@/components/common/WhatsAppButton';
import { StoreInfo } from '@/components/common/StoreInfo';
import { ClickTracker } from '@/components/analytics/ClickTracker';
import { ScrollTracker } from '@/components/analytics/ScrollTracker';
import { SectionTracker } from '@/components/analytics/SectionTracker';
import { FeedbackWidget } from '@/components/analytics/FeedbackWidget';
import { PollWidget } from '@/components/analytics/PollWidget';
import { FreeShippingBar } from '@/components/marketing/FreeShippingBar';
import { CountdownBar } from '@/components/marketing/CountdownBar';
import { PopupBanner } from '@/components/marketing/PopupBanner';
import { SocialProofNotification } from '@/components/marketing/SocialProofNotification';
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
      {/* Marketing bars */}
      {!isCheckout && <CountdownBar />}
      {!isCheckout && <FreeShippingBar />}
      
      <Header />
      <main className="flex-1">{children}</main>
      
      {!isCheckout && <StoreInfo />}
      
      <Footer />
      
      <CartNotification 
        product={lastAddedProduct}
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
      />
      
      {!isOpen && <MiniFloatingCart />}
      <FloatingCart />
      <WhatsAppButton />
      
      {/* Marketing */}
      {!isCheckout && <PopupBanner />}
      {!isCheckout && <SocialProofNotification />}
      
      {/* Analytics trackers */}
      <ClickTracker />
      <ScrollTracker />
      <SectionTracker />
      {!isCheckout && <FeedbackWidget />}
      {!isCheckout && <PollWidget />}
    </div>
  );
}
