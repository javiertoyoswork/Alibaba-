// Inicializa Firebase y expone la instancia de Firestore que usa el resto
// del proyecto (codesService.js). Cargado vía CDN (sin npm/build step),
// como el resto del sitio. Si Firebase publica una versión más reciente del
// SDK, la URL se puede actualizar aquí sin tocar nada más.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './config/firebaseConfig.js';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
