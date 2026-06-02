const map = L.map('map').setView([-34.6, -58.4], 10);

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

const limitesProvincias = {

  "Buenos Aires": {
    minLat: -41.0,
    maxLat: -33.0,
    minLon: -64.5,
    maxLon: -56.0
  },

  "Catamarca": {
    minLat: -30.5,
    maxLat: -25.0,
    minLon: -69.5,
    maxLon: -64.0
  },

  "Chaco": {
    minLat: -28.5,
    maxLat: -24.0,
    minLon: -63.5,
    maxLon: -58.0
  },

  "Chubut": {
    minLat: -47.5,
    maxLat: -41.0,
    minLon: -72.0,
    maxLon: -64.0
  },

  "Córdoba": {
    minLat: -35.5,
    maxLat: -29.0,
    minLon: -65.5,
    maxLon: -61.5
  },

  "Corrientes": {
    minLat: -31.0,
    maxLat: -27.0,
    minLon: -59.5,
    maxLon: -55.5
  },

  "Entre Ríos": {
    minLat: -34.5,
    maxLat: -29.0,
    minLon: -60.5,
    maxLon: -57.5
  },

  "Formosa": {
    minLat: -27.5,
    maxLat: -22.0,
    minLon: -62.5,
    maxLon: -57.5
  },

  "Jujuy": {
    minLat: -24.5,
    maxLat: -21.5,
    minLon: -67.5,
    maxLon: -63.5
  },

  "La Pampa": {
    minLat: -39.5,
    maxLat: -34.0,
    minLon: -68.5,
    maxLon: -63.0
  },

  "La Rioja": {
    minLat: -31.5,
    maxLat: -27.0,
    minLon: -69.5,
    maxLon: -65.0
  },

  "Mendoza": {
    minLat: -37.5,
    maxLat: -31.0,
    minLon: -70.5,
    maxLon: -66.0
  },

  "Misiones": {
    minLat: -28.5,
    maxLat: -25.0,
    minLon: -56.5,
    maxLon: -53.5
  },

  "Neuquén": {
    minLat: -41.5,
    maxLat: -35.0,
    minLon: -72.0,
    maxLon: -68.0
  },

  "Río Negro": {
    minLat: -42.5,
    maxLat: -37.0,
    minLon: -72.0,
    maxLon: -62.0
  },

  "Salta": {
    minLat: -27.5,
    maxLat: -22.0,
    minLon: -68.5,
    maxLon: -62.0
  },

  "San Juan": {
    minLat: -32.5,
    maxLat: -28.0,
    minLon: -70.0,
    maxLon: -67.0
  },

  "San Luis": {
    minLat: -37.5,
    maxLat: -31.5,
    minLon: -67.5,
    maxLon: -64.5
  },

  "Santa Cruz": {
    minLat: -53.0,
    maxLat: -45.0,
    minLon: -73.0,
    maxLon: -65.0
  },

  "Santa Fe": {
    minLat: -34.5,
    maxLat: -28.0,
    minLon: -63.5,
    maxLon: -59.0
  },

  "Santiago del Estero": {
    minLat: -30.5,
    maxLat: -25.0,
    minLon: -65.5,
    maxLon: -61.0
  },

  "Tierra del Fuego": {
    minLat: -55.5,
    maxLat: -52.0,
    minLon: -69.5,
    maxLon: -64.0
  },

  "Tucumán": {
    minLat: -28.5,
    maxLat: -25.5,
    minLon: -66.5,
    maxLon: -64.0
  }

};

const limites =
  limitesProvincias[provincia];

if (limites) {

  if (
    lugar.lat < limites.minLat ||
    lugar.lat > limites.maxLat ||
    lugar.lon < limites.minLon ||
    lugar.lon > limites.maxLon
  ) {
    return;
  }

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