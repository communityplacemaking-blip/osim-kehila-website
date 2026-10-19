# בונה את geo.json למפת אקו סיטי: גבולות ערים, "פאזל" שכונות, הים והירקון.
# הרצה: python3 build-geo.py <israel-municipalities-polygons> <osim-kehila>
#   israel-municipalities-polygons: https://github.com/idoivri/israel-municipalities-polygons (גבולות ערים)
#   osim-kehila: נקודות השכונות של גבעתיים ורמת גן מ-OpenStreetMap (app/public/*/geo.json)
# שכונות תל אביב: מרכזים משוערים (TA_HOODS למטה). כל שכונה היא החלק של העיר שקרוב למרכז שלה
# יותר מלכל מרכז אחר, כמו "פאזל השכונות" של רמת גן. הגבולות סכמטיים בכוונה, לא מדויקים.
import json, sys
from shapely.geometry import shape, mapping, Point, MultiPoint, LineString, Polygon, box
from shapely.ops import unary_union
import shapely

MUN, OK = sys.argv[1], sys.argv[2]
TOL = 0.00006

TA_HOODS = [
    ('תל ברוך', 32.1255, 34.7915), ('רמת אביב', 32.1130, 34.7975), ('רמת אביב ג׳', 32.1190, 34.8050),
    ('אפקה', 32.1150, 34.8150), ('המשתלה', 32.1255, 34.8150), ('צהלה', 32.1180, 34.8270),
    ('נווה שרת', 32.1235, 34.8390), ('רמת החייל', 32.1095, 34.8385), ('שיכון דן', 32.1135, 34.8230),
    ('הדר יוסף', 32.1040, 34.8265), ('פארק הירקון', 32.1020, 34.8030), ('בבלי', 32.0955, 34.8010),
    ('הצפון הישן', 32.0880, 34.7770), ('הצפון החדש', 32.0905, 34.7870), ('כיכר המדינה', 32.0868, 34.7920),
    ('הצפון החדש – דרום', 32.0820, 34.7845), ('לב העיר', 32.0715, 34.7740), ('כרם התימנים', 32.0695, 34.7665),
    ('נווה צדק', 32.0610, 34.7665), ('מונטיפיורי', 32.0670, 34.7825), ('הקריה ושרונה', 32.0730, 34.7890),
    ('נחלת יצחק', 32.0740, 34.8010), ('ביצרון ורמת ישראל', 32.0650, 34.8040), ('יד אליהו', 32.0560, 34.7990),
    ('התקווה', 32.0530, 34.7930), ('נווה שאנן', 32.0570, 34.7780), ('פלורנטין', 32.0560, 34.7690),
    ('שפירא', 32.0480, 34.7760), ('קרית שלום', 32.0400, 34.7700), ('יפו העתיקה', 32.0525, 34.7525),
    ('עג׳מי', 32.0450, 34.7520), ('יפו ד׳', 32.0390, 34.7620), ('נווה עופר', 32.0360, 34.7800),
    ('כפר שלם', 32.0470, 34.8030),
]
# הירקון, קו כללי ממזרח למערב (lng, lat)
YARKON = [(34.8420, 32.1060), (34.8280, 32.1035), (34.8150, 32.1040), (34.8060, 32.1018), (34.7980, 32.1005),
          (34.7900, 32.1010), (34.7830, 32.1015), (34.7760, 32.1010), (34.7735, 32.1003)]


def city(path):
    d = json.load(open(path))
    return unary_union([shape(f['geometry']) for f in d['features']]).buffer(0)


def puzzle(poly, centers):
    pts = MultiPoint([Point(lng, lat) for _, lat, lng in centers])
    cells = shapely.voronoi_polygons(pts, extend_to=poly.envelope.buffer(0.05))
    out = []
    for name, lat, lng in centers:
        p = Point(lng, lat)
        cell = next(c for c in cells.geoms if c.contains(p))
        piece = cell.intersection(poly)
        if not piece.is_empty:
            out.append((name, lat, lng, piece))
    return out


def ok_centers(path):
    d = json.load(open(path))
    return [(f['properties']['name'], *f['properties']['center']) for f in d['features']
            if f['properties'].get('kind') in ('neighborhood', 'neighborhood-label') and f['properties'].get('center')]


ta = city(f'{MUN}/tel_aviv_yafo/tel_aviv_yafo.geojson')
giv = city(f'{MUN}/givatayim/givatayim.geojson')
rg = city(f'{MUN}/ramat_gan/ramat_gan.geojson')

feats = []
def add(geom, **props):
    feats.append({'type': 'Feature', 'properties': props,
                  'geometry': mapping(geom.simplify(TOL, preserve_topology=True))})

# הים: מערבית לקו החוף של תל אביב (הקצה המערבי של העיר בכל קו רוחב)
minx, miny, maxx, maxy = ta.bounds
coast, lat = [], miny
while lat <= maxy:
    seg = ta.intersection(LineString([(minx - 0.01, lat), (maxx, lat)]))
    if not seg.is_empty:
        coast.append((seg.bounds[0], lat))
    lat += 0.0008
south, north = coast[0], coast[-1]
sea = Polygon([(minx - 0.06, miny - 0.03), (south[0] - 0.004, miny - 0.03), *coast,
               (north[0] + 0.01, maxy + 0.03), (minx - 0.06, maxy + 0.03)]).buffer(0).difference(ta)
add(sea, kind='sea')

for name, poly in (('תל אביב-יפו', ta), ('גבעתיים', giv), ('רמת גן', rg)):
    add(poly, kind='city', name=name, context=(name == 'רמת גן'))

for c, centers in ((ta, TA_HOODS), (giv, ok_centers(f'{OK}/app/public/givatayim/geo.json'))):
    for name, lat, lng, piece in puzzle(c, centers):
        add(piece, kind='hood', name=name, park=(name == 'פארק הירקון'), center=[lat, lng])

add(LineString(YARKON).intersection(ta.buffer(0.002)), kind='river', name='הירקון')

json.dump({'type': 'FeatureCollection', 'features': feats}, open('geo.json', 'w'), ensure_ascii=False,
          separators=(',', ':'))
print(len(feats), 'features')
