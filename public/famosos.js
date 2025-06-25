//selectores del DOM
const tabla = document.querySelector("#tablaFamosos tbody");
const input = document.getElementById("filtrar");
const spinner = document.getElementById("spinner");
const contenedorTabla = document.getElementById("containerTabla");
const formSubirArchivo = document.getElementById("examinar");
const botonSubir = document.getElementById("subir");
const botonDescarga = document.getElementById("descargar");

let toastContainer;
let toastCreated = false;
//array vacío para guardar orden original
let arrayOriginal = [];
//array y string vacíos para guardar cumpleañeros
let arrayCumpleanieros = [];
//para guardar filtro actual
let filtroActual = "";
//para definir cuál es el orden actual. por default es original
let ordenActual = "original";

function crearToast(mensaje) {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className =
      "toast-container position-fixed bottom-0 end-0 m-3";
    document.body.appendChild(toastContainer);
  }

  const existingToast = document.getElementById("toastCumpleanios");
  if (existingToast) existingToast.remove();

  const fechaHoy = new Date().toLocaleString("es-cl", {
    day: "numeric",
    month: "long",
  });

  const toastEl = document.createElement("div");
  toastEl.id = "toastCumpleanios";
  toastEl.className = "toast";
  toastEl.setAttribute("role", "alert");
  toastEl.setAttribute("aria-live", "assertive");
  toastEl.setAttribute("aria-atomic", "true");

  const toastHeader = document.createElement("div");
  toastHeader.className = "toast-header text-bg-primary";

  const headerTitle = document.createElement("strong");
  headerTitle.className = "me-auto";
  headerTitle.textContent = "Natalicios de Hoy";

  const fechaElement = document.createElement("small");
  fechaElement.textContent = fechaHoy;

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "btn-close";
  closeButton.setAttribute("data-bs-dismiss", "toast");
  closeButton.setAttribute("aria-label", "Close");

  toastHeader.appendChild(headerTitle);
  toastHeader.appendChild(fechaElement);
  toastHeader.appendChild(closeButton);

  const toastBody = document.createElement("div");
  toastBody.className = "toast-body";

  const messageElement = document.createElement("p");
  messageElement.textContent = mensaje;

  toastBody.appendChild(messageElement);

  toastEl.appendChild(toastHeader);
  toastEl.appendChild(toastBody);
  toastContainer.appendChild(toastEl);

  new bootstrap.Toast(toastEl, {
    autohide: true,
    delay: 10000,
  }).show();
}

formSubirArchivo.addEventListener("submit", async (e) => {
  e.preventDefault();
  contenedorTabla.classList.add("d-none");
  botonSubir.disabled = true;
  toastCreated = false;
  spinner.classList.remove("d-none");
  const formData = new FormData();
  formData.append("datosFamosos", inputArchivo.files[0]);
  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Error al subir archivo");
    const resultado = await response.json();
    console.log("Datos recibidos de la API:", resultado);
    spinner.classList.add("d-none");
    alert("Archivo subido correctamente");
    await cargarBDFamosos();
    contenedorTabla.classList.remove("d-none");
  } catch (error) {
    console.error(error);
    alert("Error al subir archivo");
  } finally {
    spinner.classList.add("d-none");
    botonSubir.disabled = false;
  }
});
async function cargarBDFamosos() {
  try {
    spinner.classList.remove("d-none");
    contenedorTabla.classList.add("d-none");

    const response = await fetch("/api/famosos");

    if (!response.ok) throw new Error("Error al cargar famosos"); //si falla, mostrar error
    const famosos = await response.json(); //cargar json de la api
    // asignamos un número fijo a cada famoso (así no cambian con el filtro)
    arrayOriginal = famosos.map((famosx, index) => ({
      numero: index + 1,
      nombreFamoso: famosx.famoso,
      fechaNacimiento: famosx.fechaNacimiento,
      edad: famosx.edad,
      flagCumpleanios: famosx.flagCumpleanios,
    }));
    console.log("Array original armado:", arrayOriginal);
    aplicarFiltro();
    contenedorTabla.classList.remove("d-none"); // mostrar tabla inicial
  } catch (error) {
    console.error("Error:", error);
    alert("Error al cargar datos de famosos");
    contenedorTabla.classList.add("d-none");
  } finally {
    spinner.classList.add("d-none");
  }
}

