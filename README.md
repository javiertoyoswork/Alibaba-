# Ruleta de premios (Bronce / Plata / Oro)

Sitio estático (HTML/CSS/JS vanilla, sin build step) para regalar tiradas de
ruleta a clientes a cambio de códigos de créditos, pensado para enlazar
desde un bot de Telegram. Los códigos viven en una base de datos Firestore
(Firebase) pública/abierta — tal y como se pidió, es una solución sencilla
y **no pensada para máxima seguridad**, ver el aviso más abajo.

## Cómo funciona

1. El dueño del negocio genera códigos de créditos (50, 100, 150, 200...)
   desde el panel de administrador (`admin.html`) y se los da a los
   clientes (por Telegram, en el ticket, etc.).
2. El cliente entra en `index.html`, introduce el código y, si es válido y
   no se había usado antes, se le suman esos créditos a su monedero (guardado
   en este navegador) y el código queda marcado como usado en Firestore para
   siempre — no se puede reutilizar, ni por él ni por nadie más.
3. Puede cargar varios códigos seguidos para acumular más créditos.
4. Con créditos suficientes, elige qué ruleta tirar: Bronce/Plata/Oro
   cuestan distintos créditos por tirada (más cara = mejores premios). Al
   girar, se descuentan los créditos de su monedero.

## Puesta en marcha: crear el proyecto de Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com),
   crea un proyecto nuevo (gratis, plan Spark es suficiente).
2. En el proyecto, entra en **Firestore Database** → **Crear base de
   datos** → modo de producción (o modo de prueba, da igual, las reglas se
   sobrescriben en el siguiente paso).
3. En la pestaña **Reglas** de Firestore, pega esto y publica:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /codigos/{codigo} {
         allow read: if true;
         allow create: if true;
         // Solo permite pasar de "usado: false" a "usado: true", nunca al revés
         // ni cambiar los créditos de un código ya existente.
         allow update: if resource.data.usado == false
                        && request.resource.data.usado == true
                        && request.resource.data.creditos == resource.data.creditos;
         allow delete: if false;
       }
     }
   }
   ```

   Esto mantiene la base de datos abierta (sin login, como se pidió) pero
   evita que alguien reviva un código ya gastado o falsifique sus créditos
   con una petición manual.

4. Añade una app Web al proyecto (icono `</>` en la pantalla principal del
   proyecto) y copia el objeto `firebaseConfig` que te da.
5. Pega esos valores en **`js/config/firebaseConfig.js`**, sustituyendo los
   placeholders.
6. Cambia la contraseña de administrador en **`js/config/admin.js`**
   (`ADMIN_CONTRASENA`) antes de publicar el sitio.

### ⚠️ Aviso de seguridad

Todo el código (incluida la contraseña de `admin.js`) se envía al navegador
de cualquier visitante — es lo mismo que pediste ("pública, algo no muy
segura"), así que trátalo como tal:

- La contraseña del panel de admin es solo un filtro visual, no una
  autenticación real: cualquiera que mire el código fuente de `admin.js`
  puede leerla. No enlaces `admin.html` desde páginas públicas — solo tú
  debes conocer esa URL.
- Las reglas de Firestore de arriba impiden reutilizar o falsificar un
  código vía la API, pero no impiden que alguien con la contraseña genere
  códigos de más, ni que alguien inspeccione la colección `codigos` (es de
  lectura pública).
- Los créditos de cada cliente viven en el `localStorage` de su propio
  navegador: si cambia de navegador/dispositivo o borra datos, pierde el
  saldo acumulado (los códigos ya canjeados no se pueden volver a canjear,
  pero el saldo no está en ningún sitio más). Para algo más robusto habría
  que atar el saldo a una cuenta/usuario en vez de al navegador.

## Cómo probarlo en local

```bash
python3 -m http.server 8000
```

Y abrir `http://localhost:8000/index.html`.

- `index.html`: canjear códigos y elegir ruleta.
- `ruleta.html?nivel=bronce|plata|oro`: la ruleta en sí (normalmente se
  llega aquí desde `index.html`, no hace falta abrirla a mano).
- `admin.html`: generar códigos (usuario `ruleta` + la contraseña que
  hayas puesto en `js/config/admin.js`).

## El formato de los códigos

