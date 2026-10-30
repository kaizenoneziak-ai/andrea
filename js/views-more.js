/* Andrea · vistas secundarias */
/* Opciones colombianas para llenar el perfil sin tipear de más. */
const EPS_COLOMBIA = ['Nueva EPS', 'Sura', 'Sanitas', 'Salud Total', 'Coomeva', 'Famisanar', 'Compensar', 'Aliansalud', 'Mutual Ser', 'Savia Salud', 'Comfama', 'Comfenalco', 'Cafam', 'Emssanar', 'Asmet Salud', 'Salud Mía', 'Ecosalud', 'Dusakawi', 'Anas Wayuu', 'Fomag (Magisterio)', 'Sanidad Militar', 'Particular / privada'];
const ALERGIAS_COMUNES = ['Ninguna que sepa', 'Penicilina', 'Aspirina / AINEs', 'Sulfas', 'Codeína', 'Mariscos', 'Maní / frutos secos', 'Polvo / ácaros', 'Polen', 'Lácteos', 'Yodados (contraste)'];

Object.assign(views, {
  cuaderno: function () {
    const tab = ui.cuadernoTab || 'pendientes';
    const hoy = todayISO();
    const notas = (state.notas || []).slice().sort((a, b) => (b.updatedAt || b.date).localeCompare(a.updatedAt || a.date));
    const pends = (state.pendientes || []).slice().sort((a, b) => (a.date + (a.done ? '1' : '0')).localeCompare(b.date + (b.done ? '1' : '0')));
    const deHoy = pends.filter(x => x.date === hoy);
    const vencidos = pends.filter(x => !x.done && x.date < hoy);
    const tabBtn = (id, label, n) => `<button class="chip ${tab === id ? 'active' : ''}" data-action="cuaderno-tab" data-value="${id}">${label}${n ? ` · ${n}` : ''}</button>`;
    let contenido = '';
    if (tab === 'notas') {
      contenido = notas.length
        ? `<div class="notas-list">${notas.map(n => `<article class="card nota-card">
            <div class="card-head"><div><h3>${esc(n.title)}</h3><div class="sub">${esc(formatShort(n.date))}</div></div>
            <div class="row"><button class="link-btn tiny" data-action="edit-note" data-id="${esc(n.id)}">Editar</button><button class="link-btn tiny" data-action="delete-note" data-id="${esc(n.id)}">Borrar</button></div></div>
            ${n.text ? `<p class="small" style="white-space:pre-wrap">${esc(n.text)}</p>` : ''}
          </article>`).join('')}</div>`
        : emptyBox('Tu cuaderno está en blanco', 'Escribe lo que quieras soltar de la cabeza: una idea, un recuerdo, algo que te dijo el médico. Queda guardado aquí.');
    } else {
      const fila = x => `<div class="between pend-row ${x.done ? 'done' : ''} ${!x.done && x.date < hoy ? 'late' : ''}" style="padding:8px 0;border-bottom:1px solid var(--line)">
        <label class="check-row" style="margin:0"><input type="checkbox" data-action="toggle-pendiente" data-id="${esc(x.id)}" ${x.done ? 'checked' : ''}> <span><span>${esc(x.text)}</span> <span class="tiny muted">· ${x.date === hoy ? 'hoy' : esc(formatShort(x.date))}</span></span></label>
        <button class="link-btn tiny" data-action="delete-pendiente" data-id="${esc(x.id)}" aria-label="Borrar pendiente">×</button>
      </div>`;
      contenido = `
        <form data-form="pendiente" class="row" style="gap:8px;margin-bottom:12px">
          <input name="text" placeholder="¿Qué te falta hoy? Ej: pasar por las recetas" style="flex:1" data-autofocus>
          <input name="date" type="date" value="${hoy}" style="max-width:150px">
          <button class="btn small primary" type="submit">Agregar</button>
        </form>
        ${deHoy.length ? `<h3 class="small" style="margin:6px 0 2px">Hoy</h3>${deHoy.map(fila).join('')}` : `<p class="tiny muted">Nada pendiente para hoy. Un día sin pendientes también es un buen día.</p>`}
        ${vencidos.length ? `<h3 class="small" style="margin:12px 0 2px">De días pasados</h3>${vencidos.map(fila).join('')}` : ''}
        ${pends.filter(x => x.done).length ? `<h3 class="small" style="margin:12px 0 2px">Hechos</h3>${pends.filter(x => x.done).map(fila).join('')}` : ''}
        <p class="yasmin-tip tiny">${icon('chat', 13)} <strong>Yasmin:</strong> lo que anotes aquí no es una obligación: es para que no tengas que cargarlo de memoria. Lo puedes borrar cuando quieras.</p>`;
    }
    return `
      <div class="chips">${tabBtn('notas', 'Notas', notas.length)}${tabBtn('pendientes', 'Pendientes', pends.filter(x => !x.done).length)}</div>
      <div class="row" style="justify-content:space-between;align-items:center;margin-bottom:10px">
        <p class="tiny muted">Un cuaderno para anotar y volver a leer. Nadie más lo ve.</p>
        ${tab === 'notas' ? `<button class="btn small primary" data-action="add-note">Escribir una nota</button>` : ''}
      </div>
      ${contenido}`;
  },

  citas: function () {
    const next = nextAppointment();
    const list = sortedAppointments();
    const pendingUndated = nextUndatedAppointment();
    return `
      <div class="between" style="margin-bottom:14px">
        <div><h2 style="font-size:1.2rem">Citas y trámites</h2><div class="small muted">Psiquiatría, psicología, fisiatría, terapia física, dolor y EPS.</div></div>
        <div class="row">
          <button class="btn small" data-action="view-agenda">${icon('calendar', 15)} Agenda</button>
          <button class="btn small" data-action="add-event" data-date="${esc(ui.agendaDate || todayISO())}">${icon('bell', 15)} Recordatorio</button>
          <button class="btn primary small" data-action="add-appt">${icon('plus', 15)} Nueva cita</button>
        </div>
      </div>
      ${next ? `<div style="margin-bottom:16px"><div class="eyebrow" style="margin-bottom:7px">Lo más próximo</div>${apptCard(next, true)}</div>` : ''}
      ${pendingUndated ? `<div class="sync-banner" style="margin-bottom:16px">${icon('bell', 17)}<div><strong>Hay una cita por agendar.</strong><span>${esc(pendingUndated.title || pendingUndated.type || 'Cita')}: ${esc(pendingUndated.notes || 'Completa la fecha y la hora para que entre a tu agenda.')}</span></div><button class="btn tiny primary" data-action="edit-appt" data-id="${esc(pendingUndated.id)}">Completar</button></div>` : ''}
      ${card(`<div class="card-head"><div><h2>Todas las citas</h2><div class="sub">${list.length} registradas</div></div></div>
        ${list.length ? `<div class="stack">${list.map(a => apptCard(a, false)).join('')}</div>` : emptyBox('Sin citas', 'Agrega la primera cita o trámite.')}`)}
      ${agendaAlarmsCard()}
      ${card(`<div class="card-head"><div><h2>Preparar la consulta</h2><div class="sub">Llevar preguntas cambia la conversación.</div></div><button class="link-btn" data-action="nav" data-id="reporte">Generar reporte</button></div>
        <div class="stack">${state.questions.length ? `<ul class="plan-list" style="margin:0">${state.questions.slice(0, 8).map((q, i) => `<li><span class="n">${i + 1}</span><span>${esc(q)}</span></li>`).join('')}</ul>` : emptyBox('Aún no hay preguntas', 'Agrega lo que quieras preguntar en la consulta.')}</div>
        <div class="form-actions"><button class="btn small" data-action="add-question">Agregar pregunta</button><button class="btn small ghost" data-action="copy-questions">Copiar preguntas</button></div>`)}`;
  },

  reflexiones: function () {
    const today = todayISO();
    const day = findDay(today) || {};
    const prompt = PROMPTS[ui.promptIndex % PROMPTS.length];
    const entries = state.dailyLogs.filter(d => d.journal && d.journal.text).sort((a, b) => b.date.localeCompare(a.date));
    return `
      <div class="grid grid-2">
        ${card(`<div class="card-head"><div><h2>Reflexión de hoy</h2><div class="sub">Sin corrección, sin presión. Una frase cuenta.</div></div><button class="link-btn" data-action="next-prompt">Otro prompt</button></div>
          <div class="quote-card" style="margin-bottom:14px"><blockquote>${esc(prompt)}</blockquote></div>
          <form data-form="journal">
            <textarea name="text" placeholder="Escribe lo que salga..." style="min-height:150px">${esc(day.journal?.text || '')}</textarea>
            <div class="form-actions"><button class="btn primary" type="submit">Guardar reflexión</button><button class="btn ghost" type="button" data-action="crisis">No estoy bien</button></div>
          </form>
          <p class="tiny muted" style="margin-top:10px">Si escribir te remueve mucho, para y busca compañía. No tienes que hacerlo sola.</p>`)}
        ${card(`<div class="card-head"><div><h2>Mi carta para un día difícil</h2><div class="sub">Escríbela hoy, para leerla cuando no puedas pensar con claridad.</div></div><button class="link-btn" data-action="add-letter">Escribir</button></div>
          ${state.letters.length ? `<div class="stack">${state.letters.map(l => `<article class="message-card"><div class="from">${esc(l.title || 'Carta')}</div><div class="text" style="margin-top:6px">${nl2br(l.text)}</div><div class="form-actions"><button class="btn tiny" data-action="edit-letter" data-id="${esc(l.id)}">Editar</button><button class="btn tiny ghost" data-action="delete-letter" data-id="${esc(l.id)}">Eliminar</button></div></article>`).join('')}</div>` : `<div class="empty"><strong>Tu voz también puede sostenerte</strong><span>Una carta escrita en un día bueno puede ser un faro en un día difícil.</span><button class="btn small primary" style="margin-top:10px" data-action="add-letter">Escribir mi carta</button></div>`}`)}
      </div>
      <div class="divider"></div>
      ${card(`<div class="card-head"><div><h2>Mis reflexiones</h2><div class="sub">${entries.length} guardadas</div></div></div>
        ${entries.length ? `<div class="stack">${entries.map(e => `<button class="journal-entry" data-action="view-journal" data-value="${esc(e.date)}"><div class="date">${esc(formatDate(e.date))}</div><div class="text">${esc(e.journal.text)}</div></button>`).join('')}</div>` : emptyBox('Aún no hay reflexiones', 'Empieza con una frase. No tiene que ser perfecta.')}`)}`;
  },

  /* ---------- Momentos: fotos y palabras de la familia ---------- */
  momentos: function () {
    const hoy = momentoDelDia();
    const lista = state.momentos.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    return `
      <div class="between" style="margin-bottom:14px">
        <div><h2 style="font-size:1.2rem">Momentos</h2><div class="small muted">Fotos y palabras de tu gente. Sin chats, sin obligación de responder.</div></div>
        <button class="btn primary small" data-action="add-momento">${icon('plus', 15)} Agregar</button>
      </div>

      ${hoy ? `<div class="momento-card" style="margin-bottom:20px">
        ${hoy.photoId ? `<img data-foto="${esc(hoy.photoId)}" alt="Recuerdo de ${esc(hoy.from || 'tu familia')}">` : `<div class="no-photo">${icon('gift', 54)}</div>`}
        <div class="body">
          <div class="eyebrow" style="color:#F4D998">El momento de hoy</div>
          <blockquote>${esc(hoy.text || '')}</blockquote>
          <div class="from">— ${esc(hoy.from || 'Tu familia')}${hoy.relation ? ' · ' + esc(hoy.relation) : ''}</div>
          <div class="form-actions">
            <button class="btn tiny" data-action="abrir-momento" data-id="${esc(hoy.id)}">Ver completo</button>
            <button class="btn tiny ghost" data-action="otro-momento">Otro momento</button>
          </div>
        </div>
      </div>` : emptyBox('Todavía no hay momentos', 'Pídele a tu familia que agregue una foto y una frase. Aquí aparecerán.')}

      <div class="between" style="margin-bottom:10px;flex-wrap:wrap;gap:8px">
        <h3 style="font-size:1.05rem">Todos los momentos <span class="muted tiny">(${lista.length})</span></h3>
        <div class="row"><button class="btn tiny ghost" data-action="download-momentos-ics">${icon('calendar', 13)} Recordar en el calendario</button><button class="link-btn" data-action="nav" data-id="ajustes">Horarios</button></div>
      </div>
      <div class="momento-grid">${lista.length ? lista.map(m => `<button class="momento-tile" data-action="abrir-momento" data-id="${esc(m.id)}">
        ${m.photoId ? `<img data-foto="${esc(m.photoId)}" alt="">` : `<span class="ph">${icon('gift', 30)}</span>`}
        <span class="cap"><strong>${esc(m.from || 'Tu familia')}</strong><span>${esc(String(m.text || '').slice(0, 42))}${String(m.text || '').length > 42 ? '…' : ''}</span></span>
      </button>`).join('') : ''}</div>

      <div class="divider"></div>
      ${card(`<div class="card-head"><div><h2>Cómo funcionan</h2></div></div>
        <p class="small">Aquí vive tu gente: fotos y palabras que llegan como sorpresas.</p>
        <p class="small">Para que suene siempre, descárgalo al calendario del teléfono. El evento solo dice «Un momento para ti»: no incluye el texto, las fotos ni datos de salud.</p>
        <div class="form-actions"><button class="btn small primary" data-action="download-momentos-ics">${icon('calendar', 15)} Agregar recordatorios al calendario</button></div>
        <p class="tiny muted">Las fotos se guardan solo en este dispositivo, comprimidas. Nada se sube a Internet.</p>`)}`;
  },

  seguridad: function () {
    const sp = state.safetyPlan || {};
    const hosp = hospitalContact();
    /* Los textos del plan inicial son ejemplos, no razones personales. */
    const reasons = (sp.reasons || []).filter(r => r && !/^escribir aquí|^una razón puede ser/i.test(String(r).trim()));
    return `
      <section class="safety-hero">
        <div class="eyebrow" style="color:rgba(255,240,228,.78)">Mi plan para los días difíciles</div>
        <h1>No estás sola.</h1>
        <p>Si la cabeza te dice que no vale la pena seguir, eso es el dolor hablando, no la verdad. Respira. Llama a alguien. Y si hay peligro inmediato: <strong>123</strong> o urgencias, y que alguien se quede contigo.</p>
        <div class="emergency-grid">
          <a class="emergency-btn" href="tel:123"><span class="num">123</span><span>Emergencias</span></a>
          <a class="emergency-btn" href="tel:106"><span class="num">106</span><span>Apoyo psicológico</span></a>
          ${hosp ? `<a class="emergency-btn" href="${phoneHref(hosp.phone)}"><span class="num">${esc((hosp.name || 'Mi hospital').split('·')[0].trim().slice(0, 9))}</span><span>${esc(hosp.role || 'Salud mental')}</span></a>` : `<button class="emergency-btn" type="button" data-action="ir-red"><span class="num">${icon('phone', 22)}</span><span>Mi red</span></button>`}
        </div>
        <div class="form-actions"><button class="btn solid" data-action="crisis">Abrir modo compañía</button><button class="btn" data-action="print">Imprimir plan</button></div>
      </section>
      <div class="grid grid-2">
        ${card(`<div class="card-head"><div><h2>Señales de que necesito apoyo</h2><div class="sub">No son fallas: son avisos.</div></div></div><ul class="plan-list">${(sp.warningSigns || []).map((x, i) => `<li><span class="n">${i + 1}</span><span>${esc(x)}</span></li>`).join('')}</ul>`)}
        ${card(`<div class="card-head"><div><h2>Qué me ayuda</h2><div class="sub">Pasos pequeños que me regulan.</div></div></div><ul class="plan-list">${(sp.coping || []).map((x, i) => `<li><span class="n">${i + 1}</span><span>${esc(x)}</span></li>`).join('')}</ul>`)}
      </div>
      <div class="grid grid-2">
        ${card(`<div class="card-head"><div><h2>Si estoy en crisis</h2><div class="sub">En orden, sin pensar demasiado.</div></div></div><ol class="plan-list">${(sp.steps || []).map((x, i) => `<li><span class="n">${i + 1}</span><span>${esc(x)}</span></li>`).join('')}</ol>`)}
        ${card(`<div class="card-head"><div><h2>Razones para quedarme</h2><div class="sub">Las escribes tú, no la familia.</div></div></div>${reasons.length ? `<ul class="plan-list">${reasons.map((x, i) => `<li><span class="n">${i + 1}</span><span>${esc(x)}</span></li>`).join('')}</ul>` : `<div class="empty"><strong>Aún no has escrito tus razones</strong><span>No tienes que hacerlo hoy. Cuando puedas, escribe una razón pequeña: una persona, una mascota, algo que quieras ver o terminar.</span></div>`}<p class="tiny muted" style="margin-top:10px">Puedes cambiarlas cuando quieras en el plan de abajo.</p>`)}
      </div>
      <div id="mi-red"></div>
      ${card(`<div class="card-head"><div><h2>💛 Mi red de apoyo</h2><div class="sub">Con nombre y teléfono. En crisis no se improvisa.</div></div><button class="link-btn" data-action="add-contact">Agregar</button></div>
        <div class="stack">${state.contacts.map(c => `<div class="between" style="padding:8px 0;border-bottom:1px solid var(--line)"><div><strong>${esc(c.name)}</strong><div class="tiny muted">${esc(c.role || '')}${c.notes ? ' · ' + esc(c.notes) : ''}</div></div><div class="row">${c.phone ? `<a class="btn tiny" href="${phoneHref(c.phone)}">${icon('phone', 13)} Llamar</a>${waHref(c.phone) ? `<a class="btn tiny ghost" href="${waHref(c.phone)}" target="_blank" rel="noopener" aria-label="WhatsApp a ${esc(c.name)}">${icon('chat', 13)} WhatsApp</a>` : ''}` : ''}<button class="btn tiny ghost" data-action="edit-contact" data-id="${esc(c.id)}">Editar</button></div></div>`).join('')}</div>`)}
      ${card(`<div class="card-head"><div><h2>Resguardar el entorno</h2><div class="sub">Acordado contigo y con tu equipo, no impuesto.</div></div></div><ul class="plan-list">${(sp.means || []).map((x, i) => `<li><span class="n">${i + 1}</span><span>${esc(x)}</span></li>`).join('')}</ul>`)}
      ${card(`<div class="card-head"><div><h2>Editar mi plan</h2><div class="sub">Una línea por idea. Revísalo con tu psicólogo/a o psiquiatra.</div></div></div>
        <form data-form="safety" class="form-grid">
          ${textareaField('warningSigns', 'Señales de que necesito apoyo', listToText(sp.warningSigns), 'Una por línea')}
          ${textareaField('coping', 'Qué me ayuda', listToText(sp.coping), 'Una por línea')}
          ${textareaField('steps', 'Pasos en crisis', listToText(sp.steps), 'Una por línea')}
          ${textareaField('reasons', 'Razones para quedarme', listToText(sp.reasons), 'Una por línea')}
          ${textareaField('means', 'Resguardo de medios', listToText(sp.means), 'Una por línea')}
          <div class="form-actions"><button class="btn primary" type="submit">Guardar plan</button><button class="btn ghost" type="button" data-action="print">Imprimir</button></div>
        </form>`)}
      <p class="tiny muted">Este plan es una base. Lo mejor es construirlo contigo y con tu profesional. No es un contrato ni una prueba de nada.</p>`;
  },

  aprende: function () {
    /* La cápsula del día rota diariamente y se abre por defecto; el consejo
       personal sale de los registros de la semana. Así hay algo nuevo cada día. */
    const i = dayOfYear() % LEARN.length;
    const delDia = LEARN[i];
    const orden = LEARN.map((x, idx) => ({ x, idx })).sort((a, b) => ((a.idx - i + LEARN.length) % LEARN.length) - ((b.idx - i + LEARN.length) % LEARN.length));
    const ins = careInsights(7);
    const consejo = aprendeConsejoPersonal(ins);
    return `
      <div class="hero" style="background:linear-gradient(135deg,#1E4D42,#7B6FA0 60%,#1F7A63);padding:26px 28px">
        <div class="hero-copy"><div class="eyebrow">Cápsulas de 2 minutos</div><h1 style="font-size:1.8rem">Entender también calma.</h1><p>Información educativa para ti y para la familia. No reemplaza a tu equipo de salud. Cada día abre una cápsula distinta.</p></div>
        <div class="hero-sun">${brandMark(190)}</div>
      </div>
      <div class="stack">
        <details class="learn-card" open><summary>${icon(delDia.icon || 'book', 18)} ✨ Cápsula de hoy · ${esc(delDia.title)}</summary><div class="learn-body">${delDia.body}<div class="note">${esc(delDia.note || 'Contenido educativo. Consúltalo con tu equipo de salud.')}</div></div></details>
        ${consejo ? `<div class="yasmin-tip" style="padding:12px 14px;border-radius:12px">${icon('chat', 14)} <strong>Yasmin, según tus registros:</strong> ${esc(consejo)}</div>` : ''}
        ${orden.slice(1).map(({ x }) => `<details class="learn-card"><summary>${icon(x.icon || 'book', 18)} ${esc(x.title)}</summary><div class="learn-body">${x.body}<div class="note">${esc(x.note || 'Contenido educativo. Consúltalo con tu equipo de salud.')}</div></div></details>`).join('')}
      </div>`;
  },

  reporte: function () {
    const report = buildReport(ui.reportDays);
    return `
      <div class="report-toolbar no-print">
        <div class="chips" style="margin:0">${[7, 14, 30].map(n => `<button class="chip ${ui.reportDays === n ? 'active' : ''}" data-action="report-days" data-value="${n}">${n} días</button>`).join('')}</div>
        <button class="btn small" data-action="print">${icon('print', 15)} Imprimir / PDF</button>
        <button class="btn small ghost" data-action="export-json">${icon('download', 15)} Respaldo JSON</button>
      </div>
      <div class="report" id="report-area">
        <div class="between"><div><h1>Reporte de seguimiento</h1><div class="report-sub">Andrea · ${esc(formatLongDate(todayISO()))} · periodo de ${ui.reportDays} días</div></div><div style="text-align:right"><div class="eyebrow">Paciente</div><strong>${esc(state.profile.name || 'Sin nombre')}</strong><div class="tiny muted">${esc(state.profile.age ? state.profile.age + ' años' : '')}</div></div></div>
        <p class="small"><strong>Diagnósticos registrados:</strong> ${esc(state.profile.diagnoses || 'Por confirmar')}<br><strong>Institución:</strong> ${esc(state.profile.provider || 'Por confirmar')}<br><strong>Alergias:</strong> ${esc(state.profile.allergies || 'Por confirmar')}</p>
        ${report.meds.length ? `<h2>Medicamentos actuales</h2><table><thead><tr><th>Medicamento</th><th>Dosis</th><th>Horario</th><th>Duración</th></tr></thead><tbody>${report.meds.map(m => `<tr><td>${esc(m.name)} ${esc(m.strength || '')}</td><td>${esc(m.doseLabel || '')}</td><td>${(m.schedule || []).map(s => esc(s.time) + ' · ' + esc(s.amount)).join('<br>')}</td><td>${m.durationDays ? m.durationDays + ' días' : 'Por confirmar'}</td></tr>`).join('')}</tbody></table>` : ''}
        <h2>Resumen del periodo</h2>
        <div class="report-grid">
          <div class="report-stat"><div class="v">${report.adherence.pct == null ? '—' : report.adherence.pct + '%'}</div><div class="l">Adherencia</div></div>
          <div class="report-stat"><div class="v">${report.avg.mood ?? '—'}</div><div class="l">Ánimo prom.</div></div>
          <div class="report-stat"><div class="v">${report.avg.anxiety ?? '—'}</div><div class="l">Ansiedad prom.</div></div>
          <div class="report-stat"><div class="v">${report.avg.pain ?? '—'}</div><div class="l">Dolor prom.</div></div>
          <div class="report-stat"><div class="v">${report.avg.sleepHours ?? '—'}</div><div class="l">Sueño h</div></div>
          <div class="report-stat"><div class="v">${report.avg.function ?? '—'}</div><div class="l">Función</div></div>
          <div class="report-stat"><div class="v">${report.exerciseSessions}</div><div class="l">Sesiones ej.</div></div>
          <div class="report-stat"><div class="v">${report.crisisCount}</div><div class="l">Días difíciles</div></div>
        </div>
        <p class="tiny muted">Adherencia: ${report.adherence.taken} tomadas, ${report.adherence.skipped} omitidas, ${report.adherence.expected} esperadas. Los promedios son de los registros disponibles; no son una interpretación clínica.</p>
        <h2>Tomas no tomadas (para la consulta)</h2>
        ${report.skipped.length ? `<table><thead><tr><th>Fecha</th><th>Medicamento</th><th>Hora</th><th>Motivo registrado</th></tr></thead><tbody>${report.skipped.map(s => `<tr><td>${esc(formatShort(s.date))}</td><td>${esc(s.med)} ${esc(s.amount || '')}</td><td>${esc(s.time || '')}</td><td>${esc(s.reason)}</td></tr>`).join('')}</tbody></table>` : '<p class="small">Sin omisiones registradas en el periodo.</p>'}
        <h2>Lo bueno del periodo</h2>
        ${report.insights.greenDays ? `<p class="small">Días marcados en verde: <strong>${report.insights.greenDays}</strong> de ${report.insights.days}.</p>` : ''}
        ${report.insights.buenas.length ? `<ul class="insight-list">${report.insights.buenas.slice(-8).map(b => `<li>${esc(formatShort(b.date))} — ${esc(b.text)}</li>`).join('')}</ul>` : '<p class="small">No hay cosas buenas registradas en el periodo. Cuando las haya, quedan aquí también: para la consulta, lo que ayuda y alegra es igual de importante que lo que duele.</p>'}
        <h2>Lo que se observa en los registros</h2>
        <ul class="insight-list">${report.insights.lines.map(line => `<li>${esc(line)}</li>`).join('')}</ul>
        <p class="tiny muted">Estas observaciones salen de los datos registrados. No son un diagnóstico ni una interpretación clínica.</p>
        <h2>Cuidados base</h2>
        <div class="report-grid">${CARE_ITEMS.map(item => `<div class="report-stat"><div class="v">${report.care.counts[item.key]}/${report.care.days}</div><div class="l">${esc(item.label)}</div></div>`).join('')}</div>
        <p class="tiny muted">Días en los que se marcó cada cuidado. No es una nota de cumplimiento.</p>
        <h2>Efectos y molestias reportadas</h2>
        ${report.effects.length ? `<table><thead><tr><th>Fecha</th><th>Molestia</th><th>Intensidad</th><th>Nota</th></tr></thead><tbody>${report.effects.map(e => `<tr><td>${esc(formatShort(e.date))}</td><td>${esc(e.symptom)}</td><td>${esc(e.severity)}/10</td><td>${esc(e.notes || '')}</td></tr>`).join('')}</tbody></table>` : '<p class="small">Sin efectos registrados en el periodo.</p>'}
        <h2>Citas</h2>
        ${report.appointments.length ? `<table><thead><tr><th>Fecha</th><th>Tipo</th><th>Estado</th><th>Nota</th></tr></thead><tbody>${report.appointments.map(a => `<tr><td>${a.date ? esc(formatDate(a.date)) : 'Por agendar'}</td><td>${esc(a.type)}</td><td>${esc(a.status)}</td><td>${esc(a.notes || '')}</td></tr>`).join('')}</tbody></table>` : '<p class="small">Sin citas registradas.</p>'}
        <h2>Preguntas para la consulta</h2>
        <ol class="small" style="padding-left:18px">${state.questions.slice(0, 12).map(q => `<li>${esc(q)}</li>`).join('')}</ol>
        <div class="small-note">Registro personal generado por Andrea. No es historia clínica ni sustituye la valoración profesional. Los datos provienen de lo que la paciente o su acompañante registraron. Verificar con el equipo tratante.</div>
      </div>`;
  },

  historia: function () {
    const filled = personalFilledCount();
    const total = PERSONAL_FIELDS.length;
    const pct = Math.round(filled / total * 100);
    const nombre = profileName();
    const esencial = ['story', 'family', 'faith', 'likes']
      .map(key => PERSONAL_FIELDS.find(f => f.key === key))
      .filter(Boolean);
    const resto = PERSONAL_FIELDS.filter(f => !esencial.includes(f.key));
    const fieldFor = f => textareaField(f.key, f.label, state.personal[f.key] || '', f.placeholder);
    return `
      <section class="history-hero">
        <div class="history-copy">
          <div class="eyebrow">Mi historia</div>
          <h1>Lo que me hace ser yo${nombre ? ', ' + esc(nombre) : ''}.</h1>
          <p>No es una ficha clínica ni un examen. Es lo que quieres que Andrea recuerde para hablar contigo como alguien que te conoce: tu gente, tu fe, tus palabras, lo que te sostiene y lo que te hace daño.</p>
          <div class="history-meta">
            <span class="badge ${filled ? 'success' : 'info'}">${filled ? filled + ' partes de tu historia contadas' : 'Aún sin partes contadas'}</span>
            <span class="tiny">Puedes escribir poco. Una palabra también cuenta.</span>
          </div>
          <div class="progress" style="margin-top:12px"><span style="width:${pct}%"></span></div>
          <div class="hero-actions">
            <button class="btn solid" data-action="open-yasmin">Hablar con Yasmin</button>
            <button class="btn" data-action="nav" data-id="agenda">Ver mi agenda</button>
            <button class="btn" data-action="nav" data-id="memoria">Lo que Yasmin recuerda</button>
          </div>
        </div>
        <div class="hero-sun">${brandMark(190)}</div>
      </section>

      <div class="grid grid-2">
        ${card(`<div class="card-head"><div><h2>Lo esencial</h2><div class="sub">Lo que más ayuda a que Yasmin te entienda.</div></div></div>
          <form data-form="personal" class="form-grid">
            ${esencial.map(fieldFor).join('')}
            <div class="divider"></div>
            <div class="card-head" style="margin-bottom:0"><div><h2 style="font-size:1rem">Con más detalle</h2><div class="sub">Opcional. Puedes volver cuando quieras.</div></div></div>
            ${resto.map(fieldFor).join('')}
            <p class="tiny muted">Yasmin usa estas palabras solo en este dispositivo. No se envían a internet ni se incluyen en la copia pública de la app.</p>
            <div class="form-actions">
              <button class="btn primary" type="submit">Guardar mi historia</button>
              <button class="btn ghost" type="button" data-action="nav" data-id="ajustes">Volver a ajustes</button>
            </div>
          </form>`)}
        <div class="stack">
          ${card(`<div class="card-head"><div><h2>Cómo la usa Yasmin</h2><div class="sub">Personalizar no es inventarte.</div></div></div>
            <p class="small">Si escribes que tu familia te llama de una forma, que tu fe te sostiene o que ciertas frases te hacen daño, Yasmin lo tiene en cuenta. No va a decirte «échale ganas» si eso te lastima, y va a recordar lo que te ayuda.</p>
            <div class="history-quote">«${esc(personalSnippet('helps', 110) || 'Dime qué te ayuda cuando estás mal. Lo voy a recordar.')}»</div>
            <p class="small">Lo que le cuentas en una conversación también puede quedar como una nota corta. Puedes verla o borrarla en <button class="link-btn tiny" data-action="nav" data-id="memoria">Memoria</button>.</p>
            <p class="tiny muted">Yasmin no es una terapeuta ni reemplaza a tu equipo de salud. Es una compañera que escucha y te ayuda a organizarte.</p>`)}
          ${card(`<div class="card-head"><div><h2>Lo que ya contaste</h2><div class="sub">Un resumen, no una etiqueta.</div></div><button class="link-btn" data-action="nav" data-id="ajustes">Ajustes</button></div>
            ${filled ? `<div class="stack">
              ${esencial.map(field => {
                const value = personalSnippet(field.key, 150);
                return value ? `<div><div class="eyebrow">${esc(field.label)}</div><p class="small" style="margin:4px 0 0">${esc(value)}</p></div>` : '';
              }).join('')}
            </div>` : emptyBox('Tu historia empieza donde quieras', 'Puedes escribir una sola línea. No tienes que contar todo hoy.')}
            ${filled ? `<div class="divider"></div><div class="form-actions"><button class="btn small ghost" data-action="open-yasmin">Contarle algo a Yasmin</button></div>` : ''}`)}
        </div>
      </div>`;
  },

  memoria: function () {
    const facts = memoryList('', 120);
    const insights = careInsights(7);
    const learn = state.settings.yasminLearn !== false;
    const sourceLabel = {
      chat: 'De una conversación',
      journal: 'De una reflexión',
      checkin: 'De un registro',
      manual: 'Lo escribiste tú'
    };
    const kinds = Object.entries(MEMORY_KINDS);
    return `
      <section class="history-hero memory-hero">
        <div class="history-copy">
          <div class="eyebrow">Memoria de Yasmin</div>
          <h1>Lo que Yasmin sabe de mí.</h1>
          <p>Yasmin no aprende en la nube ni manda tus conversaciones a ningún lado. Aprende aquí, con frases cortas que tú puedes ver y borrar. Es la diferencia entre una compañera que te escucha y un formulario que te clasifica.</p>
          <div class="history-meta">
            <span class="badge ${facts.length ? 'success' : 'info'}">${facts.length} ${facts.length === 1 ? 'nota' : 'notas'}</span>
            <span class="tiny">Tú decides qué se queda.</span>
          </div>
          <div class="hero-actions">
            <button class="btn solid" data-action="open-yasmin">Hablar con Yasmin</button>
            <button class="btn" data-action="nav" data-id="historia">Mi historia</button>
          </div>
        </div>
        <div class="hero-sun">${brandMark(190)}</div>
      </section>

      <div class="grid grid-2">
        ${card(`<div class="card-head"><div><h2>Aprender de lo que hablamos</h2><div class="sub">Solo en este teléfono.</div></div><span class="badge ${learn ? 'success' : 'warn'}">${learn ? 'Activo' : 'Pausado'}</span></div>
          <p class="small">Cuando está activo, Yasmin guarda frases cortas cuando le cuentas qué te ayuda, qué te hace daño, qué te gusta o qué quieres. No guarda la conversación completa ni las crisis. Así puede hablarte como alguien que te conoce, no como una desconocida.</p>
          <div class="form-actions"><button class="btn ${learn ? '' : 'primary'} small" data-action="toggle-yasmin-learn">${learn ? 'Pausar el aprendizaje' : 'Activar el aprendizaje'}</button>${facts.length ? `<button class="btn small ghost" data-action="clear-facts">Borrar toda la memoria</button>` : ''}</div>
          <p class="tiny muted">Si lo pausas, dejas de guardar cosas nuevas. Lo que ya sabía sigue ahí hasta que lo borres.</p>`)}
        ${card(`<div class="card-head"><div><h2>Lo que he notado</h2><div class="sub">Últimos 7 días de registros.</div></div></div>
          <ul class="insight-list">${insights.lines.map(line => `<li>${esc(line)}</li>`).join('')}</ul>
          <p class="tiny muted">Son observaciones de tus propios datos, no un diagnóstico. Si algo te preocupa, llévalo a tu próxima cita.</p>
          <div class="form-actions"><button class="btn small" data-action="nav" data-id="reporte">Ver reporte completo</button><button class="btn small ghost" data-action="nav" data-id="registro">Registrar hoy</button></div>`)}
      </div>

      ${card(`<div class="card-head"><div><h2>Agregar algo que quiero que recuerde</h2><div class="sub">Una frase corta es suficiente.</div></div></div>
        <form data-form="memory" class="form-grid">
          <div class="form-grid two">
            <div><label for="memory-kind">Tipo</label><select id="memory-kind" name="kind">${kinds.map(([key, label]) => `<option value="${key}">${esc(label)}</option>`).join('')}</select></div>
            <div class="tiny muted" style="align-self:end">Se guarda como una nota privada, no como un diagnóstico.</div>
          </div>
          ${textareaField('text', 'Lo que quiero que recuerde', '', 'Ej: cuando me siento así, me ayuda el silencio; no me digas «échale ganas»…')}
            <div class="form-actions"><button class="btn primary" type="submit">Guardar en la memoria</button></div>
        </form>`)}

      ${card(`<div class="card-head"><div><h2>Notas guardadas</h2><div class="sub">Puedes borrar cualquiera.</div></div></div>
        ${facts.length ? `<div class="memory-grid">${facts.map(f => `<article class="memory-card">
          <div class="memory-kind">${esc(MEMORY_KINDS[f.kind] || 'Nota')}</div>
          <p>${esc(f.text)}</p>
          <div class="between"><span class="tiny muted">${esc(sourceLabel[f.source] || 'Nota')}${f.date ? ' · ' + esc(formatDate(f.date)) : ''}</span><button class="link-btn tiny" data-action="delete-fact" data-id="${esc(f.id)}">Borrar</button></div>
        </article>`).join('')}</div>` : emptyBox('Todavía no hay notas', 'Cuando le cuentes algo que quieras que recuerde, aparecerá aquí. También puedes escribirlo arriba.')}`)}

      ${card(`<div class="card-head"><div><h2>Cómo se conecta todo</h2><div class="sub">Sin nube, sin cuentas, sin servidores.</div></div></div>
        <div class="memory-flow">
          <div><span class="n">1</span><strong>Lo que registras</strong><p>Ánimo, sueño, dolor, tomas, agenda, reflexiones y conversaciones.</p></div>
          <div><span class="n">2</span><strong>Lo que Andrea cruza</strong><p>Tu historia, tu memoria, tus medicamentos y tus patrones de los últimos días.</p></div>
          <div><span class="n">3</span><strong>Lo que recibes</strong><p>Un checklist claro, respuestas con contexto, un panorama y un reporte para la consulta.</p></div>
        </div>
        <p class="tiny muted">Todo se guarda en este dispositivo. El único archivo que sale de aquí es el respaldo JSON, y solo cuando tú lo descargas.</p>`)}
    `;
  },

  ajustes: function () {
    const p = state.profile, s = state.settings;
    const kb = Math.round(storageSize() / 1024 * 10) / 10;
    const fotos = state.momentos.filter(m => !!m.photoId).length;
    const backupDate = s.lastBackup ? new Date(s.lastBackup) : null;
    const backupDays = backupDate && !isNaN(backupDate.getTime())
      ? Math.max(0, Math.floor((Date.now() - backupDate.getTime()) / 86400000))
      : null;
    const backupLabel = backupDays === null ? 'Sin respaldo' : backupDays === 0 ? 'Hoy' : `Hace ${backupDays} día${backupDays === 1 ? '' : 's'}`;
    const backupTone = backupDays === null || backupDays > 14 ? 'info' : 'success';
    return `
      <div class="grid grid-2">
        ${card(`<div class="card-head"><div><h2>🪞 Perfil</h2><div class="sub">Solo lo necesario. Puedes dejar campos en blanco.</div></div></div>
          <div class="perfil-avatar-row">
            <button class="perfil-avatar" type="button" data-action="foto-andrea-cambiar" aria-label="Cambiar mi foto">${avatarAndrea(72)}<span class="perfil-avatar-cam">${icon('photo', 15)}</span></button>
            <div class="tiny muted" style="flex:1">Tu foto se ve solo en este dispositivo. ${state.profile.foto ? `<button class="link-btn tiny" data-action="foto-andrea-quitar">Quitar mi foto</button>` : 'Toca la foto para ponerla.'}</div>
          </div>
          <form data-form="profile" class="form-grid">
            <div class="form-grid two">${textInput('name', 'Nombre completo', p.name)}${textInput('displayName', 'Cómo quieres que te llamen', p.displayName)}</div>
            <div class="form-grid two">${numberField('age', 'Edad', p.age, 0, 120)}${textInput('startDate', 'Fecha de inicio del plan', p.startDate, 'date')}</div>
            <div><label for="f-provider">Institución / EPS</label><input id="f-provider" name="provider" value="${esc(p.provider || '')}" list="eps-list" placeholder="Escribe o elige tu EPS"><datalist id="eps-list">${EPS_COLOMBIA.map(e => `<option value="${esc(e)}">`).join('')}</datalist></div>
            ${textareaField('diagnoses', 'Diagnósticos registrados', p.diagnoses, 'Según tu equipo de salud')}
            <div><label for="f-allergies">Alergias</label>
              <input id="f-allergies" name="allergies" value="${esc(p.allergies || '')}" list="alergias-list" placeholder="Medicamentos, alimentos, otra…">
              <datalist id="alergias-list">${ALERGIAS_COMUNES.map(a => `<option value="${esc(a)}">`).join('')}</datalist>
              <div class="row" style="margin-top:6px"><button class="chip" type="button" data-action="allergies-none">No tengo alergias</button><button class="chip" type="button" data-action="allergies-unknown">No sé / por confirmar</button></div>
            </div>
            ${textareaField('notes', 'Notas', p.notes)}
            <p class="yasmin-tip tiny">${icon('chat', 13)} <strong>Yasmin:</strong> con tu nombre y tu EPS basta para empezar. Lo demás se puede completar otro día, sin prisa.</p>
            <div class="form-actions"><button class="btn primary" type="submit">Guardar perfil</button></div>
          </form>`)}
        ${card(`<div class="card-head"><div><h2>Horarios base</h2><div class="sub">Referencia para nuevas tomas.</div></div></div>
          <form data-form="times" class="form-grid">
            <div class="form-grid three">${textInput('morning', 'Mañana', s.morning, 'time')}${textInput('afternoon', 'Tarde', s.afternoon, 'time')}${textInput('night', 'Noche', s.night, 'time')}</div>
            <div class="form-actions"><button class="btn primary" type="submit">Guardar horarios</button><button class="btn small ghost" type="button" data-action="apply-times">Aplicar a todos</button></div>
            <p class="tiny muted">«Aplicar a todos» reemplaza los horarios de tus medicamentos. Úsalo solo si estás segura.</p>
          </form>
          <div class="divider"></div>
          <div class="between"><div><strong>Avisos</strong><div class="tiny muted">Tomas y momentos. Solo con Andrea abierta o instalada.</div></div><span class="badge ${s.notifications ? 'success' : 'info'}">${s.notifications ? 'Activos' : 'Apagados'}</span></div>
          <div class="form-actions"><button class="btn small" data-action="enable-notifications">Activar</button><button class="btn small ghost" data-action="test-notification">Probar</button></div>`)}
      </div>

      <div class="grid grid-2">
        ${card(`<div class="card-head"><div><h2>🦋 Yasmin, tu compañera</h2><div class="sub">Cómo quieres que te hable.</div></div>${badge(personalHasData() ? 'Conoce tu historia' : 'Aún sin historia', personalHasData() ? 'success' : 'info')}</div>
          <div class="perfil-avatar-row">
            <button class="perfil-avatar" type="button" data-action="foto-yasmin-cambiar" aria-label="Cambiar la foto de Yasmin">${avatarYasmin(72)}<span class="perfil-avatar-cam">${icon('photo', 15)}</span></button>
            <div class="tiny muted" style="flex:1">La foto de Yasmin en el chat. ${state.settings.yasminFoto ? `<button class="link-btn tiny" data-action="foto-yasmin-quitar">Quitar foto</button>` : 'Toca para ponerle su foto (o deja su mariposa).'}</div>
          </div>
          <form data-form="yasmin-settings" class="form-grid">
            ${textInput('yasminName', 'Cómo se llama tu compañera', s.yasminName || 'Yasmin')}
            ${selectField('tone', 'Su forma de hablar', s.yasminTone || 'cercano', [
              { value: 'cercano', label: 'Cercana, como una amiga' },
              { value: 'suave', label: 'Muy suave, sin prisa' },
              { value: 'directo', label: 'Directa y breve' }
            ])}
            <div><label for="f-yasmin-voice">Su voz</label>
              <select id="f-yasmin-voice" name="yasminVoice">
                <option value="">Automática · la más natural de este teléfono</option>
                ${yasminVocesDisponibles().map(v => `<option value="${esc(v.voiceURI || v.name)}" ${(s.yasminVoice || '') === (v.voiceURI || v.name) ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('')}
              </select>
              ${(() => {
                const nVoces = yasminVocesDisponibles().length;
                if (!nVoces) return '<p class="tiny muted">Abre esta pantalla de nuevo para ver las voces de tu teléfono.</p>';
                if (nVoces <= 1) return '<p class="tiny muted">Tu teléfono solo trae una voz en español, y por eso suena robótica. Para voces más naturales: Ajustes del sistema → Administración de ajustes → Síntesis de voz → motor de Google, e instala las voces en español. La app nunca habla sola: solo cuando activas «Leer en voz alta».</p>';
                return `<p class="tiny muted">Tu teléfono trae ${nVoces} voces en español. La app nunca habla sola: solo cuando activas «Leer en voz alta».</p>`;
              })()}
            </div>
            <div class="form-actions" style="margin-top:4px"><button class="btn small ghost" type="button" data-action="yasmin-probar-voz">Probar la voz</button></div>
            <label class="check-row"><input type="checkbox" name="yasminRead" ${s.yasminRead ? 'checked' : ''}> Leer en voz alta sus respuestas</label>
            <label class="check-row"><input type="checkbox" name="feEnabled" ${s.feEnabled !== false ? 'checked' : ''}> Mostrar «Tu momentito de fe» en Hoy (frases de fe y ánimo; se puede apagar)</label>
            <div class="form-actions">
              <button class="btn primary" type="submit">Guardar</button>
              <button class="btn small ghost" type="button" data-action="nav" data-id="historia">Mi historia</button>
              <button class="btn small ghost" type="button" data-action="nav" data-id="memoria">Memoria</button>
              <button class="btn small ghost" type="button" data-action="open-yasmin">Hablar ahora</button>
            </div>
          </form>
          <p class="tiny muted">La lectura en voz alta necesita el permiso de voz del teléfono. Yasmin no envía tu voz a ningún servidor: usa el motor del dispositivo.</p>`)}
        ${card(`<div class="card-head"><div><h2>Privacidad</h2><div class="sub">Tus datos son tuyos.</div></div></div>
          <div class="between" style="padding:8px 0;border-bottom:1px solid var(--line)"><div><strong>PIN de acceso</strong><div class="tiny muted">${s.pinHash ? 'Configurado' : 'Sin configurar'}</div></div><div class="row"><button class="btn tiny" data-action="set-pin">${s.pinHash ? 'Cambiar' : 'Configurar'}</button>${s.pinHash ? `<button class="btn tiny ghost" data-action="remove-pin">Quitar</button>` : ''}</div></div>
          <div class="between" style="padding:8px 0;border-bottom:1px solid var(--line)"><div><strong>Modo discreto</strong><div class="tiny muted">Oculta el nombre en la cabecera y el pie. No oculta los medicamentos.</div></div><button class="btn tiny ${s.discreet ? 'primary' : ''}" data-action="toggle-discreet">${s.discreet ? 'Activado' : 'Activar'}</button></div>
          <div class="between" style="padding:8px 0"><div><strong>Bloquear ahora</strong><div class="tiny muted">Vuelve a la pantalla del PIN.</div></div><button class="btn tiny" data-action="lock">Bloquear</button></div>
          <p class="tiny muted">El PIN es una cortina de privacidad, no cifrado. Para proteger el teléfono, usa el bloqueo del sistema. No compartas el archivo de respaldo por WhatsApp.</p>
          <details class="privacy-details">
            <summary>Qué guarda Andrea en este dispositivo</summary>
            <ul class="small" style="padding-left:18px;margin:8px 0 0">
              <li>${state.medications.length} medicamentos y ${state.dailyLogs.length} días de registro.</li>
              <li>${state.appointments.length} citas, ${state.events.length} recordatorios y ${state.contacts.length} contactos.</li>
              <li>${state.momentos.length} momentos${fotos ? ` (${fotos} con foto)` : ''} y ${state.chat.length} mensajes con Yasmin.</li>
              <li>${state.yasminFacts.length} notas en la memoria de Yasmin.</li>
              <li>Tu historia personal: ${personalFilledCount()} de ${PERSONAL_FIELDS.length} partes.</li>
            </ul>
            <p class="tiny muted" style="margin-top:8px">Nada de esto se envía a Internet. El respaldo JSON es la única copia que sale del dispositivo, y solo cuando tú lo descargas.</p>
          </details>`)}
      </div>

      <div class="grid grid-2">
        ${card(`<div class="card-head"><div><h2>Mi historia</h2><div class="sub">Lo que hace que Yasmin te conozca.</div></div>${badge(`${personalFilledCount()}/${PERSONAL_FIELDS.length}`, personalHasData() ? 'success' : 'info')}</div>
          <p class="small">${personalHasData()
            ? `Ya contaste algo de tu historia. Yasmin lo tiene en cuenta para hablarte de una forma más cercana. Puedes cambiarlo cuando quieras.`
            : 'Cuéntale a Andrea quién eres: tu gente, tu fe, tus palabras, lo que te ayuda. No es obligatorio, pero hace que la compañía se sienta más tuya.'}</p>
          ${personalHasData() ? `<div class="history-quote">«${esc(personalSnippet('story', 180) || personalSnippet('helps', 180) || 'Mi historia está aquí.')}»</div>` : ''}
          <div class="form-actions"><button class="btn primary small" data-action="nav" data-id="historia">${personalHasData() ? 'Editar mi historia' : 'Contar mi historia'}</button><button class="btn small ghost" data-action="open-yasmin">Hablar con Yasmin</button></div>`)}
        ${card(`<div class="card-head"><div><h2>Agenda y alarmas</h2><div class="sub">Recordatorios, citas y calendario del teléfono.</div></div>${agendaPendingSync() ? badge('Cambios sin exportar', 'warn') : badge(s.agendaExportAt ? 'Sincronizado' : 'Listo', s.agendaExportAt ? 'success' : 'info')}</div>
          <p class="small">Puedes crear recordatorios propios, moverlos de día y elegir si suenan. Para que suenen con Andrea cerrada, exporta el calendario del teléfono.</p>
          <div class="form-actions"><button class="btn primary small" data-action="view-agenda">${icon('calendar', 15)} Abrir mi agenda</button><button class="btn small" data-action="download-ics">${icon('download', 14)} Exportar alarmas</button><button class="btn small ghost" data-action="add-event">${icon('plus', 14)} Recordatorio</button></div>
          <p class="tiny muted">${s.agendaExportAt ? `Última exportación: ${esc(formatDate(localDateISO(s.agendaExportAt)))}. ` : ''}Si cambias una cita o un recordatorio, vuelve a exportar para actualizar las alarmas del teléfono.</p>`)}
      </div>

      ${card(`<div class="card-head"><div><h2>Momentos</h2><div class="sub">En pausa mientras organizas los recuerdos.</div></div>${badge(s.momentsEnabled ? 'Avisos activos' : 'Avisos apagados', s.momentsEnabled ? 'success' : 'warn')}</div>
        <form data-form="compania" class="form-grid">
          <div><label for="momentTimes">Horas de los momentos (separadas por coma)</label><input id="momentTimes" name="momentTimes" value="${esc((s.momentTimes || []).join(', '))}" placeholder="09:30, 13:30, 17:00, 20:30"></div>
          <label class="check-row"><input type="checkbox" name="momentsEnabled" ${s.momentsEnabled ? 'checked' : ''}> Enviarme momentos de mi familia durante el día</label>
          <div class="form-actions"><button class="btn primary" type="submit">Guardar</button><button class="btn small ghost" type="button" data-action="nav" data-id="momentos">Ver Momentos</button><button class="btn small ghost" type="button" data-action="reiniciar-induccion">Ver la inducción otra vez</button></div>
        </form>
        <p class="tiny muted">Los avisos programados necesitan la app abierta o instalada y permiso del navegador. Para alarmas que suenen siempre, usa el calendario del teléfono.</p>`)}

      ${card(`<div class="card-head"><div><h2>Andrea en tu celular</h2><div class="sub">Para llevarla contigo, sin depender del computador.</div></div>${badge(appInstalada() ? 'Instalada' : 'En el navegador', appInstalada() ? 'success' : 'info')}</div>
        <p class="small">Con su propio ícono, sin barra del navegador y funcionando sin conexión. En iPhone es la única forma de recibir avisos.</p>
        <div class="form-actions"><button class="btn primary small" data-action="instalar-app" ${appInstalada() ? 'hidden' : ''}>${icon('download', 15)} Instalar Andrea</button><button class="btn small ghost" data-action="test-notification">Probar un aviso</button></div>
        ${/iphone|ipad|ipod/i.test(navigator.userAgent) && !appInstalada() ? '<p class="tiny muted" style="margin-top:8px">En iPhone: toca el botón <strong>Compartir</strong> de Safari y elige <strong>Agregar a pantalla de inicio</strong>. Queda con su propio ícono, como una app.</p>' : ''}
        <p class="tiny muted">Tus datos se quedan en el teléfono. Instalar no los sube a ninguna parte.</p>`)}

      ${card(`<div class="card-head"><div><h2>🧺 Datos y respaldo</h2><div class="sub">${kb} KB en este dispositivo</div></div>${badge(backupLabel, backupTone)}</div>
        <p class="tiny muted">Último respaldo: ${s.lastBackup ? esc(formatDate(localDateISO(s.lastBackup))) : 'nunca'}. ${backupDays !== null && backupDays > 14 ? 'Ya pasaron más de dos semanas; vale la pena guardar uno hoy. ' : ''}Exporta con frecuencia y guarda el archivo en un lugar seguro. Las fotos de Momentos no van dentro del JSON: se quedan en el teléfono.</p>
        <div class="form-actions"><button class="btn primary small" data-action="export-json">${icon('download', 15)} Exportar respaldo</button><button class="btn small" data-action="import-json">${icon('upload', 15)} Importar</button></div>
        <input type="file" id="import-file" accept="application/json,.json" class="hidden" data-action="import-file">
        <div class="divider"></div>
        <div class="form-actions">${(window.ANDREA_SEED || window.ALBA_SEED) ? '<button class="btn small ghost" data-action="load-seed">Cargar plan inicial</button>' : ''}<button class="btn small danger" data-action="reset-all">Borrar todos los datos</button></div>
        <p class="tiny muted" style="margin-top:9px">«Cargar plan inicial» reemplaza los datos actuales por el plan de Yasmin. Úsalo solo en una instalación nueva o si tienes un respaldo.</p>`)}

      ${card(`<div class="card-head"><div><h2>Acerca de Andrea</h2></div></div>
        <p class="small">Andrea es un espacio privado de cuidado, compañía y memoria. Nació para acompañar un proceso real de cuidado, y lleva el nombre de la persona que lo inspiró: <em>Andrea</em> viene del griego <em>andreía</em>, valentía.</p>
        <p class="small">No diagnostica, no formula, no reemplaza a psiquiatría, psicología, fisiatría, fisioterapia ni urgencias. Si hay peligro inmediato: <strong>123</strong>.</p>
        <details class="privacy-details">
          <summary>Nuestro trato</summary>
          <ul class="small" style="padding-left:18px;margin:8px 0 0">
            <li>Tus datos viven en este dispositivo. No hay cuentas, nube, analítica ni publicidad.</li>
            <li>La app no tiene un panel para que tu familia lea tu diario, tus registros o tus conversaciones.</li>
            <li>Yasmin no diagnostica, no formula y no reemplaza a tu equipo de salud. Si hay peligro: <strong>123</strong>.</li>
            <li>Puedes exportar o borrar todo desde Ajustes, cuando tú lo decidas.</li>
          </ul>
        </details>
        <p class="tiny muted">Versión ${APP_VERSION} · Datos locales · Sin analítica · Sin nube por defecto. Si hay una versión nueva, se aplica sola o desde el botón «Buscar actualización», sin reinstalar nada.</p>
        <div class="form-actions"><button class="btn small" data-action="app-update">Buscar actualización</button></div>`)}`;
  }
});

/* ---------- bienvenida ---------- */
function viewWelcome() {
  const haySeed = !!(window.ANDREA_SEED || window.ALBA_SEED);
  return `<section class="hero">
    <div class="hero-copy">
      <div class="eyebrow">Bienvenida</div>
      <h1>Un lugar para cuidarte sin ruido.</h1>
      <p>Este es tu espacio: aquí organizas tus medicamentos, tus citas y tus días. También guarda las fotos y las palabras de tu familia, para que no se te olvide que no estás sola.</p>
      <div class="hero-actions">
        <button class="btn solid" data-action="nav" data-id="ajustes">Configurar mi perfil</button>
        <button class="btn" data-action="import-json">Importar respaldo</button>
        ${haySeed ? '<button class="btn" data-action="load-seed">Cargar plan inicial</button>' : ''}
        <button class="btn" data-action="reiniciar-induccion">Ver la inducción</button>
      </div>
      <p style="margin-top:11px;font-size:.8rem;color:rgba(255,242,232,.78)">¿Ya tienes un respaldo del computador? Impórtalo aquí y después revisa el perfil.</p>
      <input type="file" id="import-file" accept="application/json,.json" class="hidden" data-action="import-file">
    </div>
    <div class="hero-sun">${brandMark(230)}</div>
  </section>
    <div class="grid grid-2">
      ${card(`<h2>Privado por diseño</h2><p class="small">Tus datos viven en este dispositivo. No se envían a la nube. Puedes exportarlos o borrarlos cuando quieras.</p>`)}
      ${card(`<h2>Compañía primero</h2><p class="small">Si hay pensamientos de muerte o peligro inmediato, no uses la app como canal principal: llama al <strong>123</strong> o ve a urgencias. No te quedes sola.</p><button class="btn danger small" data-action="crisis">Abrir mi plan</button>`)}
    </div>
    ${card(`<div class="card-head"><div><h2>Nuestro trato</h2><div class="sub">Lo que puedes esperar de Andrea, sin letra pequeña.</div></div></div>
      <ul class="plan-list">
        <li><span class="n">1</span><span>Tus datos viven en este dispositivo. No hay cuentas, nube, analítica ni publicidad.</span></li>
        <li><span class="n">2</span><span>La app no tiene un panel para que tu familia lea tu diario, tus registros o tus conversaciones.</span></li>
        <li><span class="n">3</span><span>Yasmin no diagnostica, no formula y no reemplaza a tu equipo de salud. Si hay peligro, llama al <strong>123</strong>.</span></li>
        <li><span class="n">4</span><span>Puedes exportar o borrar todo desde Ajustes, cuando tú lo decidas.</span></li>
      </ul>`)}`;
}

function textInput(name, label, value, type = 'text') {
  return `<div><label for="f_${name}">${esc(label)}</label><input id="f_${name}" type="${type}" name="${name}" value="${esc(value || '')}"></div>`;
}

/* ---------- datos del reporte ---------- */
function buildReport(days) {
  const dates = lastNDates(days);
  const adherence = { expected: 0, taken: 0, skipped: 0, pct: null };
  dates.forEach(date => {
    dosesFor(date).forEach(d => {
      adherence.expected++;
      const s = doseStatus(date, d.key);
      if (s === 'taken') adherence.taken++;
      if (s === 'skipped') adherence.skipped++;
    });
  });
  adherence.pct = adherence.expected ? Math.round(adherence.taken / adherence.expected * 100) : null;
  const avg = key => {
    const vals = dates.map(date => (findDay(date)?.checkin || {})[key]).filter(v => typeof v === 'number' && !isNaN(v));
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
  };
  const effects = state.sideEffects.filter(e => dates.includes(e.date)).slice().reverse();
  const exerciseSessions = dates.reduce((sum, date) => sum + Object.values(findDay(date)?.exercises || {}).filter(x => x.done).length, 0);
  const crisisCount = dates.filter(date => (findDay(date)?.checkin || {}).suicidal === 'si').length;
  const appointments = state.appointments.filter(a => !a.date || dates.includes(a.date) || a.date >= todayISO()).slice(0, 8);
  const skipped = missedDoses(days);
  const insights = careInsights(days);
  return {
    meds: activeMeds(),
    adherence,
    avg: { mood: avg('mood'), anxiety: avg('anxiety'), pain: avg('pain'), sleepHours: avg('sleepHours'), function: avg('function') },
    effects,
    exerciseSessions,
    crisisCount,
    appointments,
    skipped,
    insights,
    care: insights.care
  };
}

/* ---------- contenido educativo ---------- */
/* Un consejo de Aprende que usa los registros de la semana, sin diagnosticar. */
function aprendeConsejoPersonal(ins) {
  if (!ins || !ins.hasData) return 'Aún estoy conociendo tus registros. Cuando lleves dos o tres días anotando cómo estás, aquí verás algo pensado para ti.';
  const ideas = [];
  if (ins.lowSleep >= 2) ideas.push('has dormido poco varios días; en la cápsula de sueño hay una idea sencilla para esta noche');
  if (ins.highPain >= 2) ideas.push('el dolor ha estado alto; la cápsula de dolor tiene la explicación de cuándo pedir apoyo extra');
  if (ins.greenDays) ideas.push(`tuviste ${ins.greenDays} día${ins.greenDays === 1 ? '' : 's'} bueno${ins.greenDays === 1 ? '' : 's'} esta semana; saber qué lo hizo bueno sirve para repetirlo`);
  if (ins.buenas.length) ideas.push(`anotaste cosas buenas como «${ins.buenas[ins.buenas.length - 1].text}»; eso también es medicina`);
  if (!ideas.length) ideas.push('tus registros van tomando forma; cada día que anotas, tus decisiones en la consulta se hacen más fáciles');
  return ideas[0] + '.';
}

const LEARN = [
  {
    title: 'Medicamentos: lo esencial',
    icon: 'pill',
    body: `<p>Tomar el medicamento a la misma hora ayuda a mantener niveles estables. Usa el calendario del teléfono como alarma principal y Andrea para registrar.</p><ul><li>No suspendas ni cambies dosis sin el psiquiatra.</li><li>Si olvidas una dosis, no tomes el doble. Consulta.</li><li>No mezcles alcohol con sedantes.</li><li>Si hay somnolencia o mareo, no conduzcas.</li><li>Revisa el inventario y renueva antes de quedarte sin medicamento.</li><li>Anota los efectos secundarios: somnolencia, mareo, náuseas, cambios de peso, hinchazón, cambios de ánimo.</li></ul>`,
    note: 'Basado en instrucciones de egreso hospitalario y en recomendaciones generales de seguridad. No sustituye la indicación médica.'
  },
  {
    title: 'Sueño: la base que sostiene el día',
    icon: 'moon',
    body: `<p>El sueño afecta el ánimo, el dolor y la energía. La higiene del sueño es parte del tratamiento, no un lujo.</p><ul><li>Mismos horarios para acostarte y levantarte.</li><li>Luz natural por la mañana; oscuridad y silencio de noche.</li><li>La cama solo para dormir.</li><li>Evita siestas largas.</li><li>Cena ligera; evita cafeína y bebidas oscuras.</li><li>Evita pantallas después de las 6 p.m.</li><li>Si no duermes, levántate y haz algo tranquilo con luz baja; vuelve cuando tengas sueño.</li></ul>`,
    note: 'Basado en recomendaciones de higiene del sueño del equipo tratante. Si el insomnio persiste, consúltalo.'
  },
  {
    title: 'Dolor crónico: no es «solo en tu cabeza»',
    icon: 'activity',
    body: `<p>El dolor crónico es real y complejo. No se trata solo de aguantar ni de «pensar positivo». El objetivo es recuperar función y calidad de vida, con un plan integral.</p><ul><li>Registra intensidad, ubicación, desencadenantes y qué alivia.</li><li>Mueve el cuerpo con suavidad y constancia; valida el plan con fisioterapia.</li><li>Si un ejercicio aumenta el dolor, suspéndelo y consulta.</li><li>No automediques opioides ni combines analgésicos sin revisar.</li><li>El dolor y la emoción se afectan mutuamente; ambas cosas merecen atención.</li></ul>`,
    note: 'Información educativa. El manejo del dolor debe ser coordinado con clínica del dolor, fisiatría y fisioterapia.'
  },
  {
    title: 'Ansiedad y tristeza: qué hacer en el momento',
    icon: 'heart',
    body: `<p>La ansiedad y la tristeza son señales, no fallas de carácter. En el momento puedes bajar la intensidad con recursos simples; para el fondo, la terapia es clave.</p><ul><li>Respira lento: inhala 4, sostén 4, exhala 6. Repite 6 veces.</li><li>5-4-3-2-1: nombra lo que ves, tocas, oyes, hueles y saboreas.</li><li>Mueve el cuerpo suave o camina acompañada.</li><li>Escribe lo que sientes sin corregirlo.</li><li>Llama a alguien y di: «No estoy bien, necesito compañía».</li><li>No tomes decisiones importantes en el pico de la emoción.</li></ul>`,
    note: 'Si los síntomas persisten la mayor parte del día o te impiden funcionar, contacta a tu equipo de salud.'
  },
  {
    title: 'Cuando la cabeza se pone oscura',
    icon: 'shield',
    body: `<p>Hay días en que aparecen pensamientos de muerte. Suelen llegar en momentos de dolor intenso y no significan que seas mala persona ni que estés destinada a actuar: significan que necesitas apoyo ahora.</p><ul><li>Dilo en voz alta a alguien de confianza.</li><li>No te quedes sola.</li><li>Aléjate de objetos peligrosos y entrega los medicamentos a alguien de confianza si hace falta.</li><li>Llama al 123 o ve a urgencias si hay un plan, intención o ya te hiciste daño.</li><li>Llama a la Línea 106 para apoyo psicológico.</li><li>Después de la crisis, habla con tu psiquiatra o psicólogo.</li></ul>`,
    note: 'Si hay peligro inmediato, la app no es el canal. Llama al 123 o acude a urgencias.'
  },
  {
    title: 'Cómo acompañar sin controlar',
    icon: 'heartHand',
    body: `<p>El acompañamiento ayuda cuando es predecible, respetuoso y práctico. No ayuda cuando se convierte en vigilancia o en juicio.</p><ul><li>Valida: «Te creo», «Estoy aquí», «¿Qué necesitas ahora?».</li><li>Evita «todo pasa por algo», «échale ganas», «otros están peor».</li><li>Pregunta antes de aconsejar.</li><li>Respeta su diario y su privacidad.</li><li>Ayuda con cosas concretas: transporte, comida, trámites, compañía.</li><li>Reparte tareas y busca relevo. El cuidador también necesita cuidado.</li><li>Si dice que quiere morir, pregúntale directamente y busca ayuda. Escuchar no aumenta el riesgo.</li></ul>`,
    note: 'Para la familia y la red de apoyo. Una sesión de psicoeducación con el equipo tratante puede ayudar.'
  },
  {
    title: 'Fisioterapia en casa: constancia, no castigo',
    icon: 'activity',
    body: `<p>El plan casero busca movilidad, fuerza y confianza. No es una prueba de resistencia.</p><ul><li>Empieza por los primeros ejercicios y aumenta poco a poco.</li><li>No fuerces un movimiento que duele.</li><li>Si el dolor aumenta o aparecen síntomas nuevos, suspende y consulta.</li><li>Registra dolor antes y después para aprender qué te sienta bien.</li><li>La constancia importa más que la velocidad.</li></ul>`,
    note: 'Plan de fisioterapia del equipo tratante. Validar con fisioterapia/fisiatría.'
  },
  {
    title: 'Derechos, citas y trámites',
    icon: 'file',
    body: `<p>La salud también se gestiona. Tener los documentos y las fechas claras evita retrasos.</p><ul><li>Guarda fórmulas, órdenes, resultados y comprobantes.</li><li>Confirma autorizaciones de EPS para psicología, fisiatría y terapia física.</li><li>Pregunta por la incapacidad y la prórroga.</li><li>Pide copia de la historia clínica si la necesitas.</li><li>Anota el nombre de quien te atiende y el número de radicado.</li><li>Si una cita se cancela, pide la reprogramación por escrito.</li></ul>`,
    note: 'Información general. Los trámites dependen de tu EPS y del hospital.'
  },
  {
    title: 'Cuidado del cuidador',
    icon: 'leaf',
    body: `<p>Si eres el acompañante principal, tu salud también cuenta. No puedes sostener a alguien si te vas vaciando.</p><ul><li>Pide relevo; no tienes que estar disponible 24/7.</li><li>Duerme, come y muévete.</li><li>Ten una persona con quien hablar sin filtro.</li><li>No cargues con todas las decisiones.</li><li>Busca apoyo psicológico si te está sobrepasando.</li><li>Recuerda: cuidar no es controlar; acompañar no es salvar.</li></ul>`,
    note: 'El agotamiento del cuidador es real. Pedir ayuda no es abandonar.'
  }
];
