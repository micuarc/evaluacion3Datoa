const tabla = document.querySelector("#tablaLugares tbody");
const input = document.getElementById("filtrar");
const contenedorTabla = document.getElementById("containerTabla");
const formSubirArchivo = document.getElementById("examinar");
const botonSubir = document.getElementById("subir");
const botonDescarga = document.getElementById("descargar");

let arrayOriginal = [];
let filtroActual = "";
let ordenActual = "original";

formSubirArchivo.addEventListener("submit", async (e) => {
  e.preventDefault();
  spinner.classList.add("d-block");
  botonSubir.disabled = true;
  const formData = new FormData();
  formData.append("datosLugares", inputArchivo.files[0]);
  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Error al subir archivo");
    const resultado = await response.json();
    alert("Archivo subido correctamente");
    await cargarBDLugares();
    contenedorTabla.classList.remove("d-none");
    contenedorTabla.classList.add("d-block");
  } catch {
    console.error(error);
    alert("Error al subir archivo");
  } finally {
    spinner.classList.remove("d-block");
    spinner.classList.add("d-none");
    botonSubir.disabled = false;
  }
});
async function cargarBDLugares() {
  try {
    const response = await fetch("/api/lugares");
    if (!response.ok) throw new Error("Error al cargar lugares");

    const lugares = await response.json();

    arrayOriginal = lugares.map((lugar, index) => ({
      numero: index + 1,
      nombreLugar: lugar.nombre,
      calle: lugar.nombre_calle,
      numeroCalle: lugar.numero_calle,
      area: lugar.ciudad_estado_provincia,
      pais: lugar.pais,
      latitud: lugar.latitud,
      longitud: lugar.longitud,
    }));
    aplicarFiltro();
  } catch (error) {
    console.error("Error:", error);
  }
}

function mostrarValores(arr) {
  tabla.innerHTML = "";
  arr.forEach((lugar) => {
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
      const celda = document.createElement("td");
      celda.textContent = valor;
      row.appendChild(celda);
    });
    tabla.appendChild(row);
  });
}

function aplicarFiltro() {
  let resultado = [...arrayOriginal];
  if (filtroActual) {
    resultado = resultado.filter((lugar) =>
      lugar.nombreLugar.toLowerCase().includes(filtroActual.toLowerCase())
    );
  }

  if (ordenActual === "asc") {
    resultado.sort((a, b) => a.nombreLugar.localeCompare(b.nombreLugar));
  } else if (ordenActual === "desc") {
    resultado.sort((a, b) => b.nombreLugar.localeCompare(a.nombreLugar));
  }

  mostrarValores(resultado);
}

document.addEventListener("DOMContentLoaded", () => {
  arrayOriginal = [];
  tabla.innerHTML = "";
  contenedorTabla.classList.remove("d-block");
  contenedorTabla.classList.add("d-none");

  input?.addEventListener("keyup", () => {
    filtroActual = input.value;
    aplicarFiltro();
  });

  document.querySelectorAll(".dropdown-menu li a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      ordenActual = link.getAttribute("data-order");
      aplicarFiltro();
    });
  });
});

botonDescarga.addEventListener("click", () => {
  window.location.href = "/download/lugares";
});
