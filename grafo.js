// Modelo matematico: grafo ponderado de la red de buses.
// Vertices = paraderos de cada ruta. Aristas = tramo de bus (paraderos consecutivos) o caminata de transbordo.
const VBUS = 333, VPIE = 75, ESPERA = 5, TRANSBORDO = 300, ACCESO = 600; // m/min (20 km/h), m/min (4,5 km/h), min, m, m

// Distancia en metros entre dos puntos [lat, lng] (formula de Haversine)
function dist(a, b) {
  const r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

// Lista de adyacencia: adj[k] = [[vecino, peso en minutos, tipo]]. Vertice k = {r: ruta, i: n. de paradero, p: [lat, lng]}
function construirGrafo(rutas) {
  const V = [], adj = [];
  rutas.forEach((ruta, r) => ruta[2].forEach((p, i) => { V.push({ r, i, p }); adj.push([]); }));
  const unir = (a, b, w, tipo) => { adj[a].push([b, w, tipo]); adj[b].push([a, w, tipo]); };
  for (let a = 0; a < V.length; a++) for (let b = a + 1; b < V.length; b++) {
    const d = dist(V[a].p, V[b].p);
    if (V[a].r === V[b].r) { if (b === a + 1) unir(a, b, d / VBUS, 'bus'); }
    else if (d <= TRANSBORDO) unir(a, b, d / VPIE + ESPERA, 'pie'); // caminar + esperar el otro bus
  }
  return { V, adj };
}

// Dijkstra O(V^2) desde el punto origen hasta el punto destino. Devuelve tiempo total (min) y camino de vertices
function dijkstra(G, origen, destino) {
  const n = G.V.length, D = Array(n).fill(Infinity), prev = Array(n).fill(-1), listo = Array(n).fill(false);
  G.V.forEach((v, k) => { const d = dist(origen, v.p); if (d <= ACCESO) D[k] = d / VPIE + ESPERA; }); // caminar al paradero
  for (let it = 0; it < n; it++) {
    let u = -1;
    for (let k = 0; k < n; k++) if (!listo[k] && D[k] < Infinity && (u < 0 || D[k] < D[u])) u = k;
    if (u < 0) break;
    listo[u] = true;
    for (const [v, w] of G.adj[u]) if (D[u] + w < D[v]) { D[v] = D[u] + w; prev[v] = u; } // relajacion
  }
  let mejor = { t: dist(origen, destino) / VPIE, fin: -1 }; // alternativa: irse caminando
  G.V.forEach((v, k) => { const d = dist(v.p, destino); if (d <= ACCESO && D[k] + d / VPIE < mejor.t) mejor = { t: D[k] + d / VPIE, fin: k }; });
  const camino = [];
  for (let k = mejor.fin; k >= 0; k = prev[k]) camino.unshift(k);
  return { t: mejor.t, camino };
}

// Agrupa el camino en tramos por ruta: [{r, desde, hasta}] (indices de paradero dentro de la ruta)
function tramos(G, camino) {
  const T = [];
  for (const k of camino) { const v = G.V[k], u = T[T.length - 1]; if (u && u.r === v.r) u.hasta = v.i; else T.push({ r: v.r, desde: v.i, hasta: v.i }); }
  return T.filter(t => t.desde !== t.hasta);
}

// Simulacion: cada bus va y vuelve por su ruta; bus.u = metros recorridos en el ciclo [0, 2L), bus.v = m/min
const acumulado = pts => pts.reduce((c, p, i) => (c.push(i ? c[i - 1] + dist(pts[i - 1], p) : 0), c), []);
function eta(bus, c, i, sentido = 0) { // minutos hasta el paradero i. sentido: 1 = ida, -1 = vuelta, 0 = cualquiera
  const L2 = 2 * c[c.length - 1], obj = sentido > 0 ? [c[i]] : sentido < 0 ? [L2 - c[i]] : [c[i], L2 - c[i]];
  return Math.min(...obj.map(x => ((x - bus.u) % L2 + L2) % L2)) / bus.v;
}

if (typeof module !== 'undefined') module.exports = { dist, construirGrafo, dijkstra, tramos, acumulado, eta, VBUS, VPIE, ESPERA };
