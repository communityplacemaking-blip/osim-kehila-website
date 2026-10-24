/* הבית הדיגיטלי של פרויקט: פיילוט קשרי דיירים של אקו סיטי.
   נטען מ-index.html רק כשבכתובת יש ?pilot=<שם>, וקורא את התוכן מ-pilot/<שם>.json.
   כל טקסט מהקובץ עובר ניקוי, קישורים רק ב-https, ותמונות רק מהתיקיות של המפה.
   אין כאן שליחה של טופס, שמירת נתונים או מדידה: "שאלה לצוות" היא קישור לערוץ מאושר, תצוגה בלבד, או כבויה. */
(function(){
var E=window.ECO_PILOT;if(!E||!window.L)return;
var map=E.map,det=E.det;
var HE={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
function h(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return HE[c];});}
function txt(v,max){return typeof v==='string'&&v.trim()?v.trim().slice(0,max||1200):'';}
function arr(v){return Array.isArray(v)?v:[];}
/* רק https, בלי שם משתמש וסיסמה בכתובת */
function link(u){if(typeof u!=='string')return '';try{var x=new URL(u);return x.protocol==='https:'&&!x.username&&!x.password?x.href:'';}catch(e){return '';}}
function pic(u){return typeof u==='string'&&/^(characters|photos)\/[a-z0-9-]+\.(png|jpe?g|webp)$/.test(u)?u:'';}
function day(d){var m=typeof d==='string'&&d.match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?(+m[3])+'.'+(+m[2])+'.'+m[1]:'';}
function today(){var t=new Date();return t.getFullYear()+'-'+('0'+(t.getMonth()+1)).slice(-2)+'-'+('0'+t.getDate()).slice(-2);}

/* קובץ התוכן: כל שדה רשות חוץ משם ומיקום. מה שלא עובר בדיקה פשוט לא מוצג */
function clean(c){
  if(!c||typeof c!=='object'||!c.project)return null;
  var p=c.project,lat=+p.lat,lng=+p.lng;
  if(!txt(p.name)||!(lat>31.95&&lat<32.2&&lng>34.7&&lng<34.9))return null;
  var st=c.stages&&typeof c.stages==='object'?c.stages:{};
  var inq=c.inquiry&&typeof c.inquiry==='object'?c.inquiry:{},mode=inq.mode;
  if(mode==='link'&&!link(inq.url))mode='off';
  if(mode!=='link'&&mode!=='preview')mode='off';
  return {
    demo:c.demo===true,
    name:txt(p.name,80),city:txt(p.city,40),place:txt(p.place,140),desc:txt(p.description,600),
    status:txt(p.infoStatus,40),updated:day(p.updated),lat:lat,lng:lng,
    hero:p.hero&&typeof p.hero==='object'?{img:pic(p.hero.image),cap:txt(p.hero.caption,80)}:{img:'',cap:''},
    stages:{title:txt(st.title,60),items:arr(st.items).map(function(s){return txt(s,40);}).filter(Boolean).slice(0,6),
      current:typeof st.current==='number'?st.current:null,note:txt(st.note,200)},
    updates:arr(c.updates).map(function(u){u=u||{};return {date:day(u.date),raw:u.date,title:txt(u.title,120),body:txt(u.body,600),
      pending:u.status!=='approved',links:arr(u.links).map(cleanLink).filter(Boolean).slice(0,3)};})
      .filter(function(u){return u.title;}).sort(function(a,b){return a.raw<b.raw?1:-1;}).slice(0,6),
    faq:arr(c.faq).map(function(f){f=f||{};return {q:txt(f.q,160),a:txt(f.a,800)};}).filter(function(f){return f.q&&f.a;}).slice(0,10),
    contacts:arr(c.contacts).map(function(k){k=k||{};return {role:txt(k.role,80),text:txt(k.text,200),url:link(k.url),label:txt(k.label,40)};})
      .filter(function(k){return k.role;}).slice(0,6),
    links:arr(c.links).map(cleanLink).filter(Boolean).slice(0,6),
    /* מפגש מוצג רק כשהוא מאושר ועוד לא עבר */
    meetings:arr(c.meetings).map(function(m){m=m||{};return {raw:m.date,date:day(m.date),time:txt(m.time,20),title:txt(m.title,120),where:txt(m.place,120),
      url:link(m.registration),ok:m.approved===true};}).filter(function(m){return m.ok&&m.title&&m.date&&m.raw>=today();}).slice(0,4),
    ask:{mode:mode,url:link(inq.url),label:txt(inq.label,60)}
  };
}
function cleanLink(l){l=l||{};var u=link(l.url),t=txt(l.label,60);return u&&t?{url:u,label:t}:null;}

var IC={
  chat:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  cal:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  map:'<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
};
function ic(k){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+IC[k]+'</svg>';}

var C=null,PP=null,near=[],pin=null;

function banner(){
  var b=document.createElement('div');b.className='pl-banner';b.setAttribute('role','note');
  b.textContent='אב־טיפוס להמחשה — לא פרויקט אמיתי';document.body.appendChild(b);
  document.documentElement.classList.add('pilot-demo');
}

function drawHood(){
  var lines=E.pickLines(PP,near);E.threads.clearLayers();
  lines.forEach(function(n){E.thread(PP,n.a).addTo(E.threads);
    if(E.Q.indexOf(n.a)>=0||!E.on.anc)L.marker([n.a.lat,n.a.lng],{interactive:false,keyboard:false,icon:L.divIcon({className:'',iconSize:[0,0],
      html:'<div class="poi" title="'+h(n.a.n)+'"><span>'+E.svg(n.a.k)+'</span></div>'})}).addTo(E.threads);});
  return lines.map(function(n){return n.a;});
}

function sec(id,title,body,icon){return '<section class="pl-sec" id="'+id+'" aria-labelledby="'+id+'-h"><h3 class="pl-h" id="'+id+'-h">'+(icon?ic(icon):'')+title+'</h3>'+body+'</section>';}

function render(){
  var tabs=[],out='';
  /* סקירה */
  var ov='<div class="pl-meta">'+(C.status?'<span class="pl-tag'+(C.demo?' demo':'')+'">סטטוס המידע: '+h(C.status)+'</span>':'')+
    (C.updated?'<span class="pl-upd">עודכן לאחרונה: '+h(C.updated)+'</span>':'')+'</div>'+
    (C.desc?'<p class="lead pl-lead">'+h(C.desc)+'</p>':'');
  var stg='';
  if(C.stages.items.length){var cur=C.stages.current;
    stg+='<div class="pl-stages"><div class="pl-st-t">'+h(C.stages.title||'שלבי הפרויקט')+'</div><ol>'+C.stages.items.map(function(s,i){
      return '<li class="'+(cur===i?'now':cur!=null&&i<cur?'done':'')+'"'+(cur===i?' aria-current="step"':'')+'><i></i><span>'+h(s)+'</span></li>';}).join('')+'</ol>'+
      (C.stages.note?'<p class="pl-note">'+h(C.stages.note)+'</p>':'')+'</div>';}
  if(C.ask.mode!=='off'){
    ov+='<div class="pl-ask"><div class="pl-ask-t"><span class="pl-ask-i">'+ic('chat')+'</span><div><b>יש לכם שאלה?</b><span>אפשר לשאול את צוות הפרויקט ישירות מכאן.</span></div></div>'+
      (C.ask.mode==='link'?'<a class="btn pri" href="'+h(C.ask.url)+'" target="_blank" rel="noopener">'+h(C.ask.label||'שאלה לצוות הפרויקט')+'</a>'
        :'<button class="btn pri" type="button" data-ask>שאלה לצוות הפרויקט</button><small class="pl-ask-n">באב־טיפוס: תצוגה בלבד, שום דבר לא נשלח</small>')+'</div>';}
  out+=sec('pl-overview','על הפרויקט',ov+stg);tabs.push(['pl-overview','סקירה']);
  /* מה חדש */
  if(C.updates.length){
    out+=sec('pl-updates','מה חדש','<p class="pl-legend"><span class="pl-st ok">מאושר</span> מידע שאקו סיטי אישרה · <span class="pl-st pend">כפוף לאישור</span> עדיין לא סופי</p><ul class="pl-upd-l">'+
      C.updates.map(function(u){return '<li class="'+(u.pending?'pend':'')+'"><div class="pl-u-top"><time>'+h(u.date)+'</time><span class="pl-st '+(u.pending?'pend':'ok')+'">'+(u.pending?'כפוף לאישור':'מאושר')+'</span></div>'+
        '<b>'+h(u.title)+'</b>'+(u.body?'<p>'+h(u.body)+'</p>':'')+
        (u.links.length?'<div class="pl-links">'+u.links.map(function(l){return '<a href="'+h(l.url)+'" target="_blank" rel="noopener">'+ic('link')+h(l.label)+'</a>';}).join('')+'</div>':'')+'</li>';}).join('')+'</ul>');
    tabs.push(['pl-updates','מה חדש']);}
  /* מפגשים: רק מאושרים וקרובים */
  if(C.meetings.length){
    out+=sec('pl-meetings','מפגשים קרובים','<ul class="pl-meet">'+C.meetings.map(function(m){return '<li><span class="pl-cal">'+ic('cal')+'</span><div><b>'+h(m.title)+'</b><span>'+h(m.date)+(m.time?' · '+h(m.time):'')+(m.where?' · '+h(m.where):'')+'</span></div>'+
      (m.url?'<a class="btn sec" href="'+h(m.url)+'" target="_blank" rel="noopener">להרשמה</a>':'')+'</li>';}).join('')+'</ul>');
    tabs.push(['pl-meetings','מפגשים']);}
  /* שאלות נפוצות */
  if(C.faq.length){
    out+=sec('pl-faq','שאלות נפוצות','<div class="pl-faq">'+C.faq.map(function(f){return '<details><summary>'+h(f.q)+'</summary><p>'+h(f.a)+'</p></details>';}).join('')+'</div>');
    tabs.push(['pl-faq','שאלות']);}
  /* קשר */
  if(C.contacts.length||C.links.length){
    out+=sec('pl-contact','קשר ומידע רשמי',(C.contacts.length?'<ul class="pl-people">'+C.contacts.map(function(k){return '<li><span class="pl-av">'+ic('user')+'</span><div><b>'+h(k.role)+'</b>'+(k.text?'<span>'+h(k.text)+'</span>':'')+
        (k.url?'<a href="'+h(k.url)+'" target="_blank" rel="noopener">'+h(k.label||'ליצירת קשר')+'</a>':'')+'</div></li>';}).join('')+'</ul>':'')+
      (C.links.length?'<div class="pl-links pl-off">'+C.links.map(function(l){return '<a href="'+h(l.url)+'" target="_blank" rel="noopener">'+ic('link')+h(l.label)+'</a>';}).join('')+'</div>':''));
    tabs.push(['pl-contact','קשר']);}
  /* השכונה */
  if(near.length){
    out+=sec('pl-hood','השכונה סביב הבית','<ul class="near">'+near.map(function(n){return '<li'+(E.A.indexOf(n.a)>=0?' data-ga="'+n.a.id+'"':'')+'><span class="ic">'+E.svg(n.a.k)+'</span>'+h(n.a.n)+'<small>'+E.walk(n.m)+'</small></li>';}).join('')+'</ul>'+
      '<button class="btn sec pl-tomap" type="button" data-hood>'+ic('map')+'לראות את השכונה על המפה</button>');
    tabs.push(['pl-hood','השכונה']);}

  var hero='<div class="gal ill pl-hero">'+(C.hero.img?'<figure class="pl-fig"><span class="pl-ring"><img src="'+h(C.hero.img)+'" alt=""></span>'+(C.hero.cap?'<figcaption>'+h(C.hero.cap)+'</figcaption>':'')+'</figure>':E.svg('home'))+
    '<button class="back" type="button">→ חזרה למפה</button><div class="ttl"><div class="pl-kicker">ECO CITY · הבית הדיגיטלי של הפרויקט</div><h2 class="serif">'+h(C.name)+'</h2>'+
    '<div class="c">'+h([C.city,C.place].filter(Boolean).join(' · '))+'</div></div></div>';
  var nav='<nav class="pl-tabs" aria-label="חלקי העמוד"><div class="pl-tabs-in">'+tabs.map(function(t,i){return '<button type="button" data-go="'+t[0]+'"'+(i?'':' aria-current="true"')+'>'+t[1]+'</button>';}).join('')+
    '<button type="button" class="pl-back2" data-hood aria-label="חזרה למפה, עם השכונה">'+ic('map')+'<span>מפה</span></button></div></nav>';
  var foot='<p class="src pl-src">'+(C.demo?'כל התוכן בעמוד הזה הוא לדוגמה, כדי להמחיש את השירות. אין כאן מידע על פרויקט אמיתי, ושום דבר לא נשלח או נשמר. ':'')+'זמני ההליכה בקירוב.</p>';
  return hero+nav+'<div class="dbody pl-body">'+out+foot+'</div>';
}

function bind(){
  det.querySelectorAll('[data-go]').forEach(function(b){b.onclick=function(){var s=document.getElementById(b.dataset.go),t=det.querySelector('.pl-tabs');
    if(s)det.scrollTo({top:s.offsetTop-(t?t.offsetHeight:0)-8,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});};});
  det.querySelectorAll('[data-hood]').forEach(function(b){b.onclick=toHood;});
  var a=det.querySelector('[data-ask]');if(a)a.onclick=askOpen;
  det.onscroll=spy;
}
/* הלשונית של החלק שגוללים בו מסומנת */
function spy(){var t=det.querySelector('.pl-tabs');if(!t)return;var y=det.scrollTop+t.offsetHeight+40,cur=null;
  det.querySelectorAll('.pl-sec').forEach(function(s){if(s.offsetTop<=y)cur=s.id;});
  t.querySelectorAll('[data-go]').forEach(function(b){if(b.dataset.go===cur)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});}

function open(){
  E.listOff();
  var anchors=drawHood();E.mark(null);
  det.innerHTML=render();E.bindD();bind();
  det.classList.add('open','pl-home');det.scrollTop=0;
  if(pin)pin.classList.add('on');
  E.fly(PP,anchors);
  var t=det.querySelector('h2');if(t){t.setAttribute('tabindex','-1');t.focus({preventScroll:true});}
}
/* חזרה למפה עם הקווים לשכונה, כדי לראות איפה הבית ביחס למקומות סביבו */
function toHood(){E.closeD();var anchors=drawHood();E.fly(PP,anchors);if(pin)pin.classList.add('on');}

/* "שאלה לצוות": תצוגה של הטופס בלבד. השדות כבויים, אין form ואין שליחה */
function askOpen(){
  askClose();
  var s=document.createElement('div');s.className='pl-sheet';s.setAttribute('role','dialog');s.setAttribute('aria-modal','true');s.setAttribute('aria-labelledby','pl-sheet-h');
  s.innerHTML='<div class="pl-sheet-in"><div class="pl-sheet-top"><h3 id="pl-sheet-h">שאלה לצוות הפרויקט</h3><button type="button" class="pl-x" aria-label="סגירה">✕</button></div>'+
    '<p class="pl-warn">'+ic('lock')+'<span>זו תצוגה של הטופס. באב־הטיפוס השליחה כבויה, ושום פרט לא נשמר או נשלח.</span></p>'+
    '<div class="pl-fields" aria-disabled="true">'+
      '<label>שם<input type="text" disabled placeholder="השם שלך"></label>'+
      '<label>טלפון או מייל לחזרה<input type="text" disabled placeholder="איך לחזור אליך"></label>'+
      '<label>הקשר שלי לפרויקט<select disabled><option>בעל/ת דירה</option><option>שוכר/ת</option><option>אחר</option></select></label>'+
      '<label>השאלה<textarea disabled rows="3" placeholder="מה תרצו לשאול?"></textarea></label>'+
    '</div>'+
    '<div class="pl-next"><b>בגרסה הפעילה</b><ul><li>השאלה מגיעה רק לצוות קשרי הדיירים, ולא מתפרסמת בשום מקום.</li><li>מקבלים מספר פנייה ואישור שהיא התקבלה.</li><li>אוספים רק את מה שצריך כדי לחזור אליכם.</li></ul></div>'+
    '<button type="button" class="btn pri" disabled>שליחה (כבויה באב־טיפוס)</button></div>';
  s.addEventListener('click',function(e){if(e.target===s||e.target.closest('.pl-x'))askClose();});
  det.appendChild(s);var x=s.querySelector('.pl-x');if(x)x.focus();
}
function askClose(){var s=det.querySelector('.pl-sheet');if(s){s.remove();var a=det.querySelector('[data-ask]');if(a)a.focus();return true;}return false;}
/* Esc סוגר קודם את חלון השאלה, ורק אחר כך את הכרטיס */
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&askClose())e.stopImmediatePropagation();},true);
new MutationObserver(function(){if(!det.classList.contains('open')&&det.classList.contains('pl-home')){det.classList.remove('pl-home');askClose();}}).observe(det,{attributes:true,attributeFilter:['class']});

