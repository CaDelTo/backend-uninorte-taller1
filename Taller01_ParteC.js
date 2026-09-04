// Taller 1 - Parte C: Programacion Asincrona
// Dos formas de traer todas las paginas de la API: una secuencial y otra
// concurrente con Promise.all(). Se mide el tiempo de cada una y al final se
// arma la solucion definitiva con la concurrente, que es la que pide el taller.

import {
  esEjecucionDirecta,
  esperar,
  leerInfoPaginas,
  pedirJson,
  reiniciarBloqueos,
  totalBloqueos,
  unirPaginas,
  urlsDesdePagina2,
} from "./api.js";
import { normalizarPersonajes } from "./Taller01_ParteA.js";
import {
  especies,
  humanosVivos,
  personajesEpisodios,
  personajesEpsRango,
  personajesImgEpi,
  personajesTypeBooleano,
  primerAlienF,
} from "./consultas.js";

// Estrategia 1: cada peticion espera a que termine la anterior, asi que el
// tiempo total es la suma de todas.
export async function recorrerSecuencial(urls) {
  const paginas = [];

  for (const url of urls) {
    const datos = await pedirJson(url);
    paginas.push(datos);
  }

  return paginas;
}

// Estrategia 2: las peticiones arrancan todas al tiempo (el map ya las lanza) y
// se espera una sola vez. El tiempo total se parece al de la mas lenta.
export async function recorrerConcurrente(urls) {
  return Promise.all(urls.map((url) => pedirJson(url)));
}

export async function obtenerPersonajesSecuencial() {
  const { totalPaginas, primeraPagina } = await leerInfoPaginas();
  const paginas = await recorrerSecuencial(urlsDesdePagina2(totalPaginas));
  return [...primeraPagina, ...unirPaginas(paginas)];
}

export async function obtenerPersonajesConcurrente() {
  const { totalPaginas, primeraPagina } = await leerInfoPaginas();
  const paginas = await recorrerConcurrente(urlsDesdePagina2(totalPaginas));
  return [...primeraPagina, ...unirPaginas(paginas)];
}

async function medirTiempo(etiqueta, funcion) {
  reiniciarBloqueos();
  const inicio = performance.now();
  const personajes = await funcion();
  const ms = performance.now() - inicio;

  console.log(
    `${etiqueta}: ${ms.toFixed(0)} ms, ${personajes.length} personajes, ` +
      `${totalBloqueos()} respuestas 429`
  );

  return { personajes, ms };
}

async function compararEstrategias() {
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
  const urls = urlsDesdePagina2(21); // paginas 2 a 21
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

// Solucion definitiva: los personajes traidos con Promise.all(), normalizados
// con la Parte A y pasados por las consultas de la Parte B.
function mostrarConsultas(personajes) {
  console.log("\nConsultas sobre los personajes normalizados\n");

  const vivos = humanosVivos(personajes);
  console.log(`1. Humanos vivos: ${vivos.length}`);
  console.log(`   Ejemplo: ${vivos[0].nombre}`);

  const veteranos = personajesEpisodios(personajes);
  console.log(`2. Con 20 o mas episodios: ${veteranos.length}`);

  const alien = primerAlienF(personajes);
  console.log(`3. Primera alien mujer: ${alien.nombre}`);

  console.log(`4. Hay algun personaje con type: ${personajesTypeBooleano(personajes)}`);
  console.log(`5. Todos con imagen y al menos un episodio: ${personajesImgEpi(personajes)}`);

  console.log("6. Por especie:");
  for (const [especie, datos] of Object.entries(especies(personajes))) {
    console.log(
      `   ${especie}: ${datos.cantidad} personajes, ` +
        `${datos.promedioEpisodios.toFixed(1)} episodios en promedio, ` +
        `${datos.vivos} vivos`
    );
  }

  console.log("7. Por cantidad de episodios:");
  for (const [rango, cantidad] of Object.entries(
    personajesEpsRango(personajes)
  )) {
    console.log(`   ${rango}: ${cantidad}`);
  }
}

async function main() {
  const personajesCrudos = await compararEstrategias();
  const personajes = normalizarPersonajes(personajesCrudos);

  mostrarConsultas(personajes);

  return personajes;
}

// Solo corre el main cuando se ejecuta este archivo directamente
if (esEjecucionDirecta(import.meta.url)) {
  main().catch((error) => {
    console.error("Fallo la ejecucion:", error.message);
    process.exitCode = 1;
  });
}
