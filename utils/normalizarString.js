module.exports = {
  normalizarString: (str) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ñ/g, "n")
      .replace(/Ñ/g, "N")
      .replace(/ß/g, "ss")
      .replace(/ẞ/g, "Ss");
  },

  normalizarCaseString: (str) => {
    //si mi string es BUENOS aires
    return (
      str
        .split(" ")
        //crea un string de tipo ["BUENOS", "aires"]
        .map(
          //toma cada palabra: una iteración para BUENOS, otra iteración para aires
          (word) =>
            //tomo la primera letra del string y la hago mayúscula
            // B de "BUENOS" -> B; a de "aires" -> A
            word.charAt(0).toUpperCase() +
            //tomo desde la segunda letra del string y lo hago en minúsculas
            // "BUENOS" -> UENOS -> uenos; "aires" -> "ires" -> "ires"
            word.slice(1).toLowerCase()
        )
        .join(" ")
    );
  },
};
