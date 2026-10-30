/* Andrea · Yasmin 2.0: compañía conversacional que entiende el dialecto,
   los errores de escritura, el contexto y la historia de Andrea.
   Funciona sin internet y sin modelos externos: reglas + memoria local. */

const YASMIN_SUGERENCIAS = [
  '¿Qué me toca hoy?',
  'Me siento triste',
  'No puedo dormir',
  'Me duele mucho',
  '¿Qué has notado esta semana?',
  'Solo necesito que me escuches',
  '¿Qué hay en mi agenda?',
  'Quiero ver un momento',
  'Respira conmigo',
  'No estoy bien'
];

const YASMIN_TONOS = {
  cercano: 'cercana',
  suave: 'suave',
  directo: 'directa'
};

function yasminName() {
  return (state.settings.yasminName || 'Yasmin').trim() || 'Yasmin';
}
function yasminTone() {
  return ['cercano', 'suave', 'directo'].includes(state.settings.yasminTone)
    ? state.settings.yasminTone
    : 'cercano';
}
function yasminAddress() {
  const nombre = profileName();
  return nombre ? `, ${nombre}` : '';
}
function yasminToneIntro() {
  const tono = yasminTone();
  if (tono === 'suave') return 'Sin afán. ';
  if (tono === 'directo') return '';
  return '';
}

/* ---------- normalización del español colombiano y de los errores ---------- */
function yasminNorm(texto) {
  let t = normalizeText(texto);
  const cambios = {
    q: 'que', k: 'que', xq: 'porque', pq: 'porque', xk: 'porque',
    tb: 'tambien', tmb: 'tambien', tbn: 'tambien', tmbn: 'tambien',
    bn: 'bien', bln: 'bien', ml: 'mal', mls: 'mal',
    toy: 'estoy', stoy: 'estoy', toi: 'estoy', estoi: 'estoy',
    mñn: 'manana', mnn: 'manana', manana: 'manana',
    aki: 'aqui', aca: 'aqui', dp: 'despues', dsp: 'despues', dspo: 'despues',
    ps: 'pues', pa: 'para', pal: 'para el', xfa: 'por favor', pls: 'por favor',
    x: 'por', ok: 'bien', oki: 'bien', okis: 'bien',
    qhubo: 'quiubo', quihubo: 'quiubo', quiubole: 'quiubo',
    sumer: 'sumerce', sumerced: 'sumerce',
    profe: 'profesional', doc: 'medico', dra: 'doctora', dr: 'doctor',
    hosp: 'hospital', hpta: 'hp', hp: 'hp', mk: 'hp', mka: 'hp',
    c: 'si', sip: 'si', sipo: 'si', nop: 'no', nel: 'no',
    ase: 'hace', ayer: 'ayer', oy: 'hoy', ho: 'hoy'
  };
  t = t.split(' ').map(w => cambios[w] || w).join(' ');
  t = t.replace(/([a-z])\1{2,}/g, '$1');
  return t.replace(/\s+/g, ' ').trim();
}

function yasminTokens(t) {
  return String(t || '').split(' ').filter(Boolean);
}
function yasminLevenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[n];
}
function yasminClose(word, target, max = 1) {
  if (word === target) return true;
  if (!word || !target) return false;
  /* Las palabras cortas se comparan exactas: «hola» no es «sola». */
  if (target.length < 5) return false;
  if (Math.abs(word.length - target.length) > max) return false;
  return yasminLevenshtein(word, target) <= max;
}
function yasminHas(t, ...terminos) {
  const tokens = yasminTokens(t);
  return terminos.some(termino => {
    const target = yasminNorm(termino);
    if (!target) return false;
    if (target.includes(' ')) return t.includes(target);
    if (target.length <= 3) return tokens.includes(target);
    return tokens.some(w => yasminClose(w, target, target.length >= 7 ? 2 : 1));
  });
}
function yasminAny(t, words) {
  const tokens = yasminTokens(t);
  return words.some(w => {
    const target = yasminNorm(w);
    if (!target) return false;
    if (target.includes(' ')) return t.includes(target);
    if (target.length <= 3) return tokens.includes(target);
    return tokens.some(x => yasminClose(x, target, target.length >= 7 ? 2 : 1));
  });
}

/* ---------- emociones ---------- */
const YASMIN_EMOCIONES = {
  tristeza: ['triste', 'tristeza', 'llorar', 'llorando', 'lloro', 'vacia', 'vaciedad', 'desanimada', 'sin ganas', 'desesperanza', 'inutil', 'fracasada', 'culpa', 'culpable', 'sola', 'solo', 'abandonada', 'nadie me quiere', 'no valgo', 'no sirvo'],
  ansiedad: ['ansiedad', 'ansiosa', 'nervios', 'nerviosa', 'panico', 'angustia', 'taquicardia', 'me falta el aire', 'no puedo respirar', 'oprimida', 'acelerada', 'temblor', 'mareo'],
  miedo: ['miedo', 'asustada', 'susto', 'terror', 'me da miedo', 'temer', 'temor'],
  rabia: ['rabia', 'furia', 'ira', 'enojada', 'molesta', 'injusto', 'injusticia', 'odio', 'me hierve'],
  cansancio: ['cansada', 'agotada', 'agotamiento', 'sin fuerzas', 'no tengo fuerzas', 'sin energia', 'no puedo mas', 'no puedo con esto', 'no puedo con nada', 'todo me supera', 'desgastada', 'quebrada'],
  dolor: ['duele', 'dolor', 'adolorida', 'espalda', 'cabeza', 'cuello', 'pierna', 'piernas', 'brazo', 'brazos', 'rodilla', 'rodillas', 'cadera', 'manos', 'hombro', 'hombros', 'articulacion', 'cintura'],
  sueno: ['dormir', 'insomnio', 'no duermo', 'despierta', 'desvelada', 'sueño', 'descansar', 'no puedo dormir'],
  soledad: ['sola', 'solo', 'nadie', 'abandonada', 'no tengo a nadie', 'me siento sola'],
  calma: ['bien', 'mejor', 'tranquila', 'contenta', 'feliz', 'aliviada', 'en paz', 'gracias', 'agradecida'],
  esperanza: ['esperanza', 'ganas', 'quiero seguir', 'voy a poder', 'hoy pude', 'un paso']
};

function yasminEmotion(t) {
  let best = { key: '', score: 0 };
  Object.entries(YASMIN_EMOCIONES).forEach(([key, words]) => {
    let score = 0;
    words.forEach(w => {
      const target = yasminNorm(w);
      if (!target) return;
      if (target.includes(' ')) {
        if (t.includes(target)) score += 2;
      } else if (yasminTokens(t).some(x => yasminClose(x, target, target.length >= 7 ? 2 : 1))) {
        score += 1;
      }
    });
    if (score > best.score) best = { key, score };
  });
  if (yasminHas(t, 'mucho', 'demasiado', 'horrible', 'insoportable', 'al maximo', 'peor')) {
    if (best.score) best.score += 1;
  }
  return best;
}

/* ---------- contexto y memoria ---------- */
function yasminRemember({ topic, mood, intent, awaiting } = {}) {
  const mem = state.yasminMemory || (state.yasminMemory = {});
  if (topic !== undefined) mem.topic = topic;
  if (mood !== undefined) mem.mood = mood;
  if (intent !== undefined) mem.intent = intent;
  if (awaiting !== undefined) mem.awaiting = awaiting;
  mem.turns = (Number(mem.turns) || 0) + 1;
  mem.updatedAt = nowISO();
  save();
}
function yasminLastUser() {
  const messages = state.chat.filter(m => m.role === 'ella');
  return messages.length ? messages[messages.length - 1].text : '';
}

/* ---------- aprendizaje local ---------- */
/* Reglas conservadoras: solo guardan frases que Andrea dice sobre sí misma.
   No guardan crisis, no guardan la conversación completa y nunca salen del
   teléfono. Todo se puede ver y borrar en «Memoria». */
const YASMIN_MEMORY_RULES = [
  { kind: 'nota', re: /(?:^|\b)(?:recu[eé]rda(?:me)?|no te olvides de|no olvides|ten presente|guarda(?:me)?|anota(?:me)?)\s+(?:que\s+)?(.{3,200})/i },
  { kind: 'ayuda', re: /(?:^|\b)me (?:ayuda|calma|hace bien|sostiene|tranquiliza|sirve)\s+(.{3,180})/i },
  { kind: 'evitar', re: /(?:^|\b)me (?:hace da[nñ]o|hace sentir mal|lastima|molesta|incomoda|pone peor)\s+(.{3,180})/i },
  { kind: 'evitar', re: /(?:^|\b)no me gusta\s+(.{3,180})/i },
  { kind: 'gusto', re: /(?:^|\b)me (?:gusta|encanta|encantan|gustan)\s+(.{3,180})/i },
  { kind: 'meta', re: /(?:^|\b)(?:mi meta es|quiero lograr|quiero volver a|sue[nñ]o con|mi deseo es)\s+(.{3,180})/i },
  { kind: 'nombre', re: /(?:^|\b)(?:me llaman|mi apodo es|puedes llamarme)\s+(.{2,60})/i },
  { kind: 'familia', re: /(?:^|\b)(mi (?:mam[aá]|pap[aá]|hij[oa]|herman[oa]|espos[oa]|niet[oa]|abuel[oa]|t[ií][oa]|prim[oa])|mi familia)\s+(.{2,160})/i, join: true },
  { kind: 'sueno', re: /(?:^|\b)(?:no puedo dormir|me despierto|duermo poco|tengo insomnio|me cuesta dormir)\b(.{0,180})/i },
  { kind: 'cuerpo', re: /(?:^|\b)(?:me duele|tengo dolor en|me molesta)\s+(.{3,180})/i }
];

