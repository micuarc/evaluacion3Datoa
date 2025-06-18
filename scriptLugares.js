const db = require("./connectDb.js");
const { importarArchivo } = require("./utils/importarArchivo.js");
const { obtenerDireccionConAPI } = require("./utils/geocodificacion.js");

async function scriptTablaOriginal() {
  let lugares = await importarArchivo("./DATOS3.TXT");
  lugares.splice(0, 1);
  //crear tabla
  const crearTabla = `CREATE TABLE IF NOT EXISTS tabla_original (
        column1 VARCHAR(255) not null)`;
  await db.query(crearTabla);
  //importar datos. truncar primero
  await db.query("TRUNCATE TABLE tabla_original");
  if (lugares.length === 0) return;
  for (const lugar of lugares) {
    const importarDatos = `
      INSERT IGNORE INTO tabla_original 
      (column1) 
      VALUES (?)
      `;
    await db.query(importarDatos, lugar);
  }
  const [filasNuevas] = await db.query(`SELECT * FROM tabla_original`);
  const dividirColumnas = filasNuevas.map((fila) => {
    const contenido = fila["column1"].toString();
    return contenido.split(";");
  });
  return dividirColumnas;
}

function eliminarLugaresDuplicados(lugares) {
  const lugaresUnicos = [];
  const registrosProcesados = new Set();

  for (const lugar of lugares) {
    const key = lugar[2];
    if (!registrosProcesados.has(key)) {
      registrosProcesados.add(key);
      lugaresUnicos.push(lugar);
    }
  }
  return lugaresUnicos;
}
async function crearTablas() {
  await db.query("DROP TABLE IF EXISTS direcciones_normalizadas");
  await db.query("DROP TABLE IF EXISTS georeferencias_normalizadas");
  await db.query("DROP TABLE IF EXISTS lugares_normalizados");
  const sqlLugares = `
    CREATE TABLE IF NOT EXISTS lugares_normalizados (
        id_lugar INT AUTO_INCREMENT PRIMARY KEY,
        nombre_lugar VARCHAR(255) NOT NULL)
        `;

  const sqlGeoreferencias = `
        CREATE TABLE IF NOT EXISTS georeferencias_normalizadas (
            id_lugar INT PRIMARY KEY,
            latitud DECIMAL(10,6) NOT NULL,
            longitud DECIMAL(10, 6) NOT NULL,
            FOREIGN KEY (id_lugar) REFERENCES lugares_normalizados(id_lugar)
    ON DELETE CASCADE)
`;
  const sqlDirecciones = `
  CREATE TABLE IF NOT EXISTS direcciones_normalizadas (
        id_lugar INT  PRIMARY KEY,
    nombre_calle VARCHAR(255),
    numero_calle VARCHAR (20),
    ciudad_estado_provincia VARCHAR(60),
    pais VARCHAR(60),
    FOREIGN KEY (id_lugar) REFERENCES lugares_normalizados(id_lugar)
    ON DELETE CASCADE)
`;
  await db.query(sqlLugares);
  await db.query(sqlGeoreferencias);
  await db.query(sqlDirecciones);
}

async function ejecutarScript() {
  try {
    await scriptTablaOriginal();
    const [arrLugares] = await db.query("SELECT * FROM tabla_original");

    // dividir en arrays para que funcionen las posiciones
    const arrayLugares = arrLugares.map((fila) => {
      const contenido = fila["column1"];
      return contenido.split(";");
    });

    const lugaresUnicos = eliminarLugaresDuplicados(arrayLugares);

    await crearTablas();

    await db.query("DELETE FROM direcciones_normalizadas");
    await db.query("DELETE FROM georeferencias_normalizadas");
    await db.query("DELETE FROM lugares_normalizados");

    const resultadosLugares = [];

    for (const fila of lugaresUnicos) {
      const nombre = fila[0];
      const direccionComp = fila[1];
      const georeferencia = fila[2];
      const partesDireccion = direccionComp.split(", ");
      const paisDelTxt =
        partesDireccion.length > 0
          ? partesDireccion[partesDireccion.length - 1]
          : null;
      const areaDelTxt =
        partesDireccion.length > 0
          ? partesDireccion[partesDireccion.length - 2]
          : null;

      const [latitud, longitud] = georeferencia.split(",").map((elem) => {
        return parseFloat(elem.trim());
      });

      const [resultadoLugar] = await db.query(
        `INSERT INTO lugares_normalizados (nombre_lugar) VALUES (?)`,
        [nombre]
      );
      const id_lugar = resultadoLugar.insertId;

      await db.query(
        `INSERT INTO georeferencias_normalizadas (id_lugar, latitud, longitud) VALUES (?, ?, ?)`,
        [id_lugar, latitud, longitud]
      );

      const direccion = await obtenerDireccionConAPI(
        latitud,
        longitud,
        paisDelTxt,
        areaDelTxt
      );

      await db.query(
        `INSERT INTO direcciones_normalizadas (id_lugar, nombre_calle, numero_calle, ciudad_estado_provincia, pais)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id_lugar,
          direccion.nombre_calle,
          direccion.numero_calle,
          direccion.ciudad_estado_provincia,
          direccion.pais,
        ]
      );

      resultadosLugares.push({
        nombre,
        latitud,
        longitud,
        ...direccion,
      });
    }
    return resultadosLugares;
  } catch (error) {
    console.error("Error en ejecutarScript:", error);
    throw error;
  }
}
ejecutarScript();

async function getLugares() {
  return await ejecutarScript();
}

module.exports = { getLugares };
