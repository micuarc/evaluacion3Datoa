//selectores del DOM
const tabla = document.querySelector("#tablaFamosos tbody");
const input = document.getElementById("filtrar");
const toastElList = document.querySelectorAll(".toast");
const hoy = document.getElementById("fechaDeHoy");
const famososDeCumpleanios = document.getElementById("famososCumpleanieros");
const contenedorTabla = document.getElementById("containerTabla");
const formSubirArchivo = document.getElementById("examinar");
const botonSubir = document.getElementById("subir");
const botonDescarga = document.getElementById("descargar");

//array vacío para guardar orden original
let arrayOriginal = [];
//array y string vacíos para guardar cumpleañeros
let arrayCumpleanieros = [];
let stringCumpleanieros;
//para guardar filtro actual
let filtroActual = "";
//para definir cuál es el orden actual. por default es original
let ordenActual = "original";

formSubirArchivo.addEventListener("submit", async (e) => {
  e.preventDefault();
  botonSubir.disabled = true;
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
    const response = await fetch("/api/famosos"); //llamar a la api
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
    console.log("Array original armado:", arrayOriginal); // <-- Y este también
    aplicarFiltro(); // mostrar tabla inicial
  } catch (error) {
    console.error("Error:", error);
  }
}

//función para mostrar los valores en la tabla
function mostrarValores(arr) {
  arrayCumpleanieros = [];
  arr.forEach((famoso) => {
    const row = document.createElement("tr"); //crear una fila para cada ergistro
    [
      famoso.numero,
      famoso.nombreFamoso,
      famoso.fechaNacimiento,
      famoso.edad,
    ].forEach((valor, i) => {
      //agregar celdas del array original (número y nombre)
      const celda = document.createElement("td");
      celda.textContent = valor;
      row.appendChild(celda);
    });
    tabla.appendChild(row); //agregar fila a la tabla
    if (famoso.flagCumpleanios) {
      arrayCumpleanieros.push(famoso.nombreFamoso);
    }
  });
  if (arrayCumpleanieros.length > 1) {
    stringCumpleanieros = [
      arrayCumpleanieros.slice(0, -1).join(", "),
      arrayCumpleanieros.slice(-1)[0],
    ].join(arrayCumpleanieros.length < 2 ? "" : " y ");
  } else if (arrayCumpleanieros.length === 1) {
    stringCumpleanieros = arrayCumpleanieros[0];
  }
  if (arrayCumpleanieros.length > 0) {
    famososDeCumpleanios.textContent = `¡Hoy es el cumpleaños de  ${stringCumpleanieros}! 🎉`;
  } else {
    famososDeCumpleanios.textContent =
      "El día de hoy no ha nacido ningún famoso. 😔 ¡Intenta de nuevo mañana!";
  }
}

function aplicarFiltro() {
  let resultado = [...arrayOriginal]; //copiar el contenido de un array / no su referencia

  // filtro por texto (input de texto)
  if (filtroActual) {
    //según el filtro aplicado
    resultado = resultado.filter(
      (famoso) =>
        famoso.nombreFamoso.toLowerCase().includes(filtroActual.toLowerCase()) //mostrar los famosos que contengan el string ingresado
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

const fecha = new Date().toLocaleString("es-cl", {
  day: "numeric",
  month: "long",
});

hoy.textContent = fecha;

//LISTENERS
//esperar que el dom esté cargado x completo
document.addEventListener("DOMContentLoaded", () => {
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
  const toastList = [...toastElList].map((toastEl) =>
    new bootstrap.Toast(toastEl).show()
  );
  //recargar BD con los filtros seleccionados
  cargarBDFamosos();
});

botonDescarga.addEventListener("click", () => {
  window.location.href = "/download/famosos";
});
