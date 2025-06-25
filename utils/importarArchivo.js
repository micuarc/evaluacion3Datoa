const fs = require("fs").promises;
const path = require("path");
const { normalizarString } = require("./normalizarString.js");

async function importarArchivo(nombreBaseArchivo) {
  const extensiones = [".txt", ".csv"];
  const uploadDir = path.join(__dirname, "..", "upload");

  for (const ext of extensiones) {
    const ruta = path.join(uploadDir, nombreBaseArchivo + ext);
    try {
      const contenidoArchivo = await fs.readFile(ruta, "utf8");
      return contenidoArchivo
        .split("\n")
        .map((linea) => normalizarString(linea.trim()))
        .filter((linea) => linea.length > 0);
    } catch (error) {
      console.error("error con el archivo por normalizar:", error.message);
      throw error;
    }
  }
}

module.exports = { importarArchivo };
