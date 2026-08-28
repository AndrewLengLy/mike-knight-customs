import { geolocation, next } from '@vercel/functions';

/* Writes a first-party cookie naming the visitor's consent region. The client
 * consent layer reads it synchronously and picks its default from it.
 *
 * Three values, and the difference between the last two matters when
 * debugging: 'us' means granted by default, 'other' means the request was
 * geolocated outside the US, 'unknown' means Vercel could not place it. The
 * client treats anything that is not 'us' as consent-required, so a missing
 * cookie, an unknown country and an EEA visitor all fail the same safe way.
 */

const GRANTED_BY_DEFAULT = 'US';

/* Only HTML documents need the cookie. Everything excluded here is a static
 * asset that would otherwise bill a fluid compute invocation per request on a
 * site that is otherwise served straight from cache.
 */
export const config = {
  matcher:
    '/((?!_vercel|images/|fonts/|css/|js/|favicon|apple-touch-icon|robots\\.txt|sitemap\\.xml).*)',
};

export default function middleware(request: Request) {
  const { country } = geolocation(request);

  const region = !country ? 'unknown' : country === GRANTED_BY_DEFAULT ? 'us' : 'other';

  /* Not HttpOnly: the consent layer has to read this in the document head
   * before any tag loads. It carries no personal data, only a coarse bucket.
   * One hour keeps a travelling visitor's default honest without asking the
   * edge to re-decide on every asset.
   */
  /* No Cache-Control override here on purpose. Middleware runs before the
   * cache, so the header is applied per request even when the HTML itself is
   * a cache hit. Marking these responses private would cost the whole site
   * its edge caching to deliver one coarse cookie.
   */
  return next({
    headers: {
      'Set-Cookie': `mkc_geo=${region}; Path=/; Max-Age=3600; SameSite=Lax; Secure`,
    },
  });
}
