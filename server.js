const express = require("express");
const db = require("./connectDb.js");
const multer = require("multer");
const path = require("path");
const { getFamosos, ejecutarFamosos } = require("./scriptFamosos.js");
const { getCiudades, ejecutarCiudades } = require("./scriptCiudades.js");
const { getLugares, ejecutarLugares } = require("./scriptLugares.js");
const { exportarCSV } = require("./utils/exportarComoCsv.js");
const app = express();
const port = 3000;

async function vaciarTablas() {
  try {
    await db.query("DELETE FROM georeferencias_normalizadas");
    await db.query("DELETE FROM lugares_normalizados");
    await db.query("DELETE FROM direcciones_normalizadas");
    await db.query("TRUNCATE TABLE ciudades_normalizadas");
    await db.query("TRUNCATE TABLE famosos_normalizados");
    console.log("Tablas vaciadas correctamente al iniciar el servidor.");
  } catch (error) {
    console.error("Error al vaciar tablas al iniciar:", error);
  }
}

//usaremos multer para subir archivos desde el front
const almacenamiento = multer.diskStorage({
  destination: function (request, file, cb) {
    cb(null, "upload/");
  },
  filename: function (request, file, cb) {
    const nombreFijo = file.fieldname; // datosCiudades, datosFamosos, datosLugares
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, nombreFijo + extension);
  },
});

// aceptar solo .txt o .csv
const filtroArchivos = (request, file, cb) => {
  const extensionesValidas = [".txt", ".csv"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (extensionesValidas.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Solo archivos .txt o .csv son permitidos"), false);
  }
};

const upload = multer({ storage: almacenamiento, fileFilter: filtroArchivos });

// llamar archivos estaticos (directorio public)
app.use(express.static("public"));

// endpoint para subir archivos desde el front
app.post(
  "/upload",
  upload.fields([
    { name: "datosCiudades", maxCount: 1 },
    { name: "datosFamosos", maxCount: 1 },
    { name: "datosLugares", maxCount: 1 },
  ]),
  async (request, response) => {
    try {
      if (request.files.datosCiudades) {
        await ejecutarCiudades();
      }
      if (request.files.datosFamosos) {
        await ejecutarFamosos();
      }
      if (request.files.datosLugares) {
        await ejecutarLugares();
      }
      response.json({ message: "Archivos subidos y procesados correctamente" });
    } catch (error) {
      console.error("Error en upload:", error.message);
      response.status(500).json({ error: error.message });
    }
  }
);

// endpoint para obtener ciudades, famosos y lugares desde la bd
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
    response.json(lugares); // Ya viene todo listo para enviar
  } catch (error) {
    console.error("Error en /api/lugares:", error);
    response.status(500).json({
      error: "Error al obtener lugares",
    });
  }
});

//endpoints para descargar los archivos .csv
app.get("/download/ciudades", async (request, response) => {
  try {
    const nombreArchivo = "ciudades.csv";
    const ciudades = await getCiudades();
    const headers = {
      Nombre_Ciudad: "ciudad",
    };
    await exportarCSV(nombreArchivo, ciudades, headers);
    response.download(path.join(__dirname, "public", "csv", nombreArchivo));
  } catch (error) {
    console.error("Error al generar CSV de ciudades:", error);
    response.status(500).json({ error: "No se pudo generar el archivo CSV." });
  }
});

app.get("/download/famosos", async (request, response) => {
  try {
    const nombreArchivo = "famosos.csv";
    const famosos = await getFamosos();
    const headers = {
      Nombre_Famoso: "famoso",
      Fecha_Nacimiento: "fechaNacimiento",
      Edad: "edad",
      Cumpleanios_Dia_Del_Export: "flagCumpleanios",
    };
    await exportarCSV(nombreArchivo, famosos, headers);
    response.download(path.join(__dirname, "public", "csv", nombreArchivo));
  } catch (error) {
    console.error("Error al generar CSV de famosos:", error);
    response.status(500).json({ error: "No se pudo generar el archivo CSV." });
  }
});

app.get("/download/lugares", async (request, response) => {
  try {
    const nombreArchivo = "lugares.csv";
    const lugares = await getLugares();
    const headers = {
      Nombre_del_Lugar: "nombre_lugar",
      Latitud: "latitud",
      Longitud: "longitud",
      Nombre_Calle: "nombre_calle",
      Numero: "numero_calle",
      Area: "ciudad_estado_provincia",
      Pais: "pais",
    };

    await exportarCSV(nombreArchivo, lugares, headers);
    response.download(path.join(__dirname, "public", "csv", nombreArchivo));
  } catch (error) {
    console.error("Error al generar CSV de lugares:", error);
    response
      .status(500)
      .json({ error: "No se pudo generar el archivo CSV de lugares." });
  }
});

app.listen(port, async () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  await vaciarTablas();
});
