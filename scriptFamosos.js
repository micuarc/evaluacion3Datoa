const db = require("./connectDb.js");
const { importarArchivo } = require("./utils/importarArchivo.js");
const regexComienzo = /^\d+\.\s*/;

async function scriptTablaOriginal() {
  let famosos = await importarArchivo("datosFamosos");
  //crear tabla
  const crearTabla = `CREATE TABLE IF NOT EXISTS famosos (
        column1 VARCHAR(255) not null)`;
  await db.query(crearTabla);
  //importar datos. truncar primero
  await db.query("TRUNCATE TABLE famosos");
  if (famosos.length === 0) return;
  for (const famoso of famosos) {
    const importarDatos = `
      INSERT IGNORE INTO famosos 
      (column1) 
      VALUES (?)
      `;
    await db.query(importarDatos, famoso);
  }
  const [filasNuevas] = await db.query(`SELECT * FROM famosos`);
  const dividirColumnas = filasNuevas.map((fila) => {
    const contenido = fila["column1"].toString();
    return contenido.split(";");
  });
  return dividirColumnas;
}

function normalizarFamosos(famoso) {
  let hoy = new Date();
  let arrFamoso = [];
  const diaDeHoy = new Date();
  let fechaNacimiento;
  let nombreFamoso;
  let string;
  let antesCristo = false;
  let edadFamoso;
  let flagCumpleanios = 0;
  let fechaEnUTC;
  if (famoso.includes("a.C.")) antesCristo = true;
  if (antesCristo && !famoso.includes("alrededor")) {
    string = famoso
      .trim()
      .replace(regexComienzo, "")
      .replace("-", "")
      .replace(" a.C.", "");
    antesCristo = true;
  } else {
    string = famoso.trim().replace(regexComienzo, "").replace("-", "");
  }
  arrFamoso = string.split(" ");

  if (string.includes("alrededor")) {
    const indexDelimitador = arrFamoso.indexOf("alrededor");
    fechaNacimiento = arrFamoso.slice(indexDelimitador);
    antesCristo
      ? (edadFamoso = diaDeHoy.getFullYear() + Number(fechaNacimiento[2]))
      : (edadFamoso = diaDeHoy.getFullYear() - Number(fechaNacimiento[2]));

    fechaNacimiento = fechaNacimiento.join(" ");
    nombreFamoso = arrFamoso.slice(0, indexDelimitador - 1).join(" ");

    return [nombreFamoso, fechaNacimiento, edadFamoso, 0];
  } else {
    arrFamoso.splice(-2, 1);
    nombreFamoso = arrFamoso.slice(0, -1).join(" ");
    fechaNacimiento = arrFamoso.slice(-1)[0];
    fechaNacimiento = fechaNacimiento.replaceAll("-", "/");
    fechaNacimiento = fechaNacimiento.split("/");
    //pasar a numero
    fechaNacimiento = fechaNacimiento.map(Number);
    let anioNacimiento = Math.max(...fechaNacimiento);

    let dia, mes, anio;
    if (fechaNacimiento[0] === anioNacimiento) {
      [anio, mes, dia] = fechaNacimiento;
    } else if (fechaNacimiento[2] === anioNacimiento) {
      [dia, mes, anio] = fechaNacimiento;
    } else {
      [dia, mes, anio] = fechaNacimiento;
    }

    const hoyCopia = new Date(+hoy).setHours(0, 0, 0, 0);
    const hoyEnUTC = Date.UTC(
      diaDeHoy.getFullYear(),
      diaDeHoy.getMonth(),
      diaDeHoy.getDate(),
      0,
      0,
      0,
      0
    );

    if (antesCristo) {
      fechaNacimiento = `${String(dia)}/${String(mes).padStart(
        2,
        "0"
      )}/${anio} a.C.`;
      if (diaDeHoy.getMonth() + 1 === mes && diaDeHoy.getDate() === dia) {
        flagCumpleanios = 1;
      }
      fechaEnUTC = Date.UTC(anio * -1, mes - 1, dia, 0, 0, 0, 0);
      edadFamoso = Math.abs(
        Math.floor((fechaEnUTC - hoyEnUTC) / 1000 / 60 / 60 / 24 / 365)
      );
    } else {
      fechaNacimiento = new Date(anio, mes - 1, dia);
      const fechaCopia = new Date(+fechaNacimiento).setHours(0, 0, 0, 0);
      edadFamoso = Math.abs(
        Math.floor((hoyCopia - fechaCopia) / 1000 / 60 / 60 / 24 / 365)
      );

      // Formatear fecha de nacimiento a dd/mm/yyyy con padStart
      const diaF = String(dia).padStart(2, "0");
      const mesF = String(mes).padStart(2, "0");
      const anioF = String(anio);
      const fechaNacimientoStr = `${diaF}/${mesF}/${anioF}`;

      // Comparar fechas para el cumpleaños
      const hoyF = new Date();
      const hoyDia = String(hoyF.getDate()).padStart(2, "0");
      const hoyMes = String(hoyF.getMonth() + 1).padStart(2, "0");

      flagCumpleanios = `${hoyDia}/${hoyMes}` === `${diaF}/${mesF}` ? 1 : 0;

      fechaNacimiento = fechaNacimientoStr;
    }
    return [nombreFamoso, fechaNacimiento, edadFamoso, flagCumpleanios];
  }
}

