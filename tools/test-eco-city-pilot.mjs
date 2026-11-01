// בדיקות לבית הדיגיטלי של הפיילוט במפת אקו סיטי (maps/eco-city-demo/pilot/).
// הרצה משורש המאגר: node tools/test-eco-city-pilot.mjs
// צריך Playwright עם Chromium. אין כאן CI, אז מריצים מקומית לפני כל PR שנוגע בפיילוט.
// משתני סביבה (לא חובה):
//   LEAFLET_DIR   תיקייה עם leaflet.js ו-leaflet.css, כשאין גישה ל-cdnjs (הבקשות מנותבות אליה)
//   BASELINE_DIR  עותק של המאגר בלי השינוי (למשל git worktree של main), להשוואת המפה הרגילה
//   SHOTS_DIR     תיקייה לצילומי מסך
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = process.cwd();
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };

function serve(dir) {
  return new Promise((ok) => {
    const s = createServer(async (req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const f = normalize(join(dir, p));
      if (!f.startsWith(dir)) { res.writeHead(403); return res.end(); }
      try { const b = await readFile(f); res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' }); res.end(b); }
      catch { res.writeHead(404); res.end('not found'); }
    });
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}

let pass = 0, fail = 0;
function check(name, cond, info) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (info !== undefined ? '  → ' + JSON.stringify(info) : '')); }
}

const browser = await chromium.launch();
const srv = await serve(ROOT);
const base = `http://127.0.0.1:${srv.address().port}`;
const MAP = '/maps/eco-city-demo/';

async function page(width, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 800 }, deviceScaleFactor: width < 600 ? 2 : 1, isMobile: width < 600, hasTouch: width < 600, locale: 'he-IL' });
  const pg = await ctx.newPage();
  pg.errors = []; pg.requests = []; pg.writes = [];
  pg.on('pageerror', (e) => pg.errors.push(e.message));
  pg.on('request', (r) => { pg.requests.push(r.url()); if (!['GET', 'HEAD'].includes(r.method())) pg.writes.push(r.method() + ' ' + r.url()); });
  if (process.env.LEAFLET_DIR) {
    await pg.route('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/*', async (route) => {
      const f = route.request().url().endsWith('.css') ? 'leaflet.css' : 'leaflet.js';
      route.fulfill({ body: await readFile(join(process.env.LEAFLET_DIR, f)), contentType: f.endsWith('.css') ? 'text/css' : 'text/javascript' });
    });
  }
  // תמונות חיצוניות (Wix, ויקישיתוף) לא נחוצות לבדיקה
  await pg.route(/static\.wixstatic\.com|commons\.wikimedia\.org/, (r) => r.abort());
  for (const [path, body] of Object.entries(opts.fixtures || {})) {
    await pg.route('**' + MAP + 'pilot/' + path, (r) => r.fulfill({ body: JSON.stringify(body), contentType: 'application/json' }));
  }
  return pg;
}
async function open(pg, url) { await pg.goto(base + url, { waitUntil: 'load' }); await pg.waitForTimeout(1600); }
const shots = process.env.SHOTS_DIR; if (shots) await mkdir(shots, { recursive: true });
async function shot(pg, name) { if (shots) await pg.screenshot({ path: join(shots, name + '.png') }); }

// מצב המפה הרגילה: מה שנבדק כדי לוודא שלא השתנתה
async function mapState(pg) {
  return pg.evaluate(() => ({
    pilotClass: document.documentElement.className,
    banner: !!document.querySelector('.pl-banner'),
    chips: [...document.querySelectorAll('#filters .chip')].map((c) => c.textContent.trim()),
    labels: document.querySelectorAll('.plab').length,
    anchors: document.querySelectorAll('.anc').length,
    markers: document.querySelectorAll('.leaflet-marker-icon').length,
    detailOpen: document.getElementById('detail').classList.contains('open'),
    title: document.title,
    head: document.querySelector('.head h1').textContent,
  }));
}

