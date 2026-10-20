// Verificación del sitio con jsdom. Corre con:  npm test
// Cubre exactamente lo que se cambió:
// estado de servicio en tarjetas y diálogo, contador, consentimiento, honeypot
// y el payload de POST /v1/public/leads.
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const SITE = path.resolve(__dirname, "..");
let ok = 0, fail = 0;
const failures = [];
function check(name, cond, extra) {
  if (cond) { ok++; console.log(`PASS  ${name}`); }
  else { fail++; failures.push(name + (extra ? ` — ${extra}` : "")); console.log(`FAIL  ${name}${extra ? ` — ${extra}` : ""}`); }
}

const vc = new VirtualConsole();
const pageErrors = [];
vc.on("jsdomError", e => pageErrors.push(e.message));
vc.on("error", (...a) => pageErrors.push(a.join(" ")));

function boot(page = "index.html") {
  const dom = new JSDOM(fs.readFileSync(path.join(SITE, page), "utf8"), {
    runScripts: "outside-only",
    url: "https://borealis-corporations.example/" + page,
    virtualConsole: vc,
  });
  const { window } = dom;
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.IntersectionObserver = class { constructor(cb) { this.cb = cb; } observe() {} unobserve() {} disconnect() {} };
  window.ResizeObserver = class { observe() {} disconnect() {} };
  window.Element.prototype.scrollIntoView = function () {};  // jsdom no lo implementa
  window.Element.prototype.focus = window.Element.prototype.focus || function () {};
  window.HTMLDialogElement = window.HTMLDialogElement || class {};
  const d = window.HTMLDialogElement.prototype;
  d.showModal = function () { this.setAttribute("open", ""); };
  d.close = function () { this.removeAttribute("open"); if (this.onclose) this.onclose(); this.dispatchEvent(new window.Event("close")); };
  return window;
}

function run(w, file) {
  w.eval(fs.readFileSync(path.join(SITE, "js", file), "utf8"));
}

function makeFetchStub(w) {
  const calls = [];
  w.fetch = (url, opts) => {
    calls.push({ url, body: opts && opts.body ? JSON.parse(opts.body) : null, headers: (opts && opts.headers) || {} });
    return Promise.resolve({ ok: true, status: 202 });
  };
  return calls;
}

const tick = () => new Promise(r => setImmediate(r));

