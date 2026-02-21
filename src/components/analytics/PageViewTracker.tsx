import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

function getSessionId(): string {
  let sid = sessionStorage.getItem('_sid');
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem('_sid', sid);
  }
  return sid;
}

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Outro';
}

function detectSource(referrer: string, utmSource: string | null): string {
  if (utmSource) {
    const s = utmSource.toLowerCase();
    if (s.includes('tiktok')) return 'TikTok';
    if (s.includes('instagram') || s === 'ig') return 'Instagram';
    if (s.includes('facebook') || s === 'fb') return 'Facebook';
    if (s.includes('google')) return 'Google';
    if (s.includes('youtube') || s === 'yt') return 'YouTube';
    if (s.includes('twitter') || s === 'x') return 'Twitter/X';
    if (s.includes('whatsapp') || s === 'wpp') return 'WhatsApp';
    if (s.includes('telegram')) return 'Telegram';
    if (s.includes('kwai')) return 'Kwai';
    return utmSource;
  }

  if (!referrer) return 'Direto';

  const r = referrer.toLowerCase();
  if (r.includes('tiktok.com')) return 'TikTok';
  if (r.includes('instagram.com') || r.includes('l.instagram.com')) return 'Instagram';
  if (r.includes('facebook.com') || r.includes('fb.com') || r.includes('l.facebook.com') || r.includes('lm.facebook.com')) return 'Facebook';
  if (r.includes('google.com') || r.includes('google.com.br')) return 'Google';
  if (r.includes('youtube.com') || r.includes('youtu.be')) return 'YouTube';
  if (r.includes('twitter.com') || r.includes('t.co') || r.includes('x.com')) return 'Twitter/X';
  if (r.includes('whatsapp.com') || r.includes('wa.me')) return 'WhatsApp';
  if (r.includes('telegram.org') || r.includes('t.me')) return 'Telegram';
  if (r.includes('kwai.com')) return 'Kwai';
  if (r.includes('bing.com')) return 'Bing';
  if (r.includes('pinterest.com')) return 'Pinterest';

  // If referrer is from our own domain, it's internal navigation
  try {
    const refHost = new URL(referrer).hostname;
    if (refHost === window.location.hostname) return 'Direto';
  } catch {}

  return 'Outro Site';
}

export function PageViewTracker() {
  const location = useLocation();
  const lastPath = useRef('');

  useEffect(() => {
    const path = location.pathname;
    
    // Skip admin pages and don't double-track
    if (path.startsWith('/fokinho') || path.startsWith('/admin')) return;
    if (path === lastPath.current) return;
    lastPath.current = path;

    const params = new URLSearchParams(location.search);
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    const utmContent = params.get('utm_content');
    const utmTerm = params.get('utm_term');
    const gclid = params.get('gclid');
    const fbclid = params.get('fbclid');
    const referrer = document.referrer;

    // Auto-detect source from gclid/fbclid
    let detectedSource = utmSource;
    if (!detectedSource && gclid) detectedSource = 'google';
    if (!detectedSource && fbclid) detectedSource = 'facebook';

    const sourceLabel = detectSource(referrer, detectedSource);

    supabase.from('page_views').insert({
      session_id: getSessionId(),
      path,
      referrer: referrer || null,
      utm_source: utmSource || (gclid ? 'google_ads' : null) || (fbclid ? 'meta_ads' : null),
      utm_medium: utmMedium || (gclid ? 'cpc' : null) || (fbclid ? 'paid_social' : null),
      utm_campaign: utmCampaign || null,
      utm_content: utmContent || null,
      utm_term: utmTerm || null,
      gclid: gclid || null,
      fbclid: fbclid || null,
      source_label: sourceLabel,
      device_type: getDeviceType(),
      browser: getBrowser(),
    } as any).then(({ error }) => {
      if (error) console.error('Page view tracking error:', error.message);
    });
  }, [location.pathname, location.search]);

  return null;
}
