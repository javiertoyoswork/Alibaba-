import { elegirPremio } from './weightedRandom.js';
import { renderWheel, calcularRotacionFinal, girarRueda } from './wheelRenderer.js';
import { getSpinsAvailable, consumeSpin } from './creditsProvider.js';
import { getCreditos } from './wallet.js';

const NIVELES_VALIDOS = ['bronce', 'plata', 'oro'];
const CONFIG_POR_NIVEL = {
  bronce: { archivo: './js/config/premios-bronce.json', duracionMs: 4000, vueltas: 4, particulas: 8 },
  plata: { archivo: './js/config/premios-plata.json', duracionMs: 5000, vueltas: 5, particulas: 18 },
  oro: { archivo: './js/config/premios-oro.json', duracionMs: 6000, vueltas: 7, particulas: 35 },
};

function leerNivel() {
  const params = new URLSearchParams(window.location.search);
  return NIVELES_VALIDOS.includes(params.get('nivel')) ? params.get('nivel') : 'bronce';
}

async function cargarConfig(nivel) {
  const respuesta = await fetch(CONFIG_POR_NIVEL[nivel].archivo);
  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar la configuración de premios para "${nivel}"`);
  }
  return respuesta.json();
}

function lanzarParticulas(contenedor, cantidad, colores) {
  for (let i = 0; i < cantidad; i++) {
    const particula = document.createElement('div');
    particula.className = 'particula';
    particula.style.setProperty('--color', colores[i % colores.length]);
    particula.style.setProperty('--x', `${(Math.random() - 0.5) * 300}px`);
    particula.style.setProperty('--y', `${(Math.random() - 0.5) * 300}px`);
    particula.style.setProperty('--delay', `${Math.random() * 200}ms`);
    contenedor.appendChild(particula);
    particula.addEventListener('animationend', () => particula.remove());
  }
}

async function actualizarEstadoBoton({ boton, estadoTexto, costeCreditos }) {
  const estado = await getSpinsAvailable(costeCreditos);
  boton.disabled = !estado.disponible;
  estadoTexto.textContent = estado.disponible
    ? `Coste de esta tirada: ${costeCreditos} créditos (${estado.motivo}).`
    : `No puedes tirar todavía: ${estado.motivo}.`;
  return estado;
}

async function init() {
  const nivel = leerNivel();
  const config = CONFIG_POR_NIVEL[nivel];

  document.body.dataset.nivel = nivel;

  const configPremios = await cargarConfig(nivel);
  const costeCreditos = configPremios.costeCreditos;

  const titulo = document.getElementById('ruleta-titulo');
  const rueda = document.getElementById('rueda');
  const etiquetas = document.getElementById('etiquetas');
  const boton = document.getElementById('girar');
  const estadoTexto = document.getElementById('estado-texto');
  const modal = document.getElementById('modal-premio');
  const modalTexto = document.getElementById('modal-premio-texto');
  const modalCerrar = document.getElementById('modal-premio-cerrar');
  const particulasContenedor = document.getElementById('particulas');

  titulo.textContent = configPremios.nombreVisible;

  const segmentos = renderWheel(rueda, etiquetas, configPremios.premios);

  await actualizarEstadoBoton({ boton, estadoTexto, costeCreditos });

  boton.addEventListener('click', async () => {
    boton.disabled = true;

    const premioGanador = elegirPremio(configPremios.premios);
    const gradosFinal = calcularRotacionFinal(segmentos, premioGanador, config.vueltas);

    await girarRueda(rueda, gradosFinal, config.duracionMs);

    if (premioGanador.tipo !== 'sin_premio') {
      const colores = configPremios.premios.map((p) => p.color);
      lanzarParticulas(particulasContenedor, config.particulas, colores);
    }

    modalTexto.innerHTML = `<span class="modal-icono">${premioGanador.icono}</span><strong>${premioGanador.label}</strong>`;
    modal.classList.remove('oculto');

    consumeSpin(costeCreditos);
    await actualizarEstadoBoton({ boton, estadoTexto, costeCreditos });
  });

  modalCerrar.addEventListener('click', () => {
    modal.classList.add('oculto');
  });
}

init().catch((error) => {
  console.error(error);
  document.getElementById('estado-texto').textContent = `Error: ${error.message}`;
});
