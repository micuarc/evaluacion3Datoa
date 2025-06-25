const fs = require("fs");
const path = require("path");

function convertirA_CSV(data, objHeaders) {
  if (!data || data.length === 0) {
    return "";
  }
  const headers = Object.keys(objHeaders);
  const claves = Object.values(objHeaders);
  const filas = [];

  // agregar headers
  filas.push(headers.join(";"));

  // Agregar filas de datos
  for (const fila of data) {
    const valores = claves.map((clave) => {
      let valor = fila[clave];
      if (typeof valor === "string") {
        valor = valor.replace(/"/g, '""');
        if (valor.includes(";") || valor.includes("\n")) {
          valor = `"${valor}"`;
        }
      }
      return valor;
    });
    filas.push(valores.join(";"));
  }

  return filas.join("\n");
}

function exportarCSV(nombreArchivo, data, headers) {
  const contenidoCSV = convertirA_CSV(data, headers);
  const rutaCompleta = path.join(
    __dirname,
    "..",
    "public",
    "csv",
    nombreArchivo
  );

  return new Promise((resolve, reject) => {
    fs.writeFile(rutaCompleta, contenidoCSV, "utf8", (err) => {
      if (err) {
        console.error(`Error al crear archivo ${nombreArchivo}:`, err);
        reject(err);
      } else {
        console.log(`CSV "${nombreArchivo}" creado con éxito.`);
        resolve(rutaCompleta);
      }
    });
  });
}

module.exports = { exportarCSV };
