# Console Setup Checklist

Everything that cannot be done in code. Work through it in order. Nothing in
this list is optional, and several items silently degrade the data if skipped
rather than failing loudly.

Worked by: Andrew. Last updated: August 28, 2026.

---

## 0 · Get the two IDs into the code

- [x] **GA4 done, 28 August 2026.** Property **Mike Knight Customs**, ID
      `551946853`, inside the Parabox Digital Analytics account `403734694`.
      Web stream `15520764940` for `https://mikeknightcustoms.com`.
      **Measurement ID `G-JDRZC2JHEV`**, already written into `CONFIG`.
      `andrew@paraboxdigital.com` granted Administrator on the account.
- [ ] **Clarity still to do.** Create the project, copy the **Project ID** from
      **Settings > Overview** (10 characters), and put it in the `clarity`
      field of `CONFIG` at the top of `js/mkc-analytics.js`. Until it is set,
      Clarity simply never loads; nothing else breaks.
- [ ] Deploy, then confirm on the live site that `js/mkc-analytics.js` carries
      the real values. Nothing fires on localhost or on `*.vercel.app` previews
      by design, so this can only be verified in production.

> **On committing IDs.** GA4 measurement IDs and Clarity project IDs are public
> identifiers. They are visible in the page source of every site that uses
> them and are not secrets. This site has no build step, so there is no
> environment variable mechanism to hide them behind and no security benefit in
> trying. They live in one clearly marked block in one file.

---

## 1 · Google Analytics 4

- [x] **Data retention set to 14 months**, 28 August 2026. Event data was on
      the 2 month default and is now 14; user data was already 14.
      Was: Admin > Data collection and
      modification > Data retention. The default is 2 months and it is the
      single most common reason a client's year-over-year question cannot be
      answered later. This is not retroactive: data already discarded is gone.
- [x] **Enhanced measurement on with "Form interactions" turned OFF**,
      28 August 2026, set during stream creation. Details: Admin > Data streams > the web stream > Enhanced
      measurement > gear icon. Its automatic `form_start` and `form_submit`
      events collide with our clean `quote_start` and `generate_lead` and will
      double count leads.
- [ ] **Mark key events**: Admin > Key events. Mark `generate_lead`,
      `phone_click`, `email_click`. Leave the rest unmarked. Events must have
      fired at least once before they appear, so do a live test first.
