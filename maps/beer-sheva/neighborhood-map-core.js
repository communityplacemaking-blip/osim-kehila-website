// neighborhood-map-core.js
// הלוגיקה הטהורה של "מפת החוסן המקומי" - בלי DOM, כך שאפשר לבדוק אותה ב-Node.
// נטען בדפדפן כסקריפט רגיל (window.NeighborhoodMapCore) וב-Node דרך require.
// מקור האמת: app/public/neighborhoods/<id>.json. הקובץ הזה לא מכיל תוכן.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NeighborhoodMapCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const LAYER_ORDER = ['existing', 'planned', 'toolbox'];
  const VERIFICATION_KEYS = ['source_stated', 'partly_legible', 'title_only', 'owner_message_only', 'owner_stated', 'date_only'];
  /** מפתחות שאסור שיופיעו בנתונים: קואורדינטות, כתובות ופרטי קשר. */
  const FORBIDDEN_KEYS = ['lat', 'lng', 'lon', 'latitude', 'longitude', 'coordinates', 'address', 'phone', 'tel', 'email', 'mail', 'whatsapp', 'contact'];
  const PHONE_RE = /(?:\+?972|0)[\s-]?\d{1,2}[\s-]?\d{3}[\s-]?\d{4}/;
  const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

  /** רשימת בעיות בנתונים (ריקה = תקין). משמש בבדיקות ובאזהרת קונסול. */
  function validateData(data) {
    const problems = [];
    const sources = data.sources || {};
    const layerIds = (data.layers || []).map((l) => l.id);
    const seen = new Set();
    (data.items || []).forEach((it) => {
      const where = `item ${it.id || '?'}`;
      if (!it.id) problems.push(`${where}: missing id`);
      if (seen.has(it.id)) problems.push(`${where}: duplicate id`);
      seen.add(it.id);
      if (!it.title) problems.push(`${where}: missing title`);
      if (!Array.isArray(it.layers)) problems.push(`${where}: layers must be an array (may be empty)`);
      (it.layers || []).forEach((l) => { if (!layerIds.includes(l)) problems.push(`${where}: unknown layer ${l}`); });
      if (!it.status || !it.status.code || !it.status.label) problems.push(`${where}: missing status`);
      const p = it.provenance;
      if (!p || !sources[p.sourceId]) problems.push(`${where}: provenance.sourceId missing or unknown`);
      else if (!VERIFICATION_KEYS.includes(p.verification)) problems.push(`${where}: unknown verification ${p.verification}`);
      if (!it.location || typeof it.location.verified !== 'boolean') problems.push(`${where}: location.verified must be boolean`);
      if (it.mapPosition) {
        const m = it.mapPosition;
        if (!(m.x >= 0 && m.x <= 100 && m.y >= 0 && m.y <= 100)) problems.push(`${where}: mapPosition out of range`);
        if (!(it.location && it.location.verified) && m.basis !== 'illustrative') problems.push(`${where}: unverified location needs basis "illustrative"`);
        if (!it.layers || it.layers.length === 0) problems.push(`${where}: unclassified item must not have a marker`);
      }
      if ((!it.layers || it.layers.length === 0) && !(p && p.reviewNotes && p.reviewNotes.length)) problems.push(`${where}: unclassified item needs reviewNotes`);
    });
    (data.events || []).forEach((ev) => {
      if (!ev.id || !ev.title || !ev.dateText) problems.push(`event ${ev.id || '?'}: missing id/title/dateText`);
      if (ev.isoDate && !/^\d{4}-\d{2}-\d{2}$/.test(ev.isoDate)) problems.push(`event ${ev.id}: bad isoDate`);
      if (!ev.provenance || !sources[ev.provenance.sourceId]) problems.push(`event ${ev.id}: provenance.sourceId missing or unknown`);
    });
    (data.toolbox || []).forEach((t) => {
      if (!(data.toolboxGroups || []).some((g) => g.id === t.group)) problems.push(`toolbox ${t.id}: unknown group ${t.group}`);
      if (!t.provenance || !sources[t.provenance.sourceId]) problems.push(`toolbox ${t.id}: provenance.sourceId missing or unknown`);
      if (seen.has(t.id)) problems.push(`toolbox ${t.id}: id clashes with an item`);
      if (!t.status || !t.status.code || !t.status.label) problems.push(`toolbox ${t.id}: missing status`);
      if (t.mapPosition && !(t.location && t.location.verified) && t.mapPosition.basis !== 'illustrative') problems.push(`toolbox ${t.id}: unverified location needs basis "illustrative"`);
    });
    const res = data.resilience;
    if (res) {
      (res.entries || []).forEach((e) => {
        if (!(res.groups || []).some((g) => g.id === e.group)) problems.push(`resilience ${e.id}: unknown group ${e.group}`);
        if (!e.provenance || !sources[e.provenance.sourceId]) problems.push(`resilience ${e.id}: provenance.sourceId missing or unknown`);
      });
    }
    scanForbidden(data, '$', problems);
    return problems;
  }

  function scanForbidden(node, path, problems) {
    if (Array.isArray(node)) { node.forEach((v, i) => scanForbidden(v, `${path}[${i}]`, problems)); return; }
    if (node && typeof node === 'object') {
      Object.keys(node).forEach((k) => {
        if (FORBIDDEN_KEYS.includes(k.toLowerCase())) problems.push(`${path}.${k}: forbidden key (no coordinates, addresses or contact details)`);
        scanForbidden(node[k], `${path}.${k}`, problems);
      });
      return;
    }
    if (typeof node === 'string' && (PHONE_RE.test(node) || EMAIL_RE.test(node))) problems.push(`${path}: looks like contact details`);
  }

  const isActive = (active, id) => (active instanceof Set ? active.has(id) : Array.isArray(active) && active.includes(id));
  const itemLayers = (item) => (Array.isArray(item.layers) ? item.layers : []);

  /** פריטים שגלויים לפי השכבות הפעילות. פריט אחד מופיע פעם אחת גם אם שייך לכמה שכבות פעילות. */
  function visibleItems(items, active) {
    return items.filter((it) => itemLayers(it).some((l) => isActive(active, l)));
  }

  /** פריטים שצריך לצייר עליהם סימון: גלויים ובעלי מיקום (מיקום להמחשה). */
  function markerItems(items, active) {
    return visibleItems(items, active).filter((it) => it.mapPosition);
  }

  /** השכבה שקובעת את צבע הסימון: הראשונה, לפי סדר השכבות, מבין הפעילות ששייכות לפריט. */
  function markerLayer(item, active) {
    return LAYER_ORDER.find((l) => itemLayers(item).includes(l) && isActive(active, l)) || null;
  }

  /** שמירת הפריט הנבחר: נשמר כל עוד הוא עדיין גלוי (גם אם שכבה אחת שלו כובתה אך אחרת פעילה). */
  function reconcileSelection(selectedId, items, active) {
    if (!selectedId) return null;
    const it = items.find((x) => x.id === selectedId);
    if (!it) return null;
    // פריט ללא שכבות (ממתין לסיווג) נפתח רק מהרשימה; לא תלוי בשכבות הפעילות.
    if (itemLayers(it).length === 0) return selectedId;
    return itemLayers(it).some((l) => isActive(active, l)) ? selectedId : null;
  }

  /** חלוקה לרשימה: כל פריט מופיע בכל שכבה שלו (אותו id), ופריטים ללא שכבה בקבוצה נפרדת. */
  function groupForList(items) {
    const groups = { unclassified: [] };
    LAYER_ORDER.forEach((l) => { groups[l] = []; });
    items.forEach((it) => {
      const layers = itemLayers(it);
      if (layers.length === 0) groups.unclassified.push(it);
      else layers.forEach((l) => groups[l] && groups[l].push(it));
    });
    return groups;
  }

  function countByLayer(items) {
    const counts = Object.fromEntries(LAYER_ORDER.map((l) => [l, 0]));
    items.forEach((it) => itemLayers(it).forEach((l) => { if (l in counts) counts[l] += 1; }));
    return counts;
  }

  /**
   * כל מה שמופיע על המפה ובכרטיסים, במבנה אחד: פריטי היוזמות ורשומות ארגז הכלים (שכבת "ארגז הכלים").
   * רשומת ארגז כלים נשארת זהות אחת (אותו id), ומקבלת את אותו מבנה כרטיס כמו יוזמה.
   */
  function allEntries(data) {
    const tools = (data.toolbox || []).map((t) => Object.assign({ kind: 'toolbox', layers: ['toolbox'], needs: [], partners: [], nextAction: null, location: { verified: false, label: null }, mapPosition: null }, t));
    return (data.items || []).map((it) => Object.assign({ kind: 'item' }, it)).concat(tools);
  }

  /** רעיון של תושבים שעדיין מחפש מענה (נשמר הסטטוס המקורי מהחומר). */
  const isIdea = (item) => !!(item && item.status && item.status.code === 'seeking_response');

  /** "מה קורה עכשיו": היום (תאריך זהה), בקרוב (אחרי היום) ומועדים שחלפו. */
  function eventTabs(events, todayIso) {
    const { upcoming, past } = classifyEvents(events, todayIso);
    return { today: upcoming.filter((e) => e.isoDate === todayIso), soon: upcoming.filter((e) => e.isoDate > todayIso), past };
  }

  /** "יוזמות חדשות": פריטים שנוספו מהודעות בעל הפרויקט (מקור מתוארך), מהחדש לישן. */
  function recentItems(data) {
    const dated = (id) => { const m = /(\d{4}-\d{2}-\d{2})/.exec(id || ''); return m ? m[1] : null; };
    return (data.items || []).filter((it) => it.provenance && dated(it.provenance.sourceId))
      .map((it) => ({ item: it, date: dated(it.provenance.sourceId) }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  /** תאריך "היום" בשעון ירושלים כ-YYYY-MM-DD. */
  function todayInJerusalem(now) {
    const d = now instanceof Date ? now : new Date();
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
    const get = (t) => parts.find((p) => p.type === t).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  }

  /** אירועים: עתידיים (מהיום והלאה) מול מועדים שחלפו. אירוע בלי תאריך ISO אינו מוצג כעתידי. */
  function classifyEvents(events, todayIso) {
    const upcoming = [];
    const past = [];
    events.forEach((ev) => {
      if (ev.isoDate && ev.isoDate >= todayIso) upcoming.push(ev);
      else past.push(ev);
    });
    upcoming.sort((a, b) => a.isoDate.localeCompare(b.isoDate));
    past.sort((a, b) => (a.isoDate || '').localeCompare(b.isoDate || ''));
    return { upcoming, past };
  }

  /** מיקום להצגה בכרטיס: רק מיקום מאומת. אחרת null (אין להציג מיקום לא מאומת). */
  function verifiedLocationLabel(item) {
    return item.location && item.location.verified && item.location.label ? item.location.label : null;
  }

  /** האם הפריט ממתין לבדיקה (כותרת לא מאומתת, ניסוח לא קריא, או חסר סיווג). */
  function needsReview(item) {
    const p = item.provenance || {};
    return item.titleVerified === false || p.verification === 'partly_legible' || itemLayers(item).length === 0 || !!(p.reviewNotes && p.reviewNotes.length);
  }

  /** נקודה בתוך מצולע (ray casting). */
  function pointInPolygon(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  /** חיפוש טקסט חופשי פשוט בכותרת, בכינויים ובתיאור. */
  function matchesQuery(item, query) {
    const q = (query || '').trim();
    if (!q) return true;
    const hay = [item.title, ...(item.aliases || []), item.summary || ''].join(' ');
    return hay.includes(q);
  }

  return { LAYER_ORDER, VERIFICATION_KEYS, validateData, allEntries, isIdea, eventTabs, recentItems, visibleItems, markerItems, markerLayer, reconcileSelection, groupForList, countByLayer, todayInJerusalem, classifyEvents, verifiedLocationLabel, needsReview, pointInPolygon, matchesQuery };
});
