import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "@/contexts/CartContext";
import { FloatingButtonProvider } from "@/contexts/FloatingButtonContext";
import { Layout } from "@/components/layout/Layout";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { PixelInjector } from "@/components/analytics/PixelInjector";

import HomePage from "@/pages/HomePage";
import ProductsPage from "@/pages/ProductsPage";
import ProductPage from "@/pages/ProductPage";
import CheckoutPage from "@/pages/CheckoutPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import ReturnsPage from "@/pages/ReturnsPage";
import FAQPage from "@/pages/FAQPage";
import TrackingPage from "@/pages/TrackingPage";
import NotFound from "@/pages/NotFound";

import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminProductsPage from "@/pages/admin/AdminProductsPage";
import AdminCategoriesPage from "@/pages/admin/AdminCategoriesPage";
import AdminOrdersPage from "@/pages/admin/AdminOrdersPage";
import AdminBannersPage from "@/pages/admin/AdminBannersPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminImportPage from "@/pages/admin/AdminImportPage";
import AdminAbandonedCartsPage from "@/pages/admin/AdminAbandonedCartsPage";
import AdminAnalyticsPage from "@/pages/admin/AdminAnalyticsPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminHotjarPage from "@/pages/admin/AdminHotjarPage";
import AdminPixelsPage from "@/pages/admin/AdminPixelsPage";
import AdminSeoPage from "@/pages/admin/AdminSeoPage";
import AdminMarketingPage from "@/pages/admin/AdminMarketingPage";
import AdminHomepagePage from "@/pages/admin/AdminHomepagePage";
const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <FloatingButtonProvider>
          <Toaster />
          <BrowserRouter>
            <ScrollToTop />
            <PageViewTracker />
            <PixelInjector />
            <Routes>
              <Route path="/" element={<Layout><HomePage /></Layout>} />
              <Route path="/produtos" element={<Layout><ProductsPage /></Layout>} />
              <Route path="/categoria/:slug" element={<Layout><ProductsPage /></Layout>} />
              <Route path="/busca" element={<Layout><ProductsPage /></Layout>} />
              <Route path="/produto/:id" element={<Layout><ProductPage /></Layout>} />
              <Route path="/checkout" element={<Layout><CheckoutPage /></Layout>} />
              <Route path="/sobre" element={<Layout><AboutPage /></Layout>} />
              <Route path="/contato" element={<Layout><ContactPage /></Layout>} />
              <Route path="/termos" element={<Layout><TermsPage /></Layout>} />
              <Route path="/privacidade" element={<Layout><PrivacyPage /></Layout>} />
              <Route path="/trocas" element={<Layout><ReturnsPage /></Layout>} />
              <Route path="/faq" element={<Layout><FAQPage /></Layout>} />
              <Route path="/rastreio" element={<Layout><TrackingPage /></Layout>} />
              
              {/* Admin routes - hidden from public */}
              <Route path="/fokinho" element={<AdminLoginPage />} />
              <Route path="/fokinho/dashboard" element={<AdminDashboardPage />} />
              <Route path="/fokinho/produtos" element={<AdminProductsPage />} />
              <Route path="/fokinho/categorias" element={<AdminCategoriesPage />} />
              <Route path="/fokinho/pedidos" element={<AdminOrdersPage />} />
              <Route path="/fokinho/carrinhos" element={<AdminAbandonedCartsPage />} />
              <Route path="/fokinho/banners" element={<AdminBannersPage />} />
              <Route path="/fokinho/configuracoes" element={<AdminSettingsPage />} />
              <Route path="/fokinho/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/fokinho/importar" element={<AdminImportPage />} />
              <Route path="/fokinho/usuarios" element={<AdminUsersPage />} />
              <Route path="/fokinho/comportamento" element={<AdminHotjarPage />} />
              <Route path="/fokinho/pixels" element={<AdminPixelsPage />} />
              <Route path="/fokinho/seo" element={<AdminSeoPage />} />
              <Route path="/fokinho/marketing" element={<AdminMarketingPage />} />
              <Route path="/fokinho/homepage" element={<AdminHomepagePage />} />
              
              
              {/* Keep old admin routes redirecting */}
              <Route path="/admin" element={<AdminLoginPage />} />
              <Route path="/admin/*" element={<AdminLoginPage />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </FloatingButtonProvider>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;

