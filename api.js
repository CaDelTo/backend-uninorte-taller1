// Funciones compartidas para consultar la API de Rick and Morty.
// Las usan tanto la Parte A como la Parte C, para no repetir el codigo de las
// peticiones en cada archivo.

import { pathToFileURL } from "node:url";

export const BASE_URL = "https://rickandmortyapi.com/api/character";

export const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Cuenta las veces que la API nos respondio 429. Sirve para la comparacion de
// estrategias de la Parte C.
let bloqueos = 0;
export const reiniciarBloqueos = () => (bloqueos = 0);
export const totalBloqueos = () => bloqueos;

// La API responde 429 cuando se le hacen muchas peticiones seguidas, y en ese
// caso manda el encabezado Retry-After con los segundos que hay que esperar.
export async function pedirJson(url, intentos = 5) {
  for (let i = 1; i <= intentos; i++) {
    const respuesta = await fetch(url);

    if (respuesta.status === 429) {
      bloqueos++;
      const segundos = Number(respuesta.headers.get("retry-after")) || 2 ** i;
      await esperar(segundos * 1000);
      continue;
    }

    if (!respuesta.ok) {
      throw new Error(`Error al consultar ${url}: ${respuesta.status}`);
    }

    return respuesta.json();
  }

  throw new Error(`Se agotaron los reintentos para ${url}`);
}

// Primera peticion del recorrido. Devuelve cuantas paginas hay y ademas los
// personajes de esa primera pagina, para no tener que volver a pedirla.
export async function leerInfoPaginas() {
  const datos = await pedirJson(BASE_URL);
  return { totalPaginas: datos.info.pages, primeraPagina: datos.results };
}

// Arma las URL de la pagina 2 en adelante a partir de info.pages, sin copiarlas
// a mano. La pagina 1 ya viene en leerInfoPaginas().
export function urlsDesdePagina2(totalPaginas) {
  const urls = [];

  for (let pagina = 2; pagina <= totalPaginas; pagina++) {
    urls.push(`${BASE_URL}?page=${pagina}`);
  }

  return urls;
}

// Une los results de varias paginas en un solo arreglo de personajes.
export const unirPaginas = (paginas) =>
  paginas.reduce((todos, datos) => todos.concat(datos.results), []);

// True solo si el archivo se esta corriendo directo con node, y no importado
// desde otro modulo. Evita que importar una funcion dispare el main().
// Si no hay argv[1] es porque node se llamo con -e o en la consola interactiva,
// y en ese caso tampoco se esta ejecutando el archivo directamente.
export const esEjecucionDirecta = (urlDelModulo) =>
  Boolean(process.argv[1]) &&
  urlDelModulo === pathToFileURL(process.argv[1]).href;
