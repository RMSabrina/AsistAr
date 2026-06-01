const map = L.map('map').setView([-34.6, -58.4], 10);

// // 2. Tiles
// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//   attribution: '&copy; OpenStreetMap'
// }).addTo(map);

// // 3. Función async
// async function cargarHospitales() {
//   try {
//     const res = await fetch('./hospitales.json');

//     if (!res.ok) {
//       throw new Error('Error al cargar el JSON');
//     }

//     const data = await res.json();

//     // console.log('Cantidad de registros:', data.length);

//     // 4. Crear cluster group
//     const markers = L.markerClusterGroup();

//     // 5. Agregar markers al cluster
//     data.forEach(h => {
//       if (h.latitud && h.longitud) {
//         const marker = L.marker([h.latitud, h.longitud])
//           .bindPopup(`
//             <b>${h.establecimiento_nombre}</b><br/>
//             ${h.localidad_nombre || ''} - ${h.provincia_nombre || ''}
//           `);

//         markers.addLayer(marker);
//       }
//     });

//     // 6. Agregar cluster al mapa
//     map.addLayer(markers);

//   } catch (error) {
//     console.error('Error:', error);
//   }
// }

// // 7. Ejecutar
// cargarHospitales();

//Consumo de API

// TILES
L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution:
      "&copy; OpenStreetMap"
  }
).addTo(map);

// ========================
// CAPA ACTUAL
// ========================

let capaActual = null;

// ========================
// SERVICIO ACTIVO
// ========================

let servicioActual = null;

// ========================
// EMOJIS
// ========================

const emojis = {

  hospital: "🏥",

  pharmacy: "💊",

  clinic: "🩺",

  dentist: "🦷",

  veterinary: "🐶"

};

// ========================
// BOTONES
// ========================

const botones =
  document.querySelectorAll(
    ".boton-servicio"
  );

// ========================
// CARGAR
// ========================

async function cargar(tipo) {

  try {

    servicioActual = tipo;

    actualizarBotones();

    // PROVINCIA
    const provincia =
      document
      .getElementById("provincia")
      .value;

    // BORRAR ANTERIOR
    if (capaActual) {

      map.removeLayer(
        capaActual
      );

    }

    capaActual = L.featureGroup();

    // ========================
    // QUERY OVERPASS
    // ========================

    const query = `
[out:json][timeout:25];

area["boundary"="administrative"]
     ["name"="${provincia}"]
     ->.searchArea;

(
  node["amenity"="${tipo}"](area.searchArea);
);

out body;
`;

    console.log(query);

    // ========================
    // FETCH
    // ========================

    const res = await fetch(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        body: query
      }
    );

    const data =
      await res.json();

    console.log(data);

    // ========================
    // RECORRER
    // ========================

data.elements.forEach(lugar => {

  // SIN COORDENADAS
  if (!lugar.lat || !lugar.lon)
    return;

  // SIN NOMBRE
  if (!lugar.tags?.name)
    return;

  // FILTRO ARGENTINA
  if (
    lugar.tags["addr:country"] &&
    lugar.tags["addr:country"] !== "AR"
  ) {
    return;
  }

  // FILTRO PROVINCIA
  const provinciaLugar =
    (
      lugar.tags["addr:state"] ||
      lugar.tags["addr:province"] ||
      ""
    ).toLowerCase();

  const provinciaSeleccionada =
    provincia.toLowerCase();

  if (
    provinciaLugar &&
    !provinciaLugar.includes(
      provinciaSeleccionada
    )
  ) {
    return;
  }

      // NOMBRE
      const nombre =
        lugar.tags?.name ||
        "Sin nombre";

      // DIRECCION
      const calle =
        lugar.tags?.["addr:street"] ||
        "";

      // ICONO
      const emoji =
        emojis[tipo] || "📍";

      // MARKER
const icono = L.divIcon({

  html: `
    <div style="
      font-size: 28px;
    ">
      ${emoji}
    </div>
  `,

  className: "",

  iconSize: [30, 30],

  iconAnchor: [15, 30]

});

const marker =
  L.marker(
    [lugar.lat, lugar.lon],
    {
      icon: icono
    }
  )
  .bindPopup(`

    <div style="
      font-size:22px
    ">
      ${emoji}
    </div>

    <b>${nombre}</b>

    <br><br>

    ${tipo}

    <br>

    ${calle}

  `);

      capaActual.addLayer(
        marker
      );

    });

    // ========================
    // MAPA
    // ========================

    capaActual.addTo(map);

    // ========================
    // ZOOM
    // ========================

    if (
      capaActual
      .getLayers()
      .length > 0
    ) {

      map.fitBounds(
        capaActual.getBounds()
      );

    }

  } catch(error) {

    console.error(error);

  }

}

// ========================
// BOTON ACTIVO
// ========================

function actualizarBotones() {

  botones.forEach(
    boton => {

    boton.classList.remove(
      "activo"
    );

    if (
      boton.dataset.tipo ===
      servicioActual
    ) {

      boton.classList.add(
        "activo"
      );

    }

  });

}

// ========================
// CAMBIO PROVINCIA
// ========================

document
  .getElementById("provincia")
  .addEventListener(
    "change",
    () => {

      // SI YA HABIA
      // UN SERVICIO
      if (servicioActual) {

        cargar(
          servicioActual
        );

      }

    }
  );


  const lugaresUnicos = [

  ...new Map(

    response.data.map(
      lugar => [

        (
          lugar.title +
          lugar.address
        ).toLowerCase(),

        lugar

      ]
    )

  ).values()

];