/* MKC consent layer.
 *
 * Region defaults:
 *   United States and everywhere else outside the restricted set -> granted.
 *   EEA, UK and Switzerland -> denied until the visitor chooses.
 *   Unknown country -> treated as restricted. Fail closed.
 *
 * Region comes from the mkc_geo cookie written by middleware.ts. If middleware
 * never ran (local file server, a build that dropped it), the cookie is absent
 * and every visitor is treated as restricted. That costs data quality, never
 * privacy, which is the correct direction to fail in.
 *
 * Global Privacy Control is honored everywhere regardless of region. About a
 * dozen states now require covered businesses to respect it, and it is the
 * honest reading of the signal in the ones that do not.
 *
 * The Consent Mode v2 defaults are set inline in each page head, before any
 * Google tag loads. This file only issues updates and owns the banner.
 */
(function () {
  'use strict';

  var STORE = 'mkc_consent';
  var GEO = 'mkc_geo';
  var MONTHS_12 = 365;

  var MKC = (window.MKC = window.MKC || {});
  if (MKC.consent) return;

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

  var gpc = navigator.globalPrivacyControl === true;

  // Absent or unrecognized geo cookie means restricted. Fail closed.
  var geo = readCookie(GEO);
  var restricted = geo !== 'us';

  var stored = readCookie(STORE);
  if (stored !== 'granted' && stored !== 'denied') stored = null;

  var state = {
    // 'granted' | 'denied' | 'pending'
    value: stored || (restricted ? 'pending' : 'granted'),
    region: geo === 'us' ? 'us' : (geo ? 'restricted' : 'unknown'),
    gpc: gpc,
    stored: stored !== null
  };

  function analyticsAllowed() { return state.value === 'granted'; }
  // GPC forces ad storage off even when the visitor otherwise allowed it.
  function adAllowed() { return state.value === 'granted' && !gpc; }

  var listeners = [];

  function notify() {
    var snapshot = {
      analytics: analyticsAllowed(),
      ad: adAllowed(),
      value: state.value,
      region: state.region,
      gpc: gpc
    };
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](snapshot); } catch (e) { /* one bad listener must not break the rest */ }
    }
  }

  function pushToVendors() {
    var analytics = analyticsAllowed() ? 'granted' : 'denied';
    var ad = adAllowed() ? 'granted' : 'denied';

    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: ad,
        ad_user_data: ad,
        ad_personalization: ad,
        analytics_storage: analytics
      });
    }

    // consentv2 is the current Clarity API. The older clarity('consent', bool)
    // is deprecated and collapses both storage types into one flag.
    if (typeof window.clarity === 'function') {
      window.clarity('consentv2', { ad_Storage: ad, analytics_Storage: analytics });
    }
  }

  function set(next, persist) {
    state.value = next;
    if (persist) {
      writeCookie(STORE, next, MONTHS_12);
      state.stored = true;
    }
    pushToVendors();
    notify();
  }

  /* ---------------------------------------------------------------- banner */

  var banner = null;
  var lastFocus = null;

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function build() {
    if (banner) return banner;

    banner = document.createElement('section');
    banner.className = 'consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-labelledby', 'consent-title');
    banner.hidden = true;
    banner.innerHTML = [
      '<div class="consent__panel">',
      '  <span class="tick" aria-hidden="true"></span>',
      '  <div class="consent__body">',
      '    <p class="data data--live">Privacy · MKC/CONSENT-01</p>',
      '    <h2 class="consent__title" id="consent-title">Your privacy choices</h2>',
      '    <p class="consent__copy">We use Google Analytics and Microsoft Clarity to see',
      '    which pages people read and where the site gives them trouble. Clarity also',
      '    records how the page was used, including mouse movement, clicks and scrolling.',
      '    You can say no and the site works exactly the same.',
      '    <a href="/privacy">Read the privacy policy</a>.</p>',
      '    <div class="consent__actions">',
      '      <button type="button" class="btn btn--primary" data-consent="granted">Allow <span class="arrow">&#8594;</span></button>',
      '      <button type="button" class="btn btn--ghost" data-consent="denied">Decline</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');

    document.body.appendChild(banner);

    banner.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (!btn) return;
      set(btn.getAttribute('data-consent'), true);
      hide();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !banner.hidden) hide();
    });

    return banner;
  }

  function show() {
    build();
    lastFocus = document.activeElement;
    banner.hidden = false;
    if (!reducedMotion()) {
      // force a frame so the entrance transition actually runs
      void banner.offsetWidth;
    }
    banner.classList.add('is-in');
    var first = banner.querySelector('[data-consent]');
    if (first) first.focus();
  }

  function hide() {
    if (!banner) return;
    banner.classList.remove('is-in');
    banner.hidden = true;
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    lastFocus = null;
  }

  /* ----------------------------------------------------------------- wire */

  MKC.consent = {
    get analytics() { return analyticsAllowed(); },
    get ad() { return adAllowed(); },
    get value() { return state.value; },
    get region() { return state.region; },
    get gpc() { return gpc; },
    onChange: function (fn) {
      listeners.push(fn);
      return fn;
    },
    open: show,
    set: function (v) { set(v === 'granted' ? 'granted' : 'denied', true); }
  };

  // The footer link is present on every page, in every region, always.
  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-privacy-choices]');
    if (!link) return;
    e.preventDefault();
    show();
  });

  if (state.value === 'pending') show();
})();
