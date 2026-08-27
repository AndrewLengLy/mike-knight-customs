#!/usr/bin/env node
/**
 * Adds an AVIF layer on top of the shipped WebP and keeps <picture> markup in sync.
 *
 *   cd tools && npm install     # once
 *   node tools/optimize-images.mjs [--check]
 *
 * Shipped photos are WebP. This wraps each <img src="*.webp"> in a <picture>
 * that offers AVIF first, so modern browsers take roughly a quarter less again
 * and everyone else still gets the WebP.
 *
 * IMPORTANT — where the originals live.
 * The full-resolution JPEG/PNG masters are NOT in the working tree; they were
 * removed when the site moved to WebP. AVIF must still be encoded from those
 * masters, never from the shipped WebP, because encoding a lossy file into
 * another lossy format stacks a second generation of loss. Recover them first:
 *
 *   git cat-file blob <ref>:images/work/venza/venza-01.jpg > <ORIGINALS>/...
 *
 * where <ref> is a commit that still has them (tag backup/pre-reconcile-53f3768,
 * or any commit before the WebP migration). Point ORIGINALS_DIR at that folder.
 * With no original available this script refuses to encode and says so, rather
 * than quietly shipping a degraded image.
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, statSync, unlinkSync, readdirSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const ORIGINALS_DIR = process.env.ORIGINALS_DIR || '';   // folder of recovered masters

const AVIF = { quality: 65, effort: 9, chromaSubsampling: '4:2:0' };

const htmlFiles = (dir, acc = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'tools'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) htmlFiles(p, acc);
    else if (e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
};

const pages = htmlFiles(ROOT);
const changes = { encoded: [], wrapped: [], removed: [], needsOriginal: [] };

// ---- 1. AVIF beside every WebP -------------------------------------------
const webps = [];
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.webp')) webps.push(p);
  }
})(join(ROOT, 'images'));

for (const webp of webps) {
  const base = webp.replace(/\.webp$/, '');
  const avif = `${base}.avif`;
  if (existsSync(avif) && statSync(avif).mtimeMs >= statSync(webp).mtimeMs) continue;

  const rel = relative(ROOT, base);
  const master = ORIGINALS_DIR
    ? ['jpg', 'png'].map((e) => join(ORIGINALS_DIR, `${rel}.${e}`)).find(existsSync)
    : ['jpg', 'png'].map((e) => `${base}.${e}`).find(existsSync);
  if (!master) { changes.needsOriginal.push(`${rel}.webp`); continue; }

  const buf = await sharp(master).avif(AVIF).toBuffer();       // written as-is, never re-encoded
  const webpBytes = statSync(webp).size;
  if (buf.length >= webpBytes) {
    if (existsSync(avif)) { if (!CHECK) unlinkSync(avif); changes.removed.push(relative(ROOT, avif)); }
    continue;
  }
  if (!CHECK) writeFileSync(avif, buf);
  changes.encoded.push(`${relative(ROOT, avif)} (${(buf.length / 1024).toFixed(0)}K, ${((1 - buf.length / webpBytes) * 100).toFixed(0)}% under webp)`);
}

// ---- 2. <picture> markup ---------------------------------------------------
for (const p of pages) {
  const orig = readFileSync(p, 'utf8');
  let html = orig;
  html = html.replace(/([ \t]*)(<img\b[^>]*?>)/g, (whole, indent, tag, offset) => {
    if (html.lastIndexOf('<picture>', offset) > html.lastIndexOf('</picture>', offset)) return whole;
    const src = tag.match(/\bsrc="([^"]+\.(?:webp|png))"/);
    if (!src) return whole;
    const base = src[1].replace(/\.(webp|png)$/, '');
    const disk = base.replace(/^\.\.\//, '').replace(/^\//, '');
    const fallback = join(ROOT, disk + (src[1].endsWith('.png') ? '.png' : '.webp'));
    const sources = [];
    for (const ext of ['avif', 'webp']) {
      const v = join(ROOT, `${disk}.${ext}`);
      if (v === fallback || !existsSync(v)) continue;
      // only offer a variant that actually beats the file it would replace
      if (statSync(v).size >= statSync(fallback).size) continue;
      sources.push(`${indent}  <source type="image/${ext}" srcset="${base}.${ext}" />`);
    }
    if (!sources.length) return whole;
    changes.wrapped.push(`${relative(ROOT, p)}: ${src[1]}`);
    return `${indent}<picture>\n${sources.join('\n')}\n${indent}  ${tag}\n${indent}</picture>`;
  });
  if (html !== orig && !CHECK) writeFileSync(p, html);
}

for (const [k, list] of Object.entries(changes)) {
  if (!list.length) continue;
  console.log(`\n${k} (${list.length}):`);
  list.slice(0, 12).forEach((l) => console.log('  ' + l));
  if (list.length > 12) console.log(`  ... and ${list.length - 12} more`);
}
if (changes.needsOriginal.length)
  console.log('\n  ^ no master found for those. Set ORIGINALS_DIR to a folder of recovered\n' +
              '    originals (see the header of this file). Nothing was encoded from WebP.');
const total = Object.values(changes).reduce((n, l) => n + l.length, 0);
console.log(total ? `\n${total} items ${CHECK ? 'would change' : 'changed'}.` : '\nUp to date, nothing to do.');