function start(cfg){
  C=clean(cfg);if(!C){console.warn('pilot: קובץ התוכן חסר או לא תקין, המפה ממשיכה כרגיל');document.documentElement.classList.remove('pilot');return;}
  if(C.demo)banner();
  var w=E.warp(C.lat,C.lng);
  PP={n:C.name,lat:w[0],lng:w[1],rlat:C.lat,rlng:C.lng,s:'pilot'};
  near=E.nearA(PP,5);
  map.invalidateSize();
  var m=L.marker([PP.lat,PP.lng],{zIndexOffset:3000,riseOnHover:true,title:C.name,alt:C.name,
    icon:L.divIcon({className:'',iconSize:[0,0],html:'<div class="pl-pin"><span class="pl-dot"></span><span class="pl-lab">'+h(C.demo?'פרויקט ההדגמה':C.name)+'</span></div>'})})
    .on('click',open).addTo(map);
  pin=m.getElement()&&m.getElement().querySelector('.pl-pin');
  var b=document.createElement('button');b.type='button';b.className='chip pl-chip';b.innerHTML='<i class="pl-chip-dot"></i>'+h(C.demo?'פרויקט ההדגמה':C.name);
  b.onclick=function(e){e.stopPropagation();open();};
  var f=document.getElementById('filters');if(f)f.insertBefore(b,f.firstChild);
  /* מהקישור נכנסים ישר לבית של הפרויקט: רגע של מפה סביב הבית, ואז הכרטיס נפתח */
  map.setView([PP.lat,PP.lng],15,{animate:false});
  drawHood();
  setTimeout(open,matchMedia('(prefers-reduced-motion: reduce)').matches?0:700);
}
fetch('pilot/'+E.slug+'.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();}).then(start)
  .catch(function(e){console.warn('pilot: '+E.slug+' לא נטען ('+e.message+')');document.documentElement.classList.remove('pilot');});
})();
