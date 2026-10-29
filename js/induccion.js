/* Andrea · capas de experiencia: inducción guiada y momento a pantalla completa */

const INDUCCION = [
  {
    icon: 'sparkle',
    titulo: 'Hola, Andrea.',
    texto: 'Esto no es una tarea ni un examen. Es un lugar para ti: para tus medicamentos, tus días, tus recuerdos y tu gente.',
    dedicatoria: 'Lo hizo tu hijo, pensando en ti.'
  },
  {
    icon: 'sun',
    titulo: 'Tu día, en una pantalla.',
    texto: 'Al abrir, ves lo que toca hoy: la próxima pastilla, cómo estás, tu próxima cita y un paso pequeño. Nada más. Sin ruido.'
  },
  {
    icon: 'pill',
    titulo: 'Nada se te va a olvidar.',
    texto: 'Cada medicamento tiene su hora y su cantidad. Puedes marcarlo con un toque. Y si quieres alarmas que suenen aunque el teléfono esté bloqueado, descargas el calendario y listo.'
  },
  {
    icon: 'calendar',
    titulo: 'Tu agenda, en un solo lugar.',
    texto: 'Citas, llamadas y recordatorios. Puedes escribir «mañana a las 3, psicología» y Andrea lo ordena. Si quieres que suene aunque el teléfono esté bloqueado, descarga el calendario del teléfono.'
  },
  {
    icon: 'chat',
    titulo: 'Yasmin está contigo.',
    texto: 'Puedes escribirle a cualquier hora. Sabe qué te toca tomar, cuándo es tu cita y cómo te has sentido. Escucha como quien quiere, celebra contigo lo bueno y no juzga. Y aprende de ti: lo que le cuentes lo usa para acompañarte mejor, y puedes verlo o borrarlo cuando quieras.'
  },
  {
    icon: 'sun',
    titulo: 'Los días buenos también cuentan.',
    texto: 'Aquí no solo se anota lo que duele. Cada día puedes guardar tres cosas buenas, aunque sean diminutas, y leer un momentito de fe: esas energías de siempre que te sostienen. Con los días, vas a ver también lo bueno que te ha pasado y lo que lo hizo bueno.'
  },
  {
    icon: 'photo',
    titulo: 'Tu gente, aquí adentro.',
    texto: 'Tu familia dejó fotos y palabras para ti. Aparecen de vez en cuando, como un mensaje que llega sin pedirlo. Para recordarte que no estás sola.'
  },
  {
    icon: 'shield',
    titulo: 'Para los días oscuros.',
    texto: 'Hay un plan guardado con tus razones, tus personas y qué hacer si todo pesa. No es para asustarte: es para que no tengas que pensar en el peor momento.'
  },
  {
    icon: 'heart',
    titulo: 'Empecemos juntas.',
    texto: 'Puedes configurar un PIN para que solo tú entres, o dejarlo abierto. Tus datos se quedan en este teléfono: no hay nube, ni anuncios, ni un panel para que tu familia lea tu diario. Y si algo no te gusta, se cambia. Esto es tuyo.'
  }
];

let induccionStep = 0;

function induccionDebeVerse() {
  if (!state) return false;
  if (!state.settings.onboarded) return true;
  return !deviceInduccionVista();
}

/* La inducción se muestra una vez por dispositivo, no una vez por respaldo. */
function quizasMostrarInduccion() {
  if (locked || !induccionDebeVerse()) return;
  setTimeout(() => {
    if (!locked && induccionDebeVerse() && !document.querySelector('.induccion')) {
      abrirInduccion(true);
    }
  }, 450);
}

function abrirInduccion(desdeCero = true) {
  if (desdeCero) induccionStep = 0;
  renderInduccion();
}

