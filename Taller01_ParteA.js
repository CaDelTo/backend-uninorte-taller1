// Taller 1 - Parte A: Normalizacion con map
//
// 1. Descubre automaticamente cuantas paginas tiene la API.
// 2. Recorre todas las paginas y junta los personajes en un solo arreglo.
// 3. Normaliza ese arreglo con .map() a la estructura pedida.

const BASE_URL = "https://rickandmortyapi.com/api/character";

// Pausa de "ms" milisegundos. Se usa con: await esperar(250)
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Pide una URL y devuelve el JSON. Si la API responde 429 (demasiadas
// peticiones), espera un momento y reintenta.
async function pedirJson(url, intentos = 5) {
  const respuesta = await fetch(url);

  if (respuesta.status === 429 && intentos > 0) {
    const esperaMs = (6 - intentos) * 3000; // 3s, 6s, 9s, 12s, 15s
    console.log(`429 en ${url}, reintento en ${esperaMs / 1000}s`);
    await esperar(esperaMs);
    return pedirJson(url, intentos - 1);
  }

  if (!respuesta.ok) {
    throw new Error(`Error al consultar ${url}: ${respuesta.status}`);
  }

  return respuesta.json();
}

// Paso 1: traer todos los personajes de todas las paginas
async function obtenerTodosLosPersonajes() {
  // Primera peticion: sirve para leer info.pages (cuantas paginas hay).
  const primerosDatos = await pedirJson(BASE_URL);
  const totalPaginas = primerosDatos.info.pages;
  console.log(`La API tiene ${totalPaginas} paginas.`);

  // El arreglo unico arranca con los personajes de la pagina 1.
  let todosLosPersonajes = [...primerosDatos.results];

  // De la pagina 2 hasta la ultima, una por una (secuencial).
  for (let pagina = 2; pagina <= totalPaginas; pagina++) {
    const datos = await pedirJson(`${BASE_URL}?page=${pagina}`);
    todosLosPersonajes.push(...datos.results);
    await esperar(250); // pausa corta para no saturar la API
  }

  console.log(`Total de personajes obtenidos: ${todosLosPersonajes.length}`);
  return todosLosPersonajes;
}

// Paso 2: normalizar con .map() a la estructura pedida
function normalizarPersonajes(personajes) {
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

main();
