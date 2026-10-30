/* Andrea · componentes y vistas principales */
const views = {};

/* Consejo breve de Yasmin dentro de un formulario: presente sin estorbar. */
function yasminTip(texto) {
  return `<p class="yasmin-tip tiny">${icon('chat', 13)} <strong>Yasmin:</strong> ${esc(texto)}</p>`;
}
function card(content, className = '') {
  return `<section class="card ${className}">${content}</section>`;
}
function badge(text, tone = '') {
  return `<span class="badge ${tone}">${esc(text)}</span>`;
}
function emptyBox(title, text = '') {
  return `<div class="empty"><strong>${esc(title)}</strong>${text ? `<span>${esc(text)}</span>` : ''}</div>`;
}
function rangeField(name, label, value, min = 0, max = 10, low = '', high = '', def = 5) {
  const v = (value === null || value === undefined || value === '') ? def : value;
  return `<div class="range-row">
    <div class="range-top"><label for="f_${name}">${esc(label)}</label><span class="range-value" data-range-label="${name}">${esc(v)}</span></div>
    <input id="f_${name}" type="range" name="${name}" min="${min}" max="${max}" value="${esc(v)}" data-range="${name}">
    <div class="range-ends"><span>${esc(low)}</span><span>${esc(high)}</span></div>
  </div>`;
}
function numberField(name, label, value, min = '', max = '', step = '1', placeholder = '') {
  return `<div><label for="f_${name}">${esc(label)}</label><input id="f_${name}" type="number" name="${name}" value="${value === null || value === undefined ? '' : esc(value)}" ${min !== '' ? `min="${min}"` : ''} ${max !== '' ? `max="${max}"` : ''} step="${step}" placeholder="${esc(placeholder)}"></div>`;
}
function selectField(name, label, value, options) {
  return `<div><label for="f_${name}">${esc(label)}</label><select id="f_${name}" name="${name}">${options.map(o => `<option value="${esc(o.value)}" ${String(o.value) === String(value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select></div>`;
}
function textareaField(name, label, value, placeholder = '') {
  return `<div><label for="f_${name}">${esc(label)}</label><textarea id="f_${name}" name="${name}" placeholder="${esc(placeholder)}">${esc(value || '')}</textarea></div>`;
}
function statusTone(status) {
  if (status === 'asistida' || status === 'agendada') return 'success';
  if (status === 'cancelada') return 'danger';
  if (status === 'pendiente') return 'info';
  return 'warn';
}
function trafficMessage(value) {
  if (value === 'green') return 'Qué bueno, Andrea. Guarda qué hizo bueno el día: también es información valiosa.';
  if (value === 'yellow') return 'Hoy va a ser un día difícil. Baja la exigencia: medicamentos, agua, comida y compañía.';
  if (value === 'red') return 'Hoy necesitas apoyo. No te quedes sola: abre tu plan o llama a alguien de confianza.';
  return '¿Cómo está tu día? Elige un color. No es una nota; es una guía para saber qué necesitas.';
}
function trafficBlock(day) {
  const t = day?.traffic || '';
  return `<div class="traffic-options">
    <button class="traffic green ${t === 'green' ? 'active' : ''}" data-action="traffic" data-value="green"><span class="dot"></span>Bien</button>
    <button class="traffic yellow ${t === 'yellow' ? 'active' : ''}" data-action="traffic" data-value="yellow"><span class="dot"></span>Difícil</button>
    <button class="traffic red ${t === 'red' ? 'active' : ''}" data-action="traffic" data-value="red"><span class="dot"></span>Necesito ayuda</button>
  </div>
  <p class="small ${t === 'red' ? 'crisis-text' : 'muted'}">${esc(trafficMessage(t))}</p>
  ${t === 'red' ? `<button class="btn danger small" data-action="crisis">Abrir mi plan</button>` : ''}`;
}
function doseRowCompact(d, date) {
  const status = doseStatus(date, d.key);
  return `<div class="dose-row ${status}">
    <button class="dose-check ${status}" data-action="toggle-dose" data-date="${date}" data-key="${esc(d.key)}" aria-label="${status === 'taken' ? 'Desmarcar' : 'Marcar como tomada'} ${esc(d.med.name)}">${status === 'taken' ? icon('check', 15) : ''}</button>
    <div class="dose-info"><strong>${esc(d.med.emoji || '💊')} ${esc(d.med.name)} <span class="muted">${esc(d.med.strength || '')}</span></strong><span>${esc(d.amount)} · ${esc(d.time)}</span></div>
    <span class="dose-status">${status === 'taken' ? 'Tomada' : status === 'skipped' ? 'Omitida' : ''}</span>
  </div>`;
}
function doseRowFull(d, date) {
  const status = doseStatus(date, d.key);
  const rec = findDay(date)?.meds?.[d.key] || {};
  const at = rec.at ? new Date(rec.at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '';
  return `<div class="dose-row full ${status}">
    <div class="dose-time">${esc(d.time)}</div>
    <div class="dose-main">
      <div class="dose-title">${esc(d.med.emoji || '💊')} ${esc(d.med.name)} ${esc(d.med.strength || '')}</div>
      <div class="dose-sub">${esc(d.amount)} · ${esc(d.dose || '')}</div>
      <div class="dose-note">${esc(d.med.instructions || '')}</div>
      ${status === 'skipped' && rec.reason ? `<div class="dose-skip">Omitida: ${esc(rec.reason)}</div>` : ''}
    </div>
    <div class="dose-actions">
      ${status === 'taken' ? `<span class="badge success">Tomada ${esc(at)}</span>` : ''}
      ${status === 'pending' ? `<button class="btn tiny primary" data-action="toggle-dose" data-date="${date}" data-key="${esc(d.key)}">Tomar</button>` : ''}
      ${status === 'pending' ? `<button class="btn tiny ghost" data-action="skip-dose" data-date="${date}" data-key="${esc(d.key)}">Omitir</button>` : ''}
      ${status !== 'pending' ? `<button class="btn tiny ghost" data-action="undo-dose" data-date="${date}" data-key="${esc(d.key)}">Deshacer</button>` : ''}
    </div>
  </div>`;
}
function apptCard(a, isNext = false) {
  const d = a.date ? formatDate(a.date, { weekday: 'short' }) : 'Aún por agendar';
  const time = a.time ? ` · ${a.time}` : '';
  const until = a.date ? daysUntil(a.date) : null;
  const untilText = until === null ? '' : until === 0 ? 'Hoy' : until > 0 ? `En ${until} día${until === 1 ? '' : 's'}` : `Hace ${Math.abs(until)} día${Math.abs(until) === 1 ? '' : 's'}`;
  return `<article class="appt-card ${isNext ? 'next' : ''}">
    <div class="appt-top">
      <div>
        <div class="row" style="margin-bottom:5px">${badge(a.type || 'Cita', statusTone(a.status))}${untilText ? badge(untilText, 'info') : ''}</div>
        <div class="appt-title">${esc(a.title || a.type || 'Cita')}</div>
        <div class="appt-meta"><strong>${esc(d)}${esc(time)}</strong>${a.place ? ` · ${esc(a.place)}` : ''}</div>
      </div>
      ${isNext ? `<span class="badge success">Próxima</span>` : ''}
    </div>
    ${a.notes ? `<div class="appt-notes">${nl2br(a.notes)}</div>` : ''}
    <div class="appt-actions">
      ${a.phone ? `<a class="btn tiny" href="${phoneHref(a.phone)}">${icon('phone', 14)} Llamar</a>` : ''}
      <button class="btn tiny" data-action="edit-appt" data-id="${esc(a.id)}">Editar</button>
      <button class="btn tiny ghost" data-action="prepare-appt" data-id="${esc(a.id)}">Preparar</button>
    </div>
  </article>`;
}
function chart(days, series, opts = {}) {
  const max = opts.max || 10;
  const step = opts.step || (max === 12 ? 3 : 2);
  const w = 640, h = 220, padX = 30, padY = 24;
  const n = days.length;
  const x = i => padX + (n <= 1 ? 0 : (i * (w - padX * 2) / (n - 1)));
  const y = v => h - padY - (v / max) * (h - padY * 2);
  let grid = '';
  for (let v = 0; v <= max; v += step) {
    grid += `<line x1="${padX}" y1="${y(v)}" x2="${w - padX}" y2="${y(v)}" stroke="#D6E8DF" stroke-width="1"/>`;
    grid += `<text x="${padX - 8}" y="${y(v) + 3}" text-anchor="end" font-size="10" fill="#5F7C73">${v}</text>`;
  }
  let paths = '';
  series.forEach(s => {
    const pts = days.map((d, i) => (typeof d[s.key] === 'number' ? { x: x(i), y: y(d[s.key]) } : null)).filter(Boolean);
    if (pts.length > 1) {
      paths += `<polyline points="${pts.map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
    }
    pts.forEach(p => { paths += `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${s.color}"/>`; });
  });
  const labels = days.map((d, i) => {
    if (n > 10 && i % 3 !== 0 && i !== n - 1) return '';
    return `<text x="${x(i)}" y="${h - 5}" text-anchor="middle" font-size="9" fill="#5F7C73">${esc(formatShort(d.date))}</text>`;
  }).join('');
  return `<div class="chart-wrap"><svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(opts.label || 'Gráfica de seguimiento')}">${grid}${paths}${labels}</svg></div>
    <div class="chart-legend">${series.map(s => `<span><i class="legend-dot" style="background:${s.color}"></i>${esc(s.label)}</span>`).join('')}</div>`;
}
function ring(pct, label = 'hoy') {
  const r = 34, c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return `<div class="ring" role="img" aria-label="${pct}% de ${label}">
    <svg viewBox="0 0 86 86">
      <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1F7A63"/><stop offset="1" stop-color="#D9A441"/></linearGradient></defs>
      <circle class="track" cx="43" cy="43" r="${r}" fill="none" stroke-width="8"/>
      <circle class="bar" cx="43" cy="43" r="${r}" fill="none" stroke-width="8" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
    </svg>
    <div class="ring-label"><div><strong>${pct}%</strong><span>${esc(label)}</span></div></div>
  </div>`;
}

