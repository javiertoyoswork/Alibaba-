# Ruleta de premios (Bronce / Plata / Oro)

Sitio estático (HTML/CSS/JS vanilla, sin build step) para regalar una tirada
de ruleta a los clientes tras cada compra, pensado para enlazar desde un bot
de Telegram. En esta fase **solo es el frontend**: no hay backend ni base de
datos todavía.

## Cómo probarlo

Necesitas servirlo con un servidor estático local (abrir `index.html` con
`file://` puede bloquear la carga de los JSON de premios en Chrome):

```bash
python3 -m http.server 8000
```

Y abrir `http://localhost:8000/index.html`. Desde ahí hay un botón por
nivel que ya incluye `?tiradas=1` para forzar una tirada de prueba.

También puedes ir directo a una ruleta con parámetros en la URL:

```
ruleta.html?nivel=bronce|plata|oro&cliente=<id_del_cliente>&tiradas=1
```

- `nivel`: qué ruleta mostrar (por defecto `bronce`).
- `cliente`: identificador del cliente, para llevar la cuenta de si ya tiró.
- `tiradas=1`: override de pruebas que fuerza que haya tirada disponible.

## Cómo editar premios y probabilidades

Cada nivel tiene su propio JSON en `js/config/premios-<nivel>.json`. Cada
premio es:

```json
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
```

- `tipo`: `producto_gratis` | `descuento_pct` | `descuento_fijo` | `sin_premio`.
- `productoId`/`productoNombre`: solo incluye aquí productos que ese cliente
  **ya haya comprado** — hoy se edita el JSON a mano por cliente/campaña.
- `peso`: número libre, no hace falta que sume 100. La probabilidad real es
  `peso / suma de todos los pesos` de esa ruleta. El tamaño del segmento en
  pantalla es proporcional al peso, así que la rueda siempre "dice la
  verdad" sobre la probabilidad.
- Para que Oro sea mejor que Plata y Plata mejor que Bronce sin tocar
  código: sube los pesos de los premios buenos y baja el peso de
  `sin_premio` a medida que subes de nivel (ya viene así configurado de
  ejemplo).
- `color`/`icono` controlan directamente el segmento — no hace falta tocar
  CSS para añadir o quitar premios.

El aspecto visual de cada nivel (colores, duración del giro, efectos) vive
en `css/temas.css` y las duraciones/nº de partículas en `js/main.js`
(`CONFIG_POR_NIVEL`).

## El "hook" de créditos/tiradas (`js/creditsProvider.js`)

Todo el proyecto solo depende de dos funciones:

```js
getSpinsAvailable(clientId, nivel) // -> { disponible, motivo? }
consumeSpin(clientId, nivel, resultadoPremio) // -> boolean
```

Hoy están implementadas con `localStorage` + el parámetro `?tiradas=1` como
**demo, no segura** (un cliente podría borrar su localStorage y volver a
tirar). El día que se conecte una fuente de verdad real (ver opciones más
abajo), solo hay que reescribir el contenido de este archivo para que estas
dos funciones hagan `fetch()` a esa fuente — nada más del proyecto necesita
cambiar.

## Opciones para controlar las tiradas según lo gastado

No hay una única forma correcta; dado que hoy todo se gestiona en una hoja
de cálculo manual y el canal es Telegram, estas son las más razonables (no
son excluyentes entre sí):

1. **Google Sheets + Apps Script como "backend ligero".** Publicas la misma
   hoja que ya usas como una Web API (`doGet`/`doPost`) que la página HTML y
   el bot de Telegram consultan y actualizan. Reutiliza lo que ya tienes,
   es gratis, y el estado (compras, créditos, tiradas ya usadas) queda
   centralizado de verdad. Contras: hay que aprender a publicar/mantener el
   script y existen cuotas diarias de Google.

2. **Link único firmado por compra.** El bot genera, tras cada venta, un
   enlace con un token (por ejemplo un HMAC de cliente + importe + fecha +
   una clave secreta), de un solo uso y con caducidad. Fácil de generar
   aunque sea semi-manual, pero para saber si el token ya se canjeó de
   verdad normalmente hace falta igualmente un registro compartido (típicamente
   la opción 1).

3. **QR único en el ticket/albarán ligado al pedido.** Encaja bien con el
   flujo físico del negocio: un QR = un pedido = una tirada. Requiere
   trabajo manual extra de generar/imprimir por venta y el mismo problema de
   fondo de marcar "ya canjeado" en algún sitio.

4. **Umbrales de gasto acumulado por tramos** (ej. 20€ → Bronce, 50€ →
   Plata, 100€ → Oro). Desbloquea el nivel de ruleta según el gasto
   acumulado del cliente. Gamifica el upsell (incentiva gastar más) y
   encaja de forma natural con los 3 niveles ya diseñados. Exige mantener
   el acumulado por cliente al día.

**Recomendación:** la opción 1 (Sheets + Apps Script) resuelve el problema
de fondo del estado compartido; las opciones 2 y 3 son formas de entregar el
acceso individual a cada cliente; la opción 4 es la regla de negocio que
decide qué nivel/tiradas le tocan. Se pueden combinar (por ejemplo: 4 para
decidir el nivel + 1 como fuente de verdad + 2 como forma de entrega del
link vía el bot).

## Enlazar desde el bot de Telegram

Cuando haya una fuente real de compras/créditos, el bot solo necesita
mandar un link tipo:

```
https://tu-dominio.com/ruleta.html?nivel=<nivel_calculado>&cliente=<id_cliente>
```

(sin `?tiradas=1`, que es solo para pruebas), idealmente como botón
`WebApp` de Telegram para que se abra dentro de la propia app.
