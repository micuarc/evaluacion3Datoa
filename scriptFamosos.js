const db = require("./connectDb.js");
const regexComienzo = /^\d+\.\s*/;

function normalizarFamosos(famoso) {
  let hoy = new Date();
  let arrFamoso = [];
  const diaDeHoy = new Date();
  let fechaNacimiento;
  let nombreFamoso;
  let string;
  let antesCristo = false;
  let edadFamoso;
  let flagCumpleaños = 0;
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
      diaDeHoy.getDate()
    );

    if (antesCristo) {
      fechaNacimiento = `${String(mes).padStart(2, "0")}/${String(
        dia
      )}/${anio} a.C.`;
      if (diaDeHoy.getMonth() + 1 === mes && diaDeHoy.getDate() === dia) {
        flagCumpleaños = 1;
      }
      fechaEnUTC = Date.UTC(anio * -1, mes - 1, dia, 0, 0, 0, 0);
      edadFamoso = Math.abs(
        Math.floor((fechaEnUTC - hoyEnUTC) / 1000 / 60 / 60 / 24 / 365)
      );
    } else {
      fechaNacimiento = `${String(mes).padStart(2, "0")}/${String(
        dia
      )}/${anio}`;

      fechaNacimiento = new Date(fechaNacimiento);
      const fechaCopia = new Date(+fechaNacimiento).setHours(0, 0, 0, 0);
      edadFamoso = Math.abs(
        Math.floor((hoyCopia - fechaCopia) / 1000 / 60 / 60 / 24 / 365)
      );
      hoy = hoy
        .toLocaleDateString(`es-CL`, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replaceAll("-", "/");
      fechaNacimiento = fechaNacimiento
        .toLocaleDateString(`es-CL`, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replaceAll("-", "/");
      flagCumpleaños =
        hoy.substring(0, 6) === fechaNacimiento.substring(0, 6) ? 1 : 0;
    }
    return [nombreFamoso, fechaNacimiento, edadFamoso, flagCumpleaños];
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

async function ejecutarScript() {
  try {
    const [rows] = await db.query("SELECT * FROM famosos");
    const arrayFamosos = rows.map((famoso) =>
      normalizarFamosos(famoso.column1)
    );
    const famososUnicos = eliminarFamososDuplicados(arrayFamosos);

    await crearNuevaTabla();
    await db.query("TRUNCATE TABLE famosos_normalizados");
    await guardarFamosos(famososUnicos);

    const [filasNuevas] =
      await db.query(`SELECT famoso, fechaNacimiento, edad, flagCumpleaños 
      FROM famosos_normalizados`);

    const resultado = filasNuevas.map((fila) => [
      fila.famoso,
      fila.fechaNacimiento,
      fila.edad,
      fila.flagCumpleaños,
    ]);

    return resultado;
  } catch (error) {
    console.error("Error en ejecutarScript:", error);
    throw error;
  }
}

async function crearNuevaTabla() {
  const consultaSQL = `
  CREATE TABLE IF NOT EXISTS famosos_normalizados (
    famoso VARCHAR(255) NOT NULL UNIQUE,
    fechaNacimiento VARCHAR(255) NOT NULL,
    edad INTEGER(4),
    flagCumpleaños TINYINT(1)
)
`;

  await db.query(consultaSQL);
}

async function guardarFamosos(famosos) {
  if (famosos.length === 0) return;
  for (const famoso of famosos) {
    const [nombre, fechaNacimiento, edad, flagCumpleaños] = famoso;
    await db.query(
      `INSERT IGNORE INTO famosos_normalizados 
      (famoso, fechaNacimiento, edad, flagCumpleaños) 
      VALUES (?, ?, ?, ?)`,
      [nombre, fechaNacimiento, edad, flagCumpleaños]
    );
  }
}

async function getFamosos() {
  return await ejecutarScript();
}

ejecutarScript()
  .then(() => console.log("Ejecución completa"))
  .catch((err) => console.error("Error en ejecutarScript:", err));

module.exports = { getFamosos };
