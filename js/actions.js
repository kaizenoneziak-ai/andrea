let andreaSwReg = null;
/* Andrea · acciones, formularios, modales e inicialización */

/* ---------- helpers de formulario ---------- */
function formValue(fd, name) {
  const value = fd.get(name);
  return value == null ? '' : String(value).trim();
}
function formNumber(fd, name, fallback = null) {
  const raw = formValue(fd, name);
  if (raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}
function formList(fd, name) {
  return fd.getAll(name).map(v => String(v).trim());
}
function formatDuration(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${pad(r)}`;
}
function dateLabel(iso) {
  return iso ? formatDate(iso) : 'Por confirmar';
}

/* ---------- formularios ---------- */
async function handleSubmit(event) {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();

  const kind = form.dataset.form;
  const fd = new FormData(form);
  const v = name => formValue(fd, name);
  const n = (name, fallback = null) => formNumber(fd, name, fallback);

  try {
    switch (kind) {
      case 'unlock': {
        await unlock(v('pin'));
        break;
      }

      case 'chat': {
        const texto = v('text');
        const area = $('#chat-text');
        if (area) area.value = '';
        yasminEnviar(texto);
        break;
      }

      case 'quick-checkin': {
        const day = ensureDay(todayISO());
        day.checkin = Object.assign({}, day.checkin || {}, {
          mood: n('mood'), anxiety: n('anxiety'), pain: n('pain'),
          sleepQuality: n('sleepQuality'), at: nowISO()
        });
        save(); render();
        toast('Registro guardado. Gracias por escucharte.');
        break;
      }

      case 'checkin': {
        const date = ui.selectedDate || todayISO();
        const day = ensureDay(date);
        const previous = day.checkin || {};
        day.checkin = Object.assign({}, previous, {
          mood: n('mood'), anxiety: n('anxiety'), pain: n('pain'),
          sleepQuality: n('sleepQuality'), energy: n('energy'), function: n('function'),
          sleepHours: n('sleepHours'), suicidal: v('suicidal') || previous.suicidal || 'prefiero_no',
          sideEffects: v('sideEffects'), notes: v('notes'), at: nowISO()
        });
        save();
        if (v('notes') && typeof yasminAprender === 'function') yasminAprender(v('notes'), '', 'checkin');
        render();
        if (day.checkin.suicidal === 'si') {
          toast('Gracias por decirlo. No tienes que quedarte sola con esto.');
          setTimeout(() => openCrisisModal(true), 220);
        } else {
          toast('Registro guardado.');
        }
        break;
      }

      case 'win': {
        const day = ensureDay(todayISO());
        day.win = v('win');
        save(); render();
        toast(day.win ? 'Guardado. También cuenta.' : 'Campo vacío. Puedes volver cuando quieras.');
        break;
      }

      case 'bueno': {
        const day = ensureDay(todayISO());
        day.win = v('win');
        day.gracias = [v('gracias1'), v('gracias2')].map(s => String(s || '').trim());
        const nBuenas = [day.win, ...day.gracias].filter(Boolean).length;
        save(); render();
        if (nBuenas >= 3) toast('Tres cosas buenas guardadas. Ese también es tu día, y de los buenos.');
        else if (nBuenas >= 1) toast(`Guardado${nBuenas > 1 ? ` (${nBuenas} cosas)` : ''}. Lo bueno también cuenta.`);
        else toast('Sin nada escrito todavía. Puedes volver cuando quieras.');
        break;
      }

      case 'journal': {
        const date = ui.selectedDate || todayISO();
        const day = ensureDay(date);
        const text = v('text');
        day.journal = text ? { text, at: nowISO() } : null;
        save();
        if (text && typeof yasminAprender === 'function') yasminAprender(text, '', 'journal');
        render();
        toast(text ? 'Reflexión guardada.' : 'Reflexión vacía.');
        break;
      }

      case 'safety': {
        state.safetyPlan = {
          warningSigns: lines(v('warningSigns')),
          coping: lines(v('coping')),
          steps: lines(v('steps')),
          reasons: lines(v('reasons')),
          means: lines(v('means'))
        };
        save(); render();
        toast('Plan guardado. Revísalo con tu equipo.');
        break;
      }

      case 'profile': {
        const antes = personalFilledCount();
        state.profile = Object.assign({}, state.profile, {
          name: v('name'), displayName: v('displayName'), age: n('age'),
          startDate: v('startDate') || state.profile.startDate,
          provider: v('provider'), diagnoses: v('diagnoses'),
          allergies: v('allergies'), notes: v('notes')
        });
        state.settings.personalUpdatedAt = nowISO();
        save(); render();
        /* Retroalimentación: bienvenida si es el primer guardado con nombre,
           resumen de avance si ya iba llenando. */
        const despues = personalFilledCount();
        const nombre = state.profile.displayName || state.profile.name;
        if (!antes && despues > 0 && nombre) {
          toast(`¡Bienvenida, ${nombre.split(' ')[0]}! Tu espacio ya te conoce. Todo quedó guardado en este dispositivo.`);
        } else if (despues >= PERSONAL_FIELDS.length) {
          toast('Perfil completo. Yasmin ya conoce tu historia.');
        } else {
          toast(`Perfil guardado. Llevas ${despues} de ${PERSONAL_FIELDS.length} partes contadas, sin prisa.`);
        }
        break;
      }


      case 'times': {
        state.settings.morning = v('morning') || '07:00';
        state.settings.afternoon = v('afternoon') || '15:00';
        state.settings.night = v('night') || '23:00';
        save(); render();
        toast('Horarios base guardados.');
        break;
      }

      case 'compania': {
        state.settings.momentsEnabled = fd.has('momentsEnabled');
        const times = v('momentTimes').split(',').map(x => x.trim()).filter(x => /^\d{1,2}:\d{2}$/.test(x));
        state.settings.momentTimes = times.length ? times.map(x => x.length === 4 ? '0' + x : x) : ['09:30', '13:30', '17:00', '20:30'];
        save(); render();
        toast('Momentos configurados.');
        break;
      }

      case 'medication': {
        const schedule = [];
        const times = formList(fd, 'slot_time');
        const amounts = formList(fd, 'slot_amount');
        const doses = formList(fd, 'slot_dose');
        times.forEach((time, i) => {
          if (time && amounts[i]) schedule.push({ time, amount: amounts[i], dose: doses[i] || '' });
        });
        if (!v('name')) { toast('Escribe el nombre del medicamento.'); return; }
        if (!schedule.length) { toast('Agrega al menos un horario con cantidad.'); return; }
        const id = v('id') || uid('med');
        const med = {
          id,
          name: v('name'),
          strength: v('strength'),
          form: v('form'),
          doseLabel: v('doseLabel'),
          schedule,
          start: v('start') || todayISO(),
          durationDays: n('durationDays'),
          quantity: n('quantity'),
          unit: v('unit') || 'unidades',
          instructions: v('instructions'),
          source: v('source'),
          notes: v('notes'),
          warning: fd.get('warning') === 'on',
          active: fd.has('active')
        };
        const existing = findMed(id);
        if (existing) Object.assign(existing, med);
        else state.medications.push(med);
        save(); closeModal(); render();
        toast(existing ? 'Medicamento actualizado.' : 'Medicamento agregado.');
        break;
      }

      case 'appointment': {
        const id = v('id') || uid('appt');
        const appt = {
          id,
          type: v('type') || 'Cita',
          title: v('title') || v('type') || 'Cita',
          date: v('date'),
          time: v('time'),
          place: v('place'),
          phone: v('phone'),
          status: v('status') || 'por agendar',
          remind: n('remind', -1),
          notes: v('notes')
        };
        /* Si ya tiene fecha, no tiene sentido dejarla como «por agendar».
           Si se borra la fecha, vuelve a quedar pendiente de agendar. */
        if (appt.date && appt.status === 'por agendar') appt.status = 'agendada';
        if (!appt.date && appt.status === 'agendada') appt.status = 'por agendar';
        const existing = findAppt(id);
        if (existing) Object.assign(existing, appt);
        else state.appointments.push(appt);
        if (appt.date) {
          ui.agendaDate = appt.date;
          ui.agendaMonth = appt.date.slice(0, 7);
        }
        save(); closeModal(); render();
        toast(existing ? 'Cita actualizada.' : 'Cita agregada.');
        break;
      }

      case 'event': {
        const id = v('id') || uid('evt');
        const title = v('title');
        const date = v('date');
        if (!title) { toast('Escribe qué quieres recordar.'); return; }
        if (!date) { toast('Elige una fecha para el recordatorio.'); return; }
        const existing = findEvent(id);
        const repeat = v('repeat') || 'none';
        const ev = {
          id,
          title,
          type: v('type') || 'Recordatorio',
          date,
          time: v('time'),
          repeat,
          repeatUntil: repeat === 'none' ? '' : v('repeatUntil'),
          alarm: n('alarm', -1),
          duration: n('duration', 30),
          place: v('place'),
          notes: v('notes'),
          createdAt: existing ? existing.createdAt : nowISO(),
          updatedAt: nowISO()
        };
        if (existing) Object.assign(existing, ev);
        else state.events.push(ev);
        ui.agendaDate = date;
        ui.agendaMonth = date.slice(0, 7);
        save(); closeModal(); render();
        toast(existing ? 'Recordatorio actualizado.' : 'Recordatorio guardado en tu agenda.');
        break;
      }

      case 'agenda-quick': {
        const text = v('quick');
        if (!text) { toast('Escribe qué quieres recordar.'); return; }
        agendaQuickAdd(text, v('base') || ui.agendaDate || todayISO());
        break;
      }

      case 'personal': {
        const personal = {};
        PERSONAL_FIELDS.forEach(f => { personal[f.key] = v(f.key); });
        state.personal = Object.assign({}, state.personal, personal);
        state.settings.personalUpdatedAt = nowISO();
        save(); render();
        toast('Tu historia quedó guardada. Yasmin la va a tener en cuenta.');
        break;
      }

      case 'yasmin-settings': {
        state.settings.yasminName = v('yasminName') || 'Yasmin';
        state.settings.yasminTone = ['cercano', 'suave', 'directo'].includes(v('tone')) ? v('tone') : 'cercano';
        state.settings.yasminRead = fd.has('yasminRead');
        state.settings.feEnabled = fd.has('feEnabled');
        state.settings.yasminVoice = v('yasminVoice') || '';
        save(); render();
        toast('Yasmin actualizada. Así te va a hablar desde ahora.');
        break;
      }

      case 'memory': {
        const text = v('text');
        if (!text) { toast('Escribe algo que quieras que recuerde.'); return; }
        memoryAdd({ kind: v('kind') || 'nota', text, source: 'manual' });
        render();
        toast('Lo voy a recordar. Puedes borrarlo cuando quieras.');
        break;
      }

      case 'contact': {
        const id = v('id') || uid('contact');
        const contact = { id, name: v('name'), role: v('role'), phone: v('phone'), notes: v('notes') };
        if (!contact.name) { toast('Escribe un nombre.'); return; }
        const existing = findContact(id);
        if (existing) Object.assign(existing, contact);
        else state.contacts.push(contact);
        save(); closeModal(); render();
        toast(existing ? 'Contacto actualizado.' : 'Contacto agregado.');
        break;
      }

      case 'note': {
        const id = v('id') || uid('nota');
        const nota = {
          id,
          title: v('title') || 'Sin título',
          text: v('text') || '',
          date: v('date') || todayISO(),
          createdAt: (state.notas.find(n => n.id === id) || {}).createdAt || nowISO(),
          updatedAt: nowISO()
        };
        const existing = state.notas.find(n => n.id === id);
        if (existing) Object.assign(existing, nota);
        else state.notas.push(nota);
        save(); closeModal(); render();
        toast(existing ? 'Nota actualizada.' : 'Guardada en tu cuaderno. Aquí queda, cuando la necesites.');
        break;
      }

      case 'pendiente': {
        const text = v('text');
        if (!text) return;
        state.pendientes.push({ id: uid('pen'), text, date: v('date') || todayISO(), done: false, doneAt: '' });
        save(); render();
        toast('Anotado. Ya no lo tienes que recordar tú.');
        break;
      }

      case 'letter': {
        const id = v('id') || uid('letter');
        const text = v('text');
        if (!text) { toast('Escribe tu carta.'); return; }
        const letter = { id, title: v('title') || 'Mi carta', text, date: todayISO() };
        const existing = state.letters.find(l => l.id === id);
        if (existing) Object.assign(existing, letter);
        else state.letters.push(letter);
        save(); closeModal(); render();
        toast(existing ? 'Carta actualizada.' : 'Carta guardada.');
        break;
      }

      case 'momento': {
        const id = v('id') || uid('momento');
        const texto = v('text');
        const fileInput = form.querySelector('input[type="file"]');
        const file = fileInput && fileInput.files ? fileInput.files[0] : null;
        if (!texto && !file) { toast('Escribe una frase o elige una foto.'); return; }
        let photoId = null;
        const existing = state.momentos.find(m => m.id === id);
        if (existing) photoId = existing.photoId || null;
        if (file) {
          if (file.size > 12 * 1024 * 1024) { toast('La foto es muy pesada (máximo 12 MB).'); return; }
          const dataUrl = await comprimirImagen(file);
          const nuevoId = 'ph_' + id;
          await fotoGuardar(nuevoId, dataUrl);
          photoId = nuevoId;
        }
        const momento = {
          id,
          from: v('from') || 'Familia',
          relation: v('relation'),
          text: texto,
          date: v('date') || todayISO(),
          photoId,
          seen: existing ? existing.seen || [] : []
        };
        if (existing) Object.assign(existing, momento);
        else state.momentos.push(momento);
        save(); closeModal(); cerrarMomento(); render();
        toast(existing ? 'Momento actualizado.' : 'Momento guardado. Ya está en su espacio.');
        break;
      }

      case 'effect': {
        const symptom = v('symptom');
        if (!symptom) { toast('Escribe qué molestia sentiste.'); return; }
        state.sideEffects.push({
          id: uid('fx'),
          date: v('date') || todayISO(),
          symptom,
          severity: n('severity', 5),
          notes: v('notes'),
          at: nowISO()
        });
        save(); closeModal(); render();
        toast('Efecto registrado para la consulta.');
        break;
      }

      case 'question': {
        const newQuestions = lines(v('questions'));
        if (!newQuestions.length) { toast('Escribe al menos una pregunta.'); return; }
        state.questions.push(...newQuestions);
        save(); closeModal(); render();
        toast(newQuestions.length === 1 ? 'Pregunta agregada.' : 'Preguntas agregadas.');
        break;
      }

      case 'exercise': {
        const id = v('id');
        const ex = state.exercises.find(e => e.id === id);
        if (!ex) { toast('No se encontró el ejercicio.'); return; }
        const day = ensureDay(todayISO());
        const log = {
          done: true,
          at: nowISO(),
          painBefore: n('painBefore'),
          painAfter: n('painAfter'),
          reps: v('reps'),
          notes: v('notes'),
          durationSec: n('durationSec', 0) || 0
        };
        day.exercises[id] = log;
        day.care = Object.assign({}, careFor(todayISO()), { movement: true });
        save(); closeModal(); render();
        if (log.painAfter != null && log.painBefore != null && log.painAfter >= log.painBefore + 2) {
          toast('Quedó registrado. Si el dolor aumentó, suspende este ejercicio y consulta.');
        } else {
          toast('Sesión registrada. La constancia es el logro.');
        }
        break;
      }

      case 'skip-dose': {
        const date = v('date') || ui.pendingSkip?.date || todayISO();
        const key = v('key') || ui.pendingSkip?.key;
        if (!key) { toast('No se encontró la dosis.'); return; }
        const reason = v('reason') || 'Sin motivo registrado';
        const detail = v('detail');
        setDose(date, key, 'skipped', { reason: detail ? `${reason}: ${detail}` : reason });
        ui.pendingSkip = null;
        save(); closeModal(); render();
        toast('Dosis omitida. No tomes el doble; consulta si tienes dudas.');
        break;
      }

      case 'prep': {
        const appt = findAppt(v('id'));
        if (appt) {
          appt.prep = v('prep');
          appt.prepAt = nowISO();
          save(); closeModal(); render();
          toast('Preparación guardada.');
        }
        break;
      }

      case 'pin': {
        const pin1 = v('newPin');
        const pin2 = v('confirmPin');
        if (pin1.length < 4) { toast('El PIN debe tener al menos 4 caracteres.'); return; }
        if (pin1 !== pin2) { toast('Los PIN no coinciden. Intenta de nuevo.'); return; }
        if (state.settings.pinHash) {
          const currentHash = await sha256(v('current'));
          if (currentHash !== state.settings.pinHash) { toast('El PIN actual no es correcto.'); return; }
        }
        state.settings.pinHash = await sha256(pin1);
        locked = false;
        save(); closeModal(); render();
        toast('PIN configurado. No lo compartas.');
        break;
      }

      case 'remove-pin': {
        const currentHash = await sha256(v('current'));
        if (currentHash !== state.settings.pinHash) { toast('El PIN no es correcto.'); return; }
        state.settings.pinHash = null;
        locked = false;
        save(); closeModal(); render();
        toast('PIN eliminado. Andrea quedará sin bloqueo.');
        break;
      }

      default:
        console.warn('Formulario sin manejador:', kind);
    }
  } catch (error) {
    console.error(error);
    toast('No se pudo guardar. Revisa los datos e intenta otra vez.');
  }
}

/* ---------- acciones por clic ---------- */
function handleClick(event) {
  const target = event.target.closest('[data-action]');
  const insideModal = event.target.closest('#modal-root');
  if (!target) {
    if (insideModal && event.target.id === 'modal-backdrop') closeModal();
    return;
  }

  const action = target.dataset.action;
  if (action === 'import-file') return;
  if (action === 'select-date' && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;

  event.preventDefault();
  const today = todayISO();

  switch (action) {
    case 'nav':
      navigate(target.dataset.id);
      break;

    case 'open-menu':
      openMenuModal();
      break;

    case 'close-modal':
      closeModal();
      break;

    case 'open-yasmin':
      closeModal();
      navigate('yasmin');
      setTimeout(() => { const t = $('#chat-text'); if (t) t.focus(); }, 180);
      break;

    case 'fe-otra-frase':
      ui.feOffset = ((ui.feOffset || 0) + 1) % 17;
      {
        const respuesta = yasminFraseReply();
        yasminGuardar('yasmin', respuesta.text);
        ui.chatChips = respuesta.chips || [];
        renderChatLog();
        renderChatChips(ui.chatChips);
      }
      break;

    case 'cerrar-dedicatoria':
      closeModal();
      render();
      break;

    case 'hablar-frase': {
      closeModal();
      navigate('yasmin');
      setTimeout(() => yasminEnviar('Cuéntame de mi frase de hoy'), 220);
      break;
    }

    case 'yasmin-sugerencia':
      navigate('yasmin');
      setTimeout(() => yasminSugerencia(), 120);
      break;

    case 'yasmin-chip':
      yasminEnviar(target.dataset.text || target.textContent || '');
      break;

    case 'yasmin-limpiar': {
      if (!confirm('¿Borrar la conversación? Las demás cosas quedan intactas.')) return;
      state.chat = [];
      save(); render();
      toast('Conversación borrada.');
      break;
    }

    case 'llamar': {
      const destino = target.dataset.id || '';
      if (destino) window.location.href = destino;
      break;
    }

    case 'respirar':
      closeModal();
      openBreathingModal();
      break;

    case 'ir-red': {
      closeModal();
      if (route !== 'seguridad') navigate('seguridad');
      setTimeout(() => {
        const destino = document.getElementById('mi-red');
        if (destino) destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 160);
      break;
    }

    case 'focus-checkin':
      navigate('registro');
      setTimeout(() => {
        const first = $('#view input[type="range"]');
        if (first) first.focus();
        else $('#view')?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
      break;

    case 'crisis':
      openCrisisModal(false);
      break;

    case 'log-crisis': {
      const day = ensureDay(today);
      day.checkin = Object.assign({}, day.checkin || {}, { suicidal: 'si', at: nowISO() });
      day.traffic = 'red';
      save(); closeModal(); render();
      toast('Registrado. Si el riesgo sigue, llama al 123 o ve a urgencias.');
      break;
    }

    case 'minimum':
      openMinimumModal();
      break;

    case 'minimum-dose': {
      setDose(today, target.dataset.key, 'taken');
      save(); render();
      openMinimumModal();
      toast('Una cosa hecha. Suficiente por ahora.');
      break;
    }

    case 'traffic': {
      const day = ensureDay(today);
      day.traffic = target.dataset.value;
      save(); render();
      if (day.traffic === 'red') {
        toast('Hoy necesitas apoyo. No te quedes sola: abre tu plan.');
      } else if (day.traffic === 'green') {
        toast('Qué bueno, Andrea. Guarda qué hizo bueno el día en «Lo bueno de hoy».');
      }
      break;
    }

    case 'allergies-none': {
      const campo = document.getElementById('f-allergies');
      if (campo) campo.value = 'Ninguna que sepa';
      break;
    }

    case 'allergies-unknown': {
      const campo = document.getElementById('f-allergies');
      if (campo) campo.value = 'Por confirmar con el equipo de salud';
      break;
    }

    case 'foto-yasmin-cambiar':
    case 'foto-andrea-cambiar': {
      const esYasmin = target.dataset.action === 'foto-yasmin-cambiar';
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files && input.files[0];
        if (!file) return;
        try {
          const dataUrl = await comprimirImagen(file, 360, 0.82);
          await fotoGuardar(esYasmin ? 'foto-yasmin' : 'foto-andrea', dataUrl);
          if (esYasmin) state.settings.yasminFoto = true;
          else state.profile.foto = true;
          save(); render();
          toast(esYasmin ? 'Yasmin ya tiene su foto. Queda guardada solo en este dispositivo.' : 'Tu foto quedó guardada. Solo en este dispositivo.');
        } catch (e) {
          toast('No se pudo guardar la foto en este dispositivo.');
        }
      };
      input.click();
      break;
    }

    case 'foto-yasmin-quitar':
    case 'foto-andrea-quitar': {
      const esYasmin = target.dataset.action === 'foto-yasmin-quitar';
      if (!confirm('¿Quitar esta foto? Se borra de este dispositivo.')) return;
      fotoBorrar(esYasmin ? 'foto-yasmin' : 'foto-andrea').then(() => {
        if (esYasmin) state.settings.yasminFoto = false;
        else state.profile.foto = false;
        save(); render();
        toast('Foto quitada.');
      });
      break;
    }

    case 'fe-otra': {
      ui.feOffset = ((ui.feOffset || 0) + 1) % 14;
      render();
      break;
    }

    case 'toggle-fe': {
      state.settings.feEnabled = state.settings.feEnabled === false;
      save(); render();
      toast(state.settings.feEnabled ? 'Tu momentito de fe volvió a Hoy.' : 'Listo. Lo puedes volver a activar en Ajustes.');
      break;
    }

    case 'med-tab':
      ui.medTab = target.dataset.value;
      render();
      break;

    case 'filter-exercises':
      ui.exerciseFilter = target.dataset.value;
      render();
      break;

    case 'report-days':
      ui.reportDays = Number(target.dataset.value) || 14;
      render();
      break;

    case 'next-prompt':
      ui.promptIndex = (ui.promptIndex + 1) % PROMPTS.length;
      render();
      break;

    case 'micro-done': {
      const day = ensureDay(today);
      day.micro = !day.micro;
      save(); render();
      toast(day.micro ? 'Un paso pequeño también es un paso.' : 'Puedes retomarlo después.');
      break;
    }

    case 'micro-next':
      ui.microOffset = (ui.microOffset + 1) % MICRO_STEPS.length;
      render();
      break;

    case 'checklist-toggle': {
      const date = target.dataset.date || today;
      const key = target.dataset.key || target.dataset.id;
      if (!key) return;
      const now = !careFor(date)[key];
      setCare(date, key, now);
      render();
      if (now) toast(key === 'connection' ? 'Pedir compañía también es cuidarte.' : 'Una cosa más de hoy. Bien.');
      break;
    }

    case 'toggle-yasmin-learn': {
      state.settings.yasminLearn = state.settings.yasminLearn === false;
      save(); render();
      toast(state.settings.yasminLearn ? 'Yasmin va a aprender de lo que le cuentes.' : 'Yasmin no guardará cosas nuevas de la conversación. Lo que ya sabía sigue ahí hasta que lo borres.');
      break;
    }

    case 'delete-fact': {
      if (!confirm('¿Borrar esta nota de la memoria de Yasmin?')) return;
      memoryRemove(target.dataset.id);
      render();
      toast('Nota borrada.');
      break;
    }

    case 'clear-facts': {
      if (!confirm('Esto borra todas las notas que Yasmin aprendió de ti. La conversación y tus registros quedan intactos. ¿Continuar?')) return;
      memoryClear();
      render();
      toast('Memoria borrada. Yasmin vuelve a conocerte desde lo que está en Mi historia.');
      break;
    }

    case 'toggle-dose': {
      const date = target.dataset.date || today;
      const key = target.dataset.key || target.dataset.id;
      if (!key) return;
      const status = doseStatus(date, key);
      if (status === 'taken') setDose(date, key, 'pending');
      else setDose(date, key, 'taken');
      save(); render();
      break;
    }

    case 'skip-dose': {
      const date = target.dataset.date || today;
      const key = target.dataset.key || target.dataset.id;
      ui.pendingSkip = { date, key };
      openSkipModal(date, key);
      break;
    }

    case 'undo-dose': {
      const day = ensureDay(target.dataset.date || today);
      delete day.meds[target.dataset.key];
      save(); render();
      break;
    }

    case 'add-effect':
      openEffectModal();
      break;

    case 'delete-effect': {
      if (!confirm('¿Quitar este registro de efectos?')) return;
      state.sideEffects = state.sideEffects.filter(e => e.id !== target.dataset.id);
      save(); render();
      toast('Registro eliminado.');
      break;
    }

    case 'add-med':
      openMedicationModal(null);
      break;

    case 'edit-med':
      openMedicationModal(target.dataset.id);
      break;

    case 'toggle-med': {
      const med = findMed(target.dataset.id);
      if (!med) return;
      med.active = med.active === false;
      save(); render();
      toast(med.active ? 'Medicamento activo.' : 'Medicamento desactivado. No suspendas sin hablar con psiquiatría.');
      break;
    }

    case 'view-agenda':
      navigate('agenda');
      break;

    case 'agenda-select': {
      const date = target.dataset.date || today;
      ui.agendaDate = date;
      ui.agendaMonth = date.slice(0, 7);
      render();
      setTimeout(() => {
        const title = document.getElementById('agenda-day-title');
        if (title) title.focus({ preventScroll: true });
      }, 60);
      break;
    }

    case 'agenda-month': {
      const delta = Number(target.dataset.value) || 0;
      const base = parseISO(`${ui.agendaMonth || today.slice(0, 7)}-01`);
      if (!base) break;
      base.setMonth(base.getMonth() + delta);
      ui.agendaMonth = `${base.getFullYear()}-${pad(base.getMonth() + 1)}`;
      ui.agendaDate = `${ui.agendaMonth}-01`;
      render();
      break;
    }

    case 'agenda-today':
      ui.agendaMonth = today.slice(0, 7);
      ui.agendaDate = today;
      render();
      setTimeout(() => {
        const title = document.getElementById('agenda-day-title');
        if (title) title.focus({ preventScroll: true });
      }, 60);
      break;

    case 'agenda-filter':
      ui.agendaFilter = target.dataset.value || 'todo';
      render();
      break;

    case 'add-event':
      openEventModal(null, { date: target.dataset.date || ui.agendaDate || today });
      break;

    case 'edit-event':
      openEventModal(target.dataset.id);
      break;

    case 'delete-event': {
      const ev = findEvent(target.dataset.id);
      if (!ev) return;
      if (!confirm(`¿Eliminar «${ev.title}» de tu agenda? No se puede deshacer.`)) return;
      state.events = state.events.filter(x => x.id !== ev.id);
      Object.keys(state.agendaDone || {}).forEach(key => {
        if (key.startsWith(ev.id + '@')) delete state.agendaDone[key];
      });
      save(); closeModal(); render();
      toast('Recordatorio eliminado.');
      break;
    }

    case 'toggle-event-done': {
      const ev = findEvent(target.dataset.id);
      if (!ev) return;
      const date = target.dataset.date || today;
      const done = isEventDone(ev, date);
      setEventDone(ev, date, !done);
      render();
      toast(!done ? 'Hecho. Un pendiente menos.' : 'Volvió a quedar pendiente.');
      break;
    }

    case 'quick-add':
      openQuickAddModal(target.dataset.date || (/^\d{4}-\d{2}-\d{2}$/.test(target.dataset.id || '') ? target.dataset.id : '') || ui.agendaDate || today);
      break;

    case 'quick-example':
      quickExample(target.dataset.value || target.textContent || '');
      break;

    case 'yasmin-event': {
      const draft = ui.yasminEventDraft;
      if (!draft) { openQuickAddModal(ui.agendaDate || today); break; }
      openEventModal(null, Object.assign({}, draft, { parsedFrom: draft.parsedFrom || '', parsedSummary: draft.parsedSummary || '' }));
      break;
    }

    case 'yasmin-leer':
      yasminLeerUltimo();
      break;

    case 'app-update': {
      if (!('serviceWorker' in navigator)) { toast('Este navegador no se actualiza solo: reinstala la app.'); return; }
      toast('Buscando la versión nueva…');
      navigator.serviceWorker.getRegistration().then(reg => {
        if (!reg) { toast('Ya estás al día. No hay versión nueva.'); return; }
        reg.update().catch(() => {}).then(() => {
          const esperando = reg.waiting || null;
          if (esperando) {
            esperando.postMessage({ type: 'ANDREA_ACTUALIZAR' });
            toast('Aplicando la versión nueva… la pantalla se refresca sola.');
          } else {
            toast('Ya estás al día. No hay versión nueva.');
          }
        });
      }).catch(() => toast('No se pudo buscar la actualización.'));
      break;
    }

    case 'yasmin-probar-voz':
      if (!yasminVozSoportada()) { toast('Este teléfono no tiene voz integrada. Prueba en Chrome.'); return; }
      yasminLeer('Hola, soy Yasmin. Así te voy a acompañar. Si no te gusta, elige otra voz aquí mismo.');
      break;

    case 'yasmin-microfono':
      yasminEscuchar();
      break;

    case 'yasmin-detener-voz':
      yasminDetenerVoz();
      break;

    case 'yasmin-toggle-read':
      state.settings.yasminRead = !state.settings.yasminRead;
      save(); render();
      toast(state.settings.yasminRead ? 'Yasmin leerá sus respuestas en voz alta.' : 'Lectura en voz alta desactivada.');
      break;

    case 'download-ics':
      downloadICS(false);
      break;

    case 'download-ics-discreet':
      downloadICS(true);
      break;

    case 'download-momentos-ics':
      downloadMomentosICS();
      break;

    case 'enable-notifications':
      enableNotifications();
      break;

    case 'test-notification':
      testNotification();
      break;

    case 'instalar-app':
      instalarApp();
      break;

    case 'open-exercise':
      openExerciseModal(target.dataset.id);
      break;

    case 'mark-exercise': {
      const id = target.dataset.id;
      const day = ensureDay(today);
      day.exercises[id] = { done: true, at: nowISO() };
      save(); render();
      toast('Ejercicio marcado. Hazlo a tu ritmo.');
      break;
    }

    case 'undo-exercise': {
      const day = ensureDay(today);
      delete day.exercises[target.dataset.id];
      save(); render();
      break;
    }

    case 'select-date':
      if (target.dataset.value) ui.selectedDate = target.dataset.value;
      render();
      break;

    case 'view-journal': {
      const day = findDay(target.dataset.value);
      openModal({
        title: formatLongDate(target.dataset.value),
        body: day?.journal?.text
          ? `<p class="small">${nl2br(day.journal.text)}</p><p class="tiny muted">Guardado ${day.journal.at ? 'a las ' + new Date(day.journal.at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}</p>`
          : '<p class="small muted">No hay reflexión guardada para este día.</p>',
        footer: '<button class="btn" data-action="close-modal">Cerrar</button>'
      });
      break;
    }

    case 'add-appt':
      openAppointmentModal(null);
      break;

    case 'edit-appt':
      openAppointmentModal(target.dataset.id);
      break;

    case 'delete-appt': {
      if (!confirm('¿Eliminar esta cita? No se puede deshacer.')) return;
      state.appointments = state.appointments.filter(a => a.id !== target.dataset.id);
      save(); closeModal(); render();
      toast('Cita eliminada.');
      break;
    }

    case 'prepare-appt':
      openPrepareModal(target.dataset.id);
      break;

    case 'add-contact':
      openContactModal(null);
      break;

    case 'edit-contact':
      openContactModal(target.dataset.id);
      break;

    case 'delete-contact': {
      if (!confirm('¿Eliminar este contacto de tu red?')) return;
      state.contacts = state.contacts.filter(c => c.id !== target.dataset.id);
      save(); closeModal(); render();
      toast('Contacto eliminado.');
      break;
    }

    case 'cuaderno-tab':
      ui.cuadernoTab = target.dataset.value;
      render();
      break;

    case 'add-note':
      openNoteModal(null);
      break;

    case 'edit-note':
      openNoteModal(target.dataset.id);
      break;

    case 'delete-note': {
      if (!confirm('¿Borrar esta nota del cuaderno? No se puede deshacer.')) return;
      state.notas = (state.notas || []).filter(n => n.id !== target.dataset.id);
      save(); render();
      toast('Nota borrada.');
      break;
    }

    case 'delete-pendiente': {
      state.pendientes = (state.pendientes || []).filter(x => x.id !== target.dataset.id);
      save(); render();
      break;
    }

    case 'toggle-pendiente': {
      const pen = (state.pendientes || []).find(x => x.id === target.dataset.id);
      if (!pen) return;
      pen.done = !pen.done;
      pen.doneAt = pen.done ? nowISO() : '';
      save(); render();
      if (pen.done) toast('Hecho. Una cosa menos en la cabeza.');
      break;
    }

    case 'add-letter':
      openLetterModal(null);
      break;

    case 'edit-letter':
      openLetterModal(target.dataset.id);
      break;

    case 'delete-letter': {
      if (!confirm('¿Eliminar esta carta?')) return;
      state.letters = state.letters.filter(l => l.id !== target.dataset.id);
      save(); render();
      toast('Carta eliminada.');
      break;
    }

    case 'add-question':
      openQuestionModal();
      break;

    case 'delete-question': {
      const index = Number(target.dataset.index);
      if (!Number.isInteger(index) || index < 0 || index >= state.questions.length) return;
      state.questions.splice(index, 1);
      save(); render(); openQuestionModal();
      toast('Pregunta eliminada.');
      break;
    }

    case 'copy-questions': {
      const text = state.questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
      if (!text) { toast('Aún no hay preguntas.'); return; }
      copyText(text);
      break;
    }

    case 'add-momento':
      openMomentoModal(null);
      break;

    case 'edit-momento':
      cerrarMomento();
      openMomentoModal(target.dataset.id);
      break;

    case 'delete-momento': {
      if (!confirm('¿Eliminar este momento? La foto también se borra de este dispositivo.')) return;
      const m = state.momentos.find(x => x.id === target.dataset.id);
      if (m && m.photoId) fotoBorrar(m.photoId);
      state.momentos = state.momentos.filter(x => x.id !== target.dataset.id);
      save(); closeModal(); cerrarMomento(); render();
      toast('Momento eliminado.');
      break;
    }

    case 'abrir-momento':
      abrirMomento(target.dataset.id);
      break;

    case 'cerrar-momento':
      cerrarMomento();
      break;

    case 'otro-momento':
      otroMomento();
      break;

    case 'momento-sorpresa':
      closeModal();
      momentoSorpresa();
      break;

    case 'induccion-siguiente':
      induccionStep = Math.min(induccionStep + 1, INDUCCION.length - 1);
      renderInduccion();
      break;

    case 'induccion-atras':
      induccionStep = Math.max(induccionStep - 1, 0);
      renderInduccion();
      break;

    case 'induccion-fin':
      cerrarInduccion();
      render();
      break;

    case 'induccion-pin':
      cerrarInduccion();
      render();
      openPinModal();
      break;

    case 'reiniciar-induccion':
      abrirInduccion(true);
      break;

    case 'set-pin':
      openPinModal();
      break;

    case 'remove-pin':
      openRemovePinModal();
      break;

    case 'toggle-discreet':
      state.settings.discreet = !state.settings.discreet;
      save(); render();
      toast(state.settings.discreet ? 'Modo discreto activado.' : 'Modo discreto desactivado.');
      break;

    case 'lock':
      closeModal();
      lockNow();
      break;

    case 'apply-times':
      applyBaseTimes();
      break;

    case 'print':
      window.print();
      break;

    case 'print-report':
      navigate('reporte');
      setTimeout(() => window.print(), 260);
      break;

    case 'export-json':
      exportJSON();
      break;

    case 'import-json': {
      const input = $('#import-file');
      if (input) input.click();
      break;
    }

    case 'reset-all':
      resetAll();
      break;

    case 'load-seed':
      loadSeed();
      break;

    case 'add-schedule-row': {
      const rows = $('#schedule-rows');
      if (rows) rows.insertAdjacentHTML('beforeend', scheduleRowHtml(state.settings.afternoon, '', ''));
      break;
    }

    case 'remove-schedule-row': {
      const row = target.closest('[data-schedule-row]');
      const rows = $('#schedule-rows');
      if (!row || !rows) return;
      if (rows.querySelectorAll('[data-schedule-row]').length <= 1) {
        row.querySelectorAll('input').forEach(input => { input.value = ''; });
        return;
      }
      row.remove();
      break;
    }

    case 'start-timer': {
      if (ui.exerciseTimer) {
        clearInterval(ui.exerciseTimer);
        ui.exerciseTimer = null;
        target.textContent = 'Continuar';
        return;
      }
      const label = $('#exercise-timer');
      const hidden = $('#exercise-duration');
      let seconds = Number(hidden?.value || 0) || 0;
      target.textContent = 'Pausar';
      ui.exerciseTimer = setInterval(() => {
        seconds++;
        if (hidden) hidden.value = seconds;
        if (label) label.textContent = formatDuration(seconds);
      }, 1000);
      break;
    }

    case 'start-breathing':
      startBreathing();
      break;

    case 'stop-breathing':
      stopBreathing();
      break;

    default:
      console.warn('Acción sin manejador:', action);
  }
}

/* ---------- cambios e inputs ---------- */
function handleChange(event) {
  const target = event.target;
  if (target.matches('[data-action="select-date"]')) {
    ui.selectedDate = target.value || todayISO();
    render();
    return;
  }
  if (target.matches('[data-action="import-file"]')) {
    const file = target.files && target.files[0];
    if (file) importJSON(file);
    target.value = '';
  }
}

function handleInput(event) {
  const target = event.target;
  if (target.matches('[data-range]')) {
    const label = $(`[data-range-label="${target.dataset.range}"]`);
    if (label) label.textContent = target.value;
  }
  if (target.id === 'chat-text') {
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 130) + 'px';
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    if ($('#momento-root .momento-full')) { cerrarMomento(); return; }
    const modal = $('#modal-root .modal');
    if (modal) closeModal();
  }
  if (event.key === 'Tab') {
    const modal = $('#modal-root .modal');
    if (!modal) return;
    const focusables = $$('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', modal)
      .filter(el => el.offsetParent !== null);
    if (!focusables.length) { event.preventDefault(); modal.focus(); return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!modal.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  if (event.key === 'Enter' && !event.shiftKey && event.target.id === 'chat-text') {
    event.preventDefault();
    const form = event.target.closest('form');
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => toast('Preguntas copiadas.'))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try { document.execCommand('copy'); toast('Preguntas copiadas.'); }
  catch (e) { toast('No se pudo copiar. Selecciona y copia manualmente.'); }
  area.remove();
}

function applyBaseTimes() {
  if (!confirm('Esto cambiará los horarios 07:00, 15:00 y 23:00 de todos los medicamentos por tus horarios base. ¿Continuar?')) return;
  const map = { '07:00': state.settings.morning, '15:00': state.settings.afternoon, '23:00': state.settings.night };
  state.medications.forEach(med => {
    (med.schedule || []).forEach(slot => {
      if (map[slot.time]) slot.time = map[slot.time];
    });
  });
  save(); render();
  toast('Horarios actualizados. Revisa que no se hayan cruzado tomas.');
}

/* ---------- respiración ---------- */
function stopBreathing() {
  if (ui.breathingTimer) {
    clearInterval(ui.breathingTimer);
    ui.breathingTimer = null;
  }
  const circle = $('#breath-circle');
  const label = $('#breath-label');
  if (circle) circle.className = 'breath-circle';
  if (circle) circle.textContent = 'Respira';
  if (label) label.textContent = 'Inhala 4 · sostén 4 · exhala 6';
}

function startBreathing() {
  stopBreathing();
  const circle = $('#breath-circle');
  const label = $('#breath-label');
  if (!circle || !label) return;
  const durations = [4, 4, 6];
  const names = ['Inhala', 'Sostén', 'Exhala'];
  let phase = 0;
  let remaining = durations[phase];
  const paint = () => {
    circle.className = 'breath-circle ' + (phase === 0 ? 'inhale' : phase === 2 ? 'exhale' : '');
    circle.textContent = names[phase];
    label.textContent = `${names[phase]} · ${remaining}`;
  };
  paint();
  ui.breathingTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      phase = (phase + 1) % 3;
      remaining = durations[phase];
    }
    paint();
  }, 1000);
}

function openBreathingModal() {
  const body = `
    <p class="small">Sigue el círculo. No tienes que hacerlo perfecto: solo acompañar la respiración.</p>
    <div class="breath-box">
      <div class="breath-circle" id="breath-circle">Respira</div>
      <div class="small" id="breath-label">Inhala 4 · sostén 4 · exhala 6</div>
      <div class="row">
        <button class="btn small primary" type="button" data-action="start-breathing">Comenzar</button>
        <button class="btn small ghost" type="button" data-action="stop-breathing">Detener</button>
      </div>
    </div>
    <p class="tiny muted">Si al terminar sigues con el pecho apretado, escríbele a Yasmin o llama a alguien. No tienes que poder sola.</p>`;
  openModal({
    title: 'Respirar conmigo',
    body,
    footer: '<button class="btn danger" data-action="crisis">Necesito ayuda ahora</button><button class="btn" data-action="close-modal">Cerrar</button>'
  });
  setTimeout(startBreathing, 260);
}

/* ---------- modales de contenido ---------- */
function openMenuModal() {
  const body = `
    <div class="menu-grid">
      ${NAV.map(item => `<button class="menu-item" data-action="nav" data-id="${item.id}">${icon(item.icon, 20)}<span>${item.label}</span></button>`).join('')}
    </div>
    <div class="divider"></div>
    <div class="row">
      <button class="btn danger small" data-action="crisis">No estoy bien</button>
      <button class="btn small" data-action="lock">Bloquear</button>
    </div>`;
  openModal({ title: 'Ir a', body, footer: '<button class="btn" data-action="close-modal">Cerrar</button>' });
}

function openCrisisModal(fromCheckin = false) {
  const sp = state.safetyPlan || {};
  const contacts = state.contacts.filter(c => c.phone).slice(0, 4);
  const hosp = hospitalContact();
  const steps = (sp.steps || []).slice(0, 5);
  /* No mostrar los textos de ejemplo del plan inicial como si fueran
     razones personales. En una crisis, es mejor ser honesta. */
  const reasons = (sp.reasons || [])
    .filter(r => r && !/^escribir aquí|^una razón puede ser/i.test(String(r).trim()))
    .slice(0, 3);
  const body = `
    <div class="crisis-box" style="margin-bottom:14px">
      <h3>${fromCheckin ? 'Gracias por decirlo.' : 'Estoy contigo.'}</h3>
      <p>${fromCheckin
        ? 'Registraste pensamientos de muerte o de hacerte daño. Eso merece atención ahora, no después. Si hay un plan, una intención o ya te hiciste daño: llama al 123 o ve a urgencias, y que alguien se quede contigo.'
        : 'Si la cabeza te dice que no vale la pena seguir, eso es el dolor hablando. Si hay peligro inmediato: llama al 123 o ve a urgencias. Mientras llega la ayuda, no te quedes sola y aléjate de lo que te haría daño.'}</p>
    </div>
    <div class="emergency-grid">
      <a class="emergency-btn" href="tel:123"><span class="num">123</span><span>Emergencias</span></a>
      <a class="emergency-btn" href="tel:106"><span class="num">106</span><span>Apoyo psicológico</span></a>
      ${hosp ? `<a class="emergency-btn" href="${phoneHref(hosp.phone)}"><span class="num">${esc((hosp.name || 'Mi hospital').split('·')[0].trim().slice(0, 9))}</span><span>${esc(hosp.role || 'Salud mental')}</span></a>` : `<a class="emergency-btn" href="#mi-red" data-action="ir-red"><span class="num">${icon('phone', 22)}</span><span>Mi red</span></a>`}
    </div>
    ${reasons.length ? `<div class="divider"></div><strong>Tus razones para quedarte</strong><ul class="plan-list" style="margin-top:8px">${reasons.map(r => `<li><span class="n">·</span><span>${esc(r)}</span></li>`).join('')}</ul>` : `<div class="divider"></div><p class="tiny muted">Aún no has escrito tus razones para quedarte. Puedes agregarlas en Seguridad cuando estés con calma; ahora lo importante es que no te quedes sola.</p>`}
    <div class="divider"></div>
    <div class="between"><strong>Respira conmigo</strong><span class="tiny muted">4 · 4 · 6</span></div>
    <div class="breath-box">
      <div class="breath-circle" id="breath-circle">Respira</div>
      <div class="small" id="breath-label">Inhala 4 · sostén 4 · exhala 6</div>
      <div class="row">
        <button class="btn small primary" type="button" data-action="start-breathing">Comenzar</button>
        <button class="btn small ghost" type="button" data-action="stop-breathing">Detener</button>
      </div>
    </div>
    ${steps.length ? `<div class="divider"></div><strong>Pasos, en orden</strong><ol class="plan-list" style="margin-top:8px">${steps.map((s, i) => `<li><span class="n">${i + 1}</span><span>${esc(s)}</span></li>`).join('')}</ol>` : ''}
    ${contacts.length ? `<div class="divider"></div><strong>Personas que te quieren</strong><div class="stack" style="margin-top:8px">${contacts.map(c => `<div class="between"><div><strong style="font-size:.88rem">${esc(c.name)}</strong><div class="tiny muted">${esc(c.role || '')}</div></div><div class="row"><a class="btn tiny" href="${phoneHref(c.phone)}">${icon('phone', 13)} Llamar</a>${waHref(c.phone) ? `<a class="btn tiny ghost" href="${waHref(c.phone)}" target="_blank" rel="noopener" aria-label="WhatsApp a ${esc(c.name)}">${icon('chat', 13)}</a>` : ''}</div></div>`).join('')}</div>` : ''}
    <p class="tiny muted" style="margin-top:14px">No tienes que explicar nada perfectamente. Basta con decir: «No estoy bien, necesito compañía». Pedir ayuda no es fallar.</p>`;
  openModal({
    title: 'Modo compañía',
    body,
    wide: true,
    footer: `
      <button class="btn ghost" data-action="log-crisis">Registrar que necesité ayuda</button>
      <button class="btn primary" data-action="close-modal">Estoy acompañada, cerrar</button>`
  });
}

function openMinimumModal() {
  const today = todayISO();
  const doses = dosesFor(today);
  const pending = doses.filter(d => doseStatus(today, d.key) === 'pending');
  const contacts = state.contacts.filter(c => c.phone).slice(0, 3);
  const body = `
    <p class="small">Hoy no tienes que cumplir el plan completo. Solo esto, si puedes:</p>
    <div class="stack" style="margin-top:12px">
      <div class="minimum-step"><span class="minimum-num">1</span><div><strong>Toma tu medicamento</strong><div class="tiny muted">${doses.length ? `${doses.length - pending.length} de ${doses.length} tomas registradas hoy.` : 'No hay tomas programadas para hoy.'}</div></div></div>
      ${pending.slice(0, 4).map(d => `<div class="between" style="padding-left:38px"><div><strong style="font-size:.86rem">${esc(d.med.name)} ${esc(d.med.strength || '')}</strong><div class="tiny muted">${esc(d.amount)} · ${esc(d.time)}</div></div><button class="btn tiny primary" data-action="minimum-dose" data-key="${esc(d.key)}">Ya la tomé</button></div>`).join('')}
      <div class="minimum-step"><span class="minimum-num">2</span><div><strong>Bebe agua y come algo sencillo</strong><div class="tiny muted">No tiene que ser perfecto. Un vaso y una fruta cuentan.</div></div></div>
      <div class="minimum-step"><span class="minimum-num">3</span><div><strong>Avisa a alguien cómo estás</strong><div class="tiny muted">Un mensaje corto también es pedir compañía.</div></div></div>
      ${contacts.length ? `<div class="row" style="padding-left:38px">${contacts.map(c => `<a class="btn tiny" href="${phoneHref(c.phone)}">${icon('phone', 13)} ${esc(c.name)}</a>`).join('')}</div>` : ''}
    </div>
    <div class="divider"></div>
    <p class="small">Si no puedes ni con esto, no es falta de voluntad: es señal de que necesitas apoyo. Abre tu plan o llama al <strong>106</strong>.</p>`;
  openModal({
    title: 'Modo mínimo',
    body,
    footer: '<button class="btn danger" data-action="crisis">Necesito ayuda ahora</button><button class="btn" data-action="close-modal">Cerrar</button>'
  });
}

function openSkipModal(date, key) {
  const dose = dosesFor(date).find(d => d.key === key);
  if (!dose) { toast('No se encontró la dosis.'); return; }
  const body = `
    <form data-form="skip-dose" class="form-grid">
      <input type="hidden" name="date" value="${esc(date)}">
      <input type="hidden" name="key" value="${esc(key)}">
      <div class="crisis-box" style="background:var(--gold-soft);border-color:#E5CFA3;color:#6B4B12">
        <strong>${esc(dose.med.name)} ${esc(dose.med.strength || '')} · ${esc(dose.time)}</strong>
        <p style="margin:4px 0 0">No tomes el doble para compensar. Si es una dosis crítica o no sabes qué hacer, llama a tu psiquiatra o a la farmacia.</p>
      </div>
      <div>
        <label for="skip-reason">¿Por qué la omitiste?</label>
        <select id="skip-reason" name="reason">
          <option>Se me olvidó</option>
          <option>Me sentí mal</option>
          <option>No tenía el medicamento</option>
          <option>Me lo indicó un profesional</option>
          <option>Decidí no tomarla</option>
          <option>Otro</option>
        </select>
      </div>
      ${textareaField('detail', 'Detalle (opcional)', '', 'Qué pasó, cómo te sentiste, qué harás después')}
      <div class="form-actions">
        <button class="btn primary" type="submit">Registrar omisión</button>
        <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
      </div>
    </form>`;
  openModal({ title: 'Omitir una dosis', body });
}

function scheduleRowHtml(time, amount, dose) {
  return `<div class="schedule-row" data-schedule-row>
    <input type="time" name="slot_time" value="${esc(time || '')}" aria-label="Hora">
    <input type="text" name="slot_amount" value="${esc(amount || '')}" placeholder="Cantidad (2 cápsulas)" aria-label="Cantidad">
    <input type="text" name="slot_dose" value="${esc(dose || '')}" placeholder="Dosis (150 mg)" aria-label="Dosis">
    <button class="icon-btn" type="button" data-action="remove-schedule-row" aria-label="Quitar horario">×</button>
  </div>`;
}

function openMedicationModal(id) {
  const med = id ? findMed(id) : null;
  const s = state.settings;
  const slots = med && med.schedule && med.schedule.length
    ? med.schedule
    : [{ time: s.morning, amount: '', dose: '' }];
  const body = `
    <form data-form="medication" id="med-form" class="form-grid">
      <input type="hidden" name="id" value="${med ? esc(med.id) : ''}">
      ${yasminTip('Escríbelo como está en la caja. Si la dosis cambia algún día, aquí se edita y listo.')}
      <div class="form-grid two">
        <div><label for="med-name">Nombre</label><input id="med-name" name="name" value="${med ? esc(med.name) : ''}" required></div>
        <div><label for="med-strength">Concentración</label><input id="med-strength" name="strength" value="${med ? esc(med.strength) : ''}" placeholder="75 mg"></div>
      </div>
      <div class="form-grid two">
        <div><label for="med-form">Forma</label><input id="med-form" name="form" value="${med ? esc(med.form || '') : ''}" placeholder="cápsula, tableta…"></div>
        <div><label for="med-dose-label">Dosis diaria (texto)</label><input id="med-dose-label" name="doseLabel" value="${med ? esc(med.doseLabel || '') : ''}" placeholder="150 mg al día"></div>
      </div>
      <div>
        <label>Horarios</label>
        <div id="schedule-rows" class="stack" style="gap:8px">${slots.map(slot => scheduleRowHtml(slot.time, slot.amount, slot.dose)).join('')}</div>
        <button class="btn tiny ghost" type="button" data-action="add-schedule-row" style="margin-top:8px">+ Agregar horario</button>
      </div>
      <div class="form-grid three">
        <div><label for="med-start">Inicio</label><input id="med-start" type="date" name="start" value="${med ? esc(med.start || '') : todayISO()}"></div>
        <div><label for="med-duration">Días de esquema</label><input id="med-duration" type="number" name="durationDays" min="0" value="${med && med.durationDays != null ? esc(med.durationDays) : ''}" placeholder="30"></div>
        <div><label for="med-quantity">Cantidad dispensada</label><input id="med-quantity" type="number" name="quantity" min="0" value="${med && med.quantity != null ? esc(med.quantity) : ''}" placeholder="60"></div>
      </div>
      <div><label for="med-unit">Unidad</label><input id="med-unit" name="unit" value="${med ? esc(med.unit || 'unidades') : 'unidades'}"></div>
      ${textareaField('instructions', 'Indicación médica', med ? med.instructions : '', 'Tomar 2 cápsulas en la mañana…')}
      ${textareaField('notes', 'Notas de seguridad', med ? med.notes : '', 'Somnolencia, no suspender de golpe, interacciones…')}
      <div><label for="med-source">Fuente</label><input id="med-source" name="source" value="${med ? esc(med.source || '') : ''}" placeholder="Fórmula médica, fecha, institución"></div>
      <label class="check-row"><input type="checkbox" name="warning" ${med && med.warning ? 'checked' : ''}> Marcar para revisar con el equipo</label>
      <label class="check-row"><input type="checkbox" name="active" ${!med || med.active !== false ? 'checked' : ''}> Medicamento activo</label>
      <p class="tiny muted">Para suspender un medicamento, desactívalo. No borres el historial de tomas. Nunca cambies la dosis sin tu psiquiatra.</p>
      <div class="form-actions">
        <button class="btn primary" type="submit">Guardar medicamento</button>
        <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
      </div>
    </form>`;
  openModal({ title: med ? 'Editar medicamento' : 'Agregar medicamento', body, wide: true });
}

function openAppointmentModal(id) {
  const a = id ? findAppt(id) : null;
  const types = ['Psiquiatría', 'Psicología', 'Fisiatría', 'Terapia física', 'Clínica del dolor', 'EPS', 'Otro'];
  const statuses = [
    { value: 'por agendar', label: 'Por agendar' },
    { value: 'pendiente', label: 'Pendiente de autorización' },
    { value: 'agendada', label: 'Agendada' },
    { value: 'asistida', label: 'Asistida' },
    { value: 'cancelada', label: 'Cancelada' }
  ];
  /* Misma capa que los recordatorios: título y día arriba; el resto se abre si se necesita. */
  const avanzado = a && (String(a.place || '').trim() || String(a.phone || '').trim() || String(a.notes || '').trim() || a.status !== 'por agendar' || (a.remind != null && a.remind !== 60));
  const body = `
    <form data-form="appointment" class="form-grid">
      <input type="hidden" name="id" value="${a ? esc(a.id) : ''}">
      <div><label for="appt-title">¿Cuál es la cita?</label><input id="appt-title" name="title" value="${a ? esc(a.title || '') : ''}" placeholder="Control de psiquiatría" data-autofocus></div>
      <div class="form-grid two">
        <div><label for="appt-date">Día (si ya lo sabes)</label><input id="appt-date" type="date" name="date" value="${a ? esc(a.date || '') : ''}"></div>
        <div><label for="appt-time">Hora</label><input id="appt-time" type="time" name="time" value="${a ? esc(a.time || '') : ''}"></div>
      </div>
      <details class="form-extra" ${avanzado ? 'open' : ''}>
        <summary>Más opciones</summary>
        <div class="form-grid two" style="margin-top:10px">
          ${selectField('type', 'Tipo', a ? a.type : 'Psiquiatría', types.map(t => ({ value: t, label: t })))}
          ${selectField('status', 'Estado', a ? a.status : 'por agendar', statuses)}
        </div>
        <div class="form-grid three">
          <div><label for="appt-place">Lugar</label><input id="appt-place" name="place" value="${a ? esc(a.place || '') : ''}" placeholder="Hospital · Consulta externa"></div>
          <div><label for="appt-phone">Teléfono</label><input id="appt-phone" name="phone" value="${a ? esc(a.phone || '') : ''}" placeholder="601 5946161"></div>
          ${selectField('remind', 'Alarma', a ? (a.remind == null ? -1 : a.remind) : 60, Object.entries(ALARM_LABELS).map(([value, label]) => ({ value, label })))}
        </div>
        ${textareaField('notes', 'Notas', a ? a.notes : '', 'Qué llevar, qué preguntar, número de radicado…')}
      </details>
      <div class="form-actions">
        <button class="btn primary" type="submit">Guardar cita</button>
        <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
        ${a ? `<button class="btn small danger" type="button" data-action="delete-appt" data-id="${esc(a.id)}">Eliminar</button>` : ''}
      </div>
    </form>`;
  openModal({ title: a ? 'Editar cita' : 'Agregar cita', body, wide: true });
}

function openContactModal(id) {
  const c = id ? findContact(id) : null;
  const body = `
    <form data-form="contact" class="form-grid">
      <input type="hidden" name="id" value="${c ? esc(c.id) : ''}">
      <div><label for="contact-name">Nombre</label><input id="contact-name" name="name" value="${c ? esc(c.name) : ''}" required></div>
      <div><label for="contact-role">Rol</label><input id="contact-role" name="role" value="${c ? esc(c.role || '') : ''}" placeholder="Hermana, amiga, psicóloga…"></div>
      <div><label for="contact-phone">Teléfono</label><input id="contact-phone" name="phone" value="${c ? esc(c.phone || '') : ''}" placeholder="300 000 0000"></div>
      ${textareaField('notes', 'Notas', c ? c.notes : '', 'Qué acordaron para una crisis, horarios…')}
      ${yasminTip('Con nombre y teléfono basta. Las notas de crisis son opcionales: escríbelas solo si quieres.')}
      <div class="form-actions">
        <button class="btn primary" type="submit">Guardar contacto</button>
        <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
        ${c ? `<button class="btn small danger" type="button" data-action="delete-contact" data-id="${esc(c.id)}">Eliminar</button>` : ''}
      </div>
    </form>`;
  openModal({ title: c ? 'Editar contacto' : 'Agregar contacto', body });
}

function openNoteModal(id) {
  const n = id ? (state.notas || []).find(x => x.id === id) : null;
  const body = `
    <form data-form="note" class="form-grid">
      <input type="hidden" name="id" value="${n ? esc(n.id) : ''}">
      <div><label for="note-title">Título (si quieres)</label><input id="note-title" name="title" value="${n ? esc(n.title) : ''}" placeholder="Lo que me dijo el médico, una idea, un recuerdo…" data-autofocus></div>
      <div><label for="note-date">Fecha</label><input id="note-date" type="date" name="date" value="${n ? esc(n.date) : todayISO()}"></div>
      ${textareaField('text', 'Escribe como te salga', n ? n.text : '', 'Sin ordenar las ideas está bien. Aquí nadie lo lee más que tú.')}
      <div class="form-actions">
        <button class="btn primary" type="submit">Guardar en mi cuaderno</button>
        <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
        ${n ? `<button class="btn small danger" type="button" data-action="delete-note" data-id="${esc(n.id)}">Eliminar</button>` : ''}
      </div>
    </form>`;
  openModal({ title: n ? 'Editar nota' : 'Nueva nota', body });
}

function openLetterModal(id) {
  const l = id ? state.letters.find(x => x.id === id) : null;
  const body = `
    <form data-form="letter" class="form-grid">
      <input type="hidden" name="id" value="${l ? esc(l.id) : ''}">
      <div><label for="letter-title">Título</label><input id="letter-title" name="title" value="${l ? esc(l.title || '') : 'Para un día difícil'}"></div>
      ${textareaField('text', 'Carta', l ? l.text : '', 'Escríbete como le escribirías a alguien que quieres…')}
      ${yasminTip('No tiene que quedar bien escrita. La lees tú, en el día que la necesites.')}
      <p class="tiny muted">Esta carta es tuya. No tienes que mostrarla a nadie.</p>
      <div class="form-actions">
        <button class="btn primary" type="submit">Guardar carta</button>
        <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
        ${l ? `<button class="btn small danger" type="button" data-action="delete-letter" data-id="${esc(l.id)}">Eliminar</button>` : ''}
      </div>
    </form>`;
  openModal({ title: l ? 'Editar carta' : 'Mi carta para un día difícil', body, wide: true });
}

function openMomentoModal(id) {
  const m = id ? state.momentos.find(x => x.id === id) : null;
  const body = `
    <form data-form="momento" class="form-grid">
      <input type="hidden" name="id" value="${m ? esc(m.id) : ''}">
      <div class="form-grid two">
        <div><label for="mom-from">¿De parte de quién?</label><input id="mom-from" name="from" value="${m ? esc(m.from || '') : ''}" placeholder="David, tu hijo"></div>
        <div><label for="mom-relation">Relación (opcional)</label><input id="mom-relation" name="relation" value="${m ? esc(m.relation || '') : ''}" placeholder="Hijo, hermana, amiga"></div>
      </div>
      ${textareaField('text', 'La frase', m ? m.text : '', 'Algo que ella leería y le haría bien. Sin consejos, sin «échale ganas».')}
      <div>
        <label for="mom-photo">Foto (opcional)</label>
        <input id="mom-photo" type="file" accept="image/*" name="photo">
        <p class="tiny muted" style="margin-top:5px">Se guarda comprimida en este teléfono. Máximo 12 MB. ${m && m.photoId ? 'Ya tiene una foto: si eliges otra, se reemplaza.' : ''}</p>
      </div>
      <div><label for="mom-date">Fecha</label><input id="mom-date" type="date" name="date" value="${m ? esc(m.date || todayISO()) : todayISO()}"></div>
      <div class="form-actions">
        <button class="btn primary" type="submit">Guardar momento</button>
        <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
        ${m ? `<button class="btn small danger" type="button" data-action="delete-momento" data-id="${esc(m.id)}">Eliminar</button>` : ''}
      </div>
    </form>`;
  openModal({ title: m ? 'Editar momento' : 'Nuevo momento', body, wide: true });
}

function openEffectModal() {
  const body = `
    <form data-form="effect" class="form-grid">
      <div class="form-grid two">
        <div><label for="fx-date">Fecha</label><input id="fx-date" type="date" name="date" value="${todayISO()}"></div>
        <div><label for="fx-severity">Intensidad</label><input id="fx-severity" type="range" name="severity" min="0" max="10" value="5" data-range="fx"><div class="tiny muted" style="text-align:right"><span data-range-label="fx">5</span>/10</div></div>
      </div>
      <div><label for="fx-symptom">¿Qué molestia sentiste?</label><input id="fx-symptom" name="symptom" placeholder="Somnolencia, mareo, náuseas, dolor de cabeza…" required></div>
      ${textareaField('notes', 'Detalle', '', 'Cuándo empezó, si está mejorando, si te impidió hacer algo…')}
      <div class="form-actions">
        <button class="btn primary" type="submit">Guardar registro</button>
        <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
      </div>
    </form>`;
  openModal({ title: 'Registrar efecto o novedad', body });
}

function openExerciseModal(id) {
  const ex = state.exercises.find(e => e.id === id);
  if (!ex) { toast('No se encontró el ejercicio.'); return; }
  const day = findDay(todayISO());
  const log = day?.exercises?.[id] || {};
  const body = `
    <div class="row" style="margin-bottom:10px">${badge(ex.group, 'info')}${badge(ex.reps, 'clay')}</div>
    <p class="small">${esc(ex.instructions)}</p>
    <div class="exercise-safety" style="margin:10px 0">${esc(ex.safety)}</div>
    <form data-form="exercise" class="form-grid">
      <input type="hidden" name="id" value="${esc(ex.id)}">
      <input type="hidden" name="durationSec" id="exercise-duration" value="${log.durationSec || 0}">
      <div class="form-grid two">
        ${rangeField('painBefore', 'Dolor antes', log.painBefore, 0, 10, 'Sin dolor', 'Máximo', 3)}
        ${rangeField('painAfter', 'Dolor después', log.painAfter, 0, 10, 'Sin dolor', 'Máximo', 3)}
      </div>
      <div>
        <label>Duración de la sesión</label>
        <div class="timer-row"><span class="timer-value" id="exercise-timer">${formatDuration(log.durationSec || 0)}</span><button class="btn small" type="button" data-action="start-timer">Iniciar</button></div>
      </div>
      <div><label for="ex-reps">Repeticiones hechas</label><input id="ex-reps" name="reps" value="${esc(log.reps || '')}" placeholder="${esc(ex.reps)}"></div>
      ${textareaField('notes', 'Notas', log.notes || '', 'Cómo te sentiste, qué te costó, qué mejoró…')}
      <div class="form-actions">
        <button class="btn primary" type="submit">Registrar sesión</button>
        <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
      </div>
    </form>`;
  openModal({ title: ex.name, body });
}

function openQuestionModal() {
  const list = state.questions.map((q, i) => `<div class="between" style="padding:7px 0;border-bottom:1px solid var(--line)"><div style="font-size:.86rem">${i + 1}. ${esc(q)}</div><button class="link-btn tiny" data-action="delete-question" data-index="${i}">Quitar</button></div>`).join('');
  const body = `
    ${list ? `<div style="margin-bottom:14px"><div class="eyebrow">Preguntas guardadas</div><div class="stack" style="margin-top:6px">${list}</div></div>` : ''}
    <form data-form="question" class="form-grid">
      ${textareaField('questions', 'Nuevas preguntas', '', 'Una pregunta por línea…')}
      <p class="tiny muted">Escríbelas antes de la consulta. Puedes copiarlas o imprimir el reporte.</p>
      <div class="form-actions">
        <button class="btn primary" type="submit">Agregar preguntas</button>
        <button class="btn ghost" type="button" data-action="close-modal">Cerrar</button>
      </div>
    </form>`;
  openModal({ title: 'Preguntas para la consulta', body, wide: true });
}

function openPrepareModal(id) {
  const a = findAppt(id);
  if (!a) { toast('No se encontró la cita.'); return; }
  const report = buildReport(7);
  const body = `
    <div class="card flat" style="box-shadow:none;margin-bottom:14px">
      <div class="row">${badge(a.type || 'Cita', 'info')}${badge(a.status || 'por agendar', 'warn')}</div>
      <h3 style="margin:8px 0 3px">${esc(a.title || a.type || 'Cita')}</h3>
      <div class="small muted">${esc(dateLabel(a.date))}${a.time ? ' · ' + esc(a.time) : ''}${a.place ? ' · ' + esc(a.place) : ''}</div>
    </div>
    <div class="stat-grid" style="margin-bottom:14px">
      <div class="stat"><div class="value">${report.adherence.pct == null ? '—' : report.adherence.pct + '%'}</div><div class="label">Adherencia 7d</div></div>
      <div class="stat"><div class="value">${report.avg.mood ?? '—'}</div><div class="label">Ánimo 7d</div></div>
      <div class="stat"><div class="value">${report.avg.pain ?? '—'}</div><div class="label">Dolor 7d</div></div>
      <div class="stat"><div class="value">${report.effects.length}</div><div class="label">Efectos</div></div>
    </div>
    ${report.effects.length ? `<div style="margin-bottom:12px"><strong class="small">Efectos recientes</strong><ul class="small" style="padding-left:18px;margin-top:5px">${report.effects.slice(-4).map(e => `<li>${esc(e.symptom)} (${esc(e.severity)}/10) · ${esc(formatShort(e.date))}</li>`).join('')}</ul></div>` : ''}
    <div style="margin-bottom:12px"><strong class="small">Lo que se observa</strong><ul class="small" style="padding-left:18px;margin-top:5px">${report.insights.lines.slice(0, 4).map(line => `<li>${esc(line)}</li>`).join('')}</ul></div>
    ${state.questions.length ? `<div style="margin-bottom:12px"><strong class="small">Preguntas</strong><ol class="small" style="padding-left:18px;margin-top:5px">${state.questions.slice(0, 8).map(q => `<li>${esc(q)}</li>`).join('')}</ol></div>` : ''}
    <form data-form="prep" class="form-grid">
      <input type="hidden" name="id" value="${esc(a.id)}">
      ${textareaField('prep', 'Mi preparación para esta cita', a.prep || '', 'Qué quiero contar, qué necesito preguntar, quién me acompaña…')}
      <div class="form-actions">
        <button class="btn primary" type="submit">Guardar preparación</button>
        <button class="btn" type="button" data-action="print-report">Imprimir reporte</button>
        <button class="btn ghost" type="button" data-action="close-modal">Cerrar</button>
      </div>
    </form>`;
  openModal({ title: 'Preparar la consulta', body, wide: true });
}

function openPinModal() {
  const hasPin = !!state.settings.pinHash;
  const body = `
    <form data-form="pin" class="form-grid">
      ${hasPin ? `<div><label for="pin-current">PIN actual</label><input id="pin-current" name="current" type="password" inputmode="numeric" autocomplete="off" maxlength="12" required></div>` : ''}
      <div><label for="pin-new">Nuevo PIN (mínimo 4 caracteres)</label><input id="pin-new" name="newPin" type="password" inputmode="numeric" autocomplete="off" maxlength="12" required></div>
      <div><label for="pin-confirm">Repite el PIN</label><input id="pin-confirm" name="confirmPin" type="password" inputmode="numeric" autocomplete="off" maxlength="12" required></div>
      <p class="tiny muted">El PIN es una cortina de privacidad, no cifrado del teléfono. Si lo olvidas, deberás borrar los datos o importar un respaldo. Anótalo en un lugar seguro.</p>
      <div class="form-actions">
        <button class="btn primary" type="submit">Guardar PIN</button>
        <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
      </div>
    </form>`;
  openModal({ title: hasPin ? 'Cambiar PIN' : 'Configurar PIN', body });
}

function openRemovePinModal() {
  const body = `
    <form data-form="remove-pin" class="form-grid">
      <p class="small">Al quitar el PIN, cualquiera que abra este dispositivo podrá ver Andrea. Confirma con tu PIN actual.</p>
      <div><label for="pin-remove">PIN actual</label><input id="pin-remove" name="current" type="password" inputmode="numeric" autocomplete="off" maxlength="12" required></div>
      <div class="form-actions">
        <button class="btn danger" type="submit">Quitar PIN</button>
        <button class="btn ghost" type="button" data-action="close-modal">Cancelar</button>
      </div>
    </form>`;
  openModal({ title: 'Quitar PIN', body });
}

/* ---------- inicialización ---------- */
function init() {
  state = loadState();
  buildNav();

  const hashRoute = (location.hash || '').replace('#', '');
  if (hashRoute && views[hashRoute]) route = hashRoute;

  locked = !!state.settings.pinHash;
  render();

  /* En un dispositivo que abre Andrea por primera vez, la inducción aparece
     sola, sin botones. Al cerrarla queda marcada y no vuelve a salir sola. */
  quizasMostrarInduccion();

  document.addEventListener('click', handleClick);
  document.addEventListener('submit', handleSubmit);
  document.addEventListener('change', handleChange);
  document.addEventListener('input', handleInput);
  document.addEventListener('keydown', handleKeydown);

  window.addEventListener('hashchange', () => {
    const next = (location.hash || '').replace('#', '');
    if (views[next] && next !== route) {
      route = next;
      render();
    }
  });

  setInterval(checkNotifications, 30000);
  setTimeout(checkNotifications, 4000);
  /* Al volver de segundo plano el temporizador puede venir atrasado:
     se re-chequean los avisos para no perder recordatorios. */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      checkNotifications();
      setTimeout(checkNotifications, 3000);
    }
  });

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').then(reg => {
      andreaSwReg = reg;
      reg.addEventListener('updatefound', () => {
        const nuevo = reg.installing;
        if (!nuevo) return;
        nuevo.addEventListener('statechange', () => {
          if (nuevo.state === 'installed' && navigator.serviceWorker.controller) {
            toast('Hay una versión nueva de Andrea. Se está actualizando…');
          }
        });
      });
      /* Cuando el service worker nuevo toma el control, un solo reciclaje
         deja la app en la versión actual sin que Andrea tenga que hacer nada. */
      let recargado = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (recargado) return;
        recargado = true;
        if (!sessionStorage.getItem('andrea_sw_recargado')) {
          sessionStorage.setItem('andrea_sw_recargado', '1');
          location.reload();
        }
      });
    }).catch(err => console.warn('Service worker no registrado', err));
  }

  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }

  /* En un dispositivo nuevo sin datos, primero se muestra la bienvenida
     para importar el respaldo. La inducción aparece después de importar. */
  if (!locked && induccionDebeVerse() && isSetup()) {
    setTimeout(() => abrirInduccion(true), 420);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
