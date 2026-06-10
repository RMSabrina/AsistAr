import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
console.log(process.env.APIFY_TOKEN);
const provincias = [
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán"
];

async function generarDentistas() {

  const resultados = [];
  const vistos = new Set();

  for (const provincia of provincias) {

    console.log(`Buscando dentistas en ${provincia}`);

    const input = {
      searchStringsArray: [
        `dentistas en ${provincia} Argentina`
      ],
      maxCrawledPlacesPerSearch: 200
    };

    const run = await axios.post(
      "https://api.apify.com/v2/acts/compass~google-maps-extractor/runs?token=" +
      process.env.APIFY_TOKEN,
      input
    );

    const datasetId =
      run.data.data.defaultDatasetId;

    await new Promise(
      resolve => setTimeout(resolve, 30000)
    );

const dataset = await axios.get(
  `https://api.apify.com/v2/datasets/${datasetId}/items`,
  {
    headers: {
      Authorization: `Bearer ${process.env.APIFY_TOKEN}`
    }
  }
);

    for (const item of dataset.data) {

      const nombre =
        item.title || "";

      const lat =
        item.location?.lat;

      const lon =
        item.location?.lng;

      const clave =
        `${nombre}-${lat}-${lon}`;

      if (vistos.has(clave))
        continue;

      vistos.add(clave);

      resultados.push({
        nombre,
        provincia,
        direccion: item.address || "",
        telefono: item.phone || "",
        sitioWeb: item.website || "",
        lat,
        lon
      });

    }

  }

  fs.writeFileSync(
    "./datasets/dentistas.json",
    JSON.stringify(
      resultados,
      null,
      2
    )
  );

  console.log(
    `Generados ${resultados.length} dentistas`
  );

}

generarDentistas();