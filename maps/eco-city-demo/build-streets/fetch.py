import fsspec,pyarrow.parquet as pq,json,shapely.wkb as W,shapely
B="https://overturemaps-us-west-2.s3.us-west-2.amazonaws.com/"
fs=fsspec.filesystem('http',client_kwargs={'trust_env':True})
X0,X1,Y0,Y1=34.74,34.86,32.04,32.125
out=[]
for k,rgs in json.load(open('hits.json')):
    f=pq.ParquetFile(fs.open(B+k,block_size=4<<20))
    t=f.read_row_groups(rgs,columns=['subtype','class','names','geometry','bbox']).to_pylist()
    for r in t:
        b=r['bbox']
        if r['subtype']!='road' or b['xmax']<X0 or b['xmin']>X1 or b['ymax']<Y0 or b['ymin']>Y1: continue
        g=W.loads(r['geometry'])
        out.append({'c':r['class'],'n':(r['names'] or {}).get('primary'),'g':[[round(x,5),round(y,5)] for x,y in g.coords]})
json.dump(out,open('ta-roads.json','w'),ensure_ascii=False)
from collections import Counter; print(len(out),Counter(o['c'] for o in out).most_common())
