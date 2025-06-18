const express = require("express");
const { getFamosos } = require("./scriptFamosos.js");
const { getCiudades } = require("./scriptCiudades.js");
const { getLugares } = require("./scriptLugares.js");

const app = express();
const port = 3000;

// llamar archivos estaticos (directorio public)
app.use(express.static("public"));

// endpoint para obtener ciudades desde la bd

app.get("/api/ciudades", async (request, response) => {
  try {
    const ciudades = await getCiudades();
    response.json(ciudades);
  } catch (error) {
    console.error("Error al obtener ciudades:", error);
    response.status(500).json({ error: "Error al obtener ciudades" });
  }
});

app.get("/api/famosos", async (request, response) => {
  try {
    const famosos = await getFamosos();
    response.json(famosos);
  } catch (error) {
    console.error("Error en /api/famosos:", error);
    response.status(500).json({
      error: "Error al obtener famosos",
    });
  }
});

app.get("/api/lugares", async (request, response) => {
  try {
    const lugares = await getLugares();
    response.json(lugares);
  } catch (error) {
    console.error("Error en /api/lugares:", error);
    response.status(500).json({
      error: "Error al obtener lugares",
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
