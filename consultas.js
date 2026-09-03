export function humanosVivos(personajes) { 
    return personajes.filter(
        p => p.estado === "Alive" && p.especie === "Human"
    );
}

export function personajesEpisodios(personajes) { 
    return personajes.filter(
        p => p.cantidadEpisodios >= 20
    );
}

export function primerAlienF(personajes) {
    return personajes.find(
        p => p.especie === "Alien" && p.genero === "Female"
    );
}

export function personajesTypeBooleano(personajes) {
      return personajes.some(
        p => p.tipo.trim() !== ""
    );
}

export function personajesImgEpi(personajes) {
    return personajes.every(
        p => p.imagen.trim() !== "" && p.cantidadEpisodios >=1
    );
}

export function especies(personajes) {
    const a = personajes.reduce((gru, p) => {
        if (!gru[p.especie]) {
            gru[p.especie] = {cantidad: 0, sumaEpisodios: 0, vivos:0};
        }
        gru[p.especie].cantidad++;
        gru[p.especie].sumaEpisodios += p.cantidadEpisodios;
        if (p.estado === "Alive") {
            gru[p.especie].vivos++;
        }
        return gru;
    }, {});

    return Object.entries(a).reduce((res, [especie, datos]) => {
        res[especie] = {
            cantidad: datos.cantidad,  
            promedioEpisodios: datos.sumaEpisodios / datos.cantidad, 
            vivos: datos.vivos   
        };
        return res;
    }, {})
}

export function personajesEpsRango(personajes) { 
    return personajes.reduce((rangos, p) => {
        const eps = p.cantidadEpisodios;
        if (eps <= 5) rangos["1-5"] += 1;
        else if (eps <= 15) rangos["6-15"] += 1;
        else if (eps <= 30) rangos["16-30"] += 1;
        else rangos["30+"] += 1;
        return rangos;
    }, 

    {"1-5": 0, "6-15": 0, "16-30": 0, "30+": 0}

    );
}