console.log('1. המפה הרגילה: כניסה לפרויקט ההדגמה, בלי מעבר אוטומטי; ?pilot=off כמו קודם');
async function baseline(w, url) {
  if (!process.env.BASELINE_DIR) return null;
  const bs = await serve(process.env.BASELINE_DIR), bpg = await page(w);
  await bpg.goto(`http://127.0.0.1:${bs.address().port}${url}`, { waitUntil: 'load' }); await bpg.waitForTimeout(1600);
  const st = await mapState(bpg); await bpg.context().close(); bs.close(); return st;
}
for (const w of [390, 1280]) {
  // BASELINE_DIR: המפה בלי הפיילוט (main שלפני השינוי, בכתובת הרגילה)
  const before = await baseline(w, MAP);
  const pg = await page(w);
  await open(pg, MAP);
  await pg.waitForTimeout(2500);
  const st = await mapState(pg);
  check(`${w}px: בכתובת הרגילה יש כפתור "פרויקט ההדגמה" ופס אב־טיפוס`, st.chips[0] === 'פרויקט ההדגמה' && st.banner, st.chips);
  check(`${w}px: בכתובת הרגילה הבית לא נפתח מעצמו`, !st.detailOpen);
  if (before) check(`${w}px: פרויקטים, עוגנים וכותרת כמו במפה בלי הפיילוט`, st.labels === before.labels && st.anchors === before.anchors && st.title === before.title && st.head === before.head, { before, st });
  check(`${w}px: אין שגיאות JavaScript`, pg.errors.length === 0, pg.errors);
  await shot(pg, `regular-${w}`);
  const cta = await pg.evaluate(() => { const mc = document.querySelector('.motif .mc'); return { exists: !!document.querySelector('.pl-cta'), mcFont: mc ? getComputedStyle(mc).fontFamily : '', v3: document.documentElement.classList.contains('v3') }; });
  check(`${w}px: אין כפתור צף מעל המפה, הכניסה היא מהפס למטה`, cta && !cta.exists, cta);
  /* בתצוגת התלת מימד אין איורי אווירה; בשטוחה השמות שלהם ב-Rubik */
  check(`${w}px: שמות האיורים בגופן של שאר הכותרות (Rubik), ובתלת מימד בלי איורים`, cta && (cta.v3 ? cta.mcFont === '' : /^Rubik/.test(cta.mcFont)), cta && cta.mcFont);
  await pg.click('.pl-chip'); await pg.waitForTimeout(900);
  check(`${w}px: לחיצה על הכפתור במפה הרגילה פותחת את הבית`, await pg.evaluate(() => document.getElementById('detail').classList.contains('pl-home') && document.getElementById('detail').classList.contains('open')));
  await pg.context().close();

  const off = await page(w);
  await open(off, MAP + '?pilot=off');
  const so = await mapState(off);
  check(`${w}px: ?pilot=off: אין בקשה לקובצי הפיילוט ואין פס`, !off.requests.some((u) => u.includes('/pilot/')) && !so.banner && !/pilot/.test(so.pilotClass), so);
  if (before) check(`${w}px: ?pilot=off זהה למפה בלי הפיילוט`, JSON.stringify(so) === JSON.stringify(before), { before, so });
  check(`${w}px: ?pilot=off בלי שגיאות JavaScript`, off.errors.length === 0, off.errors);
  await off.context().close();
}

