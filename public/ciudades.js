//selectores del DOM
const tabla = document.querySelector("#tablaCiudades tbody");
const input = document.getElementById("filtrar");
const spinner = document.getElementById("spinner");
const contenedorTabla = document.getElementById("containerTabla");
const formSubirArchivo = document.getElementById("examinar");
const botonSubir = document.getElementById("subir");
const inputFile = document.getElementById("inputArchivo");
const botonDescarga = document.getElementById("descargar");

//array vacío para guardar orden original
let arrayOriginal = [];
//para guardar filtro actual
let filtroActual = "";
//para definir cuál es el orden actual. por default es original
let ordenActual = "original";

formSubirArchivo.addEventListener("submit", async (e) => {
  e.preventDefault();
  botonSubir.disabled = true;
  spinner.classList.remove("d-none");
  const formData = new FormData();
  formData.append("datosCiudades", inputArchivo.files[0]);
  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Error al subir archivo");
    const resultado = await response.json();
    spinner.classList.add("d-none");
    alert("Archivo subido correctamente");
    await cargarBDCiudades();
    contenedorTabla.classList.remove("d-none");
  } catch {
    console.error(error);
    alert("Error al subir archivo");
  } finally {
    spinner.classList.add("d-none");
    botonSubir.disabled = false;
  }
});

async function cargarBDCiudades() {
  try {
    const response = await fetch("/api/ciudades"); //llamar a la api
    if (!response.ok) throw new Error("Error al cargar ciudades"); //si falla, mostrar error
    const ciudades = await response.json(); //cargar json de la api
    // asignamos un número fijo a cada ciudad (así no cambian con el filtro)
    arrayOriginal = ciudades.map((ciudad, index) => ({
      numero: index + 1,
      nombre: ciudad.ciudad,
    }));
    aplicarFiltro(); // mostrar tabla inicial
  } catch (error) {
    console.error("Error:", error);
    alert("No se pudieron cargar las ciudades.");
  } finally {
    spinner.classList.add("d-none");
  }
}

//función para mostrar los valores en la tabla
function mostrarValores(arr) {
  arr.forEach((ciudad) => {
    const row = document.createElement("tr"); //crear una fila para cada ergistro
    [ciudad.numero, ciudad.nombre].forEach((valor, i) => {
      //agregar celdas del array original (número y nombre)
      const celda = document.createElement("td");
      celda.textContent = valor;
      row.appendChild(celda);
    });
    tabla.appendChild(row); //agregar fila a la tabla
  });
}

function aplicarFiltro() {
  let resultado = [...arrayOriginal]; //copiar el contenido de un array / no su referencia

  // filtro por texto (input de texto)
  if (filtroActual) {
    //según el filtro aplicado
    resultado = resultado.filter(
      (ciudad) =>
        ciudad.nombre.toLowerCase().includes(filtroActual.toLowerCase()) //mostrar las ciudades que contengan el string ingresado
    );
  }

  // aplicar orden
  if (ordenActual === "asc") {
    //si el orden es ascendente A-Z
    resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
  } else if (ordenActual === "desc") {
    //si el orden es descennte Z-A
    resultado.sort((a, b) => b.nombre.localeCompare(a.nombre));
  }

  mostrarValores(resultado);
}

//LISTENERS
//esperar que el dom esté cargado x completo
document.addEventListener("DOMContentLoaded", () => {
  contenedorTabla.classList.add("d-none"); // oculta tabla al inicio
  contenedorTabla.classList.remove("d-block");
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
  //recargar BD de ciudades con los filtros seleccionados
  cargarBDCiudades();
});

botonDescarga.addEventListener("click", () => {
  window.location.href = "/download/ciudades";
});
