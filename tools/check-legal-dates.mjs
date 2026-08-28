/* Legal pages carry their last updated date in two places: the visible readout
 * row a customer reads, and the JSON-LD dateModified a search engine reads.
 * With no template layer there is nothing forcing them to agree, and a legal
 * page whose stated date is wrong is worse than one with no date at all.
 *
 * Run before committing a change to any legal page:
 *   node tools/check-legal-dates.mjs
 *
 * Exits non-zero and names the file when the two disagree.
 */
import fs from 'node:fs';

const PAGES = ['privacy.html', 'terms.html', 'accessibility.html'];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

let failed = false;

for (const page of PAGES) {
  const html = fs.readFileSync(page, 'utf8');

  const visible = html.match(/<dt>Last Updated<\/dt><dd>([^<]+)<\/dd>/);
  const structured = html.match(/"dateModified":\s*"(\d{4}-\d{2}-\d{2})"/);

  if (!visible) { console.error(`FAIL ${page}: no visible "Last Updated" row`); failed = true; continue; }
  if (!structured) { console.error(`FAIL ${page}: no JSON-LD dateModified`); failed = true; continue; }

  // "August 28, 2026" -> "2026-08-28"
  const m = visible[1].trim().match(/^([A-Z][a-z]+) (\d{1,2}), (\d{4})$/);
  if (!m) { console.error(`FAIL ${page}: visible date "${visible[1]}" is not "Month D, YYYY"`); failed = true; continue; }

  const month = MONTHS.indexOf(m[1]) + 1;
  if (month === 0) { console.error(`FAIL ${page}: "${m[1]}" is not a month`); failed = true; continue; }

  const iso = `${m[3]}-${String(month).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;

  if (iso !== structured[1]) {
    console.error(`FAIL ${page}: visible ${visible[1]} (${iso}) does not match dateModified ${structured[1]}`);
    failed = true;
    continue;
  }

  console.log(`ok   ${page}  ${visible[1]}`);
}

process.exit(failed ? 1 : 0);
