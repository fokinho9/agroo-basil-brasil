import { useSiteSettings } from '@/hooks/useSiteSettings';

interface UtmDefaults {
  whatsapp_source: string;
  whatsapp_medium: string;
  whatsapp_campaign: string;
  share_source: string;
  share_medium: string;
}

const defaults: UtmDefaults = {
  whatsapp_source: 'whatsapp',
  whatsapp_medium: 'social',
  whatsapp_campaign: 'site-button',
  share_source: 'share',
  share_medium: 'social',
};

export function useUtmDefaults() {
  const { data: settings } = useSiteSettings();
  const utmDefaults = (settings?.utm_defaults as any) || {};
  return { ...defaults, ...utmDefaults } as UtmDefaults;
}

export function appendUtmToUrl(url: string, params: Record<string, string>): string {
  try {
    const u = new URL(url);
    for (const [key, value] of Object.entries(params)) {
      if (value) u.searchParams.set(key, value);
    }
    return u.toString();
  } catch {
    // If not a valid URL, try to append as query string
    const sep = url.includes('?') ? '&' : '?';
    const qs = Object.entries(params)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    return qs ? `${url}${sep}${qs}` : url;
  }
}

export function buildWhatsAppMessageWithUtm(
  baseMessage: string,
  siteUrl: string,
  utmDefaults: UtmDefaults
): string {
  const trackedUrl = appendUtmToUrl(siteUrl, {
    utm_source: utmDefaults.whatsapp_source,
    utm_medium: utmDefaults.whatsapp_medium,
    utm_campaign: utmDefaults.whatsapp_campaign,
  });
  return `${baseMessage}\n\n${trackedUrl}`;
}