(async () => {
  const w = boot("index.html");
  run(w, "config.js");
  run(w, "services.js");
  w.SITE_CONFIG.formEndpoint = "/v1/public/leads";
  run(w, "main.js");
  await tick();

  const $ = s => w.document.querySelector(s);
  const $$ = s => Array.from(w.document.querySelectorAll(s));
  const cards = $$("#grid .project");

  // ---- 1. Grid y estados
  check("Se renderizan las 8 tarjetas", cards.length === 8, `${cards.length}`);
  const soon = $$("#grid .project.is-soon");
  check("5 tarjetas con clase is-soon", soon.length === 5, `${soon.length}`);
  const flags = $$("#grid .flag").map(e => e.textContent);
  check("5 etiquetas 'En desarrollo'", flags.length === 5 && flags.every(t => t === "En desarrollo"), JSON.stringify(flags));
  check("is-soon coincide con status in_development",
    soon.every(c => c.dataset.id && w.SERVICES.find(s => s.id === c.dataset.id).status === "in_development"));
  check("Las 3 disponibles NO llevan is-soon",
    $$("#grid .project:not(.is-soon)").map(c => c.dataset.id).sort().join(",") === "auditoria-tecnica,documentacion-traspaso,saneamiento-codigo");

  // ---- 2. Contador
  check("Contador de disponibles = 3", $("[data-count-available]").textContent === "3", $("[data-count-available]").textContent);
  check("Etiqueta del contador", $("[data-count-available]").closest("div").querySelector("dt").textContent === "Servicios disponibles");

  // ---- 3. Diálogo: disponible
  $$("#grid .project").find(c => c.dataset.id === "auditoria-tecnica").click();
  check("Disponible: #dlg-soon oculto", $("#dlg-soon").hidden === true);
  check("Disponible: #dlg-consult visible", $("#dlg-consult").hidden === false);
  check("Disponible: diálogo abierto", $("#project-dialog").hasAttribute("open"));

  // ---- 4. Diálogo: en desarrollo
  $$("#grid .project").find(c => c.dataset.id === "seo-local").click();
  check("En desarrollo: #dlg-soon visible", $("#dlg-soon").hidden === false);
  check("En desarrollo: aviso explica la situación", /todavía no está disponible/.test($("#dlg-soon").textContent));
  check("En desarrollo: #dlg-consult OCULTO", $("#dlg-consult").hidden === true);

  // ---- 5. El botón de consultar no hace nada en un servicio en desarrollo
  const before = { msg: $("#f-message").value, topic: $("#f-topic").value };
  $("#dlg-consult").click();
  check("En desarrollo: el botón no precarga el formulario",
    $("#f-message").value === before.msg && $("#f-topic").value === before.topic);
  $("#dlg-close").click();

  // ---- 6. Flujo de consulta de un servicio disponible
  $$("#grid .project").find(c => c.dataset.id === "saneamiento-codigo").click();
  $("#dlg-consult").click();
  check("Consulta: mensaje precargado con el nombre", $("#f-message").value.includes("Saneamiento"), $("#f-message").value.slice(0, 40));
  check("Consulta: motivo = 'Interés en un servicio'", $("#f-topic").value === "Interés en un servicio");

  // ---- 7. Validación: sin consentimiento no se envía
  const calls = makeFetchStub(w);
  const form = $("#contact-form");
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await tick();
  check("Sin consentimiento: no se llama al endpoint", calls.length === 0, `${calls.length}`);

  // ---- 8. Validación: honeypot
  $("#f-privacy").checked = true;
  $("#f-name").value = "Ana Gomez";
  $("#f-email").value = "ana@example.com";
  $("#f-site").value = "http://spam.example";
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await tick();
  check("Honeypot: no se llama al endpoint", calls.length === 0, `${calls.length}`);
  $("#f-site").value = "";

  // ---- 9. Consentimiento: marca aria-invalid y error visible
  $("#f-privacy").checked = false;
  $("#f-name").value = "Ana Gomez";
  $("#f-email").value = "ana@example.com";
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await tick();
  check("Falta privacidad: no se envía", calls.length === 0);
  check("Falta privacidad: error visible", $("#err-privacy").textContent.length > 0, $("#err-privacy").textContent);
  check("Falta privacidad: aria-invalid", $("#f-privacy").getAttribute("aria-invalid") === "true");

  // ---- 10. Envío válido: payload del contrato
  $("#f-privacy").checked = true;
  $("#f-privacy").dispatchEvent(new w.Event("change", { bubbles: true }));
  check("Consentimiento válido: error borrado", $("#err-privacy").textContent === "" && !$("#f-privacy").hasAttribute("aria-invalid"));
  $("#f-marketing").checked = true;
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await tick(); await tick();

  check("Consentimiento válido: se envió", calls.length === 1, `${calls.length}`);
  if (calls.length === 1) {
    const p = calls[0].body, h = calls[0].headers;
    check("payload.name", p.name === "Ana Gomez", p.name);
    check("payload.email", p.email === "ana@example.com", p.email);
    check("payload.topic", p.topic === "Interés en un servicio", p.topic);
    check("payload.message >= 10", p.message.length >= 10, `${p.message.length}`);
    check("payload.consent.privacyNotice === true", p.consent.privacyNotice === true);
    check("payload.consent.marketingEmail === true (marcado)", p.consent.marketingEmail === true);
    check("payload.consent.locale string", typeof p.consent.locale === "string" && p.consent.locale.length > 0, p.consent.locale);
    check("payload.serviceId", p.serviceId === "saneamiento-codigo", p.serviceId);
    check("payload.serviceStatusAtSubmit === 'available'", p.serviceStatusAtSubmit === "available", p.serviceStatusAtSubmit);
    check("payload.companyWebsite vacío (honeypot)", p.companyWebsite === "", JSON.stringify(p.companyWebsite));
    check("payload.pageUrl", typeof p.pageUrl === "string" && p.pageUrl.includes("index.html"), p.pageUrl);
    check("header Idempotency-Key", !!h["Idempotency-Key"], h["Idempotency-Key"]);
    check("header Content-Type", String(h["Content-Type"]).includes("application/json"), h["Content-Type"]);
  }

  // ---- 11. Segundo envío: marketing desmarcado y sin serviceId
  // form.reset() desmarca la casilla de privacidad: hay que volver a marcarla.
  check("Tras enviar, el formulario se resetea", $("#f-privacy").checked === false);
  $("#f-privacy").checked = true;
  $("#f-name").value = "Beto Diaz";
  $("#f-email").value = "beto@example.com";
  // form.reset() también vació el mensaje: hay que recargarlo.
  $("#f-message").value = "Consulta de prueba para el segundo envío.";
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  await tick(); await tick();
  check("2do envío realizado", calls.length === 2, `${calls.length}`);
  if (calls.length === 2) {
    const p = calls[1].body;
    check("2do: consent.marketingEmail === false", p.consent.marketingEmail === false, String(p.consent.marketingEmail));
    check("2do: sin serviceId (form reset)", p.serviceId === undefined, String(p.serviceId));
    check("2do: privacyNotice === true", p.consent.privacyNotice === true);
    check("2do: Idempotency-Key distinto", calls[1].headers["Idempotency-Key"] !== calls[0].headers["Idempotency-Key"]);
  }

  // ---- 12. composeText (ruta mailto / WhatsApp) incluye el consentimiento
  const w2 = boot("index.html");
  run(w2, "config.js"); run(w2, "services.js"); run(w2, "main.js");
  const q2 = s => w2.document.querySelector(s);
  q2("#f-name").value = "Ana Gomez";
  q2("#f-email").value = "ana@example.com";
  q2("#f-phone").value = "1122546644";
  q2("#f-message").value = "Necesito una auditoría de nuestro código.";
  q2("#f-privacy").checked = true;
  q2("#f-marketing").checked = false;
  let waUrl = null;
  w2.open = (u) => { waUrl = u; return null; };
  q2("#send-wa").click();
  const text = waUrl ? decodeURIComponent(waUrl.split("?text=")[1] || "") : "";
  check("WhatsApp: mensaje incluye el aviso de privacidad", /aviso de privacidad/.test(text), text.slice(-120));
  check("WhatsApp: NO incluye novedades si no se marcó", !/novedades/.test(text));
  q2("#f-marketing").checked = true;
  q2("#send-wa").click();
  const text2 = waUrl ? decodeURIComponent(waUrl.split("?text=")[1] || "") : "";
  check("WhatsApp: incluye novedades si se marcó", /novedades y ofertas por email/.test(text2));
  let blocked = false;
  q2("#f-privacy").checked = false;
  q2("#f-privacy").dispatchEvent(new w2.Event("change", { bubbles: true }));
  q2("#send-wa").click();
  check("WhatsApp: bloqueado sin privacidad", q2("#err-privacy").textContent.length > 0);

  // ---- 13. Filtros y búsqueda (sin regresión)
  const search = $("#search");
  search.value = "whatsapp";
  search.dispatchEvent(new w.Event("input", { bubbles: true }));
  check("Búsqueda 'whatsapp' → 1 resultado", $$("#grid .project").length === 1, `${$$("#grid .project").length}`);
  search.value = "";
  search.dispatchEvent(new w.Event("input", { bubbles: true }));
  $("#reset-filters").click();
  check("Reset → 8 resultados", $$("#grid .project").length === 8);
  const chip = $$("#filters .chip").find(c => c.textContent === "Datos");
  chip.click();
  check("Filtro 'Datos' → 1 resultado", $$("#grid .project").length === 1, `${$$("#grid .project").length}`);
  check("Ese resultado es analysis-datos y está en desarrollo", $$("#grid .project")[0].dataset.id === "analisis-datos" && $$("#grid .project")[0].classList.contains("is-soon"));
  check("Contador de resultados actualizado", $("#results-count").textContent === "Mostrando 1 servicio", $("#results-count").textContent);

  // ---- 14. Sin errores de JS
  check("Sin errores de JavaScript", pageErrors.length === 0, pageErrors.join(" | ").slice(0, 200));

  // ---- 15. Aviso de privacidad
  const w3 = boot("privacidad.html");
  w3.eval(fs.readFileSync(path.join(SITE, "js", "config.js"), "utf8"));
  w3.eval(fs.readFileSync(path.join(SITE, "privacidad.html"), "utf8").match(/<script>([\s\S]*?)<\/script>/)[1]);
  const body = w3.document.querySelector("main").textContent.toLowerCase().replace(/\s+/g, " ");
  check("privacidad: título correcto", w3.document.querySelector("h1").textContent === "Aviso de privacidad");
  check("privacidad: dice que no almacena datos bancarios", /no almacenamos datos bancarios/.test(body));
  check("privacidad: dice que no vende datos", /no vendemos, alquilamos ni cedemos/.test(body));
  check("privacidad: no usa cookies de seguimiento", /no usa cookies de seguimiento/.test(body));
  check("privacidad: NO usa brokers ni listas compradas", /brokers de datos ni listas compradas/.test(body));
  check("privacidad: lista los derechos ARCO", /que los eliminemos/.test(body) && /portar tus datos/.test(body));
  check("privacidad: separa los dos consentimientos", /decisión aparte/.test(body) || /son dos consentimientos separados/.test(body));
  check("privacidad: menciona el email comercial en frío", /emails comerciales en frío/.test(body));
  check("privacidad: año actualizado por JS", w3.document.getElementById("year").textContent === String(new Date().getFullYear()));
  check("privacidad: enlace mailto resuelto", (w3.document.querySelector('a[data-link="email"]').getAttribute("href") || "").startsWith("mailto:"));

  // ---- 16. Enlaces internos resuelven
  const w4 = boot("index.html");
  const html = w4.document.documentElement.outerHTML;
  const hrefs = Array.from(w4.document.querySelectorAll("a[href]")).map(a => a.getAttribute("href"));
  const internal = hrefs.filter(h => h && !h.startsWith("#") && !h.startsWith("http") && !h.startsWith("mailto") && !h.startsWith("tel") && h !== "");
  const missing = internal.filter(h => !fs.existsSync(path.join(SITE, h)));
  check("Todos los enlaces internos existen", missing.length === 0, missing.join(", "));
  check("Footer enlaza a privacidad.html", hrefs.includes("privacidad.html"));
  check("El formulario enlaza a privacidad.html", html.includes('href="privacidad.html"'));

  console.log(`\n===== ${ok} PASS / ${fail} FAIL =====`);
  if (fail) { console.log("\nFALLAS:"); failures.forEach(f => console.log("  - " + f)); process.exit(1); }
})();
