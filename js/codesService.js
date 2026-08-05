import {
  doc,
  runTransaction,
  writeBatch,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebaseClient.js';

const COLECCION = 'codigos';
// Sin 0/O/1/I/L para evitar confusiones al leer el código en voz alta o a mano.
const ALFABETO_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generarBloqueAleatorio(longitud) {
  let resultado = '';
  for (let i = 0; i < longitud; i++) {
    resultado += ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)];
  }
  return resultado;
}

function generarCodigo(creditos) {
  return `${creditos}-${generarBloqueAleatorio(4)}-${generarBloqueAleatorio(4)}`;
}

// Canjea un código: si existe y no se ha usado, lo marca como usado de forma
// atómica (transacción de Firestore) y devuelve los créditos que otorga.
// La transacción evita que dos canjeos simultáneos del mismo código lo
// consuman dos veces, aunque las reglas de Firestore sean abiertas.
export async function redimirCodigo(codigoBruto) {
  const codigo = codigoBruto.trim().toUpperCase();
  if (!codigo) {
    return { ok: false, error: 'Introduce un código.' };
  }

  const ref = doc(db, COLECCION, codigo);

  try {
    const creditos = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('NOT_FOUND');
      const datos = snap.data();
      if (datos.usado) throw new Error('YA_USADO');
      tx.update(ref, { usado: true, usadoEn: serverTimestamp() });
      return datos.creditos;
    });
    return { ok: true, creditos };
  } catch (error) {
    if (error.message === 'NOT_FOUND') return { ok: false, error: 'Ese código no existe.' };
    if (error.message === 'YA_USADO') return { ok: false, error: 'Ese código ya se ha usado.' };
    console.error(error);
    return { ok: false, error: 'No se pudo conectar con la base de datos.' };
  }
}

// Genera `cantidad` códigos nuevos de `creditos` créditos cada uno y los
// guarda todos de una vez en Firestore. Devuelve la lista de códigos
// generados para poder copiarla/mostrarla en el panel de administrador.
export async function generarYGuardarCodigos(creditos, cantidad) {
  const codigos = new Set();
  while (codigos.size < cantidad) {
    codigos.add(generarCodigo(creditos));
  }
  const lista = [...codigos];

  const batch = writeBatch(db);
  for (const codigo of lista) {
    batch.set(doc(db, COLECCION, codigo), {
      creditos,
      usado: false,
      usadoEn: null,
      creadoEn: serverTimestamp(),
    });
  }
  await batch.commit();

  return lista;
}
