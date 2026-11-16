# Extrae las rutas de bus de Barranquilla desde OpenStreetMap (Overpass API) y genera ../rutas.js
# Uso: python extraer_osm.py [osm.json]  (sin argumento descarga de internet; solo se usa para regenerar los datos)
import json, math, sys, urllib.request, urllib.parse
Q = '[out:json][timeout:200];relation["route"="bus"](10.85,-74.92,11.08,-74.70);out geom;'
req = urllib.request.Request('https://overpass-api.de/api/interpreter', urllib.parse.urlencode({'data': Q}).encode(), {'User-Agent': 'discretas'})
data = json.load(open(sys.argv[1], encoding='utf8') if len(sys.argv) > 1 else urllib.request.urlopen(req))
d = lambda a, b: math.hypot((a[0]-b[0])*111320, (a[1]-b[1])*109300)  # metros (aprox. a 11°N)
def seg(p, a, b):  # distancia (m) del punto p al segmento ab
    L = d(a, b) ** 2
    t = 0 if L == 0 else max(0, min(1, ((p[0]-a[0])*(b[0]-a[0])*111320**2 + (p[1]-a[1])*(b[1]-a[1])*109300**2) / L))
    return d(p, (a[0] + t*(b[0]-a[0]), a[1] + t*(b[1]-a[1])))
def dp(pts, tol=12):  # simplificacion de Ramer-Douglas-Peucker: quita puntos a menos de tol metros de la recta
    if len(pts) < 3: return pts
    i = max(range(1, len(pts) - 1), key=lambda i: seg(pts[i], pts[0], pts[-1]))
    return dp(pts[:i+1], tol)[:-1] + dp(pts[i:], tol) if seg(pts[i], pts[0], pts[-1]) > tol else [pts[0], pts[-1]]
sys.setrecursionlimit(10000)
rutas = []
for r in data['elements']:
    ways = [[(p['lat'], p['lon']) for p in m['geometry']] for m in r['members'] if m['type'] == 'way' and m['role'] in ('', 'forward', 'backward') and 'geometry' in m]
    if len(ways) < 2: continue
    if min(d(ways[0][0], ways[1][0]), d(ways[0][0], ways[1][-1])) < min(d(ways[0][-1], ways[1][0]), d(ways[0][-1], ways[1][-1])): ways[0].reverse()
    tramos = [list(ways[0])]
    for w in ways[1:]:  # encadena tramos; si hay un hueco > 800 m (relacion incompleta en OSM) empieza otro tramo
        w = w if d(tramos[-1][-1], w[0]) <= d(tramos[-1][-1], w[-1]) else w[::-1]
        if d(tramos[-1][-1], w[0]) > 800: tramos.append(list(w))
        else: tramos[-1] += w
    linea = max(tramos, key=lambda t: sum(d(a, b) for a, b in zip(t, t[1:])))  # se queda con el tramo mas largo
    s = dp(linea)  # conserva las esquinas para que la linea siga la calle
    pts = [s[0]]
    for a, b in zip(s, s[1:]):  # y agrega puntos en tramos rectos largos: al menos un paradero cada 400 m
        k = math.ceil(d(a, b) / 400)
        pts += [(a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k) for j in range(1, k + 1)]
    t = r['tags']; ref = t.get('ref') or t.get('name', '?').split(':')[0].split()[-1]
    if sum(d(a, b) for a, b in zip(pts, pts[1:])) < 1000: continue
    rutas.append([ref, t.get('name', ref), [[round(p[0], 5), round(p[1], 5)] for p in pts]])
with open('../rutas.js', 'w', encoding='utf8') as f:
    f.write('// Rutas reales de bus de Barranquilla (OpenStreetMap, ODbL). Generado por datos/extraer_osm.py\n// [codigo, nombre, [[lat,lng] puntos de la ruta: esquinas + al menos uno cada 400 m]]\nconst RUTAS = [\n')
    f.write(',\n'.join(json.dumps(x, ensure_ascii=False, separators=(',', ':')) for x in rutas) + '];\n')
print(len(rutas), 'rutas,', sum(len(x[2]) for x in rutas), 'paraderos')
