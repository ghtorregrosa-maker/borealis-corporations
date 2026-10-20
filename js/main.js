/* Borealis Corporations — comportamiento del sitio */
(() => {
  'use strict';

  const cfg = window.SITE_CONFIG || {};
  const projects = window.SERVICES || [];
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Un servicio es contratable solo si su status es "available". Los que están
     "in_development" se muestran, pero sin promesa: sin botón de consulta y con
     un aviso explícito en el detalle. */
  const isAvailable = p => p.status !== 'in_development';

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* sin almacenamiento */ } }
  };

  /* ---------- Datos de contacto desde config.js ---------- */
  $$('[data-cfg]').forEach(el => {
    const value = cfg[el.dataset.cfg];
    if (value) el.textContent = value;
  });

  const hrefs = {
    email: cfg.email ? 'mailto:' + cfg.email : '',
    phone: cfg.phone ? 'tel:+' + cfg.phone : '',
    whatsapp: cfg.whatsapp
      ? 'https://wa.me/' + cfg.whatsapp + (cfg.whatsappMessage ? '?text=' + encodeURIComponent(cfg.whatsappMessage) : '')
      : '',
    linkedin: cfg.linkedin || '',
    instagram: cfg.instagram || ''
  };
  $$('[data-link]').forEach(a => {
    const href = hrefs[a.dataset.link];
    if (href) a.setAttribute('href', href);
    else a.hidden = true;
  });

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Tema claro / oscuro ---------- */
  const root = document.documentElement;
  const themeBtn = $('#theme-toggle');
  const savedTheme = store.get('borealis-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;

  const isDark = () => root.dataset.theme
    ? root.dataset.theme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;

  function syncTheme() {
    const dark = isDark();
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute('aria-label', dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
  }
  themeBtn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    store.set('borealis-theme', next);
    syncTheme();
  });
  syncTheme();

  /* ---------- Menú móvil ---------- */
  const nav = $('#nav');
  const menuBtn = $('#menu-toggle');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Sección activa en el menú ---------- */
  const navLinks = $$('.nav a[href^="#"]');
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['nosotros', 'servicios', 'paises', 'contacto'].forEach(id => {
      const section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  /* ---------- Contadores ---------- */
  // El contador de servicios muestra solo los contratables, no el total del array.
  $$('[data-count-available]').forEach(el => {
    el.dataset.count = String(projects.filter(isAvailable).length);
  });
  const counters = $$('[data-count]');
  function runCounter(el) {
    const target = Number(el.dataset.count) || 0;
    if (reduceMotion) { el.textContent = target.toLocaleString('es-AR'); return; }
    const duration = 1100;
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('es-AR');
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { runCounter(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(el => counterObserver.observe(el));
  }

  /* ---------- Portfolio: filtros, búsqueda y tarjetas ---------- */
  const filtersEl = $('#filters');
  const gridEl = $('#grid');
  const emptyEl = $('#empty');
  const countEl = $('#results-count');
  const searchEl = $('#search');
  const categories = ['Todos'].concat(Array.from(new Set(projects.map(p => p.category))));
  const state = { category: 'Todos', query: '' };

  function norm(text) {
    return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function buildFilters() {
    filtersEl.textContent = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.textContent = cat;
      btn.setAttribute('aria-pressed', String(cat === state.category));
      btn.addEventListener('click', () => { state.category = cat; buildFilters(); renderGrid(); });
      filtersEl.appendChild(btn);
    });
  }

  function makeCard(p) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'project';
    card.dataset.id = p.id;
    card.setAttribute('aria-haspopup', 'dialog');

    const available = isAvailable(p);
    if (!available) card.classList.add('is-soon');

    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.setProperty('--h', p.hue);
    swatch.setAttribute('aria-hidden', 'true');

    const meta = document.createElement('div');
    meta.className = 'meta';
    const cat = document.createElement('span');
    cat.textContent = p.category;
    meta.append(cat);
    if (!available) {
      const flag = document.createElement('span');
      flag.className = 'flag';
      flag.textContent = 'En desarrollo';
      meta.append(flag);
    }

    const title = document.createElement('h3');
    title.textContent = p.name;
    const summary = document.createElement('p');
    summary.textContent = p.summary;

    card.append(swatch, meta, title, summary);
    card.addEventListener('click', () => openProject(p.id));
    return card;
  }

  function renderGrid() {
    const q = norm(state.query.trim());
    const list = projects.filter(p => {
      const inCategory = state.category === 'Todos' || p.category === state.category;
      const haystack = norm([p.name, p.category, p.summary, p.tags.join(' ')].join(' '));
      return inCategory && (!q || haystack.includes(q));
    });
    gridEl.textContent = '';
    list.forEach(p => gridEl.appendChild(makeCard(p)));
    emptyEl.hidden = list.length > 0;
    countEl.textContent = list.length === 1 ? 'Mostrando 1 servicio' : 'Mostrando ' + list.length + ' servicios';
  }

  searchEl.addEventListener('input', () => { state.query = searchEl.value; renderGrid(); });
  $('#reset-filters').addEventListener('click', () => {
    state.category = 'Todos'; state.query = ''; searchEl.value = '';
    buildFilters(); renderGrid();
  });

  buildFilters();
  renderGrid();

  /* ---------- Detalle de proyecto ---------- */
  const dlg = $('#project-dialog');
  const consultBtn = $('#dlg-consult');
  const soonNote = $('#dlg-soon');
  let currentProject = null;
  let lastTrigger = null;

  function openProject(id) {
    const p = projects.find(item => item.id === id);
    if (!p) return;
    currentProject = p;
    lastTrigger = document.activeElement;

    const available = isAvailable(p);

    $('#dlg-category').textContent = p.category;
    $('#dlg-title').textContent = p.name;
    $('#dlg-desc').textContent = p.description;
    $('#dlg-swatch').style.setProperty('--h', p.hue);
    soonNote.hidden = available;
    consultBtn.hidden = !available;

    const metrics = $('#dlg-metrics');
    metrics.textContent = '';
    p.metrics.forEach(m => {
      const wrap = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = m.label;
      dd.textContent = m.value;
      wrap.append(dt, dd);
      metrics.appendChild(wrap);
    });

    const tags = $('#dlg-tags');
    tags.textContent = '';
    p.tags.forEach(t => {
      const li = document.createElement('li');
      li.textContent = t;
      tags.appendChild(li);
    });

    if (typeof dlg.showModal === 'function') {
      dlg.showModal();
      document.body.classList.add('modal-open');
    } else {
      dlg.setAttribute('open', '');
    }
  }

  function closeProject() {
    if (typeof dlg.close === 'function') dlg.close();
    else dlg.removeAttribute('open');
  }

  dlg.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
  });
  dlg.addEventListener('click', e => { if (e.target === dlg) closeProject(); });
  $('#dlg-close').addEventListener('click', closeProject);
  $('#dlg-close-2').addEventListener('click', closeProject);

  /* ---------- Formulario de contacto ---------- */
  const form = $('#contact-form');
  const statusEl = $('#form-status');
  const topicEl = $('#f-topic');
  const messageEl = $('#f-message');
  const privacyEl = $('#f-privacy');
  const marketingEl = $('#f-marketing');
  const fields = {
    name: $('#f-name'),
    email: $('#f-email'),
    phone: $('#f-phone'),
    message: messageEl
  };

  // Servicio que la persona estaba mirando cuando decidió escribir. Viaja con el
  // lead para saber qué línea de servicio trae demanda.
  let selectedService = null;

  $('#dlg-consult').addEventListener('click', () => {
    if (!currentProject || !isAvailable(currentProject)) return;
    const name = currentProject.name;
    lastTrigger = null;
    closeProject();
    selectedService = currentProject;
    topicEl.value = 'Interés en un servicio';
    if (!messageEl.value.trim()) messageEl.value = 'Hola, me interesa el servicio "' + name + '". Me gustaría recibir más información.';
    document.getElementById('contacto').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    setTimeout(() => fields.name.focus({ preventScroll: true }), reduceMotion ? 0 : 500);
  });

  function setError(key, text) {
    const input = fields[key];
    const out = $('#err-' + key);
    out.textContent = text || '';
    if (text) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function validate(keys) {
    let firstBad = null;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    keys.forEach(key => {
      const value = fields[key].value.trim();
      let msg = '';
      if (key === 'name' && value.length < 2) msg = 'Escribí tu nombre.';
      if (key === 'email' && !emailOk.test(value)) msg = 'Escribí un email válido, por ejemplo nombre@correo.com.';
      if (key === 'phone' && value && value.replace(/\D/g, '').length < 8) msg = 'Escribí un teléfono con al menos 8 dígitos.';
      if (key === 'message' && value.length < 10) msg = 'Escribí un mensaje de al menos 10 caracteres.';
      setError(key, msg);
      if (msg && !firstBad) firstBad = fields[key];
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  ['name', 'email', 'phone', 'message'].forEach(key => {
    fields[key].addEventListener('input', () => { if (fields[key].getAttribute('aria-invalid')) setError(key, ''); });
  });

  // El aviso de privacidad no es un campo de texto: se valida aparte, pero
  // reporta el error en el mismo lugar que el resto.
  function validatePrivacy() {
    const out = $('#err-privacy');
    if (privacyEl.checked) {
      out.textContent = '';
      privacyEl.removeAttribute('aria-invalid');
      return true;
    }
    out.textContent = 'Necesitamos que aceptes el aviso de privacidad para poder responderte.';
    privacyEl.setAttribute('aria-invalid', 'true');
    privacyEl.focus();
    return false;
  }
  privacyEl.addEventListener('change', () => { if (privacyEl.checked) validatePrivacy(); });

  function say(text, kind) {
    statusEl.textContent = text;
    statusEl.className = 'status' + (kind ? ' ' + kind : '');
  }

  // Clave opaca por envío. Si la persona reintenta, el backend no duplica el lead.
  function idempotencyKey() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'k-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  }

  function composeText() {
    const lines = [
      'Hola, soy ' + fields.name.value.trim() + '.',
      'Motivo: ' + topicEl.value + '.',
      '',
      messageEl.value.trim(),
      '',
      'Email: ' + fields.email.value.trim()
    ];
    const phone = fields.phone.value.trim();
    if (phone) lines.push('Teléfono: ' + phone);
    lines.push('');
    lines.push('Acepto el aviso de privacidad para que me respondan esta consulta.');
    if (marketingEl.checked) lines.push('Quiero recibir novedades y ofertas por email.');
    return lines.join('\n');
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if ($('#f-site').value) return; // campo trampa para bots
    if (!validate(['name', 'email', 'phone', 'message'])) { say('Revisá los campos marcados.', 'bad'); return; }
    if (!validatePrivacy()) { say('Revisá los campos marcados.', 'bad'); return; }

    const submitBtn = form.querySelector('[type="submit"]');

    if (cfg.formEndpoint) {
      submitBtn.disabled = true;
      say('Enviando mensaje…');
      // Payload de POST /v1/public/leads (contrato: contracts/public-leads.yaml).
      // `consent` va anidado y con la privacidad separada del consentimiento de
      // email: son dos decisiones distintas y la ley pide poder responderlas por
      // separado. `companyWebsite` es el campo trampa: vacío para las personas.
      const payload = {
        name: fields.name.value.trim(),
        email: fields.email.value.trim(),
        phone: fields.phone.value.trim(),
        topic: topicEl.value,
        message: messageEl.value.trim(),
        consent: {
          privacyNotice: true,
          marketingEmail: marketingEl.checked,
          locale: navigator.language || 'es-AR'
        },
        companyWebsite: $('#f-site').value,
        pageUrl: window.location.href
      };
      if (selectedService) {
        payload.serviceId = selectedService.id;
        payload.serviceStatusAtSubmit = isAvailable(selectedService) ? 'available' : 'in_development';
      }
      try {
        const res = await fetch(cfg.formEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Idempotency-Key': idempotencyKey()
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        selectedService = null;
        say('Mensaje enviado. Te respondemos dentro de un día hábil.', 'ok');
      } catch (err) {
        say('No pudimos enviar el mensaje. Probá de nuevo o escribinos por WhatsApp o email.', 'bad');
      } finally {
        submitBtn.disabled = false;
      }
      return;
    }

    if (!cfg.email) { say('El formulario no tiene un email configurado. Escribinos por WhatsApp.', 'bad'); return; }
    const subject = 'Consulta desde la web: ' + topicEl.value;
    window.location.href = 'mailto:' + cfg.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(composeText());
    say('Se abrió tu app de correo con el mensaje listo. Tocá enviar para completarlo.', 'ok');
  });

  $('#send-wa').addEventListener('click', () => {
    if (!cfg.whatsapp) { say('WhatsApp no está configurado en este sitio.', 'bad'); return; }
    if (!validate(['name', 'message'])) { say('Revisá los campos marcados.', 'bad'); return; }
    if (!validatePrivacy()) { say('Revisá los campos marcados.', 'bad'); return; }
    const url = 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(composeText());
    window.open(url, '_blank', 'noopener');
    say('Se abrió WhatsApp con tu mensaje.', 'ok');
  });

  /* ---------- Copiar email ---------- */
  const copyBtn = $('#copy-email');
  if (!cfg.email) copyBtn.hidden = true;
  copyBtn.addEventListener('click', async () => {
    const text = cfg.email || '';
    let done = false;
    try {
      await navigator.clipboard.writeText(text);
      done = true;
    } catch (err) {
      const tmp = document.createElement('textarea');
      tmp.value = text;
      tmp.setAttribute('readonly', '');
      tmp.style.position = 'fixed';
      tmp.style.opacity = '0';
      document.body.appendChild(tmp);
      tmp.select();
      try { done = document.execCommand('copy'); } catch (e2) { done = false; }
      tmp.remove();
    }
    const original = 'Copiar';
    copyBtn.textContent = done ? 'Copiado' : 'No se pudo copiar';
    setTimeout(() => { copyBtn.textContent = original; }, 1800);
  });
})();
