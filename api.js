const map = L.map('map').setView([-34.6, -58.4], 10);

// TILES
L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution:
      "&copy; OpenStreetMap"
  }
).addTo(map);

// CAPA ACTUAL
let capaActual = null;

// SERVICIO ACTIVO
let servicioActual = null;

const emojis = {
  hospital:   "🏥",
  pharmacy:   "💊",
  clinic:     "🩺",
  dentist:    "🦷",
  veterinary: "🐶"
};

// BOTONES
const botones = document.querySelectorAll(".boton-servicio");

// CACHE Y DEBOUNCE
const cache = {};
let timeoutCarga = null;

// LÍMITES POR PROVINCIA
const limitesProvincias = {
  "Buenos Aires":        { minLat:-41.0, maxLat:-33.0, minLon:-64.5, maxLon:-56.0 },
  "Catamarca":           { minLat:-30.5, maxLat:-25.0, minLon:-69.5, maxLon:-64.0 },
  "Chaco":               { minLat:-28.5, maxLat:-24.0, minLon:-63.5, maxLon:-58.0 },
  "Chubut":              { minLat:-47.5, maxLat:-41.0, minLon:-72.0, maxLon:-64.0 },
  "Córdoba":             { minLat:-35.5, maxLat:-29.0, minLon:-65.5, maxLon:-61.5 },
  "Corrientes":          { minLat:-31.0, maxLat:-27.0, minLon:-59.5, maxLon:-55.5 },
  "Entre Ríos":          { minLat:-34.5, maxLat:-29.0, minLon:-60.5, maxLon:-57.5 },
  "Formosa":             { minLat:-27.5, maxLat:-22.0, minLon:-62.5, maxLon:-57.5 },
  "Jujuy":               { minLat:-24.5, maxLat:-21.5, minLon:-67.5, maxLon:-63.5 },
  "La Pampa":            { minLat:-39.5, maxLat:-34.0, minLon:-68.5, maxLon:-63.0 },
  "La Rioja":            { minLat:-31.5, maxLat:-27.0, minLon:-69.5, maxLon:-65.0 },
  "Mendoza":             { minLat:-37.5, maxLat:-31.0, minLon:-70.5, maxLon:-66.0 },
  "Misiones":            { minLat:-28.5, maxLat:-25.0, minLon:-56.5, maxLon:-53.5 },
  "Neuquén":             { minLat:-41.5, maxLat:-35.0, minLon:-72.0, maxLon:-68.0 },
  "Río Negro":           { minLat:-42.5, maxLat:-37.0, minLon:-72.0, maxLon:-62.0 },
  "Salta":               { minLat:-27.5, maxLat:-22.0, minLon:-68.5, maxLon:-62.0 },
  "San Juan":            { minLat:-32.5, maxLat:-28.0, minLon:-70.0, maxLon:-67.0 },
  "San Luis":            { minLat:-37.5, maxLat:-31.5, minLon:-67.5, maxLon:-64.5 },
  "Santa Cruz":          { minLat:-53.0, maxLat:-45.0, minLon:-73.0, maxLon:-65.0 },
  "Santa Fe":            { minLat:-34.5, maxLat:-28.0, minLon:-63.5, maxLon:-59.0 },
  "Santiago del Estero": { minLat:-30.5, maxLat:-25.0, minLon:-65.5, maxLon:-61.0 },
  "Tierra del Fuego":    { minLat:-55.5, maxLat:-52.0, minLon:-69.5, maxLon:-64.0 },
  "Tucumán":             { minLat:-28.5, maxLat:-25.5, minLon:-66.5, maxLon:-64.0 },
};

// JSON - DENTISTAS
async function fetchDentistasJSON(provincia) {
  try {
    const res = await fetch("./datasets/dentistas.json");
    const data = await res.json();
    return data.filter(item => {
      if (item.provincia !== provincia) return false;
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      const limites = limitesProvincias[provincia];
      if (limites) {
        if (lat < limites.minLat || lat > limites.maxLat ||
            lon < limites.minLon || lon > limites.maxLon) return false;
      }
      return true;
    });
  } catch (e) {
    console.warn("No se pudo cargar dentistas.json", e);
    return [];
  }
}

// JSON - VETERINARIAS
async function fetchVeterinariasJSON(provincia) {
  try {
    const res = await fetch("./datasets/veterinarias.json");
    const data = await res.json();
    return data.filter(item => {
      if (item.provincia !== provincia) return false;
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      const limites = limitesProvincias[provincia];
      if (limites) {
        if (lat < limites.minLat || lat > limites.maxLat ||
            lon < limites.minLon || lon > limites.maxLon) return false;
      }
      return true;
    });
  } catch (e) {
    console.warn("No se pudo cargar veterinarias.json", e);
    return [];
  }
}

