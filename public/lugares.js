const tabla = document.querySelector("#tablaLugares tbody");
const input = document.getElementById("filtrar");
const toastElList = document.querySelectorAll(".toast");

let arrayOriginal = [];
let filtroActual = "";
let ordenActual = "original";

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

  cargarBDLugares();
});