function renderInduccion() {
  const root = document.getElementById('induccion-root');
  if (!root) return;
  const paso = INDUCCION[Math.min(induccionStep, INDUCCION.length - 1)];
  const ultimo = induccionStep >= INDUCCION.length - 1;
  /* En el cierre, ofrecer los siguientes pasos según lo que ya tenga la app. */
  let siguiente = '';
  if (ultimo) {
    const acciones = [];
    if (state.medications.length && !state.settings.icsAt) acciones.push('<button class="btn" data-action="download-ics">Descargar mis alarmas</button>');
    if (personalFilledCount() < PERSONAL_FIELDS.length) acciones.push('<button class="btn" data-action="nav" data-id="historia">Completar mi historia</button>');
    if (acciones.length) siguiente = `<div class="induccion-next"><p class="tiny" style="margin:10px 0 8px">Cuando entres, esto te va a ayudar a poner todo al día:</p><div class="induccion-next-btns">${acciones.join('')}</div></div>`;
  }
  root.innerHTML = `
    <div class="induccion" role="dialog" aria-modal="true" aria-label="Presentación de Andrea">
      <div class="induccion-card ${induccionStep === 0 ? 'anim-entrada' : 'anim-paso'}">
        <div class="induccion-paso">
        <div class="induccion-icon">${icon(paso.icon, 42)}</div>
        <h2>${esc(paso.titulo)}</h2>
        <p>${esc(paso.texto)}</p>
        </div>
        ${paso.dedicatoria ? `<p class="dedicatoria">${esc(paso.dedicatoria)}</p>` : ''}
        ${siguiente}
        <div class="induccion-dots">${INDUCCION.map((_, i) => `<i class="${i === induccionStep ? 'on' : ''}"></i>`).join('')}</div>
        <div class="induccion-actions">
          ${induccionStep > 0 ? `<button class="btn" data-action="induccion-atras">Atrás</button>` : ''}
          ${ultimo
            ? `<button class="btn primary" data-action="induccion-fin">Entrar a mi espacio</button>
               <button class="btn" data-action="induccion-pin">Poner mi PIN</button>`
            : `<button class="btn primary" data-action="induccion-siguiente">Siguiente</button>`}
        </div>
        <button class="skip" data-action="induccion-fin">Saltar la presentación</button>
      </div>
    </div>`;
}

function cerrarInduccion() {
  const root = document.getElementById('induccion-root');
  if (root) root.innerHTML = '';
  state.settings.onboarded = true;
  marcarDeviceInduccionVista();
  save();
}

/* ---------- momento a pantalla completa ---------- */
async function abrirMomento(id) {
  const m = state.momentos.find(x => x.id === id) || momentoDelDia();
  if (!m) { toast('Todavía no hay momentos guardados.'); return; }
  ui.momentoActual = m.id;
  marcarMomentoVisto(m.id);
  const root = document.getElementById('momento-root');
  const foto = m.photoId ? await fotoLeer(m.photoId) : null;
  root.innerHTML = `
    <div class="momento-full" role="dialog" aria-modal="true" aria-label="Un momento para ti">
      <div class="inner">
        ${foto ? `<img src="${foto}" alt="Recuerdo de ${esc(m.from || 'tu familia')}">` : `<div style="font-size:2.6rem;margin-bottom:14px;color:#F0C98F">${icon('gift', 60)}</div>`}
        <blockquote>${esc(m.text || '')}</blockquote>
        <div class="from">— ${esc(m.from || 'Tu familia')}${m.relation ? ' · ' + esc(m.relation) : ''}</div>
        <div class="actions">
          <button class="btn solid" data-action="cerrar-momento">Gracias</button>
          <button class="btn" data-action="otro-momento">Otro momento</button>
          <button class="btn" data-action="edit-momento" data-id="${esc(m.id)}" style="opacity:.72;font-size:.82rem">Editar</button>
        </div>
      </div>
    </div>`;
  document.body.classList.add('modal-open');
}

function cerrarMomento() {
  const root = document.getElementById('momento-root');
  if (root) root.innerHTML = '';
  document.body.classList.remove('modal-open');
}

function otroMomento() {
  const lista = state.momentos;
  if (!lista.length) { cerrarMomento(); return; }
  const actual = ui.momentoActual;
  const otras = lista.filter(m => m.id !== actual);
  const elegido = (otras.length ? otras : lista)[Math.floor(Math.random() * (otras.length || lista.length))];
  abrirMomento(elegido.id);
}

function momentoSorpresa() {
  if (!state.momentos.length) {
    toast('Todavía no hay momentos. Pídele a tu familia que agregue uno.');
    navigate('momentos');
    return;
  }
  const m = momentoDelDia() || state.momentos[0];
  abrirMomento(m.id);
}
