# Mike Knight Customs · Measurement Plan

The definition of record for what this site measures, what each number means,
and where it lands. If a number in the monthly Scoreboard is ever questioned,
the answer is in this file.

Owner: Parabox Digital. Last updated: August 28, 2026.

---

## 1 · Where the data lives

| System | Purpose | Status |
|---|---|---|
| Google Analytics 4 | Reporting source of record. Every number quoted to the client comes from here. | ID not yet set |
| Microsoft Clarity | Session replay and heatmaps. Diagnostic only, never quoted as a count. | ID not yet set |
| Google Ads | Spend, impressions, clicks, and imported conversions. | **Not running.** See below |
| Vercel Web Analytics | Cookieless page view baseline. Internal cross-check only. | Live |

**Google Ads is not currently running.** Checked 28 August 2026 across all three
Google accounts Parabox holds: `hello@paraboxdigital.com` and
`andrew@paraboxdigital.com` have no Ads account at all, and
`andrew.leng.ly@gmail.com` has only customer ID `290-599-0547`, an unconfigured
shell auto-created from the Google Business Profile and never set up. If Mike
runs ads from his own Google login, that account has not been identified.
Everything in this plan that depends on ad spend, principally cost per lead, is
built and waiting rather than in use.

**Two tools counting sessions differently is how a client ends up with two
numbers and no trust.** So the rule is simple and not negotiable: **GA4 is the
source of record.** Vercel Analytics stays because it is free, already
installed, and less affected by ad blockers, which makes it a useful sanity
check when GA4 looks wrong. It is never quoted in a client report. Where the
two disagree, the Scoreboard says what GA4 says.

Clarity counts sessions differently again, and by design. It is there to answer
"why", never "how many".

---

## 2 · Event taxonomy

Seven events. Names are snake_case and **stable forever**: renaming one breaks
every historical comparison and every Google Ads conversion built on it.

Everything routes through the single `track()` function in
`js/mkc-analytics.js`. There are no loose `gtag` calls anywhere in the site,
and `track()` rejects any name not on this list, so the taxonomy cannot quietly
grow.

| Event | Fires when | Params | Key event | Into Google Ads |
|---|---|---|---|---|
| `generate_lead` | Quote form submits successfully | `form_name`, `service`, `lead_source` | Yes | **Primary** |
| `phone_click` | Any `tel:` link is clicked | `location` | Yes | Secondary |
| `email_click` | Any `mailto:` link is clicked | `location` | Yes | No |
| `quote_start` | First interaction with any form field | `form_name` | No | No |
| `form_error` | Submission fails validation or the endpoint errors | `form_name`, `error_type` | No | No |
| `directions_click` | A Google Maps or directions link is clicked | `location` | No | No |
| `outbound_click` | A social or external link is clicked | `destination`, `location` | No | No |

### Parameter values

- **`location`**: `header`, `mobile_nav`, `hero`, `footer`, `form`,
  `contact_panel`, `body`. Derived from the nearest landmark ancestor of the
  clicked link, so it does not need maintaining per page.
- **`form_name`**: `intake` is currently the only form on the site.
- **`service`**: `collision_frame_repair`, `paint_coating_detailing`,
  `oem_advocacy`, `general_enquiry`. See the known limitation in section 7.
- **`lead_source`**: `google_ads` when a `gclid` is present, otherwise the
  `utm_source`, otherwise the referring hostname, otherwise `direct`. Always
  lowercase.
- **`error_type`**: `validation:<field>`, `endpoint`, `network`.

### Why `form_error` earns its place

If leads drop next month, the first question is whether demand fell or the form
broke. Without this event that question costs an afternoon of guessing. With
it, it is one chart. `validation:<field>` also names the field people give up
on, which is the cheapest conversion-rate lead we will ever get.

### Why `phone_click` is a secondary conversion, never primary

A tap on a phone number is not a phone call. Some are misclicks, some are
people who hang up. If smart bidding is allowed to optimise for it as a primary
conversion it will chase cheap taps over real quote requests, because taps are
far more plentiful. Import it so it is visible, weight it so it cannot steer.

---

## 3 · Attribution

Captured on landing, held for the whole visit, written onto the form at submit.

| Captured | Where it is kept | Lifetime |
|---|---|---|
| `gclid`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, referrer host, landing path | First touch, cookie `mkc_attr_first` | 90 days |
| Same fields for the current arrival | Last touch, `sessionStorage` key `mkc_attr` | Until the tab closes |

**First touch is kept deliberately.** If someone arrives from an ad, leaves, and
comes back direct a day later, the ad earned that lead and keeps the credit.
Both sets are written to the form, prefixed `first_` and `last_`, so the lead
email shows the full picture rather than a conclusion.

Without consent, attribution still works, but only in memory for that one page
view. A lead submitted right then still carries its source. Nothing persists to
be read back later.

### Query parameters survive every redirect

