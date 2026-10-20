# Borealis Corporations — Sitio portfolio

Sitio web estático (HTML, CSS y JavaScript puro). No necesita build ni servidor: se publica gratis en GitHub Pages. Node solo se usa para correr los tests.

## Estructura

```
borealis-corporations/
├── index.html          Página principal
├── privacidad.html     Aviso de privacidad (obligatorio si se recogen datos)
├── 404.html            Página de error
├── robots.txt
├── .nojekyll           Evita que GitHub Pages procese el sitio con Jekyll
├── .gitignore
├── package.json        Solo para `npm test`. No participa del sitio.
├── test/
│   └── site.test.cjs   Tests con jsdom
├── css/
│   └── styles.css      Estilos, tema claro y oscuro
├── js/
│   ├── config.js       DATOS DE CONTACTO (editar primero)
│   ├── services.js     SERVICIOS (editar)
│   ├── aurora.js       Animación del hero
│   └── main.js         Menú, filtros, detalle, formulario
└── assets/
    └── favicon.svg
```

## Qué funciona

- Menú móvil, sección activa y tema claro/oscuro (se recuerda la elección).
- Servicios con filtros por área, buscador y ventana de detalle por servicio.
- Botón "Consultar por este servicio": completa el formulario automáticamente.
  Solo aparece en los servicios `status: "available"`.
- Teléfono (`tel:`), WhatsApp, email y copiar email.
- Formulario con validación y dos casillas de consentimiento separadas: el aviso
  de privacidad (obligatorio) y el consentimiento para novedades por email
  (opcional). Envía por `formEndpoint` si lo configurás; si no, abre el correo del
  visitante con el mensaje escrito. El botón "Enviar por WhatsApp" abre el chat
  con el mensaje listo.

## Servicios disponibles y servicios en desarrollo

Cada servicio en `js/services.js` tiene un campo `status`:

| `status` | Qué hace el sitio |
|---|---|
| `"available"` | Tarjeta normal, con botón "Consultar por este servicio". |
| `"in_development"` | Tarjeta atenuada con la etiqueta "En desarrollo", aviso en el detalle y sin botón de consulta. |

**Regla:** no dejes un servicio en `available` si todavía no lo podés entregar. El
contador de la sección "Nosotros" muestra automáticamente cuántos hay disponibles.
Cuando un servicio pase a tener entrega real, cambiá su `status` a `"available"`.

## Antes de publicar: editar 2 archivos

1. `js/config.js`: poné el email, teléfono y WhatsApp reales. Hasta que lo hagas, los botones apuntan a datos de ejemplo.
2. `js/services.js`: revisá que cada `status` refleje lo que realmente podés entregar.

También hay que revisar los textos de `index.html` (título del hero, sección
"Nuestros" y "Dónde trabajamos"), que son de ejemplo.

## Dónde se guardan los mensajes del formulario

Por defecto **no se guarda nada**: `formEndpoint` está vacío y el formulario abre
el `mailto:` del visitante. Cada persona tiene que mandar el mensaje desde su propio cliente de correo.

Para que los mensajes lleguen a tu correo sin backend, usá Formspree:

1. Creá una cuenta gratis en https://formspree.io y un formulario nuevo.
2. Copiá la URL que te da (`https://formspree.io/f/xxxxxxx`).
3. Pegala en `formEndpoint` dentro de `js/config.js`.

Ojo: Formspree no valida el contrato de `ai-agency`. Si en algún momento los
mensajes tienen que entrar al CRM, el endpoint tiene que ser el que describe
`contracts/public-leads.yaml` en el repo de ai-agency, no Formspree.

### Payload que manda el formulario

Cuando `formEndpoint` está configurado, el sitio manda un `POST` con `JSON`:

```json
{
  "name": "Ana Gomez",
  "email": "ana@example.com",
  "phone": "1122546644",
  "topic": "Interés en un servicio",
  "message": "…",
  "consent": { "privacyNotice": true, "marketingEmail": false, "locale": "es-AR" },
  "serviceId": "auditoria-tecnica",
  "serviceStatusAtSubmit": "available",
  "companyWebsite": "",
  "pageUrl": "https://…/index.html"
}
```

Más el header `Idempotency-Key`, para que un reintento no duplique el lead.
`companyWebsite` es el campo trampa para bots: siempre llega vacío.
`serviceId` solo viene si la persona estaba mirando un servicio concreto.

El contrato completo, con rate limit y las reglas de cumplimiento, está en
`contracts/public-leads.yaml` del repo de ai-agency.

## Tests

```bash
npm install
npm test
```

65 checks con jsdom sobre el render de los servicios, el diálogo, los consentimientos,
el honeypot, el payload del lead y los enlaces internos. No necesita navegador.

## Publicar en GitHub Pages

1. Subí los archivos al repositorio (rama `main`). `node_modules/` está ignorado.
2. En el repo: Settings → Pages → Build and deployment → Source: "Deploy from a branch".
3. Elegí la rama `main` y la carpeta `/ (root)`, y guardá.
4. En uno o dos minutos el sitio queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

## Probar en local

```bash
npm run serve
```

Y entrá a http://localhost:8000. También podés abrir `index.html` directo en el
navegador, pero el formulario usa `fetch` y algunos navegadores lo bloquean con `file://`.
