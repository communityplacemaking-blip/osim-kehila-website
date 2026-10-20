import fsspec,pyarrow.parquet as pq,re,subprocess,sys,json
from concurrent.futures import ThreadPoolExecutor
B="https://overturemaps-us-west-2.s3.us-west-2.amazonaws.com/"
xml=subprocess.run(['curl','-s',B+"?list-type=2&prefix=release/2026-09-23.0/theme=transportation/type=segment/"],capture_output=True,text=True).stdout
keys=re.findall(r"<Key>([^<]*)</Key>",xml)
fs=fsspec.filesystem('http',client_kwargs={'trust_env':True})
X0,X1,Y0,Y1=34.74,34.86,32.04,32.125
def scan(k):
    f=pq.ParquetFile(fs.open(B+k,block_size=1<<20))
    md=f.metadata; names=[md.schema.column(i).path for i in range(md.num_columns)]
    ix={n:names.index(n) for n in ['bbox.xmin','bbox.xmax','bbox.ymin','bbox.ymax']}
    hits=[]
    for r in range(md.num_row_groups):
        g=md.row_group(r); st={n:g.column(i).statistics for n,i in ix.items()}
        if st['bbox.xmin'].min<=X1 and st['bbox.xmax'].max>=X0 and st['bbox.ymin'].min<=Y1 and st['bbox.ymax'].max>=Y0: hits.append(r)
    return k,hits
with ThreadPoolExecutor(16) as ex:
    res=list(ex.map(scan,keys))
res=[r for r in res if r[1]]
print(len(keys),res)
json.dump(res,open('hits.json','w'))