console.log('2. קישור הפיילוט: המפה נשארת, והבית נפתח רק בלחיצה');
for (const w of [390, 1280]) {
  const pg = await page(w);
  await open(pg, MAP + '?pilot=demo&src=share');
  // רגרסיה: הקישור לא עובר מעצמו לבית של הפרויקט (היה setTimeout(open) ב-start)
  await pg.waitForTimeout(2500);
  const land = await pg.evaluate(() => {
    const m = document.getElementById('map').getBoundingClientRect(), pin = document.querySelector('.pl-dot')?.getBoundingClientRect();
    return { open: document.getElementById('detail').classList.contains('open'), url: location.pathname + location.search,
      map: m.width > 300 && m.height > 300, pinInView: !!pin && pin.left >= 0 && pin.right <= innerWidth && pin.top >= m.top && pin.bottom <= m.bottom,
      chip: !!document.querySelector('.pl-chip'), banner: !!document.querySelector('.pl-banner'), labels: document.querySelectorAll('.plab').length, anchors: document.querySelectorAll('.anc').length };
  });
  check(`${w}px: המפה נשארת פתוחה, בלי מעבר אוטומטי לבית`, !land.open && land.map && land.url === '/maps/eco-city-demo/?pilot=demo&src=share', land);
  // בטלפון התצוגה הרגילה צרה, והסמן יכול להיות מחוץ למסך. הכניסה היא הכפתור בפס, שתמיד גלוי
  check(`${w}px: כפתור "פרויקט ההדגמה" בפס${w > 600 ? ', והסמן בתוך המפה' : ''}`, land.chip && (w < 600 || land.pinInView), land);
  check(`${w}px: הפרויקטים והעוגנים של המפה מוצגים כרגיל`, land.labels > 0 && land.anchors > 0, land);
  await shot(pg, `landing-${w}`);
  await pg.click('.pl-chip'); await pg.waitForTimeout(900);
  const r = await pg.evaluate(() => {
    const d = document.getElementById('detail'), q = (s) => d.querySelectorAll(s);
    return {
      open: d.classList.contains('open'), home: d.classList.contains('pl-home'),
      banner: document.querySelector('.pl-banner')?.textContent, bannerVisible: !!document.querySelector('.pl-banner')?.getBoundingClientRect().height,
      title: d.querySelector('h2')?.textContent, sections: [...q('.pl-sec')].map((s) => s.id),
      tabs: [...q('.pl-tabs [data-go]')].map((b) => b.textContent), updates: q('.pl-upd-l li').length, pending: q('.pl-upd-l li.pend .pl-st.pend').length,
      faq: q('.pl-faq details').length, status: d.querySelector('.pl-tag')?.textContent, dir: getComputedStyle(d).direction,
      overflow: d.scrollWidth > d.clientWidth + 1, docOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      heroImg: d.querySelector('.pl-ring img')?.naturalWidth > 0,
    };
  });
  check(`${w}px: לחיצה על הכפתור פותחת את הבית של הפרויקט`, r.open && r.home && r.title === 'פרויקט הדגמה בצפון הישן', r);
  check(`${w}px: פס "אב־טיפוס להמחשה — לא פרויקט אמיתי" גלוי`, r.banner === 'אב־טיפוס להמחשה — לא פרויקט אמיתי' && r.bannerVisible, r.banner);
  check(`${w}px: כל החלקים שיש להם תוכן, ובלי מפגשים (אין מפגש מאושר)`, JSON.stringify(r.sections) === JSON.stringify(['pl-overview', 'pl-updates', 'pl-faq', 'pl-contact', 'pl-hood']), r.sections);
  check(`${w}px: 3 עדכונים, אחד מהם "כפוף לאישור"`, r.updates === 3 && r.pending === 1, r);
  check(`${w}px: 5 שאלות נפוצות ותווית "תוכן לדוגמה"`, r.faq === 5 && r.status === 'סטטוס המידע: תוכן לדוגמה', r);
  check(`${w}px: כיוון RTL ובלי גלילה לרוחב`, r.dir === 'rtl' && !r.overflow && !r.docOverflow, r);
  check(`${w}px: איור הפתיחה נטען`, r.heroImg);
  await shot(pg, `home-${w}`);
  // גלילה וצילום של אמצע הדף
  await pg.click('.pl-tabs [data-go="pl-updates"]'); await pg.waitForTimeout(700);
  const cur = await pg.evaluate(() => document.querySelector('.pl-tabs [aria-current="true"]')?.dataset.go);
  check(`${w}px: לחיצה על לשונית "מה חדש" גוללת אליה ומסמנת אותה`, cur === 'pl-updates', cur);
  await shot(pg, `home-updates-${w}`);
  await pg.click('.pl-faq details summary'); await pg.waitForTimeout(200);
  check(`${w}px: שאלה נפוצה נפתחת`, await pg.evaluate(() => document.querySelector('.pl-faq details').open));
  await pg.click('.pl-tabs [data-go="pl-faq"]'); await pg.waitForTimeout(700); await shot(pg, `home-faq-${w}`);
  await pg.click('.pl-tabs [data-go="pl-contact"]'); await pg.waitForTimeout(700); await shot(pg, `home-contact-${w}`);
  const links = await pg.evaluate(() => [...document.querySelectorAll('#detail a[href]')].map((a) => a.href));
  check(`${w}px: כל הקישורים ב-https`, links.length > 0 && links.every((u) => u.startsWith('https://')), links);

  // שאלה לצוות: תצוגה בלבד
  await pg.click('.pl-tabs [data-go="pl-overview"]'); await pg.waitForTimeout(500);
  await pg.click('[data-ask]'); await pg.waitForTimeout(400);
  const ask = await pg.evaluate(() => {
    const s = document.querySelector('.pl-sheet');
    return s && { fields: s.querySelectorAll('input,select,textarea').length, enabled: s.querySelectorAll('input:not([disabled]),select:not([disabled]),textarea:not([disabled]),.btn:not([disabled])').length, forms: document.querySelectorAll('form').length, warn: s.querySelector('.pl-warn')?.textContent };
  });
  check(`${w}px: "שאלה לצוות" פותח תצוגה עם שדות כבויים ובלי טופס`, ask && ask.fields === 4 && ask.enabled === 0 && ask.forms === 0 && /השליחה כבויה/.test(ask.warn), ask);
  await shot(pg, `ask-${w}`);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
  check(`${w}px: Esc סוגר רק את חלון השאלה`, await pg.evaluate(() => !document.querySelector('.pl-sheet') && document.getElementById('detail').classList.contains('open')));

  // מעבר בין הבית למפה
  await pg.click('#detail .back'); await pg.waitForTimeout(900);
  check(`${w}px: "חזרה למפה" סוגר את הבית`, await pg.evaluate(() => !document.getElementById('detail').classList.contains('open')));
  await pg.click('.pl-chip'); await pg.waitForTimeout(900);
  check(`${w}px: הצ'יפ "פרויקט ההדגמה" פותח שוב את הבית`, await pg.evaluate(() => document.getElementById('detail').classList.contains('pl-home') && document.getElementById('detail').classList.contains('open')));
  await pg.click('.pl-tabs .pl-back2'); await pg.waitForTimeout(1200);
  const hood = await pg.evaluate(() => ({ open: document.getElementById('detail').classList.contains('open'), threads: document.querySelectorAll('path.thread').length }));
  check(`${w}px: "מפה" מהלשוניות חוזר למפה עם קווים לשכונה`, !hood.open && hood.threads >= 2, hood);
  await shot(pg, `hood-map-${w}`);
  await pg.click('.pl-lab'); await pg.waitForTimeout(900);
  check(`${w}px: לחיצה על הסמן במפה פותחת את הבית`, await pg.evaluate(() => document.getElementById('detail').classList.contains('pl-home') && document.getElementById('detail').classList.contains('open')));
  await pg.click('.pl-tabs [data-go="pl-hood"]'); await pg.waitForTimeout(700);
  await pg.click('#pl-hood .near li[data-ga]'); await pg.waitForTimeout(900);
  check(`${w}px: עוגן ברשימת השכונה פותח את כרטיס המקום`, await pg.evaluate(() => /הבניינים של אקו סיטי סביב/.test(document.getElementById('detail').textContent)));
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(500);
  check(`${w}px: Esc חוזר למפה`, await pg.evaluate(() => !document.getElementById('detail').classList.contains('open')));
  check(`${w}px: שום בקשה שאינה GET (אין שליחה)`, pg.writes.length === 0, pg.writes);
  check(`${w}px: אין שגיאות JavaScript`, pg.errors.length === 0, pg.errors);
  await pg.context().close();
}