Cada código generado tiene forma `<créditos>-XXXX-XXXX` (ej. `50-7K3F-9QXP`),
usando un alfabeto sin `0/O/1/I/L` para que no se confundan al leerlos o
escribirlos a mano. Se generan en `js/codesService.js`
(`generarYGuardarCodigos`) y se guardan en la colección `codigos` de
Firestore, un documento por código:

```json
{ "creditos": 50, "usado": false, "usadoEn": null, "creadoEn": "<timestamp>" }
```

Las denominaciones que aparecen en el desplegable del panel de admin están
en `js/config/admin.js` (`DENOMINACIONES_CREDITOS`) — añade o quita valores
ahí.

## Panel de administrador (`admin.html`)

Tras iniciar sesión: eliges cuántos créditos vale el código, cuántos
códigos quieres (por defecto 10, máx. 100), pulsas **Generar y copiar** y:

1. Se generan y guardan en Firestore de una sola vez (`writeBatch`).
2. Se copian automáticamente al portapapeles, separados por saltos de línea.
3. Además quedan listados en pantalla, por si el portapapeles falla (algunos
   navegadores lo bloquean fuera de `https://` o `localhost`).

## Cómo editar premios, probabilidades y coste por tirada

Cada nivel tiene su propio JSON en `js/config/premios-<nivel>.json`:

```json
{
  "nivel": "bronce",
  "nombreVisible": "Ruleta Bronce",
  "costeCreditos": 50,
  "premios": [
    {
      "id": "desc10-cafe",
      "label": "10% dto. Café",
      "tipo": "descuento_pct",
      "valor": 10,
      "productoId": "cafe-especial",
      "productoNombre": "Café especial",
      "peso": 30,
      "color": "#C97C3C",
      "icono": "☕"
    }
  ]
}
```

- `costeCreditos`: cuántos créditos gasta el cliente por cada tirada de esa
  ruleta — es lo que decide qué ruleta puede permitirse en `index.html`.
- `tipo`: `producto_gratis` | `descuento_pct` | `descuento_fijo` | `sin_premio`.
- `productoId`/`productoNombre`: solo incluye aquí productos que ese cliente
  **ya haya comprado** — hoy se edita el JSON a mano por campaña.
- `peso`: número libre, no hace falta que sume 100. La probabilidad real es
  `peso / suma de todos los pesos` de esa ruleta, y el tamaño del segmento en
  pantalla es proporcional al peso (la rueda no "miente" sobre la probabilidad).
- Para que Oro sea mejor que Plata y Plata mejor que Bronce: sube los pesos
  de los premios buenos y baja el peso de `sin_premio` a medida que subes de
  nivel (ya viene así configurado de ejemplo).
- `color`/`icono` controlan directamente el segmento — no hace falta tocar
  CSS para añadir o quitar premios.

El aspecto visual de cada nivel (colores, duración del giro, efectos) vive
en `css/temas.css` y las duraciones/nº de partículas en `js/main.js`
(`CONFIG_POR_NIVEL`).

## Arquitectura del código

- `js/wallet.js`: monedero de créditos en `localStorage` de este navegador
  (`getCreditos`, `addCreditos`, `gastarCreditos`).
- `js/codesService.js`: habla con Firestore — canjear un código
  (`redimirCodigo`, con transacción atómica para que no se pueda canjear dos
  veces aunque se pulse a la vez desde dos pestañas) y generar códigos en
  bloque (`generarYGuardarCodigos`).
- `js/creditsProvider.js`: el hook que usa la ruleta (`getSpinsAvailable`,
  `consumeSpin`) — solo mira el monedero local, ya no depende de Firestore
  directamente.
- `js/lobby.js` / `index.html`: formulario de canje + tarjetas de las 3
  ruletas con su coste.
- `js/admin.js` / `admin.html`: login + generador de códigos.
- `js/main.js` / `ruleta.html`: la ruleta en sí (sin cambios de fondo desde
  la primera versión, solo ahora el coste por tirada sale del JSON en vez de
  ser "una tirada gratis por navegador").

## Enlazar desde el bot de Telegram

El bot puede simplemente mandar el link a `index.html` junto con el código
recién generado (o dejar que el cliente lo pida). Como botón `WebApp` de
Telegram se abre dentro de la propia app:

```
https://tu-dominio.com/index.html
```
