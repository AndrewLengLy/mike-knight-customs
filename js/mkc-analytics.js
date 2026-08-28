/* MKC measurement layer.
 *
 * One track() function. Every event on the site goes through it, so the event
 * names live in exactly one place and cannot drift. No scattered gtag calls.
 *
 * Loading is gated twice over:
 *   1. Production hostname only. Local servers and *.vercel.app previews never
 *      send a hit, which is this stack's equivalent of a NODE_ENV guard.
 *   2. Consent. In restricted regions no vendor script is requested and no
 *      storage is written until the visitor allows it, so there is no network
 *      call and no cookie to explain.
 */
(function () {
  'use strict';

  /* --------------------------------------------------------------- config */
  /* GA4 measurement IDs and Clarity project IDs are public identifiers. They
   * are visible in the page source of every site that uses them and are not
   * secrets. On a site with no build step there is nowhere else to put them.
   * Swap the two values here; nothing else needs editing. */
  var CONFIG = {
    // GA4 property "Mike Knight Customs" (551946853), stream 15520764940,
    // inside the Parabox Digital Analytics account (403734694).
    ga4: 'G-JDRZC2JHEV',
    clarity: '',    // 10 character Clarity project ID, project not created yet
    hosts: ['mikeknightcustoms.com', 'www.mikeknightcustoms.com']
  };

  var MKC = (window.MKC = window.MKC || {});
  if (MKC.track) return;

  var PROD = CONFIG.hosts.indexOf(location.hostname) > -1;
  var DEBUG = /[?&]mkc_debug=1(&|$)/.test(location.search);

  /* ---------------------------------------------------------- attribution */

  var ATTR_SESSION = 'mkc_attr';        // last touch, this session
  var ATTR_FIRST = 'mkc_attr_first';    // first touch, 90 days
  var ATTR_DAYS = 90;
  var FIELDS = ['gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  function readCookie(name) {
    var parts = document.cookie ? document.cookie.split('; ') : [];
    for (var i = 0; i < parts.length; i++) {
      var eq = parts[i].indexOf('=');
      if (eq > -1 && parts[i].slice(0, eq) === name) {
        return decodeURIComponent(parts[i].slice(eq + 1));
      }
    }
    return null;
  }

  function writeCookie(name, value, days) {
    var exp = new Date(Date.now() + days * 864e5).toUTCString();
    var secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie =
      name + '=' + encodeURIComponent(value) +
      '; Path=/; Expires=' + exp + '; SameSite=Lax' + secure;
  }

  function safeParse(raw) {
    if (!raw) return null;
    try { var v = JSON.parse(raw); return v && typeof v === 'object' ? v : null; }
    catch (e) { return null; }
  }

  function readStore(key) {
    try { return safeParse(sessionStorage.getItem(key)); } catch (e) { return null; }
  }

  function writeStore(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  }

  function hasValues(o) {
    for (var k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) return true; }
    return false;
  }

  // What this particular arrival carried. Reading the URL and the referrer
  // stores nothing, so it is safe to do before any consent decision.
  function currentTouch() {
    var params = new URLSearchParams(location.search);
    var t = {};
    for (var i = 0; i < FIELDS.length; i++) {
      var v = params.get(FIELDS[i]);
      if (v) t[FIELDS[i]] = v.slice(0, 200);
    }
    var ref = document.referrer;
    if (ref) {
      try {
        var host = new URL(ref).hostname;
        if (host && host !== location.hostname) t.referrer = host;
      } catch (e) { /* malformed referrer */ }
    }
    return t;
  }

  var touch = currentTouch();
  var first = {};
  var last = {};

  /* Attribution is stored in sessionStorage and a 90 day cookie, which is
   * exactly the kind of storage consent covers. Without consent it lives in
   * memory for this page view only: a lead submitted right now still carries
   * the source that earned it, and nothing is persisted to come back later.
   */
  function hydrate(allowed) {
    if (!allowed) {
      last = touch;
      first = { landing: location.pathname };
      for (var k in touch) { if (Object.prototype.hasOwnProperty.call(touch, k)) first[k] = touch[k]; }
      return;
    }

    last = hasValues(touch) ? touch : (readStore(ATTR_SESSION) || {});
    if (hasValues(touch)) writeStore(ATTR_SESSION, touch);

    // First touch survives the visitor leaving and coming back direct a day
    // later. If an ad earned the click, the ad keeps the credit.
    var stored = safeParse(readCookie(ATTR_FIRST));
    if (stored) {
      first = stored;
    } else {
      first = { landing: location.pathname };
      for (var f in touch) { if (Object.prototype.hasOwnProperty.call(touch, f)) first[f] = touch[f]; }
      writeCookie(ATTR_FIRST, JSON.stringify(first), ATTR_DAYS);
    }
  }

  function leadSource() {
    var src = first.gclid ? 'google_ads'
      : first.utm_source ? first.utm_source
      : last.gclid ? 'google_ads'
      : last.utm_source ? last.utm_source
      : first.referrer ? first.referrer
      : last.referrer ? last.referrer
      : 'direct';
    return String(src).toLowerCase();
  }

  /* The form does not ask which service the customer needs, so this is read
   * from the page they first landed on. It is honest signal at zero cost to
   * the conversion rate. A dedicated select would be better and is noted as a
   * proposal in docs/measurement-plan.md. */
  var SERVICES = [
    [/collision-frame-repair/, 'collision_frame_repair'],
    [/paint-coating-detailing/, 'paint_coating_detailing'],
    [/oem-advocacy/, 'oem_advocacy']
  ];

  function service() {
    var path = first.landing || location.pathname;
    for (var i = 0; i < SERVICES.length; i++) {
      if (SERVICES[i][0].test(path)) return SERVICES[i][1];
    }
    return 'general_enquiry';
  }

  MKC.attribution = {
    first: function () { return first; },
    last: function () { return last; },
    leadSource: leadSource,
    service: service
  };

  /* --------------------------------------------------------------- track */

  var NAMES = [
    'generate_lead', 'phone_click', 'email_click', 'quote_start',
    'form_error', 'directions_click', 'outbound_click'
  ];

  function track(name, params) {
    if (NAMES.indexOf(name) === -1) return;   // the taxonomy is closed on purpose
    var payload = params || {};

    if (!PROD) {
      if (window.console && console.info) console.info('[mkc] ' + name, payload);
      return;
    }
    if (DEBUG) payload.debug_mode = true;

    if (typeof window.gtag === 'function') window.gtag('event', name, payload);

    // Tag the Clarity session so a GA4 finding can be watched back as a replay.
    if (typeof window.clarity === 'function') {
      window.clarity('event', name);
      if (name === 'generate_lead' && payload.lead_source) {
        window.clarity('set', 'lead_source', String(payload.lead_source));
      }
    }
  }

  MKC.track = track;

  /* ---------------------------------------------------------- tag loading */

  var loaded = { ga: false, clarity: false, vercel: false };

  /* Vercel Web Analytics is cookieless, and Vercel's position is that it does
   * not need consent. It is still a request to a third party carrying an IP
   * address and a URL, so in a consent-required region it waits like the rest.
   * The cost is that EEA visitors drop out of the baseline count too, which
   * for a Chico body shop is a rounding error.
   *
   * It stays installed because it is free, already here, and unaffected by ad
   * blockers that eat GA4. GA4 is the reporting source of record. Where the
   * two disagree, the Scoreboard quotes GA4.
   */
  function loadVercelAnalytics() {
    if (loaded.vercel) return;
    loaded.vercel = true;
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    var s = document.createElement('script');
    s.defer = true;
    s.src = '/_vercel/insights/script.js';
    document.head.appendChild(s);
  }

  function loadGa() {
    if (loaded.ga || !CONFIG.ga4) return;
    // The inline head block defines gtag and set the Consent Mode v2 defaults.
    // If it is ever dropped from a page, load nothing rather than send a hit
    // with no consent signal attached to it.
    if (typeof window.gtag !== 'function') return;
    loaded.ga = true;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.ga4);
    document.head.appendChild(s);

    window.gtag('js', new Date());
    var cfg = { send_page_view: true };
    if (DEBUG) cfg.debug_mode = true;
    window.gtag('config', CONFIG.ga4, cfg);
  }

  function loadClarity() {
    if (loaded.clarity || !CONFIG.clarity) return;
    loaded.clarity = true;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CONFIG.clarity);

    /* Masking is deliberately NOT configured here. Clarity exposes no runtime
     * API for masking mode; it is a project setting (Settings > Masking >
     * Strict) plus data-clarity-mask attributes in the markup. Both are done:
     * the console step is in docs/console-setup-checklist.md, and the intake
     * form and its status line carry data-clarity-mask="True" so a replay
     * cannot show what a customer typed even if the project setting is ever
     * changed by hand.
     */
  }

  function applyConsent(c) {
    hydrate(c.analytics);
    if (MKC.form) MKC.form.stamp();
    if (!PROD || !c.analytics) return;

    loadVercelAnalytics();
    loadGa();
    loadClarity();
    if (typeof window.clarity === 'function') {
      window.clarity('consentv2', {
        ad_Storage: c.ad ? 'granted' : 'denied',
        analytics_Storage: c.analytics ? 'granted' : 'denied'
      });
    }
  }

  /* --------------------------------------------------------- link events */

  var SOCIAL = /(facebook|instagram|yelp|youtube|tiktok)\.com/i;

  function place(el) {
    if (el.closest('.consent')) return 'consent';
    if (el.closest('.nav__li--call')) return 'mobile_nav';
    if (el.closest('.nav__cta')) return 'header';
    if (el.closest('.nav') || el.closest('header')) return 'header';
    if (el.closest('.footer')) return 'footer';
    if (el.closest('.mast')) return 'hero';
    if (el.closest('form')) return 'form';
    if (el.closest('.intake__info')) return 'contact_panel';
    return 'body';
  }

  function isDirections(href) {
    return /^(https?:\/\/)?(goo\.gl\/maps|maps\.app\.goo\.gl|(www\.)?google\.[a-z.]+\/maps)/i.test(href);
  }

  // One delegated listener, and a single click takes exactly one branch. That
  // is the whole point: a doubled generate_lead halves the reported cost per
  // lead, and a cost per lead that is half the truth is worse than no number.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';

    if (href.indexOf('tel:') === 0) {
      track('phone_click', { location: place(a) });
      return;
    }
    if (href.indexOf('mailto:') === 0) {
      track('email_click', { location: place(a) });
      return;
    }
    if (isDirections(href)) {
      track('directions_click', { location: place(a) });
      return;
    }
    if (/^https?:\/\//i.test(href)) {
      var host;
      try { host = new URL(href).hostname; } catch (err) { return; }
      if (host === location.hostname) return;
      host = host.replace(/^www\./, '');
      track('outbound_click', { destination: host, location: place(a) });
    }
  });

  /* --------------------------------------------------------- form events */

  var form = document.getElementById('intake-form');
  if (form) {
    var FORM_NAME = 'intake';
    var started = false;

    // quote_start fires on the first real interaction with a field, once per
    // page view. focusin covers keyboard and assistive tech as well as taps.
    form.addEventListener('focusin', function (e) {
      if (started) return;
      if (!e.target.matches('input:not([type=hidden]):not([type=checkbox]), select, textarea')) return;
      started = true;
      track('quote_start', { form_name: FORM_NAME });
    });

    // Attribution rides along on the submission, so every lead email carries
    // the source that earned it and the email agrees with GA4.
    function stamp() {
      var values = {};
      for (var i = 0; i < FIELDS.length; i++) {
        var f = FIELDS[i];
        if (first[f]) values['first_' + f] = first[f];
        if (last[f]) values['last_' + f] = last[f];
      }
      if (first.referrer) values.first_referrer = first.referrer;
      if (last.referrer) values.last_referrer = last.referrer;
      if (first.landing) values.landing_page = first.landing;
      values.lead_source = leadSource();

      Object.keys(values).forEach(function (key) {
        var input = form.querySelector('input[type=hidden][name="' + key + '"]');
        if (!input) {
          input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          form.appendChild(input);
        }
        input.value = values[key];
      });
    }

    MKC.form = {
      name: FORM_NAME,
      stamp: stamp,
      lead: function () {
        track('generate_lead', {
          form_name: FORM_NAME,
          service: service(),
          lead_source: leadSource()
        });
      },
      error: function (type) {
        track('form_error', { form_name: FORM_NAME, error_type: type });
      }
    };
  }

  /* ----------------------------------------------------------------- wire */

  if (MKC.consent) {
    applyConsent({ analytics: MKC.consent.analytics, ad: MKC.consent.ad });
    MKC.consent.onChange(applyConsent);
  } else {
    hydrate(false);
    if (MKC.form) MKC.form.stamp();
  }
})();