function eliminarFamososDuplicados(famosos) {
  const normalizarNombre = (nombre) => {
    return nombre
      .toLowerCase()
      .replace(
        /(queen|king|prince|princess)\s+|vii|viii|ii|iii|iv|ix|\s+/gi,
        ""
      )
      .trim();
  };

  const famososUnicos = [];
  const registrosProcesados = new Set();

  for (let i = 0; i < famosos.length; i++) {
    if (registrosProcesados.has(i)) continue;

    const [nombre, fecha, edad, flag] = famosos[i];
    famososUnicos.push(famosos[i]);
    registrosProcesados.add(i);

    for (let j = i + 1; j < famosos.length; j++) {
      if (registrosProcesados.has(j)) continue;

      const [otroNombre, otraFecha, otraEdad, otroFlag] = famosos[j];
      const nombresSimilares =
        normalizarNombre(nombre) === normalizarNombre(otroNombre);
      const mismaFecha = fecha === otraFecha;

      if (nombresSimilares && mismaFecha) {
        registrosProcesados.add(j);
      }
    }
  }

  return famososUnicos;
}

async function ejecutarFamosos() {
  try {
    await scriptTablaOriginal();
    const [rows] = await db.query("SELECT * FROM famosos");
    const arrayFamosos = rows.map((famoso) =>
      normalizarFamosos(famoso.column1)
    );
    const famososUnicos = eliminarFamososDuplicados(arrayFamosos);

    await crearNuevaTabla();
    await db.query("TRUNCATE TABLE famosos_normalizados");
    await guardarFamosos(famososUnicos);

    const [filasNuevas] =
      await db.query(`SELECT famoso, fechaNacimiento, edad, flagCumpleanios 
      FROM famosos_normalizados`);

    const resultado = filasNuevas.map((fila) => [
      fila.famoso,
      fila.fechaNacimiento,
      fila.edad,
      fila.flagCumpleanios,
    ]);

    return resultado;
  } catch (error) {
    console.error("Error en ejecutarFamosos:", error);
    throw error;
  }
}

async function crearNuevaTabla() {
  const consultaSQL = `
  CREATE TABLE IF NOT EXISTS famosos_normalizados (
    famoso VARCHAR(255) NOT NULL UNIQUE,
    fechaNacimiento VARCHAR(255) NOT NULL,
    edad INTEGER(4),
    flagCumpleanios TINYINT(1)
)
`;

  await db.query(consultaSQL);
}

async function guardarFamosos(famosos) {
  if (famosos.length === 0) return;
  for (const famoso of famosos) {
    const [nombre, fechaNacimiento, edad, flagCumpleanios] = famoso;
    await db.query(
      `INSERT IGNORE INTO famosos_normalizados 
      (famoso, fechaNacimiento, edad, flagCumpleanios) 
      VALUES (?, ?, ?, ?)`,
      [nombre, fechaNacimiento, edad, flagCumpleanios]
    );
  }
}

async function getFamosos() {
  const [filas] = await db.query(
    "SELECT famoso, fechaNacimiento, edad, flagCumpleanios FROM famosos_normalizados"
  );
  console.log(filas);
  return filas;
}

module.exports = { getFamosos, ejecutarFamosos };
