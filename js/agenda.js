/* Andrea · Agenda propia: calendario, recordatorios, repetición y alarmas.
   Las citas médicas siguen viviendo en Citas; aquí se ven juntas sin duplicar
   los datos. Todo se guarda en el mismo estado local. */

const AGENDA_MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const AGENDA_WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const AGENDA_WEEKDAY_INDEX = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, miércoles: 3, jueves: 4, viernes: 5, sabado: 6, sábado: 6 };

const AGENDA_ACCENTS = {
  manana: 'mañana', psicologia: 'psicología', psiquiatria: 'psiquiatría', fisiatria: 'fisiatría',
  medico: 'médico', medica: 'médica', tramite: 'trámite', autorizacion: 'autorización',
  mama: 'mamá', papa: 'papá', abuela: 'abuela', abuelo: 'abuelo', hermano: 'hermano', hermana: 'hermana',
  cumpleanos: 'cumpleaños', fisioterapia: 'fisioterapia', medicamento: 'medicamento', pastilla: 'pastilla',
  inyeccion: 'inyección', examen: 'examen', resultados: 'resultados', llamada: 'llamada',
  farmacia: 'farmacia', dolor: 'dolor', control: 'control', cita: 'cita', terapia: 'terapia'
};

function agendaAccent(text) {
  return String(text || '').split(/\s+/).map(w => AGENDA_ACCENTS[w] || w).join(' ');
}

function agendaNorm(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;()"']/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function agendaTimeLabel(item) {
  if (item.time) return item.time;
  return 'Todo el día';
}

function agendaItemCard(item) {
  const isAppt = item.kind === 'appt';
  const ev = item.event;
  const appt = item.appointment;
  const alarm = isAppt ? (appt ? Number(appt.remind) : -1) : (ev ? Number(ev.alarm) : -1);
  const repeat = ev ? eventRepeatText(ev) : '';
  return `<article class="agenda-item ${item.kind} ${item.done ? 'done' : ''}">
    <div class="agenda-hour">${esc(agendaTimeLabel(item))}</div>
    <div class="agenda-main">
      <div class="agenda-title">${esc(item.title)}</div>
      <div class="agenda-meta">
        <span>${esc(isAppt ? (item.type || 'Cita') : (item.type || 'Recordatorio'))}</span>
        ${item.place ? `<span>${icon('mapPin', 12)} ${esc(item.place)}</span>` : ''}
        ${repeat ? `<span>${icon('repeat', 12)} ${esc(repeat)}</span>` : ''}
        ${alarm >= 0 ? `<span>${icon('bell', 12)} ${esc(alarmText(alarm))}</span>` : ''}
      </div>
      ${item.notes ? `<div class="agenda-note">${nl2br(item.notes)}</div>` : ''}
      <div class="agenda-actions">
        ${isAppt
          ? `<button class="btn tiny ghost" data-action="edit-appt" data-id="${esc(appt.id)}">Editar cita</button>
             <button class="btn tiny ghost" data-action="prepare-appt" data-id="${esc(appt.id)}">Preparar</button>`
          : `<button class="btn tiny ${item.done ? 'ghost' : 'primary'}" data-action="toggle-event-done" data-id="${esc(ev.id)}" data-date="${esc(item.date)}">${item.done ? 'Hecho' : 'Marcar hecho'}</button>
             <button class="btn tiny ghost" data-action="edit-event" data-id="${esc(ev.id)}">Editar</button>
             <button class="btn tiny ghost" data-action="delete-event" data-id="${esc(ev.id)}">Borrar</button>`}
      </div>
    </div>
    <span class="agenda-dot ${isAppt ? 'appt' : 'event'} ${item.done ? 'done' : ''}" aria-hidden="true"></span>
  </article>`;
}

