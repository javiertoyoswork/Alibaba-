// Monedero de créditos guardado en este navegador. Los códigos se canjean
// una sola vez contra Firestore (ver codesService.js), pero los créditos que
// otorgan se acumulan y se gastan aquí, en local.
const CLAVE_CREDITOS = 'ruleta_creditos';

export function getCreditos() {
  return Number(localStorage.getItem(CLAVE_CREDITOS) || 0);
}

export function addCreditos(cantidad) {
  const total = getCreditos() + cantidad;
  localStorage.setItem(CLAVE_CREDITOS, String(total));
  return total;
}

export function gastarCreditos(cantidad) {
  const actual = getCreditos();
  if (actual < cantidad) return false;
  localStorage.setItem(CLAVE_CREDITOS, String(actual - cantidad));
  return true;
}
