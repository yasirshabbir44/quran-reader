/**
 * Downloads Arabic (Uthmani-style), English, and Urdu from risan/quran-json (MIT)
 * and writes a single file for offline/same-origin use in the app.
 *
 * Run: node scripts/build-quran-data.mjs
 */
import { writeFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'public', 'quran-full.json');

const BASE = 'https://raw.githubusercontent.com/risan/quran-json/master/dist';

async function fetchJson(path) {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) {
    throw new Error(`GET ${path} -> ${res.status}`);
  }
  return res.json();
}

function main() {
  return Promise.all([fetchJson('quran.json'), fetchJson('quran_en.json'), fetchJson('quran_ur.json')]).then(
    ([ar, en, ur]) => {
      const surahs = [];
      for (let k = 0; k < 114; k++) {
        const key = String(k);
        const sar = ar[key];
        const sen = en[key];
        const sur = ur[key];
        if (!sar || !sen || !sur || sar.id !== sen.id || sar.id !== sur.id) {
          throw new Error(`Mismatch at surah index ${k}`);
        }
        const n = sar.verses.length;
        if (sen.verses.length !== n || sur.verses.length !== n) {
          throw new Error(`Verse count mismatch surah ${sar.id}`);
        }
        const verses = [];
        for (let i = 0; i < n; i++) {
          const va = sar.verses[i];
          const ve = sen.verses[i];
          const vu = sur.verses[i];
          if (va.id !== ve.id || va.id !== vu.id) {
            throw new Error(`Ayah id mismatch surah ${sar.id} index ${i}`);
          }
          verses.push({
            ayah: va.id,
            ar: va.text,
            en: ve.translation ?? '',
            ur: vu.translation ?? '',
          });
        }
        surahs.push({
          number: sar.id,
          nameAr: sar.name,
          nameTranslit: sar.transliteration,
          revelationType: sar.type === 'meccan' ? 'meccan' : 'medinan',
          versesCount: sar.total_verses,
          verses,
        });
      }
      mkdirSync(dirname(OUT), { recursive: true });
      writeFileSync(OUT, JSON.stringify({ surahs }), 'utf8');
      const mb = (Buffer.byteLength(JSON.stringify({ surahs }), 'utf8') / (1024 * 1024)).toFixed(2);
      console.log(`Wrote ${OUT} (${mb} MiB), ${surahs.length} surahs.`);
    },
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
