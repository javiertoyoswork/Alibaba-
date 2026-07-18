// Punto de enchufe para la lógica real de "tiradas disponibles por cliente".
//
// HOY (esta fase): stub de demostración basado en localStorage + parámetros
// de la URL. NO es seguro: cualquier cliente puede borrar su localStorage o
// cambiar la URL para tirar de nuevo. Sirve solo para probar el flujo visual.
//
// MAÑANA (cuando exista backend real, ver README "Opciones de sistema de
// créditos"): sustituir el CONTENIDO de este archivo por llamadas fetch() a
// la API real (por ejemplo un Google Apps Script sobre la hoja de cálculo).
// El resto del proyecto (main.js, wheelRenderer.js, la UI) NO necesita
// cambiar, porque solo depende de estas dos funciones y de su forma de
// entrada/salida.

function claveTirada(clientId, nivel) {
  return `ruleta_tirada_${nivel}_${clientId}`;
}

export async function getSpinsAvailable(clientId, nivel) {
  const params = new URLSearchParams(window.location.search);

  if (params.get('tiradas') === '1') {
    return { disponible: true, motivo: 'override de pruebas (?tiradas=1)' };
  }

  const yaTiro = window.localStorage.getItem(claveTirada(clientId, nivel));
  if (yaTiro) {
    return { disponible: false, motivo: 'ya has usado tu tirada en este nivel' };
  }

  return { disponible: false, motivo: 'sin créditos de tirada todavía (demo: usa ?tiradas=1)' };
}

export async function consumeSpin(clientId, nivel, resultadoPremio) {
  try {
    window.localStorage.setItem(
      claveTirada(clientId, nivel),
      JSON.stringify({ premioId: resultadoPremio.id, fecha: new Date().toISOString() })
    );
    return true;
  } catch (error) {
    console.warn('No se pudo registrar la tirada en localStorage', error);
    return false;
  }
}