function agendaDayPanel(date) {
  const all = agendaItemsFor(date);
  const filter = ui.agendaFilter || 'todo';
  const items = all.filter(item => filter === 'todo' || (filter === 'citas' && item.kind === 'appt') || (filter === 'recordatorios' && item.kind === 'event'));
  const pendingAppts = date === todayISO() ? state.appointments.filter(a => !a.date && a.status !== 'cancelada' && a.status !== 'asistida') : [];
  return `<section class="card agenda-day-card">
    <div class="agenda-day-head">
      <div>
        <div class="eyebrow">Día elegido</div>
        <h2 id="agenda-day-title" tabindex="-1">${esc(friendlyDate(date))}</h2>
        <div class="sub">${esc(formatLongDate(date))}</div>
      </div>
      <button class="btn primary small" data-action="add-event" data-date="${esc(date)}" aria-label="Agregar un recordatorio el ${esc(formatLongDate(date))}">${icon('plus', 15)} Agregar</button>
    </div>
    <div class="agenda-filter" role="group" aria-label="Filtrar el día">
      ${[['todo', 'Todo'], ['citas', 'Citas'], ['recordatorios', 'Recordatorios']].map(([id, label]) =>
        `<button class="chip ${filter === id ? 'active' : ''}" data-action="agenda-filter" data-value="${id}">${label}</button>`).join('')}
    </div>
    <div class="stack agenda-list">
      ${items.length ? items.map(agendaItemCard).join('') : emptyBox('Nada para este día', 'Puedes agregar un recordatorio con el botón de arriba o una cita desde Citas.')}
    </div>
    ${pendingAppts.length ? `<div class="divider"></div><div class="eyebrow" style="margin-bottom:7px">Citas por agendar</div>
      <div class="stack">${pendingAppts.map(a => `<button class="agenda-pending" data-action="edit-appt" data-id="${esc(a.id)}"><span>${esc(a.title || a.type || 'Cita')}</span><span>Completar fecha ${icon('chevronRight', 14)}</span></button>`).join('')}</div>` : ''}
    <div class="divider"></div>
    <form data-form="agenda-quick" class="agenda-quick">
      <label for="agenda-quick-input">Escribirlo como se te ocurra</label>
      <div class="agenda-quick-row">
        <input id="agenda-quick-input" name="quick" placeholder="Ej: mañana a las 3, cita con psicología" autocomplete="off">
        <button class="btn primary" type="submit">Entender</button>
      </div>
      <p class="tiny muted">Puedes escribir «el viernes a las 10, llamar a mamá» o «todos los días a las 8, tomar el medicamento». Te muestro el formulario para revisarlo antes de guardar.</p>
    </form>
  </section>`;
}

function agendaAlarmsCard() {
  const start = todayISO();
  const end = addDays(start, 14);
  const items = agendaItemsBetween(start, end)
    .filter(item => {
      if (item.done) return false;
      const alarm = item.kind === 'event' ? Number(item.event?.alarm) : Number(item.appointment?.remind);
      return Number.isFinite(alarm) && alarm >= 0;
    })
    .slice(0, 8);
  return `<section class="card agenda-alarms-card">
    <div class="card-head">
      <div><h2>Próximas alarmas</h2><div class="sub">Las que suenan dentro de Andrea mientras esté abierta o instalada.</div></div>
      ${badge(state.settings.notifications ? 'Avisos activos' : 'Avisos apagados', state.settings.notifications ? 'success' : 'warn')}
    </div>
    ${items.length ? `<div class="stack">${items.map(item => {
      const alarm = item.kind === 'event' ? Number(item.event?.alarm) : Number(item.appointment?.remind);
      return `<div class="between agenda-alarm-row">
        <div><strong>${esc(item.title)}</strong><div class="tiny muted">${esc(friendlyDate(item.date))} · ${esc(agendaTimeLabel(item))} · ${esc(alarmText(alarm))}</div></div>
        <button class="btn tiny ghost" data-action="${item.kind === 'appt' ? 'edit-appt' : 'edit-event'}" data-id="${esc(item.id)}">Ajustar</button>
      </div>`;
    }).join('')}</div>` : emptyBox('Sin alarmas próximas', 'Cuando agregues una alarma a un recordatorio o a una cita, aparecerá aquí.')}
    <div class="form-actions">
      <button class="btn small ${state.settings.notifications ? 'ghost' : 'primary'}" data-action="enable-notifications">${state.settings.notifications ? 'Avisos activos' : 'Activar avisos'}</button>
      <button class="btn small ghost" data-action="test-notification">Probar un aviso</button>
    </div>
    <p class="tiny muted" style="margin-top:8px">Para que suene con la app cerrada, descarga el calendario del teléfono. Es la alarma más confiable.</p>
  </section>`;
}

