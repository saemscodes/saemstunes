const BLOCKED_UA = [
  /curl/i,
  /wget/i,
  /python-requests/i,
  /scrapy/i,
  /httpclient/i,
  /java/i,
  /go-http-client/i,
  /axios/i,
  /node-fetch/i,
  /bot/i,
  /crawler/i,
  /spider/i,
  /scan/i,
  /headless/i,
  /phantom/i,
  /puppeteer/i,
  /playwright/i,
  /selenium/i
];

const BLOCKED_IPS = new Set([]);

const SUSPICIOUS_PATHS = [
  '/api/',
  '/admin/',
  '/wp-admin/',
  '/wp-login/',
  '/.env',
  '/config/',
  '/backup/',
  '/sql/',
  '/database/'
];

export default async function handler(request) {
  const url = new URL(request.url);
  const ua = request.headers.get('user-agent') || '';
  const ip = request.headers.get('x-real-ip') || 
             request.headers.get('x-forwarded-for')?.split(',')[0] || 
             'unknown';

  if (BLOCKED_IPS.has(ip)) {
    return new Response('Forbidden: IP blocked', {
      status: 403,
      headers: { 'x-reason': 'blocked-ip' }
    });
  }

  for (const pattern of BLOCKED_UA) {
    if (pattern.test(ua)) {
      return new Response('Forbidden: User agent blocked', {
        status: 403,
        headers: { 'x-reason': 'blocked-ua' }
      });
    }
  }

  for (const path of SUSPICIOUS_PATHS) {
    if (url.pathname.startsWith(path)) {
      return new Response('Forbidden: Path blocked', {
        status: 403,
        headers: { 'x-reason': 'blocked-path' }
      });
    }
  }

  if (url.pathname.startsWith('/api/')) {
    if (BLOCKED_UA.some(pattern => pattern.test(ua))) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: { 'x-reason': 'api-rate-limit' }
      });
    }
  }

  return fetch(request);
}
