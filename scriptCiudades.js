const db = require("./connectDb.js");
const { normalizarCaseString } = require("./utils/normalizarString.js");
const { importarArchivo } = require("./utils/importarArchivo.js");
let arrayCiudades = [];

async function scriptTablaOriginal() {
  let ciudades = await importarArchivo("./CSN.TXT");
  //crear tabla
  const crearTabla = `CREATE TABLE IF NOT EXISTS ciudades (
        column1 VARCHAR(255) not null)`;
  await db.query(crearTabla);
  //importar datos. truncar primero
  await db.query("TRUNCATE TABLE ciudades");
  if (ciudades.length === 0) return;
  for (const ciudad of ciudades) {
    const importarDatos = `
      INSERT INTO ciudades 
      (column1) 
      VALUES (?)
      `;
    await db.query(importarDatos, ciudad);
  }
  return ciudades.map((fila) => fila.toString());
}

function normalizarCiudad(ciudad) {
  //separamos las palabras de una ciudad. Ej: "BUENOS AIRES" -> ["BUENOS", "AIRES"]
  const subpalabras = ciudad.split(" ");
  //aplicaremos normalización por cada palabra de una ciudad.
  const formato = subpalabras.map((palabra) => normalizarCaseString(palabra));
  //juntamos el array resultante del map como un string
  //ej: ["Buenos", "Aires"] -> "Buenos Aires
  return formato.join(" ");
}

async function crearNuevaTabla() {
  const consultaSQL = `
  CREATE TABLE IF NOT EXISTS ciudades_normalizadas (
    ciudad VARCHAR(255) NOT NULL UNIQUE
    )
    `;

  await db.query(consultaSQL);
}

async function guardarCiudades(ciudades) {
  if (ciudades.length === 0) return;
  for (const ciudad of ciudades) {
    await db.query(
      "INSERT IGNORE INTO ciudades_normalizadas (ciudad) VALUES (?)",
      [ciudad]
    );
  }
}
async function ejecutarScript() {
  try {
    const filasCiudades = await scriptTablaOriginal();
    const regex = /^\d+\.\s*/; //regex para tomar chars que van antes de la ciudad. Ej: "12. Hola" -> toma "12 ."

    //iteraremos el array anterior para limpiar las ciudades (con map se crea otro array)
    //se aplicará la lógica del map por cada elemento del array (cada ciudad)
    const limpiarCiudades = filasCiudades.map((ciudad) => {
      //limpiamos con el regex
      const palabraTrimmeada = ciudad.replace(regex, "");
      //usamos la función para normalizar la ciudad
      return normalizarCiudad(palabraTrimmeada);
    });

    const ciudades = limpiarCiudades.filter((item, index) => {
      return limpiarCiudades.indexOf(item) === index;
    });

    arrayCiudades = [...ciudades];

    //creamos la tabla donde pushearemos los datos
    await crearNuevaTabla();
    //vaciamos la tabla en caso de estar con datos
    await db.query("TRUNCATE TABLE ciudades_normalizadas");
    //pusheamos los datos normalizados
    await guardarCiudades(ciudades);

    //LEER DATOS DE TABLA RECIÉN PUSHEADA
    const [filasNuevas] = await db.query("SELECT * FROM ciudades_normalizadas");
    console.log(ciudades);
    return filasNuevas.map((fila) => fila.ciudad);
  } catch (error) {
    console.error("Error al conectar a la DB:", error.message);
  }
}

async function getCiudades() {
  return await ejecutarScript();
}
console.log(ejecutarScript());

module.exports = { arrayCiudades, getCiudades };