//función para mostrar los valores en la tabla
// Modified mostrarValores function without innerHTML
function mostrarValores(arr) {
  // Clear table body properly
  while (tabla.firstChild) {
    tabla.removeChild(tabla.firstChild);
  }

  arrayCumpleanieros = [];

  arr.forEach((famoso) => {
    const row = document.createElement("tr");

    const numCell = document.createElement("td");
    numCell.textContent = famoso.numero;
    row.appendChild(numCell);

    const nameCell = document.createElement("td");
    nameCell.textContent = famoso.nombreFamoso;
    row.appendChild(nameCell);

    const dateCell = document.createElement("td");
    dateCell.textContent = famoso.fechaNacimiento;
    row.appendChild(dateCell);

    const ageCell = document.createElement("td");
    ageCell.textContent = famoso.edad;
    row.appendChild(ageCell);

    tabla.appendChild(row);

    if (famoso.flagCumpleanios) {
      arrayCumpleanieros.push(famoso.nombreFamoso);
    }
  });

  // Build message
  let mensaje;
  if (arrayCumpleanieros.length > 1) {
    const last = arrayCumpleanieros.pop();
    mensaje = `¡Hoy es el cumpleaños de ${arrayCumpleanieros.join(
      ", "
    )} y ${last}! 🎉`;
  } else if (arrayCumpleanieros.length === 1) {
    mensaje = `¡Hoy es el cumpleaños de ${arrayCumpleanieros[0]}! 🎉`;
  } else {
    mensaje =
      "El día de hoy no ha nacido ningún famoso. 😔 ¡Intenta de nuevo mañana!";
  }

  // Create toast only once per data load
  if (!toastCreated) {
    crearToast(mensaje);
    toastCreated = true;
  }
}

function aplicarFiltro() {
  let resultado = [...arrayOriginal]; //copiar el contenido de un array / no su referencia

  // filtro por texto (input de texto)
  if (filtroActual) {
    //según el filtro aplicado
    resultado = resultado.filter((famoso) =>
      famoso.nombreFamoso.toLowerCase().includes(filtroActual.toLowerCase())
    );
  }

  // aplicar orden
  if (ordenActual === "asc") {
    //si el orden es ascendente A-Z
    resultado.sort((a, b) => a.nombreFamoso.localeCompare(b.nombreFamoso));
  } else if (ordenActual === "desc") {
    //si el orden es descennte Z-A
    resultado.sort((a, b) => b.nombreFamoso.localeCompare(a.nombreFamoso));
  }

  mostrarValores(resultado);
}

hoy.textContent = fecha;

//LISTENERS
//esperar que el dom esté cargado x completo
document.addEventListener("DOMContentLoaded", () => {
  contenedorTabla.classList.add("d-none");
  arrayOriginal = [];
  inputArchivo.value = "";
  //listener cuando se escribe algo en el input
  input.addEventListener("keyup", () => {
    filtroActual = input.value; //guardar string de filtro
    aplicarFiltro();
  });

  document.querySelectorAll(".dropdown-menu li a").forEach((link) => {
    //listener para cada opción del dropdown de filtro
    link.addEventListener("click", (e) => {
      e.preventDefault();
      ordenActual = link.getAttribute("data-order"); //tomar selección de opción de filtro
      aplicarFiltro(); //aplicar el filtro
    });
  });

  //recargar BD con los filtros seleccionados
  cargarBDFamosos();
});

botonDescarga.addEventListener("click", () => {
  window.location.href = "/download/famosos";
});
