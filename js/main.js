import { elegirPremio } from './weightedRandom.js';
import { renderWheel, calcularRotacionFinal, girarRueda } from './wheelRenderer.js';
import { getSpinsAvailable, consumeSpin } from './creditsProvider.js';

const NIVELES_VALIDOS = ['bronce', 'plata', 'oro'];
const CONFIG_POR_NIVEL = {
  bronce: { archivo: './js/config/premios-bronce.json', duracionMs: 4000, vueltas: 4, particulas: 8 },
  plata: { archivo: './js/config/premios-plata.json', duracionMs: 5000, vueltas: 5, particulas: 18 },
  oro: { archivo: './js/config/premios-oro.json', duracionMs: 6000, vueltas: 7, particulas: 35 },
};

function leerParametros() {
  const params = new URLSearchParams(window.location.search);
  const nivel = NIVELES_VALIDOS.includes(params.get('nivel')) ? params.get('nivel') : 'bronce';
  const clientId = params.get('cliente') || 'demo';
  return { nivel, clientId };
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

async function actualizarEstadoBoton({ boton, estadoTexto, clientId, nivel }) {
  const estado = await getSpinsAvailable(clientId, nivel);
  boton.disabled = !estado.disponible;
  estadoTexto.textContent = estado.disponible
    ? '¡Tienes una tirada disponible!'
    : `Sin tirada disponible (${estado.motivo}).`;
  return estado;
}

async function init() {
  const { nivel, clientId } = leerParametros();
  const config = CONFIG_POR_NIVEL[nivel];

  document.body.dataset.nivel = nivel;

  const config_premios = await cargarConfig(nivel);
  const titulo = document.getElementById('ruleta-titulo');
  const rueda = document.getElementById('rueda');
  const etiquetas = document.getElementById('etiquetas');
  const boton = document.getElementById('girar');
  const estadoTexto = document.getElementById('estado-texto');
  const modal = document.getElementById('modal-premio');
  const modalTexto = document.getElementById('modal-premio-texto');
  const modalCerrar = document.getElementById('modal-premio-cerrar');
  const particulasContenedor = document.getElementById('particulas');

  titulo.textContent = config_premios.nombreVisible;

  const segmentos = renderWheel(rueda, etiquetas, config_premios.premios);

  await actualizarEstadoBoton({ boton, estadoTexto, clientId, nivel });

  boton.addEventListener('click', async () => {
    boton.disabled = true;

    const premioGanador = elegirPremio(config_premios.premios);
    const gradosFinal = calcularRotacionFinal(segmentos, premioGanador, config.vueltas);

    await girarRueda(rueda, gradosFinal, config.duracionMs);

    if (premioGanador.tipo !== 'sin_premio') {
      const colores = config_premios.premios.map((p) => p.color);
      lanzarParticulas(particulasContenedor, config.particulas, colores);
    }

    modalTexto.innerHTML = `<span class="modal-icono">${premioGanador.icono}</span><strong>${premioGanador.label}</strong>`;
    modal.classList.remove('oculto');

    await consumeSpin(clientId, nivel, premioGanador);
    await actualizarEstadoBoton({ boton, estadoTexto, clientId, nivel });
  });

  modalCerrar.addEventListener('click', () => {
    modal.classList.add('oculto');
  });
}

init().catch((error) => {
  console.error(error);
  document.getElementById('estado-texto').textContent = `Error: ${error.message}`;
});
