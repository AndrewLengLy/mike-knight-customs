#!/usr/bin/env node
/**
 * Regenerates avif/webp variants and keeps <picture> markup in sync.
 *
 * Run it after adding photos or wiring up a new case file:
 *
 *   cd tools && npm install     # once
 *   node tools/optimize-images.mjs          # from the repo root
 *   node tools/optimize-images.mjs --check  # report only, change nothing
 *
 * Safe to run repeatedly. It only ever reads the original .jpg/.png, never an
 * existing variant, because encoding a variant from a variant stacks a second
 * generation of loss onto the image.
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, statSync, unlinkSync, readdirSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const AVIF = { quality: 65, effort: 9, chromaSubsampling: '4:2:0' };
const WEBP = { quality: 80, effort: 6, alphaQuality: 92 };

// Fetched by social crawlers and OS icon pickers, which send no Accept header
// worth negotiating on. These keep their original format.
const SINGLE_FORMAT = /favicon|apple-touch|\/og\//;

const htmlFiles = (dir, acc = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'standalone') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) htmlFiles(p, acc);
    else if (e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
};

const pages = htmlFiles(ROOT);
const changes = { encoded: [], wrapped: [], removed: [], skipped: [] };

// ---- 1. variants -----------------------------------------------------------
const referenced = new Set();
for (const p of pages)
  for (const m of readFileSync(p, 'utf8').matchAll(/src="([^"]+\.(?:jpg|png))"/g))
    referenced.add(m[1].replace(/^\.\.\//, '').replace(/^\//, ''));

for (const rel of [...referenced].sort()) {
  const src = join(ROOT, rel);
  if (!existsSync(src)) { changes.skipped.push(`${rel} (referenced but missing on disk)`); continue; }
  if (SINGLE_FORMAT.test('/' + rel)) continue;

  const bytes = statSync(src).size;
  const base = src.replace(/\.(jpg|png)$/, '');
  for (const [ext, opts] of [['avif', AVIF], ['webp', WEBP]]) {
    const out = `${base}.${ext}`;
    // Regenerate only when the variant is missing or older than its original.
    if (existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) continue;
    const buf = await sharp(src)[ext](opts).toBuffer();
    if (buf.length >= bytes) {                     // variant loses: do not ship it
      if (existsSync(out)) { if (!CHECK) unlinkSync(out); changes.removed.push(relative(ROOT, out)); }
      continue;
    }
    if (!CHECK) writeFileSync(out, buf);           // write the buffer, do not re-encode it
    changes.encoded.push(`${relative(ROOT, out)} (${(buf.length / 1024).toFixed(0)}K, -${((1 - buf.length / bytes) * 100).toFixed(0)}%)`);
  }
}

// ---- 2. markup -------------------------------------------------------------
for (const p of pages) {
  const orig = readFileSync(p, 'utf8');
  let html = orig;

  html = html.replace(/([ \t]*)(<img\b[^>]*?>)/g, (whole, indent, tag, offset) => {
    const openPic = html.lastIndexOf('<picture>', offset);
    if (openPic > html.lastIndexOf('</picture>', offset)) return whole;   // already wrapped
    const src = tag.match(/\bsrc="([^"]+)"/);
    if (!src) return whole;
    const base = src[1].replace(/\.(jpg|png)$/, '');
    if (base === src[1]) return whole;                                     // svg or other
    const disk = base.replace(/^\.\.\//, '').replace(/^\//, '');
    const have = ['avif', 'webp'].filter((e) => existsSync(join(ROOT, `${disk}.${e}`)));
    if (!have.length) return whole;
    changes.wrapped.push(`${relative(ROOT, p)}: ${src[1]}`);
    const sources = have.map((e) => `${indent}  <source type="image/${e}" srcset="${base}.${e}" />`).join('\n');
    return `${indent}<picture>\n${sources}\n${indent}  ${tag}\n${indent}</picture>`;
  });

  if (html !== orig && !CHECK) writeFileSync(p, html);
}

// ---- report ----------------------------------------------------------------
const label = CHECK ? 'would change' : 'changed';
for (const [k, list] of Object.entries(changes)) {
  if (!list.length) continue;
  console.log(`\n${k} (${list.length}):`);
  list.forEach((l) => console.log('  ' + l));
}
const total = Object.values(changes).reduce((n, l) => n + l.length, 0);
console.log(total ? `\n${total} items ${label}.` : '\nUp to date, nothing to do.');
