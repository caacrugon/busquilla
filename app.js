// Interfaz: mapa, buses simulados en vivo, tiempos de llegada y mejor viaje (Dijkstra)
const $ = id => document.getElementById(id), al = a => a[Math.floor(Math.random() * a.length)];
const mapa = L.map('mapa').setView([10.97, -74.80], 13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(mapa);
const G = construirGrafo(RUTAS), CUM = RUTAS.map(r => acumulado(r[2])), color = r => `hsl(${r * 137.5 % 360},75%,42%)`;
const NOMBRES = ['Carlos', 'Jose', 'Luis', 'Andres', 'Jorge', 'Miguel', 'Rafael', 'Yesid', 'Wilmer', 'Alberto', 'Diana', 'Rosa'];
const APELLIDOS = ['Perez', 'Rodriguez', 'Gomez', 'Barrios', 'De la Hoz', 'Charris', 'Pacheco', 'Ospino', 'Polo', 'Orozco'];

// Genera los buses y sus conductores: uno cada ~4 km de recorrido (minimo 2 por ruta)
const buses = [];
RUTAS.forEach(([cod, nombre, pts], r) => {
  const largo = CUM[r][CUM[r].length - 1], n = Math.max(2, Math.round(largo / 4000));
  L.polyline(pts, { color: color(r), weight: 3, opacity: 0.5 }).bindTooltip(`${cod}: ${nombre}`, { sticky: true }).addTo(mapa);
  for (let k = 0; k < n; k++) {
    const b = { r, u: 2 * largo * k / n, v: (18 + Math.random() * 8) * 1000 / 60, conductor: al(NOMBRES) + ' ' + al(APELLIDOS), placa: 'T' + al([...'KSMWX']) + al([...'ABCDE']) + (100 + Math.random() * 900 | 0) };
    b.m = L.circleMarker([0, 0], { radius: 6, color: '#000', weight: 1, fillColor: color(r), fillOpacity: 1 }).bindTooltip(`Ruta ${cod} | ${b.conductor} | ${b.placa}`).addTo(mapa);
    buses.push(b);
  }
});

// Posicion [lat, lng] del bus interpolando entre paraderos
function posicion(b) {
  const c = CUM[b.r], pts = RUTAS[b.r][2], L2 = c[c.length - 1], s = b.u < L2 ? b.u : 2 * L2 - b.u;
  let i = 1; while (i < c.length - 1 && c[i] < s) i++;
  const f = (s - c[i - 1]) / (c[i] - c[i - 1] || 1), a = pts[i - 1], z = pts[i];
  return [a[0] + (z[0] - a[0]) * f, a[1] + (z[1] - a[1]) * f];
}

// Rutas con paradero a menos de ACCESO metros de ti y cuanto tarda el proximo bus
function cercanos() {
  const filas = [];
  RUTAS.forEach(([cod, nombre, pts], r) => {
    let i = -1, dm = ACCESO;
    pts.forEach((p, k) => { const d = dist(origen, p); if (d < dm) { dm = d; i = k; } });
    if (i < 0) return;
    const b = buses.filter(b => b.r === r).reduce((x, y) => eta(x, CUM[r], i) < eta(y, CUM[r], i) ? x : y), t = eta(b, CUM[r], i);
    filas.push([t, `<li><b style="color:${color(r)}">${cod}</b> ${nombre}<br>Paradero a ${dm | 0} m &middot; llega en <b>${Math.ceil(t)} min</b> (${b.conductor}, ${b.placa})</li>`]);
  });
  $('cerca').innerHTML = filas.length ? filas.sort((a, b) => a[0] - b[0]).map(f => f[1]).join('') : 'Ninguna ruta a menos de 600 m';
}

// Mejor viaje de origen a destino con Dijkstra, dibujado en el mapa
function viaje() {
  L.marker(destino).bindTooltip('Destino', { permanent: true }).addTo(capa);
  const { t, camino } = dijkstra(G, origen, destino), T = tramos(G, camino);
  if (!T.length) return $('viaje').innerHTML = `Te conviene caminar: ${Math.ceil(t)} min`;
  L.polyline([origen, ...camino.map(k => G.V[k].p), destino], { color: '#000', weight: 6, dashArray: '8 8' }).addTo(capa);
  const ini = G.V[camino[0]].p, fin = G.V[camino[camino.length - 1]].p;
  $('viaje').innerHTML = `<b>Tiempo estimado: ${Math.ceil(t)} min</b><ol><li>Camina ${dist(origen, ini) | 0} m al paradero</li>` + T.map((x, j) => {
    const s = x.hasta > x.desde ? 1 : -1, prox = Math.min(...buses.filter(b => b.r === x.r).map(b => eta(b, CUM[x.r], x.desde, s)));
    return `<li>${j ? 'Transborda a' : 'Toma'} la <b style="color:${color(x.r)}">${RUTAS[x.r][0]}</b> (${RUTAS[x.r][1]}), ${(Math.abs(CUM[x.r][x.hasta] - CUM[x.r][x.desde]) / 1000).toFixed(1)} km` + (j ? '' : `. Proximo bus en ${Math.ceil(prox)} min`) + '</li>';
  }).join('') + `<li>Camina ${dist(fin, destino) | 0} m a tu destino</li></ol>`;
}

// Clic 1 = tu ubicacion, clic 2 = destino, clic 3 = reinicia
let origen = null, destino = null, ultimo = Date.now();
const capa = L.layerGroup().addTo(mapa);
mapa.on('click', e => {
  const p = [e.latlng.lat, e.latlng.lng];
  if (!origen || destino) { origen = p; destino = null; } else destino = p;
  capa.clearLayers();
  L.marker(origen).bindTooltip('Tu', { permanent: true }).addTo(capa);
  cercanos();
  destino ? viaje() : $('viaje').innerHTML = 'Haz clic en tu destino';
});

// Reloj de la simulacion: mueve los buses cada segundo (x velocidad elegida)
setInterval(() => {
  const ahora = Date.now(), dt = (ahora - ultimo) / 60000 * $('vel').value; ultimo = ahora;
  for (const b of buses) { b.u = (b.u + b.v * dt) % (2 * CUM[b.r][CUM[b.r].length - 1]); b.m.setLatLng(posicion(b)); }
  if (origen) cercanos();
}, 1000);