Verified against Vercel's documentation: *"all query strings that are found in
the source path will be passed to the destination path."* That covers the ten
redirects in `vercel.json`, the `cleanUrls` rewrite of `/contact.html` to
`/contact`, and `trailingSlash` normalisation.

**The one case not verifiable from this repo is the `www` to apex domain
redirect**, which lives in Vercel dashboard settings, not in the tree. It is a
manual check in the console checklist. A redirect that drops `gclid` destroys
Google Ads attribution silently, and this is the only place left where that
could happen.

---

## 4 · UTM naming convention

Decided now, before more campaigns run. **Inconsistent UTMs are unfixable after
the fact:** `Google` and `google` are two rows in every report forever.

Rules: lowercase only, hyphens never spaces or underscores, no punctuation.

| Parameter | Allowed values | Example |
|---|---|---|
| `utm_source` | `google`, `bing`, `facebook`, `instagram`, `yelp`, `email`, `qr`, `print` | `google` |
| `utm_medium` | `cpc`, `organic-social`, `paid-social`, `email`, `referral`, `offline` | `cpc` |
| `utm_campaign` | `<offer>-<geo>-<yyyy>-<mm>` | `collision-chico-2026-08` |
| `utm_content` | The specific creative or variant | `headline-a`, `truck-photo` |
| `utm_term` | Keyword, paid search only | `auto-body-chico` |

Google Ads auto-tagging supplies `gclid`, so **do not hand-tag Google Ads
URLs with UTMs.** Doing both causes double attribution and disagreement between
GA4 and the Ads console. UTMs are for everything that is not Google Ads:
Facebook, Instagram, email, printed QR codes on the shop door.

The campaign name carries the offer and the month so that a year later
"which campaign was that?" is answerable from the string alone.

---

## 5 · Consent and its effect on the numbers

| Visitor | Default | Banner | Tags load |
|---|---|---|---|
| United States | Granted | No | Immediately |
| EEA, UK, Switzerland | Denied | Yes | Only after Allow |
| Any other country | Denied | Yes | Only after Allow |
| Country unknown | Denied | Yes | Only after Allow |
| Any region sending GPC | Ad storage denied | Per region | Analytics only |

Region comes from `middleware.ts` via the Vercel `geolocation()` helper, written
to a short-lived `mkc_geo` cookie. **If middleware ever fails to deploy, the
cookie is absent and every visitor is treated as consent-required.** That fails
towards privacy and costs data quality, which is the correct direction. It is
also worth knowing about, because the symptom is a sudden global drop in
measured sessions with no change in Vercel Analytics.

For a Chico body shop, non-US traffic is a rounding error, so the practical
effect on reported numbers is close to nil.

---

## 6 · Mapping to the monthly Scoreboard

The Scoreboard is four numbers, three actions, one recommendation.

| Scoreboard line | Source | Exact definition |
|---|---|---|
| **1 · Visits** | GA4 | Sessions, all channels |
| **2 · Leads** | GA4 | `generate_lead` count |
| **3 · Cost per lead** | Google Ads spend / GA4 `generate_lead` from `lead_source = google_ads` | Ad-attributed leads only, never all leads. **Reports as "no ad spend" until a campaign runs.** Never divide by all leads to manufacture a number |
| **4 · Phone taps** | GA4 | `phone_click` count, reported as taps and never called calls |

Supporting numbers, used to write the three actions but not quoted as headline
figures: `quote_start` to `generate_lead` completion rate, `form_error` count
and type, top landing pages, and the Clarity replays for any page where
`quote_start` fires but `generate_lead` does not.

**Cost per lead is the number this whole build exists to produce.** It either
falls over time or it tells us to change something.

---

## 7 · Known limitations

1. **The lead record is an email, not a database row.** The form posts to
   Web3Forms, which emails the shop. Attribution rides along as hidden fields
   so each email names its own source, and GA4 gives the countable total. But
   leads are not queryable, and reconciling GA4 against the inbox is manual.
   The fix is a stored record; see the build-gap note in the handover.
2. **`service` is inferred from the landing page, not asked.** Someone who
   lands on the home page and submits is `general_enquiry`. Adding a
   "What do you need?" select to the form would make this exact, and matches the
   Parabox lead-qualifier pattern, but it changes the form and carries a
   conversion risk that should be a deliberate decision rather than a side
   effect of a measurement job.
3. **Phone calls are not tracked, only taps.** Call tracking needs a separate
   number and a provider, which is a cost and a decision for the client.
4. **Clarity replays are kept 30 days.** Anything worth keeping must be saved
   out before it expires.

---

## 8 · Changing any of this

Adding an event means editing the `NAMES` array in `js/mkc-analytics.js` and
this table, in the same commit. `track()` silently drops unknown names on
purpose, so a typo fails closed rather than creating a junk event that pollutes
the property forever.

Do not add scroll depth, rage clicks, or engagement scoring. Every extra event
is one more thing to maintain and one more thing that can break quietly.