function yasminAprender(raw, respuesta, source = 'chat') {
  if (state.settings.yasminLearn === false) return [];
  const text = String(raw || '').trim();
  if (text.length < 8 || text.length > 900) return [];
  const t = yasminNorm(text);
  if (!t) return [];
  /* Nunca convertir una crisis en una nota de memoria. */
  if (yasminRiesgo(t)) return [];
  if (/\b(?:suicid|matarme|hacerme dano|autolesion|no quiero vivir|no quiero estar)\b/.test(t)) return [];
  const added = [];
  for (const rule of YASMIN_MEMORY_RULES) {
    if (added.length >= 2) break;
    if (rule.kind === 'gusto' && /\bno me gusta\b/.test(t)) continue;
    if (rule.kind === 'ayuda' && /\bno me (?:ayuda|calma|hace bien)\b/.test(t)) continue;
    const match = text.match(rule.re);
    if (!match) continue;
    let value = (rule.join ? `${match[1]} ${match[2]}` : (match[1] || '')).trim()
      .replace(/[.!?;]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (rule.kind === 'nota') value = value.replace(/^que\s+/i, '');
    value = value.replace(/^(mucho|much[ií]simo|bastante|un poco)\s+/i, '').trim();
    if (rule.kind === 'sueno' && !value) value = 'me cuesta dormir';
    if (value.length < 3 || value.length > 180) continue;
    if (['mucho', 'muchisimo', 'todo', 'toda', 'bastante', 'un poco', 'nada', 'algo'].includes(memoryFold(value))) continue;
    if (/\?$/.test(value)) continue;
    const fact = memoryAdd({ kind: rule.kind, text: value, source });
    if (fact) added.push(fact);
  }
  return added;
}

function yasminMemoriaLinea(topic = '') {
  const facts = memoryList('', 60);
  if (!facts.length) return '';
  const pick = kinds => {
    for (const kind of kinds) {
      const found = facts.find(f => f.kind === kind);
      if (found) return found;
    }
    return null;
  };
  let fact = null;
  if (topic === 'alegria') {
    fact = pick(['gusto', 'meta', 'familia', 'nota']);
  } else if (['tristeza', 'ansiedad', 'miedo', 'cansancio', 'crisis', 'desaparecer'].includes(topic)) {
    fact = pick(['ayuda', 'familia', 'nota', 'gusto']);
  } else if (['dolor', 'cuerpo'].includes(topic)) {
    fact = pick(['cuerpo', 'ayuda', 'nota']);
  } else if (topic === 'sueno') {
    fact = pick(['sueno', 'ayuda', 'nota']);
  } else if (topic === 'medicamentos') {
    fact = pick(['nota', 'cuerpo', 'ayuda']);
  } else {
    fact = pick(['nota', 'ayuda', 'gusto', 'familia']);
  }
  if (!fact) return '';
  const phrase = {
    ayuda: 'Me acuerdo de que te ayuda',
    evitar: 'Me acuerdo de que te hace daño',
    gusto: 'Me acuerdo de que te gusta',
    meta: 'Me acuerdo de que quieres',
    familia: 'Me acuerdo de tu gente',
    nombre: 'Me acuerdo de cómo te llaman',
    sueno: 'Me acuerdo de lo que me contaste del sueño',
    cuerpo: 'Me acuerdo de lo que me contaste del cuerpo',
    nota: 'Me acuerdo de que me contaste'
  }[fact.kind] || 'Me acuerdo de que me contaste';
  return `${phrase}: «${fact.text}».`;
}

/* Yasmin comenta la frase de hoy conectándola con la semana real de Andrea. */
function yasminFraseReply() {
  const f = feElegida(ui.feOffset || 0);
  const ins = careInsights(7);
  const contexto = [];
  if (ins.redDays >= 2) contexto.push('esta semana tuvo días pesados, y justamente la frase de hoy es de ' + (f.tema === 'fortaleza' ? 'fortaleza' : 'renacer') + ': no la elegí al azar');
  else if (ins.greenDays >= 2) contexto.push('tu semana viene con días buenos, y la frase de hoy celebra eso');
  else if (ins.hasData) contexto.push('tus registros de la semana van en paz, y la frase de hoy viene a acompañar eso');
  else contexto.push('todavía estamos conociéndonos, y esta frase te la dedico desde hoy');
  const comentarios = {
    renacer: 'las mariposas pasan por un capullo antes de volar; esos días en los que no te ves avanzada son, muchas veces, el capullo',
    fortaleza: 'las alas de una mariposa pesan casi nada y igual cruzan el mar; tú llevas meses cruzando el tuyo',
    libertad: 'el capullo se abre solo, cuando la mariposa está lista; nada de lo que hoy aprieta va a ser eterno',
    belleza: 'la mariposa no sabe que es hermosa, y aun así transforma todo lo que toca; tú haces lo mismo en tu casa',
    fe: 'si Dios cuida el vuelo de las mariposas, imagínate con cuánto más cuidado acompaña tu paso de hoy'
  };
  return {
    text: `La frase de hoy dice: «${f.frase}»

${comentarios[f.tema] || ''}. ${contexto[0]}.

Si la frase te tocó algo distinto, cuéntame con tus palabras — yo la leo contigo, no la interpreto sola.`,
    chips: yasminChips(
      { label: 'Guardar en Memoria', action: 'yasmin-chip', id: 'recuerda que mi frase de hoy me hizo pensar' },
      { label: 'Otra frase', action: 'fe-otra-frase' },
      { label: 'Respirar conmigo', action: 'respirar' }
    )
  };
}

function yasminPanoramaReply() {
  const p = careInsights(7);
  const chips = yasminChips(
    { label: 'Ver mi memoria', action: 'nav', id: 'memoria' },
    { label: 'Preparar consulta', action: 'nav', id: 'reporte' },
    { label: 'Registrar hoy', action: 'nav', id: 'registro' }
  );
  if (!p.hasData) {
    return {
      text: `Todavía no tengo suficientes registros para mostrarte un panorama.\n\nCon que registres cómo te sientes dos o tres días, empiezo a ver qué se repite. No necesitas hacerlo perfecto: un número y una frase bastan.`,
      chips
    };
  }
  return {
    text: `Esto es lo que veo en tus últimos 7 días:\n\n${p.lines.slice(0, 4).map(line => '• ' + line).join('\n')}\n\nNo es un diagnóstico ni una nota. Son tus propios registros, puestos en orden para que puedas contarlos mejor. Si algo te preocupa, llévalo a tu próxima cita.`,
    chips
  };
}

function yasminChecklistReply() {
  const today = todayISO();
  const items = checklistFor(today);
  const pending = items.filter(item => !item.done);
  const meds = pending.filter(item => item.group === 'meds');
  const care = pending.filter(item => item.group === 'care');
  const lines = [];
  if (meds.length) lines.push(`Tomas pendientes: ${meds.map(item => `${item.label} (${item.detail})`).join(', ')}.`);
  if (care.length) lines.push(`Cuidados base: ${care.map(item => item.label).join(', ')}.`);
  if (!pending.length) lines.push('Está todo lo de hoy marcado. No hay nada más que cumplir.');
  return {
    text: `Vas ${items.length - pending.length} de ${items.length} — bien por lo que ya va.\n\n${lines.join('\n')}\n\nY nada de esto es para castigarte: está aquí solo para que no tengas que cargarlo todo de memoria. Si hoy no se puede, mañana sigue la misma lista, sin notas.`,
    chips: yasminChips(
      meds.length ? { label: `Marcar ${meds[0].label}`, action: 'toggle-dose', id: meds[0].doseKey } : null,
      care.length ? { label: `Marcar ${care[0].label.toLowerCase()}`, action: 'checklist-toggle', id: care[0].careKey } : null,
      { label: 'Abrir mi checklist', action: 'nav', id: 'hoy' },
      { label: 'Modo mínimo', action: 'minimum' }
    )
  };
}

function yasminChips(...chips) {
  return chips.filter(Boolean);
}
function yasminPlanChip() {
  return { label: 'Abrir mi plan', action: 'crisis' };
}
function yasminBreatheChip() {
  return { label: 'Respirar conmigo', action: 'respirar' };
}
function yasminCompaniaChip() {
  return { label: 'Solo quiero compañía', action: 'yasmin-chip', id: 'Solo quiero compañía' };
}
function yasminAgendaChip() {
  return { label: 'Abrir mi agenda', action: 'view-agenda' };
}
function yasminMomentoChip(label = 'Ver un momento') {
  return state.momentos.length
    ? { label, action: 'momento-sorpresa' }
    : { label: 'Abrir Momentos', action: 'nav', id: 'momentos' };
}
/* Botones para llamar a su gente de verdad: en los momentos difíciles,
   la salida más humana es una voz conocida, no un consejo. */
function yasminGenteChips(max = 2) {
  const FAMILIA = /mama|mamá|papa|papá|hij[ao]|herman[ao]|sobrin[ao]|prim[ao]|ti[ao]|esposo|mij[oa]|abuel[ao]|nuera|yerno|cunad|cuñad|familia|amig[ao]/i;
  const conTelefono = (state.contacts || []).filter(c => c.phone);
  const gente = conTelefono.filter(c => FAMILIA.test(`${c.name || ''} ${c.role || ''}`));
  const lista = (gente.length ? gente : conTelefono).slice(0, max);
  return lista.map(c => ({
    label: `Llamar a ${String(c.name || 'mi gente').split(' ')[0]}`,
    action: 'llamar',
    id: phoneHref(c.phone)
  }));
}
function yasminHospitalChip() {
  const hosp = hospitalContact();
  return hosp
    ? { label: 'Llamar a ' + String(hosp.name || 'mi hospital').split('·')[0].trim(), action: 'llamar', id: phoneHref(hosp.phone) }
    : { label: 'Llamar al 106', action: 'llamar', id: 'tel:106' };
}
function yasminDateText(date) {
  if (!date) return 'sin fecha';
  if (date === todayISO()) return 'hoy';
  if (date === addDays(todayISO(), 1)) return 'mañana';
  return formatLongDate(date);
}
function yasminItemLine(item) {
  return `${item.time ? item.time + ' · ' : ''}${item.title}${item.place ? ' (' + item.place + ')' : ''}${item.done ? ' · hecho' : ''}`;
}
function yasminAgendaDay(date) {
  const items = agendaItemsFor(date);
  const pendientes = items.filter(x => !x.done);
  if (!pendientes.length) {
    return items.length
      ? `En tu agenda de ${yasminDateText(date)} ya está todo marcado como hecho.`
      : `No tienes nada anotado en tu agenda para ${yasminDateText(date)}.`;
  }
  return `En tu agenda de ${yasminDateText(date)} tienes:\n\n${pendientes.slice(0, 6).map(x => '• ' + yasminItemLine(x)).join('\n')}`;
}
function yasminNextAgendaText() {
  const next = nextAgendaItem({ includeUndated: true });
  if (!next) return '';
  if (!next.date) return `Tienes algo por agendar: ${next.title}.`;
  return `Lo próximo es ${next.title}, ${yasminDateText(next.date)}${next.time ? ' a las ' + next.time : ''}${next.place ? ', en ' + next.place : ''}.`;
}
function yasminPlanHoy() {
  const hoy = todayISO();
  const pendientes = pendingDosesToday();
  const items = agendaItemsFor(hoy).filter(x => !x.done);
  const cita = nextAppointment();
  const day = findDay(hoy) || {};
  const partes = [];

  if (pendientes.length) {
    partes.push(`Queda${pendientes.length > 1 ? 'n' : ''} ${pendientes.length} toma${pendientes.length > 1 ? 's' : ''} por hoy, sin prisa: ${pendientes.slice(0, 4).map(d => `${d.med.name} ${d.amount} a las ${d.time}`).join(', ')}.`);
  } else if (dosesFor(hoy).length) {
    partes.push('Ya tienes todas las tomas de hoy registradas. Eso también es cuidarte.');
  }

  const progreso = checklistProgress(hoy);
  partes.push(`Tu checklist de hoy va en ${progreso.done} de ${progreso.total}.`);

  if (items.length) {
    partes.push(`En tu agenda de hoy: ${items.map(x => yasminItemLine(x)).join('; ')}.`);
  } else {
    partes.push('Hoy no tienes citas ni recordatorios en la agenda.');
  }

  if (cita) {
    partes.push(`Tu próxima cita es ${cita.title || cita.type}${cita.date ? ': ' + formatLongDate(cita.date) + (cita.time ? ' a las ' + cita.time : '') : ' (aún sin fecha)'}.`);
  }
  if (day.traffic === 'red') partes.push('Marcaste el día como «necesito ayuda». No tienes que poder sola: abre tu plan o llama a alguien.');
  partes.push('Lo demás puede esperar. ¿Empezamos por lo primero, o prefieres que solo te acompañe?');

  return {
    text: `Esto es lo que hay para hoy:\n\n${partes.join('\n\n')}`,
    chips: yasminChips(
      pendientes.length ? { label: 'Ya la tomé', action: 'toggle-dose', id: pendientes[0].key } : { label: 'Ver medicamentos', action: 'nav', id: 'medicamentos' },
      { label: 'Ver mi agenda', action: 'view-agenda' },
      yasminCompaniaChip()
    )
  };
}
function yasminAgendaQuery(raw) {
  let parsed = null;
  try { parsed = parseAgendaText(raw, todayISO()); } catch (e) { parsed = null; }
  const explicit = parsed && parsed.dateExplicit ? parsed.date : '';
  const date = explicit || todayISO();
  const items = agendaItemsFor(date);
  const next = nextAgendaItem();
  return {
    text: `${yasminAgendaDay(date)}\n\n${next && next.date !== date ? yasminNextAgendaText() + '\n\n' : ''}Puedes crear un recordatorio desde la Agenda, o decirme «recuérdame…» y te muestro el formulario para revisarlo.`,
    chips: yasminChips(
      { label: 'Ver calendario', action: 'view-agenda' },
      { label: 'Agregar recordatorio', action: 'quick-add', id: date },
      { label: 'Ver mi día', action: 'nav', id: 'hoy' }
    )
  };
}
function yasminDraftFromText(raw) {
  const t = yasminNorm(raw);
  if (!/^(recuerdame|recordarme|agendame|agenda|anota|anotame|apunta|apuntame|ponme|pon|crea|crear|agrega|agregar|programa|programar|reserva|reservar|no olvidar|no te olvides)\b/.test(t)) return null;
  let parsed;
  try { parsed = parseAgendaText(raw, todayISO()); } catch (e) { return null; }
  if (!parsed || !parsed.title) return null;
  ui.yasminEventDraft = Object.assign({}, parsed, { parsedFrom: raw, parsedSummary: parsed.parsedSummary });
  return {
    text: `Esto entendí, ${yasminAddress() ? yasminAddress().slice(2) : 'para ti'}:\n\n• ${parsed.title}\n• ${parsed.parsedSummary}\n\nPuede que la hora o la repetición necesiten un ajuste. Ábrelo, revísalo y guárdalo tú.`,
    chips: yasminChips(
      { label: 'Revisar y guardar', action: 'yasmin-event' },
      { label: 'Prefiero escribirlo en la agenda', action: 'quick-add', id: parsed.date || todayISO() },
      yasminAgendaChip()
    )
  };
}

/* ---------- respuestas de conversación ---------- */
const YASMIN_EXTRA = {
  'solo quiero compania': 'Aquí estoy. No hace falta decir nada importante. Si quieres, cuéntame un detalle pequeño de tu día: qué comiste, qué viste por la ventana, qué canción tienes en la cabeza.',
  'solo quiero hablar': 'Te escucho. Empieza por donde te salga, aunque no tenga orden. Yo no voy a interrumpir ni a corregirte.',
  'quiero desahogarme': 'Dale. Escribe todo lo que tengas adentro, sin cuidar las palabras. Aquí no se ofende nadie y no se lo cuento a nadie.',
  'solo quiero descansar': 'Entonces descansa. Deja el celular a un lado, apaga la luz y date permiso. Mañana vemos qué sigue. Yo sigo aquí.',
  'ya me siento mejor': 'Me alegra. Guarda este momento en la memoria: cuando vuelva un día difícil, te va a servir saber que también pasan.',
  'es insoportable': 'Si el dolor es insoportable, no es para aguantar en casa. Llama a tu médico o ve a urgencias, sobre todo si hay debilidad, fiebre o algo nuevo. No estás exagerando.',
  'no he comido': 'Un vaso de agua y algo pequeño ya es un comienzo. No tienes que cocinar. Si llevas días sin comer bien, dilo en la próxima cita: también es un síntoma.',
  'si todo': 'Bien. Eso ya es sostener lo básico, y hoy cuenta. ¿Quieres hacer algo pequeño para ti o prefieres descansar?',
  'paso algo hoy': 'Cuéntame qué pasó, con el detalle que quieras. Y dime cómo te dejó: con rabia, con tristeza, con miedo, con cansancio.',
  'dame una frase': '«No tienes que arreglar toda la noche. Solo tienes que llegar a mañana, y mañana también se puede pedir ayuda.»',
  'bien': 'Qué bueno. ¿Quieres guardar qué hizo que hoy fuera distinto? Sirve para los días en que no recuerdes que existen.',
  'mas o menos': '"Más o menos" también es un lugar válido. ¿Qué es lo que más pesa ahora: el cuerpo, la cabeza o el entorno?',
  'no se': 'Está bien no saber. A veces el cuerpo siente antes de que la cabeza entienda. Empecemos por lo físico: ¿dormiste, comiste y tomaste tus medicamentos hoy?',
  'no tengo ganas de nada': 'Cuando no hay ganas de nada, el cuerpo está pidiendo algo muy básico: descanso, comida, agua o compañía. No te exijas. ¿Cuál de esas cuatro cosas te hace más falta ahora?'
};

function yasminExactReply(t) {
  const key = t.replace(/[.!?]+$/g, '').trim();
  if (YASMIN_EXTRA[key]) {
    return {
      text: YASMIN_EXTRA[key],
      chips: yasminChips(yasminCompaniaChip(), { label: 'Ver mi día', action: 'nav', id: 'hoy' })
    };
  }
  return null;
}

/* Frases que exigen una respuesta de seguridad inmediata. Se comparan sobre
   texto normalizado; las de varias palabras se buscan completas para no
   confundirlas con una conversación cotidiana. */
const YASMIN_RIESGO = [
  'quiero morir', 'me quiero morir', 'no quiero vivir', 'no quiero estar viva', 'no quiero estar vivo',
  'me quiero matar', 'me voy a matar', 'voy a matarme', 'matarme',
  'suicida', 'suicidas', 'suicidio', 'suicidarme', 'suicidar', 'me quiero suicidar', 'me voy a suicidar',
  'acabar conmigo', 'terminar conmigo', 'acabar con todo', 'quitarme la vida',
  'no vale la pena seguir viviendo', 'no vale la pena vivir', 'no quiero seguir viviendo',
  'no quiero despertar', 'quisiera no despertar', 'quiero estar muerta', 'quiero estar muerto',
  'para que vivir', 'para que seguir viviendo',
  'me quiero hacer dano', 'me voy a hacer dano', 'me estoy haciendo dano', 'me hice dano', 'ya me hice dano',
  'me quiero lastimar', 'quiero lastimarme', 'me quiero cortar', 'quiero cortarme', 'me estoy cortando',
  'me corte las venas', 'me corte los brazos', 'me corte la muneca',
  'tengo pastillas guardadas', 'me tome todas las pastillas', 'me tome todos los medicamentos',
  'tome de mas pastillas', 'sobredosis',
  'tengo un plan para matarme', 'tengo un plan para suicidarme',
  'soy una carga', 'siento que soy una carga', 'seria una carga', 'seria un alivio',
  'estarian mejor sin mi', 'todos estarian mejor sin mi', 'mi familia estaria mejor sin mi',
  'mejor sin mi', 'no le sirvo a nadie', 'ojala no haber nacido', 'ojala no existir',
  'me quiero ir de este mundo', 'quiero irme de este mundo', 'quiero que esto termine',
  'quiero que se acabe', 'no quiero seguir asi'
];

/* Estas frases indican que el daño ya ocurrió o que hay una sobredosis:
   la respuesta debe priorizar urgencias, no solo acompañamiento. */
const YASMIN_RIESGO_URGENTE = [
  'me hice dano', 'ya me hice dano', 'me estoy haciendo dano', 'me estoy cortando',
  'me corte las venas', 'me corte los brazos', 'me corte la muneca',
  'me tome todas las pastillas', 'me tome todos los medicamentos', 'tome de mas pastillas', 'sobredosis'
];

function yasminRiesgo(t) {
  if (!YASMIN_RIESGO.some(frase => yasminHas(t, frase))) return '';
  /* «Me quiero cortar el pelo» no es una señal de riesgo. */
  if (yasminHas(t, 'cortar') && yasminHas(t, 'pelo', 'cabello', 'unas')) return '';
  return YASMIN_RIESGO_URGENTE.some(frase => yasminHas(t, frase)) ? 'urgente' : 'alto';
}

function yasminCargaReply(t) {
  return {
    text: `Que te sientas una carga no significa que lo seas. Cuando el dolor lleva mucho tiempo, la cabeza empieza a contar una historia en la que todos estarían mejor sin ti. Esa historia no es la verdad: es el síntoma hablando.\n\nNo tienes que demostrarle nada a nadie ahora. Llama al 123 o al 106, o abre tu plan. Si puedes, dile a una persona de confianza: «estoy pensando que soy una carga y necesito que te quedes conmigo». No te quedes sola con esto.\n\nNo molestas. No eres un peso. Mereces ayuda ahora.`,
    chips: yasminChips(
      { label: 'Llamar al 123', action: 'llamar', id: 'tel:123' },
      { label: 'Llamar al 106', action: 'llamar', id: 'tel:106' },
      yasminPlanChip(),
      yasminCompaniaChip()
    )
  };
}

function yasminCrisisReply(t, nivel = 'alto') {
  const urgente = nivel === 'urgente';
  const explicitPlan = urgente || yasminHas(t, 'plan', 'intencion', 'ya me hice dano', 'me hice dano', 'tengo pastillas guardadas', 'tengo un cuchillo');
  return {
    text: urgente
      ? `Esto que me cuentas es serio y me importa. Si te estás haciendo daño, ya lo hiciste o tomaste de más, no esperes a ver cómo sigues: llama al 123 o ve a urgencias ahora. Si puedes, no te quedes sola, no tomes nada más y quédate cerca de alguien que pueda acompañarte.\n\nNo tienes que explicarlo perfecto. Lo importante ahora es que alguien te vea.`
      : `Te escucho, y no voy a minimizar lo que sientes.\n\nNo tienes que resolver esto sola ni ahora. Llama al 123 o al 106, o abre tu plan. ${explicitPlan ? 'Si hay un plan, una intención o ya te hiciste daño, ve a urgencias y que alguien se quede contigo. ' : 'Si en algún momento aparece un plan o una intención, no te quedes sola: ve a urgencias y que alguien te acompañe. '}Si puedes, aléjate de lo que te haría daño y entrégale los medicamentos a alguien de confianza.\n\nNo estás exagerando. No estás molestando. Esto merece ayuda ahora.`,
    chips: urgente
      ? yasminChips(
        { label: 'Llamar al 123', action: 'llamar', id: 'tel:123' },
        { label: 'Llamar al 106', action: 'llamar', id: 'tel:106' },
        yasminPlanChip()
      )
      : yasminChips(
        yasminPlanChip(),
        { label: 'Llamar al 123', action: 'llamar', id: 'tel:123' },
        { label: 'Llamar al 106', action: 'llamar', id: 'tel:106' },
        yasminBreatheChip()
      )
  };
}

function yasminTristezaReply(t) {
  const helps = personalSnippet('helps', 100);
  const hurts = personalSnippet('hurts', 100);
  const faith = personalSnippet('faith', 90);
  let extra = '';
  if (helps) extra += `\n\nMe contaste que te ayuda: ${helps}. ¿Quieres que empecemos por algo así, pequeño, sin exigirte?`;
  if (hurts) extra += `\n\nY me acuerdo de que no te hace bien: ${hurts}. Aquí no te voy a decir eso.`;
  if (faith) extra += `\n\nTambién me acuerdo de lo que te sostiene: ${faith}.`;
  if (!helps) {
    const memoria = yasminMemoriaLinea('tristeza');
    if (memoria) extra += `\n\n${memoria}`;
  }
  return {
    text: `Gracias por contármelo, de verdad.\n\nNo tienes que explicarlo bonito ni aguantar hasta que pase. Vienes cargando mucho — el cuerpo, los cambios, todo — y es normal que haya días así. No te hace débil.${extra}\n\nSi quieres probamos algo pequeño: un vaso de agua, abrir la ventana, o simplemente seguir hablando conmigo.\n\nY si prefieres oír una voz conocida, abajo están los de tu gente. A veces una llamada hace más que mil consejos.`,
    chips: yasminChips(
      ...yasminGenteChips(2),
      yasminCompaniaChip(),
      yasminMomentoChip()
    )
  };
}

function yasminAnsiedadReply() {
  const memoria = yasminMemoriaLinea('ansiedad');
  return {
    text: `La ansiedad engaña: hace sentir que hay que correr, pero no hay por dónde.\n\nEmpecemos por el cuerpo: inhala contando 4, aguanta 4, suelta en 6. Seis veces. Si puedes, pon los pies bien en el piso y mira alrededor — nombra cinco cosas que ves. Eso ancla.\n\nCuando baje el pico me cuentas qué la subió, no para analizarla sino para que la próxima no te agarre desprevenida.\n\nY si pesa mucho, llévasela a alguien de confianza: hablarla en voz alta le quita fuerza.${memoria ? `\n\n${memoria}` : ''}`,
    chips: yasminChips(
      yasminBreatheChip(),
      ...yasminGenteChips(2),
      { label: 'Ya me siento mejor', action: 'yasmin-chip', id: 'Ya me siento mejor' }
    )
  };
}

function yasminMiedoReply() {
  return {
    text: `El miedo no es exageración ni locura — es el cuerpo poniéndose en alerta, y eso agota solo.\n\nCuéntame: ¿es por algo que está pasando ahora, por la noche, por estar sola, o por algo que todavía no sabes nombrar? Decirlo, aunque sea entrecortado, ya lo hace más pequeño.\n\nY si sientes peligro de verdad, no te quedes sola ni un minuto: llama a alguien de tu gente o abre tu plan.`,
    chips: yasminChips(
      ...yasminGenteChips(2),
      yasminPlanChip(),
      yasminBreatheChip()
    )
  };
}

function yasminSuenoReply() {
  const rutinas = personalSnippet('routines', 90);
  const suenoProm = avgCheckin(7, 'sleepHours');
  const memoria = yasminMemoriaLinea('sueno');
  return {
    text: `Cuando no se puede dormir, la mente aprovecha para repasar todo lo que duele. No es tu culpa.\n\nTres cosas que sí ayudan: no quedarte en la cama dando vueltas (levántate, luz baja, algo tranquilo), no mirar la hora, y dejar el celular boca abajo. Si a los 20 minutos no hay sueño, vuelve cuando tengas ganas.${rutinas ? `\n\nMe contaste que tu rutina es: ${rutinas}. ¿Podemos hacer una versión más suave de eso esta noche?` : ''}${typeof suenoProm === 'number' ? `\n\nEn tus últimos 7 días registrados, el sueño promedia ${suenoProm} h.` : ''}${memoria ? `\n\n${memoria}` : ''}\n\n¿Quieres que te deje una frase para leer mientras tanto?`,
    chips: yasminChips(
      { label: 'Una frase para leer', action: 'yasmin-chip', id: 'Dame una frase' },
      { label: 'Ver pautas de sueño', action: 'nav', id: 'aprende' },
      { label: 'Registrar cómo dormí', action: 'nav', id: 'registro' }
    )
  };
}

function yasminDolorReply(t) {
  const dolorHoy = (findDay(todayISO())?.checkin || {}).pain;
  const dolorProm = avgCheckin(7, 'pain');
  const memoria = yasminMemoriaLinea('dolor');
  const fuerte = yasminHas(t, 'insoportable', 'no aguanto', 'no puedo moverme', 'se me durmio', 'perdi fuerza', 'no siento', 'fiebre', 'me cai');
  return {
    text: `El dolor que sientes es real, aunque no se vea. No es exageración ni debilidad.${typeof dolorHoy === 'number' ? ` Hoy lo pusiste en ${dolorHoy}/10.` : ''}${fuerte ? '\n\nLo que describes suena fuerte. Si hay fiebre, debilidad o no puedes caminar bien, eso se revisa YA: llama a tu médico o a tu gente ahora mismo, y yo me quedo aquí contigo mientras.' : ''}\n\nMientras tanto: cambia de posición, respira lento. Y si te sirve, después anotas dónde duele — eso le sirve muchísimo a tu médico.${memoria ? `\n\n${memoria}` : ''}`,
    chips: yasminChips(
      ...yasminGenteChips(2),
      fuerte ? { label: 'Llamar al 123', action: 'llamar', id: 'tel:123' } : { label: 'Es insoportable', action: 'yasmin-chip', id: 'Es insoportable' },
      { label: 'Registrar dolor', action: 'nav', id: 'registro' }
    )
  };
}

function yasminMedicamentosReply(t) {
  const pendientes = pendingDosesToday();
  if (yasminHas(t, 'ya tome', 'ya me tome', 'ya la tome', 'me tome la', 'ya las tome')) {
    return {
      text: pendientes.length
        ? `Bien. Si quieres, la marco como tomada para que el reporte de la consulta salga completo.\n\nLa primera pendiente es ${pendientes[0].med.name} ${pendientes[0].amount} de las ${pendientes[0].time}. Y por si no te lo dije: cada toma que registras es un pedacito de cuidado propio.`
        : `Ya tienes todas las tomas de hoy registradas. No hace falta hacer nada más. Eso también es cuidarte.\n\nSi te queda la duda de si tomaste una, no la repitas: anótalo y pregúntale a tu médico o a la farmacia.`,
      chips: yasminChips(
        pendientes.length ? { label: `Marcar ${pendientes[0].med.name}`, action: 'toggle-dose', id: pendientes[0].key } : { label: 'Ver medicamentos', action: 'nav', id: 'medicamentos' },
        { label: 'Ver todas', action: 'nav', id: 'medicamentos' }
      )
    };
  }
  if (!pendientes.length) {
    return {
      text: `Ya tienes todas las tomas de hoy registradas. No hace falta hacer nada más. Eso también es cuidarte.\n\nSi te queda la duda de si tomaste una, no la repitas: anótalo y pregúntale a tu médico o a la farmacia.`,
      chips: yasminChips(
        { label: 'Ver mis medicamentos', action: 'nav', id: 'medicamentos' },
        { label: 'Inventario', action: 'nav', id: 'medicamentos' }
      )
    };
  }
  const lista = pendientes.slice(0, 4).map(d => `• ${d.med.name} ${d.med.strength || ''} — ${d.amount} a las ${d.time}`).join('\n');
  return {
    text: `Estas son las tomas de hoy:\n\n${lista}\n\nSi ya tomaste alguna, dímelo y la marco. Sin prisa: van a seguir ahí cuando puedas. Y si se te pasó una, no tomes el doble.`,
    chips: yasminChips(
      { label: 'Ya la tomé', action: 'toggle-dose', id: pendientes[0].key },
      { label: 'Ver todas', action: 'nav', id: 'medicamentos' },
      { label: 'Se me olvidó una', action: 'yasmin-chip', id: 'Se me olvidó una toma' }
    )
  };
}

function yasminCitaReply(t) {
  const cita = nextAppointment();
  const next = nextAgendaItem();
  if (!cita && !next) {
    return {
      text: `Todavía no tienes citas agendadas en Andrea. Puedes agregar la fecha y la hora en Citas o en la Agenda, y yo te la recuerdo después.\n\n¿Quieres que abramos la agenda para dejarla anotada?`,
      chips: yasminChips(yasminAgendaChip(), { label: 'Ver citas', action: 'nav', id: 'citas' }, yasminHospitalChip())
    };
  }
  if (cita) {
    const cuando = cita.date ? `${formatLongDate(cita.date)}${cita.time ? ' a las ' + cita.time : ''}` : 'aún sin fecha';
    return {
      text: `Tu próxima cita es ${cita.title || cita.type}: ${cuando}${cita.place ? ', en ' + cita.place : ''}.\n\n${cita.status === 'por agendar' ? 'Está por agendar: vale la pena llamar hoy y dejar el radicado anotado.' : 'Si quieres, prepara tus preguntas antes para no olvidarlas en la consulta.'}`,
      chips: yasminChips(
        { label: 'Ver citas', action: 'nav', id: 'citas' },
        { label: 'Preparar consulta', action: 'nav', id: 'reporte' },
        cita.phone ? { label: 'Llamar', action: 'llamar', id: phoneHref(cita.phone) } : { label: 'Agregar teléfono', action: 'edit-appt', id: cita.id }
      )
    };
  }
  return {
    text: `Lo próximo en tu agenda es ${next.title}, ${yasminDateText(next.date)}${next.time ? ' a las ' + next.time : ''}.\n\nTus citas médicas están en la sección Citas; los recordatorios personales, en la Agenda.`,
    chips: yasminChips(yasminAgendaChip(), { label: 'Ver citas', action: 'nav', id: 'citas' })
  };
}

function yasminHistoriaReply() {
  const nombre = profileName();
  const partes = [];
  const add = (label, key, max) => {
    const value = personalSnippet(key, max);
    if (value) partes.push(`${label}: ${value}${/[.!?]$/.test(value) ? '' : '.'}`);
  };
  add('Tu gente', 'family', 130);
  add('Lo que te sostiene', 'faith', 110);
  add('Lo que te ayuda', 'helps', 110);
  add('Lo que te gusta', 'likes', 110);
  add('Lo que te hace daño', 'hurts', 110);
  add('Tus rutinas', 'routines', 100);
  add('Tus palabras', 'words', 90);
  add('Tus sueños', 'dreams', 100);
  add('Fechas importantes', 'dates', 100);
  add('Tus mascotas', 'pets', 100);
  const aprendidas = memoryList('', 3).map(f => f.text).filter(Boolean);
  if (aprendidas.length) partes.push(`De lo que hemos hablado: ${aprendidas.join('; ')}`);
  const quien = nombre ? `, ${nombre}` : '';
  if (!partes.length) {
    return {
      text: `Todavía no me has contado mucho de ti${quien}. Y no tienes que hacerlo todo hoy.\n\nSi quieres, empieza por una sola cosa: cómo te llaman, quién es tu gente o qué te ayuda cuando un día pesa. Yo lo voy a recordar en este teléfono y lo tendré en cuenta cuando hablemos.`,
      chips: yasminChips(
        { label: 'Abrir mi historia', action: 'nav', id: 'historia' },
        { label: 'Seguir hablando', action: 'yasmin-chip', id: 'Solo quiero hablar' }
      )
    };
  }
  return {
    text: `Esto es lo que tengo presente de ti${quien}:\n\n${partes.slice(0, 5).join('\n')}\n\nNo es una ficha: es lo que me ayuda a no hablarte como a una desconocida. Si algo cambió, puedes corregirlo en Mi historia.`,
    chips: yasminChips(
      { label: 'Abrir mi historia', action: 'nav', id: 'historia' },
      { label: 'Ver mi memoria', action: 'nav', id: 'memoria' },
      { label: 'Seguir hablando', action: 'yasmin-chip', id: 'Solo quiero hablar' }
    )
  };
}

function yasminAyudaReply(t) {
  const pideDano = yasminHas(t, 'que me hace dano', 'lo que me hace dano', 'que me lastima', 'lo que me lastima', 'me hace dano', 'me lastima', 'me molesta');
  const helps = personalSnippet('helps', 180);
  const hurts = personalSnippet('hurts', 180);
  const faith = personalSnippet('faith', 110);
  const ayudaTexto = helps || memoryList('ayuda', 3).map(f => f.text).join('; ');
  const danoTexto = hurts || memoryList('evitar', 3).map(f => f.text).join('; ');
  if (pideDano) {
    return {
      text: danoTexto
        ? `Me contaste que te hace daño: «${danoTexto}».\n\nNo voy a usar esas palabras contigo. Si alguien las usa y te duelen, no estás exagerando: puedes poner un límite o pedir espacio.`
        : `Todavía no me has contado qué te hace daño. Puede ser una frase, un ruido, una forma de mirarte o una persona. Si quieres, escríbelo en Mi historia y lo voy a tener en cuenta.`,
      chips: yasminChips(
        { label: 'Editar mi historia', action: 'nav', id: 'historia' },
        { label: 'Quiero desahogarme', action: 'yasmin-chip', id: 'Quiero desahogarme' }
      )
    };
  }
  return {
    text: ayudaTexto
      ? `Me contaste que te ayuda: «${ayudaTexto}».${faith ? `\n\nTambién me contaste de tu fe: ${faith}.` : ''}\n\n¿Quieres intentar algo de eso hoy, o prefieres que solo te acompañe?`
      : `Todavía no me has contado qué te ayuda cuando estás mal. Puede ser algo pequeño: silencio, una llamada, agua fría, una oración. Si quieres, escríbelo en Mi historia y lo voy a recordar.`,
    chips: yasminChips(
      { label: 'Editar mi historia', action: 'nav', id: 'historia' },
      { label: 'Respirar conmigo', action: 'respirar' },
      { label: 'Solo compañía', action: 'yasmin-chip', id: 'Solo quiero compañía' }
    )
  };
}

function yasminGustosReply(raw) {
  const likes = personalSnippet('likes', 160);
  const memoria = memoryList('gusto', 2).map(f => f.text).filter(Boolean).join('; ');
  const dicho = String(raw || '').replace(/^(me gusta|me encanta|amo|quiero|me provoca|se me antoja)\s+(tomar\s+)?/i, '').replace(/[.!?]+$/, '').trim();
  const repetido = dicho && memoria && (memoryFold(memoria).includes(memoryFold(dicho)) || memoryFold(dicho).includes(memoryFold(memoria)));
  return {
    text: `Qué bueno${dicho ? `: ${dicho}` : ''}.${likes ? ` Me acuerdo de que también te gusta: ${likes}.` : memoria && !repetido ? ` También recuerdo que te gusta: ${memoria}.` : ''}\n\nLos gustos también son una forma de saber quién eres. Lo guardé en tu memoria; puedes verlo o borrarlo cuando quieras.`,
    chips: yasminChips(
      { label: 'Ver mi memoria', action: 'nav', id: 'memoria' },
      { label: 'Seguir hablando', action: 'yasmin-chip', id: 'Solo quiero hablar' }
    )
  };
}

function yasminFamiliaReply() {
  const family = personalSnippet('family', 120);
  const moments = state.momentos.length;
  return {
    text: `Tu familia dejó cosas aquí para ti. No son mensajes que exijan respuesta: son recordatorios de que hay gente que piensa en ti incluso cuando no estás mirando el celular.${family ? `\n\nMe contaste de tu gente: ${family}.` : ''}\n\n${moments ? '¿Quieres ver uno?' : 'Momentos está en pausa mientras organizas los recuerdos. Cuando estén listos, aparecerán aquí.'}`,
    chips: yasminChips(
      moments ? yasminMomentoChip() : { label: 'Abrir Momentos', action: 'nav', id: 'momentos' },
      moments ? { label: 'Todos los momentos', action: 'nav', id: 'momentos' } : { label: 'Abrir mi historia', action: 'nav', id: 'historia' }
    )
  };
}

function yasminFeReply() {
  const faith = personalSnippet('faith', 180);
  return {
    text: `Tu fe ha sostenido cosas que nadie más vio. No es un adorno: es parte de cómo has sobrevivido.${faith ? `\n\nMe contaste: ${faith}.` : ''}\n\nSi hoy quieres rezar, hazlo sin pedir permiso. Y si quieres, cuéntame qué le estás pidiendo. A veces decirlo en voz alta ordena el corazón.`,
    chips: yasminChips(
      { label: 'Escribir una oración', action: 'nav', id: 'reflexiones' },
      yasminMomentoChip()
    )
  };
}

function yasminSoledadReply() {
  const red = state.contacts.filter(c => c.phone).slice(0, 2);
  const family = personalSnippet('family', 100);
  return {
    text: `Estar sola y sentirte sola no son lo mismo, pero las dos duelen.\n\nAhora mismo hay personas que respondieron por ti: ${red.length ? red.map(c => c.name).join(' y ') : 'tu familia'}. No tienes que escribirles un discurso. Un "hola, ¿estás?" basta para romper el silencio.${family ? `\n\nMe contaste de tu gente: ${family}.` : ''}\n\nY si no quieres hablar con nadie todavía, quédate aquí un rato. Yo no me voy.`,
    chips: yasminChips(
      red.length ? { label: `Escribirle a ${red[0].name}`, action: 'llamar', id: phoneHref(red[0].phone) } : null,
      yasminMomentoChip(),
      { label: 'Modo mínimo', action: 'minimum' }
    )
  };
}

function yasminRabiaReply() {
  return {
    text: `La rabia también es información: algo te está doliendo o te está faltando el respeto. No hay que tragársela para ser "buena".\n\nSi puedes, descárgala aquí sin filtro. Nadie más la va a leer. Y si quieres, después vemos juntas qué necesitas pedir o poner como límite.`,
    chips: yasminChips(
      { label: 'Quiero desahogarme', action: 'yasmin-chip', id: 'Quiero desahogarme' },
      { label: 'Escribir en reflexiones', action: 'nav', id: 'reflexiones' }
    )
  };
}

function yasminCansancioReply() {
  const memoria = yasminMemoriaLinea('cansancio');
  return {
    text: `El cansancio de estos meses no es pereza: es el cuerpo cobrando lo que ha sostenido. Duelo, dolor, hospital, trámites, miedo.\n\nHoy no toca rendir. Toca lo mínimo: medicamentos, agua, algo de comer, y avisar que estás aquí. Lo demás puede esperar a mañana.${memoria ? `\n\n${memoria}` : ''}`,
    chips: yasminChips(
      { label: 'Modo mínimo', action: 'minimum' },
      ...yasminGenteChips(2),
      { label: 'Solo descansar', action: 'yasmin-chip', id: 'Solo quiero descansar' }
    )
  };
}

function yasminCuerpoReply() {
  return {
    text: `Un vaso de agua y algo sencillo ya cuentan. No necesitas cocinar un plato perfecto.\n\nSi no tienes hambre por los medicamentos o por el ánimo, prueba algo pequeño y frecuente: fruta, pan, yogur. Y si llevas días sin comer bien, dilo en la próxima cita.`,
    chips: yasminChips(
      { label: 'Modo mínimo', action: 'minimum' },
      { label: 'Registrar cómo estoy', action: 'nav', id: 'registro' }
    )
  };
}

function yasminEjercicioReply() {
  const total = state.exercises.length;
  return {
    text: total ? `Tienes ${total} ejercicios en tu plan. No hay que hacerlos todos: elige dos que puedas hacer sin dolor y registra cómo estabas antes y después.\n\nSi un movimiento duele más, se suspende. La constancia vale más que la cantidad.` : `Todavía no hay ejercicios cargados. Cuando los tengas, aquí te digo cuáles tocan.`,
    chips: yasminChips(
      { label: 'Ver ejercicios', action: 'nav', id: 'ejercicios' },
      { label: 'Registrar dolor', action: 'nav', id: 'registro' }
    )
  };
}

function yasminSaludoReply() {
  const nombre = profileName();
  const pend = pendingDosesToday();
  const next = nextAgendaItem();
  let extra = '';
  if (pend.length) extra = `\n\nPor cierto, queda${pend.length > 1 ? 'n' : ''} ${pend.length} toma${pend.length > 1 ? 's' : ''} por hoy, sin prisa. La primera es ${pend[0].med.name} a las ${pend[0].time}.`;
  else if (next) extra = `\n\n${yasminNextAgendaText()}`;
  return {
    text: `${greeting()}${nombre ? ', ' + nombre : ''}. Me alegra que estés aquí.${extra}\n\n¿Cómo va el día? Un "bien", un "más o menos" o hasta un "no sé" — todo vale, no hay respuesta mala.`,
    chips: yasminChips(
      { label: 'Bien', action: 'yasmin-chip', id: 'Bien' },
      { label: 'Más o menos', action: 'yasmin-chip', id: 'Más o menos' },
      { label: 'No sé', action: 'yasmin-chip', id: 'No sé' }
    )
  };
}

function yasminIdentidadReply() {
  const recuerdos = memoryCount();
  return {
    text: `Soy ${yasminName()}. No soy una persona ni una terapeuta: soy una compañera que vive en este teléfono.\n\nConozco tus medicamentos, tus citas y lo que has registrado, porque están aquí mismo, en tu dispositivo.${personalHasData() ? '\n\nTambién me has contado parte de tu historia, y la tengo presente para no hablarte como a una desconocida.' : ''}${recuerdos ? `\n\nHe aprendido ${recuerdos} ${recuerdos === 1 ? 'cosa' : 'cosas'} de lo que me has contado. Puedes verlas y borrarlas cuando quieras.` : ''} Puedo recordarte cosas, ayudarte a respirar y quedarme contigo cuando no quieres hablar con nadie más.`,
    chips: yasminChips(
      { label: '¿Qué puedes hacer?', action: 'yasmin-chip', id: '¿Qué puedes hacer?' },
      { label: 'Mi historia', action: 'nav', id: 'historia' },
      recuerdos ? { label: 'Ver mi memoria', action: 'nav', id: 'memoria' } : null
    )
  };
}

function yasminCapacidadesReply() {
  return {
    text: `Puedo hacer varias cosas contigo:\n\n• Decirte qué medicamento te toca y marcarlo.\n• Recordarte tu próxima cita y ayudarte a prepararla.\n• Mostrarte tu agenda y crear recordatorios.\n• Escucharte sin apuro cuando el día pesa.\n• Respirar contigo y abrir tu plan si te sientes en peligro.\n• Mostrarte un momento de tu familia.\n• Leer mis respuestas en voz alta y escucharte por micrófono.\n• Tener en cuenta tu historia y lo que me cuentas para hablarte como alguien que te conoce.\n• Mostrarte tu checklist y lo que has cumplido hoy.\n• Ver contigo qué patrones aparecen en tus registros.\n\n¿Por dónde empezamos?`,
    chips: yasminChips(
      { label: '¿Qué me toca?', action: 'yasmin-chip', id: '¿Qué me toca hoy?' },
      { label: 'Mi checklist', action: 'yasmin-chip', id: 'Mi checklist de hoy' },
      yasminBreatheChip()
    )
  };
}

function yasminContextReply(t) {
  const mem = state.yasminMemory || {};
  const short = yasminTokens(t).length <= 3;
  if (!short) return null;
  const afirmativo = ['si', 'claro', 'dale', 'listo', 'bueno', 'de una', 'hagale', 'hagamoslo', 'va'];
  const negativo = ['no', 'nel', 'nop', 'todavia no', 'aun no', 'despues'];
  const esAfirmativo = afirmativo.includes(t);
  const esNegativo = negativo.includes(t);
  if (esAfirmativo) {
    if (mem.awaiting === 'plan') return yasminCrisisReply(t);
    if (mem.awaiting === 'breathe') return { text: 'Vamos. Inhala por la nariz contando cuatro. Sostén cuatro. Exhala por la boca contando seis. Otra vez.\n\nNo tienes que hacerlo perfecto. Solo seguir el círculo.', chips: yasminChips({ label: 'Empezar', action: 'respirar' }) };
    if (mem.awaiting === 'food') return yasminCuerpoReply();
    if (mem.awaiting === 'event') return { text: 'Perfecto. Abre el formulario, revisa la fecha y la hora, y guárdalo. Yo lo tendré en cuenta.', chips: yasminChips({ label: 'Abrir formulario', action: 'quick-add' }, yasminAgendaChip()) };
    return { text: 'Aquí estoy. ¿Qué necesitas ahora: hablar, descansar, comer algo o que te recuerde tus pendientes?', chips: yasminChips({ label: 'Solo compañía', action: 'yasmin-chip', id: 'Solo quiero compañía' }, { label: 'Mis pendientes', action: 'nav', id: 'hoy' }) };
  }
  if (esNegativo) {
    if (mem.awaiting === 'food') return { text: 'Está bien. No tienes que comer un plato entero. Un sorbo de agua, una fruta, una galleta. Lo mínimo también cuenta. Si sigues sin poder comer, avísale a alguien de tu red.', chips: yasminChips({ label: 'Modo mínimo', action: 'minimum' }, yasminCompaniaChip()) };
    return { text: 'Está bien. No tienes que hacer nada ahora. Me quedo contigo un rato, sin apuro.', chips: yasminChips(yasminCompaniaChip(), yasminBreatheChip()) };
  }
  if (t === 'eso' || t === 'esto' || t === 'por eso' || t === 'si eso') {
    if (mem.topic === 'tristeza') return yasminTristezaReply(t);
    if (mem.topic === 'ansiedad') return yasminAnsiedadReply();
    if (mem.topic === 'dolor') return yasminDolorReply(t);
    if (mem.topic === 'sueno') return yasminSuenoReply();
    if (mem.topic === 'soledad') return yasminSoledadReply();
    if (mem.topic === 'rabia') return yasminRabiaReply();
  }
  return null;
}

/* ---------- núcleo de respuesta ---------- */
function yasminPensar(texto) {
  const raw = String(texto || '').trim();
  const t = yasminNorm(raw);
  const emotion = yasminEmotion(t);
  /* Aprender antes de responder permite usar lo que acaba de contar. */
  if (typeof yasminAprender === 'function') yasminAprender(raw, '', 'chat');
  const mem = state.yasminMemory || {};

  /* 1. Riesgo: primero, sin rodeos y sin sermón */
  const riesgo = yasminRiesgo(t);
  if (riesgo) {
    yasminRemember({ topic: 'crisis', mood: 'crisis', intent: 'riesgo', awaiting: 'plan' });
    if (yasminHas(t, 'carga', 'mejor sin mi', 'alivio', 'no le sirvo a nadie')) return yasminCargaReply(t);
    return yasminCrisisReply(t, riesgo);
  }

  /* 2. Desaparecer: agotamiento, no capricho; se sostiene la red de seguridad */
  if (yasminHas(t, 'desaparecer', 'no quiero estar aqui', 'no quiero estar aca', 'no quiero existir')) {
    yasminRemember({ topic: 'desaparecer', mood: 'agotamiento', intent: 'desaparecer', awaiting: 'plan' });
    return {
      text: `Que quieras desaparecer no es un capricho ni una amenaza: es una señal de que estás cargando demasiado. No me asusto ni te voy a sermonear.\n\n¿Desaparecer de qué? ¿De la gente, de las preocupaciones, de sentir esto? Si en algún momento aparece la idea de hacerte daño, no te quedes sola: abre tu plan o llama al 123. Mientras tanto, quédate aquí conmigo un rato.`,
      chips: yasminChips(yasminCompaniaChip(), yasminPlanChip(), yasminBreatheChip())
    };
  }

  /* 2b. Frase del día: Yasmin razona la frase de la mariposa con la semana real */
  if (yasminHas(t, 'frase de hoy', 'mi frase de hoy', 'cuentame de mi frase', 'cuéntame de mi frase', 'la frase de la mariposa', 'que significa mi frase')) {
    yasminRemember({ topic: 'frase', mood: emotion.key || '', intent: 'frase', awaiting: '' });
    return yasminFraseReply();
  }

  /* 2c. Alegría: los días buenos también merecen conversación */
  if (yasminHas(t, 'me siento bien', 'me siento contenta', 'me siento feliz', 'me fue bien', 'me salio bien', 'me salió bien', 'estoy contenta', 'estoy feliz', 'estoy alegre', 'que felicidad', 'qué felicidad', 'logre ', 'lo logre', 'pude ', 'me dio risa', 'me hizo reir', 'me hizo reír', 'fue un buen dia', 'fue un buen día', 'hoy me fue bien', 'gracias a dios', 'gracias a dios me siento')) {
    yasminRemember({ topic: 'alegria', mood: 'calma', intent: 'alegria', awaiting: '' });
    const detalle = t.replace(/^(me siento|estoy|me fue|me salio|me salió|que|qué)\s+/i, '').trim();
    const bueno = detalle && detalle.length > 3 ? ` «${detalle.slice(0, 90)}»` : '';
    return {
      text: `¡Qué bueno, Andrea! Esto también va para tu historia: no solo los días difíciles.${bueno ? ' ' + bueno.charAt(0).toUpperCase() + bueno.slice(1) : ''} — eso es algo que vale la pena conservar.\n\nGuardémoslo: cuando vuelva un día difícil, saber que también pasan días así es medicina.`,
      chips: yasminChips(
        { label: 'Guardar lo bueno de hoy', action: 'nav', id: 'hoy' },
        { label: 'Cuéntame más', action: 'yasmin-chip', id: 'Solo quiero hablar' },
        { label: 'Ver mi panorama', action: 'yasmin-chip', id: '¿Qué has notado esta semana?' }
      )
    };
  }

  /* 2b. Lo que necesita de mí ahora: escucha, silencio o permiso para no hablar */
  if (yasminHas(t, 'solo necesito que me escuches', 'solo quiero que me escuches', 'no quiero consejos', 'no me des consejos', 'solo escuchame', 'necesito que me escuches')) {
    yasminRemember({ topic: 'compania', mood: emotion.key || '', intent: 'escucha', awaiting: '' });
    return {
      text: `Aquí estoy. Sin consejos, sin apurar, sin "hay que ver el lado bueno".\n\nCuenta como te salga — entrecortado, sin sentido, con rabia. Aquí no se juzga nada.\n\nY si en algún momento prefieres una voz conocida, abajo está tu gente: no es rendirse, es cuidarse.`,
      chips: yasminChips(...yasminGenteChips(2), yasminCompaniaChip(), yasminBreatheChip())
    };
  }
  if (yasminHas(t, 'no quiero molestar', 'siento que molesto', 'no quiero ser una molestia')) {
    yasminRemember({ topic: 'compania', mood: emotion.key || '', intent: 'molestia', awaiting: '' });
    return {
      text: `No molestas. Pedir compañía no es una molestia, y hablar de lo que te pasa no te hace una carga.\n\nSi hoy solo puedes decir «no estoy bien», con eso me basta para quedarme contigo.`,
      chips: yasminChips(yasminCompaniaChip(), yasminBreatheChip(), yasminPlanChip())
    };
  }
  if (yasminHas(t, 'no quiero hablar', 'dejame en paz', 'no quiero nada ahora', 'no quiero hablar ahora')) {
    yasminRemember({ topic: 'silencio', mood: emotion.key || '', intent: 'silencio', awaiting: '' });
    return {
      text: `Está bien. No te voy a insistir ni te voy a llenar de preguntas.\n\nDejo esto aquí. Si en un rato quieres compañía, abre mi plan o escríbeme una sola palabra. No tienes que explicar nada.`,
      chips: yasminChips(yasminPlanChip(), yasminCompaniaChip())
    };
  }

  /* 3. Respuestas exactas de los chips */
  const exacto = yasminExactReply(t);
  if (exacto) {
    yasminRemember({ topic: mem.topic || 'compania', mood: emotion.key || mem.mood || '', intent: 'compania', awaiting: '' });
    return exacto;
  }

  /* 4. Contexto de conversación: «sí», «no», «eso» */
  const contextual = yasminContextReply(t);
  if (contextual) {
    yasminRemember({ intent: 'contexto', awaiting: '' });
    return contextual;
  }

  /* 5. Lo que ha contado de su historia, sus gustos y lo que le ayuda */
  if (yasminHas(t, 'que sabes de mi', 'que te he contado', 'que recuerdas de mi', 'mi historia', 'quien soy', 'como me llaman', 'mi nombre')) {
    yasminRemember({ topic: 'historia', mood: emotion.key || '', intent: 'historia', awaiting: '' });
    return yasminHistoriaReply();
  }
  if (/^(me ayuda|me calma|me hace bien|me sostiene)\b/.test(t) || /^(me hace dano|me lastima|me molesta)\b/.test(t)) {
    yasminRemember({ topic: 'ayuda', mood: emotion.key || '', intent: 'ayuda', awaiting: '' });
    return yasminAyudaReply(t);
  }
  if (yasminHas(t, 'que me ayuda', 'que te ayuda', 'lo que me ayuda', 'que me calma', 'que me hace bien', 'que me hace dano', 'lo que me hace dano', 'que me lastima', 'lo que me lastima')) {
    yasminRemember({ topic: 'ayuda', mood: emotion.key || '', intent: 'ayuda', awaiting: '' });
    return yasminAyudaReply(t);
  }
  if (/^(me gusta|me encanta|amo)\b/.test(t) || /^(quiero|me provoca|se me antoja)\s+(tomar\s+)?(cafe|pan|algo dulce|una novela|musica)/.test(t) || yasminHas(t, 'mi comida favorita', 'mi musica favorita', 'mi lugar favorito')) {
    yasminRemember({ topic: 'gustos', mood: emotion.key || '', intent: 'gustos', awaiting: '' });
    return yasminGustosReply(raw);
  }

  /* 6. «No estoy bien» antes de cualquier «bien» positivo */
  if (yasminHas(t, 'no estoy bien', 'no me siento bien', 'no estoy nada bien', 'estoy mal', 'me siento mal', 'estoy horrible', 'estoy fatal', 'estoy destruida', 'no doy mas', 'necesito ayuda', 'ayudame por favor', 'no aguanto mas', 'ya no aguanto')) {
    yasminRemember({ topic: 'malestar', mood: 'mal', intent: 'desahogo', awaiting: 'body' });
    return {
      text: `Gracias por decírmelo. No tengo que convencerte de que estés bien, y no voy a pedirte que expliques nada bonito.\n\nCuando uno dice "ya no aguanto", ya cargó demasiado. Si quieres lo contamos juntas, lo que salga y como salga. Y si lo que necesitas ahora es una voz de verdad, aquí está tu gente — una llamada también es valentía.`,
      chips: yasminChips(
        ...yasminGenteChips(2),
        yasminCompaniaChip(),
        yasminBreatheChip()
      )
    };
  }

  /* 7. Comandos de agenda: «recuérdame…» */
  const draft = yasminDraftFromText(raw);
  if (draft) {
    yasminRemember({ topic: 'agenda', mood: emotion.key || '', intent: 'crear_evento', awaiting: 'event' });
    return draft;
  }

  /* 7. Checklist y panorama: lo que ya está registrado, sin inventar. */
  if (yasminHas(t, 'checklist', 'mi lista de hoy', 'que me falta hoy', 'lo que me falta hoy', 'mis pendientes de hoy', 'que tengo pendiente hoy')) {
    yasminRemember({ topic: 'checklist', mood: emotion.key || '', intent: 'checklist', awaiting: '' });
    return yasminChecklistReply();
  }
  if (yasminHas(t, 'que has notado', 'como voy', 'mi panorama', 'mi progreso', 'esta semana', 'mis patrones', 'que dicen mis registros', 'que ves en mi', 'como he estado')) {
    yasminRemember({ topic: 'panorama', mood: emotion.key || '', intent: 'panorama', awaiting: '' });
    return yasminPanoramaReply();
  }

  /* 7. Consultas de agenda */
  if (yasminHas(t, 'agenda', 'calendario') || /que (hay|tengo|me toca|toca) (hoy|manana|el|esta|este)|que hay en mi agenda|mi agenda|mis pendientes/.test(t)) {
    if (yasminHas(t, 'que me toca', 'que tengo que tomar', 'que me falta', 'que hay hoy', 'como va mi dia', 'que hago hoy')) {
      yasminRemember({ topic: 'dia', mood: emotion.key || '', intent: 'plan_hoy', awaiting: '' });
      return yasminPlanHoy();
    }
    yasminRemember({ topic: 'agenda', mood: emotion.key || '', intent: 'ver_agenda', awaiting: '' });
    return yasminAgendaQuery(raw);
  }

  /* 8. Medicamentos */
  if (yasminHas(t, 'se me olvido', 'olvide una toma', 'olvide la toma', 'se me paso una toma', 'se me paso la toma')) {
    yasminRemember({ topic: 'medicamentos', mood: emotion.key || '', intent: 'omision', awaiting: '' });
    return {
      text: `No pasa nada. Lo importante es no duplicar la dosis.\n\nRegistra la omisión con el motivo —así el psiquiatra ve el patrón real y no una versión ideal— y si es una toma crítica, llama a tu médico o a la farmacia antes de decidir.`,
      chips: yasminChips({ label: 'Registrar la omisión', action: 'nav', id: 'medicamentos' }, yasminHospitalChip())
    };
  }
  if (yasminHas(t, 'pastilla', 'medicamento', 'medicina', 'dosis', 'capsula', 'tableta', 'remedio', 'farmacia', 'ya la tome', 'ya me tome', 'ya tome', 'me tome la', 'no he tomado', 'mi toma', 'hora de la toma', 'tomar la pastilla', 'tomar el medicamento', 'tomar la medicina', 'tomar mis pastillas', 'tomar mis medicamentos', 'que me toca tomar', 'que tengo que tomar')) {
    yasminRemember({ topic: 'medicamentos', mood: emotion.key || '', intent: 'medicamentos', awaiting: '' });
    return yasminMedicamentosReply(t);
  }

  /* 9. Citas y trámites */
  if (yasminHas(t, 'cita', 'citas', 'psiquiatra', 'psicolog', 'fisiatr', 'terapia', 'control', 'medico', 'eps', 'autorizacion', 'incapacidad', 'tramite')) {
    yasminRemember({ topic: 'citas', mood: emotion.key || '', intent: 'citas', awaiting: '' });
    return yasminCitaReply(t);
  }

  /* 10. Sueño */
  if (yasminHas(t, 'dormir', 'insomnio', 'no duermo', 'despierta', 'desvelada', 'sueño', 'descansar', 'no puedo dormir', 'pesadilla')) {
    yasminRemember({ topic: 'sueno', mood: emotion.key || '', intent: 'sueno', awaiting: 'breathe' });
    return yasminSuenoReply();
  }

  /* 11. Dolor físico */
  if (yasminHas(t, 'duele', 'dolor', 'adolorida', 'espalda', 'cabeza', 'cuello', 'pierna', 'piernas', 'brazo', 'brazos', 'rodilla', 'rodillas', 'cadera', 'manos', 'hombro', 'hombros', 'articulacion', 'cintura')) {
    yasminRemember({ topic: 'dolor', mood: emotion.key || '', intent: 'dolor', awaiting: '' });
    return yasminDolorReply(t);
  }

  /* 12. Ansiedad y miedo */
  if (yasminHas(t, 'ansiedad', 'ansiosa', 'nervios', 'nerviosa', 'panico', 'angustia', 'taquicardia', 'me falta el aire', 'no puedo respirar', 'oprimida', 'acelerada', 'temblor')) {
    yasminRemember({ topic: 'ansiedad', mood: 'ansiedad', intent: 'ansiedad', awaiting: 'breathe' });
    return yasminAnsiedadReply();
  }
  if (yasminHas(t, 'miedo', 'asustada', 'susto', 'terror', 'me da miedo', 'temor')) {
    yasminRemember({ topic: 'miedo', mood: 'miedo', intent: 'miedo', awaiting: '' });
    return yasminMiedoReply();
  }

  /* 13. Rabia */
  if (yasminHas(t, 'rabia', 'furia', 'ira', 'enojada', 'molesta', 'injusto', 'injusticia', 'odio', 'me hierve')) {
    yasminRemember({ topic: 'rabia', mood: 'rabia', intent: 'rabia', awaiting: '' });
    return yasminRabiaReply();
  }

  /* 14. Tristeza, vacío, culpa */
  if (yasminHas(t, 'triste', 'tristeza', 'llorar', 'llorando', 'lloro', 'vacia', 'desanimada', 'sin ganas', 'desesperanza', 'inutil', 'fracasada', 'culpa', 'culpable', 'no valgo', 'no sirvo')) {
    yasminRemember({ topic: 'tristeza', mood: 'tristeza', intent: 'tristeza', awaiting: '' });
    return yasminTristezaReply(t);
  }

  /* 15. Soledad */
  if (yasminHas(t, 'sola', 'solo', 'nadie', 'abandonada', 'no tengo a nadie', 'me siento sola')) {
    yasminRemember({ topic: 'soledad', mood: 'soledad', intent: 'soledad', awaiting: '' });
    return yasminSoledadReply();
  }

  /* 16. Cansancio */
  if (yasminHas(t, 'cansada', 'agotada', 'agotamiento', 'sin fuerzas', 'no tengo fuerzas', 'sin energia', 'no puedo mas', 'no puedo con esto', 'no puedo con nada', 'todo me supera', 'desgastada')) {
    yasminRemember({ topic: 'cansancio', mood: 'cansancio', intent: 'cansancio', awaiting: '' });
    return yasminCansancioReply();
  }

  /* 17. Familia y momentos */
  if (yasminHas(t, 'familia', 'hijo', 'hijos', 'hija', 'hijas', 'mama', 'recuerdo', 'foto', 'fotos', 'momento', 'nieto', 'nietos', 'nieta', 'nietas', 'hermano', 'hermana', 'papa')) {
    yasminRemember({ topic: 'familia', mood: emotion.key || '', intent: 'familia', awaiting: '' });
    return yasminFamiliaReply();
  }

  /* 18. Fe y sentido */
  if (yasminHas(t, 'dios', 'fe', 'energia', 'milagro', 'orar', 'oracion', 'rezo', 'rezar', 'universo', 'senor', 'virgen', 'espiritual')) {
    yasminRemember({ topic: 'fe', mood: emotion.key || '', intent: 'fe', awaiting: '' });
    return yasminFeReply();
  }

  /* 19. Cuerpo básico */
  if (yasminHas(t, 'comer', 'comida', 'hambre', 'agua', 'tomar agua', 'desayune', 'almorce', 'cene')) {
    yasminRemember({ topic: 'cuerpo', mood: emotion.key || '', intent: 'comida', awaiting: 'food' });
    return yasminCuerpoReply();
  }

  /* 20. Ejercicio */
  if (yasminHas(t, 'ejercicio', 'fisioterapia', 'mover', 'caminar', 'estirar', 'movilidad')) {
    yasminRemember({ topic: 'ejercicio', mood: emotion.key || '', intent: 'ejercicio', awaiting: '' });
    return yasminEjercicioReply();
  }

  /* 21. Social */
  if (yasminHas(t, 'hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'quiubo', 'hey', 'buenas', 'que mas', 'que hubo')) {
    yasminRemember({ topic: 'saludo', mood: emotion.key || '', intent: 'saludo', awaiting: '' });
    return yasminSaludoReply();
  }
  if (t === 'bien' || yasminHas(t, 'estoy bien', 'mejor', 'tranquila', 'contenta', 'feliz', 'aliviada')) {
    yasminRemember({ topic: 'bienestar', mood: 'bien', intent: 'bienestar', awaiting: '' });
    return {
      text: `Qué bueno. Y ojo: no hay que desconfiar de los días buenos. Se pueden disfrutar sin miedo a que se dañen.\n\n¿Quieres guardar qué hizo que hoy fuera distinto? Sirve para los días en que no recuerdes que existen.`,
      chips: yasminChips({ label: 'Guardar lo bueno', action: 'nav', id: 'reflexiones' }, { label: 'Un paso pequeño', action: 'nav', id: 'hoy' })
    };
  }
  if (yasminHas(t, 'mas o menos', 'regular', 'ahi', 'asi asi')) {
    yasminRemember({ topic: 'mas_o_menos', mood: 'regular', intent: 'estado', awaiting: 'body' });
    return {
      text: `"Más o menos" también es un lugar válido. No todo tiene que ser crisis o alegría.\n\n¿Qué es lo que más pesa ahora mismo: el cuerpo, la cabeza o el entorno?`,
      chips: yasminChips({ label: 'El cuerpo', action: 'yasmin-chip', id: 'Me duele mucho' }, { label: 'La cabeza', action: 'yasmin-chip', id: 'Me siento triste' }, { label: 'El entorno', action: 'yasmin-chip', id: 'Estoy cansada de todo' })
    };
  }
  if (t === 'no se' || yasminHas(t, 'no se que hacer', 'no se que decir')) {
    yasminRemember({ topic: 'no_se', mood: '', intent: 'no_se', awaiting: 'body' });
    return {
      text: `Está bien no saber. A veces el cuerpo siente antes de que la cabeza entienda.\n\nEmpecemos por lo físico: ¿dormiste, comiste y tomaste tus medicamentos hoy?`,
      chips: yasminChips({ label: 'Sí, todo', action: 'yasmin-chip', id: 'Sí, todo' }, { label: 'No he comido', action: 'yasmin-chip', id: 'No he comido' }, { label: 'No he dormido', action: 'yasmin-chip', id: 'No puedo dormir' })
    };
  }
  if (yasminHas(t, 'gracias', 'te agradezco', 'dios te pague')) {
    yasminRemember({ topic: 'gracias', mood: 'calma', intent: 'gracias', awaiting: '' });
    return {
      text: `No hay de qué — estar aquí ya es cuidarte.\n\nVuelve cuando quieras, con motivo o sin él. Aquí no se necesita excusa para hablar.`,
      chips: yasminChips({ label: 'Seguir hablando', action: 'yasmin-chip', id: 'Solo quiero hablar' }, { label: 'Ver mi día', action: 'nav', id: 'hoy' })
    };
  }
  if (yasminHas(t, 'quien eres', 'como te llamas', 'que eres')) {
    yasminRemember({ topic: 'identidad', mood: '', intent: 'identidad', awaiting: '' });
    return yasminIdentidadReply();
  }
  if (yasminHas(t, 'que puedes hacer', 'ayuda', 'ayudame', 'ayudar', 'no se que hacer', 'opciones')) {
    yasminRemember({ topic: 'capacidades', mood: '', intent: 'capacidades', awaiting: '' });
    return yasminCapacidadesReply();
  }
  if (yasminHas(t, 'respirar', 'respira', 'respiro', 'respiracion', 'calma', 'calmarme')) {
    yasminRemember({ topic: 'respiracion', mood: emotion.key || '', intent: 'respirar', awaiting: 'breathe' });
    return {
      text: `Vamos. Inhala por la nariz contando cuatro. Sostén cuatro. Exhala por la boca contando seis. Otra vez.\n\nNo tienes que hacerlo perfecto. Solo seguir el círculo.`,
      chips: yasminChips({ label: 'Empezar', action: 'respirar' })
    };
  }
  if (yasminHas(t, 'aburrida', 'que hago', 'no se que hacer hoy')) {
    return {
      text: `Podemos hacer algo pequeño que no exija mucho:\n\n• Un momento de tu familia.\n• Tres estiramientos suaves.\n• Escribir una frase.\n• Ver una cápsula de dos minutos.\n\n¿Cuál te provoca?`,
      chips: yasminChips(yasminMomentoChip('Un momento'), { label: 'Estiramientos', action: 'nav', id: 'ejercicios' }, { label: 'Aprender algo', action: 'nav', id: 'aprende' })
    };
  }

  /* 22. Fallback: nunca dejar en visto; usar la historia y el contexto */
  const helps = personalSnippet('helps', 90);
  const family = personalSnippet('family', 90);
  const memoria = yasminMemoriaLinea('');
  const frase = raw.replace(/\s+/g, ' ').trim();
  const cita = frase.length > 70 ? `Me quedo con esto que me contaste: «${frase.length > 170 ? frase.slice(0, 167).trim() + '…' : frase}».` : '';
  const pregunta = emotion.key === 'tristeza'
    ? '¿Qué es lo que más pesa ahora: lo que pasó, lo que sientes o lo que necesitas?'
    : emotion.key === 'ansiedad'
      ? '¿Qué parte de esto te tiene en alerta ahora mismo?'
      : emotion.key === 'rabia'
        ? '¿Qué necesitas poner como límite o pedir?'
        : '¿Quieres que te escuche, que te ayude a ordenar o que te distraiga un rato?';
  return {
    text: `${yasminToneIntro()}${cita || 'Te leo.'} No siempre tengo la respuesta correcta, pero sí tengo tiempo.\n\n${helps ? `Me acuerdo de que te ayuda: ${helps}. ` : ''}${family ? `También me acuerdo de tu gente: ${family}. ` : ''}${!helps && !family && memoria ? `${memoria} ` : ''}${pregunta} Si prefieres, solo quédate aquí y no digas nada.`,
    chips: yasminChips(
      { label: 'Del cuerpo', action: 'yasmin-chip', id: 'Me duele mucho' },
      { label: 'De la cabeza', action: 'yasmin-chip', id: 'Me siento triste' },
      { label: 'De algo que pasó', action: 'yasmin-chip', id: 'Pasó algo hoy' },
      { label: 'Solo quería hablar', action: 'yasmin-chip', id: 'Solo quiero hablar' }
    )
  };
}

function yasminResponder(texto) {
  return yasminPensar(texto);
}

/* ---------- voz ---------- */
let yasminRecognition = null;
let yasminEscuchando = false;

function yasminVozSoportada() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
/* Las voces cargan de forma asíncrona en algunos navegadores: se piden
   también en voiceschanged para que la lista de Ajustes no salga vacía. */
if (yasminVozSoportada() && typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => window.speechSynthesis.getVoices());
}
function yasminVocesDisponibles() {
  if (!yasminVozSoportada()) return [];
  return (window.speechSynthesis.getVoices() || [])
    .filter(v => (v.lang || '').toLowerCase().startsWith('es'))
    .sort((a, b) => yasminPuntajeVoz(b) - yasminPuntajeVoz(a));
}
/* Puntaje: ganan las voces naturales/neuronales y las de Latinoamérica,
   porque suenan menos robóticas y más neutras para Colombia. */
function yasminPuntajeVoz(v) {
  const nombre = ((v.name || '') + ' ' + (v.voiceURI || '')).toLowerCase();
  const lang = (v.lang || '').toLowerCase();
  let p = 0;
  if (/natural|neural|premium|enhanced|wavenet|journey/.test(nombre)) p += 40;
  if (/google/.test(nombre)) p += 30;
  if (/salome|salomé|sabina|paulina|helena|isabela|camila|lucia|lucía|dalia|emilia/.test(nombre)) p += 15;
  if (lang.startsWith('es-co')) p += 25;
  else if (lang.startsWith('es-mx') || lang.startsWith('es-us') || lang.startsWith('es-419')) p += 20;
  else if (lang.startsWith('es-pe') || lang.startsWith('es-cl') || lang.startsWith('es-ar')) p += 10;
  else if (lang.startsWith('es-es')) p += 4;
  if (!v.localService) p += 6;
  return p;
}
function yasminElegirVoz() {
  if (!yasminVozSoportada()) return null;
  const voces = yasminVocesDisponibles();
  if (!voces.length) return null;
  const preferida = state.settings.yasminVoice;
  if (preferida) {
    const exacta = voces.find(v => (v.voiceURI || v.name) === preferida);
    if (exacta) return exacta;
  }
  return voces[0] || null;
}
/* Cada forma de hablar tiene su ritmo y su altura: más calma en suave,
   más energía y claridad en directo. */
function yasminProsodia() {
  const tono = yasminTone();
  if (tono === 'suave') return { rate: 0.86, pitch: 1.02 };
  if (tono === 'directo') return { rate: 1.02, pitch: 1.0 };
  return { rate: 0.94, pitch: 1.06 };
}
function yasminLeer(texto) {
  if (!yasminVozSoportada()) { toast('Este navegador no puede leer en voz alta.'); return; }
  /* Limpiar Markdown y etiquetas para que no se lea la decoración. */
  const limpio = String(texto || '')
    .replace(/[*_#`>]/g, '')
    .replace(/[\r\n]+/g, '. ')
    .replace(/\s+/g, ' ')
    .replace(/\.\s*\./g, '.')
    .trim();
  if (!limpio) return;
  window.speechSynthesis.cancel();
  const prosodia = yasminProsodia();
  const voz = yasminElegirVoz();
  /* Se lee por pedazos de 1-3 oraciones: los sintetizadores respiran entre
     pedazos y el resultado suena muchísimo más natural que un bloque largo. */
  const oraciones = limpio.split(/(?<=[.!?…])\s+/).reduce((partes, o) => {
    const ultima = partes[partes.length - 1];
    if (ultima && (ultima + ' ' + o).length <= 170) partes[partes.length - 1] = ultima + ' ' + o;
    else partes.push(o);
    return partes;
  }, []);
  let i = 0;
  const hablarSiguiente = () => {
    if (i >= oraciones.length) return;
    const pedazo = oraciones[i++];
    const u = new SpeechSynthesisUtterance(pedazo);
    u.lang = 'es-CO';
    u.rate = prosodia.rate;
    u.pitch = prosodia.pitch;
    u.volume = 1;
    if (voz) { u.voice = voz; u.lang = voz.lang || u.lang; }
    u.onend = hablarSiguiente;
    u.onerror = hablarSiguiente;
    window.speechSynthesis.speak(u);
  };
  hablarSiguiente();
}
function yasminLeerUltimo() {
  const mensajes = state.chat.filter(m => m.role === 'yasmin');
  if (!mensajes.length) { toast('Todavía no hay nada que leer.'); return; }
  yasminLeer(mensajes[mensajes.length - 1].text);
}
function yasminDetenerVoz() {
  if (yasminVozSoportada()) window.speechSynthesis.cancel();
  if (yasminRecognition && yasminEscuchando) { try { yasminRecognition.stop(); } catch (e) {} }
}
function yasminEscuchar() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    toast('Este navegador no tiene micrófono integrado. Puedes escribirme.');
    return;
  }
  if (yasminEscuchando) {
    try { yasminRecognition.stop(); } catch (e) {}
    return;
  }
  const area = document.getElementById('chat-text');
  try {
    yasminRecognition = new SR();
    yasminRecognition.lang = 'es-CO';
    yasminRecognition.interimResults = true;
    yasminRecognition.continuous = false;
    yasminRecognition.maxAlternatives = 1;
    yasminEscuchando = true;
    const boton = document.querySelector('[data-action="yasmin-microfono"]');
    if (boton) { boton.classList.add('listening'); boton.setAttribute('aria-pressed', 'true'); }
    yasminRecognition.onresult = event => {
      let texto = '';
      for (let i = event.resultIndex; i < event.results.length; i++) texto += event.results[i][0].transcript;
      if (area) { area.value = texto.trim(); area.style.height = 'auto'; area.style.height = Math.min(area.scrollHeight, 130) + 'px'; area.focus(); }
    };
    yasminRecognition.onerror = event => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') toast('No tengo permiso para usar el micrófono.');
      else if (event.error !== 'aborted') toast('No pude escucharte. Intenta otra vez o escribe.');
    };
    yasminRecognition.onend = () => {
      yasminEscuchando = false;
      if (boton) { boton.classList.remove('listening'); boton.setAttribute('aria-pressed', 'false'); }
      if (area) area.focus();
    };
    yasminRecognition.start();
    toast('Te escucho…');
  } catch (e) {
    yasminEscuchando = false;
    toast('No pude abrir el micrófono. Escribe tu mensaje.');
  }
}

