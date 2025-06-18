const fs = require("fs").promises;
const path = require("path");
const { normalizarString } = require("./normalizarString.js");

async function importarArchivo(pathArchivo) {
  try {
    const contenidoArchivo = await fs.readFile(
      path.resolve(pathArchivo),
      "utf8"
    );
    return contenidoArchivo
      .split("\n")
      .map((linea) => normalizarString(linea.trim()))
      .filter((linea) => linea.length > 0);
  } catch (error) {
    console.error("error con el archivo por normalizar:", error.message);
    throw error;
  }
}

module.exports = { importarArchivo };
