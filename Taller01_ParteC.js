// Taller 1 - Parte C: Programacion Asincrona
// Dos formas de traer todas las paginas de la API: una secuencial y otra
// concurrente con Promise.all(). Se mide el tiempo de cada una.

const BASE_URL = "https://rickandmortyapi.com/api/character";

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// La API responde 429 cuando se le hacen muchas peticiones seguidas, y en ese
// caso manda el encabezado Retry-After con los segundos que hay que esperar.
let bloqueos = 0;

async function pedirJson(url, intentos = 5) {
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

// Arma las URL de todas las paginas a partir de info.pages, sin copiarlas a mano
async function urlsDeTodasLasPaginas() {
  const datos = await pedirJson(BASE_URL);
  const urls = [];

  for (let pagina = 1; pagina <= datos.info.pages; pagina++) {
    urls.push(`${BASE_URL}?page=${pagina}`);
  }

  return urls;
}

const unirPaginas = (paginas) =>
  paginas.reduce((todos, datos) => todos.concat(datos.results), []);

// Estrategia 1: cada peticion espera a que termine la anterior, asi que el
// tiempo total es la suma de todas.
async function recorrerSecuencial(urls) {
  const paginas = [];

  for (const url of urls) {
    const datos = await pedirJson(url);
    paginas.push(datos);
  }

  return paginas;
}

// Estrategia 2: las peticiones arrancan todas al tiempo (el map ya las lanza) y
// se espera una sola vez. El tiempo total se parece al de la mas lenta.
async function recorrerConcurrente(urls) {
  return Promise.all(urls.map((url) => pedirJson(url)));
}

export async function obtenerPersonajesSecuencial() {
  return unirPaginas(await recorrerSecuencial(await urlsDeTodasLasPaginas()));
}

export async function obtenerPersonajesConcurrente() {
  return unirPaginas(await recorrerConcurrente(await urlsDeTodasLasPaginas()));
}

async function medirTiempo(etiqueta, funcion) {
  bloqueos = 0;
  const inicio = performance.now();
  const personajes = await funcion();
  const ms = performance.now() - inicio;

  console.log(
    `${etiqueta}: ${ms.toFixed(0)} ms, ${personajes.length} personajes, ` +
      `${bloqueos} respuestas 429`
  );

  return { personajes, ms };
}

async function main() {
  console.log("Todas las paginas de la API\n");

  const secuencial = await medirTiempo(
    "Secuencial",
    obtenerPersonajesSecuencial
  );

  // Se deja enfriar el limite de la API para que la otra estrategia empiece en
  // las mismas condiciones y la comparacion sea justa.
  await esperar(15000);

  const concurrente = await medirTiempo(
    "Promise.all",
    obtenerPersonajesConcurrente
  );

  // Las dos estrategias deben traer los mismos personajes
  const iguales =
    secuencial.personajes.length === concurrente.personajes.length &&
    secuencial.personajes.every((p, i) => p.id === concurrente.personajes[i].id);

  console.log(
    `\nPromise.all fue ${(secuencial.ms / concurrente.ms).toFixed(1)} veces ` +
      `mas rapida. Mismos datos: ${iguales}`
  );

  // Misma comparacion pero con 20 paginas, que ya caben dentro del limite de la
  // API. Sin respuestas 429 de por medio se ve mejor el efecto de lanzar las
  // peticiones al tiempo.
  const urls = (await urlsDeTodasLasPaginas()).slice(0, 20);
  console.log("\nSolo 20 paginas\n");

  const secuencial20 = await medirTiempo("Secuencial", async () =>
    unirPaginas(await recorrerSecuencial(urls))
  );

  await esperar(15000);

  const concurrente20 = await medirTiempo("Promise.all", async () =>
    unirPaginas(await recorrerConcurrente(urls))
  );

  console.log(
    `\nPromise.all fue ${(secuencial20.ms / concurrente20.ms).toFixed(1)} ` +
      `veces mas rapida.`
  );

  return concurrente.personajes;
}

main();