/* ---------- vista del chat ---------- */
function chatBienvenida(nombre) {
  const propio = profileName();
  const mismoNombre = propio && normalizeText(propio) === normalizeText(nombre);
  const saludo = propio && !mismoNombre ? `, ${esc(propio)}` : '';
  const historia = personalHasData() ? ' Ya me has contado algo de tu historia; lo tengo presente.' : '';
  return `<div class="msg yasmin">${avatarYasmin(28)}<div class="msg-cuerpo">Hola${saludo}. Soy ${esc(nombre)}. Puedes escribirme como le escribirías a alguien que te quiere: sin ordenar las ideas, sin explicar nada bien.${historia}<span class="meta">ahora</span></div></div>`;
}
function chatMensajeHtml(m) {
  const role = m.role === 'ella' ? 'ella' : 'yasmin';
  const avatar = role === 'yasmin' ? avatarYasmin(28) : '';
  return `<div class="msg ${role}">${avatar}<div class="msg-cuerpo">${esc(m.text)}<span class="meta">${esc(horaCorta(m.at))}</span></div></div>`;
}
function renderChatLog(irAlFinal = true) {
  const log = document.getElementById('chat-log');
  if (!log) return;
  const estabaAbajo = chatCercaDelFinal(log);
  log.innerHTML = state.chat.length ? state.chat.map(chatMensajeHtml).join('') : chatBienvenida(yasminName());
  if (irAlFinal && estabaAbajo) {
    /* Anclaje inmediato y repetido: si se anima, la fila de sugerencias
       cambia de alto a mitad del recorrido y el registro queda corto. */
    chatAlFinal(log, false);
    requestAnimationFrame(() => chatAlFinal(log, false));
  }
}
function renderChatChips(chips) {
  const cont = document.getElementById('chat-chips');
  if (!cont) return;
  cont.innerHTML = (chips || []).map(c => `<button class="chat-chip" data-action="${esc(c.action)}" data-id="${esc(c.id || '')}" data-text="${esc(c.label)}">${esc(c.label)}</button>`).join('');
  /* Las sugerencias pueden ocupar dos líneas y empujan la conversación:
     si la persona estaba al final, se vuelve a anclar sin animación. */
  const log = document.getElementById('chat-log');
  if (log && chatCercaDelFinal(log)) {
    chatAlFinal(log, false);
    requestAnimationFrame(() => chatAlFinal(log, false));
  }
}

