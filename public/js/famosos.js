//SELECTORES DEL DOM
const tabla = document.querySelector("#tablaFamosos tbody");
const input = document.getElementById("filtrar");
const spinner = document.getElementById("spinner");
const contenedorTabla = document.getElementById("containerTabla");
const formSubirArchivo = document.getElementById("examinar");
const botonSubir = document.getElementById("subir");
const botonDescarga = document.getElementById("descargar");
const inputArchivo = document.getElementById("inputArchivo");

//ESTADOS INICIALES - VARIABLES GLOBALES
// para el toast (para handle de cuando se carga otro archivo)
let contenedorToast;
let toastCreado = false;
//array vacío para guardar orden original
let arrayOriginal = [];
//array para guardar cumpleañeros
let arrayCumpleanieros = [];
//para guardar filtro actual
let filtroActual = "";
//para definir cuál es el orden actual. por default es ascendente
let ordenActual = "asc";

//FUNCIONES PRINCIPALES

//Crea y muestra un toast (notificación) señalando si hoy es el natalicio de algún famoso

function crearToast(mensaje) {
  //crear el contenedor del toast
  contenedorToast = document.createElement("div");
  contenedorToast.className =
    "toast-container position-fixed bottom-0 end-0 m-3";
  document.body.appendChild(contenedorToast);

  // en caso de que se ejecute una creación de toast mientras ya existía otro
  //se eliminará el toast para crear otro
  //esto sucede cuando subimos un archivo nuevamente sin recargar la página
  const toastMostrado = document.getElementById("toastCumpleanios");
  if (toastMostrado) toastMostrado.remove();

  //asignar la fecha de hoy para verificar si hay cumpleañeros
  const fechaHoy = new Date().toLocaleString("es-cl", {
    day: "numeric",
    month: "long",
  });

  //crear el toast en sí, con los elementos que solicita bootstrap
  const toast = document.createElement("div");
  toast.id = "toastCumpleanios";
  toast.classList.add("toast");
  toast.setAttribute("role", "alert");

  //crear el header
  const toastHeader = document.createElement("div");
  toastHeader.className = "toast-header text-bg-primary";

  // ~ elementos del header ~
  //insertar el texto del header
  const tituloToastHeader = document.createElement("strong");
  tituloToastHeader.className = "me-auto";
  tituloToastHeader.textContent = "Natalicios de Hoy";
  //crear el elemento para mostrar la fecha y asignársela
  const fechaActual = document.createElement("small");
  fechaActual.textContent = fechaHoy;
  //botón para cerrar el toast manualmente
  const botonCerrar = document.createElement("button");
  botonCerrar.type = "button";
  botonCerrar.className = "btn-close";
  botonCerrar.setAttribute("data-bs-dismiss", "toast");
  botonCerrar.setAttribute("aria-label", "Close");

  //agregar los elementos del header a este
  toastHeader.appendChild(tituloToastHeader);
  toastHeader.appendChild(fechaActual);
  toastHeader.appendChild(botonCerrar);

  //crear el body del toast
  const toastBody = document.createElement("div");
  toastBody.className = "toast-body";

  //crear un elemento para pushear el texto que avisará si hay cumpleañeros o no (y quiénes son)
  const mensajeToast = document.createElement("p");
  mensajeToast.textContent = mensaje;
  //agregar el texto al body
  toastBody.appendChild(mensajeToast);

  //agregar tanto el header como el body al toast
  toast.appendChild(toastHeader);
  toast.appendChild(toastBody);
  //agregar el toast a su container
  contenedorToast.appendChild(toast);

  //asignar un autohide, además de una duración de 10 segundos desde que aparece
  new bootstrap.Toast(toast, {
    autohide: true,
    delay: 10000,
  }).show();
}