function checklistRowHtml(item) {
  const attrs = item.action === 'nav'
    ? `data-action="nav" data-id="${esc(item.nav)}"`
    : item.action === 'toggle-dose'
      ? `data-action="toggle-dose" data-date="${esc(item.date)}" data-key="${esc(item.doseKey)}"`
      : `data-action="checklist-toggle" data-key="${esc(item.careKey)}" data-date="${esc(item.date)}"`;
  return `<button class="checklist-item ${item.done ? 'done' : ''} ${item.skipped ? 'skipped' : ''}" ${attrs} aria-pressed="${item.done ? 'true' : 'false'}">
    <span class="checklist-check">${item.done ? icon('check', 14) : ''}</span>
    <span class="checklist-main"><strong>${esc(item.label)}</strong><span>${esc(item.detail || '')}</span></span>
    ${item.skipped ? '<span class="checklist-tag">Omitida</span>' : ''}
  </button>`;
}

function checklistCard() {
  const today = todayISO();
  const { items, done, total, pct } = checklistProgress(today);
  const meds = items.filter(i => i.group === 'meds');
  const care = items.filter(i => i.group === 'care');
  const checkin = items.find(i => i.group === 'checkin');
  const faltan = items.filter(i => !i.done).length;
  const tomadas = meds.filter(i => i.done && !i.skipped).length;
  return card(`<div class="card-head"><div><h2>✅ Tu checklist de hoy</h2><div class="sub">Lo básico, no una prueba.</div></div>${ring(pct, 'cumplido')}</div>
    <div class="progress"><span style="width:${pct}%"></span></div>
    <p class="small" style="margin-top:10px">${done} de ${total} cosas. ${faltan ? 'Lo que falta no es una deuda: es lo próximo.' : 'Hoy cumpliste lo básico. No es poco.'}</p>
    <div class="checklist-list">
      ${meds.length
        ? `<div class="checklist-group"><div class="checklist-group-head"><strong>Medicamentos</strong><span>${tomadas}/${meds.length}</span></div>${meds.map(checklistRowHtml).join('')}</div>`
        : `<div class="checklist-group"><div class="checklist-group-head"><strong>Medicamentos</strong><span>Sin tomas hoy</span></div><button class="checklist-item" data-action="nav" data-id="medicamentos"><span class="checklist-check"></span><span class="checklist-main"><strong>Revisar medicamentos</strong><span>No hay tomas programadas para hoy.</span></span></button></div>`}
      <div class="checklist-group"><div class="checklist-group-head"><strong>Cuidados base</strong><span>${care.filter(i => i.done).length}/${care.length}</span></div>${care.map(checklistRowHtml).join('')}</div>
      ${checkin ? `<div class="checklist-group"><div class="checklist-group-head"><strong>Tu voz</strong></div>${checklistRowHtml(checkin)}</div>` : ''}
    </div>
    <div class="form-actions"><button class="btn small ghost" data-action="minimum">Modo mínimo</button><button class="btn small" data-action="nav" data-id="medicamentos">Ver mis tomas</button></div>`, 'checklist-card');
}

