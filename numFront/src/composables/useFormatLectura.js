// src/composables/useFormatLectura.js

export function useFormatLectura() {
  const formatearTextoIA = (textoCrudo) => {
    if (!textoCrudo) return '';

    let textoFormateado = textoCrudo;

    // 1. Formatear los títulos (### Texto)
    // Busca "### " seguido de cualquier texto hasta el final del renglón.
    // Lo envuelve en un span con una clase para hacerlo mayúscula y negrilla.
    textoFormateado = textoFormateado.replace(
      /###\s*(.*)/g, 
      '<span class="lectura-titulo">$1</span>'
    );

    // 2. Formatear la negrilla+cursiva (**texto**)
    // Busca todo lo que esté entre dos asteriscos dobles.
    textoFormateado = textoFormateado.replace(
      /\*\*(.*?)\*\*/g, 
      '<strong class="lectura-destacado"><em>$1</em></strong>'
    );

    // Devolvemos el HTML listo para inyectar
    return textoFormateado;
  };

  return { formatearTextoIA };
}