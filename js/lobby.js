import { redimirCodigo } from './codesService.js';
import { getCreditos, addCreditos } from './wallet.js';

const NIVELES = [
  { nivel: 'bronce', nombre: 'Ruleta Bronce', archivo: './js/config/premios-bronce.json' },
  { nivel: 'plata', nombre: 'Ruleta Plata', archivo: './js/config/premios-plata.json' },
  { nivel: 'oro', nombre: 'Ruleta Oro', archivo: './js/config/premios-oro.json' },
];

const contenedorTarjetas = document.getElementById('tarjetas-ruleta');
const creditosTotalEl = document.getElementById('creditos-total');
const formCodigo = document.getElementById('form-codigo');
const inputCodigo = document.getElementById('input-codigo');
const mensajeCodigo = document.getElementById('mensaje-codigo');

async function cargarCosteNivel(nivelInfo) {
  const respuesta = await fetch(nivelInfo.archivo);
  const config = await respuesta.json();
  return config.costeCreditos;
}

function actualizarCreditosUI() {
  creditosTotalEl.textContent = getCreditos();
}

async function pintarTarjetas() {
  const creditosActuales = getCreditos();
  contenedorTarjetas.innerHTML = '';

  for (const nivelInfo of NIVELES) {
    const coste = await cargarCosteNivel(nivelInfo);
    const puedeTirar = creditosActuales >= coste;

    const tarjeta = document.createElement('div');
    tarjeta.className = `tarjeta-ruleta tarjeta-${nivelInfo.nivel}`;
    tarjeta.innerHTML = `
      <h3>${nivelInfo.nombre}</h3>
      <p>${coste} créditos por tirada</p>
      <button class="tarjeta-boton" data-nivel="${nivelInfo.nivel}" ${puedeTirar ? '' : 'disabled'}>
        ${puedeTirar ? 'Girar' : `Te faltan ${coste - creditosActuales} créditos`}
      </button>
    `;
    contenedorTarjetas.appendChild(tarjeta);
  }
}

contenedorTarjetas.addEventListener('click', (evento) => {
  const boton = evento.target.closest('.tarjeta-boton');
  if (boton && !boton.disabled) {
    window.location.href = `./ruleta.html?nivel=${boton.dataset.nivel}`;
  }
});

formCodigo.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const boton = formCodigo.querySelector('button');

  boton.disabled = true;
  mensajeCodigo.textContent = 'Comprobando código...';
  mensajeCodigo.className = 'mensaje-codigo';

  const resultado = await redimirCodigo(inputCodigo.value);

  if (resultado.ok) {
    addCreditos(resultado.creditos);
    mensajeCodigo.textContent = `¡Código válido! +${resultado.creditos} créditos.`;
    mensajeCodigo.className = 'mensaje-codigo exito';
    inputCodigo.value = '';
    actualizarCreditosUI();
    await pintarTarjetas();
  } else {
    mensajeCodigo.textContent = resultado.error;
    mensajeCodigo.className = 'mensaje-codigo error';
  }

  boton.disabled = false;
});

actualizarCreditosUI();
pintarTarjetas();