/* La frase del día: el momento con foco de Hoy. Mariposa = transformación. */
function fraseCard() {
  if (state.settings.feEnabled === false) return '';
  const f = feElegida(ui.feOffset || 0);
  const temas = { renacer: 'Renacer', fortaleza: 'Tu fortaleza', libertad: 'Tu libertad', belleza: 'Tu belleza', fe: 'Tu fe' };
  return `<section class="fe-hero" aria-label="Frase del día">
    <div class="fe-hero-top"><span class="fe-mariposa">🦋</span><div><div class="fe-kicker">Frase de hoy · ${temas[f.tema] || 'Para ti'}</div><div class="fe-sub">${esc(f.tema === 'fe' ? 'Tu momentito de fe' : 'Como las mariposas')}</div></div></div>
    <p class="fe-frase">${esc(f.frase)}</p>
    <p class="fe-cierre">${esc(f.cierre)}</p>
    <div class="form-actions"><button class="btn small solid-fe" data-action="hablar-frase">Hablar de esta frase con Yasmin</button><button class="btn small ghost" data-action="fe-otra">Otra frase</button><button class="link-btn" data-action="toggle-fe">No mostrar esto</button></div>
  </section>`;
}

/* ---------- Hoy ---------- */
views.hoy = function () {
  if (!isSetup()) return viewWelcome();
  const today = todayISO();
  const day = findDay(today) || {};
  const doses = dosesFor(today);
  const taken = doses.filter(d => doseStatus(today, d.key) === 'taken').length;
  const skipped = doses.filter(d => doseStatus(today, d.key) === 'skipped').length;
  const pct = doses.length ? Math.round(taken / doses.length * 100) : 0;
  const c = day.checkin || {};
  const next = nextAppointment();
  const nextAgenda = nextAgendaItem({ includeUndated: true });
  const todayAgenda = agendaItemsFor(today);
  const doneAgenda = todayAgenda.filter(x => x.done).length;
  const syncPending = agendaPendingSync();
  const micro = MICRO_STEPS[ui.microOffset % MICRO_STEPS.length];
  /* En Hoy se muestra la familia primero; el detalle completo vive en Seguridad. */
  const FAMILIA_RE = /mama|mamá|papa|papá|hij[ao]|esposo|sobrin[ao]|prim[ao]|ti[ao]|familia/i;
  const contacts = state.contacts.slice(0, 9).sort((a, b) => (FAMILIA_RE.test(`${b.role || ''} ${b.name || ''}`) ? 1 : 0) - (FAMILIA_RE.test(`${a.role || ''} ${a.name || ''}`) ? 1 : 0)).slice(0, 5);
  const proxima = nextDose();
  const momento = momentoDelDia();
  const nombre = profileName();

  return `
    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow">${esc(formatLongDate(today))}</div>
        <h1>${esc(greeting())}${nombre ? ', ' + esc(nombre) : ''}.</h1>
        <p>${day.traffic ? esc(trafficMessage(day.traffic)) : 'Hoy no tienes que poder con todo. Solo con el siguiente paso. Y si ni eso, con pedir compañía.'}</p>
        <div class="hero-actions">
          <button class="btn solid" data-action="focus-checkin">¿Cómo me siento?</button>
          <button class="btn" data-action="open-yasmin">Hablar con Yasmin</button>
          <button class="btn" data-action="minimum">Modo mínimo</button>
        </div>
      </div>
      <div class="hero-sun">${brandMark(230)}</div>
    </section>

    <button class="safety-strip" data-action="crisis">
      ${icon('shield', 19)} <span>Si hoy la cabeza te juega en contra, no estás sola. Tu plan está a un toque.</span><span class="arrow">→</span>
    </button>

    ${datosVacios() ? `<section class="card" style="border-color:#E5CFA3;background:linear-gradient(180deg,#FDF6E6,#FFFDF8);margin-bottom:18px">
      <div class="card-head"><div><h2>Aquí todavía no hay nada tuyo</h2><div class="sub">Los datos no viajan solos: viven en el teléfono donde se registraron.</div></div></div>
      <p class="small">Si ya tienes el respaldo que te dejó tu hijo, impórtalo y aparece todo: medicinas, citas, tu historia y la foto de la inducción.</p>
      <div class="form-actions"><button class="btn primary small" data-action="import-json">Importar mi respaldo</button><button class="btn small ghost" data-action="nav" data-id="ajustes">Configurar mi perfil</button></div>
    </section>` : ''}

    ${proxima ? `<div class="next-dose">
      <div class="hour">${esc(proxima.time)}</div>
      <div class="who">
        <strong>${esc(proxima.med.emoji || '💊')} ${esc(proxima.med.name)} ${esc(proxima.med.strength || '')}</strong>
        <span>${esc(proxima.amount)} · ${doseStatus(today, proxima.key) === 'pending' ? 'pendiente' : 'registrada'}</span>
      </div>
      <button class="btn primary" data-action="toggle-dose" data-date="${today}" data-key="${esc(proxima.key)}">Ya la tomé</button>
    </div>` : ''}

    ${checklistCard()}

    ${syncPending ? `<button class="sync-banner" data-action="view-agenda">
      ${icon('bell', 17)}
      <div><strong>Tu agenda cambió.</strong><span>Descarga otra vez el calendario y ábrelo en tu teléfono. Así las alarmas quedan actualizadas.</span></div>
      <span class="arrow">→</span>
    </button>` : ''}

    <section class="card today-agenda">
      <div class="card-head">
        <div><h2>Mi agenda de hoy</h2><div class="sub">${todayAgenda.length ? `${todayAgenda.length} ${todayAgenda.length === 1 ? 'cosa' : 'cosas'} para hoy${doneAgenda ? ` · ${doneAgenda} ${doneAgenda === 1 ? 'hecha' : 'hechas'}` : ''}` : 'Un lugar para tus citas, llamadas y recordatorios.'}</div></div>
        <div class="row"><button class="btn tiny ghost" data-action="add-event" data-date="${today}">${icon('plus', 13)} Recordatorio</button><button class="link-btn" data-action="view-agenda">Ver calendario</button></div>
      </div>
      ${todayAgenda.length ? `<div class="today-agenda-list">${todayAgenda.map(item => `<article class="today-agenda-item ${item.done ? 'done' : ''}">
        <span class="ta-time">${esc(item.time || 'Todo el día')}</span>
        <div class="ta-main">
          <strong>${esc(item.title)}</strong>
          <span class="tiny muted">${esc(item.kind === 'appt' ? (item.type || 'Cita') : (item.type || 'Recordatorio'))}${item.place ? ' · ' + esc(item.place) : ''}${item.done ? ' · hecho' : ''}</span>
        </div>
        ${item.kind === 'event'
          ? `<button class="agenda-check ${item.done ? 'done' : ''}" data-action="toggle-event-done" data-id="${esc(item.id)}" data-date="${esc(today)}" aria-label="${item.done ? 'Volver a pendiente' : 'Marcar como hecho'}: ${esc(item.title)}">${item.done ? icon('check', 14) : ''}</button>`
          : `<button class="btn tiny ghost" data-action="edit-appt" data-id="${esc(item.id)}">Ver cita</button>`}
      </article>`).join('')}</div>` : emptyBox('Nada más para hoy', 'Puedes agregar un recordatorio suelto o escribirle a Yasmin lo que no quieres olvidar.')}
      <form data-form="agenda-quick" class="agenda-quick hoy-quick">
        <label for="hoy-quick-input" class="sr-only">Agregar algo a la agenda de hoy</label>
        <input id="hoy-quick-input" name="quick" placeholder="Ej: mañana a las 3, llamar a mamá" autocomplete="off">
        <button class="btn primary small" type="submit">${icon('plus', 14)} Agregar</button>
      </form>
      ${nextAgenda && nextAgenda.date && nextAgenda.date !== today ? `<div class="today-next"><span class="eyebrow">Próximo</span><strong>${esc(nextAgenda.title)}</strong><span class="tiny muted">${esc(friendlyDate(nextAgenda.date))}${nextAgenda.time ? ' · ' + esc(nextAgenda.time) : ''}</span><button class="link-btn tiny" data-action="view-agenda">Abrir</button></div>` : ''}
      ${nextAgenda && !nextAgenda.date ? `<div class="today-next"><span class="eyebrow">Por agendar</span><strong>${esc(nextAgenda.title)}</strong><span class="tiny muted">Falta la fecha</span><button class="link-btn tiny" data-action="edit-appt" data-id="${esc(nextAgenda.id)}">Completar</button></div>` : ''}
    </section>

    ${momento ? `<div class="momento-card" style="cursor:pointer" data-action="abrir-momento" data-id="${esc(momento.id)}">
      ${momento.photoId ? `<img data-foto="${esc(momento.photoId)}" alt="Recuerdo de ${esc(momento.from || 'tu familia')}">` : `<div class="no-photo">${icon('gift', 54)}</div>`}
      <div class="body">
        <div class="eyebrow" style="color:#F4D998">Un momento para ti</div>
        <blockquote>${esc(momento.text || '')}</blockquote>
        <div class="from">— ${esc(momento.from || 'Tu familia')}${momento.relation ? ' · ' + esc(momento.relation) : ''}</div>
        <div class="form-actions"><button class="btn tiny" data-action="abrir-momento" data-id="${esc(momento.id)}">Verlo completo</button></div>
      </div>
    </div>` : card(`<div class="card-head"><div><h2>Un momento para ti</h2><div class="sub">En pausa mientras organizas los recuerdos.</div></div></div>
      <p class="small">Este espacio queda esperando. Cuando esté lista la carpeta de recuerdos, aquí vivirán las fotos y las palabras de tu gente.</p>
      <div class="form-actions"><button class="btn small ghost" data-action="nav" data-id="momentos">Ver Momentos</button></div>`)}

    ${fraseCard()}

    <div class="grid grid-2">
      ${card(`<div class="card-head"><div><h2>🌤️ ¿Cómo está tu día?</h2><div class="sub">Un color, no una nota.</div></div></div>${trafficBlock(day)}`)}
      ${card(`<div class="card-head"><div><h2>💭 Registro de hoy</h2><div class="sub">${c.at ? 'Guardado a las ' + new Date(c.at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '60 segundos para saber cómo estás.'}</div></div>${c.at ? badge('Guardado', 'success') : ''}</div>
        <form data-form="quick-checkin">
          <div class="quick-grid">
            ${rangeField('mood', 'Ánimo', c.mood, 0, 10, 'Bajo', 'Alto', 5)}
            ${rangeField('anxiety', 'Ansiedad', c.anxiety, 0, 10, 'Calma', 'Mucha', 5)}
            ${rangeField('pain', 'Dolor', c.pain, 0, 10, 'Sin dolor', 'Máximo', 0)}
            ${rangeField('sleepQuality', 'Sueño', c.sleepQuality, 0, 10, 'Malo', 'Bueno', 5)}
          </div>
          ${yasminTip('No hay número equivocado. Si hoy es un «no sé», también sirve.')}
          <div class="form-actions"><button class="btn primary" type="submit">Guardar</button><button class="btn ghost" type="button" data-action="nav" data-id="registro">Registro completo</button></div>
        </form>`)}
    </div>

    <div class="grid grid-2">
      ${card(`<div class="card-head"><div><h2>🦋 Yasmin te espera</h2><div class="sub">Compañía para hablar de lo que sea.</div></div>${badge('En línea', 'success')}</div>
        <p class="small">Cuenta cómo vas, pregunta por tus pastillas o pídele respirar contigo.</p>
        <div class="form-actions"><button class="btn primary small" data-action="open-yasmin">Hablar ahora</button><button class="btn small ghost" data-action="yasmin-sugerencia">Sorpréndeme</button></div>`)}
      ${card(`<div class="card-head"><div><h2>📅 Próxima cita</h2><div class="sub">Lo que toca agendar o recordar.</div></div><div class="row"><button class="link-btn" data-action="view-agenda">Agenda</button><button class="link-btn" data-action="nav" data-id="citas">Ver todas</button></div></div>
        ${next ? apptCard(next, true) : emptyBox('Aún no hay citas', 'Agenda psiquiatría, psicología y fisiatría.')}`)}
    </div>

    <div class="grid grid-2">
      ${card(`<div class="card-head"><div><h2>💊 Tus tomas de hoy</h2><div class="sub">El detalle está en tu checklist de arriba.</div></div>${ring(pct, 'tomado')}</div>
        <div class="stat-grid">
          <div class="stat"><div class="value">${taken}</div><div class="label">Tomadas</div></div>
          <div class="stat"><div class="value">${skipped}</div><div class="label">Omitidas</div></div>
          <div class="stat"><div class="value">${Math.max(0, doses.length - taken - skipped)}</div><div class="label">Por tomar</div></div>
          <div class="stat"><div class="value">${doses.length}</div><div class="label">Total</div></div>
        </div>
        <div class="form-actions"><button class="btn small" type="button" data-action="nav" data-id="medicamentos">Ver todos</button><button class="btn small ${state.settings.icsAt ? 'ghost' : 'primary'}" type="button" data-action="download-ics">${icon('download', 14)} Alarmas</button></div>
        ${state.settings.icsAt ? '' : `<p class="tiny" data-alarmas-pendientes style="margin-top:9px;color:var(--primary)"><strong>Para que suenen aunque Andrea esté cerrada:</strong> descarga las alarmas y ábrelas en el calendario del teléfono.</p>`}`)}
      ${card(`<div class="card-head"><div><h2>🐣 Un paso pequeño</h2><div class="sub">1% mejor, sin prisa.</div></div>${day.micro ? badge('Hecho', 'success') : ''}</div>
        <p style="font-family:var(--font-display);font-size:1.12rem;line-height:1.45;margin:4px 0 12px">${esc(micro)}</p>
        <div class="form-actions"><button class="btn small primary" data-action="micro-done">${day.micro ? 'Hecho hoy' : 'Marcar como hecho'}</button><button class="btn small ghost" data-action="micro-next">Otro paso</button></div>`)}
    </div>

    <div class="grid grid-2">
      ${card(`<div class="card-head"><div><h2>🌱 Lo bueno de hoy</h2><div class="sub">Tres cosas pequeñas. El día bueno también se guarda.</div></div>${(day.win || (day.gracias || []).filter(Boolean).length) ? badge('Guardado', 'success') : ''}</div>
        <form data-form="bueno">
          <input name="win" value="${esc(day.win || '')}" placeholder="1. Algo que salió bien (aunque sea mínimo)">
          <input name="gracias1" value="${esc((day.gracias || [])[0] || '')}" placeholder="2. Alguien o algo que te dio calma" style="margin-top:8px">
          <input name="gracias2" value="${esc((day.gracias || [])[1] || '')}" placeholder="3. Algo tuyo que hoy reconoces" style="margin-top:8px">
          <div class="form-actions"><button class="btn small primary" type="submit">Guardar lo bueno</button></div>
        </form>`)}
      ${card(`<div class="card-head"><div><h2>💛 Mi red</h2><div class="sub">Pedir compañía también es cuidarse.</div></div><button class="link-btn" data-action="nav" data-id="seguridad">Ver plan</button></div>
        ${contacts.length ? contacts.map(ct => `<div class="between" style="padding:7px 0;border-bottom:1px solid var(--line)"><div><strong style="font-size:.88rem">${esc(ct.name)}</strong><div class="tiny muted">${esc(ct.role || '')}</div></div>${ct.phone ? `<a class="btn tiny" href="${phoneHref(ct.phone)}">${icon('phone', 13)} Llamar</a>${waHref(ct.phone) ? `<a class="btn tiny ghost" href="${waHref(ct.phone)}" target="_blank" rel="noopener" aria-label="WhatsApp a ${esc(ct.name)}">${icon('chat', 13)} WhatsApp</a>` : ''}` : `<span class="tiny muted">Sin teléfono</span>`}</div>`).join('') : emptyBox('Completa tu red', 'Agrega al menos dos personas de confianza.')}`)}
    </div>

    `;
};

/* ---------- Medicamentos ---------- */
views.medicamentos = function () {
  const tabs = [['hoy', 'Hoy'], ['todos', 'Todos'], ['inventario', 'Inventario'], ['alarmas', 'Alarmas']];
  return `
    <div class="chips">${tabs.map(([id, label]) => `<button class="chip ${ui.medTab === id ? 'active' : ''}" data-action="med-tab" data-value="${id}">${label}</button>`).join('')}</div>
    ${ui.medTab === 'hoy' ? medsToday() : ui.medTab === 'todos' ? medsAll() : ui.medTab === 'inventario' ? medsInventory() : medsAlarms()}`;
};

function medsToday() {
  const today = todayISO();
  const doses = dosesFor(today);
  const stats = adherenceStats(7);
  const tomadasHoy = doses.filter(d => doseStatus(today, d.key) === 'taken').length;
  const omitidasHoy = doses.filter(d => doseStatus(today, d.key) === 'skipped').length;
  const pendientesHoy = Math.max(0, doses.length - tomadasHoy - omitidasHoy);
  const pctHoy = doses.length ? Math.round(tomadasHoy / doses.length * 100) : 0;
  const groups = {};
  doses.forEach(d => { (groups[d.time] = groups[d.time] || []).push(d); });
  const recentEffects = state.sideEffects.slice(-3).reverse();
  const labels = { '07:00': 'Mañana', '15:00': 'Tarde', '23:00': 'Noche' };
  return `
    <div class="grid grid-2">
      ${card(`<div class="card-head"><div><h2>💊 Hoy</h2><div class="sub">${formatLongDate(today)}</div></div>${badge(stats.pct == null ? 'Sin datos' : stats.pct + '% en 7 días', 'info')}</div>
        <div class="progress"><span style="width:${pctHoy}%"></span></div>
        <div class="stat-grid">
          <div class="stat"><div class="value">${tomadasHoy}</div><div class="label">Tomadas</div></div>
          <div class="stat"><div class="value">${omitidasHoy}</div><div class="label">Omitidas</div></div>
          <div class="stat"><div class="value">${pendientesHoy}</div><div class="label">Por tomar</div></div>
          <div class="stat"><div class="value">${doses.length}</div><div class="label">Total</div></div>
        </div>
        <p class="tiny muted" style="margin-top:10px">${pctHoy}% de las tomas de hoy. El porcentaje de arriba es el de los últimos 7 días. La adherencia es un dato, no una nota.</p>`)}
      ${card(`<div class="card-head"><div><h2>⏰ Alarmas y calendario</h2><div class="sub">La opción más confiable en cualquier teléfono.</div></div></div>
        <p class="small">Descárgalos al calendario del teléfono: suenan aunque Andrea esté cerrada.</p>
        <div class="form-actions"><button class="btn primary small" data-action="download-ics">Descargar .ics con nombres</button><button class="btn small" data-action="download-ics-discreet">Descargar discreto</button></div>
        <div class="divider"></div>
        <p class="tiny muted">Los avisos de la app solo funcionan con Andrea abierta o instalada. No los uses como única alarma.</p>`)}
    </div>
    <div class="divider"></div>
    ${doses.length ? Object.keys(groups).sort().map(time => `<div class="time-group"><div class="time-label"><strong>${esc(time)}</strong><span>${labels[time] || 'Toma'}</span></div>${groups[time].map(d => doseRowFull(d, today)).join('')}</div>`).join('') : emptyBox('No hay tomas para hoy', 'Revisa que tus medicamentos estén activos y con horario.')}
    <div class="grid grid-2">
      ${card(`<div class="card-head"><div><h2>🤍 Si se te pasó una toma</h2></div></div><p class="small">No tomes el doble. Anota lo que pasó y consulta con tu médico o farmacéutico. Si es una dosis crítica, llama.</p><div class="form-actions"><button class="btn small" data-action="add-effect">Registrar efecto o novedad</button></div>`)}
      ${card(`<div class="card-head"><div><h2>Efectos recientes</h2><div class="sub">Para llevar a la consulta.</div></div><button class="link-btn" data-action="add-effect">Agregar</button></div>
        ${recentEffects.length ? recentEffects.map(e => `<div class="between" style="padding:6px 0;border-bottom:1px solid var(--line)"><div><strong style="font-size:.86rem">${esc(e.symptom)}</strong><div class="tiny muted">${esc(formatShort(e.date))} · intensidad ${esc(e.severity)}/10</div></div><button class="link-btn tiny" data-action="delete-effect" data-id="${esc(e.id)}">Quitar</button></div>`).join('') : emptyBox('Sin efectos registrados', 'Anota somnolencia, mareo, náuseas o cualquier cambio.')}`)}
    </div>`;
}

function medsAll() {
  return `<div class="between" style="margin-bottom:12px"><div><h2 style="font-size:1.2rem">Todos los medicamentos</h2><div class="small muted">${activeMeds().length} activos de ${state.medications.length}</div></div><button class="btn primary small" data-action="add-med">${icon('plus', 15)} Agregar</button></div>
    <div class="stack">${state.medications.length ? state.medications.map(m => `<article class="card">
      <div class="card-head"><div><div class="row" style="margin-bottom:4px">${badge(m.active === false ? 'Inactivo' : 'Activo', m.active === false ? 'danger' : 'success')}${m.warning ? badge('Revisar', 'warn') : ''}</div><h2 style="font-size:1.15rem">${esc(m.name)} ${esc(m.strength || '')}</h2><div class="sub">${esc(m.form || '')} · ${esc(m.doseLabel || '')}</div></div><div class="card-actions"><button class="btn tiny" data-action="edit-med" data-id="${esc(m.id)}">Editar</button><button class="btn tiny ghost" data-action="toggle-med" data-id="${esc(m.id)}">${m.active === false ? 'Activar' : 'Desactivar'}</button></div></div>
      <div class="stack">
        ${(m.schedule || []).map(s => `<div class="between" style="background:var(--surface-2);padding:8px 10px;border-radius:12px"><div><strong>${esc(s.time)}</strong> · ${esc(s.amount)} ${s.dose ? `(${esc(s.dose)})` : ''}</div><span class="tiny muted">${esc(m.instructions || '')}</span></div>`).join('')}
      </div>
      <div class="divider"></div>
      <p class="small">${nl2br(m.notes || '')}</p>
      <div class="row">${badge('Inicio ' + formatShort(m.start), 'info')}${m.durationDays ? badge(m.durationDays + ' días', 'info') : badge('Duración por confirmar', 'warn')}${m.quantity != null ? badge(m.quantity + ' ' + (m.unit || 'unidades'), 'info') : ''}</div>
      <p class="tiny muted" style="margin-top:8px">Fuente: ${esc(m.source || 'Por confirmar')}</p>
    </article>`).join('') : emptyBox('Sin medicamentos', 'Agrega el primero o carga el plan inicial.')}</div>`;
}

function medsInventory() {
  return `<div class="between" style="margin-bottom:12px"><div><h2 style="font-size:1.2rem">Inventario</h2><div class="small muted">Calculado con las tomas registradas como «tomadas».</div></div><button class="btn primary small" data-action="add-med">${icon('plus', 15)} Agregar</button></div>
    <div class="stack">${state.medications.length ? state.medications.map(m => {
      const daily = dailyUnits(m);
      const rem = medRemaining(m);
      const days = medDaysLeft(m);
      const scheme = m.durationDays ? Number(m.durationDays) : null;
      const extra = (m.quantity != null && scheme && daily) ? Math.max(0, Number(m.quantity) - scheme * daily) : 0;
      const low = days != null && days <= 7;
      return `<article class="card"><div class="card-head"><div><h2 style="font-size:1.08rem">${esc(m.name)} ${esc(m.strength || '')}</h2><div class="sub">${daily || '—'} ${esc(m.unit || 'unidad(es)')} al día · ${esc(m.doseLabel || '')}</div></div>${low ? badge('Queda poco', 'danger') : badge(m.active === false ? 'Inactivo' : 'En curso', m.active === false ? 'danger' : 'success')}</div>
        <div class="stat-grid">
          <div class="stat ${low ? 'warn' : ''}"><div class="value">${rem == null ? '—' : rem}</div><div class="label">${esc(m.unit || 'Unidades')} restantes</div></div>
          <div class="stat"><div class="value">${days == null ? '—' : days}</div><div class="label">Días estimados</div></div>
          <div class="stat gold"><div class="value">${scheme || '—'}</div><div class="label">Días de esquema</div></div>
          <div class="stat"><div class="value">${m.quantity == null ? '—' : m.quantity}</div><div class="label">Cantidad inicial</div></div>
        </div>
        ${rem == null ? `<p class="tiny muted" style="margin-top:9px">Cantidad no registrada. Confirma con la fórmula o la farmacia.</p>` : ''}
        ${extra > 0 ? `<p class="tiny" style="margin-top:9px;color:var(--primary)"><strong>Revisar:</strong> según el esquema sobran ${extra} ${esc(m.unit || 'unidades')}. Confirma con el médico si hay una indicación adicional.</p>` : ''}
        <div class="form-actions"><button class="btn tiny" data-action="edit-med" data-id="${esc(m.id)}">Editar inventario</button></div>
      </article>`;
    }).join('') : emptyBox('Sin inventario', 'Agrega tus medicamentos para calcular cuántos días quedan.')}</div>`;
}

function medsAlarms() {
  return `<div class="grid grid-2">
    ${card(`<div class="card-head"><div><h2>Calendario del teléfono</h2><div class="sub">La forma más confiable de no olvidar.</div></div></div>
      <p class="small">Descarga un archivo .ics y ábrelo en tu calendario. Crea eventos diarios con alarma para cada medicamento y cita.</p>
      <div class="form-actions"><button class="btn primary" data-action="download-ics">${icon('download', 16)} Descargar con nombres</button><button class="btn" data-action="download-ics-discreet">${icon('download', 16)} Descargar discreto</button></div>
      <div class="divider"></div>
      <p class="tiny muted">«Discreto» muestra «Medicamento 1», «Medicamento 2»… sin el nombre. Útil si alguien más ve tu pantalla.</p>`)}
    ${card(`<div class="card-head"><div><h2>Avisos de Andrea</h2><div class="sub">Un apoyo, no la única alarma.</div></div>${badge(state.settings.notifications ? 'Activos' : 'Apagados', state.settings.notifications ? 'success' : 'info')}</div>
      <p class="small">Si Andrea está abierta o instalada, puede avisarte a la hora de la toma y mandarte un momento de tu familia.</p>
      <div class="form-actions"><button class="btn small" data-action="enable-notifications">Activar avisos</button><button class="btn small ghost" data-action="test-notification">Probar</button></div>`)}
  </div>
  <div class="divider"></div>
  ${card(`<div class="card-head"><div><h2>Horario actual</h2><div class="sub">Tomado de tus medicamentos activos.</div></div></div>
    <div class="stack">${activeMeds().map(m => `<div class="between" style="padding:8px 0;border-bottom:1px solid var(--line)"><div><strong>${esc(m.name)} ${esc(m.strength || '')}</strong><div class="tiny muted">${(m.schedule || []).map(s => `${esc(s.time)} · ${esc(s.amount)}`).join(' / ')}</div></div><span class="badge info">${m.durationDays ? m.durationDays + ' días' : 'Por confirmar'}</span></div>`).join('')}</div>`)}
  ${card(`<div class="card-head"><div><h2>Cómo agregarlo al teléfono</h2></div></div><ol class="small" style="padding-left:18px"><li>Descarga el archivo .ics.</li><li>Ábrelo; el teléfono te preguntará si quieres agregar los eventos.</li><li>Acepta y revisa que las alarmas estén activas.</li><li>Si usas Google Calendar, también puedes importarlo desde «Otros calendarios».</li><li>Haz una prueba con una alarma para hoy.</li></ol>`)}`;
}

/* ---------- Ejercicios ---------- */
views.ejercicios = function () {
  const today = todayISO();
  const day = findDay(today) || {};
  const groups = ['Todos', ...Array.from(new Set(state.exercises.map(e => e.group)))];
  const visible = ui.exerciseFilter === 'Todos' ? state.exercises : state.exercises.filter(e => e.group === ui.exerciseFilter);
  const done = state.exercises.filter(e => day.exercises?.[e.id]?.done).length;
  const total = state.exercises.length;
  const pct = total ? Math.round(done / total * 100) : 0;
  const logs = lastNDates(7).flatMap(date => Object.values(findDay(date)?.exercises || {}).filter(x => x.done));
  const before = logs.map(x => x.painBefore).filter(v => typeof v === 'number');
  const after = logs.map(x => x.painAfter).filter(v => typeof v === 'number');
  const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null;
  return `
    <div class="hero" style="background:linear-gradient(135deg,#1E4D42,#7B6FA0 55%,#2E9B80);padding:26px 28px">
      <div class="hero-copy"><div class="eyebrow">Plan casero de fisioterapia</div><h1 style="font-size:1.8rem">Moverse también es cuidarse.</h1><p>Constancia, no velocidad. Si un ejercicio te duele o aumenta los síntomas, detente y consulta.</p></div>
      <div class="hero-sun">${brandMark(190)}</div>
    </div>
    <div class="grid grid-2">
      ${card(`<div class="card-head"><div><h2>Progreso de hoy</h2><div class="sub">${done} de ${total} ejercicios registrados</div></div>${badge(pct + '%', pct >= 60 ? 'success' : 'info')}</div><div class="progress"><span style="width:${pct}%"></span></div><p class="tiny muted">No necesitas completar todo. Elige los que puedas hacer con comodidad.</p>`)}
      ${card(`<div class="card-head"><div><h2>Últimos 7 días</h2><div class="sub">Dolor antes y después</div></div></div><div class="stat-grid"><div class="stat"><div class="value">${logs.length}</div><div class="label">Sesiones</div></div><div class="stat"><div class="value">${avg(before) ?? '—'}</div><div class="label">Dolor antes</div></div><div class="stat"><div class="value">${avg(after) ?? '—'}</div><div class="label">Dolor después</div></div><div class="stat gold"><div class="value">${before.length && after.length ? (Math.round((avg(after) - avg(before)) * 10) / 10) : '—'}</div><div class="label">Cambio</div></div></div>`)}
    </div>
    <div class="chips" style="margin-top:16px">${groups.map(g => `<button class="chip ${ui.exerciseFilter === g ? 'active' : ''}" data-action="filter-exercises" data-value="${esc(g)}">${esc(g)}</button>`).join('')}</div>
    <div class="exercise-grid">${visible.length ? visible.map(e => {
      const log = day.exercises?.[e.id];
      return `<article class="exercise-card ${log?.done ? 'done' : ''}">
        <div class="between"><span class="badge ${log?.done ? 'success' : 'info'}">${esc(e.group)}</span>${log?.done ? `<span class="badge success">${icon('check', 12)} Hecho</span>` : ''}</div>
        ${ejercicioVisual(e.name)}
        <h3>${esc(e.name)}</h3>
        <div class="exercise-meta">${badge(e.reps, 'clay')}${e.hold ? badge('Sostener ' + e.hold + ' s', 'warn') : ''}</div>
        <p>${esc(e.instructions)}</p>
        <div class="exercise-safety">${esc(e.safety)}</div>
        <div class="exercise-actions">
          <button class="btn small primary" data-action="open-exercise" data-id="${esc(e.id)}">${log?.done ? 'Registrar otra vez' : 'Registrar sesión'}</button>
          ${log?.done ? `<button class="btn small ghost" data-action="undo-exercise" data-id="${esc(e.id)}">Deshacer</button>` : `<button class="btn small ghost" data-action="mark-exercise" data-id="${esc(e.id)}">Solo marcar hecho</button>`}
        </div>
      </article>`;
    }).join('') : emptyBox('Sin ejercicios', 'Carga el plan inicial o agrega ejercicios.')}</div>
    <div class="divider"></div>
    ${card(`<div class="card-head"><div><h2>Reglas de seguridad</h2></div></div><ul class="small" style="padding-left:18px"><li>Empieza por los primeros ejercicios y aumenta poco a poco.</li><li>Si un ejercicio causa dolor o incrementa los síntomas, suspéndelo y consulta.</li><li>No fuerces un movimiento que duele: puede causar una lesión más seria.</li><li>Lo importante es la constancia, no la velocidad.</li><li>Valida el plan con fisioterapia o fisiatría.</li></ul>`)}`;
};

/* ---------- Registro ---------- */
views.registro = function () {
  const date = ui.selectedDate || todayISO();
  const day = findDay(date) || {};
  const c = day.checkin || {};
  const history = state.dailyLogs.filter(d => d.checkin).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  const series = checkinSeries(14);
  const hasData = series.some(d => d.mood != null || d.anxiety != null || d.pain != null);
  const sleepData = series.some(d => d.sleepHours != null);
  return `
    <div class="between" style="margin-bottom:14px">
      <div><h2 style="font-size:1.2rem">Registro diario</h2><div class="small muted">Cómo te sientes hoy, sin juzgarte.</div></div>
      <input type="date" value="${esc(date)}" data-action="select-date" style="max-width:180px" aria-label="Fecha del registro">
    </div>
    ${c.suicidal === 'si' ? `<div class="crisis-box" style="margin-bottom:16px"><h3>Gracias por decirlo.</h3><p>Si tienes pensamientos de hacerte daño, no te quedes sola. Abre tu plan o llama al 123.</p><button class="btn danger small" data-action="crisis">Abrir mi plan</button></div>` : ''}
    <div class="grid grid-2">
      ${card(`<form data-form="checkin">
        <div class="card-head"><div><h2>${formatDate(date, { weekday: 'long' })}</h2><div class="sub">${c.at ? 'Última actualización: ' + new Date(c.at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : 'Aún sin registro'}</div></div>${c.at ? badge('Guardado', 'success') : ''}</div>
        <div class="quick-grid">
          ${rangeField('mood', 'Ánimo', c.mood, 0, 10, 'Bajo', 'Alto', 5)}
          ${rangeField('anxiety', 'Ansiedad', c.anxiety, 0, 10, 'Calma', 'Mucha', 5)}
          ${rangeField('pain', 'Dolor', c.pain, 0, 10, 'Sin dolor', 'Máximo', 0)}
          ${rangeField('sleepQuality', 'Calidad del sueño', c.sleepQuality, 0, 10, 'Mala', 'Buena', 5)}
          ${rangeField('energy', 'Energía', c.energy, 0, 10, 'Sin energía', 'Con energía', 5)}
          ${rangeField('function', 'Puedo con mis actividades', c.function, 0, 10, 'No puedo', 'Sí puedo', 5)}
        </div>
        <div class="form-grid two" style="margin-top:8px">
          ${numberField('sleepHours', 'Horas de sueño', c.sleepHours, 0, 14, '0.5', 'Ej. 6.5')}
          ${selectField('suicidal', 'Pensamientos de muerte o de hacerte daño', c.suicidal || 'prefiero_no', [
            { value: 'no', label: 'No' },
            { value: 'si', label: 'Sí' },
            { value: 'prefiero_no', label: 'Prefiero no responder' }
          ])}
        </div>
        <div class="form-grid" style="margin-top:12px">
          ${textareaField('sideEffects', 'Efectos o molestias', c.sideEffects, 'Somnolencia, mareo, náuseas, dolor, etc.')}
          ${textareaField('notes', 'Notas del día', c.notes, 'Lo que quieras recordar para la consulta o para ti.')}
        </div>
        <div class="form-actions"><button class="btn primary" type="submit">Guardar registro</button><button class="btn ghost" type="button" data-action="minimum">Modo mínimo</button></div>
      </form>`)}
      ${card(`<div class="card-head"><div><h2>Últimos 14 días</h2><div class="sub">Tendencias, no perfección.</div></div></div>
        ${hasData ? chart(series, [
          { key: 'mood', label: 'Ánimo', color: '#5E7F6B' },
          { key: 'anxiety', label: 'Ansiedad', color: '#2E9B80' },
          { key: 'pain', label: 'Dolor', color: '#7B6FA0' }
        ], { max: 10, label: 'Ánimo, ansiedad y dolor en los últimos 14 días' }) : emptyBox('Aún no hay datos', 'Haz tu primer registro para ver la tendencia.')}
        ${sleepData ? `<div class="divider"></div><h3 style="font-size:1rem;margin-bottom:8px">Sueño (horas)</h3>${chart(series, [{ key: 'sleepHours', label: 'Horas de sueño', color: '#4A7FA5' }], { max: 12, step: 3, label: 'Horas de sueño en los últimos 14 días' })}` : ''}
        <div class="divider"></div>
        <div class="stat-grid"><div class="stat"><div class="value">${avgCheckin(7, 'mood') ?? '—'}</div><div class="label">Ánimo 7d</div></div><div class="stat"><div class="value">${avgCheckin(7, 'anxiety') ?? '—'}</div><div class="label">Ansiedad 7d</div></div><div class="stat"><div class="value">${avgCheckin(7, 'pain') ?? '—'}</div><div class="label">Dolor 7d</div></div><div class="stat"><div class="value">${avgCheckin(7, 'sleepHours') ?? '—'}</div><div class="label">Sueño 7d</div></div></div>`)}
    </div>
    <div class="divider"></div>
    ${card(`<div class="card-head"><div><h2>Historial</h2><div class="sub">Toca un día para cargarlo.</div></div></div>
      ${history.length ? `<div class="stack">${history.map(h => `<button class="journal-entry" data-action="select-date" data-value="${esc(h.date)}"><div class="date">${esc(formatDate(h.date))}</div><div class="text">Ánimo ${h.checkin.mood ?? '—'}/10 · Ansiedad ${h.checkin.anxiety ?? '—'}/10 · Dolor ${h.checkin.pain ?? '—'}/10 · Sueño ${h.checkin.sleepHours ?? '—'} h</div></button>`).join('')}</div>` : emptyBox('Sin historial', 'Cada registro cuenta, incluso los días difíciles.')}`)}`;
};
