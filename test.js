// Pruebas con resultado conocido. Ejecutar: node test.js
const assert = require('assert'), g = require('./grafo.js');
const cerca = (a, b, tol = 0.01) => assert(Math.abs(a - b) < tol, `${a} != ${b}`);

// 1) Haversine: 1 grado de latitud mide 6371000 * pi / 180 = 111194.93 m
cerca(g.dist([0, 0], [1, 0]), 111194.93);

// 2) Red de juguete: ruta A va de (0,0) a (0,0.02) y ruta B de (0,0.02) a (0.02,0.02). Cada tramo de 0.01 grados = 1111.95 m
// Viaje de (0,0) a (0.02,0.02): esperar A (5) + 2223.9/333 (6.678) + transbordo (5) + 2223.9/333 (6.678) = 23.357 min
const G = g.construirGrafo([['A', '', [[0, 0], [0, 0.01], [0, 0.02]]], ['B', '', [[0, 0.02], [0.01, 0.02], [0.02, 0.02]]]]);
const { t, camino } = g.dijkstra(G, [0, 0], [0.02, 0.02]);
cerca(t, 5 + 2223.9 / 333 + 5 + 2223.9 / 333);
assert.deepStrictEqual(g.tramos(G, camino), [{ r: 0, desde: 0, hasta: 2 }, { r: 1, desde: 0, hasta: 2 }]);

// 3) Si el destino esta a 100 m, caminar (100/75 = 1.33 min) es mejor que tomar bus: camino vacio
cerca(g.dijkstra(G, [0, 0], [0, 0.0009]).t, g.dist([0, 0], [0, 0.0009]) / 75);

// 4) ETA: ruta de 1000 m, bus en el metro 200 a 100 m/min. Paradero en el metro 600
const c = [0, 600, 1000], bus = { u: 200, v: 100 };
assert.strictEqual(g.eta(bus, c, 1, 1), 4);   // de ida: (600 - 200) / 100
assert.strictEqual(g.eta(bus, c, 1, -1), 12); // de vuelta: (2000 - 600 - 200) / 100
assert.strictEqual(g.eta(bus, c, 1), 4);      // el que llegue primero
console.log('Todas las pruebas pasaron');
