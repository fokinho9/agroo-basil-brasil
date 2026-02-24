import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://project-sweetheart.lovable.app';
const DEFAULT_SITE_NAME = 'Agro Brasil - Loja Agropecuária';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

interface SeoProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  canonicalPath?: string;
  noindex?: boolean;
  type?: string;
  /** Key used to lookup admin-overrides from site_settings.seo_pages */
  pageKey?: string;
}

export function Seo({
  title: defaultTitle,
  description: defaultDescription,
  keywords: defaultKeywords,
  image,
  canonicalPath,
  noindex = false,
  type = 'website',
  pageKey,
}: SeoProps) {
  const { data: settings } = useSiteSettings();

  // Admin overrides
  const adminPages = settings?.seo_pages || {};
  const adminPage = pageKey ? adminPages[pageKey] : null;
  const adminSiteName = settings?.seo_site_name || DEFAULT_SITE_NAME;
  const adminDefaultOgImage = settings?.seo_default_og_image || DEFAULT_IMAGE;
  const gscVerification = settings?.seo_gsc_verification || import.meta.env.VITE_GSC_VERIFICATION;

  // Use admin values if they exist, otherwise fallback to props
  const title = adminPage?.title || defaultTitle;
  const description = adminPage?.description || defaultDescription;
  const keywords = adminPage?.keywords
    ? adminPage.keywords.split(',').map((k: string) => k.trim())
    : defaultKeywords;
  const ogImage = adminPage?.ogImage || image || adminDefaultOgImage;

  const fullTitle = `${title} | ${adminSiteName}`;
  const canonicalUrl = canonicalPath ? `${SITE_URL}${canonicalPath}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />

      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={adminSiteName} />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Google Search Console */}
      {gscVerification && (
        <meta name="google-site-verification" content={gscVerification} />
      )}
    </Helmet>
  );
}