console.log('3. ניקוי תוכן מסוכן');
{
  const evil = {
    demo: true,
    project: { name: '<img src=x onerror="window.__x=1">שם', lat: 32.0858, lng: 34.7752, description: '<script>window.__x=2</script>תיאור',
      infoStatus: '"><b>x</b>', updated: '2026-10-24', hero: { image: '../../evil.png' } },
    updates: [{ date: '2026-10-01', status: 'approved', title: 'כותרת', body: 'גוף', links: [{ label: 'רע', url: 'javascript:alert(1)' }, { label: 'לא מוצפן', url: 'http://example.com' }, { label: 'טוב', url: 'https://example.com/a' }] }],
    links: [{ label: 'x', url: 'https://user:pw@example.com' }],
    inquiry: { mode: 'link', url: 'http://example.com/form' },
  };
  const pg = await page(390, { fixtures: { 'evil.json': evil } });
  await open(pg, MAP + '?pilot=evil');
  await pg.click('.pl-chip'); await pg.waitForTimeout(900);
  const r = await pg.evaluate(() => ({
    x: window.__x, title: document.querySelector('#detail h2')?.textContent,
    hrefs: [...document.querySelectorAll('#detail a[href]')].map((a) => a.getAttribute('href')),
    imgs: [...document.querySelectorAll('#detail img')].map((i) => i.getAttribute('src')),
    ask: !!document.querySelector('.pl-ask'), tag: document.querySelector('.pl-tag')?.textContent,
  }));
  check('קוד בתוכן לא רץ, ומוצג כטקסט', r.x === undefined && r.title === '<img src=x onerror="window.__x=1">שם' && r.tag === 'סטטוס המידע: "><b>x</b>', r);
  check('רק קישור https תקין נשאר (לא javascript:, לא http, לא עם סיסמה)', JSON.stringify(r.hrefs) === JSON.stringify(['https://example.com/a']), r.hrefs);
  check('תמונה מחוץ לתיקיות המפה לא נטענת', r.imgs.length === 0, r.imgs);
  check('"שאלה לצוות" עם קישור לא מאובטח מוסתר', !r.ask);
  check('אין שגיאות JavaScript', pg.errors.length === 0, pg.errors);
  await pg.context().close();
}

