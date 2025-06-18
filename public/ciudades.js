//selectores del DOM
const tabla = document.querySelector("#tablaCiudades tbody");
const input = document.getElementById("filtrar");

//array vacío para guardar orden original
let arrayOriginal = [];
//para guardar filtro actual
let filtroActual = "";
//para definir cuál es el orden actual. por default es original
let ordenActual = "original";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//VERSION 2: Mantener los index independientes del filtro aplicado a las ciudades (empieza del index original)

async function cargarBDCiudades() {
  try {
    const response = await fetch("/api/ciudades"); //llamar a la api
    if (!response.ok) throw new Error("Error al cargar ciudades"); //si falla, mostrar error
    const ciudades = await response.json(); //cargar json de la api
    // asignamos un número fijo a cada ciudad (así no cambian con el filtro)
    arrayOriginal = ciudades.map((nombre, index) => ({
      numero: index + 1,
      nombre: nombre,
    }));

    aplicarFiltro(); // mostrar tabla inicial
  } catch (error) {
    console.error("Error:", error);
  }
}

//función para mostrar los valores en la tabla
function mostrarValores(arr) {
  tabla.innerHTML = ""; // Limpiar tabla
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

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// //VERSION 1: Crear # index según filtro aplicado (siempre empieza del 1)
// //cargar BD
// async function cargarBDCiudades() {
//   try {
//     const response = await fetch("/api/ciudades"); //llamar a la api
//     if (!response.ok) throw new Error("Error al cargar ciudades"); //si falla, mostrar error
//     const ciudades = await response.json(); //parsear json de la api
//     arrayOriginal = [...ciudades]; //crear copia de array original con nombre ciudades
//     aplicarFiltro(); // mostrar tabla inicial
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }

// //mostrar valores en la tabla
// function mostrarValores(arr) {
//   tabla.innerHTML = ""; // limpiar tabla
//   arr.forEach((ciudad, index) => {
//     const row = document.createElement("tr"); //crear una fila para cada ergistro

//     const celdaIndex = document.createElement("td"); //crear una celda para el # ciudad
//     celdaIndex.textContent = index + 1; //# de ciudad
//     row.appendChild(celdaIndex); //agregar a la fila

//     const celdaCiudad = document.createElement("td"); //crear celda para nombre ciudad
//     celdaCiudad.textContent = ciudad;
//     row.appendChild(celdaCiudad);

//     tabla.appendChild(row); //agregar fila a la tabla
//   });
// }

// //aplicar filtros en la tabla
// function aplicarFiltro() {
//   let resultado = [...arrayOriginal]; //copiar el contenido de un array / no su referencia

//   // filtro por texto (input de texto)
//   if (filtroActual) {
//     //según el filtro aplicado
//     resultado = resultado.filter(
//       (ciudad) => ciudad.toLowerCase().includes(filtroActual.toLowerCase()) //mostrar las ciudades que contengan el string ingresado
//     );
//   }

//   // aplicar orden
//   if (ordenActual === "asc") {
//     //si el orden es ascendente A-Z
//     resultado.sort((a, b) => a.localeCompare(b));
//   } else if (ordenActual === "desc") {
//     //si el orden es descennte Z-A
//     resultado.sort((a, b) => b.localeCompare(a));
//   }

//   mostrarValores(resultado);
// }

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//LISTENERS
//esperar que el dom esté cargado x completo
document.addEventListener("DOMContentLoaded", () => {
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
