import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
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

function logPixelEvent(platform: string, eventName: string, eventData: Record<string, any> = {}) {
  const params = new URLSearchParams(window.location.search);
  supabase.from('pixel_events').insert({
    session_id: getSessionId(),
    pixel_platform: platform,
    event_name: eventName,
    event_data: eventData,
    path: window.location.pathname,
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
    device_type: getDeviceType(),
  } as any).then(() => {});
}

// Inject script once
function injectScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement('script');
  s.id = id;
  s.src = src;
  s.async = true;
  document.head.appendChild(s);
}

function injectInlineScript(id: string, code: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement('script');
  s.id = id;
  s.innerHTML = code;
  document.head.appendChild(s);
}

function injectNoScript(id: string, html: string) {
  if (document.getElementById(id)) return;
  const ns = document.createElement('noscript');
  ns.id = id;
  ns.innerHTML = html;
  document.body.appendChild(ns);
}

export function PixelInjector() {
  const { data: settings } = useSiteSettings();
  const location = useLocation();
  const initialized = useRef(new Set<string>());

  const pixels = settings?.pixels as Record<string, { enabled: boolean; id: string }> | undefined;

  // Initialize pixels once
  useEffect(() => {
    if (!pixels) return;

    // Facebook Pixel
    if (pixels.facebook?.enabled && pixels.facebook?.id && !initialized.current.has('facebook')) {
      initialized.current.add('facebook');
      const fbId = pixels.facebook.id;
      injectInlineScript('fb-pixel', `
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
        (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init','${fbId}');
      `);
      injectNoScript('fb-pixel-ns', `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${fbId}&ev=PageView&noscript=1"/>`);
    }

    // Google Analytics (GA4)
    if (pixels.google_analytics?.enabled && pixels.google_analytics?.id && !initialized.current.has('ga')) {
      initialized.current.add('ga');
      const gaId = pixels.google_analytics.id;
      injectScript('ga-script', `https://www.googletagmanager.com/gtag/js?id=${gaId}`);
      injectInlineScript('ga-config', `
        window.dataLayer=window.dataLayer||[];
        function gtag(){dataLayer.push(arguments);}
        gtag('js',new Date());
        gtag('config','${gaId}');
      `);
    }

    // Google Ads
    if (pixels.google_ads?.enabled && pixels.google_ads?.id && !initialized.current.has('gads')) {
      initialized.current.add('gads');
      const gadsId = pixels.google_ads.id;
      injectScript('gads-script', `https://www.googletagmanager.com/gtag/js?id=${gadsId}`);
      injectInlineScript('gads-config', `
        window.dataLayer=window.dataLayer||[];
        function gtag(){dataLayer.push(arguments);}
        gtag('js',new Date());
        gtag('config','${gadsId}');
      `);
    }

    // TikTok Pixel
    if (pixels.tiktok?.enabled && pixels.tiktok?.id && !initialized.current.has('tiktok')) {
      initialized.current.add('tiktok');
      const ttId = pixels.tiktok.id;
      injectInlineScript('tt-pixel', `
        !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
        ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
        ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
        for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
        ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
        ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
        ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;
        ttq._o=ttq._o||{};ttq._o[e]=n||{};
        var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;
        var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        ttq.load('${ttId}');
        ttq.page();
        }(window,document,'ttq');
      `);
    }

    // Kwai Pixel
    if (pixels.kwai?.enabled && pixels.kwai?.id && !initialized.current.has('kwai')) {
      initialized.current.add('kwai');
      const kwaiId = pixels.kwai.id;
      injectInlineScript('kwai-pixel', `
        !function(e,t,n,c,o){e[c]||(o=e[c]=function(){o.process?o.process.apply(o,arguments):o.queue.push(arguments)},
        o.queue=[],o.t=1*new Date,(a=t.createElement(n)).async=1,a.src="https://s1.kwai.net/kos/s101/nlav11HAQg/pixel/events.js",
        (s=t.getElementsByTagName(n)[0]).parentNode.insertBefore(a,s))}(window,document,"script","kwaiq");
        kwaiq.load('${kwaiId}');
        kwaiq.page();
      `);
    }

    // Pinterest Tag
    if (pixels.pinterest?.enabled && pixels.pinterest?.id && !initialized.current.has('pinterest')) {
      initialized.current.add('pinterest');
      const pinId = pixels.pinterest.id;
      injectInlineScript('pin-pixel', `
        !function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};
        var n=window.pintrk;n.queue=[],n.version="3.0";
        var t=document.createElement("script");t.async=!0,t.src=e;
        var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}
        ("https://s.pinimg.com/ct/core.js");
        pintrk('load','${pinId}');
        pintrk('page');
      `);
      injectNoScript('pin-pixel-ns', `<img height="1" width="1" style="display:none;" alt="" src="https://ct.pinterest.com/v3/?event=init&tid=${pinId}&noscript=1" />`);
    }

    // Twitter/X Pixel
    if (pixels.twitter?.enabled && pixels.twitter?.id && !initialized.current.has('twitter')) {
      initialized.current.add('twitter');
      const twId = pixels.twitter.id;
      injectInlineScript('tw-pixel', `
        !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},
        s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
        a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
        twq('config','${twId}');
      `);
    }

    // Snapchat Pixel
    if (pixels.snapchat?.enabled && pixels.snapchat?.id && !initialized.current.has('snapchat')) {
      initialized.current.add('snapchat');
      const snapId = pixels.snapchat.id;
      injectInlineScript('snap-pixel', `
        (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
        a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
        r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');
        snaptr('init','${snapId}',{});
        snaptr('track','PAGE_VIEW');
      `);
    }

    // Google Tag Manager
    if (pixels.gtm?.enabled && pixels.gtm?.id && !initialized.current.has('gtm')) {
      initialized.current.add('gtm');
      const gtmId = pixels.gtm.id;
      injectInlineScript('gtm-script', `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
        var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
        j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
        f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');
      `);
      injectNoScript('gtm-ns', `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`);
    }

    // Microsoft/Bing UET Tag
    if (pixels.bing?.enabled && pixels.bing?.id && !initialized.current.has('bing')) {
      initialized.current.add('bing');
      const bingId = pixels.bing.id;
      injectInlineScript('bing-pixel', `
        (function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[],f=function(){var o={ti:"${bingId}",enableAutoSpaTracking:true};
        o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")},n=d.createElement(t),n.src=r,n.async=1,n.onload=n.onreadystatechange=function(){
        var s=this.readyState;s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)},
        i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)})(window,document,"script","//bat.bing.com/bat.js","uetq");
      `);
    }
  }, [pixels]);

  // Track page views on route change
  useEffect(() => {
    if (!pixels || location.pathname.startsWith('/fokinho') || location.pathname.startsWith('/admin')) return;

    const activePlatforms: string[] = [];

    if (pixels.facebook?.enabled && pixels.facebook?.id) {
      try { (window as any).fbq?.('track', 'PageView'); } catch {}
      activePlatforms.push('facebook');
    }
    if (pixels.google_analytics?.enabled && pixels.google_analytics?.id) {
      try { (window as any).gtag?.('event', 'page_view', { page_path: location.pathname }); } catch {}
      activePlatforms.push('google_analytics');
    }
    if (pixels.tiktok?.enabled && pixels.tiktok?.id) {
      try { (window as any).ttq?.page(); } catch {}
      activePlatforms.push('tiktok');
    }
    if (pixels.kwai?.enabled && pixels.kwai?.id) {
      try { (window as any).kwaiq?.page(); } catch {}
      activePlatforms.push('kwai');
    }
    if (pixels.pinterest?.enabled && pixels.pinterest?.id) {
      try { (window as any).pintrk?.('page'); } catch {}
      activePlatforms.push('pinterest');
    }

    // Log all active pixel events
    for (const platform of activePlatforms) {
      logPixelEvent(platform, 'PageView');
    }
  }, [location.pathname, pixels]);

  return null;
}

// Export helper for other components to fire custom events
export function firePixelEvent(eventName: string, data: Record<string, any> = {}) {
  // Facebook
  try { (window as any).fbq?.('track', eventName, data); } catch {}
  // TikTok
  try { (window as any).ttq?.track(eventName, data); } catch {}
  // Pinterest
  try { (window as any).pintrk?.('track', eventName, data); } catch {}
  // Google Analytics
  try { (window as any).gtag?.('event', eventName, data); } catch {}
  // Kwai
  try { (window as any).kwaiq?.track(eventName, data); } catch {}
  // Snapchat
  try { (window as any).snaptr?.('track', eventName.toUpperCase(), data); } catch {}
  // Twitter
  try { (window as any).twq?.('track', eventName, data); } catch {}

  logPixelEvent('all', eventName, data);
}
