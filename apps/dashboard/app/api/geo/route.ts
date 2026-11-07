import { NextResponse, type NextRequest } from 'next/server';

// Never cache: the answer depends on who is asking.
export const dynamic = 'force-dynamic';

// Country headers added by the edge in front of the app. Whichever exists wins.
//   cf-ipcountry               Cloudflare (on by default for proxied traffic)
//   x-vercel-ip-country        Vercel
//   cloudfront-viewer-country  AWS CloudFront (needs the origin request policy enabled)
const COUNTRY_HEADERS = ['cf-ipcountry', 'x-vercel-ip-country', 'cloudfront-viewer-country'];

export function GET(request: NextRequest) {
  let country: string | null = null;
  for (const name of COUNTRY_HEADERS) {
    const value = request.headers.get(name)?.trim().toUpperCase();
    // XX = unknown, T1 = Tor (Cloudflare)
    if (value && /^[A-Z]{2}$/.test(value) && value !== 'XX' && value !== 'T1') {
      country = value;
      break;
    }
  }
  // Only the 2-letter country is returned. No IP address is read, logged or stored.
  return NextResponse.json({ country }, { headers: { 'Cache-Control': 'private, no-store' } });
}