- [ ] **Create the internal traffic filter.** Two steps, and people miss the
      second one:
      1. Admin > Data streams > web stream > Configure tag settings > Show all
         > Define internal traffic. Add a rule per IP.
      2. Admin > Data filters > Internal Traffic. **Set it to Active, not
         Testing.** A filter left on Testing does nothing at all.
      - [ ] Mike's shop IP: `________________`
      - [ ] Andrew's office IP: `________________`
      - [ ] Any other regular device (shop iPad, Mike's home) `________________`
- [ ] **Confirm Search Console is linked.** Admin > Product links > Search
      Console links. Without it there is no organic query data in GA4 at all.
- [ ] **Take a baseline snapshot.** Export the last 30 days of whatever data
      exists today, before the new tagging changes the shape of it, so the
      first Scoreboard has something to compare against. Save it beside this
      file.

---

## 2 · Google Ads

> **Not applicable yet.** Verified 28 August 2026: there is no configured Google
> Ads account on any Parabox login. `hello@paraboxdigital.com` and
> `andrew@paraboxdigital.com` have none; `andrew.leng.ly@gmail.com` has only
> `290-599-0547`, an unconfigured shell Google generated from the Business
> Profile. Confirm with Mike whether he runs ads from his own Google account.
> Work this section when a campaign actually starts, not before. The `gclid`
> and UTM capture is already live and will attribute correctly from the first
> click.


- [ ] **Link the GA4 property to the Google Ads account.** GA4 Admin > Product
      links > Google Ads links. Accept in Ads as well; the link is not live
      until both ends agree.
- [ ] **Confirm auto-tagging is on.** Ads > Admin > Account settings >
      Auto-tagging. This supplies `gclid`, which is what the whole attribution
      chain hangs off. If it is off, nothing downstream works.
- [ ] **Import `generate_lead` as the PRIMARY conversion.** Ads > Goals >
      Conversions > New conversion action > Import > GA4.
- [ ] **Import `phone_click` as a SECONDARY conversion.** Set it to
      "Secondary (observation only)". A tap is not a call. As a primary
      conversion, smart bidding will chase cheap taps over real quote requests
      because there are far more of them, and the cost per lead figure stops
      meaning anything.
- [ ] **Do not hand-tag Google Ads URLs with UTMs.** Auto-tagging already
      supplies `gclid`. Doing both causes double attribution and makes GA4
      disagree with the Ads console. UTMs are for Facebook, Instagram, email
      and print only. See the convention in `measurement-plan.md`.
- [ ] **Enhanced conversions for leads** (optional, do after the above is
      verified working). It hashes the email address from the form and sends it
      with the conversion so Ads can match more of them. It requires: the email
      field to actually be filled (ours is optional, so coverage will be
      partial), accepting the customer data terms in Ads, and a privacy policy
      that discloses the practice. Our policy covers analytics and advertising
      generally; **if enhanced conversions are switched on, the policy needs a
      sentence saying hashed email addresses are sent to Google.** Do not enable
      it without making that edit.

---

## 3 · Microsoft Clarity

- [ ] **Set masking mode to Strict.** Settings > Masking > Masking mode >
      Strict. There is no way to do this from code; Clarity exposes no runtime
      masking API. The form and its status line also carry
      `data-clarity-mask="True"` in the markup as a second layer, so customer
      input stays out of replays even if this setting is ever changed by hand.
- [ ] **Turn on Consent Mode.** Settings > Setup > turn the cookie setting OFF
      so Clarity does not set cookies by default. Our consent layer then passes
      the signal via `clarity('consentv2', ...)`. Note Clarity has enforced
      consent for EEA, UK and Swiss visitors since 31 October 2025 regardless
      of this setting.
- [ ] **Add IPs to the blocklist.** Settings > Setup > IP blocking. Same
      addresses as the GA4 internal traffic filter:
      - [ ] Mike's shop IP: `________________`
      - [ ] Andrew's office IP: `________________`
- [ ] **Enable the Clarity to GA4 integration.** Settings > Overview > Google
      Analytics integration. This is what lets a GA4 segment jump straight to
      the matching session recordings. Without it Clarity is a curiosity rather
      than something usable during a monthly report.

---

## 4 · Vercel

- [ ] **Confirm the deployment still builds after `package.json` was added.**
      The project had no build step before. `vercel.json` now pins
      `"framework": null` and `"outputDirectory": "."` to keep the current
      static behaviour, and `package.json` deliberately has **no build script**.
      Do not add one.
- [ ] **Confirm `middleware.ts` deployed and is running.** Load the live site
      and check for a `mkc_geo` cookie. If it is absent, middleware is not
      running and **every visitor will see the consent banner**, because the
      client fails closed. The symptom is a sudden drop in measured sessions
      with no matching drop in Vercel Analytics.
- [ ] **Verify the `www` to apex redirect preserves query strings.** This is
      the one redirect not defined in the repo, so it cannot be checked from
      the code. Test it directly:

      curl -sI "https://www.mikeknightcustoms.com/?gclid=TEST123" | grep -i location

      The `location` header must still contain `gclid=TEST123`. **A redirect
      that drops `gclid` destroys Google Ads attribution silently** and is one
      of the most common causes of a client's ad data looking worse than
      reality. Every redirect defined in `vercel.json` already preserves query
      strings by default; this one is dashboard configuration.

---

## 5 · Live verification, in production, after deploying

Use `?mkc_debug=1` on any URL to send events to GA4 DebugView.

- [ ] GA4 DebugView shows `page_view` on first load. **Exactly one.**
- [ ] Navigate between pages. Each full page load produces exactly one
      `page_view`. (This is a static multi-page site, so there is no client
      side routing to mis-fire.)
- [ ] Click a phone number in the header, then the footer. Two `phone_click`
      events, `location` = `header` then `footer`. **One each, not two each.**
- [ ] Click a `mailto:` link: one `email_click`.
- [ ] Click the Google Maps link: one `directions_click`.
- [ ] Click Facebook, Instagram, Yelp: one `outbound_click` each with the right
      `destination`.
- [ ] Focus a form field: one `quote_start`. Focus two more fields: still one.
- [ ] Submit the form with a required field empty: one `form_error` with
      `error_type` starting `validation:`.
- [ ] Submit the form properly: one `generate_lead` with `service` and a
      `lead_source`. Check the email arrives and carries the `first_*` and
      `last_*` hidden fields.
- [ ] Visit with `?gclid=TEST123&utm_source=google&utm_medium=cpc`, then submit.
      The lead email must show `first_gclid=TEST123` and
      `lead_source=google_ads`.
- [ ] Open a Clarity recording of your own session. **Confirm nothing you typed
      into the form is visible.**
- [ ] Simulate an EEA visitor (VPN, or set the `mkc_geo` cookie to `other` and
      reload). Confirm in the Network tab that **no request to
      googletagmanager.com, clarity.ms or /_vercel/insights fires before you
      click Allow**, and that **no `_clck` or `_clsk` cookie is set**.
- [ ] Turn on Global Privacy Control in the browser. Confirm ad storage shows
      denied while analytics still works.
- [ ] Click **Privacy Choices** in the footer of three different pages.
      Confirm it opens every time and that choosing Decline actually revokes.
- [ ] Confirm the 404 page still renders the designed version and that its
      views appear in GA4.

---

## 6 · Ongoing

- [ ] Run `node tools/check-legal-dates.mjs` before committing any edit to a
      legal page. It fails if the visible "Last Updated" date and the JSON-LD
      `dateModified` disagree.
- [ ] Any new event must be added to the `NAMES` array in
      `js/mkc-analytics.js` **and** the table in `measurement-plan.md`, in the
      same commit.
