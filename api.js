// 1. Inicialización del mapa
const map = L.map('map').setView([-34.6, -58.4], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// ---------------------------------------------------------
// CONFIGURACIÓN DE RUTAS
// ---------------------------------------------------------

// 2. Inicializamos el control de rutas (vacío al principio)
// ---  Creamos un icono verde para el punto de origen ---
const iconoOrigen = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// ---  Control de rutas ---
const controlRutas = L.Routing.control({
  waypoints: [], 
  routeWhileDragging: false, 
  showAlternatives: false,   
  addWaypoints: false,       
  fitSelectedRoutes: true,
  language: 'es',

  // CAMBIO DE MARCADOR:
  createMarker: function(i, waypoint, n) {
      // "i" es el número del punto. 0 es el primer clic (Origen), 1 es el destino.
      if (i === 0) {
          // Marcador verde para el inicio
          return L.marker(waypoint.latLng, { 
              icon: iconoOrigen,
              draggable: false // Evitamos que lo arrastren para ahorrar peticiones
          });
      } else {
          // Marcador azul por defecto para el destino
          return L.marker(waypoint.latLng, {
              draggable: false
          }); 
      }
  }
}).addTo(map);

// 3. Creamos una función que se encarga de manejar la lógica de los clics
function agregarPuntoRuta(latlng) {
  // Obtenemos los puntos actuales
  let puntosActuales = controlRutas.getWaypoints().filter(h => h.latLng !== null);

  // Si ya hay 2 puntos (origen y destino), borramos para empezar una nueva ruta
  if (puntosActuales.length >= 2) {
      puntosActuales = []; 
  }

  // Agregamos el nuevo punto y actualizamos la ruta
  puntosActuales.push(L.Routing.waypoint(latlng));
  controlRutas.setWaypoints(puntosActuales);
}

// 4. Escuchamos los clics en el mapa (en lugares vacíos)
map.on('click', function(e) {
  agregarPuntoRuta(e.latlng);
});

// ---------------------------------------------------------
// CARGA DE HOSPITALES 
// ---------------------------------------------------------

async function cargarHospitales() {
  try {
    const res = await fetch('/hospitales.json');

    if (!res.ok) {
      throw new Error('Error al cargar el JSON');
    }

    const data = await res.json();
    console.log('Cantidad de registros:', data.length);

    const markers = L.markerClusterGroup();

    data.forEach(h => {
      if (h.latitud && h.longitud) {
        const marker = L.marker([h.latitud, h.longitud])
          .bindPopup(`
            <b>${h.establecimiento_nombre}</b><br/>
            ${h.localidad_nombre || ''} - ${h.provincia_nombre || ''}
          `);

        // LO NUEVO: Si hacen clic en el hospital, también lo agrega a la ruta
        marker.on('click', function(e) {
            agregarPuntoRuta(e.latlng);
        });

        markers.addLayer(marker);
      }
    });

    map.addLayer(markers);

  } catch (error) {
    console.error('Error:', error);
  }
}

cargarHospitales();


// Detectamos cuando el usuario cambia la opción en el menú desplegable
document.getElementById('modo-transporte').addEventListener('change', function(e) {
    const nuevoTransporte = e.target.value;

    // Verificamos si ya hay puntos marcados en el mapa
    const puntosActuales = controlRutas.getWaypoints().filter(wp => wp.latLng !== null);
    
    // Si hay al menos 2 puntos, forzamos un recálculo de la ruta inmediatamente
    if (puntosActuales.length >= 2) {
        controlRutas.route();
    }
});