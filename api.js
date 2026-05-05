// 1. Crear mapa
const map = L.map('map').setView([-34.6, -58.4], 10);

// 2. Tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// 3. Función async
async function cargarHospitales() {
  try {
    const res = await fetch('/hospitales.json');

    if (!res.ok) {
      throw new Error('Error al cargar el JSON');
    }

    const data = await res.json();

    console.log('Cantidad de registros:', data.length);

    // 4. Crear cluster group
    const markers = L.markerClusterGroup();

    // 5. Agregar markers al cluster
    data.forEach(h => {
      if (h.latitud && h.longitud) {
        const marker = L.marker([h.latitud, h.longitud])
          .bindPopup(`
            <b>${h.establecimiento_nombre}</b><br/>
            ${h.localidad_nombre || ''} - ${h.provincia_nombre || ''}
          `);

        markers.addLayer(marker);
      }
    });

    // 6. Agregar cluster al mapa
    map.addLayer(markers);

  } catch (error) {
    console.error('Error:', error);
  }
}

// 7. Ejecutar
cargarHospitales();