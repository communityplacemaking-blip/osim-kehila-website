# הופך דמות מאוירת לשרבוט עפרון בצבעי צבעי-עפרון. שימוש: python3 tools/sketch_characters.py cafe-couple stroller-couple
import numpy as np,sys
from PIL import Image,ImageFilter
from scipy import ndimage
rng=np.random.default_rng(7)
def sketch(src,dst):
    im=Image.open(src).convert('RGBA'); W,H=im.size
    a=np.asarray(im).astype(float); al=a[...,3]/255
    rgbw=a[...,:3]*al[...,None]+255*(1-al[...,None])
    base=Image.fromarray(rgbw.astype(np.uint8))
    sm=base.resize((W//2,H//2),Image.LANCZOS).filter(ImageFilter.MedianFilter(3)).quantize(12,method=Image.Quantize.MEDIANCUT).convert('RGB').resize((W,H),Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.5))
    s=np.asarray(sm).astype(float)
    g=s@[.299,.587,.114]
    gm=np.hypot(ndimage.sobel(g,0),ndimage.sobel(g,1))
    # wobbly pencil contour
    dx=ndimage.gaussian_filter(rng.standard_normal((H,W)),6)*9; dy=ndimage.gaussian_filter(rng.standard_normal((H,W)),8)*9
    yy,xx=np.mgrid[0:H,0:W]
    gm=ndimage.map_coordinates(gm,[yy+dy,xx+dx],order=1)
    ln=np.clip((gm-60)/140,0,1)
    g0=rgbw@[.299,.587,.114]; inv=ndimage.gaussian_filter(255-g0,4); dod=np.clip(g0*255/np.maximum(1,255-inv),0,255)
    ln=np.maximum(ln,np.clip((200-dod)/120,0,1)*0.8)
    grain=ndimage.uniform_filter1d(rng.random((H,W)),5,axis=0)
    ln=ln*(0.55+0.6*grain)
    # crayon fill: pastel, with diagonal strokes that leave paper gaps
    col=s*0.82+255*0.18
    st=ndimage.convolve(ndimage.gaussian_filter(rng.random((H,W)),0.7),np.eye(13)/13)
    st=(st-st.min())/(st.max()-st.min())
    gap=np.clip((st-0.22)*2.4,0,1)            # 0 = paper shows
    col=col*gap[...,None]+255*(1-gap[...,None])*0.97+0*col
    col=col*(1-0.12*(1-st))[...,None]
    graphite=np.array([70,72,78])
    out=col*(1-ln[...,None])+graphite*ln[...,None]
    out=ndimage.gaussian_filter(out,(0.7,0.7,0))
    al2=ndimage.gaussian_filter(al,3); al2=np.clip((al2-0.3+0.25*(st-0.5))*2.5,0,1)
    Image.fromarray(np.dstack([np.clip(out,0,255),al2*255]).astype(np.uint8),'RGBA').save(dst,optimize=True)
for n in sys.argv[1:]:
    sketch('maps/eco-city-demo/characters/'+n+'.png','maps/eco-city-demo/characters/'+n+'-sketch.png')