console.log('4. תוכן חסר, קובץ חסר, שם לא תקין');
{
  const pg = await page(390, { fixtures: { 'min.json': { project: { name: 'פרויקט מינימלי', lat: 32.0858, lng: 34.7752 } } } });
  await open(pg, MAP + '?pilot=min');
  await pg.click('.pl-chip'); await pg.waitForTimeout(900);
  const r = await pg.evaluate(() => ({ sections: [...document.querySelectorAll('.pl-sec')].map((s) => s.id), banner: !!document.querySelector('.pl-banner'), ask: !!document.querySelector('.pl-ask'), tabs: document.querySelectorAll('.pl-tabs [data-go]').length }));
  check('רק סקירה ושכונה מוצגות, בלי פס הדגמה ובלי שאלה לצוות', JSON.stringify(r.sections) === JSON.stringify(['pl-overview', 'pl-hood']) && !r.banner && !r.ask && r.tabs === 2, r);
  check('אין שגיאות JavaScript', pg.errors.length === 0, pg.errors);
  await pg.context().close();

  const pg2 = await page(390);
  await open(pg2, MAP + '?pilot=nope');
  const st = await mapState(pg2);
  check('קובץ שלא קיים: המפה עובדת כרגיל, בלי פיילוט', !st.banner && !st.detailOpen && !/pilot/.test(st.pilotClass) && st.anchors > 0, st);
  check('אין שגיאות JavaScript', pg2.errors.length === 0, pg2.errors);
  await pg2.context().close();

  const pg3 = await page(390, { fixtures: { 'bad.json': { project: { name: 'x', lat: 40, lng: 34.7 } } } });
  await open(pg3, MAP + '?pilot=bad');
  check('מיקום מחוץ לאזור: הפיילוט לא נטען', !(await mapState(pg3)).banner && !(await mapState(pg3)).detailOpen);
  await pg3.context().close();

  const pg4 = await page(390);
  await open(pg4, MAP + '?pilot=../../index');
  check('שם עם תווים אסורים: לא נטען שום קובץ פיילוט', !pg4.requests.some((u) => u.includes('/pilot/')), pg4.requests.filter((u) => u.includes('pilot')));
  await pg4.context().close();
}