views.agenda = function () {
  const date = ui.agendaDate || todayISO();
  const ym = ui.agendaMonth || date.slice(0, 7);
  const cells = monthCells(ym);
  const counts = {};
  cells.forEach(cell => {
    const items = agendaItemsFor(cell.iso);
    counts[cell.iso] = {
      appt: items.filter(x => x.kind === 'appt').length,
      event: items.filter(x => x.kind === 'event').length
    };
  });
  const pending = agendaPendingSync();
  return `
    <div class="agenda-toolbar">
      <div>
        <div class="eyebrow">Mi agenda</div>
        <h2>${esc(formatMonthYear(ym))}</h2>
      </div>
      <div class="row">
        <button class="icon-btn" data-action="agenda-month" data-value="-1" aria-label="Mes anterior">${icon('chevronLeft', 18)}</button>
        <button class="btn small ghost" data-action="agenda-today">Hoy</button>
        <button class="icon-btn" data-action="agenda-month" data-value="1" aria-label="Mes siguiente">${icon('chevronRight', 18)}</button>
        <button class="btn primary small" data-action="add-event" data-date="${esc(date)}" aria-label="Agregar un recordatorio el ${esc(formatLongDate(date))}">${icon('plus', 15)} Agregar</button>
      </div>
    </div>

    <div class="agenda-layout">
      <section class="card agenda-calendar-card">
        <div class="calendar-weekdays" aria-hidden="true">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<span>${d}</span>`).join('')}</div>
        <div class="calendar-grid" role="group" aria-label="Calendario de ${esc(formatMonthYear(ym))}">
          ${cells.map(cell => {
            const c = counts[cell.iso] || {};
            const selected = cell.iso === date;
            return `<button class="cal-day ${cell.inMonth ? '' : 'outside'} ${cell.isToday ? 'today' : ''} ${selected ? 'selected' : ''}" data-action="agenda-select" data-date="${esc(cell.iso)}" aria-label="${esc(formatLongDate(cell.iso))}${c.appt ? `, ${c.appt} cita${c.appt === 1 ? '' : 's'}` : ''}${c.event ? `, ${c.event} recordatorio${c.event === 1 ? '' : 's'}` : ''}" aria-pressed="${selected ? 'true' : 'false'}">
              <span class="cal-num">${cell.day}</span>
              <span class="cal-dots">${c.appt ? '<i class="appt"></i>' : ''}${c.event ? '<i class="event"></i>' : ''}</span>
            </button>`;
          }).join('')}
        </div>
        <div class="calendar-legend"><span><i class="appt"></i> Cita</span><span><i class="event"></i> Recordatorio</span><span><i class="today"></i> Hoy</span></div>
      </section>

      ${agendaDayPanel(date)}

      ${agendaAlarmsCard()}
    </div>

    <section class="card agenda-sync-card">
      <div class="card-head">
        <div><h2>Calendario del teléfono</h2><div class="sub">La alarma que suena aunque Andrea esté cerrada.</div></div>
        ${pending ? badge('Cambios sin exportar', 'warn') : badge(state.settings.agendaExportAt ? 'Sincronizado' : 'Listo para exportar', state.settings.agendaExportAt ? 'success' : 'info')}
      </div>
      <p class="small">Descarga un archivo .ics con tus medicamentos, tus citas y tus recordatorios. Ábrelo en el calendario del teléfono y acepta los eventos. Si cambias algo en Andrea, vuelve a descargarlo para actualizar las alarmas.</p>
      <div class="form-actions">
        <button class="btn primary small" data-action="download-ics">${icon('download', 15)} Descargar mi agenda</button>
        <button class="btn small ghost" data-action="download-ics-discreet">Versión discreta</button>
      </div>
      <p class="tiny muted">${state.settings.agendaExportAt ? `Última exportación: ${esc(formatDate(localDateISO(state.settings.agendaExportAt), { weekday: false }))}. ` : ''}La versión discreta no muestra nombres de medicamentos, citas ni recordatorios.</p>
    </section>`;
};

/* ---------- alta y edición de recordatorios ---------- */
function openEventModal(id, preset = {}) {
  const ev = id ? findEvent(id) : null;
  const data = Object.assign({}, ev || {}, preset);
  const date = data.date || ui.agendaDate || todayISO();
  const repeat = data.repeat || 'none';
  const alarm = data.alarm == null ? -1 : Number(data.alarm);
  const type = EVENT_TYPES.includes(data.type) ? data.type : 'Recordatorio';
  const duration = data.duration ? Number(data.duration) : 30;
  /* Formulario en dos capas: lo esencial siempre visible; el resto se abre
     solo si Andrea lo pide o si el recordatorio ya lo usa. */
  const avanzado = ev && (String(data.place || '').trim() || String(data.notes || '').trim() ||
    repeat !== 'none' || alarm >= 0 || type !== 'Recordatorio' || data.repeatUntil ||
    (Number(data.duration) || 0) && (Number(data.duration) !== 30));
  const body = `
    <form data-form="event" class="form-grid">
      <input type="hidden" name="id" value="${ev ? esc(ev.id) : ''}">
      ${preset.parsedFrom ? `<div class="agenda-parsed"><strong>Esto entendí:</strong> ${esc(preset.parsedSummary || '')}<br><span class="tiny muted">Revisa y corrige lo que haga falta antes de guardar.</span></div>` : ''}
      <div><label for="ev-title">¿Qué quieres recordar?</label><input id="ev-title" name="title" value="${esc(data.title || '')}" placeholder="Cita con psicología, llamar a mamá…" required data-autofocus></div>
      <div class="form-grid two">
        <div><label for="ev-date">Día</label><input id="ev-date" type="date" name="date" value="${esc(date)}" required></div>
        <div><label for="ev-time">Hora (si quieres)</label><input id="ev-time" type="time" name="time" value="${esc(data.time || '')}"></div>
      </div>
      <details class="form-extra" ${avanzado ? 'open' : ''}>
        <summary>Más opciones</summary>
        <div class="form-grid two" style="margin-top:10px">
          ${selectField('type', 'Tipo', type, EVENT_TYPES.map(t => ({ value: t, label: t })))}
          ${selectField('repeat', 'Se repite', repeat, Object.entries(REPEAT_LABELS).map(([value, label]) => ({ value, label })))}
        </div>
        <div class="form-grid three">
          <div><label for="ev-duration">Duración (min)</label><input id="ev-duration" type="number" name="duration" min="0" max="1440" step="5" value="${esc(duration)}"></div>
          <div><label for="ev-repeat-until">Repetir hasta</label><input id="ev-repeat-until" type="date" name="repeatUntil" value="${esc(data.repeatUntil || '')}"></div>
          <div><label for="ev-alarm">Alarma</label><select id="ev-alarm" name="alarm">${Object.entries(ALARM_LABELS).map(([value, label]) => `<option value="${value}" ${String(value) === String(alarm) ? 'selected' : ''}>${esc(label)}</option>`).join('')}</select></div>
        </div>
        <div><label for="ev-place">Lugar</label><input id="ev-place" name="place" value="${esc(data.place || '')}" placeholder="Hospital, casa, consultorio…"></div>
        ${textareaField('notes', 'Notas', data.notes || '', 'Qué llevar, con quién es, número de radicado…')}
        <p class="tiny muted">Con alarma, Andrea avisa mientras esté abierta o instalada. Para que suene siempre, exporta el calendario del teléfono.</p>
      </details>
      <div class="form-actions">
        <button class="btn primary" type="submit">Guardar</button>
        <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
        ${ev ? `<button class="btn small danger" type="button" data-action="delete-event" data-id="${esc(ev.id)}">Eliminar</button>` : ''}
      </div>
    </form>`;
  openModal({ title: ev ? 'Editar recordatorio' : 'Nuevo recordatorio', body, wide: true });
}

function openQuickAddModal(baseDate = todayISO()) {
  const examples = [
    'mañana a las 3, cita con psicología',
    'el viernes a las 10, llamar a mamá',
    'todos los días a las 8, tomar el medicamento',
    'el 20 de noviembre, revisar la autorización'
  ];
  const body = `
    <form data-form="agenda-quick" class="form-grid">
      <input type="hidden" name="base" value="${esc(baseDate)}">
      <div><label for="quick-add-text">Escríbelo como se te ocurra</label><input id="quick-add-text" name="quick" placeholder="Ej: mañana a las 3, cita con psicología" autocomplete="off" data-autofocus></div>
      <p class="tiny muted">Entiendo fechas como «hoy», «mañana», «el viernes», «15 de noviembre»; horas como «a las 3 de la tarde» o «15:30»; y repeticiones como «todos los días». Te muestro el formulario para revisarlo.</p>
      <div class="row">${examples.map(x => `<button class="chip" type="button" data-action="quick-example" data-value="${esc(x)}">${esc(x)}</button>`).join('')}</div>
      <div class="form-actions">
        <button class="btn primary" type="submit">Entender y revisar</button>
        <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
      </div>
    </form>`;
  openModal({ title: 'Agregar a mi agenda', body });
}

function parseAgendaText(input, baseDate = todayISO()) {
  const raw = String(input || '').trim();
  let work = agendaNorm(raw);
  let date = '';
  let time = '';
  let repeat = 'none';
  let repeatUntil = '';
  let alarm = -1;
  let type = 'Recordatorio';
  let dateExplicit = false;
  let timeExplicit = false;
  let weeklyDayName = '';
  let repeatLocked = false;
  let dateInvalid = false;

  const setTime = (h, m, marker, period) => {
    let hour = Number(h);
    let minute = m == null ? 0 : Number(m);
    if (!Number.isFinite(hour) || hour > 23 || minute > 59) return false;
    const mark = String(marker || '').replace(/\./g, '');
    const p = String(period || '').replace(/\./g, '');
    if (mark === 'pm' && hour < 12) hour += 12;
    if (mark === 'am' && hour === 12) hour = 0;
    if (!mark && (p === 'tarde' || p === 'noche') && hour < 12) hour += 12;
    if (!mark && p === 'madrugada' && hour === 12) hour = 0;
    /* Sin «am/pm» ni momento del día, «a las 3» suele ser a las 3 de la
       tarde en una cita o un recordatorio. El formulario lo deja revisar. */
    if (!mark && !p && hour >= 1 && hour <= 6) hour += 12;
    time = `${pad(hour)}:${pad(minute)}`;
    timeExplicit = true;
    return true;
  };

  /* Hora: se extrae antes que la fecha para que «3 de la tarde» no se lea
     como día 3, y para que «mañana a las 3» conserve la fecha de mañana. */
  const timePatterns = [
    { re: /(?:^|\s)(?:a\s+las?|alas?)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?m\.?|p\.?m\.?)?(?:\s*(?:de\s+la|en\s+la)?\s*(manana|tarde|noche|madrugada))?/i, groups: [1, 2, 3, 4] },
    { re: /(?:^|\s)(\d{1,2}):(\d{2})\s*(am|pm|a\.?m\.?|p\.?m\.?)?(?:\s*(?:de\s+la|en\s+la)?\s*(manana|tarde|noche|madrugada))?/i, groups: [1, 2, 3, 4] },
    { re: /(?:^|\s)(\d{1,2})\s*(am|pm|a\.?m\.?|p\.?m\.?)(?:\s*(?:de\s+la|en\s+la)?\s*(manana|tarde|noche|madrugada))?/i, groups: [1, null, 2, 3] },
    { re: /(?:^|\s)(\d{1,2})\s+de\s+la\s+(manana|tarde|noche|madrugada)/i, groups: [1, null, null, 2] }
  ];
  for (const p of timePatterns) {
    const m = work.match(p.re);
    if (!m) continue;
    const h = m[p.groups[0]];
    const min = p.groups[1] == null ? null : m[p.groups[1]];
    const marker = p.groups[2] == null ? '' : m[p.groups[2]];
    const period = p.groups[3] == null ? '' : m[p.groups[3]];
    if (setTime(h, min, marker, period)) { work = work.replace(p.re, ' '); break; }
  }
  if (!timeExplicit) {
    const special = work.match(/(?:^|\s)(?:al\s+)?(mediodia|medianoche)(?:\s|$)/i);
    if (special) {
      time = special[1].toLowerCase() === 'mediodia' ? '12:00' : '00:00';
      timeExplicit = true;
      work = work.replace(special[0], ' ');
    }
  }
  if (!timeExplicit) {
    const periodOnly = work.match(/(?:^|\s)(?:en|por|de)\s+la\s+(manana|tarde|noche|madrugada)(?:\s|$)/i);
    if (periodOnly) {
      const defaults = { manana: '09:00', tarde: '15:00', noche: '20:00', madrugada: '05:00' };
      time = defaults[periodOnly[1].toLowerCase()] || '';
      timeExplicit = !!time;
      work = work.replace(periodOnly[0], ' ');
    }
  }

  const monthIndex = name => {
    const n = agendaNorm(name);
    return ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'].indexOf(n);
  };
  const buildDate = (y, m, d) => {
    const yy = Number(y);
    const mm = Number(m);
    const dd = Number(d);
    if (!yy || mm < 1 || mm > 12 || dd < 1 || dd > 31) return '';
    const candidate = `${yy}-${pad(mm)}-${pad(dd)}`;
    const check = parseISO(candidate);
    return check && check.getDate() === dd && check.getMonth() === mm - 1 ? candidate : '';
  };
  const resolveYear = (y, month, day) => {
    if (y) return Number(String(y).length === 2 ? '20' + y : y);
    const thisYear = new Date().getFullYear();
    const candidate = buildDate(thisYear, month, day);
    return candidate && candidate >= todayISO() ? thisYear : thisYear + 1;
  };

  /* «hasta el…» antes de la fecha principal, para no confundir el final de
     una repetición con el día del recordatorio. */
  const until = work.match(/\bhasta\s+(?:el\s+|la\s+)?(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+(?:de\s+)?(\d{2,4}))?/i);
  if (until) {
    const mi = monthIndex(until[2]) + 1;
    repeatUntil = buildDate(resolveYear(until[3], mi, until[1]), mi, until[1]);
    work = work.replace(until[0], ' ');
  }

  const takeDate = (re, handler) => {
    const m = work.match(re);
    if (!m) return false;
    handler(m);
    dateExplicit = true;
    if (!date) dateInvalid = true;
    work = work.replace(re, ' ');
    return true;
  };

  /* «De lunes a viernes» es la repetición, no una fecha suelta. Se detecta
     antes de la fecha para que «lunes» no quede como el día del recordatorio. */
  const weekdayRangeEarly = work.match(/\b(?:todos\s+los\s+dias\s+)?(?:de\s+)?lunes\s+a\s+viernes\b|\bentre\s+semana\b|\bdias\s+habiles\b/i);
  if (weekdayRangeEarly) {
    repeat = 'weekdays';
    repeatLocked = true;
    work = work.replace(weekdayRangeEarly[0], ' ');
  }

  /* «Todos los lunes» es una repetición, no una fecha suelta. Se detecta
     antes de la fecha para que no quede como un único lunes. */
  const weeklyDayEarly = work.match(/\btodos\s+los\s+(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b|\bcada\s+(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/i);
  if (weeklyDayEarly) {
    repeat = 'weekly';
    repeatLocked = true;
    weeklyDayName = weeklyDayEarly[1] || weeklyDayEarly[2];
    work = work.replace(weeklyDayEarly[0], ' ');
  }

  if (!dateExplicit) {
    takeDate(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/, m => { date = buildDate(m[1], m[2], m[3]); });
  }
  if (!dateExplicit) {
    takeDate(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/, m => {
      const y = resolveYear(m[3], m[2], m[1]);
      date = buildDate(y, m[2], m[1]);
    });
  }
  if (!dateExplicit) {
    takeDate(/\b(?:el\s+)?(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+(?:de\s+)?(\d{2,4}))?\b/i, m => {
      const mi = monthIndex(m[2]) + 1;
      date = buildDate(resolveYear(m[3], mi, m[1]), mi, m[1]);
    });
  }
  if (!dateExplicit) {
    takeDate(/\b(?:el\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(\d{1,2})(?:\s+(?:de\s+)?(\d{2,4}))?\b/i, m => {
      const mi = monthIndex(m[1]) + 1;
      date = buildDate(resolveYear(m[3], mi, m[2]), mi, m[2]);
    });
  }
  if (!dateExplicit) {
    takeDate(/\bpasado\s+manana\b/i, () => { date = addDays(baseDate, 2); });
  }
  if (!dateExplicit) {
    takeDate(/\b(hoy)\b/i, () => { date = baseDate; });
  }
  if (!dateExplicit) {
    takeDate(/\b(manana)\b/i, () => { date = addDays(baseDate, 1); });
  }
  if (!dateExplicit) {
    takeDate(/\b(?:el\s+)?(?:este\s+|esta\s+|proximo\s+|proxima\s+)?(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/i, m => {
      const strictNext = /\bproximo\b|\bproxima\b/i.test(m[0]);
      const target = AGENDA_WEEKDAY_INDEX[agendaNorm(m[1])];
      const base = parseISO(baseDate);
      let diff = (target - base.getDay() + 7) % 7;
      if (strictNext && diff === 0) diff = 7;
      date = addDays(baseDate, diff);
    });
  }
  if (!dateExplicit) {
    takeDate(/\ben\s+(\d{1,2})\s+dias?\b/i, m => { date = addDays(baseDate, Number(m[1])); });
  }
  if (!dateExplicit) {
    takeDate(/\ben\s+una\s+semana\b|\bla\s+proxima\s+semana\b/i, () => { date = addDays(baseDate, 7); });
  }
  if (!dateExplicit) {
    takeDate(/\b(?:el\s+)?fin\s+de\s+semana\b/i, () => {
      const base = parseISO(baseDate);
      let diff = (6 - base.getDay() + 7) % 7;
      if (diff === 0 && base.getDay() === 0) diff = 6;
      date = addDays(baseDate, diff);
    });
  }
  if (!dateExplicit) {
    takeDate(/\bel\s+(\d{1,2})\b/i, m => {
      const day = Number(m[1]);
      const base = parseISO(baseDate);
      if (day < 1 || day > 31) return;
      let y = base.getFullYear();
      let mo = base.getMonth() + 1;
      if (day < base.getDate()) { mo++; if (mo > 12) { mo = 1; y++; } }
      date = buildDate(y, mo, day);
    });
  }
  if (!dateExplicit && weeklyDayName) {
    const target = AGENDA_WEEKDAY_INDEX[agendaNorm(weeklyDayName)];
    const base = parseISO(baseDate);
    let diff = (target - base.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    date = addDays(baseDate, diff);
  }
  if (!date) {
    date = baseDate;
    if (dateExplicit) dateInvalid = true;
  }

  /* Repetición */
  const repeatRules = [
    [/\btodos\s+los\s+dias\b|\bcada\s+dia\b|\bdiariamente\b|\bdiario\b/, 'daily'],
    [/\bde\s+lunes\s+a\s+viernes\b|\bentre\s+semana\b|\bdias\s+habiles\b/, 'weekdays'],
    [/\btodas\s+las\s+semanas\b|\bcada\s+semana\b|\bsemanal\b/, 'weekly'],
    [/\btodos\s+los\s+meses\b|\bcada\s+mes\b|\bmensual\b/, 'monthly'],
    [/\btodos\s+los\s+anos\b|\bcada\s+ano\b|\banual\b/, 'yearly']
  ];
  for (const [re, value] of repeatRules) {
    if (!repeatLocked && re.test(work)) { repeat = value; work = work.replace(re, ' '); break; }
  }
  if (!repeatLocked && repeat === 'none') {
    const weeklyDay = work.match(/\btodos\s+los\s+(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b|\bcada\s+(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/i);
    if (weeklyDay) {
      repeat = 'weekly';
      const name = weeklyDay[1] || weeklyDay[2];
      if (!dateExplicit) {
        const target = AGENDA_WEEKDAY_INDEX[agendaNorm(name)];
        const base = parseISO(baseDate);
        let diff = (target - base.getDay() + 7) % 7;
        if (diff === 0) diff = 7;
        date = addDays(baseDate, diff);
        dateExplicit = true;
      }
      work = work.replace(weeklyDay[0], ' ');
    }
  }

  /* Alarma */
  const alarmChecks = [
    [/\bsin\s+alarma\b|\bno\s+me\s+avises\b/, () => { alarm = -1; }],
    [/\b(\d{1,3})\s*(?:min|minuto|minutos)\s+antes\b/, m => { alarm = Number(m[1]); }],
    [/\b(?:una|un|1)\s+hora\s+antes\b/, () => { alarm = 60; }],
    [/\b(\d{1,2})\s+horas?\s+antes\b/, m => { alarm = Number(m[1]) * 60; }],
    [/\b(?:un|1)\s+dia\s+antes\b/, () => { alarm = 1440; }],
    [/\bcon\s+alarma\b|\bque\s+suene\b|\bavisame\b/, () => { alarm = 0; }]
  ];
  for (const [re, fn] of alarmChecks) {
    const m = work.match(re);
    if (m) { fn(m); work = work.replace(re, ' '); break; }
  }

  /* Tipo */
  if (/\bcita\b|\bconsulta\b|\bcontrol\b|\bmedic[oa]\b|\bpsicolog|\bpsiquiatr|\bfisiatr|\bterapia\b|\bfisioterapia\b/.test(work)) type = 'Cita';
  else if (/\bllamada\b|\bllamar\b|\btelefonear\b/.test(work)) type = 'Llamada';
  else if (/\btramite\b|\beps\b|\bautorizacion\b|\bdocumento\b|\bincapacidad\b/.test(work)) type = 'Trámite';

  /* Título: se quitan las palabras de mando, no las ideas. */
  let title = work
    .replace(/^(?:recuerdame|recordarme|agendame|agenda|anota|anotame|apunta|apuntame|ponme|pon|crea|crear|agrega|agregar|programa|programar|reserva|reservar|no\s+olvidar|no\s+te\s+olvides\s+de|debo|tengo\s+que|necesito)\b\s*/i, '')
    .replace(/^[\s,;·\-–—]+/, '')
    .replace(/^que\s+/i, '')
    .replace(/^(?:tengo\s+que|debo|necesito)\s+/i, '')
    .replace(/^(?:para|de|a)\s+/i, '')
    .replace(/^[\s,;·\-–—]+/, '')
    .replace(/\s+(?:por\s+favor|gracias)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  title = title.replace(/[\s,;]+$/g, '').trim();
  if (title.length > 120) title = title.slice(0, 117).trim() + '…';
  title = agendaAccent(title);
  if (title) title = capitalize(title);
  if (!title) title = type === 'Recordatorio' ? 'Recordatorio' : type;

  const summaryDate = dateInvalid
    ? 'Fecha no válida: revisa el día y el mes'
    : `${friendlyDate(date)}${timeExplicit ? ' a las ' + time : ''}`;
  return {
    title,
    date,
    time: timeExplicit ? time : '',
    type,
    repeat,
    repeatUntil,
    alarm,
    dateExplicit,
    timeExplicit,
    dateInvalid,
    parsedSummary: `${summaryDate}${repeat !== 'none' ? ' · ' + REPEAT_LABELS[repeat] : ''}${alarm >= 0 ? ' · ' + alarmText(alarm) : ''}`
  };
}

function agendaQuickAdd(text, baseDate = todayISO()) {
  const limpio = String(text || '').trim();
  if (!limpio) { toast('Escribe qué quieres recordar.'); return; }
  const parsed = parseAgendaText(limpio, baseDate || todayISO());
  openEventModal(null, Object.assign(parsed, {
    parsedFrom: limpio,
    parsedSummary: parsed.parsedSummary
  }));
}

function quickExample(text) {
  const input = document.getElementById('quick-add-text');
  if (input) { input.value = text; input.focus(); }
}

function agendaFindEvents(query) {
  const q = agendaNorm(query);
  if (!q) return [];
  const tokens = q.split(' ').filter(t => t.length > 2);
  return state.events.filter(ev => {
    const hay = agendaNorm([ev.title, ev.place, ev.notes, ev.type].join(' '));
    return tokens.length ? tokens.every(t => hay.includes(t)) : hay.includes(q);
  }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}

function agendaDaySummary(date) {
  const items = agendaItemsFor(date);
  if (!items.length) return [];
  return items.map(item => `${item.time ? item.time + ' · ' : ''}${item.title}${item.place ? ' (' + item.place + ')' : ''}${item.done ? ' · hecho' : ''}`);
}

function agendaNextSummary() {
  const next = nextAgendaItem();
  if (!next) return '';
  return `${friendlyDate(next.date)}${next.time ? ' a las ' + next.time : ''}: ${next.title}`;
}
