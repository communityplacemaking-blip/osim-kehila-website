"""מוריד את צילומי העוגנים של מפת אקו סיטי מוויקימדיה קומונס לתוך האתר, עם פרטי קרדיט.
רץ ב-GitHub Actions (.github/workflows/fetch-anchor-photos.yml), כי לסביבת העבודה של Claude אין גישה לוויקימדיה."""
import json,urllib.request,urllib.parse,re,html,os
D='maps/eco-city-demo/photos/'
UA={'User-Agent':'osim-kehila-map/1.0 (communityplacemaking@gmail.com)'}
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=60).read()
def strip(x):return html.unescape(re.sub(r'<[^>]+>','',x or '')).strip()
credits={}
for a in json.load(open(D+'commons.json')):
    for f in a['files']:
        q='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode({'action':'query','format':'json','prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':640,'titles':'File:'+f})
        p=list(json.loads(get(q))['query']['pages'].values())[0]
        if 'imageinfo' not in p: print('missing',f); continue
        ii=p['imageinfo'][0]; md=ii.get('extmetadata',{})
        open(D+a['slug']+'.jpg','wb').write(get(ii['thumburl']))
        credits[a['slug']]={'name':a['name'],'file':f,'page':ii['descriptionurl'],'author':strip(md.get('Artist',{}).get('value')),'license':strip(md.get('LicenseShortName',{}).get('value'))}
        print('ok',a['slug'],f,credits[a['slug']]['license']); break
json.dump(credits,open(D+'credits.json','w'),ensure_ascii=False,indent=1)