// CARGAR
function cargar(tipo) {
  clearTimeout(timeoutCarga);
  timeoutCarga = setTimeout(async () => {

    try {

      servicioActual = tipo;
      actualizarBotones();

      // PROVINCIA
      const provincia = document.getElementById("provincia").value;

      // BORRAR ANTERIOR
      if (capaActual) {
        map.removeLayer(capaActual);
      }

      capaActual = L.featureGroup();

      // QUERY OVERPASS
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

      // FETCH CON FALLBACK
      const servidores = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.openstreetmap.ru/api/interpreter",
      ];

      let res = null;
      for (const url of servidores) {
        try {
          res = await fetch(url, { method: "POST", body: query });
          if (res.ok) break;
        } catch {}
      }

      if (!res || !res.ok) throw new Error("Todos los servidores Overpass fallaron");

      const data = await res.json();
      console.log(data);

      // JSON según tipo
      let elementosJSON = [];
      if (tipo === "dentist") {
        const jsonData = await fetchDentistasJSON(provincia);
        elementosJSON = jsonData.map(item => ({
          lat:      parseFloat(item.lat),
          lon:      parseFloat(item.lon),
          nombre:   item.nombre,
          direccion: item.direccion || "",
          telefono: item.telefono || null,
          sitioWeb: item.sitioWeb || null
        }));
      } else if (tipo === "veterinary") {
        const jsonData = await fetchVeterinariasJSON(provincia);
        elementosJSON = jsonData.map(item => ({
          lat:      parseFloat(item.lat),
          lon:      parseFloat(item.lon),
          nombre:   item.nombre,
          direccion: item.direccion || "",
          telefono: item.telefono || null,
          sitioWeb: item.sitioWeb || null
        }));
      }

      // DEDUPLICAR - JSON tiene prioridad sobre OSM
      const vistos = new Map();

      elementosJSON.forEach(item => {
        const clave = `${Math.round(item.lat * 1000)},${Math.round(item.lon * 1000)}`;
        vistos.set(clave, item);
      });

      data.elements.forEach(lugar => {
        if (!lugar.lat || !lugar.lon) return;
        if (!lugar.tags?.name) return;
        if (lugar.tags["addr:country"] && lugar.tags["addr:country"] !== "AR") return;

        const limites = limitesProvincias[provincia];
        if (limites) {
          if (
            lugar.lat < limites.minLat ||
            lugar.lat > limites.maxLat ||
            lugar.lon < limites.minLon ||
            lugar.lon > limites.maxLon
          ) return;
        }

        const clave = `${Math.round(lugar.lat * 1000)},${Math.round(lugar.lon * 1000)}`;
        if (!vistos.has(clave)) {
          const calle =
            lugar.tags?.["addr:street"] || "";

          const numero =
            lugar.tags?.["addr:housenumber"] || "";

          const direccion =
            `${calle} ${numero}`.trim();

          const telefono =
            lugar.tags?.phone ||
            lugar.tags?.["contact:phone"] ||
            null;

          const sitioWeb =
            lugar.tags?.website ||
            lugar.tags?.["contact:website"] ||
            null;

          vistos.set(clave, {
            nombre: lugar.tags?.name || "Sin nombre",

            direccion,

            lat: lugar.lat,
            lon: lugar.lon,

            telefono,

            sitioWeb
          });
        }
      });

      // MARKERS
      const emoji = emojis[tipo] || "📍";

      vistos.forEach(lugar => {

        const nombre   = lugar.nombre   || "Sin nombre";
        const calle    = lugar.direccion || "";
        let popupHTML = `
            <div class="popup-card">

              <div class="popup-header">
                <span style="font-size:24px">${emoji}</span>
                <strong>${nombre}</strong>
              </div>
          `;
        if (calle) {
          popupHTML += `
            <p><span class="material-symbols-outlined popup-pin">
              location_on
            </span>${calle}</p>
          `;
        }  
        if (lugar.telefono) {
          popupHTML += `
            <p><span class="material-symbols-outlined">call</span> ${lugar.telefono}</p>
          `;
        }
        if (lugar.sitioWeb) {
          popupHTML += `
            <p>
              <span class="material-symbols-outlined">
                language
              </span>
              <a
                href="${lugar.sitioWeb}"
                target="_blank"
              >
                Sitio web
              </a>
            </p>
          `;
        }
        popupHTML += `</div>`;

        const icono = L.divIcon({
          html: `<div style="font-size: 28px;">${emoji}</div>`,
          className: "",
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        });

        const marker = L.marker([lugar.lat, lugar.lon], { icon: icono })
          .bindPopup(popupHTML);

        capaActual.addLayer(marker);
      });

      // MAPA
      capaActual.addTo(map);

      // ZOOM
      if (capaActual.getLayers().length > 0) {
        map.fitBounds(capaActual.getBounds());
      }

    } catch(error) {
      console.error(error);
    }

  }, 400);
}

// BOTON ACTIVO
function actualizarBotones() {
  botones.forEach(boton => {
    boton.classList.remove("activo");
    if (boton.dataset.tipo === servicioActual) {
      boton.classList.add("activo");
    }
  });
}

// CAMBIO PROVINCIA
document.getElementById("provincia").addEventListener("change", () => {
  if (servicioActual) {
    cargar(servicioActual);
  }
});