views.yasmin = function () {
  const nombre = yasminName();
  const msgs = state.chat.length ? state.chat : [];
  const chips = Array.isArray(ui.chatChips) ? ui.chatChips : [];
  const readOn = !!state.settings.yasminRead;
  const micOk = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  return `
    <div class="chat-shell">
      <div class="chat-head">
        <div class="chat-avatar">${esc(nombre.charAt(0).toUpperCase())}</div>
        <div style="flex:1;min-width:0">
          <strong>${esc(nombre)}</strong>
          <span>Estoy aquí. No tengo afán y no juzgo.</span>
        </div>
        <div class="chat-tools">
          <button class="icon-btn voice-btn ${readOn ? 'active' : ''}" data-action="yasmin-toggle-read" aria-pressed="${readOn}" title="${readOn ? 'Desactivar lectura' : 'Leer en voz alta'}" aria-label="Leer en voz alta">${icon(readOn ? 'volume' : 'volumeOff', 17)}</button>
          <button class="btn tiny ghost" data-action="yasmin-limpiar" title="Empezar de nuevo">Limpiar</button>
        </div>
      </div>

      <div class="chat-log" id="chat-log" role="log" aria-live="polite" aria-label="Conversación con ${esc(nombre)}">
        ${msgs.length ? msgs.map(chatMensajeHtml).join('') : chatBienvenida(nombre)}
      </div>

      <div class="chat-chips" id="chat-chips">
        ${(chips.length ? chips : YASMIN_SUGERENCIAS.map(s => ({ label: s, action: 'yasmin-chip', id: s }))).map(c => `<button class="chat-chip" data-action="${esc(c.action)}" data-id="${esc(c.id || '')}" data-text="${esc(c.label)}">${esc(c.label)}</button>`).join('')}
      </div>

      <form data-form="chat" class="chat-input">
        <textarea name="text" id="chat-text" placeholder="Escríbeme lo que quieras…" rows="1" aria-label="Mensaje para ${esc(nombre)}"></textarea>
        <button class="chat-mic" type="button" data-action="yasmin-microfono" aria-label="Hablar por micrófono" aria-pressed="false" ${micOk ? '' : 'disabled title="Este navegador no tiene micrófono integrado"'}>${icon('mic', 19)}</button>
        <button class="chat-send" type="submit" aria-label="Enviar">${icon('play', 20)}</button>
      </form>
      <div class="chat-under">
        <button class="link-btn tiny" data-action="yasmin-leer">Leer la última</button>
        <button class="link-btn tiny" data-action="yasmin-detener-voz">Detener voz</button>
        <button class="link-btn tiny" data-action="nav" data-id="memoria">Lo que recuerdo</button>
        <span class="tiny muted chat-safety">${esc(nombre)} no es una profesional de salud ni reemplaza a tu equipo. Si hay peligro, llama al <strong>123</strong>.</span>
      </div>
    </div>`;
};

