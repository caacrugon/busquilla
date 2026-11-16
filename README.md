# BusQuilla: rutas de bus de Barranquilla en vivo (alpha)

Proyecto final de Matemáticas Discretas (MAT 4021). Mapa web de Barranquilla con 41 rutas reales de bus
(OpenStreetMap), buses simulados en movimiento con su conductor, tiempo de llegada del próximo bus a tu
zona y el mejor viaje entre dos puntos calculado con Dijkstra sobre un grafo ponderado.

## Cómo se usa
1. Abre `index.html` en un navegador de computador (Chrome, Edge o Firefox). Necesita internet para el mapa.
2. **Primer clic** en el mapa: tu ubicación. Se listan las rutas con paradero a menos de 600 m y en cuántos minutos llega el próximo bus.
3. **Segundo clic**: tu destino. Se muestra el mejor viaje (rutas, transbordos y tiempo total) y se dibuja en el mapa.
4. Otro clic reinicia. El selector "Velocidad de la simulación" acelera el movimiento de los buses (x1, x10, x60).

Entrada: dos puntos elegidos con el mouse. Salida: lista de buses cercanos con ETA y el viaje recomendado.

## Publicarlo (Coolify)
Es un sitio estático: no necesita base de datos ni servidor de aplicaciones. En Coolify: **+ New > Public Repository**,
pega la URL de este repositorio, **Build pack: Static**, **Base directory: `/`**, agrega el dominio y **Deploy**.

## Archivos
| Archivo | Contenido |
|---|---|
| `index.html` | Página y estilos (panel lateral + mapa Leaflet) |
| `grafo.js` | Modelo: Haversine, construcción del grafo, Dijkstra, tramos y ETA |
| `app.js` | Interfaz: dibuja rutas, simula buses y conductores, responde a los clics |
| `rutas.js` | Datos: 41 rutas, 1815 puntos de parada que siguen la calle (generado, no se edita a mano) |
| `test.js` | Pruebas con resultado conocido |
| `datos/extraer_osm.py` | Descarga las rutas de OpenStreetMap y regenera `rutas.js` |
| `docs/` | Documento en LaTeX (APA): `documento.tex` y `documento.pdf` |

## Pruebas
```
node test.js
```
Prueba Haversine (1° de latitud = 111 194,93 m), un viaje con transbordo en una red de juguete cuyo tiempo
(23,357 min) y tramos se calculan a mano, la opción de caminar y el cálculo de ETA de ida y de vuelta.

## Regenerar los datos
```
cd datos
python extraer_osm.py                       # descarga desde Overpass API
python extraer_osm.py osm_barranquilla.json # o usa la copia local incluida
```

## Documento
`docs/documento.tex` se compila en Overleaf (subir también `docs/img/`) o con `tectonic documento.tex`.