console.log('5. כתובת השיתוף');
{
  const pg = await page(390);
  await pg.goto(base + MAP + 'home/', { waitUntil: 'load' });
  await pg.waitForTimeout(3000);
  const r = await pg.evaluate(() => ({ url: location.pathname + location.search, open: document.getElementById('detail')?.classList.contains('open'), pin: !!document.querySelector('.pl-pin') }));
  check('כתובת השיתוף מעבירה למפה עם הפיילוט, והמפה נשארת בלי לפתוח את הבית', r.url === '/maps/eco-city-demo/?pilot=demo&src=share' && r.pin && !r.open, r);
  const html = await readFile(join(ROOT, 'maps/eco-city-demo/home/index.html'), 'utf8');
  const og = (p) => (html.match(new RegExp(`property="og:${p}" content="([^"]*)"`)) || [])[1];
  check('יש og:title, og:description ו-og:image מלא', !!og('title') && !!og('description') && /^https:\/\/osimkehila\.co\.il\//.test(og('image') || ''), { t: og('title'), i: og('image') });
  const img = og('image') && join(ROOT, new URL(og('image')).pathname);
  let size = 0; try { size = (await readFile(img)).length; } catch {}
  check('תמונת התצוגה המקדימה קיימת וקטנה מ-300KB (מגבלה של וואטסאפ)', size > 0 && size < 300 * 1024, size);
  await pg.context().close();
}

console.log('6. קישור ישיר לבית, בלי לעבור דרך המפה, ומה רואים מיד');
for (const w of [390, 1280]) {
  const pg = await page(w);
  await open(pg, MAP + '?pilot=demo&home=1');
  const r = await pg.evaluate(() => {
    const d = document.getElementById('detail'), q = (s) => [...d.querySelectorAll(s)];
    const tiles = q('.pl-tiles button').map((b) => { const r = b.getBoundingClientRect(); return { t: b.querySelector('b').textContent, go: b.dataset.go || (b.hasAttribute('data-ask') ? 'ask' : ''), seen: r.top >= 0 && r.bottom <= innerHeight }; });
    return { open: d.classList.contains('open') && d.classList.contains('pl-home'), tiles, brand: d.querySelector('.pl-wm')?.textContent,
      promise: d.querySelector('.pl-promise p')?.textContent || '', text: d.textContent, banner: !!document.querySelector('.pl-banner') };
  });
  check(`${w}px: ?pilot=demo&home=1 פותח את הבית מיד`, r.open, r.open);
  check(`${w}px: אריחי התועלת (פרויקט, עדכונים, תשובות, שאלה לצוות) גלויים במסך הראשון`, JSON.stringify(r.tiles.map((t) => t.t)) === JSON.stringify(['על הפרויקט', 'עדכונים', 'תשובות לשאלות', 'שאלה לצוות']) && r.tiles.every((t) => t.seen), r.tiles);
  check(`${w}px: שורת התועלת מתחת לכותרת, ומיתוג ecocity`, r.brand === 'ecocity' && ['מידע', 'עדכונים', 'תשובות', 'קשר'].every((k) => r.promise.includes(k)), { b: r.brand, p: r.promise });
  check(`${w}px: רק מסלול בעלי הדירות: אין מסלול לרוכשים או ללקוחות`, !/רוכש|לקוחות קיימים|לאחר האכלוס/.test(r.text) , r.text.match(/רוכש|לקוחות קיימים/));
  check(`${w}px: פס האב־טיפוס גלוי גם בכניסה ישירה`, r.banner);
  if (w === 390) await shot(pg, 'direct-390');
  // כל אריח מוביל לחלק שלו
  for (const t of r.tiles.filter((t) => t.go && t.go !== 'ask')) {
    await pg.evaluate(() => document.getElementById('detail').scrollTo(0, 0));
    await pg.click(`.pl-tiles [data-go="${t.go}"]`); await pg.waitForTimeout(800);
    const seen = await pg.evaluate((id) => { const s = document.getElementById(id), tb = document.querySelector('.pl-tabs'); const r = s.getBoundingClientRect(); return r.top >= (tb ? tb.getBoundingClientRect().bottom - 30 : 0) && r.top < innerHeight / 2; }, t.go);
    check(`${w}px: האריח "${t.t}" גולל לחלק שלו`, seen);
  }
  await pg.evaluate(() => document.getElementById('detail').scrollTo(0, 0));
  await pg.click('.pl-tiles [data-ask]'); await pg.waitForTimeout(400);
  check(`${w}px: האריח "שאלה לצוות" פותח את התצוגה (בלי טופס ובלי שליחה)`, await pg.evaluate(() => !!document.querySelector('.pl-sheet') && !document.querySelector('form')) && pg.writes.length === 0, pg.writes);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(300); await pg.keyboard.press('Escape'); await pg.waitForTimeout(700);
  check(`${w}px: אחרי סגירה המפה זמינה כרגיל`, await pg.evaluate(() => !document.getElementById('detail').classList.contains('open') && document.querySelectorAll('.plab').length > 0));
  check(`${w}px: אין שגיאות JavaScript`, pg.errors.length === 0, pg.errors);
  await pg.context().close();
}

console.log('7. עמוד השיתוף הייעודי של הפרויקט');
{
  let built = true; try { execFileSync('node', ['tools/build-pilot-share.mjs', '--check'], { stdio: 'pipe' }); } catch (e) { built = String(e.stdout || e.message); }
  check('עמודי השיתוף מעודכנים לפי קובצי התוכן (build-pilot-share --check)', built === true, built);
  const pg = await page(390);
  await pg.goto(base + MAP + 'home/demo/', { waitUntil: 'load' });
  await pg.waitForTimeout(3000);
  const r = await pg.evaluate(() => ({ url: location.pathname + location.search, open: document.getElementById('detail')?.classList.contains('pl-home') }));
  check('home/demo/ פותח ישר את הבית של הפרויקט', r.url === '/maps/eco-city-demo/?pilot=demo&home=1&src=share' && r.open, r);
  const html = await readFile(join(ROOT, 'maps/eco-city-demo/home/demo/index.html'), 'utf8');
  const og = (p) => (html.match(new RegExp(`property="og:${p}" content="([^"]*)"`)) || [])[1];
  check('התגיות של עמוד הפרויקט: כותרת, תיאור, כתובת ותמונה משלו', og('title') === 'Eco City · הבית הדיגיטלי של פרויקט ההדגמה' && !!og('description') &&
    og('url') === 'https://osimkehila.co.il/maps/eco-city-demo/home/demo/' && og('image') === 'https://osimkehila.co.il/maps/eco-city-demo/home/demo/preview.jpg', { t: og('title'), u: og('url'), i: og('image') });
  let size = 0; try { size = (await readFile(join(ROOT, new URL(og('image')).pathname))).length; } catch {}
  check('התמונה קיימת וקטנה מ-300KB', size > 0 && size < 300 * 1024, size);
  check('אין בעמוד השיתוף סקריפט חיצוני או טופס', !/<script[^>]+src=|<form/i.test(html));
  check('אין שגיאות JavaScript', pg.errors.length === 0, pg.errors);
  await pg.context().close();
}

console.log('8. רגרסיה: כל כרטיסי הפרויקטים והמקומות נפתחים כמו בלי הפיילוט');
async function cards(url) {
  const pg = await page(1280);
  await open(pg, url);
  // גם המאוכלסים: מדליקים את השכבה
  await pg.evaluate(() => { const c = [...document.querySelectorAll('#filters .chip')].find((b) => b.textContent.includes('מאוכלסים')); if (c && !c.classList.contains('on')) c.click(); });
  await pg.waitForTimeout(800);
  // המפה בונה מחדש את התוויות אחרי זום, ולכן כל סמן נמצא מחדש לפי המזהה שלו (data-p לפרויקט, data-a לעוגן)
  const keys = await pg.evaluate(() => [...new Set([...document.querySelectorAll('.leaflet-marker-icon :is(.plab,.plab-none,.bld)[data-p]')].map((e) => 'p' + e.dataset.p)
    .concat([...document.querySelectorAll('.leaflet-marker-icon .anc[data-a]')].map((e) => 'a' + e.dataset.a)))]);
  const n = keys.length, out = [];
  for (const k of keys) {
    const r = await pg.evaluate((k) => { const d = document.getElementById('detail');
      const e = document.querySelector(k[0] === 'p' ? `.leaflet-marker-icon :is(.plab,.plab-none,.bld)[data-p="${k.slice(1)}"]` : `.leaflet-marker-icon .anc[data-a="${k.slice(1)}"]`);
      if (!e) return { k, missing: true };
      e.closest('.leaflet-marker-icon').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return d.classList.contains('open') ? { k, h: d.querySelector('h2')?.textContent || '', len: d.textContent.length, home: d.classList.contains('pl-home') } : { k, closed: true }; }, k);
    out.push(r);
    if (!r.closed && !r.missing) { await pg.keyboard.press('Escape'); await pg.waitForTimeout(450); }
  }
  const errors = pg.errors; await pg.context().close();
  return { n, out, errors };
}
{
  const on = await cards(MAP), off = await cards(MAP + '?pilot=off');
  const opened = on.out.filter((c) => c.h);
  check(`כל סמן של פרויקט ושל מקום פותח כרטיס (${opened.length} מתוך ${on.n})`, on.n > 30 && opened.length === on.n, on.out.filter((c) => !c.h).slice(0, 8));
  check('אותם כרטיסים, אותן כותרות ואותו תוכן כמו ב-?pilot=off', JSON.stringify(on.out.map((c) => [c.k, c.h, c.len])) === JSON.stringify(off.out.map((c) => [c.k, c.h, c.len])),
    on.out.map((c, i) => [c.h, c.len, off.out[i]?.h, off.out[i]?.len]).filter((x) => x[0] !== x[2] || x[1] !== x[3]).slice(0, 5));
  check('אף כרטיס פרויקט לא נפתח כבית של הפיילוט', on.out.every((c) => !c.home));
  check('אין שגיאות JavaScript בשתי המפות', on.errors.length === 0 && off.errors.length === 0, [on.errors, off.errors]);
}

await browser.close(); srv.close();
console.log(`\n${pass} עברו, ${fail} נכשלו`);
process.exit(fail ? 1 : 0);
