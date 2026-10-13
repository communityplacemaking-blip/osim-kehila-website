// neighborhood-map-art.js
// איור המפה של שכונה ט׳: מחולל SVG דטרמיניסטי (אותו seed = אותו איור).
// כיוון עיצובי: איור שכונה מצויר בעדינות, בפלטה של קרם, נייבי וטרקוטה (וגוונים שלהם בלבד).
// בלוקים, רחובות ומבנים קטנים בקו עיפרון רך, מעט עצים, גבול שכונה בנייבי, ובפינה הימנית התחתונה מוטיב קו רקיע עירוני של באר שבע
// (מגדל מים, מגדלים ומבנים נמוכים) — קישוטי בלבד ואינו מסמן מיקום.
// זה איור להמחשה בלבד: הצורה, הרחובות, הבתים והעצים אינם מבוססים על מפה גיאוגרפית, ואין בו שמות רחובות או אתרים.
// מיקום סימון על האיור אינו כתובת.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NeighborhoodMapArt = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const W = 1000;
  const H = 800;
  /** קודקודי הצורה (במערכת הצירים של האיור, 1000x800). זה לא גבול גיאוגרפי. */
  const BOUNDARY = [[170, 70], [420, 92], [640, 190], [830, 360], [925, 620], [700, 742], [390, 700], [130, 545], [78, 300]];
  /** נשמר לתאימות: אין אזורי פארק נפרדים באיור. */
  const PARKS = [];

  // קרם, נייבי וטרקוטה — וגוונים שלהם בלבד.
  const C = {
    paper: '#f7f0e2', cream: '#fbf6ec', sand: '#efdfc4', sand2: '#e9d4b2', sand3: '#f3e7d2', street: '#fdf9f1',
    navy: '#1d3550', navy2: '#4a6079', navyTint: '#c9d2dc', navyWash: '#dfe4e8', terra: '#c4593a', terraTint: '#ecc7b6', terraWash: '#f5e2d8',
  };
  const FONT = "Heebo, Assistant, Arial, sans-serif";

  /** שדרות מופשטות (עקומות בזייה) שחוצות את השכונה. לא רחובות אמיתיים. */
  const LANES = [
    [[100, 470], [300, 395], [450, 525], [640, 440]],
    [[640, 440], [830, 355], [900, 420], [990, 370]],
    [[300, 40], [370, 220], [320, 360], [430, 520]],
    [[430, 520], [540, 680], [520, 720], [570, 790]],
    [[650, 130], [640, 280], [730, 360], [760, 470]],
    [[760, 470], [790, 600], [800, 680], [700, 780]],
    [[60, 260], [230, 290], [390, 240], [560, 330]],
  ];
  const GRID_ANGLE = -14; // מעלות: רשת הרחובות המשנית מוטה מעט, כמו באיור יד
  const GRID_STEP = 74;

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function inPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  const f = (n) => Math.round(n * 10) / 10;
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  function bezierPoints(b, steps) {
    const out = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, u = 1 - t;
      out.push([
        u * u * u * b[0][0] + 3 * u * u * t * b[1][0] + 3 * u * t * t * b[2][0] + t * t * t * b[3][0],
        u * u * u * b[0][1] + 3 * u * u * t * b[1][1] + 3 * u * t * t * b[2][1] + t * t * t * b[3][1],
      ]);
    }
    return out;
  }

  /** "קו עיפרון" עדין: מפצל לקטעים ומרעיד מעט כל נקודה. */
  function jitter(pts, amp, rand, closed, seg) {
    const out = [];
    const L = closed ? pts.length : pts.length - 1;
    for (let i = 0; i < L; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const n = Math.max(1, Math.round(dist(a, b) / (seg || 30)));
      for (let s = 0; s < n; s++) {
        const t = s / n;
        out.push([a[0] + (b[0] - a[0]) * t + (rand() - 0.5) * amp, a[1] + (b[1] - a[1]) * t + (rand() - 0.5) * amp]);
      }
    }
    if (!closed) { const e = pts[pts.length - 1]; out.push([e[0] + (rand() - 0.5) * amp, e[1] + (rand() - 0.5) * amp]); }
    return out;
  }
  const poly = (pts, closed) => 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join(' L') + (closed ? 'Z' : '');
  /** קו מתאר מצויר: מעבר אחד או שניים עם רעד קטן. */
  function pencil(pts, rand, o) {
    const opt = Object.assign({ amp: 1.4, w: 1.4, color: C.navy, closed: false, passes: 1, seg: 30, opacity: 1, fill: 'none' }, o || {});
    let s = '';
    for (let p = 0; p < opt.passes; p++) {
      s += `<path d="${poly(jitter(pts, opt.amp, rand, opt.closed, opt.seg), opt.closed)}" fill="${p ? 'none' : opt.fill}" stroke="${opt.color}" stroke-width="${f(p ? opt.w * 0.55 : opt.w)}" stroke-linecap="round" stroke-linejoin="round" opacity="${p ? f(opt.opacity * 0.6) : opt.opacity}"/>`;
    }
    return s;
  }

  // מערכת צירים מסובבת לרשת הבלוקים
  const ang = (GRID_ANGLE * Math.PI) / 180, ca = Math.cos(ang), sa = Math.sin(ang);
  const rot = (u, v) => [500 + u * ca - v * sa, 400 + u * sa + v * ca];

  function tree(x, y, r, rand) {
    const crown = [];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, rr = r * (0.85 + rand() * 0.25); crown.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
    return `<path d="M${f(x)} ${f(y + r * 0.4)} L${f(x)} ${f(y + r * 1.45)}" stroke="${C.navy}" stroke-width="1.6" stroke-linecap="round"/>` +
      pencil(crown, rand, { closed: true, fill: C.navyTint, w: 1.2, amp: 1.2, seg: 8, color: C.navy2 });
  }

  function palm(x, y, s, rand) {
    const top = [x + 3 * s, y - 34 * s];
    let out = `<path d="M${f(x)} ${f(y)} Q${f(x + 6 * s)} ${f(y - 18 * s)} ${f(top[0])} ${f(top[1])}" fill="none" stroke="${C.navy}" stroke-width="${f(2 * s)}" stroke-linecap="round"/>`;
    [[-16, 4], [-12, -6], [-2, -10], [10, -7], [16, 3], [6, 8]].forEach(([dx, dy]) => {
      const e = [top[0] + dx * s, top[1] + dy * s + 6 * s], m = [top[0] + dx * 0.5 * s, top[1] + dy * s - 4 * s + rand() * 2];
      out += `<path d="M${f(top[0])} ${f(top[1])} Q${f(m[0])} ${f(m[1])} ${f(e[0])} ${f(e[1])}" fill="none" stroke="${C.navy2}" stroke-width="${f(1.6 * s)}" stroke-linecap="round"/>`;
    });
    return out;
  }

  /** מוטיב קו רקיע של באר שבע: מגדל מים, מגדלים ומבנים נמוכים על דיונה. קישוטי בלבד. */
  function skyline(rand) {
    const g = [];
    // דיונה
    g.push(`<path d="M620 810 C 700 768, 790 744, 870 728 C 930 716, 975 700, 1010 684 L1010 810 Z" fill="${C.sand2}"/>`);
    g.push(`<path d="M690 806 C 770 778, 860 760, 930 750 C 970 744, 995 738, 1010 734" fill="none" stroke="${C.navy2}" stroke-width="1.2" opacity="0.5"/>`);
    // מבנים נמוכים עם קשתות
    [[722, 714, 54, 26], [780, 720, 42, 20]].forEach(([x, y, w, h]) => {
      g.push(pencil([[x, y + h], [x, y], [x + w, y], [x + w, y + h]], rand, { fill: C.cream, w: 1.4, amp: 0.6 }));
      for (let xx = x + 6; xx < x + w - 7; xx += 11) g.push(`<path d="M${xx} ${y + h} V${y + h - 8} a3.6 3.6 0 0 1 7.2 0 V${y + h}" fill="${C.terraWash}" stroke="${C.navy2}" stroke-width="1"/>`);
    });
    // מגדלים
    [[842, 654, 26, 70], [874, 626, 22, 98], [902, 668, 30, 56]].forEach(([x, y, w, h]) => {
      g.push(pencil([[x, y + h], [x, y], [x + w, y], [x + w, y + h]], rand, { fill: C.navyWash, w: 1.4, amp: 0.7 }));
      for (let yy = y + 8; yy < y + h - 4; yy += 9) g.push(`<path d="M${x + 4} ${yy} H${x + w - 4}" stroke="${C.navy2}" stroke-width="1" stroke-dasharray="3 3" opacity="0.75"/>`);
    });
    g.push(`<path d="M885 626 V612" stroke="${C.navy}" stroke-width="1.6" stroke-linecap="round"/>`);
    // מגדל המים: מכל רחב על עמודים
    const tx = 950, base = 730;
    [-18, -6, 6, 18].forEach((dx) => g.push(`<path d="M${tx + dx} ${base} L${f(tx + dx * 0.72)} ${base - 78}" stroke="${C.navy}" stroke-width="2.4" stroke-linecap="round"/>`));
    g.push(`<path d="M${tx - 22} ${base - 30} H${tx + 22} M${tx - 19} ${base - 56} H${tx + 19}" stroke="${C.navy2}" stroke-width="1.2"/>`);
    g.push(pencil([[tx - 15, base - 78], [tx - 34, base - 112], [tx + 34, base - 112], [tx + 15, base - 78]], rand, { closed: true, fill: C.terraTint, w: 1.8, amp: 0.6 }));
    g.push(pencil([[tx - 37, base - 112], [tx - 37, base - 122], [tx + 37, base - 122], [tx + 37, base - 112]], rand, { closed: true, fill: C.cream, w: 1.6, amp: 0.5 }));
    g.push(`<path d="M${tx - 30} ${base - 95} H${tx + 30}" stroke="${C.navy2}" stroke-width="1" opacity="0.7"/>`);
    // דקלים
    g.push(palm(712, 744, 1.15, rand), palm(996, 722, 1, rand), palm(936, 742, 0.85, rand));
    return `<g class="nm-skyline">${g.join('')}</g>`;
  }

  /**
   * מחזיר מחרוזת SVG של המפה (viewBox 0 0 1000 800).
   * avoid: רשימת נקודות [x,y] (ביחידות האיור) שאין לשים בהן קישוטים, כדי שהסימונים יישארו נקיים.
   */
  function buildMapSvg(seed, avoid) {
    const rand = rng(seed == null ? 20261111 : seed);
    const keep = (avoid || []).map((p) => [p[0], p[1]]);
    const label = [515, 318];
    const laneSamples = LANES.flatMap((b) => bezierPoints(b, 30));
    const nearLane = (x, y, d) => laneSamples.some((s) => dist([x, y], s) < d);
    const clearOf = (x, y, d) => keep.every((k) => dist([x, y], k) >= d) && dist([x, y], label) >= d + 30;

    const out = [];
    out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="איור להמחשה של שכונה ט׳ — לא מפה גיאוגרפית" focusable="false">`);
    out.push('<defs>');
    out.push(`<clipPath id="nm-land-clip"><path d="${poly(BOUNDARY, true)}"/></clipPath>`);
    out.push('<filter id="nm-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="5" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.11  0 0 0 0 0.2  0 0 0 0 0.31  0 0 0 0.06 0"/></filter>');
    out.push(`<radialGradient id="nm-fade" cx="50%" cy="50%" r="62%"><stop offset="55%" stop-color="${C.paper}" stop-opacity="0"/><stop offset="100%" stop-color="${C.paper}" stop-opacity="1"/></radialGradient>`);
    out.push('</defs>');
    out.push(`<rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="${C.paper}"/>`);

    // ההקשר העירוני מסביב: רשת בלוקים דהויה
    const ctx = [];
    for (let u = -9; u <= 9; u++) {
      for (let v = -8; v <= 8; v++) {
        const c = rot((u + 0.5) * GRID_STEP, (v + 0.5) * GRID_STEP);
        if (c[0] < -60 || c[0] > W + 60 || c[1] < -60 || c[1] > H + 60) continue;
        if (inPoly(c[0], c[1], BOUNDARY)) continue;
        if (rand() < 0.25) continue;
        const m = 9, a = u * GRID_STEP + m, b = v * GRID_STEP + m, e = GRID_STEP - 2 * m;
        ctx.push(`<path d="${poly([rot(a, b), rot(a + e, b), rot(a + e, b + e), rot(a, b + e)], true)}" fill="${C.sand3}" stroke="${C.navyTint}" stroke-width="0.9"/>`);
      }
    }
    out.push(`<g opacity="0.75">${ctx.join('')}</g>`);
    out.push(`<g fill="none" stroke="${C.navyTint}" stroke-width="7" stroke-linecap="round" opacity="0.5">${LANES.map((b) => `<path d="M${b[0][0]} ${b[0][1]} C${b[1][0]} ${b[1][1]} ${b[2][0]} ${b[2][1]} ${b[3][0]} ${b[3][1]}"/>`).join('')}</g>`);
    out.push(`<rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="url(#nm-fade)"/>`);

    // השכונה: קרקע, בלוקים, מבנים ושטחים פתוחים
    out.push(`<path d="${poly(BOUNDARY, true)}" fill="${C.cream}"/>`);
    const blocks = [], builds = [], greens = [];
    let openLeft = 3;
    for (let u = -8; u <= 8; u++) {
      for (let v = -7; v <= 7; v++) {
        const m = 8, a = u * GRID_STEP + m, b = v * GRID_STEP + m, e = GRID_STEP - 2 * m;
        const cen = rot(a + e / 2, b + e / 2);
        if (!inPoly(cen[0], cen[1], BOUNDARY)) continue;
        const corners = [rot(a, b), rot(a + e, b), rot(a + e, b + e), rot(a, b + e)];
        const open = openLeft > 0 && inPoly(cen[0], cen[1], BOUNDARY) && [[-40, 0], [40, 0], [0, -40], [0, 40]].every(([dx, dy]) => inPoly(cen[0] + dx, cen[1] + dy, BOUNDARY)) && !nearLane(cen[0], cen[1], 40) && clearOf(cen[0], cen[1], 70) && rand() < 0.3;
        if (open) {
          openLeft--;
          blocks.push(pencil(corners, rand, { closed: true, fill: C.navyWash, color: C.navy2, w: 1, amp: 1.2, opacity: 0.8 }));
          greens.push([cen[0], cen[1], e]);
          continue;
        }
        blocks.push(pencil(corners, rand, { closed: true, fill: rand() < 0.5 ? C.sand : C.sand3, color: C.navy2, w: 0.9, amp: 1.1, opacity: 0.55 }));
        // מבנים קטנים בתוך הבלוק (נמנעים מסימונים)
        const n = 2 + Math.floor(rand() * 3);
        for (let k = 0; k < n; k++) {
          const bw = 12 + rand() * 14, bh = 10 + rand() * 12;
          const bu = a + 5 + rand() * (e - bw - 10), bv = b + 5 + rand() * (e - bh - 10);
          const bc = rot(bu + bw / 2, bv + bh / 2);
          if (!clearOf(bc[0], bc[1], 34)) continue;
          builds.push(pencil([rot(bu, bv), rot(bu + bw, bv), rot(bu + bw, bv + bh), rot(bu, bv + bh)], rand, { closed: true, fill: rand() < 0.22 ? C.terraWash : C.sand2, color: C.navy2, w: 0.9, amp: 0.6, seg: 40 }));
        }
      }
    }
    out.push(`<g clip-path="url(#nm-land-clip)">${blocks.join('')}${builds.join('')}`);
    // שדרות: פס בהיר עם שוליים בקו עיפרון
    LANES.forEach((b) => {
      const d = `M${b[0][0]} ${b[0][1]} C${b[1][0]} ${b[1][1]} ${b[2][0]} ${b[2][1]} ${b[3][0]} ${b[3][1]}`;
      out.push(`<path d="${d}" fill="none" stroke="${C.navy2}" stroke-width="17" stroke-linecap="round" opacity="0.35"/><path d="${d}" fill="none" stroke="${C.street}" stroke-width="14.5" stroke-linecap="round"/>`);
    });
    out.push('</g>');
    // עצים: מעט, רק בשטחים הפתוחים ובכמה פינות
    const trees = [];
    greens.forEach(([x, y, e]) => {
      for (let k = 0; k < 3; k++) {
        const tx = x + (rand() - 0.5) * e * 0.55, ty = y + (rand() - 0.5) * e * 0.4;
        if (clearOf(tx, ty, 40)) trees.push(tree(tx, ty, 7 + rand() * 3, rand));
      }
    });
    for (let tries = 0, extra = 0; tries < 2000 && extra < 6; tries++) {
      const x = 100 + rand() * 800, y = 100 + rand() * 600;
      if (!inPoly(x, y, BOUNDARY) || nearLane(x, y, 18) || !clearOf(x, y, 60)) continue;
      trees.push(tree(x, y, 7 + rand() * 2, rand)); extra++;
    }
    out.push(`<g>${trees.join('')}</g>`);
    // גבול השכונה: קו נייבי מצויר
    out.push(`<path d="${poly(BOUNDARY, true)}" fill="none" stroke="${C.paper}" stroke-width="11" stroke-linejoin="round" opacity="0.9"/>`);
    out.push(pencil(BOUNDARY, rand, { closed: true, w: 3.4, amp: 2.2, seg: 26, passes: 2 }));
    out.push(skyline(rand));
    out.push(`<rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" filter="url(#nm-grain)" pointer-events="none"/>`);
    // תווית השכונה: היחידה על המפה. ללא שמות רחובות, כי לא אומתו.
    out.push(`<text x="${label[0]}" y="${label[1] + 12}" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="34" fill="${C.navy}" stroke="${C.cream}" stroke-width="7" stroke-linejoin="round" paint-order="stroke">שכונה ט׳</text>`);
    out.push('</svg>');
    return out.join('');
  }

  /**
   * ויניטה קטנה ומאוירת (גבעה, מבנים, עץ ושמש) — משמשת ככותרת חזותית בכרטיסים ובאריחי "חוסן ותמיכה".
   * seed משנה מעט את הקומפוזיציה. אינה מתארת מקום אמיתי.
   */
  function buildLandscapeSvg(seed) {
    const rand = rng(seed == null ? 1111 : seed);
    const out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 130" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">'];
    out.push(`<rect width="420" height="130" fill="${C.cream}"/>`);
    out.push(`<circle cx="${f(300 + rand() * 80)}" cy="34" r="13" fill="${C.terraTint}"/>`);
    out.push(`<path d="M0 104 C 70 ${f(84 + rand() * 10)}, 150 ${f(86 + rand() * 8)}, 230 98 C 300 ${f(108 + rand() * 6)}, 360 96, 420 102 L420 130 L0 130 Z" fill="${C.sand}"/>`);
    let x = 20 + rand() * 30;
    for (let i = 0; i < 4; i++) {
      const w = 22 + rand() * 14, h = 22 + rand() * 26;
      out.push(pencil([[x, 112], [x, 112 - h], [x + w, 112 - h], [x + w, 112]], rand, { fill: i % 3 === 1 ? C.terraWash : C.cream, w: 1.3, amp: 0.6 }));
      for (let yy = 112 - h + 7; yy < 106; yy += 9) out.push(`<path d="M${f(x + 5)} ${f(yy)} H${f(x + w - 5)}" stroke="${C.navy2}" stroke-width="1" stroke-dasharray="3 3"/>`);
      x += w + 6 + rand() * 10;
    }
    out.push(tree(x + 30, 92, 9, rand), tree(x + 58, 96, 7, rand));
    out.push(palm(370, 112, 0.8, rand));
    out.push(`<path d="M0 116 C 90 110, 200 112, 300 116 C 360 118, 400 115, 420 116" fill="none" stroke="${C.navy2}" stroke-width="1.1" opacity="0.6"/>`);
    out.push('</svg>');
    return out.join('');
  }

  return { W, H, BOUNDARY, PARKS, buildMapSvg, buildLandscapeSvg, inPoly };
});
