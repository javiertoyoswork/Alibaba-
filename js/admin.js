import { ADMIN_USUARIO, ADMIN_CONTRASENA, DENOMINACIONES_CREDITOS } from './config/admin.js';
import { generarYGuardarCodigos } from './codesService.js';

const loginPanel = document.getElementById('login-panel');
const panelAdmin = document.getElementById('panel-admin');
const formLogin = document.getElementById('form-login');
const loginError = document.getElementById('login-error');

const selectCreditos = document.getElementById('select-creditos');
const inputCantidad = document.getElementById('input-cantidad');
const btnGenerar = document.getElementById('btn-generar');
const mensajeGenerar = document.getElementById('mensaje-generar');
const listaCodigos = document.getElementById('lista-codigos');

for (const valor of DENOMINACIONES_CREDITOS) {
  const opcion = document.createElement('option');
  opcion.value = String(valor);
  opcion.textContent = `${valor} créditos`;
  selectCreditos.appendChild(opcion);
}

formLogin.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const usuario = document.getElementById('usuario').value.trim();
  const contrasena = document.getElementById('contrasena').value;

  if (usuario === ADMIN_USUARIO && contrasena === ADMIN_CONTRASENA) {
    loginPanel.classList.add('oculto');
    panelAdmin.classList.remove('oculto');
    loginError.textContent = '';
  } else {
    loginError.textContent = 'Usuario o contraseña incorrectos.';
  }
});

btnGenerar.addEventListener('click', async () => {
  const creditos = Number(selectCreditos.value);
  const cantidad = Math.min(100, Math.max(1, Number(inputCantidad.value) || 1));

  btnGenerar.disabled = true;
  mensajeGenerar.className = 'mensaje';
  mensajeGenerar.textContent = 'Generando y guardando en la base de datos...';
  listaCodigos.value = '';

  let codigos;
  try {
    codigos = await generarYGuardarCodigos(creditos, cantidad);
  } catch (error) {
    console.error(error);
    mensajeGenerar.className = 'mensaje error';
    mensajeGenerar.textContent = 'Error al guardar los códigos en Firebase. Revisa js/config/firebaseConfig.js y las reglas de Firestore.';
    btnGenerar.disabled = false;
    return;
  }

  const texto = codigos.join('\n');
  listaCodigos.value = texto;

  try {
    await navigator.clipboard.writeText(texto);
    mensajeGenerar.className = 'mensaje exito';
    mensajeGenerar.textContent = `${cantidad} códigos de ${creditos} créditos generados y copiados al portapapeles.`;
  } catch (error) {
    mensajeGenerar.className = 'mensaje exito';
    mensajeGenerar.textContent = `${cantidad} códigos generados y guardados. No se pudieron copiar automáticamente: cópialos del cuadro de abajo.`;
  }

  btnGenerar.disabled = false;
});
