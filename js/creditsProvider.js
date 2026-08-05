// Punto de enchufe entre la ruleta y el sistema de créditos. Antes esto era
// un stub de un solo uso por navegador; ahora se apoya en el monedero real
// (wallet.js), que a su vez se recarga canjeando códigos de Firestore
// (codesService.js) desde el lobby (index.html).
import { getCreditos, gastarCreditos } from './wallet.js';

export async function getSpinsAvailable(costeCreditos) {
  const disponibles = getCreditos();
  if (disponibles >= costeCreditos) {
    return { disponible: true, motivo: `tienes ${disponibles} créditos` };
  }
  return {
    disponible: false,
    motivo: `necesitas ${costeCreditos} créditos y tienes ${disponibles}`,
  };
}

export function consumeSpin(costeCreditos) {
  return gastarCreditos(costeCreditos);
}