//cargar los famosos desde el endpoint de la api
async function cargarBDFamosos() {
  try {
    //mostrar el spinner
    spinner.classList.remove("d-none");
    //ocultar la tabla en caso de que estuviese visible por haber cargado un archivo anteriormente
    contenedorTabla.classList.add("d-none");

    //llamar a la api y tomar su respuesta
    const response = await fetch("/api/famosos");
    if (!response.ok) throw new Error("Error al cargar famosos");

    // crear un array con los datos de los famosos a partir del json que devuleve la api
    const famosos = await response.json();
    arrayOriginal = famosos.map((famosx, index) => ({
      numero: index + 1,
      nombreFamoso: famosx.famoso,
      fechaNacimiento: famosx.fechaNacimiento,
      edad: famosx.edad,
      flagCumpleanios: famosx.flagCumpleanios,
    }));

    //recargar los nuevos datos
    aplicarFiltro();
  } catch (error) {
    console.error("Error:", error);
    alert("Error al cargar datos de famosos");
    //en caso de fallar, no se mostrará la tabla
    contenedorTabla.classList.add("d-none");
  } finally {
    //una vez se ejecute -ya sea con éxito o error- se oculta el spinner
    spinner.classList.add("d-none");
  }
}
//mostrar los valores de la tabla desde el array
function mostrarValores(arr) {
  tabla.replaceChildren(); // borra todas las filas
  //limpiar el array de cumpleañeros en caso de cargar un archivo nuevo sin recargar
  arrayCumpleanieros = [];

  //por cada famoso
  arr.forEach((famoso) => {
    //crear una fila
    const row = document.createElement("tr");
    //agregar las celdas del array
    [
      famoso.numero,
      famoso.nombreFamoso,
      famoso.fechaNacimiento,
      famoso.edad,
    ].forEach((valor, i) => {
      //crear una celda por cada campo del famoso y asignarle el valor obtenido del array
      const celda = document.createElement("td");
      celda.textContent = valor;
      //agregar cada celda a la fila del famoso
      row.appendChild(celda);
    });
    //una vez la fila ya tiene todos los valores de un famoso, agregarlo a la tabla
    tabla.appendChild(row);

    //si un famoso está de cumpleaños, agregarlo al array de cumpleañeros
    if (famoso.flagCumpleanios) {
      arrayCumpleanieros.push(famoso.nombreFamoso);
    }
  });

  // Crear el mensaje para el toast (avisar si hay cumpleañeros o no)
  let mensaje;
  if (arrayCumpleanieros.length > 1) {
    const last = arrayCumpleanieros.pop();
    mensaje = `¡Hoy es el natalicio de ${arrayCumpleanieros.join(
      ", "
    )} y ${last}! 🎉`;
  } else if (arrayCumpleanieros.length === 1) {
    mensaje = `¡Hoy es el natalicio de ${arrayCumpleanieros[0]}! 🎉`;
  } else {
    mensaje =
      "El día de hoy no ha nacido ningún famoso. 😔 ¡Intenta de nuevo mañana!";
  }

  // el toast se creará soloamente si los datos se han cargado
  if (!toastCreado) {
    crearToast(mensaje);
    toastCreado = true;
  }
}

//aplicar los filtros seleccionados
function aplicarFiltro() {
  //copiar el array con el orden original
  let resultado = [...arrayOriginal];

  // filtrar por texto
  if (filtroActual) {
    resultado = resultado.filter((famoso) =>
      famoso.nombreFamoso.toLowerCase().includes(filtroActual.toLowerCase())
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

//++++++++++++

//EVENT HANDLERS, LISTENERS

//al subir un archivo
formSubirArchivo.addEventListener("submit", async (e) => {
  //evitar la recarga de la página
  e.preventDefault();
  //ocultar el contenedor de la tabla, en caso de que ya se hubiese cargado una tabla anteriormente
  contenedorTabla.classList.add("d-none");
  //en caso de haber cargado un archivo antes, se activará la eliminación de un toast anterior
  toastCreado = false;
  //mostrar el spinner
  spinner.classList.remove("d-none");

  //el obj FormData nos ayuda a crear un objeto para hacer solicitudes con fetch
  const formData = new FormData();
  //le agregaremos como contenido el archivo cargado por el usuario
  formData.append("datosFamosos", inputArchivo.files[0]);

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
    await cargarBDFamosos();
    contenedorTabla.classList.remove("d-none");
  } catch (error) {
    console.error(error);
    alert("Error al subir archivo");
  } finally {
    //una vez termine el intento de carga del archivo, se vuelve a ocultar el spinner
    spinner.classList.add("d-none");
  }
});

// una vez que el dom se carga por completo
document.addEventListener("DOMContentLoaded", () => {
  //restablecer estados iniciales
  contenedorTabla.classList.add("d-none");
  arrayOriginal = [];
  inputvalue = "";
  inputArchivo.value = "";
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

//listener al clickear la descarga del CSV con datos normalizados
botonDescarga.addEventListener("click", () => {
  window.location.href = "/download/famosos";
});
