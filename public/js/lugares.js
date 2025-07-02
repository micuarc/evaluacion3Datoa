const tabla = document.querySelector("#tablaLugares tbody");
const input = document.getElementById("filtrar");
const spinner = document.getElementById("spinner");
const contenedorTabla = document.getElementById("containerTabla");
const formSubirArchivo = document.getElementById("examinar");
const botonSubir = document.getElementById("subir");
const botonDescarga = document.getElementById("descargar");
const inputArchivo = document.getElementById("inputArchivo");

// +++++++++++++++++++++

//ESTADOS INICIALES - VARIABLES GLOBALES
//array vacío para guardar orden original
let arrayOriginal = [];
//para guardar filtro actual
let filtroActual = "";
//para definir cuál es el orden actual. por default es ascendente
let ordenActual = "asc";

// +++++++++++++++++++++

// FUNCIONES PRICNIAPLES

//cargar los datos desde la api y guardarlos en un array
async function cargarBDLugares() {
  try {
    //mostrar el spinner
    spinner.classList.remove("d-none");
    //ocultar la tabla en caso de que estuviese visible por haber cargado un archivo anteriormente
    contenedorTabla.classList.add("d-none");

    //llamar a la api y tomar su respuesta
    const response = await fetch("/api/lugares");
    if (!response.ok) throw new Error("Error al cargar lugares");

    // crear un array con los datos de los famosos a partir del json que devuleve la api
    const lugares = await response.json();

    arrayOriginal = lugares.map((lugar, index) => ({
      numero: index + 1,
      nombreLugar: lugar.nombre_lugar,
      calle: lugar.nombre_calle,
      numeroCalle: lugar.numero_calle,
      area: lugar.ciudad_estado_provincia,
      pais: lugar.pais,
      latitud: lugar.latitud,
      longitud: lugar.longitud,
    }));
    //recargar los nuevos datos
    aplicarFiltro();
  } catch (error) {
    console.error("Error:", error);
    //en caso de fallar, no se mostrará la tabla
    contenedorTabla.classList.add("d-none");
  } finally {
    //una vez se ejecute -ya sea con éxito o error- se oculta el spinner
    spinner.classList.add("d-none");
  }
}

//función para mostrar los valores en la tabla obtenidos desde el array
function mostrarValores(arr) {
  tabla.replaceChildren(); // borra todas las filas

  //por cada lugar
  arr.forEach((lugar) => {
    //crear una fila
    const row = document.createElement("tr");
    [
      lugar.numero,
      lugar.nombreLugar,
      lugar.calle,
      lugar.numeroCalle,
      lugar.area,
      lugar.pais,
      lugar.latitud,
      lugar.longitud,
    ].forEach((valor) => {
      //crear una celda por cada campo del lugar y asignarle el valor obtenido del array
      const celda = document.createElement("td");
      celda.textContent = valor;
      //agregar cada celda a la fila del lugar
      row.appendChild(celda);
    });
    //una vez la fila ya tiene todos los valores, agregarlo a la tabla
    tabla.appendChild(row);
  });
}

//aplicar filtros de busqueda por texto y el orden seleccionado
function aplicarFiltro() {
  //copiar el array con el orden original
  let resultado = [...arrayOriginal];
  // filtrar por texto
  if (filtroActual) {
    resultado = resultado.filter((lugar) =>
      lugar.nombreLugar.toLowerCase().includes(filtroActual.toLowerCase())
    );
  }

  // aplicar orden al array que copiamos
  //si seleccionamos descendente
  if (ordenActual === "desc") {
    resultado.sort((a, b) => b.nombreLugar.localeCompare(a.nombreLugar));
  } else {
    //la otra opción es ascendente: es decir, el original
    arrayOriginal;
  }

  mostrarValores(resultado);
}

// +++++++++++++++++++++

//EVENTOS Y LISTENERS

//Subir un archivo por normalizar
formSubirArchivo.addEventListener("submit", async (e) => {
  //evitar la recarga de la página
  e.preventDefault();
  //ocultar el contenedor de la tabla, en caso de que ya se hubiese cargado una tabla anteriormente
  contenedorTabla.classList.add("d-none");
  //mostrar el spinner
  spinner.classList.remove("d-none");

  //el obj FormData nos ayuda a crear un objeto para hacer solicitudes con fetch
  const formData = new FormData();
  //le agregaremos como contenido el archivo cargado por el usuario
  formData.append("datosLugares", inputArchivo.files[0]);

  try {
    //se envía el formdata anteriormente creado al endpoint
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });
    //si la api no puede procesar el archivo, no podrá subirlo
    if (!response.ok) throw new Error("Error al subir archivo");

    // usé esta variable para el manejo de errores que presentó
    // en este caso no es necesario manipular los archivos del json como se hizo anteriormente
    const resultado = await response.json();

    //se muestra una alerta en el front de que el archivo se pudo subir correctamente
    //esto no signfica que los datos sean válidos, solo que se pudo subir el archivo
    alert("Archivo subido correctamente");
    //cuando los datos estén listos, se cargarán
    await cargarBDLugares();
    contenedorTabla.classList.remove("d-none");
  } catch {
    console.error(error);
    alert("Error al subir archivo");
  } finally {
    spinner.classList.add("d-none");
    inputFile.value = "";
  }
});

// una vez que el dom se carga por completo
document.addEventListener("DOMContentLoaded", () => {
  //restablecer estados iniciales
  arrayOriginal = [];
  input.value = "";
  inputArchivo.value = "";
  tabla.replaceChildren();
  contenedorTabla.classList.add("d-none"); // oculta tabla al inicio
  contenedorTabla.classList.remove("d-block");
});

//listener al escribir en el input de filtro por texto
input.addEventListener("keyup", () => {
  filtroActual = input.value;
  aplicarFiltro();
});

//listener al hacer click en el orden de filtro
document.querySelectorAll(".dropdown-menu li a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    ordenActual = link.getAttribute("data-order");
    aplicarFiltro();
  });
});

//Descargar el CSV con datos normalizados
botonDescarga.addEventListener("click", () => {
  window.location.href = "/download/lugares";
});