function horaCorta(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  } catch (e) { return ''; }
}

function yasminGuardar(role, text) {
  state.chat.push({ role, text, at: nowISO() });
  if (state.chat.length > 160) state.chat = state.chat.slice(-160);
  save();
}

function yasminEnviar(texto) {
  const limpio = String(texto || '').trim();
  if (!limpio) return;
  yasminGuardar('ella', limpio);
  renderChatLog();
  const area = document.getElementById('chat-text');
  if (area) { area.value = ''; area.style.height = 'auto'; area.focus(); }
  ui.chatChips = [];
  renderChatChips([]);

  const respuesta = yasminResponder(limpio);
  setTimeout(() => {
    yasminGuardar('yasmin', respuesta.text);
    ui.chatChips = respuesta.chips || [];
    renderChatLog();
    renderChatChips(ui.chatChips);
    if (state.settings.yasminRead) yasminLeer(respuesta.text);
    if (area && document.activeElement !== area) area.focus();
  }, 520);
}

function yasminSugerencia() {
  const hoy = todayISO();
  const dia = findDay(hoy) || {};
  const buenas = careInsights(7).buenas || [];
  /* Sorpréndeme no da tareas: solo compañía, curiosidad y lo bueno. */
  const opciones = [];
  if (dia.traffic === 'green') opciones.push('¡Qué bueno lo del día verde! ¿Qué fue lo que ayudó hoy, aunque sea algo mínimo?');
  if (buenas.length) opciones.push(`Me guardaste cosas buenas estos días: «${buenas[buenas.length - 1].text}». ¿Qué fue lo mejor de la semana, aunque sea diminuto?`);
  if (personalValue('helps')) opciones.push(`Me acuerdo de que te ayuda: ${personalSnippet('helps', 90)}. ¿Lo intentamos hoy?`);
  opciones.push('¿Cómo va el cuerpo hoy, del 0 al 10?');
  opciones.push('¿Qué es lo primero que necesitas ahora: descansar, comer, hablar o silencio?');
  opciones.push('Si hoy fuera un día bueno, ¿qué harías en los primeros diez minutos?');
  opciones.push('Cuéntame un detalle pequeño de tu día: algo que hayas visto, oído o probado.');
  opciones.push('¿Qué ha estado sonando en tu cabeza últimamente: una canción, una preocupación o una idea?');
  const texto = opciones[Math.floor(Math.random() * opciones.length)];
  yasminGuardar('yasmin', texto);
  ui.chatChips = [];
  renderChatLog();
  renderChatChips([]);
}
