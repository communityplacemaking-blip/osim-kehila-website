// יוצר עמוד שיתוף לוואטסאפ לכל פרויקט פיילוט שיש לו חלק "share" בקובץ התוכן.
// וואטסאפ לא מריץ JavaScript ולא רואה פרמטרים, ולכן כל פרויקט צריך עמוד סטטי משלו עם תגיות og.
// הרצה משורש המאגר:  node tools/build-pilot-share.mjs          כותב את maps/eco-city-demo/home/<שם>/index.html
//                     node tools/build-pilot-share.mjs --check  נכשל אם עמוד חסר או לא מעודכן (לבדיקות)
import { readFile, writeFile, readdir, stat, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const SITE = 'https://osimkehila.co.il/maps/eco-city-demo/';
const DIR = 'maps/eco-city-demo';
const check = process.argv.includes('--check');
const HE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const h = (s) => String(s).replace(/[&<>"']/g, (c) => HE[c]);
const txt = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : '');

function page(slug, s, demo) {
  const url = `${SITE}home/${slug}/`, img = `${url}${s.image}`;
  const go = `../../?pilot=${slug}&home=1&src=share`;
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<!-- נוצר על ידי tools/build-pilot-share.mjs מתוך pilot/${slug}.json. לא לערוך ביד.
     התגיות כאן הן מה שוואטסאפ מציג. דפדפן רגיל עובר מיד לבית הדיגיטלי של הפרויקט, בלי לעבור דרך המפה. -->
<title>${h(s.title)}${demo ? ' (אב־טיפוס)' : ''}</title>
<meta name="description" content="${h(s.description)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="he_IL">
<meta property="og:site_name" content="Eco City">
<meta property="og:title" content="${h(s.title)}">
<meta property="og:description" content="${h(s.description)}">
<meta property="og:url" content="${h(url)}">
<meta property="og:image" content="${h(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${h(s.imageAlt || s.title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#1E3F3F">
<script>location.replace(${JSON.stringify(go)});</script>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#1E3F3F;color:#FFF9F5;font:16px Heebo,Arial,sans-serif;text-align:center}a{color:#E2C27A}</style>
</head>
<body>
<p>פותחים את הבית הדיגיטלי של הפרויקט…<br><a href="${h(go)}">אם זה לא קורה, לחצו כאן</a></p>
</body>
</html>
`;
}

let bad = 0, n = 0;
for (const f of (await readdir(join(DIR, 'pilot'))).filter((f) => f.endsWith('.json')).sort()) {
  const slug = f.slice(0, -5);
  if (!/^[a-z0-9-]{1,40}$/.test(slug)) { console.error(`✗ ${f}: שם לא תקין`); bad++; continue; }
  const c = JSON.parse(await readFile(join(DIR, 'pilot', f), 'utf8'));
  if (!c.share) continue;
  const s = { title: txt(c.share.title, 90), description: txt(c.share.description, 200), image: c.share.image, imageAlt: txt(c.share.imageAlt, 120) };
  if (!s.title || !s.description || !/^[a-z0-9-]+\.(jpe?g|png)$/.test(s.image || '')) { console.error(`✗ ${f}: share צריך title, description ו-image (קובץ jpg או png בתיקייה home/${slug}/)`); bad++; continue; }
  const out = join(DIR, 'home', slug);
  try { const z = (await stat(join(out, s.image))).size; if (z > 300 * 1024) { console.error(`✗ ${slug}: התמונה ${Math.round(z / 1024)}KB, וואטסאפ צריך עד 300KB`); bad++; continue; } }
  catch { console.error(`✗ ${slug}: חסרה התמונה home/${slug}/${s.image}`); bad++; continue; }
  const html = page(slug, s, c.demo === true), file = join(out, 'index.html');
  n++;
  if (check) {
    const cur = await readFile(file, 'utf8').catch(() => '');
    if (cur !== html) { console.error(`✗ ${file} חסר או לא מעודכן. הריצו: node tools/build-pilot-share.mjs`); bad++; }
    else console.log(`✓ ${file}`);
  } else { await mkdir(out, { recursive: true }); await writeFile(file, html); console.log(`נכתב ${file}`); }
}
if (!n && !bad) console.log('אין פרויקט עם חלק share');
process.exit(bad ? 1 : 0);
