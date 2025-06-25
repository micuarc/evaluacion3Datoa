//SELECTORES DEL DOM
const tabla = document.querySelector("#tablaCiudades tbody");
const input = document.getElementById("filtrar");
const spinner = document.getElementById("spinner");
const contenedorTabla = document.getElementById("containerTabla");
const formSubirArchivo = document.getElementById("examinar");
const botonSubir = document.getElementById("subir");
const inputFile = document.getElementById("inputArchivo");
const botonDescarga = document.getElementById("descargar");

// +++++++++++++++++++++

//ESTADOS INICIALES

//array vacío para guardar orden original
let arrayOriginal = [];
//para guardar filtro actual
let filtroActual = "";
//para definir cuál es el orden actual. por default es ascendente
let ordenActual = "asc";

// +++++++++++++++++++++

//FUNCIONES PRINCIPALES DEL FRONT

//cargar los datos desde la api de ciudades y guardarlos en un array
async function cargarBDCiudades() {
  try {
    //mostrar el spinner
    spinner.classList.remove("d-none");
    //ocultar la tabla en caso de que estuviese visible por haber cargado un archivo anteriormente
    contenedorTabla.classList.add("d-none");

    //llamar a la api y tomar su respuesta
    const response = await fetch("/api/ciudades");
    //si falla, mostrar error
    if (!response.ok) throw new Error("Error al cargar ciudades");
    //cargar json de la api
    const ciudades = await response.json();
    // asignamos un número fijo a cada ciudad (así no cambian con el filtro)
    arrayOriginal = ciudades.map((ciudad, index) => ({
      numero: index + 1,
      nombre: ciudad.ciudad,
    }));
    //recargar los nuevos datos
    aplicarFiltro();
  } catch (error) {
    console.error("Error:", error);
    alert("No se pudieron cargar las ciudades.");
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

  //por cada ciudad
  arr.forEach((ciudad) => {
    //crear una fila para cada ergistro
    const row = document.createElement("tr");
    //agregar celdas del array original (número y nombre)
    [ciudad.numero, ciudad.nombre].forEach((valor, i) => {
      const celda = document.createElement("td");
      celda.textContent = valor;
      //agregarlas a la fila de la ciudad procesada
      row.appendChild(celda);
    });
    //agregar fila de una ciudad a la tabla
    tabla.appendChild(row);
  });
}

//aplicar filtros de busqueda por texto y el orden seleccionado
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

// +++++++++++++++++++++

//EVENTOS Y LISTENERS

//Subir un archivo por normalizar
formSubirArchivo.addEventListener("submit", async (e) => {
  e.preventDefault();
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
  }
});

// Cuando se cargue la página
document.addEventListener("DOMContentLoaded", () => {
  //restablecer estados iniciales
  arrayOriginal = [];
  input.value = "";
  inputFile.value = "";
  tabla.replaceChildren();
  contenedorTabla.classList.add("d-none"); // oculta tabla al inicio
  contenedorTabla.classList.remove("d-block");
});

//listener cuando se escribe algo en el input
input.addEventListener("keyup", () => {
  filtroActual = input.value; //guardar string de filtro
  aplicarFiltro();
});

//listener para cuando se selecciona una opcion del dropdown
document.querySelectorAll(".dropdown-menu li a").forEach((link) => {
  //listener para cada opción del dropdown de filtro
  link.addEventListener("click", (e) => {
    e.preventDefault();
    ordenActual = link.getAttribute("data-order"); //tomar selección de opción de filtro
    aplicarFiltro(); //aplicar el filtro
  });
});

//Descargar el CSV con datos normalizados
botonDescarga.addEventListener("click", () => {
  window.location.href = "/download/ciudades";
});
