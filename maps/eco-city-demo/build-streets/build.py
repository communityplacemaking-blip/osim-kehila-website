import json
from shapely.geometry import LineString,MultiLineString
from shapely.ops import linemerge
from collections import defaultdict,Counter
R=json.load(open('ta-roads.json'))
G={'motorway':'M','trunk':'M','primary':'A','secondary':'B','tertiary':'B','residential':'C','living_street':'C','unclassified':'C','pedestrian':'C'}
groups=defaultdict(list)
for r in R:
    k=G.get(r['c'])
    if not k or len(r['g'])<2: continue
    groups[(k,r['n'] or '')].append(LineString(r['g']))
out={'M':[],'A':[],'B':[],'C':[]}
for (k,n),ls in groups.items():
    m=linemerge(MultiLineString(ls)) if len(ls)>1 else ls[0]
    parts=list(m.geoms) if m.geom_type=='MultiLineString' else [m]
    tol={'M':.00004,'A':.00003,'B':.00003,'C':.00003}[k]
    for p in parts:
        p=p.simplify(tol)
        out[k].append([n,[[round(x,5),round(y,5)] for x,y in p.coords]])
print({k:len(v) for k,v in out.items()})
s=json.dumps(out,ensure_ascii=False,separators=(',',':'))
open('streets.json','w').write(s); print(len(s)//1024,'KB')
names=Counter()
for k in 'MAB':
    for n,c in out[k]: names[n]+=len(c)
print(names.most_common(40))
from shapely.geometry import LineString as LS
WANT=[('דיזנגוף',['דיזנגוף']),('אבן גבירול',['אבן גבירול']),('בן יהודה',['בן יהודה']),('רוטשילד',['שדרות רוטשילד','רוטשילד']),
 ('ארלוזורוב',['ארלוזורוב']),('איילון',['איילון צפון','איילון דרום']),('כצנלסון',['כצנלסון']),("ז'בוטינסקי",["ז'בוטינסקי","זאב ז'בוטינסקי"]),
 ('הירקון',['הירקון']),('אלנבי',['אלנבי']),("קינג ג'ורג'",["המלך ג'ורג'","קינג ג'ורג'"]),('שאול המלך',['שאול המלך']),('דרך נמיר',['דרך נמיר']),
 ('ויצמן',['ויצמן']),('נורדאו',['שדרות נורדאו','נורדאו']),('בוגרשוב',['בוגרשוב']),('פרישמן',['פרישמן']),
 ('יהודה מכבי',['יהודה המכבי','יהודה מכבי']),('בן גוריון',['שדרות בן גוריון']),('ויצמן',['ויצמן']),('שינקין',['שינקין'])]
allp=defaultdict(list)
for k in 'MABC':
    for n,c in out[k]: allp[n].append(c)
labels=[];seen=set()
for disp,alts in WANT:
    if disp in seen: continue
    cand=[c for a in alts for c in allp.get(a,[])]
    if not cand: print('missing',disp); continue
    best=max(cand,key=lambda c:LS(c).length)
    labels.append([disp,best]); seen.add(disp)
out['L']=labels
s=json.dumps(out,ensure_ascii=False,separators=(',',':'))
open('streets.json','w').write(s); print(len(labels),len(s)//1024,'KB')
