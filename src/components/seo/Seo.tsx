import { Helmet } from 'react-helmet-async';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://project-sweetheart.lovable.app';
const SITE_NAME = 'Agro Brasil - Loja Agropecuária';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

interface SeoProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  canonicalPath?: string;
  noindex?: boolean;
  type?: string;
}

export function Seo({
  title,
  description,
  keywords,
  image,
  canonicalPath,
  noindex = false,
  type = 'website',
}: SeoProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonicalPath ? `${SITE_URL}${canonicalPath}` : undefined;
  const ogImage = image || DEFAULT_IMAGE;
  const gscVerification = import.meta.env.VITE_GSC_VERIFICATION;

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
      <meta property="og:site_name" content={SITE_NAME} />
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
