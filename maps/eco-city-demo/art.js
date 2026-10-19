/* איורי המפה: דמויות וסצנות תל אביביות בסגנון מפת עיר מצוירת ביד.
   קו דיו רועד (פילטר ink) וצבע גואש עם טקסטורה (פילטר gouache). כל איור הוא SVG עצמאי בצבעי אקו סיטי. */
(function(){
var INK='#1E3F3F',CREAM='#FFF9F5',SKY='#DCF2FD',GOLD='#C59A3C',MUSTARD='#E7B84A',TERRA='#C8643C',OLIVE='#7C9A6A',SKIN='#F2D3B6',SKIN2='#D9A47E',DENIM='#3F6A8A',PINK='#E9A99A';

/* פילטרים משותפים, נכנסים לדף פעם אחת */
var DEFS='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'+
 '<filter id="ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter>'+
 '<filter id="gouache" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" result="n"/>'+
  '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.55 0.62" result="g"/>'+
  '<feComposite in="g" in2="SourceGraphic" operator="in" result="gi"/><feBlend in="SourceGraphic" in2="gi" mode="multiply" result="b"/>'+
  '<feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="5" result="w"/><feDisplacementMap in="b" in2="w" scale="2.6"/></filter>'+
'</defs></svg>';

/* כל איור: שכבת צבע (gouache) מתחת לשכבת קו (ink) */
function art(w,h,fill,line){
  return '<svg viewBox="0 0 '+w+' '+h+'" aria-hidden="true">'+
   '<g filter="url(#gouache)" stroke="none">'+fill+'</g>'+
   '<g filter="url(#ink)" fill="none" stroke="'+INK+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+line+'</g></svg>';
}
function waves(y,x0,x1,amp){var d='M'+x0+' '+y;for(var x=x0;x<x1;x+=16)d+='q4 -'+amp+' 8 0t8 0';return '<path d="'+d+'"/>';}

var A={};

/* היפסטר עם משקפיים עגולות, קפה קר ואופניים וינטג' עם סל פרחים */
A.hipster=art(250,230,
 /* אופניים */
 '<g transform="translate(30,50)"><path d="M150 70h34l-4 20h-28z" fill="'+GOLD+'"/><circle cx="160" cy="62" r="7" fill="'+PINK+'"/><circle cx="172" cy="60" r="6" fill="'+MUSTARD+'"/><circle cx="166" cy="56" r="5" fill="'+TERRA+'"/>'+
 '<path d="M150 58c2 6 4 10 6 12M178 56c-2 6-3 10-4 14" stroke="'+OLIVE+'" stroke-width="3"/></g>'+
 /* רגליים: ג'ינס מקופל */
 '<path d="M58 140h14l-2 62h-12zM78 140h14l4 62h-12z" fill="'+DENIM+'"/>'+
 '<path d="M56 196h14v7H56zM82 196h14v7H82z" fill="'+SKY+'"/>'+
 '<path d="M50 206c0-6 6-8 12-8h8v12H52zM82 210v-12h10c6 0 12 4 12 12z" fill="'+CREAM+'"/>'+
 /* חולצת פסים */
 '<path d="M50 80c0-14 12-20 26-20s26 6 26 20l4 62H46z" fill="'+CREAM+'"/>'+
 '<path d="M48 92h56M47 104h58M46 116h60M46 128h60" stroke="'+TERRA+'" stroke-width="5"/>'+
 /* ידיים, תיק בד */
 '<path d="M50 84c-10 14-14 30-12 46l8 2c0-14 4-26 10-38z" fill="'+SKIN+'"/>'+
 '<path d="M102 84c10 10 14 22 14 34l-8 2c-2-10-6-20-12-28z" fill="'+SKIN+'"/>'+
 '<path d="M26 118h24v28H26z" fill="'+SKY+'"/>'+
 /* קפה קר */
 '<path d="M106 112h16l-2 26h-12z" fill="'+CREAM+'"/><path d="M108 122h12l-1 15h-10z" fill="#9C6B45"/>'+
 /* ראש, זקן, שיער, באן */
 '<ellipse cx="76" cy="38" rx="17" ry="19" fill="'+SKIN+'"/>'+
 '<path d="M60 40c0 18 10 26 16 26s16-8 16-26c-4 8-10 10-16 10s-12-2-16-10z" fill="#6B4430"/>'+
 '<path d="M58 34c0-14 10-20 18-20s18 6 18 20c-6-6-12-8-18-8s-12 2-18 8z" fill="#6B4430"/>'+
 '<circle cx="78" cy="12" r="8" fill="#6B4430"/>'+
 '<circle cx="66" cy="44" r="3" fill="'+PINK+'" opacity=".7"/><circle cx="88" cy="44" r="3" fill="'+PINK+'" opacity=".7"/>',
 /* קווים */
 '<circle cx="128" cy="186" r="26"/><circle cx="196" cy="186" r="26"/><circle cx="128" cy="186" r="3"/><circle cx="196" cy="186" r="3"/>'+
 '<path d="M128 186l20-44h34l14 44M148 142l18 44h-38M166 186l16-44M142 132h16M178 132l4 10M176 128c4-4 10-4 14 0"/>'+
 '<g transform="translate(30,50)"><path d="M150 70h34l-4 20h-28zM152 76h30M154 82h26M158 70v20M166 70v20M174 70v20"/></g>'+
 '<path d="M58 140l-2 62M72 140l-2 62M78 140l4 62M92 140l4 62M56 196h14M82 196h14"/>'+
 '<path d="M50 206c0-6 6-8 12-8h8v12H52zM82 210v-12h10c6 0 12 4 12 12z"/>'+
 '<path d="M50 80c0-14 12-20 26-20s26 6 26 20l4 62H46z"/><path d="M68 60l8 10 8-10"/>'+
 '<path d="M50 84c-10 14-14 30-12 46l8 2c0-14 4-26 10-38M102 84c10 10 14 22 14 34l-8 2c-2-10-6-20-12-28"/>'+
 '<path d="M26 118h24v28H26zM30 118c0-12 16-12 16 0M32 130h12"/>'+
 '<path d="M106 112h16l-2 26h-12zM104 112h20M116 112l4-14"/>'+
 '<ellipse cx="76" cy="38" rx="17" ry="19"/><path d="M60 40c0 18 10 26 16 26s16-8 16-26"/>'+
 '<path d="M58 34c0-14 10-20 18-20s18 6 18 20"/><circle cx="78" cy="12" r="8"/>'+
 '<circle cx="69" cy="37" r="6" stroke-width="2.4"/><circle cx="84" cy="37" r="6" stroke-width="2.4"/><path d="M75 37h3M63 35l-4-2M90 35l4-2"/>'+
 '<circle cx="69" cy="37" r="1.3" fill="'+INK+'"/><circle cx="84" cy="37" r="1.3" fill="'+INK+'"/><path d="M76 42l-1 4h3M72 51c2 2 6 2 8 0"/>');

/* זוג בבית קפה: סוכך מפוספס, לפטופ, קפה הפוך, קרואסון וכלב תחש מתחת לשולחן */
A.couple=(function(){
 var stripes='';for(var x=14;x<246;x+=24)stripes+='<path d="M'+x+' 14h12l-2 26h-12z" fill="'+CREAM+'"/>';
 var scal='';for(var x=10;x<250;x+=16)scal+='<path d="M'+x+' 40q8 12 16 0"/>';
 var scalF='';for(var x=10;x<250;x+=16)scalF+='<path d="M'+x+' 40q8 12 16 0z" fill="'+INK+'"/>';
 return art(260,230,
  '<path d="M6 14h248l-4 26H10z" fill="'+INK+'"/>'+stripes+scalF+
  /* עציץ */
  '<path d="M224 176h26l-4 30h-18z" fill="'+TERRA+'"/><path d="M237 176c-10-12-14-30-6-44 2 14 6 22 6 44zM237 176c8-14 18-22 16-38-6 10-12 18-16 38zM237 176c-2-18 2-34 10-46" fill="'+OLIVE+'"/>'+
  /* שולחן */
  '<ellipse cx="130" cy="130" rx="40" ry="8" fill="'+CREAM+'"/>'+
  '<path d="M106 112l16-4 4 16-18 2z" fill="'+SKY+'"/>'+
  '<path d="M140 118h12v10h-12z" fill="'+CREAM+'"/><path d="M142 118h8v4h-8z" fill="#B88A5C"/>'+
  '<path d="M156 124c4-6 14-6 18 0-4 4-14 4-18 0z" fill="'+GOLD+'"/>'+
  /* היא: שיער מתולתל אדום, שמלה חרדל */
  '<path d="M52 92c0-12 8-18 20-18s20 6 20 18l6 56H48z" fill="'+MUSTARD+'"/>'+
  '<path d="M48 148h52l6 44H90l-4-30H64l-4 30H46z" fill="'+MUSTARD+'"/>'+
  '<path d="M86 160l26 6 2 30h-10l-2-22-20-4z" fill="'+SKIN+'"/>'+
  '<path d="M94 100c10 8 16 14 18 20" stroke="'+SKIN+'" stroke-width="9"/>'+
  '<ellipse cx="72" cy="58" rx="15" ry="17" fill="'+SKIN+'"/>'+
  '<path d="M52 56c-6-22 10-34 24-32 16 2 24 16 18 32-4-10-10-14-18-14-10 0-18 6-24 14z" fill="'+TERRA+'"/>'+
  '<circle cx="54" cy="66" r="8" fill="'+TERRA+'"/><circle cx="90" cy="66" r="7" fill="'+TERRA+'"/>'+
  '<circle cx="64" cy="64" r="3" fill="'+PINK+'"/><circle cx="80" cy="64" r="3" fill="'+PINK+'"/>'+
  /* כיסא שלה */
  /* הוא: כובע הפוך, חולצה תכלת, לפטופ */
  '<path d="M168 92c0-12 8-18 20-18s20 6 20 18l4 56h-48z" fill="'+SKY+'"/>'+
  '<path d="M164 148h48l2 44h-14l-2-30h-20l-2 30h-14z" fill="'+DENIM+'"/>'+
  '<path d="M168 100c-12 6-20 12-24 18" stroke="'+SKIN2+'" stroke-width="9"/>'+
  '<ellipse cx="188" cy="58" rx="15" ry="17" fill="'+SKIN2+'"/>'+
  '<path d="M172 50c2-14 30-14 32 2-10-4-22-4-32-2z" fill="'+OLIVE+'"/><path d="M204 50h12l-2 6h-10z" fill="'+OLIVE+'"/>'+
  '<path d="M178 70c4 6 16 6 20 0 0 6-4 10-10 10s-10-4-10-10z" fill="#4A3426"/>'+
  /* כלב */
  '<path d="M96 206c0-8 10-12 24-12h20c8 0 12-6 18-6s8 6 6 10l-6 4c0 6-4 10-12 10H100c-4 0-4-2-4-6z" fill="#B5703F"/>',
  scal+'<path d="M6 14h248l-4 26H10z"/>'+
  '<path d="M224 176h26l-4 30h-18zM237 176c-10-12-14-30-6-44M237 176c8-14 18-22 16-38M237 176c-2-18 2-34 10-46"/>'+
  '<ellipse cx="130" cy="130" rx="40" ry="8"/><path d="M130 138v70M114 212h32"/>'+
  '<path d="M106 112l16-4 4 16-18 2zM108 126l26-2"/><path d="M140 118h12v10h-12zM152 120c4 0 4 6 0 6M144 112c0-3 3-3 3-6"/>'+
  '<path d="M156 124c4-6 14-6 18 0-4 4-14 4-18 0zM160 122l2 4M165 120v5M170 122l-2 4"/>'+
  /* כיסאות ביסטרו */
  '<path d="M30 206v-50c0-14 8-22 18-22M30 156h34M64 156v50M34 176h26"/>'+
  '<path d="M230 150c0-14-8-22-18-22M230 150v56M196 150h34M196 150v56"/>'+
  '<path d="M52 92c0-12 8-18 20-18s20 6 20 18l6 56H48z"/><path d="M48 148h52l6 44H90l-4-30H64l-4 30H46z"/>'+
  '<path d="M86 160l26 6 2 30h-10l-2-22-20-4zM104 196h14M94 100c10 8 16 14 18 20"/>'+
  '<ellipse cx="72" cy="58" rx="15" ry="17"/><path d="M52 56c-6-22 10-34 24-32 16 2 24 16 18 32"/>'+
  '<path d="M66 56h.1M78 56h.1" stroke-width="3.4"/><path d="M68 66c2 2 6 2 8 0"/><circle cx="57" cy="70" r="2.4"/>'+
  '<path d="M168 92c0-12 8-18 20-18s20 6 20 18l4 56h-48z"/><path d="M164 148h48l2 44h-14l-2-30h-20l-2 30h-14z"/>'+
  '<path d="M168 100c-12 6-20 12-24 18"/><ellipse cx="188" cy="58" rx="15" ry="17"/>'+
  '<path d="M172 50c2-14 30-14 32 2-10-4-22-4-32-2zM204 50h12l-2 6h-10z"/>'+
  '<circle cx="181" cy="58" r="5.5"/><circle cx="195" cy="58" r="5.5"/><path d="M186.5 58h3"/>'+
  '<path d="M96 206c0-8 10-12 24-12h20c8 0 12-6 18-6s8 6 6 10l-6 4c0 6-4 10-12 10H100c-4 0-4-2-4-6zM96 204l-8-6M160 192l4-8M106 210v6M150 210v6"/><circle cx="160" cy="196" r="1.4" fill="'+INK+'"/>'+
  '<path d="M4 216h252"/>');
})();

/* הולכת רגל במעיל צהוב עם תיק אקו סיטי ומשקפי שמש על הראש */
A.walker=art(130,230,
 '<path d="M40 80c0-14 10-20 24-20s24 6 24 20l10 92H30z" fill="'+MUSTARD+'"/>'+
 '<path d="M50 172l-6 40h10l8-40M74 172l10 40h10l-8-40" fill="'+INK+'"/>'+
 '<path d="M40 208h16v8H38zM84 208h16l2 8H84z" fill="'+TERRA+'"/>'+
 '<path d="M88 92c8 12 10 26 8 40" stroke="'+MUSTARD+'" stroke-width="12"/>'+
 '<path d="M90 120h30v34H90z" fill="'+SKY+'"/>'+
 '<path d="M40 92c-8 10-10 22-8 34" stroke="'+MUSTARD+'" stroke-width="12"/>'+
 '<ellipse cx="64" cy="36" rx="15" ry="17" fill="'+SKIN+'"/>'+
 '<path d="M46 40c-4-20 8-28 18-28 12 0 22 8 18 28-2-8-8-12-18-12s-16 4-18 12z" fill="#2E2A28"/><path d="M48 40c-2 14-2 24 2 32M80 40c2 14 2 24-2 32" stroke="#2E2A28" stroke-width="6"/>'+
 '<circle cx="58" cy="44" r="3" fill="'+PINK+'"/><circle cx="72" cy="44" r="3" fill="'+PINK+'"/>',
 '<path d="M40 80c0-14 10-20 24-20s24 6 24 20l10 92H30z"/><path d="M64 62v110M56 62l8 14 8-14M58 100h.1M58 120h.1M58 140h.1" />'+
 '<path d="M50 172l-6 40M74 172l10 40M40 208h16v8H38zM84 208h16l2 8H84z"/>'+
 '<path d="M88 92c8 12 10 26 8 40M40 92c-8 10-10 22-8 34"/>'+
 '<path d="M90 120h30v34H90zM96 120c0-14 18-14 18 0"/>'+
 '<text x="105" y="142" font-size="7.5" font-family="Rubik,sans-serif" font-weight="500" text-anchor="middle" fill="'+INK+'" stroke="none">ecocity</text>'+
 '<ellipse cx="64" cy="36" rx="15" ry="17"/><path d="M46 40c-4-20 8-28 18-28 12 0 22 8 18 28"/>'+
 '<path d="M50 22h28" stroke-width="5"/><circle cx="56" cy="22" r="5" fill="'+INK+'"/><circle cx="72" cy="22" r="5" fill="'+INK+'"/>'+
 '<path d="M58 38h.1M70 38h.1" stroke-width="3.4"/><path d="M60 48c2 2 6 2 8 0M64 40l-1 4h2"/>');

/* חוף: שמשייה, מגבת, מטקות ודלי, עם גלים */
A.beach=art(200,150,
 '<path d="M20 70C30 26 150 26 160 70z" fill="'+CREAM+'"/>'+
 '<path d="M40 70C46 40 70 30 90 30L66 70zM114 70C114 40 100 30 90 30L140 70z" fill="'+TERRA+'"/>'+
 '<path d="M50 112l70-6 22 16-74 8z" fill="'+SKY+'"/><path d="M60 114l64-5M64 120l66-6" stroke="'+GOLD+'" stroke-width="4"/>'+
 '<ellipse cx="160" cy="96" rx="10" ry="12" fill="'+GOLD+'" transform="rotate(-20 160 96)"/><ellipse cx="182" cy="104" rx="10" ry="12" fill="'+TERRA+'" transform="rotate(20 182 104)"/>'+
 '<path d="M24 118h18l-3 16H27z" fill="'+MUSTARD+'"/>'+
 '<path d="M0 140c30-6 60 4 100 0s70-6 100 0v10H0z" fill="'+SKY+'"/>',
 '<path d="M20 70C30 26 150 26 160 70"/><path d="M20 70q10 8 20 0 10 8 20 0 10 8 20 0 10 8 20 0 10 8 20 0 10 8 20 0 10 8 20 0 10 8 20 0"/>'+
 '<path d="M90 30v96M86 22h8"/><path d="M50 112l70-6 22 16-74 8z"/>'+
 '<ellipse cx="160" cy="96" rx="10" ry="12" transform="rotate(-20 160 96)"/><path d="M164 107l4 12"/>'+
 '<ellipse cx="182" cy="104" rx="10" ry="12" transform="rotate(20 182 104)"/><path d="M178 115l-4 12"/><circle cx="172" cy="80" r="3" fill="'+INK+'"/>'+
 '<path d="M24 118h18l-3 16H27zM26 118c0-8 14-8 14 0"/>'+
 waves(140,0,200,5)+waves(146,8,190,3));

/* מפרשית על הים */
A.sail=art(120,110,
 '<path d="M62 12L100 74H62z" fill="'+CREAM+'"/><path d="M58 22L24 74h34z" fill="'+GOLD+'"/><path d="M14 80h92l-12 16H26z" fill="'+INK+'"/>'+
 '<path d="M0 100h120v10H0z" fill="'+SKY+'"/>',
 '<path d="M60 8v74M62 12L100 74H62zM58 22L24 74h34zM14 80h92l-12 16H26z"/><path d="M60 8l10 4-10 4"/>'+waves(102,0,120,4));

/* בית קפה בצפון הישן: חזית עם חלון ראווה, שולחן על המדרכה ועץ פיקוס */
A.cafe=art(200,170,
 '<path d="M20 40h130v110H20z" fill="'+CREAM+'"/>'+
 '<path d="M14 40h142l-8 20H22z" fill="'+TERRA+'"/>'+
 '<path d="M30 74h56v50H30z" fill="'+SKY+'"/><path d="M100 74h36v76h-36z" fill="'+INK+'"/>'+
 '<circle cx="174" cy="60" r="26" fill="'+OLIVE+'"/><circle cx="160" cy="74" r="16" fill="'+OLIVE+'"/>'+
 '<path d="M50 140c4-2 10-2 14 0" fill="'+GOLD+'"/>',
 '<path d="M20 40h130v110H20zM14 40h142l-8 20H22z"/><path d="M30 60v-20M50 60V40M70 60V40M90 60V40M110 60V40M130 60V40"/>'+
 '<path d="M30 74h56v50H30zM58 74v50M100 74h36v76h-36zM104 112h.1" stroke-linejoin="round"/>'+
 '<text x="85" y="35" font-size="14" font-family="Amatic SC,Rubik,sans-serif" font-weight="700" text-anchor="middle" fill="'+INK+'" stroke="none">קפה</text>'+
 '<circle cx="174" cy="60" r="26"/><circle cx="160" cy="74" r="16"/><path d="M174 86v64M174 110l-8-8"/>'+
 '<path d="M42 138h28M56 138v18M46 158h20"/><path d="M50 132h8v6h-8z"/><path d="M4 158h192"/>');

/* בניין באוהאוס לבן: מרפסות מעוגלות, חלונות סרט */
A.bauhaus=art(170,150,
 '<path d="M20 30h96v110H20z" fill="'+CREAM+'"/><path d="M116 48h20a22 22 0 0 1 22 22v70h-42z" fill="'+CREAM+'"/>'+
 '<path d="M28 46h80v8H28zM28 74h80v8H28zM28 102h80v8H28z" fill="'+SKY+'"/>'+
 '<path d="M60 120h18v20H60z" fill="'+GOLD+'"/>',
 '<path d="M20 30h96v110H20zM14 30h108M116 48h20a22 22 0 0 1 22 22v70h-42"/>'+
 '<path d="M28 46h80v8H28zM28 74h80v8H28zM28 102h80v8H28zM116 66h42M116 92h42M116 118h42"/>'+
 '<path d="M60 120h18v20H60z"/><path d="M4 140h162"/><path d="M136 30c6-6 14-6 18 0" />');

/* שדרות רוטשילד: פיקוסים, ספסל וקיוסק */
A.boulevard=art(200,130,
 '<circle cx="34" cy="44" r="26" fill="'+OLIVE+'"/><circle cx="166" cy="40" r="28" fill="'+OLIVE+'"/>'+
 '<path d="M84 50h40l-4 60H88z" fill="'+CREAM+'"/><path d="M78 40h52l-6 12H84z" fill="'+GOLD+'"/>',
 '<circle cx="34" cy="44" r="26"/><path d="M34 70v52M30 90l-8-8"/><circle cx="166" cy="40" r="28"/><path d="M166 68v54M170 88l8-8"/>'+
 '<path d="M84 50h40l-4 60H88zM78 40h52l-6 12H84zM94 70h20v18H94z"/>'+
 '<path d="M136 104h24M138 104v18M158 104v18M136 98h24"/><path d="M4 122h192"/>');

/* שיט בירקון */
A.row=art(140,90,
 '<path d="M8 54h124l-14 16H22z" fill="'+GOLD+'"/><circle cx="70" cy="28" r="8" fill="'+SKIN+'"/><path d="M62 40h16v14H62z" fill="'+SKY+'"/>'+
 '<path d="M0 80h140v10H0z" fill="'+SKY+'"/>',
 '<path d="M8 54h124l-14 16H22z"/><circle cx="70" cy="28" r="8"/><path d="M62 40h16v14H62zM62 44l-34 30M78 44l20 2 16 26"/>'+waves(82,0,140,4));

/* פארק המכתש בגבעתיים: עץ, ספסל וילד עם בלון */
A.park=art(160,120,
 '<circle cx="110" cy="38" r="30" fill="'+OLIVE+'"/><circle cx="40" cy="30" r="10" fill="'+TERRA+'"/>',
 '<circle cx="110" cy="38" r="30"/><path d="M110 68v44M106 88l-8-8"/>'+
 '<path d="M50 90h44M54 96h36M56 96v16M88 96v16M52 90V80h40v10"/>'+
 '<circle cx="40" cy="30" r="10"/><path d="M40 40c2 10-2 20 0 34"/><circle cx="36" cy="80" r="5"/><path d="M36 85v14M30 112l6-13 6 13M30 92h12"/>'+
 '<path d="M4 112h152"/>');

window.ECO_ART={defs:DEFS,art:A};
})();
