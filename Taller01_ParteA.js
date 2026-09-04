// Taller 1 - Parte A: Normalizacion con map
//
// 1. Descubre automaticamente cuantas paginas tiene la API.
// 2. Recorre todas las paginas y junta los personajes en un solo arreglo.
// 3. Normaliza ese arreglo con .map() a la estructura pedida.

import {
  esEjecucionDirecta,
  esperar,
  leerInfoPaginas,
  pedirJson,
  urlsDesdePagina2,
} from "./api.js";

// Paso 1: traer todos los personajes de todas las paginas
export async function obtenerTodosLosPersonajes() {
  const { totalPaginas, primeraPagina } = await leerInfoPaginas();
  console.log(`La API tiene ${totalPaginas} paginas.`);

  // El arreglo unico arranca con los personajes de la pagina 1.
  const todosLosPersonajes = [...primeraPagina];

  // De la pagina 2 hasta la ultima, una por una (secuencial).
  for (const url of urlsDesdePagina2(totalPaginas)) {
    const datos = await pedirJson(url);
    todosLosPersonajes.push(...datos.results);
    await esperar(250); // pausa corta para no saturar la API
  }

  console.log(`Total de personajes obtenidos: ${todosLosPersonajes.length}`);
  return todosLosPersonajes;
}

// Paso 2: normalizar con .map() a la estructura pedida
export function normalizarPersonajes(personajes) {
  return personajes.map((personaje) => ({
    id: personaje.id,
    nombre: personaje.name,
    estado: personaje.status,
    especie: personaje.species,
    tipo: personaje.type,
    genero: personaje.gender,
    origen: personaje.origin.name,
    ubicacionActual: personaje.location.name,
    cantidadEpisodios: personaje.episode.length,
    imagen: personaje.image,
  }));
}

async function main() {
  console.log("Consultando la API de Rick and Morty...\n");

  const personajesCrudos = await obtenerTodosLosPersonajes();
  const personajesNormalizados = normalizarPersonajes(personajesCrudos);

  console.log("\nPrimeros 3 personajes normalizados:");
  console.log(JSON.stringify(personajesNormalizados.slice(0, 3), null, 2));

  return personajesNormalizados;
}

// Solo corre el main cuando se ejecuta este archivo directamente
if (esEjecucionDirecta(import.meta.url)) {
  main().catch((error) => {
    console.error("Fallo la ejecucion:", error.message);
    process.exitCode = 1;
  });
}
