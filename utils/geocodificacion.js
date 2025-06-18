require("dotenv").config();
const api_key = process.env.GOOGLE_API_KEY;
const obtenerDireccionConAPI = async (
  latitud,
  longitud,
  paisArchivo,
  areaArchivo
) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitud},${longitud}&key=${api_key}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      console.warn(
        `NO se encontraron resultados para lat:${latitud}, lng:${longitud}`
      );
      return {
        pais: paisArchivo || null,
        ciudad_estado_provincia: areaArchivo || null,
        nombre_calle: null,
        numero_calle: null,
      };
    }

    for (const result of data.results) {
      const elementosDireccion = result.address_components;

      const getLongName = (type) => {
        const elem = elementosDireccion.find((c) => c.types.includes(type));
        return elem ? elem.long_name : null;
      };

      const numero_calle = getLongName("street_number");
      const nombre_calle = getLongName("route");
      const areaAdm1 = getLongName("administrative_area_level_1");
      const areaAdm2 = getLongName("administrative_area_level_2");
      const paisAPI = getLongName("country");

      const ciudad_estado_provincia = [areaAdm2, areaAdm1]
        .filter(Boolean)
        .join(", ");

      // usaremos pais y area de la api; de no haber, se toma la del archivo txt
      const pais = paisAPI || paisArchivo || null;
      const areaAdm = ciudad_estado_provincia || areaArchivo || null;

      // slo devolvemos cuando haya pais, sino usaremos el arhcivo de texto
      if (pais) {
        return {
          numero_calle,
          nombre_calle,
          ciudad_estado_provincia: areaAdm,
          pais,
        };
      }
    }

    // fallback
    return {
      numero_calle: numero_calle || "",
      nombre_calle: nombre_calle || "",
      ciudad_estado_provincia:
        ciudad_estado_provincia || areaArchivo || "Sin dato",
      pais: pais || paisArchivo || "Sin dato",
    };
  } catch (error) {
    console.error("Error con la API:", error.message);
    return null;
  }
};

module.exports = { obtenerDireccionConAPI };
