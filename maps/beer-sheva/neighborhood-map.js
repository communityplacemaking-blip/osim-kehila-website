// neighborhood-map.js - הממשק של "מפת החוסן המקומי" (שכונה ט׳, באר שבע).
// JavaScript רגיל, בלי React ובלי CDN: עובד גם באולם בלי אינטרנט (חוץ מהגופן, שיש לו חלופה).
// הנתונים: /neighborhoods/<id>.json (קובץ סטטי). אין כאן שום קריאה ל-API ואין כתיבה לשום מקום:
// טופס השיתוף הוא הדגמה בלבד, ושום דבר לא נשלח ולא נשמר.
(function () {
  'use strict';
  const Core = window.NeighborhoodMapCore;
  const Art = window.NeighborhoodMapArt;
  const params = new URLSearchParams(location.search);
  const nid = /^[a-z0-9-]+$/.test(params.get('n') || '') ? params.get('n') : 'beer-sheva-t';
  const REVIEW_OPEN = params.get('review') === '1';
  const isMobile = () => window.matchMedia('(max-width: 899px)').matches;

  // ---------- עזרים ----------
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.setAttribute('style', v);
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    });
    kids.flat().forEach((c) => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c))); });
    return el;
  }
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const ICON = {
    wall: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 9.7v4.6M9 14.3V19"/>',
    tools: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    family: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    pulse: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
    elders: '<circle cx="9" cy="7" r="3.2"/><circle cx="17" cy="9" r="2.6"/><path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3a4.5 4.5 0 0 1 4.5 4.5V20M15.5 14.2A4 4 0 0 1 21 18v2"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
    baby: '<circle cx="12" cy="12" r="8.5"/><path d="M9 10.5h.01M15 10.5h.01" stroke-width="2.6"/><path d="M9.5 15c1.4 1.3 3.6 1.3 5 0"/><path d="M12 3.5c.9 1 .9 2.2 0 3"/>',
    youth: '<circle cx="12" cy="6.5" r="2.8"/><circle cx="5.5" cy="9" r="2.2"/><circle cx="18.5" cy="9" r="2.2"/><path d="M7.5 20v-2.5A4.5 4.5 0 0 1 12 13a4.5 4.5 0 0 1 4.5 4.5V20M2 18.5v-1A3 3 0 0 1 5 14.5M22 18.5v-1a3 3 0 0 0-3-3"/>',
    house: '<path d="M3 11l9-7.5L21 11"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5.5h4V20"/>',
    medal: '<circle cx="12" cy="15" r="5.5"/><path d="M8.5 10.5L6 3h4l2 4.5L14 3h4l-2.5 7.5"/>',
    hanger: '<path d="M12 7.5a2.5 2.5 0 1 0-2.5-2.5"/><path d="M12 7.5v2L3.5 16a1.8 1.8 0 0 0 1.1 3.2h14.8A1.8 1.8 0 0 0 20.5 16L12 9.5"/>',
    spark: '<path d="M12 3l2 5.2 5.2 2-5.2 2-2 5.3-2-5.3-5.2-2 5.2-2z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    coins: '<ellipse cx="12" cy="6.5" rx="7" ry="2.8"/><path d="M5 6.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5M5 11.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
    tree: '<path d="M12 21v-6"/><path d="M12 3c3.3 0 6 2.6 6 5.8 0 3.3-2.7 6-6 6s-6-2.7-6-6C6 5.6 8.7 3 12 3z"/><path d="M12 15l-2.5-2.5M12 13l2.6-2.6"/>',
    bottle: '<path d="M10 2.5h4M10.5 2.5v2.8L8.5 8v11.5A2 2 0 0 0 10.5 21.5h3a2 2 0 0 0 2-2V8l-2-2.7V2.5"/><path d="M8.5 12h7M8.5 16h7"/>',
    school: '<path d="M2.5 9.5L12 4l9.5 5.5L12 15z"/><path d="M6 11.5V17c3.5 2.6 8.5 2.6 12 0v-5.5M21.5 9.5v5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" stroke-width="2.6"/>',
    toolbox: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M3 13h18"/><path d="M11 13v2h2v-2"/>',
    chev: '<path d="M15 5l-7 7 7 7"/>',
    back: '<path d="M9 5l7 7-7 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    recenter: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/>',
  };
  function icon(name) {
    const t = document.createElement('template');
    t.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON[name] || ICON.spark}</svg>`;
    return t.content.firstChild;
  }
  const hashId = (id) => [...String(id)].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, 7);
  const fmtIso = (iso) => (iso ? iso.split('-').reverse().join('.') : '');

  // ---------- מצב ----------
  const state = { cover: 0, savedPan: null, data: null, entries: [], active: new Set(Core.LAYER_ORDER), selectedId: null, view: 'home', viewArg: null, nowTab: null, zoom: 1, panX: 0, panY: 0, query: '', trigger: null, cardTrigger: null, joinOpen: false, today: params.get('today') || Core.todayInJerusalem(), share: { type: 'idea', title: '', desc: '', area: '', preview: false, errors: {} } };
  const dom = {};
  const entry = (id) => state.entries.find((x) => x.id === id);

  function showLoadError(e) {
    const app = document.getElementById('nm-app');
    app.textContent = '';
    app.append(h('div', { class: 'nm-load nm-load--err', role: 'alert' },
      h('h1', { class: 'nm-h2' }, 'לא ניתן לטעון את נתוני השכונה'),
      h('p', {}, 'המפה צריכה לקרוא את קובץ הנתונים של השכונה. אם פתחתם את הקובץ ישירות מהדיסק, יש להפעיל שרת מקומי (ראו את מסמך ההפעלה), או לפתוח את גרסת הקובץ הבודד.'),
      h('p', { class: 'nm-load__tech' }, `פרטים טכניים: ${e && e.message ? e.message : e}`),
      h('button', { class: 'nm-btn', type: 'button', onclick: () => location.reload() }, 'ניסיון חוזר')));
  }

  // window.__NM_DATA__ מוזרק רק בגרסת הקובץ הבודד (פתיחה בלי שרת); אחרת הנתונים נקראים מקובץ ה-JSON הסטטי.
  (window.__NM_DATA__ ? Promise.resolve(window.__NM_DATA__)
    : fetch(`neighborhoods/${nid}.json`).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }))
    .then(start)
    .catch(showLoadError);

  function start(data) {
    state.data = data;
    state.entries = Core.allEntries(data);
    const problems = Core.validateData(data);
    if (problems.length) console.warn('[neighborhood-map] data problems:', problems);
    document.title = `${data.neighborhood.title} | ${data.neighborhood.name}, ${data.neighborhood.city} | עושים קהילה`;
    build();
    renderLayers(); renderMarkers(); renderNow(); renderResilience(); layout();
    window.addEventListener('resize', layout);
    document.addEventListener('keydown', onKey);
    window.__nm = { state, select, setLayer, openView, closeView }; // לבדיקות דפדפן בלבד
  }

  // ---------- בניית המסך ----------
  // בגרסת הקובץ הבודד התמונות מוטמעות בדף (window.__NM_ASSETS__), בנפרד מהנתונים, כדי שבדיקות הטקסט על הנתונים לא יסרקו אותן
  const asset = (src) => (window.__NM_ASSETS__ && window.__NM_ASSETS__[src]) || src;

  function build() {
    const d = state.data;
    const app = document.getElementById('nm-app');
    app.textContent = '';

    const nav = (key, label, fn) => h('button', { class: 'nm-nav__a', type: 'button', 'data-nav': key, onclick: fn }, label);
    const top = h('header', { class: 'nm-top' },
      h('div', { class: 'nm-brand' }, h('span', { class: 'nm-wordmark' }, 'עושים קהילה'), h('span', { class: 'nm-brand__place' }, `${d.neighborhood.name} | ${d.neighborhood.city}`)),
      h('nav', { class: 'nm-nav', 'aria-label': 'ניווט בעמוד' },
        nav('now', 'מה קורה עכשיו?', () => goSection('now')),
        nav('resilience', 'חוסן ותמיכה', () => goSection('resilience')),
        nav('share', 'אני רוצה לשתף', (e) => openView('share', e.currentTarget)),
        h('button', { class: 'nm-nav__icon', type: 'button', 'data-nav': 'list', 'aria-label': 'חיפוש בכל הפריטים', title: 'חיפוש בכל הפריטים', onclick: (e) => openView('list', e.currentTarget) }, icon('search')),
        h('span', { class: 'nm-badge' }, 'אב־טיפוס להדגמה')));

    const act = (key, title, ico, primary) => h('button', { class: 'nm-act' + (primary ? ' nm-act--primary' : ''), type: 'button', 'data-action': key, 'aria-expanded': 'false', onclick: (e) => openView(key, e.currentTarget) },
      h('span', { class: 'nm-act__ico' }, icon(ico)), h('span', { class: 'nm-act__t' }, title));
    dom.actions = h('div', { class: 'nm-actions', role: 'group', 'aria-label': 'פעולות עיקריות' },
      h('p', { class: 'nm-actions__lead' }, 'יש לי רעיון, צורך, משאב או יוזמה חדשה'),
      act('share', 'אני רוצה לשתף', 'plus', true),
      act('toolbox', 'ארגז הכלים', 'toolbox', false));

    const swoosh = h('span', { class: 'nm-swoosh' });
    swoosh.innerHTML = '<svg viewBox="0 0 150 8" width="110" height="7" aria-hidden="true"><path d="M2 5.5 C 40 1.5, 110 1, 148 3.2" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>';

    dom.now = h('section', { class: 'nm-panel nm-now', id: 'nm-now', 'aria-labelledby': 'nm-now-h' });
    dom.res = h('section', { class: 'nm-panel nm-res', id: 'nm-res', 'aria-labelledby': 'nm-res-h' });
    dom.side = h('aside', { class: 'nm-side', 'aria-label': 'מידע ופעולות' },
      h('h1', { class: 'nm-title' }, d.neighborhood.title),
      h('p', { class: 'nm-sub' }, `${d.neighborhood.name} | ${d.neighborhood.city}`),
      swoosh,
      h('p', { class: 'nm-tagline' }, d.neighborhood.tagline),
      h('p', { class: 'nm-intro' }, 'לחצו על סימון במפה כדי להכיר יוזמה או משאב בשכונה.'),
      dom.now,
      dom.res,
      dom.actions,
      h('button', { class: 'nm-linkbtn', type: 'button', 'data-action': 'list', onclick: (e) => openView('list', e.currentTarget) }, `כל הפריטים, כולל מה שממתין לסיווג (${state.entries.length})`),
      h('p', { class: 'nm-proto' }, 'אב־טיפוס להדגמה. התוכן מבוסס על חומרים שהעבירה רכזת הקהילה ועל הודעות בעל הפרויקט; מה שלא אומת מסומן כממתין לאימות. אין כאן כתובות או מיקומים מאומתים.'));

    // מפה
    dom.art = h('div', { class: 'nm-art' });
    // נקודות הסימונים נשמרות נקיות מקישוטי האיור (המבנים והעצים נדחקים הצידה)
    const mi = state.data.mapImage;
    if (mi) {
      // איור מוכן של השכונה (ללא סימונים מצוירים); הסימונים האמיתיים יושבים מעליו
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${mi.width} ${mi.height}`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', mi.alt || 'איור להמחשה, לא מפה גיאוגרפית');
      svg.setAttribute('focusable', 'false');
      const img = document.createElementNS(NS, 'image');
      img.setAttribute('href', asset(mi.src));
      img.setAttribute('width', mi.width);
      img.setAttribute('height', mi.height);
      svg.append(img);
      dom.art.append(svg);
    } else {
      const avoid = state.entries.filter((it) => it.mapPosition).map((it) => [(it.mapPosition.x / 100) * Art.W, (it.mapPosition.y / 100) * Art.H]);
      dom.art.innerHTML = Art.buildMapSvg(undefined, avoid);
    }
    dom.markers = h('div', { class: 'nm-markers' });
    dom.world = h('div', { class: 'nm-world' }, dom.art, dom.markers);
    dom.stage = h('div', { class: 'nm-stage' }, dom.world, h('div', { class: 'nm-illchip', 'data-illustrative-note': '' }, 'איור להמחשה · לא מפה גיאוגרפית'));
    attachPanZoom(dom.stage);

    dom.layers = h('section', { class: 'nm-layers', 'aria-label': 'שכבות המפה' });
    dom.live = h('div', { class: 'nm-vh', role: 'status', 'aria-live': 'polite' });
    dom.zoom = h('div', { class: 'nm-zoom' },
      h('div', { class: 'nm-zoom__grp' },
        h('button', { class: 'nm-zbtn', type: 'button', 'aria-label': 'הגדלת המפה', onclick: () => zoomBy(1.3) }, '+'),
        h('button', { class: 'nm-zbtn', type: 'button', 'aria-label': 'הקטנת המפה', onclick: () => zoomBy(1 / 1.3) }, '−')),
      h('button', { class: 'nm-zbtn nm-zbtn--solo', type: 'button', 'aria-label': 'מרכוז המפה מחדש', onclick: recenter }, icon('recenter')));
    dom.map = h('main', { class: 'nm-map', 'aria-label': 'מפת השכונה' }, dom.stage, dom.layers, dom.zoom, dom.live);
    // כרטיס היוזמה: נפתח רק בלחיצה על סימון (או על שורה ברשימה). בדסקטופ פאנל צד שלא מסתיר את המפה; במובייל גיליון תחתון.
    dom.card = h('section', { class: 'nm-card', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'nm-card-title', hidden: true });
    dom.sheet = h('section', { class: 'nm-sheet', hidden: true });

    app.append(top, dom.side, dom.map, dom.sheet, dom.card);
    const style = document.createElement('style');
    style.textContent = '.nm-app [hidden]{display:none !important}';
    document.head.append(style);
  }

  function goSection(key) {
    if (state.selectedId) deselect(true);
    if (state.view !== 'home') closeView(true);
    const el = key === 'now' ? dom.now : dom.res;
    el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    const hd = el.querySelector('h2');
    if (hd) hd.focus({ preventScroll: true });
  }

  // ---------- שכבות ----------
  function setLayer(id, on) {
    if (on) state.active.add(id); else state.active.delete(id);
    state.selectedId = Core.reconcileSelection(state.selectedId, state.entries, state.active);
    renderLayers(); renderMarkers(); renderCard();
    const n = Core.markerItems(state.entries, state.active).length;
    dom.live.textContent = `מוצגים ${n} סימונים על המפה`;
    if (state.view === 'list') renderSheet();
  }

  function renderLayers() {
    const d = state.data;
    const counts = Core.countByLayer(state.entries);
    const list = h('div', { class: 'nm-layers__list', role: 'group', 'aria-label': 'בחירת שכבות' });
    d.layers.forEach((l) => {
      const on = state.active.has(l.id);
      list.append(h('button', { class: `nm-lay nm-lay--${l.id}`, type: 'button', role: 'switch', 'aria-checked': String(on), 'data-layer': l.id, title: l.hint, onclick: () => setLayer(l.id, !state.active.has(l.id)) },
        h('span', { class: 'nm-lay__dot' }), h('span', { class: 'nm-lay__lbl' }, l.label), h('span', { class: 'nm-lay__n', 'aria-label': `${counts[l.id]} פריטים` }, String(counts[l.id])), h('span', { class: 'nm-lay__sw', 'aria-hidden': 'true' })));
    });
    const planned = state.entries.filter((it) => it.layers.includes('planned'));
    const ideas = planned.filter(Core.isIdea).length;
    const unplaced = Core.visibleItems(state.entries, state.active).filter((it) => !it.mapPosition).length;
    const empties = d.layers.filter((l) => state.active.has(l.id) && counts[l.id] === 0);
    const focusedLayer = document.activeElement && dom.layers.contains(document.activeElement) ? document.activeElement.dataset.layer : null;
    dom.layers.textContent = '';
    dom.layers.append(...[
      h('h2', { class: 'nm-layers__h' }, 'שכבות מפה'),
      list,
      state.active.has('planned') && ideas ? h('p', { class: 'nm-layers__key' }, h('span', { class: 'nm-key nm-key--solid' }), `בפיתוח (${planned.length - ideas})`, h('span', { class: 'nm-key nm-key--idea' }), `רעיון שמחפש מענה (${ideas})`) : null,
      ...empties.map((l) => h('p', { class: 'nm-layers__empty' }, `${l.label}: ${l.emptyNote}.`)),
      ...(unplaced ? [h('p', { class: 'nm-layers__empty', 'data-unplaced': String(unplaced) }, `${unplaced === 1 ? 'פריט אחד' : unplaced + ' פריטים'} בלי סימון: המיקום טרם אומת (ראו ״כל הפריטים״).`)] : []),
      h('p', { class: 'nm-layers__note nm-note--long' }, d.neighborhood.positionNote),
      h('p', { class: 'nm-layers__note nm-note--short' }, d.neighborhood.positionNoteShort)].filter(Boolean));
    if (focusedLayer) { const b = dom.layers.querySelector(`[data-layer="${focusedLayer}"]`); if (b) b.focus(); }
  }

  // ---------- סימונים ----------
  function renderMarkers() {
    const focusedId = document.activeElement && dom.markers.contains(document.activeElement) ? document.activeElement.dataset.id : null;
    dom.markers.textContent = '';
    const byId = Object.fromEntries(state.data.layers.map((l) => [l.id, l]));
    Core.markerItems(state.entries, state.active).forEach((it) => {
      const layer = Core.markerLayer(it, state.active);
      const idea = Core.isIdea(it);
      const b = h('button', {
        class: `mk mk--${layer}${idea ? ' mk--idea' : ''}`, type: 'button', 'data-id': it.id, 'data-layer': layer, 'data-position-basis': it.mapPosition.basis,
        'aria-pressed': String(state.selectedId === it.id), 'aria-label': `${it.title} — ${byId[layer].label}${idea ? ', רעיון שמחפש מענה' : ''}. מיקום הסימון להמחשה בלבד`, title: it.title,
        style: `left:${it.mapPosition.x}%;top:${it.mapPosition.y}%`, onclick: (e) => select(it.id, e.currentTarget),
      }, icon(it.icon), h('span', { class: 'mk__lbl', 'aria-hidden': 'true' }, it.title));
      dom.markers.append(b);
      if (focusedId === it.id) b.focus();
    });
  }

  function select(id, trigger) {
    const it = entry(id);
    if (!it) return;
    if (it.layers.length && !it.layers.some((l) => state.active.has(l))) { state.active.add(it.layers[0]); renderLayers(); }
    if (state.selectedId !== id) state.joinOpen = false;
    if (!state.selectedId) state.savedPan = { x: state.panX, y: state.panY }; // לשחזור מיקום המפה בסגירה
    state.selectedId = id;
    state.cardTrigger = trigger || state.cardTrigger;
    if (isMobile() && state.view !== 'home') closeView(true);
    renderMarkers(); renderCard();
    if (state.view === 'list') renderSheet();
    ensureVisible(it);
    const t = dom.card.querySelector('#nm-card-title');
    if (t) t.focus({ preventScroll: true });
  }

  function deselect(silent) {
    const back = state.cardTrigger;
    state.selectedId = null;
    state.joinOpen = false;
    if (state.savedPan) { state.panX = state.savedPan.x; state.panY = state.savedPan.y; state.savedPan = null; }
    renderMarkers(); renderCard();
    if (state.view === 'list') renderSheet();
    if (!silent && back) {
      // חזרה לסימון (או לשורה) שפתח את הכרטיס; אם הוא צויר מחדש, מוצאים אותו לפי ה-id
      const id = back.dataset && back.dataset.id;
      const again = document.contains(back) ? back : id ? document.querySelector(`.mk[data-id="${id}"], .nm-row[data-id="${id}"]`) : null;
      if (again) again.focus({ preventScroll: true });
    }
    state.cardTrigger = null;
  }

  // ---------- כרטיס יוזמה (תבנית אחת לכל סוגי הפריטים) ----------
  function renderCard() {
    const it = entry(state.selectedId);
    dom.card.hidden = !it;
    dom.card.textContent = '';
    if (!it) { state.cover = 0; if (dom.world) layout(); return; }
    const d = state.data;
    const layer = Core.markerLayer(it, state.active) || it.layers[0] || null;
    const idea = Core.isIdea(it);
    dom.card.className = `nm-card nm-card--${layer || 'none'}${idea ? ' nm-card--idea' : ''}`;
    const layerLabel = (id) => d.layers.find((l) => l.id === id).label;

    // תמונה מייצגת: האיור של היוזמה מחומר המקור כשיש; אחרת איור כללי עם סמל היוזמה (לא צילום ולא מקום אמיתי)
    const vis = h('figure', { class: 'nm-card__vis' + (it.image ? ' nm-card__vis--img' : '') });
    if (it.image) vis.append(h('img', { class: 'nm-card__img', src: asset(it.image.src), alt: it.image.alt || '', decoding: 'async' }), h('figcaption', { class: 'nm-card__cap' }, 'מתוך חומר הרכזת'));
    else {
      vis.innerHTML = Art.buildLandscapeSvg(hashId(it.id));
      vis.append(h('span', { class: 'nm-card__medal', 'aria-hidden': 'true' }, icon(it.icon)), h('figcaption', { class: 'nm-card__cap' }, 'איור להמחשה'));
    }

    const chips = h('div', { class: 'nm-chips' },
      h('span', { class: 'nm-chip nm-chip--status' }, h('b', {}, 'סטטוס: '), it.status.label),
      ...(it.layers.length ? it.layers.map((l) => h('span', { class: `nm-chip nm-chip--${l}` }, h('i'), layerLabel(l))) : [h('span', { class: 'nm-chip nm-chip--warn' }, 'ממתין לסיווג לשכבה')]),
      idea ? h('span', { class: 'nm-chip' }, 'רעיון של תושבים') : null,
      it.titleVerified === false ? h('span', { class: 'nm-chip nm-chip--warn' }, 'השם ממתין לאימות') : null);

    // פרטי הפרויקט: רק מה שנמסר, בלי כותרות ריקות
    const details = [];
    const lead = (it.people || []).map((p) => `${p.name} (${p.label})`).join(', ');
    if (lead) details.push(['מי מוביל', lead]);
    if (it.group) details.push(['למי', it.group]);
    if (it.when) details.push(['מתי', it.when]);
    const loc = Core.verifiedLocationLabel(it);
    if (loc) details.push(['איפה', loc]);
    if (it.needs && it.needs.length) details.push(['מה צריך', list(it.needs)]);
    if (it.partners && it.partners.length) details.push(['שותפים אפשריים', list(it.partners)]);
    if (it.nextAction) details.push(['הצעד הבא', it.nextAction]);
    (it.facts || []).forEach((f) => details.push([f.label, f.value]));
    if (it.conditions && it.conditions.length) details.push(['תנאים', list(it.conditions)]);

    const p = it.provenance;
    const src = d.sources[p.sourceId];
    const notes = (p.reviewNotes || []).slice();
    if (it.sourceReading) notes.unshift(`כך מופיע בחומר המקור: ״${it.sourceReading}״.`);

    const joinNote = h('div', { class: 'nm-join__note', id: 'nm-join-note', role: 'status', hidden: !state.joinOpen },
      h('p', {}, h('b', {}, 'ההצטרפות עוד לא מחוברת. '), 'בקשה לא נשלחה ולא נשמרה.'),
      h('p', {}, 'כשהשמירה לשכונה ט׳ תאושר ותחובר, אפשר יהיה להצטרף מכאן. בינתיים אפשר לספר על היוזמה לרכזת הקהילה.'));
    const joinBtn = h('button', { class: 'nm-join', type: 'button', 'aria-expanded': String(state.joinOpen), 'aria-controls': 'nm-join-note', onclick: () => { state.joinOpen = !state.joinOpen; joinBtn.setAttribute('aria-expanded', String(state.joinOpen)); joinNote.hidden = !state.joinOpen; } },
      'אני רוצה להצטרף');

    dom.card.append(...[
      h('div', { class: 'nm-card__bar' },
        h('span', { class: 'nm-card__kind' }, it.kind === 'toolbox' ? 'ארגז הכלים' : 'יוזמה'),
        h('button', { class: 'nm-x', type: 'button', 'aria-label': 'סגירת הכרטיס', onclick: () => deselect() }, icon('x'))),
      vis,
      h('h2', { class: 'nm-card__t', id: 'nm-card-title', tabindex: '-1' }, it.title),
      chips,
      it.summary ? h('p', { class: 'nm-card__sum' }, it.summary) : null,
      details.length ? h('dl', { class: 'nm-dl' }, ...details.map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, v)))) : null,
      !it.summary && !details.length ? h('p', { class: 'nm-card__sum nm-missing' }, 'פרטים נוספים על הפרויקט יתווספו בהמשך.') : null,
      h('p', { class: 'nm-card__foot' }, !it.layers.length ? 'פריט זה טרם סווג לשכבה, ולכן אינו מוצג על המפה.' : it.mapPosition ? 'מיקום הסימון על המפה להמחשה בלבד, ואינו מיקום הפעילות.' : 'פריט זה שייך לשכבה אך אינו מסומן על המפה, כי מיקומו טרם אומת.'),
      h('details', { class: 'nm-det', open: REVIEW_OPEN || null },
        h('summary', {}, 'מקור ובדיקה'),
        h('p', {}, `מקור: ${src.label}${p.section ? ` (${p.section})` : ''}`),
        h('p', {}, `רמת אימות: ${d.verificationLevels[p.verification]}`),
        notes.length ? h('ul', {}, ...notes.map((n) => h('li', {}, n))) : null),
      h('div', { class: 'nm-card__join' }, joinBtn, joinNote)].filter(Boolean));
    // במובייל הכרטיס כגיליון תחתון: מודדים כמה מהמפה הוא מסתיר כדי שהסימון הנבחר יישאר גלוי מעליו
    state.cover = 0;
    if (isMobile()) { const st = dom.stage.getBoundingClientRect(); const ct = dom.card.getBoundingClientRect(); state.cover = Math.max(0, Math.round(st.bottom - ct.top)); }
    layout();
  }
  function list(arr) { return h('ul', {}, ...arr.map((x) => h('li', {}, x))); }

  // ---------- "מה קורה עכשיו?" — אזור נפרד מהשכבות ----------
  const NOW_TABS = [['today', 'היום'], ['soon', 'בקרוב'], ['join', 'אפשר להצטרף'], ['new', 'יוזמות חדשות']];
  function nowData() {
    const t = Core.eventTabs(state.data.events, state.today);
    return { today: t.today, soon: t.soon, join: [], new: Core.recentItems(state.data) };
  }
  function renderNow() {
    const data = nowData();
    if (!state.nowTab) state.nowTab = (NOW_TABS.find(([k]) => data[k].length) || NOW_TABS[0])[0];
    const tab = state.nowTab;
    const focusedTab = document.activeElement && dom.now.contains(document.activeElement) && document.activeElement.getAttribute('role') === 'tab';
    const tabs = h('div', { class: 'nm-tabs', role: 'tablist', 'aria-label': 'מה קורה עכשיו' },
      ...NOW_TABS.map(([k, label], i) => h('button', {
        class: 'nm-tab', type: 'button', role: 'tab', id: `nm-tab-${k}`, 'aria-selected': String(k === tab), 'aria-controls': 'nm-now-panel', tabindex: k === tab ? '0' : '-1', 'data-tab': k,
        onclick: () => { state.nowTab = k; renderNow(); dom.now.querySelector(`#nm-tab-${k}`).focus(); },
        onkeydown: (e) => {
          const dir = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0; // RTL: שמאלה = הבא
          if (!dir) return;
          e.preventDefault();
          state.nowTab = NOW_TABS[(i + dir + NOW_TABS.length) % NOW_TABS.length][0]; renderNow();
          dom.now.querySelector(`#nm-tab-${state.nowTab}`).focus();
        },
      }, label)));
    const dot = (cls) => h('span', { class: `nm-nowrow__dot ${cls}`, 'aria-hidden': 'true' });
    const evLine = (ev) => h('li', { class: 'nm-nowrow', 'data-event': ev.id },
      h('span', { class: 'nm-nowrow__d' }, ev.dateText, ev.time ? h('small', {}, ev.time) : null),
      h('span', { class: 'nm-nowrow__t' }, h('b', {}, ev.title), h('small', {}, [ev.time ? null : 'שעה: טרם נמסרה', ev.locationLabel ? `מקום: ${ev.locationLabel}` : 'מקום: טרם נמסר'].filter(Boolean).join(' · '))),
      dot('nm-nowrow__dot--event'));
    let body;
    if (tab === 'today') body = data.today.length ? h('ul', { class: 'nm-nowlist' }, ...data.today.map(evLine)) : h('p', { class: 'nm-empty' }, 'אין היום פעילות עם תאריך בחומר המקור.');
    else if (tab === 'soon') body = data.soon.length ? h('ul', { class: 'nm-nowlist' }, ...data.soon.map(evLine)) : h('p', { class: 'nm-empty' }, 'אין כרגע פעילות עתידית עם תאריך מאומת.');
    else if (tab === 'join') body = h('p', { class: 'nm-empty' }, 'עדיין לא נמסרו הזדמנויות הצטרפות מאומתות. רעיונות של תושבים שמחפשים מענה מסומנים במפה בשכבת ״מה בתכנון״.');
    else body = data.new.length ? h('ul', { class: 'nm-nowlist' }, ...data.new.map(({ item, date }) => h('li', {}, h('button', { class: 'nm-nowrow nm-nowrow--btn', type: 'button', 'data-id': item.id, onclick: (e) => select(item.id, e.currentTarget) },
      h('span', { class: 'nm-nowrow__d' }, fmtIso(date), h('small', {}, 'נוסף')),
      h('span', { class: 'nm-nowrow__t' }, h('b', {}, item.title), h('small', {}, item.status.label)),
      dot(`nm-nowrow__dot--${(item.layers || [])[0] || 'none'}`))))) : h('p', { class: 'nm-empty' }, 'אין יוזמות חדשות.');
    dom.now.textContent = '';
    dom.now.append(
      h('div', { class: 'nm-panel__head' }, h('h2', { class: 'nm-panel__h', id: 'nm-now-h', tabindex: '-1' }, 'מה קורה עכשיו?'),
        h('button', { class: 'nm-more', type: 'button', onclick: (e) => openView('now', e.currentTarget) }, 'לכל האירועים')),
      tabs,
      h('div', { class: 'nm-tabpanel', id: 'nm-now-panel', role: 'tabpanel', 'aria-labelledby': `nm-tab-${tab}`, 'data-tabpanel': tab }, body),
      h('button', { class: 'nm-more nm-more--foot', type: 'button', onclick: (e) => openView('now', e.currentTarget) }, 'לכל האירועים'));
    if (focusedTab) { const b = dom.now.querySelector(`#nm-tab-${tab}`); if (b) b.focus(); }
  }

  // ---------- "חוסן ותמיכה" — אזור נפרד, רק מידע שסופק ואומת ----------
  function resilienceGroups() {
    const r = state.data.resilience || { groups: [], entries: [] };
    return r.groups.map((g) => ({ g, entries: (r.entries || []).filter((e) => e.group === g.id) }));
  }
  function renderResilience() {
    dom.res.textContent = '';
    dom.res.append(
      h('div', { class: 'nm-panel__head' }, h('h2', { class: 'nm-panel__h', id: 'nm-res-h', tabindex: '-1' }, 'חוסן ותמיכה'),
        h('button', { class: 'nm-more', type: 'button', onclick: (e) => openView('resilience', e.currentTarget) }, 'לכל המענים')),
      h('div', { class: 'nm-res__tiles' }, ...resilienceGroups().map(({ g, entries }, i) => {
        const art = h('span', { class: 'nm-res__art', 'aria-hidden': 'true' });
        if (g.image) art.append(h('img', { src: asset(g.image), alt: '', decoding: 'async' }));
        else art.innerHTML = Art.buildLandscapeSvg(31 + i * 17);
        return h('button', { class: `nm-res__tile nm-res__tile--${g.id}`, type: 'button', 'data-res': g.id, onclick: (e) => openView('resilience', e.currentTarget, g.id) },
          art, h('span', { class: 'nm-res__t' }, g.label), g.hint ? h('span', { class: 'nm-res__s' }, g.hint) : null,
          h('span', { class: 'nm-res__st' }, entries.length ? `${entries.length} מענים מאומתים` : 'טרם סופק מידע מאומת'));
      })));
  }

  // ---------- פאנלים ----------
  function openView(view, trigger, arg) {
    state.trigger = trigger || state.trigger;
    state.view = view;
    state.viewArg = arg || null;
    if (state.selectedId) deselect(true);
    renderSheet();
    syncActions();
    const hd = dom.sheet.querySelector(arg ? `[data-res-group="${arg}"] .nm-h3` : '.nm-h2') || dom.sheet.querySelector('.nm-h2');
    if (hd) { hd.setAttribute('tabindex', '-1'); hd.focus(); }
  }
  function closeView(silent) {
    state.view = 'home';
    dom.sheet.hidden = true; dom.sheet.textContent = '';
    syncActions();
    if (!silent && state.trigger && document.contains(state.trigger)) state.trigger.focus();
  }
  function syncActions() {
    dom.actions.querySelectorAll('[data-action]').forEach((b) => b.setAttribute('aria-expanded', String(b.dataset.action === state.view)));
  }

  function sheetShell(title, lead, ...body) {
    return [
      h('div', { class: 'nm-sheet__bar' }, h('button', { class: 'nm-back', type: 'button', onclick: () => closeView() }, icon('back'), 'חזרה')),
      h('h2', { class: 'nm-h2', tabindex: '-1' }, title),
      lead ? h('p', { class: 'nm-lead' }, lead) : null,
      ...body,
    ];
  }

  function renderSheet() {
    const v = state.view;
    dom.sheet.hidden = v === 'home';
    dom.sheet.textContent = '';
    if (v === 'home') return;
    dom.sheet.setAttribute('aria-label', { share: 'אני רוצה לשתף', now: 'מה קורה עכשיו', toolbox: 'ארגז הכלים', list: 'כל הפריטים', resilience: 'חוסן ותמיכה' }[v]);
    const body = { share: shareBody, now: nowBody, toolbox: toolboxBody, list: listBody, resilience: resilienceBody }[v]();
    dom.sheet.append(...body);
  }

  // --- אני רוצה לשתף (הדגמה בלבד) ---
  const CONTACT_RE = /(\+?\d[\d\s-]{7,}\d)|(\S+@\S+\.\S+)/;
  function validateShare(s) {
    const e = {};
    const title = s.title.trim(), desc = s.desc.trim(), area = s.area.trim();
    if (title.length < 3) e.title = 'נא לכתוב כותרת של לפחות 3 תווים.';
    if (desc.length < 10) e.desc = 'נא לתאר את ההצעה במשפט או שניים (לפחות 10 תווים).';
    if (CONTACT_RE.test(title)) e.title = 'נא לא לכתוב כאן מספר טלפון או כתובת מייל.';
    if (CONTACT_RE.test(desc)) e.desc = 'נא לא לכתוב כאן מספר טלפון או כתובת מייל. פרטי קשר אינם נאספים במסך זה.';
    if (CONTACT_RE.test(area)) e.area = 'נא לכתוב אזור כללי בלבד, בלי כתובת מדויקת או פרטי קשר.';
    return e;
  }

  function shareBody() {
    const s = state.share;
    const types = [['idea', 'רעיון'], ['need', 'צורך'], ['existing', 'יוזמה שכבר קיימת'], ['help', 'הצעה לעזור']];
    const banner = h('div', { class: 'nm-banner', role: 'note' }, 'זהו מסך הדגמה: ההצעות עדיין לא נשלחות ולא נשמרות. חיבור שמירה לשכונה ט׳ ממתין לאישור.');
    if (s.preview) {
      const t = types.find((x) => x[0] === s.type)[1];
      return sheetShell('אני רוצה לשתף', null, banner,
        h('div', { class: 'nm-preview' }, h('h3', {}, 'כך זה היה נראה (תצוגה מקדימה)'), h('p', {}, h('b', {}, 'סוג: '), t), h('p', {}, h('b', {}, 'כותרת: '), s.title || '—'), h('p', {}, h('b', {}, 'תיאור: '), s.desc || '—'), s.area ? h('p', {}, h('b', {}, 'אזור כללי: '), s.area) : null,
          h('p', {}, h('b', {}, 'הערה: '), 'ההצעה לא נשלחה ולא נשמרה.')),
        h('div', { style: 'display:flex;gap:8px;margin-top:12px' }, h('button', { class: 'nm-btn nm-btn--ghost', type: 'button', onclick: () => { state.share.preview = false; renderSheet(); } }, 'חזרה לעריכה'), h('button', { class: 'nm-btn nm-btn--ghost', type: 'button', onclick: () => { state.share = { type: 'idea', title: '', desc: '', area: '', preview: false, errors: {} }; renderSheet(); } }, 'ניקוי')));
    }
    const errs = s.errors || {};
    const field = (key, label, control, hint) => h('div', { class: 'nm-field' },
      h('label', { for: `nm-f-${key}` }, label), control, hint || null,
      errs[key] ? h('small', { class: 'nm-err', id: `nm-e-${key}`, role: 'alert' }, errs[key]) : null);
    const bind = (key, el) => {
      el.id = `nm-f-${key}`;
      if (errs[key]) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', `nm-e-${key}`); }
      el.addEventListener('input', () => {
        s[key] = el.value;
        if (s.errors && s.errors[key]) { delete s.errors[key]; el.removeAttribute('aria-invalid'); const m = el.parentNode.querySelector('.nm-err'); if (m) m.remove(); }
        if (key === 'desc') { const c = dom.sheet.querySelector('.nm-count'); if (c) c.textContent = `${el.value.length}/400`; }
      });
      return el;
    };
    const form = h('form', { class: 'nm-form', novalidate: true, onsubmit: (e) => {
      e.preventDefault();
      s.errors = validateShare(s);
      if (Object.keys(s.errors).length) {
        renderSheet();
        const bad = dom.sheet.querySelector('[aria-invalid="true"]');
        if (bad) bad.focus();
        return;
      }
      s.preview = true; renderSheet();
    } },
      h('fieldset', { class: 'nm-radios' }, h('legend', {}, 'מה תרצו לשתף?'),
        ...types.map(([k, lbl]) => h('label', { class: 'nm-radio' }, h('input', { type: 'radio', name: 'kind', value: k, checked: s.type === k || null, onchange: () => { s.type = k; } }), h('span', {}, lbl)))),
      field('title', 'כותרת קצרה (חובה)', bind('title', h('input', { type: 'text', maxlength: '80', value: s.title, autocomplete: 'off' }))),
      field('desc', 'תיאור (חובה)', bind('desc', h('textarea', { maxlength: '400', rows: '4' }, s.desc)), h('small', { class: 'nm-count' }, `${s.desc.length}/400`)),
      field('area', 'אזור כללי בשכונה (לא חובה)', bind('area', h('input', { type: 'text', maxlength: '60', value: s.area, autocomplete: 'off' })), h('small', {}, 'בלי כתובת מדויקת ובלי פרטי קשר.')),
      h('button', { class: 'nm-btn', type: 'submit' }, 'תצוגה מקדימה'));
    return sheetShell('אני רוצה לשתף', 'רעיון, צורך, משאב או יוזמה חדשה — או הצעה לעזור.', banner, form);
  }

  // --- מה קורה עכשיו (כל האירועים) ---
  function evRow(ev, past) {
    const dateLine = [ev.weekdayText, ev.dateText, ev.hebrewDateText].filter(Boolean).join(' · ') + (ev.time ? ` · ${ev.time}` : '');
    const notes = ev.provenance.reviewNotes || [];
    const src = state.data.sources[ev.provenance.sourceId];
    return h('li', { class: 'nm-ev' + (past ? ' nm-ev--past' : ''), 'data-event': ev.id },
      h('span', { class: 'nm-ev__d' }, dateLine, past ? ' · מועד שחלף' : ''),
      h('p', { class: 'nm-ev__t' }, ev.title),
      ev.description ? h('p', { class: 'nm-ev__p' }, ev.description) : null,
      ev.locationLabel ? h('p', { class: 'nm-ev__p' }, `מקום: ${ev.locationLabel}`) : null,
      !past && !ev.time ? h('p', { class: 'nm-ev__p nm-ev__gap' }, 'שעה: טרם נמסרה') : null,
      !past && !ev.locationLabel ? h('p', { class: 'nm-ev__p nm-ev__gap' }, 'מקום: טרם נמסר') : null,
      h('details', { class: 'nm-det', open: REVIEW_OPEN || null }, h('summary', {}, 'מקור ובדיקה'),
        h('p', {}, `מקור: ${src.label}`), h('p', {}, `רמת אימות: ${state.data.verificationLevels[ev.provenance.verification]}`),
        notes.length ? h('ul', {}, ...notes.map((n) => h('li', {}, n))) : null));
  }
  function nowBody() {
    const { upcoming, past } = Core.classifyEvents(state.data.events, state.today);
    const process = past.filter((e) => e.process === 'mobilim-ba-shchuna');
    const otherPast = past.filter((e) => e.process !== 'mobilim-ba-shchuna');
    return sheetShell('מה קורה עכשיו?', 'פעילויות קרובות והזדמנויות להצטרף — רק מה שיש לו תאריך בחומר המקור.',
      h('h3', { class: 'nm-h3' }, 'בקרוב'),
      upcoming.length ? h('ul', { class: 'nm-list', 'data-section': 'upcoming' }, ...upcoming.map((e) => evRow(e, false))) : h('p', { class: 'nm-empty' }, 'אין כרגע פעילות עתידית עם תאריך מאומת.'),
      h('details', { class: 'nm-det', 'data-section': 'past' },
        h('summary', {}, `מועדים שחלפו (${past.length})`),
        h('p', {}, 'מוצגים לתיעוד בלבד — לא כפעילויות עתידיות.'),
        process.length ? h('h3', { class: 'nm-h3' }, 'מובילים בשכונה — מסלול העבודה') : null,
        process.length ? h('ul', { class: 'nm-list' }, ...process.map((e) => evRow(e, true))) : null,
        otherPast.length ? h('h3', { class: 'nm-h3' }, 'אירועים נוספים') : null,
        otherPast.length ? h('ul', { class: 'nm-list' }, ...otherPast.map((e) => evRow(e, true))) : null));
  }

  // --- ארגז הכלים ---
  function guideBody() {
    const d = state.data, g = d.toolboxGuide;
    if (!g) return [];
    const byId = (id) => d.toolbox.find((t) => t.id === id);
    const q = (x) => {
      const refs = (x.toolboxRefs || []).map(byId).filter(Boolean);
      return h('li', { class: 'nm-q', 'data-q': x.id },
        h('details', { class: 'nm-q__det' },
          h('summary', { class: 'nm-q__sum' },
            h('span', { class: 'nm-q__w' }, x.q),
            h('span', { class: 'nm-q__p' }, x.prompt),
            x.draft ? h('span', { class: 'nm-q__draft' }, 'טיוטה') : null),
          h('div', { class: 'nm-q__body' },
            x.tools.length ? h('ul', { class: 'nm-q__tools' }, ...x.tools.map((t) => h('li', {}, h('b', {}, t.t), h('span', {}, t.d)))) : null,
            refs.length ? h('p', { class: 'nm-q__rl' }, x.refsLabel || 'מארגז הכלים') : null,
            refs.length ? h('div', { class: 'nm-q__refs' }, ...refs.map((t) => h('button', { class: 'nm-q__ref', type: 'button', 'data-tool-ref': t.id, onclick: () => { const el = dom.sheet.querySelector(`[data-tool="${t.id}"]`); if (el) { el.scrollIntoView({ block: 'start' }); el.querySelector('.nm-tb__t').focus(); } } }, t.title))) : null,
            (x.links || []).includes('now') ? h('button', { class: 'nm-q__ref', type: 'button', onclick: (e) => openView('now', e.currentTarget) }, 'מה כבר מתוכנן בשכונה') : null,
            x.pending ? h('p', { class: 'nm-empty' }, x.pending) : null,
            x.draft ? h('p', { class: 'nm-q__dn' }, 'ניסוח השאלה והכלי הוא טיוטה, ממתין לאישור.') : null)));
    };
    return [
      h('section', { class: 'nm-guide', 'aria-labelledby': 'nm-guide-h' },
        h('h3', { class: 'nm-h3 nm-guide__h', id: 'nm-guide-h' }, g.title),
        h('p', { class: 'nm-guide__lead' }, g.lead),
        h('ol', { class: 'nm-guide__qs' }, ...g.questions.map(q)),
        h('p', { class: 'nm-guide__src' }, g.source)),
      h('h3', { class: 'nm-h3 nm-guide__res' }, 'משאבים בשכונה')];
  }
  function toolboxBody() {
    const d = state.data;
    const out = guideBody();
    d.toolboxGroups.forEach((g) => {
      const items = d.toolbox.filter((t) => t.group === g.id);
      out.push(h('h4', { class: 'nm-h3 nm-h3--sub' }, g.label));
      if (!items.length) { out.push(h('p', { class: 'nm-empty' }, 'טרם סופק חומר לקטגוריה זו — ממתין לרכזת הקהילה.')); return; }
      out.push(h('ul', { class: 'nm-list' }, ...items.map((t) => {
        const src = d.sources[t.provenance.sourceId];
        const money = (t.facts || []).find((f) => f.label === 'תקציב הפרויקט');
        const others = (t.facts || []).filter((f) => f !== money);
        return h('li', { class: 'nm-tb', 'data-tool': t.id },
          h('h4', { class: 'nm-tb__t', tabindex: '-1' }, t.title),
          t.summary ? h('p', { class: 'nm-tb__p' }, t.summary) : null,
          money ? h('div', { class: 'nm-money' }, h('b', {}, money.value), h('span', {}, money.label)) : null,
          ...others.map((f) => h('p', { class: 'nm-tb__p' }, `${f.label}: ${f.value}`)),
          t.conditions && t.conditions.length ? h('ul', { class: 'nm-checks' }, ...t.conditions.map((c) => h('li', {}, c))) : null,
          t.mapPosition ? h('button', { class: 'nm-more nm-more--inline', type: 'button', onclick: (e) => { setLayer('toolbox', true); select(t.id, e.currentTarget); } }, 'הצגה על המפה') : null,
          h('details', { class: 'nm-det', open: REVIEW_OPEN || null }, h('summary', {}, 'מקור ובדיקה'), h('p', {}, `מקור: ${src.label}`), h('p', {}, `רמת אימות: ${d.verificationLevels[t.provenance.verification]}`),
            t.provenance.reviewNotes && t.provenance.reviewNotes.length ? h('ul', {}, ...t.provenance.reviewNotes.map((n) => h('li', {}, n))) : null));
      })));
    });
    return sheetShell('ארגז הכלים', 'שאלות שעוזרות לתכנן יוזמה, והמשאבים שהוזכרו בחומר. פרטי קשר אינם מפורסמים. המשאבים מסומנים גם במפה, בשכבת ״ארגז הכלים״.', ...out);
  }

  // --- חוסן ותמיכה ---
  function resilienceBody() {
    const d = state.data;
    const out = [];
    resilienceGroups().forEach(({ g, entries }) => {
      out.push(h('div', { class: 'nm-resgrp', 'data-res-group': g.id },
        h('h3', { class: 'nm-h3' }, g.label),
        h('p', { class: 'nm-lead' }, g.hint),
        entries.length ? h('ul', { class: 'nm-list' }, ...entries.map((e) => h('li', { class: 'nm-tb' }, h('h4', { class: 'nm-tb__t' }, e.title), e.summary ? h('p', { class: 'nm-tb__p' }, e.summary) : null,
          h('details', { class: 'nm-det' }, h('summary', {}, 'מקור ובדיקה'), h('p', {}, `מקור: ${d.sources[e.provenance.sourceId].label}`), h('p', {}, `רמת אימות: ${d.verificationLevels[e.provenance.verification]}`)))))
          : h('p', { class: 'nm-empty' }, `${g.emptyNote}. כאן יוצגו רק שירותים ומידע שנמסרו ואומתו, עם מקור.`)));
    });
    return sheetShell('חוסן ותמיכה', 'מידע על תמיכה בשגרה ועל מענים בחירום. לא מוצג כאן שירות שלא אומת, ולא מוצגים פרטי קשר שלא נמסרו.', ...out);
  }

  // --- רשימת כל הפריטים ---
  function listBody() {
    const d = state.data;
    const items = state.entries.filter((it) => Core.matchesQuery(it, state.query));
    const groups = Core.groupForList(items);
    const row = (it, layer) => h('li', {}, h('button', { class: `nm-row nm-row--${layer || 'none'}${Core.isIdea(it) ? ' nm-row--idea' : ''}`, type: 'button', 'data-id': it.id, 'aria-pressed': String(state.selectedId === it.id), onclick: (e) => select(it.id, e.currentTarget) },
      h('span', { class: 'nm-row__dot' }), h('span', { class: 'nm-row__t' }, it.title), h('span', { class: 'nm-row__m' }, !it.layers.length ? 'ללא סימון' : (Core.needsReview(it) ? 'לאימות' : ''))));
    const section = (label, arr, layer, emptyNote) => [h('h3', { class: 'nm-h3' }, `${label} (${arr.length})`), arr.length ? h('ul', { class: 'nm-list' }, ...arr.map((it) => row(it, layer))) : h('p', { class: 'nm-empty' }, emptyNote)];
    const search = h('input', { class: 'nm-search', type: 'search', placeholder: 'חיפוש לפי שם', 'aria-label': 'חיפוש לפי שם', value: state.query, oninput: (e) => { state.query = e.target.value; const pos = e.target.selectionStart; renderSheet(); const i = dom.sheet.querySelector('.nm-search'); i.focus(); i.setSelectionRange(pos, pos); } });
    return sheetShell('כל הפריטים', 'כל פריט נמצא כאן גם אם אין לו סימון על המפה. פריט שמופיע בכמה שכבות הוא אותו פריט.', search,
      ...(state.query && !items.length ? [h('p', { class: 'nm-empty', role: 'status' }, `לא נמצאו פריטים התואמים ל״${state.query}״. אפשר לנקות את החיפוש כדי לראות את כל הפריטים.`)] : [...d.layers.flatMap((l) => section(l.label, groups[l.id], l.id, l.emptyNote + '.')),
      ...section('ממתינים לסיווג', groups.unclassified, null, 'אין פריטים שממתינים לסיווג.')]),
      h('p', { class: 'nm-lead', style: 'margin-top:12px' }, 'פריט שממתין לסיווג אינו מוצג על המפה עד שיוגדר לאיזו שכבה הוא שייך.'));
  }

  // ---------- זום וגרירה ----------
  function stageSize() { const r = dom.stage.getBoundingClientRect(); return { w: r.width, h: r.height, l: r.left, t: r.top }; }
  function layout() {
    const s = stageSize();
    if (!s.w || !s.h) return;
    // כיסוי המסגרת, אבל בלי לחתוך את הסימונים: תמיד נראים לפחות 86% מגובה האיור (חלון רחב ונמוך מקבל שוליים קרם, לא חיתוך)
    const AW = state.data.mapImage ? state.data.mapImage.width : Art.W, AH = state.data.mapImage ? state.data.mapImage.height : Art.H;
    const contain = Math.min(s.w / AW, s.h / AH), cover = Math.max(s.w / AW, s.h / AH);
    // כשהחיתוך קטן (עד 10%) מציגים את כל האיור עם שוליים קרם, כדי שהצורה לא תיחתך בקצה
    const base = cover / contain <= 1.1 ? contain : Math.max(contain, Math.min(cover, s.h / (0.86 * AH)));
    const sc = base * state.zoom;
    const w = AW * sc, hh = AH * sc;
    const mx = Math.max(0, (w - s.w) / 2), my = Math.max(0, (hh - s.h) / 2);
    state.panX = clamp(state.panX, -mx, mx);
    state.panY = clamp(state.panY, -(my + state.cover), my); // cover: מקום שהכרטיס התחתון (מובייל) מסתיר
    dom.world.style.width = `${w}px`;
    dom.world.style.height = `${hh}px`;
    dom.world.style.left = `${(s.w - w) / 2 + state.panX}px`;
    dom.world.style.top = `${(s.h - hh) / 2 + state.panY}px`;
  }
  function zoomBy(k, cx, cy) {
    const s = stageSize();
    const z0 = state.zoom, z1 = clamp(z0 * k, 1, 2.8);
    if (z1 === z0) return;
    const px = (cx == null ? s.l + s.w / 2 : cx) - s.l - s.w / 2;
    const py = (cy == null ? s.t + s.h / 2 : cy) - s.t - s.h / 2;
    const kk = z1 / z0;
    state.panX = px - (px - state.panX) * kk;
    state.panY = py - (py - state.panY) * kk;
    state.zoom = z1;
    state.savedPan = null;
    layout();
  }
  function recenter() { state.zoom = 1; state.panX = 0; state.panY = 0; layout(); }
  function ensureVisible(it) {
    if (!it.mapPosition) return;
    const s = stageSize();
    const wl = parseFloat(dom.world.style.left), wt = parseFloat(dom.world.style.top), ww = parseFloat(dom.world.style.width), wh = parseFloat(dom.world.style.height);
    const x = wl + (it.mapPosition.x / 100) * ww, y = wt + (it.mapPosition.y / 100) * wh;
    const m = isMobile() ? 40 : 70;
    const limitY = state.cover ? s.h - state.cover : s.h; // מעל הכרטיס התחתון, אם יש
    let dx = 0, dy = 0;
    if (x < m) dx = m - x; else if (x > s.w - m) dx = s.w - m - x;
    if (y < m) dy = m - y; else if (y > limitY - m) dy = limitY - m - y;
    if (dx || dy) { state.panX += dx; state.panY += dy; layout(); }
  }
  function attachPanZoom(stage) {
    const pts = new Map();
    let last = null, pinch = null, dragged = false;
    stage.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.mk')) return;
      stage.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      last = { x: e.clientX, y: e.clientY };
      dragged = false;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: state.zoom }; }
    });
    stage.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && pinch) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        zoomBy((pinch.z * (d / pinch.d)) / state.zoom, (a.x + b.x) / 2, (a.y + b.y) / 2);
        return;
      }
      if (pts.size === 1 && last) {
        const dx = e.clientX - last.x, dy = e.clientY - last.y;
        if (Math.abs(dx) + Math.abs(dy) > 2) { dragged = true; state.savedPan = null; stage.classList.add('is-drag'); }
        state.panX += dx; state.panY += dy; last = { x: e.clientX, y: e.clientY };
        layout();
      }
    });
    const end = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) { last = null; stage.classList.remove('is-drag'); } };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('wheel', (e) => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY); }, { passive: false });
    void dragged;
  }

  function onKey(e) {
    if (e.key !== 'Escape') return;
    if (state.selectedId) deselect();
    else if (state.view !== 'home') closeView();
  }
})();
