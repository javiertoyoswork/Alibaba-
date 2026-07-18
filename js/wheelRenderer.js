// Construye el conic-gradient y las etiquetas de la ruleta a partir de los
// premios configurados, y anima el giro hasta un premio ya decidido
// (la decisión de qué premio toca vive en weightedRandom.js, no aquí).

const MARGEN_SEGURIDAD_GRADOS = 3;

// Calcula, para cada premio, el arco [angleStart, angleEnd) que ocupa en la
// rueda (medido en grados, en sentido horario desde arriba = 0deg), a partir
// de su peso relativo al total. Segmentos con más peso -> arco más grande.
export function calcularSegmentos(premios) {
  const total = premios.reduce((suma, p) => suma + p.peso, 0);
  let acumulado = 0;
  return premios.map((premio) => {
    const angleStart = (acumulado / total) * 360;
    acumulado += premio.peso;
    const angleEnd = (acumulado / total) * 360;
    return { premio, angleStart, angleEnd };
  });
}

export function construirGradienteCss(segmentos) {
  const partes = segmentos.map(
    (s) => `${s.premio.color} ${s.angleStart}deg ${s.angleEnd}deg`
  );
  return `conic-gradient(from 0deg, ${partes.join(', ')})`;
}

// Pinta el fondo de la rueda y las etiquetas (icono + texto) de cada
// segmento. `elementoRueda` es el disco que rota; `contenedorEtiquetas` debe
// ser un hijo del mismo disco para que las etiquetas roten con él.
export function renderWheel(elementoRueda, contenedorEtiquetas, premios) {
  const segmentos = calcularSegmentos(premios);
  elementoRueda.style.background = construirGradienteCss(segmentos);

  // Radio real ya calculado por el CSS (la rueda es responsive), medido tras
  // el layout para que las etiquetas se coloquen a la distancia correcta del
  // centro sin depender de un tamaño fijo en px.
  const radio = elementoRueda.getBoundingClientRect().width / 2;
  const distanciaEtiqueta = radio * 0.62;

  contenedorEtiquetas.innerHTML = '';
  for (const { premio, angleStart, angleEnd } of segmentos) {
    const anguloMedio = (angleStart + angleEnd) / 2;
    const etiqueta = document.createElement('div');
    etiqueta.className = 'ruleta-etiqueta';
    // Se rota el eje local hasta apuntar a anguloMedio (medido en sentido
    // horario desde arriba, igual que el conic-gradient) y se desplaza a lo
    // largo de ese eje ya rotado: el texto queda radial, apuntando hacia
    // fuera desde el centro, como en la mayoría de ruletas de premios.
    etiqueta.style.transform = `rotate(${anguloMedio - 90}deg) translate(${distanciaEtiqueta}px)`;
    etiqueta.innerHTML = `<span class="ruleta-etiqueta-icono">${premio.icono}</span><span class="ruleta-etiqueta-texto">${premio.label}</span>`;
    contenedorEtiquetas.appendChild(etiqueta);
  }

  return segmentos;
}

// Dado el premio ya elegido (ver weightedRandom.js) y los segmentos ya
// pintados, calcula cuántos grados hay que rotar la rueda para que el
// puntero fijo (arriba, 0deg) acabe cayendo dentro de ese segmento.
export function calcularRotacionFinal(segmentos, premioGanador, vueltasCompletas = 5) {
  const segmento = segmentos.find((s) => s.premio.id === premioGanador.id);
  if (!segmento) {
    throw new Error(`Premio ganador "${premioGanador.id}" no está entre los segmentos pintados`);
  }

  const ancho = segmento.angleEnd - segmento.angleStart;
  const margen = Math.min(MARGEN_SEGURIDAD_GRADOS, ancho / 4);
  const anguloObjetivo =
    ancho <= margen * 2
      ? (segmento.angleStart + segmento.angleEnd) / 2
      : segmento.angleStart + margen + Math.random() * (ancho - margen * 2);

  return vueltasCompletas * 360 + (360 - anguloObjetivo);
}

// Aplica la rotación con transición CSS y resuelve la promesa cuando termina
// la animación (transitionend), para poder encadenar "mostrar el premio".
export function girarRueda(elementoRueda, gradosFinal, duracionMs) {
  return new Promise((resolve) => {
    elementoRueda.style.transition = `transform ${duracionMs}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;

    const onTransitionEnd = (evento) => {
      if (evento.target !== elementoRueda || evento.propertyName !== 'transform') return;
      elementoRueda.removeEventListener('transitionend', onTransitionEnd);
      resolve();
    };
    elementoRueda.addEventListener('transitionend', onTransitionEnd);

    // Forzar reflow antes de cambiar el transform, para que la transición
    // se dispare siempre aunque se gire varias veces seguidas.
    // eslint-disable-next-line no-unused-expressions
    elementoRueda.offsetHeight;
    elementoRueda.style.transform = `rotate(${gradosFinal}deg)`;
  });
}
