/* Andrea · núcleo: estado, utilidades, navegación, alarmas, fotos y privacidad */
const STORAGE_KEY = 'andrea_state_v2';
const LEGACY_KEY = 'alba_state_v1';
/* Marca local del dispositivo: sirve para que la inducción se muestre en el
   teléfono aunque el respaldo importado diga que ya se vio en el PC. */
const DEVICE_KEY = 'andrea_device_onboarded';
const APP_VERSION = '0.6.2';
const APP_NAME = 'Andrea';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const NAV = [
  { id: 'hoy', label: 'Hoy', icon: 'sun' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar' },
  { id: 'cuaderno', label: 'Cuaderno', icon: 'pen' },
  { id: 'medicamentos', label: 'Medicamentos', icon: 'pill' },
  { id: 'ejercicios', label: 'Ejercicios', icon: 'activity' },
  { id: 'registro', label: 'Registro', icon: 'heart' },
  { id: 'citas', label: 'Citas', icon: 'calendar' },
  { id: 'reflexiones', label: 'Reflexiones', icon: 'pen' },
  { id: 'momentos', label: 'Momentos', icon: 'photo' },
  { id: 'seguridad', label: 'Seguridad', icon: 'shield' },
  { id: 'yasmin', label: 'Yasmin', icon: 'chat' },
  { id: 'historia', label: 'Mi historia', icon: 'book' },
  { id: 'memoria', label: 'Memoria', icon: 'sparkle' },
  { id: 'aprende', label: 'Aprende', icon: 'book' },
  { id: 'reporte', label: 'Reporte', icon: 'chart' },
  { id: 'ajustes', label: 'Ajustes', icon: 'settings' }
];

const BOTTOM_NAV = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'medicamentos', label: 'Medicinas' },
  { id: 'yasmin', label: 'Yasmin' }
];

const MICRO_STEPS = [
  'Bebe un vaso de agua y respira tres veces.',
  'Abre una ventana y recibe 5 minutos de luz.',
  'Camina 5 minutos, con apoyo si lo necesitas.',
  'Escribe una frase: «Lo que hoy me ayudó fue…».',
  'Llama o escríbele a una persona que te haga bien.',
  'Ordena una sola cosa pequeña de tu espacio.',
  'Haz 3 estiramientos suaves del plan de fisioterapia.',
  'Ponte una canción que te guste y escúchala completa.',
  'Prepara algo sencillo para comer o beber.',
  'Revisa tus medicamentos del día y marca lo que ya tomaste.',
  'Agradece una cosa, aunque sea mínima.',
  'Si hoy no puedes, descansa sin culpa. También es un paso.'
];

/* Frases de fe y ánimo: para Andrea, que cree en Dios, en las energías y en
   los milagros. Universal y opt-out: se apaga en Ajustes y no predica. */
const FE_FRASES = [
  { frase: 'Hoy hay una fuerza que te sostiene, aunque no la veas.', cierre: 'Con fe, como siempre.' },
  { frase: 'Tus energías hoy van a estar donde tú pongas tu intención. Ponla en ti.', cierre: 'Con calma y con fe.' },
  { frase: 'Los milagros no siempre llegan de golpe: a veces llegan como un día tranquilo como este.', cierre: 'Bienvenido sea.' },
  { frase: 'Lo que estás sembrando en ti, aunque no se vea, ya está creciendo.', cierre: 'Cosecha viene en camino.' },
  { frase: 'Dios no te dio espíritu de miedo. Lo que sientes no te define; te atraviesa y pasa.', cierre: 'Pasa, como todo.' },
  { frase: 'Eres guerrera desde antes de saberlo. Hoy también lo vas a demostrar.', cierre: 'Como toda la vida.' },
  { frase: 'Un día bueno también cuenta como medicina. Déjalo entrar.', cierre: 'Merecido, por cierto.' },
  { frase: 'Todo lo que has sobrevivido ya demostró que hay algo grande en ti.', cierre: 'Y sigue ahí.' },
  { frase: 'Pídele a lo que tú le pides, y suéltalo. Soltar también es cuidarse.', cierre: 'Ya no carga sola.' },
  { frase: 'Las cosas buenas también llegan sin avisar. Hoy deja la puerta abierta.', cierre: 'Con esperanza.' },
  { frase: 'Tu cuerpo está cansado, pero tu alma sigue en pie. Eso no es poca cosa.', cierre: 'Es mucho, de hecho.' },
  { frase: 'Nada de lo que te pasa te aparta de lo bueno que viene. Ninguna cosa.', cierre: 'Viene algo bueno.' },
  { frase: 'Agradece lo que ya está: la cama, el sol, alguien que te quiere. Eso también suma.', cierre: 'Y suma bonito.' },
  { frase: 'Hoy no tienes que ser fuerte para nadie. Solo seguir respirando y dejar que te cuiden.', cierre: 'Descansa en esa paz.' }
];
function feDelDia(offset = 0) {
  const i = (dayOfYear() + offset) % FE_FRASES.length;
  return FE_FRASES[i];
}

const PROMPTS = [
  '¿Qué necesito hoy que no me estoy dando?',
  '¿Qué le diría a alguien que quiero que está pasando por esto?',
  '¿Qué me ayudó hoy, aunque sea pequeño?',
  '¿Qué puedo soltar hoy?',
  '¿Qué me sostiene cuando todo pesa?',
  '¿Qué paso pequeño puedo dar mañana?',
  '¿Qué parte de mi historia no quiero seguir cargando sola?',
  '¿Qué le agradezco a mi cuerpo hoy?',
  '¿Qué límite necesito poner para cuidarme?',
  '¿Qué me gustaría recordar en un día difícil?'
];

/* La historia personal no es un formulario clínico: es lo que hace que
   Yasmin hable como alguien que la conoce, no como un robot genérico. */
const PERSONAL_DEFAULT = {
  story: '',
  family: '',
  faith: '',
  likes: '',
  dislikes: '',
  routines: '',
  words: '',
  helps: '',
  hurts: '',
  dreams: '',
  dates: '',
  pets: ''
};

const PERSONAL_FIELDS = [
  { key: 'story', label: 'Mi historia, en mis palabras', placeholder: 'De dónde vengo, qué he vivido, qué me ha costado y qué me ha sostenido…', rows: 5 },
  { key: 'family', label: 'Mi familia y mi gente', placeholder: 'Nombres, vínculos, quién me hace bien, quién me cuida…' },
  { key: 'faith', label: 'Mi fe y lo que me sostiene', placeholder: 'Dios, la oración, la espiritualidad, la naturaleza, una frase que me acompaña…' },
  { key: 'likes', label: 'Lo que me gusta', placeholder: 'Música, comida, colores, olores, programas, lugares…' },
  { key: 'dislikes', label: 'Lo que no me gusta o me hace daño', placeholder: 'Ruidos, frases, personas, situaciones…' },
  { key: 'routines', label: 'Mis rutinas y costumbres', placeholder: 'Cómo es una mañana normal, qué hago antes de dormir…' },
  { key: 'words', label: 'Mis palabras y expresiones', placeholder: 'Cómo digo las cosas, apodos, dichos de mi familia…' },
  { key: 'helps', label: 'Qué me ayuda cuando estoy mal', placeholder: 'Silencio, compañía, agua fría, una canción, una llamada…' },
  { key: 'hurts', label: 'Qué me hace sentir peor', placeholder: 'Que me digan «échale ganas», sentirme vigilada, el ruido…' },
  { key: 'dreams', label: 'Mis sueños y proyectos', placeholder: 'Lo que quiero hacer cuando pueda, incluso si es pequeño…' },
  { key: 'dates', label: 'Fechas importantes', placeholder: 'Cumpleaños, aniversarios, fechas que quiero recordar…' },
  { key: 'pets', label: 'Mis mascotas', placeholder: 'Nombres, cómo son, qué significa su compañía…' }
];

/* Checklist diario: lo básico que sostiene el día. No es una nota ni una
   prueba; es una forma de no perder de vista lo que el cuerpo necesita. */
const CARE_ITEMS = [
  { key: 'water', label: 'Agua', hint: 'Un vaso, o varios', icon: 'leaf' },
  { key: 'food', label: 'Algo de comer', hint: 'Aunque sea pequeño', icon: 'heart' },
  { key: 'movement', label: 'Movimiento suave', hint: 'Caminar o estirar', icon: 'activity' },
  { key: 'connection', label: 'Compañía', hint: 'Hablar con alguien', icon: 'phone' }
];

/* La memoria no es un diario clínico: son frases cortas que ayudan a Yasmin
   a no hablarle como a una desconocida. Andrea puede verlas y borrarlas. */
const MEMORY_KINDS = {
  nota: 'Algo que me pediste recordar',
  ayuda: 'Lo que te ayuda',
  evitar: 'Lo que te hace daño',
  gusto: 'Lo que te gusta',
  meta: 'Lo que quieres',
  familia: 'Tu gente',
  nombre: 'Cómo te llaman',
  sueno: 'Tu sueño',
  cuerpo: 'Tu cuerpo'
};

const EVENT_TYPES = ['Recordatorio', 'Cita', 'Trámite', 'Llamada', 'Personal'];
const REPEAT_LABELS = {
  none: 'No se repite',
  daily: 'Todos los días',
  weekdays: 'Lunes a viernes',
  weekly: 'Cada semana',
  monthly: 'Cada mes',
  yearly: 'Cada año'
};
const ALARM_LABELS = {
  '-1': 'Sin alarma',
  '0': 'A la hora',
  '5': '5 minutos antes',
  '10': '10 minutos antes',
  '15': '15 minutos antes',
  '30': '30 minutos antes',
  '60': '1 hora antes',
  '120': '2 horas antes',
  '1440': '1 día antes'
};

const ICON_PATHS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',
  pill: '<path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7Z"/><path d="m8.5 8.5 7 7"/>',
  activity: '<path d="M3 12h4l2-7 4 14 2-7h6"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.4-4.2A8 8 0 1 1 21 12Z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 8 5-5 5 5M12 3v12"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
  sparkle: '<path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"/><path d="M19 15v4M17 17h4M5 3v4M3 5h4"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-6 6-9 16-9 0 10-4 16-9 16Z"/><path d="M4 21c4-6 8-9 13-11"/>',
  photo: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m4 18 5-5 4 4 3-3 4 4"/>',
  heartHand: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 12 5a5.5 5.5 0 0 0-10 3.5C2 12 5 14 7 16l5 5 7-7Z"/>',
  moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z"/>',
  play: '<path d="M6 4l14 8-14 8V4Z"/>',
  gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18"/><path d="M12 8S9.5 3 7 4.5 8.5 8 12 8Zm0 0s2.5-5 5-3.5S15.5 8 12 8Z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  mapPin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8"/>',
  volume: '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  volumeOff: '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="m16 9 5 5M21 9l-5 5"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'
};

function icon(name, size = 20) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ICON_PATHS.sun}</svg>`;
}

/* Marca: sol que sale sobre una semilla — "cada día vuelve a empezar" */
function brandMark(size = 40) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" role="img" aria-label="${APP_NAME}">
    <defs>
      <linearGradient id="amanece" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#6E2C1F"/><stop offset=".55" stop-color="#A9502F"/><stop offset="1" stop-color="#C8963E"/>
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="15" fill="url(#amanece)"/>
    <circle cx="24" cy="21" r="7.5" fill="#FFE6B8"/>
    <path d="M6 31h36" stroke="#FFF3E2" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
    <path d="M13 31c2.5-4 6-5.5 11-5.5S32.5 27 35 31" stroke="#FFF3E2" stroke-width="2.2" stroke-linecap="round" fill="none" opacity=".9"/>
    <path d="M24 38.5c3.6-.6 5.6-3 5.6-6.6-3.6 0-5.8 1.8-6.4 5.2" fill="#FFF3E2" opacity=".9"/>
  </svg>`;
}

/* ---------- fechas ---------- */
function pad(n) { return String(n).padStart(2, '0'); }
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseISO(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function addDays(iso, n) {
  const d = parseISO(iso);
  if (!d) return iso;
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatDate(iso, opts = {}) {
  if (!iso) return 'Por confirmar';
  const d = parseISO(iso);
  if (!d || isNaN(d.getTime())) return 'Por confirmar';
  return d.toLocaleDateString('es-CO', {
    weekday: opts.weekday === false ? undefined : (opts.weekday || 'short'),
    day: 'numeric',
    month: opts.month || 'short',
    year: opts.year === false ? undefined : 'numeric'
  });
}
function formatLongDate(iso) {
  const d = parseISO(iso);
  if (!d) return '';
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function formatShort(iso) {
  const d = parseISO(iso);
  if (!d) return '';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}
function daysUntil(iso) {
  if (!iso) return null;
  const a = parseISO(todayISO());
  const b = parseISO(iso);
  return Math.round((b - a) / 86400000);
}
function lastNDates(n, end = todayISO()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(end, -i));
  return out;
}
function timeNow() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function nowISO() { return new Date().toISOString(); }
/* Fecha local (no UTC) a partir de un instante ISO. Evita que un respaldo
   hecho de noche aparezca con la fecha del día siguiente. */
function localDateISO(iso) {
  const d = new Date(iso);
  if (!iso || isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}
function dayOfYear() {
  const d = new Date();
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
}
function minutesNow() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
function timeToMinutes(time) {
  const m = String(time || '').match(/^(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
function timeLabel(time) {
  return time ? String(time).slice(0, 5) : 'Todo el día';
}
function capitalize(s) {
  const t = String(s || '');
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
}
function formatMonthYear(ym) {
  const [y, m] = String(ym || '').split('-').map(Number);
  if (!y || !m) return '';
  return capitalize(parseISO(`${y}-${pad(m)}-01`).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }));
}
function monthCells(ym) {
  const [y, m] = String(ym || '').split('-').map(Number);
  const first = new Date(y, (m || 1) - 1, 1);
  const offset = (first.getDay() + 6) % 7; // lunes primero
  const start = addDays(`${y}-${pad(m)}-01`, -offset);
  return Array.from({ length: 42 }, (_, i) => {
    const iso = addDays(start, i);
    const d = parseISO(iso);
    return {
      iso,
      day: d.getDate(),
      inMonth: d.getMonth() === (m - 1),
      isToday: iso === todayISO()
    };
  });
}
function friendlyDate(iso) {
  const diff = daysUntil(iso);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  return formatLongDate(iso);
}
function simpleHash(text) {
  let h = 2166136261;
  const s = String(text || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/* ---------- texto ---------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function nl2br(s) { return esc(s).replace(/\n/g, '<br>'); }
function lines(text) {
  return String(text || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
}
function listToText(arr) { return (arr || []).join('\n'); }
function uid(prefix = 'id') { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; }
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function normalizeText(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:()"']/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function phoneHref(phone) {
  const raw = String(phone || '').trim();
  const first = raw.split(/\s*(?:opci[oó]n|ext\.?|extensión|\/|,|;|\|)\s*/i)[0];
  const clean = first.replace(/[^\d+]/g, '');
  return clean.length >= 3 ? `tel:${clean}` : '#';
}
function waHref(phone) {
  let clean = String(phone || '').replace(/\D/g, '');
  if (clean.startsWith('57') && clean.length > 10) clean = clean.slice(2);
  /* WhatsApp solo para celulares colombianos; a líneas fijas no aplica. */
  return /^3\d{9}$/.test(clean) ? `https://wa.me/57${clean}` : '';
}


/* ---------- estado ---------- */
let state = null;
let route = (location.hash || '').replace('#', '') || 'hoy';
let locked = false;
let ui = {
  medTab: 'hoy',
  exerciseFilter: 'Todos',
  selectedDate: todayISO(),
  reportDays: 14,
  promptIndex: dayOfYear() % PROMPTS.length,
  microOffset: dayOfYear() % MICRO_STEPS.length,
  pendingSkip: null,
  exerciseTimer: null,
  breathingTimer: null,
  lastFocus: null,
  chatBusy: false,
  momentoActual: null,
  agendaMonth: todayISO().slice(0, 7),
  agendaDate: todayISO(),
  agendaFilter: 'todo',
  agendaQuickFocus: false
};

function normalizeState(raw) {
  const s = (raw && typeof raw === 'object') ? raw : {};
  s.version = 3;
  s.profile = Object.assign({
    name: '', displayName: '', age: null, startDate: todayISO(), dischargeDate: '',
    provider: '', diagnoses: '', allergies: '', notes: ''
  }, s.profile || {});
  s.settings = Object.assign({
    morning: '07:00', afternoon: '15:00', night: '23:00',
    notifications: false, discreet: false, pinHash: null, lastBackup: null,
    onboarded: false, momentsEnabled: true,
    momentTimes: ['09:30', '13:30', '17:00', '20:30'],
    yasminName: 'Yasmin', yasminTone: 'cercano', yasminRead: false,
    yasminLearn: true, yasminFactsUpdatedAt: '',
    agendaSignature: '', agendaExportAt: null,
    feEnabled: true,
    registroReminder: '20:00'
  }, s.settings || {});
  s.medications = Array.isArray(s.medications) ? s.medications : [];
  s.appointments = Array.isArray(s.appointments) ? s.appointments : [];
  s.events = Array.isArray(s.events) ? s.events : [];
  s.exercises = Array.isArray(s.exercises) ? s.exercises : [];
  s.contacts = Array.isArray(s.contacts) ? s.contacts : [];
  s.safetyPlan = Object.assign({ warningSigns: [], coping: [], reasons: [], means: [], steps: [] }, s.safetyPlan || {});
  s.messages = Array.isArray(s.messages) ? s.messages : [];
  s.questions = Array.isArray(s.questions) ? s.questions : [];
  s.dailyLogs = Array.isArray(s.dailyLogs) ? s.dailyLogs : [];
  s.sideEffects = Array.isArray(s.sideEffects) ? s.sideEffects : [];
  s.letters = Array.isArray(s.letters) ? s.letters : [];
  s.momentos = Array.isArray(s.momentos) ? s.momentos : [];
  s.chat = Array.isArray(s.chat) ? s.chat : [];
  s.agendaDone = (s.agendaDone && typeof s.agendaDone === 'object' && !Array.isArray(s.agendaDone)) ? s.agendaDone : {};
  /* Cuaderno: notas libres y pendientes propios (aparte de las tomas). */
  s.notas = Array.isArray(s.notas) ? s.notas.map(n => ({
    id: n.id || uid('nota'),
    title: String(n.title || '').replace(/\s+/g, ' ').trim().slice(0, 120) || 'Sin título',
    text: String(n.text || '').slice(0, 4000),
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(n.date || '')) ? n.date : todayISO(),
    createdAt: n.createdAt || nowISO(),
    updatedAt: n.updatedAt || n.createdAt || nowISO()
  })) : [];
  s.pendientes = Array.isArray(s.pendientes) ? s.pendientes.map(x => ({
    id: x.id || uid('pen'),
    text: String(x.text || '').replace(/\s+/g, ' ').trim().slice(0, 200),
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(x.date || '')) ? x.date : todayISO(),
    done: !!x.done,
    doneAt: x.doneAt || ''
  })).filter(x => x.text) : [];
  s.personal = Object.assign({}, PERSONAL_DEFAULT, s.personal || {});
  s.yasminMemory = Object.assign({
    topic: '', mood: '', intent: '', turns: 0,
    awaiting: '', lastUser: '', lastReply: '', updatedAt: ''
  }, s.yasminMemory || {});
  s.yasminFacts = Array.isArray(s.yasminFacts) ? s.yasminFacts : [];
  s.yasminFacts = s.yasminFacts
    .filter(f => f && typeof f === 'object')
    .map(f => ({
      id: f.id || uid('mem'),
      kind: MEMORY_KINDS[f.kind] ? f.kind : 'nota',
      text: String(f.text || '').replace(/\s+/g, ' ').trim().slice(0, 220),
      source: ['chat', 'journal', 'checkin', 'manual'].includes(f.source) ? f.source : 'manual',
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(f.date || '')) ? f.date : todayISO(),
      lastSeen: f.lastSeen || f.date || nowISO(),
      hits: Math.max(1, Number(f.hits) || 1)
    }))
    .filter(f => f.text)
    .slice(-120);

  s.medications.forEach(m => {
    m.id = m.id || uid('med');
    m.schedule = Array.isArray(m.schedule) ? m.schedule : [];
    m.schedule.forEach(slot => { slot.id = slot.id || uid('h'); });
    m.active = m.active !== false;
    m.start = m.start || s.profile.startDate || todayISO();
  });
  s.appointments.forEach(a => {
    a.id = a.id || uid('appt');
    a.status = a.status || 'por agendar';
    a.remind = a.remind == null || a.remind === '' ? -1 : Number(a.remind);
    if (!Number.isFinite(a.remind)) a.remind = -1;
    a.title = a.title || a.type || 'Cita';
  });
  s.events.forEach(e => {
    e.id = e.id || uid('evt');
    e.title = String(e.title || 'Recordatorio').trim() || 'Recordatorio';
    e.date = /^\d{4}-\d{2}-\d{2}$/.test(String(e.date || '')) ? e.date : '';
    e.time = /^\d{1,2}:\d{2}$/.test(String(e.time || '')) ? String(e.time).padStart(5, '0') : '';
    e.type = EVENT_TYPES.includes(e.type) ? e.type : 'Recordatorio';
    e.repeat = REPEAT_LABELS[e.repeat] ? e.repeat : 'none';
    e.repeatUntil = /^\d{4}-\d{2}-\d{2}$/.test(String(e.repeatUntil || '')) ? e.repeatUntil : '';
    e.alarm = e.alarm == null || e.alarm === '' ? -1 : Number(e.alarm);
    if (!Number.isFinite(e.alarm)) e.alarm = -1;
    e.duration = Math.max(0, Number(e.duration) || 0);
    e.place = String(e.place || '');
    e.notes = String(e.notes || '');
    e.createdAt = e.createdAt || nowISO();
    e.updatedAt = e.updatedAt || e.createdAt;
  });

  /* Claves antiguas de tomas: medId@HH:MM@índice. Las claves nuevas son
     medId@slotId, estables aunque cambie la hora o el orden del horario. */
  s.dailyLogs.forEach(day => {
    day.meds = day.meds || {};
    day.care = {
      water: !!(day.care && day.care.water),
      food: !!(day.care && day.care.food),
      movement: !!(day.care && day.care.movement),
      connection: !!(day.care && day.care.connection)
    };
    Object.keys(day.meds).forEach(key => {
      const m = key.match(/^(.+)@(\d{1,2}:\d{2})@(\d+)$/);
      if (!m) return;
      const med = s.medications.find(x => x.id === m[1]);
      const slot = med && med.schedule[Number(m[3])];
      if (slot && slot.id && slot.time === m[2]) {
        day.meds[med.id + '@' + slot.id] = day.meds[key];
        delete day.meds[key];
      }
    });
    day.notified = day.notified || {};
  });

  s.momentos.forEach(m => { m.seen = Array.isArray(m.seen) ? m.seen : []; });
  return s;
}

function emptyState() {
  return normalizeState({ version: 3, medications: [], appointments: [], exercises: [], contacts: [] });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeState(JSON.parse(raw));
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const migrated = normalizeState(JSON.parse(legacy));
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); } catch (e) { /* sin espacio */ }
      return migrated;
    }
  } catch (e) { console.warn('No se pudo leer el estado guardado', e); }
  if (window.ANDREA_SEED) return normalizeState(clone(window.ANDREA_SEED));
  if (window.ALBA_SEED) return normalizeState(clone(window.ALBA_SEED));
  return emptyState();
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('No se pudo guardar', e);
    toast('No se pudo guardar en este dispositivo. Revisa el espacio libre.');
  }
}
function deviceInduccionVista() {
  try { return localStorage.getItem(DEVICE_KEY) === '1'; } catch (e) { return false; }
}
function marcarDeviceInduccionVista() {
  try { localStorage.setItem(DEVICE_KEY, '1'); } catch (e) { /* sin acceso al almacenamiento */ }
}

function findDay(date) { return state.dailyLogs.find(d => d.date === date) || null; }
function ensureDay(date) {
  let d = findDay(date);
  if (!d) {
    d = { date, meds: {}, exercises: {}, checkin: null, journal: null, traffic: null, win: '', micro: false, notified: {}, momentos: [] };
    state.dailyLogs.push(d);
  }
  d.momentos = Array.isArray(d.momentos) ? d.momentos : [];
  d.notified = d.notified || {};
  return d;
}
function findMed(id) { return state.medications.find(m => m.id === id) || null; }
function findAppt(id) { return state.appointments.find(a => a.id === id) || null; }
function findEvent(id) { return state.events.find(e => e.id === id) || null; }
function findContact(id) { return state.contacts.find(c => c.id === id) || null; }
function hospitalContact() {
  const hosp = state.contacts.find(c => c.phone && /hospital|cl[ií]nica|urgencias|husi/i.test((c.role || '') + ' ' + (c.name || '')));
  return hosp || state.contacts.find(c => c.phone) || null;
}
function activeMeds() { return state.medications.filter(m => m.active !== false); }
function profileName() {
  if (state.settings.discreet) return '';
  return state.profile.displayName || state.profile.name || '';
}
function isSetup() { return !!(state.profile.name || state.profile.displayName) || state.momentos.length > 0; }

/* ---------- medicamentos ---------- */
function medEndDate(med) {
  if (!med.start || !med.durationDays) return null;
  return addDays(med.start, Number(med.durationDays) - 1);
}
function isMedActiveOn(med, date) {
  if (med.active === false) return false;
  if (med.start && date < med.start) return false;
  const end = medEndDate(med);
  if (end && date > end) return false;
  return true;
}
function dosesFor(date) {
  const out = [];
  activeMeds().forEach(med => {
    if (!isMedActiveOn(med, date)) return;
    (med.schedule || []).forEach((slot, idx) => {
      const slotId = slot.id || String(idx);
      out.push({
        key: `${med.id}@${slotId}`,
        medId: med.id,
        slotId,
        med,
        time: slot.time,
        amount: slot.amount,
        dose: slot.dose,
        idx
      });
    });
  });
  return out.sort((a, b) => a.time.localeCompare(b.time) || a.med.name.localeCompare(b.med.name));
}
function doseStatus(date, key) {
  const day = findDay(date);
  return (day && day.meds && day.meds[key] && day.meds[key].status) || 'pending';
}
function setDose(date, key, status, extra = {}) {
  const day = ensureDay(date);
  day.meds[key] = Object.assign({ status, at: nowISO() }, extra);
  save();
}
function unitsInAmount(amount) {
  const m = String(amount || '').match(/\d+/);
  return m ? Number(m[0]) : 1;
}
function dailyUnits(med) {
  return (med.schedule || []).reduce((sum, s) => sum + unitsInAmount(s.amount), 0);
}
function medTakenUnits(med) {
  let units = 0;
  state.dailyLogs.forEach(day => {
    Object.entries(day.meds || {}).forEach(([key, val]) => {
      if (!key.startsWith(med.id + '@') || val.status !== 'taken') return;
      const parts = key.split('@');
      let slot = null;
      if (parts.length >= 3) slot = (med.schedule || [])[Number(parts[2])];
      else slot = (med.schedule || []).find(s => s.id === parts[1]);
      units += slot ? unitsInAmount(slot.amount) : 1;
    });
  });
  return units;
}
function medRemaining(med) {
  if (med.quantity == null || med.quantity === '') return null;
  return Math.max(0, Number(med.quantity) - medTakenUnits(med));
}
function medDaysLeft(med) {
  const daily = dailyUnits(med);
  const rem = medRemaining(med);
  if (rem == null || !daily) return null;
  return Math.floor(rem / daily);
}
function adherenceStats(days = 7) {
  const dates = lastNDates(days);
  let expected = 0, taken = 0, skipped = 0;
  dates.forEach(date => {
    dosesFor(date).forEach(d => {
      expected++;
      const s = doseStatus(date, d.key);
      if (s === 'taken') taken++;
      if (s === 'skipped') skipped++;
    });
  });
  return { expected, taken, skipped, pct: expected ? Math.round(taken / expected * 100) : null };
}
function adherenceByTime(days = 7) {
  const map = {};
  lastNDates(days).forEach(date => {
    dosesFor(date).forEach(d => {
      const time = d.time || 'sin hora';
      if (!map[time]) map[time] = { time, expected: 0, taken: 0, skipped: 0, pending: 0 };
      map[time].expected++;
      const status = doseStatus(date, d.key);
      if (status === 'taken') map[time].taken++;
      else if (status === 'skipped') map[time].skipped++;
      else map[time].pending++;
    });
  });
  return Object.values(map).sort((a, b) => a.time.localeCompare(b.time));
}
function missedDoses(days = 7) {
  const out = [];
  lastNDates(days).forEach(date => {
    dosesFor(date).forEach(d => {
      const rec = (findDay(date) || {}).meds?.[d.key];
      if (rec && rec.status === 'skipped') {
        out.push({ date, med: d.med.name, time: d.time, amount: d.amount, reason: rec.reason || 'Sin motivo registrado' });
      }
    });
  });
  return out.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
}
function careInsights(days = 7) {
  const dates = lastNDates(days);
  const checkinDays = dates.filter(date => checkinDone(date)).length;
  const medDays = dates.filter(date => Object.keys(((findDay(date) || {}).meds) || {}).length > 0).length;
  const care = careSummary(days);
  const adherence = adherenceStats(days);
  const byTime = adherenceByTime(days).filter(x => x.expected);
  const skipped = missedDoses(days);
  const effects = state.sideEffects.filter(e => dates.includes(e.date));
  const lowSleep = dates.filter(date => {
    const value = ((findDay(date) || {}).checkin || {}).sleepHours;
    return typeof value === 'number' && value < 6;
  }).length;
  const highPain = dates.filter(date => {
    const value = ((findDay(date) || {}).checkin || {}).pain;
    return typeof value === 'number' && value >= 7;
  }).length;
  const redDays = dates.filter(date => (findDay(date) || {}).traffic === 'red').length;
  const greenDays = dates.filter(date => (findDay(date) || {}).traffic === 'green').length;
  const buenas = [];
  dates.forEach(date => {
    const day = findDay(date);
    if (!day) return;
    const win = String(day.win || '').trim();
    if (win) buenas.push({ date, text: win, kind: 'win' });
    (Array.isArray(day.gracias) ? day.gracias : []).forEach(g => {
      const text = String(g || '').trim();
      if (text && !buenas.some(b => memoryFold(b.text) === memoryFold(text))) buenas.push({ date, text, kind: 'gracias' });
    });
  });
  const lines = [];
  if (greenDays) lines.push(`Tuviste ${greenDays} ${greenDays === 1 ? 'día bueno' : 'días buenos'} marcados en verde de ${days}. Eso también es información valiosa.`);
  if (buenas.length) lines.push(`Lo bueno que anotaste: ${buenas.slice(-3).map(b => `«${b.text}»`).join(', ')}.`);
  if (checkinDays) lines.push(`Registraste cómo te sentiste ${checkinDays} de ${days} días.`);
  if (adherence.expected && medDays >= 2) {
    lines.push(`Adherencia: ${adherence.taken} de ${adherence.expected} tomas (${adherence.pct}%).`);
    const menosRegistrada = byTime.slice().sort((a, b) => (a.taken / a.expected) - (b.taken / b.expected))[0];
    if (menosRegistrada && menosRegistrada.taken < menosRegistrada.expected) {
      lines.push(`¿La toma de las ${menosRegistrada.time} te está costando? (${menosRegistrada.taken} de ${menosRegistrada.expected}). Si es así, vale la pena contarlo en la cita: a veces se puede ajustar el horario.`);
    }
  } else if (adherence.expected) {
    lines.push('Aún no hay suficientes días de tomas registradas para ver un patrón.');
  }
  if (care.total > 0) {
    lines.push(`Cuidados base: ${CARE_ITEMS.map(item => `${item.label.toLowerCase()} ${care.counts[item.key]}/${days}`).join(', ')}.`);
  }
  if (lowSleep >= 2) lines.push(`Dormiste menos de 6 horas en ${lowSleep} de ${days} días.`);
  if (highPain >= 2) lines.push(`El dolor llegó a 7/10 o más en ${highPain} de ${days} días.`);
  if (effects.length) {
    const names = [...new Set(effects.map(e => String(e.symptom || '').trim()).filter(Boolean))];
    if (names.length) lines.push(`Efectos reportados: ${names.slice(0, 4).join(', ')}.`);
  }
  if (redDays) lines.push(`Marcaste «necesito ayuda» ${redDays} ${redDays === 1 ? 'día' : 'días'}.`);
  if (!lines.length) lines.push('Todavía no hay suficientes registros para ver un patrón. Un día también cuenta.');
  return {
    days, dates, checkinDays, medDays, care, adherence, byTime, skipped, effects, lowSleep, highPain, redDays, greenDays, buenas, lines,
    hasData: checkinDays > 0 || adherence.expected > 0 || effects.length > 0 || care.total > 0 || buenas.length > 0 || greenDays > 0
  };
}
function nextDose() {
  const today = todayISO();
  const now = minutesNow();
  const doses = dosesFor(today).filter(d => doseStatus(today, d.key) === 'pending');
  const [h, m] = [Math.floor(now / 60), now % 60];
  const after = doses.find(d => {
    const [dh, dm] = d.time.split(':').map(Number);
    return dh * 60 + dm >= h * 60 + m;
  });
  return after || doses[0] || null;
}
function pendingDosesToday() {
  const today = todayISO();
  return dosesFor(today).filter(d => doseStatus(today, d.key) === 'pending');
}

/* ---------- checklist diario ---------- */
function careFor(date) {
  const day = findDay(date);
  const care = (day && day.care) || {};
  return {
    water: !!care.water,
    food: !!care.food,
    movement: !!care.movement,
    connection: !!care.connection
  };
}
function setCare(date, key, value) {
  if (!CARE_ITEMS.some(item => item.key === key)) return;
  const day = ensureDay(date);
  day.care = Object.assign({}, careFor(date), { [key]: !!value });
  save();
}
function careSummary(days = 7) {
  const dates = lastNDates(days);
  const counts = { water: 0, food: 0, movement: 0, connection: 0 };
  dates.forEach(date => {
    const care = careFor(date);
    CARE_ITEMS.forEach(item => { if (care[item.key]) counts[item.key]++; });
  });
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return { days, counts, total };
}
function checkinDone(date) {
  const c = (findDay(date) || {}).checkin || {};
  return !!(c.at || typeof c.mood === 'number' || typeof c.anxiety === 'number' || typeof c.pain === 'number' || typeof c.sleepQuality === 'number');
}
function checklistFor(date) {
  const items = [];
  dosesFor(date).forEach(d => {
    const status = doseStatus(date, d.key);
    items.push({
      id: 'med:' + d.key,
      group: 'meds',
      label: `${d.med.name}${d.med.strength ? ' ' + d.med.strength : ''}`,
      detail: `${d.amount} · ${d.time}`,
      done: status !== 'pending',
      skipped: status === 'skipped',
      action: 'toggle-dose',
      doseKey: d.key,
      date
    });
  });
  const care = careFor(date);
  CARE_ITEMS.forEach(item => {
    items.push({
      id: 'care:' + item.key,
      group: 'care',
      label: item.label,
      detail: item.hint,
      icon: item.icon,
      done: !!care[item.key],
      action: 'checklist-toggle',
      careKey: item.key,
      date
    });
  });
  items.push({
    id: 'checkin',
    group: 'checkin',
    label: 'Cómo me siento',
    detail: checkinDone(date) ? 'Registrado' : '60 segundos',
    icon: 'heart',
    done: checkinDone(date),
    action: 'nav',
    nav: 'registro'
  });
  return items;
}
function checklistProgress(date) {
  const items = checklistFor(date);
  const done = items.filter(item => item.done).length;
  return { done, total: items.length, pct: items.length ? Math.round(done / items.length * 100) : 0, items };
}
function nextAppointment() {
  const today = todayISO();
  const withDate = state.appointments
    .filter(a => a.date && a.status !== 'cancelada' && a.status !== 'asistida')
    .sort((a, b) => (a.date + (a.time || '99:99')).localeCompare(b.date + (b.time || '99:99')));
  const future = withDate.find(a => a.date >= today);
  if (future) return future;
  return state.appointments.find(a => a.status === 'por agendar' || a.status === 'pendiente') || null;
}
function sortedAppointments() {
  return state.appointments.slice().sort((a, b) => {
    if (a.date && b.date) return (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''));
    if (a.date) return -1;
    if (b.date) return 1;
    return String(a.title).localeCompare(String(b.title));
  });
}

/* ---------- agenda: citas, recordatorios y alarmas ---------- */
function eventOccursOn(ev, date) {
  if (!ev || !ev.date || !date || date < ev.date) return false;
  if (ev.repeatUntil && date > ev.repeatUntil) return false;
  if (ev.repeat === 'none' || !ev.repeat) return date === ev.date;
  const start = parseISO(ev.date);
  const d = parseISO(date);
  if (!start || !d) return false;
  if (ev.repeat === 'daily') return true;
  if (ev.repeat === 'weekdays') return d.getDay() >= 1 && d.getDay() <= 5;
  if (ev.repeat === 'weekly') return d.getDay() === start.getDay();
  if (ev.repeat === 'monthly') return d.getDate() === start.getDate();
  if (ev.repeat === 'yearly') return d.getDate() === start.getDate() && d.getMonth() === start.getMonth();
  return date === ev.date;
}
function eventOccurrenceKey(ev, date) { return `${ev.id}@${date}`; }
function isEventDone(ev, date) { return !!state.agendaDone[eventOccurrenceKey(ev, date)]; }
function setEventDone(ev, date, done) {
  const key = eventOccurrenceKey(ev, date);
  if (done) state.agendaDone[key] = nowISO();
  else delete state.agendaDone[key];
  save();
}
function agendaItemsFor(date) {
  const items = [];
  state.appointments.forEach(a => {
    if (!a.date || a.date !== date) return;
    if (a.status === 'cancelada') return;
    items.push({
      kind: 'appt', id: a.id, date, time: a.time || '', title: a.title || a.type || 'Cita',
      type: a.type || 'Cita', place: a.place || '', notes: a.notes || '',
      done: a.status === 'asistida', appointment: a
    });
  });
  state.events.forEach(ev => {
    if (!eventOccursOn(ev, date)) return;
    items.push({
      kind: 'event', id: ev.id, date, time: ev.time || '', title: ev.title,
      type: ev.type || 'Recordatorio', place: ev.place || '', notes: ev.notes || '',
      done: isEventDone(ev, date), event: ev, occurrence: eventOccurrenceKey(ev, date)
    });
  });
  return items.sort((a, b) => {
    const ta = timeToMinutes(a.time);
    const tb = timeToMinutes(b.time);
    if (ta == null && tb == null) return a.title.localeCompare(b.title);
    if (ta == null) return 1;
    if (tb == null) return -1;
    return ta - tb || a.title.localeCompare(b.title);
  });
}
function agendaItemsBetween(start, end) {
  const out = [];
  let date = start;
  let guard = 0;
  while (date <= end && guard < 800) {
    agendaItemsFor(date).forEach(item => out.push(Object.assign({}, item, { date })));
    date = addDays(date, 1);
    guard++;
  }
  return out;
}
function nextAgendaItem(options = {}) {
  const today = todayISO();
  const now = minutesNow();
  for (let i = 0; i < 120; i++) {
    const date = addDays(today, i);
    const items = agendaItemsFor(date).filter(x => !x.done);
    for (const item of items) {
      const mins = timeToMinutes(item.time);
      if (i === 0 && mins != null && mins < now - 1) continue;
      return Object.assign({}, item, { date });
    }
  }
  if (options.includeUndated) {
    const a = state.appointments.find(x => !x.date && x.status !== 'cancelada' && x.status !== 'asistida') || null;
    if (a) return { kind: 'appt', id: a.id, date: '', time: '', title: a.title || a.type, type: a.type, place: a.place || '', notes: a.notes || '', done: false, appointment: a };
  }
  return null;
}
function nextUndatedAppointment() {
  return state.appointments.find(a => !a.date && a.status !== 'cancelada' && a.status !== 'asistida') || null;
}
function agendaSignature() {
  const appts = state.appointments.map(a => [a.id, a.date, a.time, a.title, a.type, a.status, a.place, a.notes, a.remind]).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  const events = state.events.map(e => [e.id, e.title, e.date, e.time, e.type, e.repeat, e.repeatUntil, e.alarm, e.place, e.notes, e.updatedAt]).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return simpleHash(JSON.stringify({ appts, events }));
}
function agendaPendingSync() {
  if (!state || (!state.events.length && !state.appointments.some(a => a.date))) return false;
  return agendaSignature() !== (state.settings.agendaSignature || '');
}
function markAgendaSynced() {
  state.settings.agendaSignature = agendaSignature();
  state.settings.agendaExportAt = nowISO();
  save();
}
function eventRepeatText(ev) {
  if (!ev || !ev.repeat || ev.repeat === 'none') return '';
  const base = REPEAT_LABELS[ev.repeat] || '';
  return ev.repeatUntil ? `${base} hasta ${formatShort(ev.repeatUntil)}` : base;
}
function alarmText(minutes) {
  const n = Number(minutes);
  if (!Number.isFinite(n) || n < 0) return 'Sin alarma';
  return ALARM_LABELS[String(n)] || `${n} minutos antes`;
}
function personalHasData() {
  return Object.values(state.personal || {}).some(v => String(v || '').trim());
}
function personalValue(key) {
  return String((state.personal || {})[key] || '').trim();
}
function personalFilledCount() {
  return PERSONAL_FIELDS.filter(f => personalValue(f.key)).length;
}
function personalSnippet(key, max = 120) {
  const value = personalValue(key).replace(/\s+/g, ' ').replace(/[.。]+$/, '').trim();
  if (!value) return '';
  return value.length > max ? value.slice(0, max - 1).trim() + '…' : value;
}

/* ---------- memoria viva ---------- */
function memoryFold(value) {
  return String(value || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function memoryList(kind = '', limit = 24) {
  const list = state.yasminFacts || [];
  return list
    .filter(f => !kind || f.kind === kind)
    .slice()
    .sort((a, b) => String(b.lastSeen || b.date).localeCompare(String(a.lastSeen || a.date)))
    .slice(0, limit);
}
function memoryCount() {
  return (state.yasminFacts || []).length;
}
function memoryAdd({ kind = 'nota', text = '', source = 'manual' } = {}) {
  if (!text || !String(text).trim()) return null;
  if (state.settings.yasminLearn === false && source !== 'manual') return null;
  const clean = String(text).replace(/\s+/g, ' ').replace(/[.。]+$/, '').trim().slice(0, 220);
  if (clean.length < 4) return null;
  const folded = memoryFold(clean);
  if (!folded) return null;
  const existing = (state.yasminFacts || []).find(f => f.kind === kind && memoryFold(f.text) === folded);
  if (existing) {
    existing.hits = Math.max(1, Number(existing.hits) || 1) + 1;
    existing.lastSeen = nowISO();
    state.settings.yasminFactsUpdatedAt = nowISO();
    save();
    return existing;
  }
  const fact = {
    id: uid('mem'),
    kind: MEMORY_KINDS[kind] ? kind : 'nota',
    text: clean,
    source: ['chat', 'journal', 'checkin', 'manual'].includes(source) ? source : 'manual',
    date: todayISO(),
    lastSeen: nowISO(),
    hits: 1
  };
  state.yasminFacts = state.yasminFacts || [];
  state.yasminFacts.push(fact);
  if (state.yasminFacts.length > 120) state.yasminFacts = state.yasminFacts.slice(-120);
  state.settings.yasminFactsUpdatedAt = nowISO();
  save();
  return fact;
}
function memoryRemove(id) {
  const before = (state.yasminFacts || []).length;
  state.yasminFacts = (state.yasminFacts || []).filter(f => f.id !== id);
  if (state.yasminFacts.length !== before) {
    state.settings.yasminFactsUpdatedAt = nowISO();
    save();
    return true;
  }
  return false;
}
function memoryClear() {
  state.yasminFacts = [];
  state.settings.yasminFactsUpdatedAt = nowISO();
  save();
}
function avgCheckin(days, key) {
  const vals = lastNDates(days).map(date => (findDay(date)?.checkin || {})[key]).filter(v => typeof v === 'number' && !isNaN(v));
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
}
function checkinSeries(days) {
  return lastNDates(days).map(date => {
    const c = findDay(date)?.checkin || {};
    return {
      date,
      mood: typeof c.mood === 'number' ? c.mood : null,
      anxiety: typeof c.anxiety === 'number' ? c.anxiety : null,
      pain: typeof c.pain === 'number' ? c.pain : null,
      sleepHours: typeof c.sleepHours === 'number' ? c.sleepHours : null,
      function: typeof c.function === 'number' ? c.function : null
    };
  });
}

/* ---------- navegación y render ---------- */
function navItem(id) { return NAV.find(n => n.id === id); }

function buildNav() {
  const side = $('#side-nav');
  side.innerHTML = NAV.map(n => `<button class="nav-link" data-action="nav" data-id="${n.id}" aria-current="false">${icon(n.icon, 19)}<span>${n.label}</span></button>`).join('');
  const bottom = $('#bottomnav');
  bottom.innerHTML = BOTTOM_NAV.map(item => {
    const n = navItem(item.id);
    return `<button class="bottom-link" data-action="nav" data-id="${item.id}">${icon(n.icon, 21)}<span>${item.label}</span></button>`;
  }).join('') + `<button class="bottom-link" data-action="open-menu">${icon('menu', 21)}<span>Más</span></button>`;
  const brandEl = document.getElementById('brand-mark');
  if (brandEl) brandEl.innerHTML = brandMark(40);
  const lockBrand = document.getElementById('lock-brand');
  if (lockBrand) lockBrand.innerHTML = brandMark(70);
  const menuBtn = document.getElementById('menu-btn');
  if (menuBtn) menuBtn.innerHTML = icon('menu', 21);
  const ver = document.getElementById('version-label');
  if (ver) ver.textContent = `${APP_NAME} v${APP_VERSION} · Kaizen`;
}

function updateNav() {
  $$('.nav-link').forEach(el => {
    const active = el.dataset.id === route;
    el.classList.toggle('active', active);
    el.setAttribute('aria-current', active ? 'page' : 'false');
  });
  $$('.bottom-link').forEach(el => el.classList.toggle('active', el.dataset.id === route));
}

function navigate(id) {
  if (!views[id]) id = 'hoy';
  route = id;
  if (location.hash !== '#' + id) location.hash = id;
  closeModal();
  render();
}

function render() {
  if (!state) return;
  const lock = $('#lock-screen');
  const app = $('#app');
  if (locked) {
    lock.classList.remove('hidden');
    app.classList.add('hidden');
    return;
  }
  lock.classList.add('hidden');
  app.classList.remove('hidden');
  document.body.classList.toggle('discreet', !!state.settings.discreet);
  const n = navItem(route) || navItem('hoy');
  $('#page-title').textContent = (!isSetup() && route === 'hoy') ? 'Bienvenida' : n.label;
  $('#topbar-kicker').textContent = state.settings.discreet ? 'Mi espacio' : 'Mi espacio de cuidado';
  const credit = $('#footer-credit');
  if (credit) credit.textContent = state.settings.discreet ? 'Hecha con cuidado · Kaizen' : 'Hecha por tu hijo, para ti.';
  const version = $('#version-label');
  if (version) version.textContent = `Andrea v${APP_VERSION} · Kaizen`;
  $('#today-chip').textContent = formatShort(todayISO());
  document.title = `${n.label} · Andrea`;
  const view = document.getElementById('view');
  view.innerHTML = views[route] ? views[route]() : views.hoy();
  updateNav();
  hydrateFotos(view);
  if (route === 'yasmin') {
    const log = $('#chat-log');
    if (log) log.scrollTop = log.scrollHeight;
  }
  window.scrollTo(0, 0);
  const status = document.getElementById('sr-status');
  if (status) status.textContent = `${n.label}.`;
}

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  const status = document.getElementById('sr-status');
  if (status) status.textContent = message;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3600);
}

/* ---------- modal ---------- */
function openModal({ title = '', body = '', footer = '', wide = false, className = '' }) {
  ui.lastFocus = document.activeElement;
  $('#modal-root').innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal ${wide ? 'wide' : ''} ${className}" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
        <div class="modal-head">
          <h2 id="modal-title">${esc(title)}</h2>
          <button class="modal-close" data-action="close-modal" aria-label="Cerrar">×</button>
        </div>
        <div class="modal-body">${body}</div>
        ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
      </div>
    </div>`;
  document.body.classList.add('modal-open');
  const app = $('#app');
  if (app && 'inert' in app) app.inert = true;
  setTimeout(() => {
    const preferred = $('#modal-root [data-autofocus]');
    const field = $('#modal-root .modal-body input:not([type="hidden"]), #modal-root .modal-body select, #modal-root .modal-body textarea, #modal-root .modal-body button, #modal-root .modal-foot button, #modal-root .modal');
    (preferred || field || $('#modal-root .modal'))?.focus();
  }, 40);
}

function closeModal() {
  const root = $('#modal-root');
  if (root) root.innerHTML = '';
  document.body.classList.remove('modal-open');
  const app = $('#app');
  if (app && 'inert' in app) app.inert = false;
  if (ui.exerciseTimer) { clearInterval(ui.exerciseTimer); ui.exerciseTimer = null; }
  if (ui.breathingTimer) { clearInterval(ui.breathingTimer); ui.breathingTimer = null; }
  if (ui.lastFocus && ui.lastFocus.focus) setTimeout(() => ui.lastFocus.focus(), 20);
}

/* ---------- fotos (IndexedDB) ---------- */
const FOTO_DB = 'andrea_fotos';
const FOTO_STORE = 'fotos';

function idbOpen() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('sin indexedDB')); return; }
    const req = indexedDB.open(FOTO_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(FOTO_STORE)) db.createObjectStore(FOTO_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function fotoGuardar(id, dataUrl) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FOTO_STORE, 'readwrite');
    tx.objectStore(FOTO_STORE).put(dataUrl, id);
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
async function fotoLeer(id) {
  try {
    const db = await idbOpen();
    return await new Promise((resolve) => {
      const tx = db.transaction(FOTO_STORE, 'readonly');
      const req = tx.objectStore(FOTO_STORE).get(id);
      req.onsuccess = () => { db.close(); resolve(req.result || null); };
      req.onerror = () => { db.close(); resolve(null); };
    });
  } catch (e) { return null; }
}
async function fotoBorrar(id) {
  try {
    const db = await idbOpen();
    const tx = db.transaction(FOTO_STORE, 'readwrite');
    tx.objectStore(FOTO_STORE).delete(id);
    tx.oncomplete = () => db.close();
  } catch (e) { /* silencioso */ }
}
/* Borra también las fotos que ya no tienen referencia en el estado.
   Sin esto, «Borrar todos los datos» dejaba imágenes en el disco. */
function fotoBorrarTodo() {
  return new Promise(resolve => {
    if (!('indexedDB' in window)) { resolve(); return; }
    let listo = false;
    const terminar = () => { if (!listo) { listo = true; resolve(); } };
    try {
      const req = indexedDB.deleteDatabase(FOTO_DB);
      req.onsuccess = terminar;
      req.onerror = terminar;
      req.onblocked = terminar;
    } catch (e) { terminar(); return; }
    setTimeout(terminar, 1500);
  });
}
async function hydrateFotos(root = document) {
  const imgs = $$('img[data-foto]', root);
  for (const img of imgs) {
    if (img.dataset.listo) continue;
    const dataUrl = await fotoLeer(img.dataset.foto);
    if (dataUrl) { img.src = dataUrl; img.dataset.listo = '1'; }
    else { img.classList.add('hidden'); }
  }
}
function comprimirImagen(file, max = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const escala = Math.min(1, max / Math.max(width, height));
        width = Math.round(width * escala);
        height = Math.round(height * escala);
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('No se pudo abrir el archivo.'));
    reader.readAsDataURL(file);
  });
}

/* ---------- momentos ---------- */
function momentosDisponibles() {
  return state.momentos.slice().sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
}
function momentoDelDia() {
  const lista = momentosDisponibles();
  if (!lista.length) return null;
  const hoy = todayISO();
  const vistosHoy = lista.filter(m => (m.seen || []).includes(hoy));
  if (vistosHoy.length === lista.length) return lista[dayOfYear() % lista.length];
  const frescos = lista.filter(m => !(m.seen || []).includes(hoy));
  return frescos[dayOfYear() % frescos.length];
}
function marcarMomentoVisto(id) {
  const m = state.momentos.find(x => x.id === id);
  if (!m) return;
  const hoy = todayISO();
  m.seen = Array.isArray(m.seen) ? m.seen : [];
  if (!m.seen.includes(hoy)) { m.seen.push(hoy); save(); }
}

/* ---------- ICS ---------- */
function icsEscape(s) {
  return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}
function icsDate(iso, time) {
  const [y, m, d] = String(iso || todayISO()).split('-');
  const [hh, mm] = String(time || '09:00').split(':');
  return `${y}${m}${d}T${pad(hh)}${pad(mm)}00`;
}
function icsStamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
function downloadFile(name, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}
function downloadICS(discreet = false) {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Andrea//Cuidado//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(discreet ? 'Recordatorios' : 'Andrea · Mi agenda')}`
  ];
  const pushAlarm = (title, minutes) => {
    const n = Number(minutes);
    if (!Number.isFinite(n) || n < 0) return;
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(title)}`, `TRIGGER:-PT${Math.max(0, n)}M`, 'END:VALARM');
  };
  const pushEvent = (opts) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${opts.uid}@local`);
    lines.push(`DTSTAMP:${icsStamp()}`);
    if (opts.time) {
      lines.push(`DTSTART:${icsDate(opts.date, opts.time)}`);
      lines.push(`DURATION:PT${Math.max(5, Number(opts.duration) || 30)}M`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${String(opts.date).replace(/-/g, '')}`);
      lines.push(`DTEND;VALUE=DATE:${addDays(opts.date, 1).replace(/-/g, '')}`);
    }
    if (opts.repeat && opts.repeat !== 'none') {
      const freq = { daily: 'DAILY', weekdays: 'WEEKLY;BYDAY=MO,TU,WE,TH,FR', weekly: 'WEEKLY', monthly: 'MONTHLY', yearly: 'YEARLY' }[opts.repeat];
      if (freq) {
        let rule = `RRULE:FREQ=${freq}`;
        if (opts.repeatUntil) rule += `;UNTIL=${String(opts.repeatUntil).replace(/-/g, '')}T235959`;
        lines.push(rule);
      }
    }
    lines.push(`SUMMARY:${icsEscape(opts.title)}`);
    if (opts.description) lines.push(`DESCRIPTION:${icsEscape(opts.description)}`);
    if (opts.location) lines.push(`LOCATION:${icsEscape(opts.location)}`);
    lines.push('STATUS:CONFIRMED');
    pushAlarm(opts.title, opts.alarm);
    lines.push('END:VEVENT');
  };

  activeMeds().forEach((med, mi) => {
    const inicio = med.start || todayISO();
    const desde = inicio < todayISO() ? todayISO() : inicio;
    const transcurridos = Math.max(0, Math.round((new Date(desde) - new Date(inicio)) / 86400000));
    const count = med.durationDays
      ? Math.max(1, Number(med.durationDays) - transcurridos)
      : 60;
    (med.schedule || []).forEach(slot => {
      const title = discreet ? `Medicamento ${mi + 1}` : `${med.name} ${med.strength || ''}`.trim();
      const desc = discreet
        ? 'Abrir Andrea para ver la indicación.'
        : `${slot.amount} (${slot.dose || ''}). ${med.instructions || ''} No modificar sin psiquiatra.`;
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:andrea-${med.id}-${slot.id || slot.time}@local`);
      lines.push(`DTSTAMP:${icsStamp()}`);
      lines.push(`DTSTART:${icsDate(desde, slot.time)}`);
      lines.push('DURATION:PT5M');
      lines.push(`RRULE:FREQ=DAILY;COUNT=${count}`);
      lines.push(`SUMMARY:${icsEscape(title)}`);
      lines.push(`DESCRIPTION:${icsEscape(desc)}`);
      pushAlarm(title, 0);
      lines.push('END:VEVENT');
    });
  });

  state.appointments.filter(a => a.date && a.status !== 'cancelada').forEach(a => {
    const title = discreet ? 'Cita médica' : (a.title || a.type || 'Cita');
    const desc = discreet ? 'Abrir Andrea para ver el detalle.' : (a.notes || '');
    pushEvent({
      uid: `andrea-appt-${a.id}`,
      title,
      description: desc,
      location: discreet ? '' : (a.place || ''),
      date: a.date,
      time: a.time || '',
      duration: 45,
      repeat: 'none',
      alarm: a.remind == null ? 60 : Number(a.remind)
    });
  });

  state.events.filter(ev => ev.date).forEach(ev => {
    pushEvent({
      uid: `andrea-evt-${ev.id}`,
      title: discreet ? 'Recordatorio' : ev.title,
      description: discreet ? 'Abrir Andrea para ver el detalle.' : (ev.notes || ''),
      location: discreet ? '' : (ev.place || ''),
      date: ev.date,
      time: ev.time || '',
      duration: ev.duration || 30,
      repeat: ev.repeat || 'none',
      repeatUntil: ev.repeatUntil || '',
      alarm: ev.alarm == null ? -1 : Number(ev.alarm)
    });
  });

  lines.push('END:VCALENDAR');
  downloadFile(`andrea-agenda-${discreet ? 'discreta-' : ''}${todayISO()}.ics`, lines.join('\r\n'), 'text/calendar');
  markAgendaSynced();
  state.settings.icsAt = nowISO();
  save();
  render();
  toast('Calendario descargado. Ábrelo en tu teléfono para que las alarmas suenen aunque Andrea esté cerrada.');
}

/* Recordatorios de Momentos en el calendario: aparecen sobre otras apps
   sin escribir en el evento ningún dato de salud ni el texto del recuerdo. */
function downloadMomentosICS() {
  const times = (state.settings.momentTimes && state.settings.momentTimes.length)
    ? state.settings.momentTimes
    : ['09:30', '13:30', '17:00', '20:30'];
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Andrea//Momentos//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Andrea · Momentos'
  ];
  times.forEach((t, i) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:andrea-momento-${i}@local`);
    lines.push(`DTSTAMP:${icsStamp()}`);
    lines.push(`DTSTART:${icsDate(todayISO(), t)}`);
    lines.push('DURATION:PT5M');
    lines.push('RRULE:FREQ=DAILY;COUNT=365');
    lines.push(`SUMMARY:${icsEscape('Un momento para ti')}`);
    lines.push(`DESCRIPTION:${icsEscape('Abre Andrea para ver lo que tu familia dejó para ti.')}`);
    lines.push('TRANSP:TRANSPARENT');
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape('Un momento para ti')}`, 'TRIGGER:-PT0M', 'END:VALARM');
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  downloadFile(`andrea-momentos-${todayISO()}.ics`, lines.join('\r\n'), 'text/calendar');
  state.settings.icsMomentosAt = nowISO();
  save();
  toast('Recordatorios descargados. Ábrelos y agrégalos al calendario.');
}

/* ---------- notificaciones ---------- */
function esIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function appInstalada() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

/* ---------- instalar en el celular ---------- */
let instalacionDiferida = null;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  instalacionDiferida = event;
  const boton = document.querySelector('[data-action="instalar-app"]');
  if (boton) boton.hidden = false;
});
async function instalarApp() {
  if (appInstalada()) { toast('Andrea ya está instalada en este dispositivo.'); return; }
  if (instalacionDiferida) {
    try {
      instalacionDiferida.prompt();
      const eleccion = await instalacionDiferida.userChoice;
      instalacionDiferida = null;
      toast(eleccion && eleccion.outcome === 'accepted' ? 'Instalando Andrea…' : 'Puedes instalarla después desde el menú del navegador.');
    } catch (e) {
      toast('El navegador no permitió instalar. Usa el menú → «Instalar aplicación».');
    }
    return;
  }
  const pasos = esIOS()
    ? `<ol class="small" style="padding-left:18px"><li>Abre Andrea en <strong>Safari</strong> (no en WhatsApp ni en Instagram).</li><li>Toca el botón <strong>Compartir</strong> (el cuadro con la flecha).</li><li>Elige <strong>«Agregar a pantalla de inicio»</strong>.</li><li>Ábrela desde el ícono nuevo. Así funciona sin conexión y puede enviar avisos.</li></ol>`
    : `<ol class="small" style="padding-left:18px"><li>Abre Andrea en Chrome.</li><li>Toca el menú de tres puntos (⋮), arriba a la derecha.</li><li>Elige <strong>«Instalar aplicación»</strong> o <strong>«Agregar a pantalla de inicio»</strong>.</li><li>Ábrela desde el ícono nuevo. Así funciona sin conexión y puede enviar avisos.</li></ol>`;
  openModal({
    title: 'Instalar Andrea',
    body: `<p class="small">${esIOS()
      ? 'En iPhone, Andrea solo puede enviar avisos si la instalas en la pantalla de inicio.'
      : 'Instalada como aplicación, Andrea abre más rápido y funciona sin conexión.'}</p>${pasos}<p class="tiny muted">Los datos siguen guardados solo en este teléfono.</p>`,
    footer: '<button class="btn primary" data-action="close-modal">Entendido</button>'
  });
}
function notificacionesSoportadas() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}
async function notificacionesListas() {
  if (!notificacionesSoportadas()) return false;
  return Notification.permission === 'granted';
}
async function enableNotifications() {
  if (!('Notification' in window)) {
    toast(esIOS()
      ? 'En iPhone los avisos solo funcionan si instalas Andrea en la pantalla de inicio.'
      : 'Este navegador no permite notificaciones.');
    return;
  }
  if (!('serviceWorker' in navigator)) {
    toast('Este navegador no permite avisos desde la app. Usa el calendario del teléfono.');
    return;
  }
  try {
    const perm = await Notification.requestPermission();
    state.settings.notifications = perm === 'granted';
    save(); render();
    if (perm === 'granted') {
      toast('Avisos activados. Haz una prueba para confirmar que suenan.');
    } else if (perm === 'denied') {
      toast('Los avisos quedaron bloqueados. Actívalos en los permisos del navegador.');
    } else {
      toast('No se activaron los avisos.');
    }
  } catch (e) { toast('No se pudieron activar los avisos.'); }
}
async function notificar(titulo, cuerpo, tag = 'andrea') {
  if (!notificacionesSoportadas() || Notification.permission !== 'granted') return false;
  const opciones = {
    body: cuerpo,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag,
    renotify: false,
    data: { url: './index.html' }
  };
  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg && typeof reg.showNotification === 'function') {
      await reg.showNotification(titulo, opciones);
      return true;
    }
  } catch (e) { /* sin service worker activo: se intenta el constructor */ }
  try {
    new Notification(titulo, opciones);
    return true;
  } catch (e) { return false; }
}
async function testNotification() {
  if (!('Notification' in window)) {
    toast(esIOS()
      ? 'En iPhone: comparte → «Agregar a pantalla de inicio», abre Andrea desde el ícono y vuelve a probar.'
      : 'Este navegador no permite notificaciones.');
    return;
  }
  if (Notification.permission !== 'granted') { enableNotifications(); return; }
  const m = momentoDelDia();
  const ok = await notificar(
    'Andrea',
    m ? String(m.text || '').slice(0, 120) : 'Así se verá un aviso. Si no aparece, revisa los permisos.',
    'andrea-test'
  );
  toast(ok ? 'Aviso enviado. Si no lo ves, revisa los permisos del navegador.' : 'No se pudo mostrar el aviso. Revisa los permisos.');
}

async function checkNotifications() {
  if (!state || !state.settings.notifications) return;
  if (!(await notificacionesListas())) return;
  const today = todayISO();
  const now = minutesNow();
  const day = ensureDay(today);

  // Tomas: solo se marca como avisado si el aviso salió de verdad.
  for (const d of dosesFor(today)) {
    const [h, m] = d.time.split(':').map(Number);
    const diff = now - (h * 60 + m);
    const flag = 'med:' + d.key;
    if (diff >= 0 && diff <= 2 && doseStatus(today, d.key) === 'pending' && !day.notified[flag]) {
      const ok = await notificar(
        state.settings.discreet ? 'Andrea · medicamento' : `Hora de ${d.med.name}`,
        `${d.amount} · ${d.time}. Toca para registrar.`,
        d.key
      );
      if (ok) { day.notified[flag] = true; save(); }
    }
  }

  // Agenda: citas y recordatorios con alarma. Se revisa la ocurrencia de hoy,
  // así una cita o un recordatorio recurrente no se pierde.
  for (const item of agendaItemsFor(today)) {
    if (item.done) continue;
    const alarm = item.kind === 'event'
      ? (item.event ? Number(item.event.alarm) : -1)
      : (item.appointment ? Number(item.appointment.remind) : -1);
    if (!Number.isFinite(alarm) || alarm < 0) continue;
    const start = timeToMinutes(item.time || '09:00');
    if (start == null) continue;
    const diff = now - (start - alarm);
    const flag = (item.kind === 'appt' ? 'appt:' : 'evt:') + item.id + ':' + today;
    if (diff >= 0 && diff <= 2 && !day.notified[flag]) {
      const titulo = state.settings.discreet
        ? (item.kind === 'appt' ? 'Andrea · cita' : 'Andrea · recordatorio')
        : item.title;
      const cuerpo = state.settings.discreet
        ? `Hoy a las ${timeLabel(item.time)}. Abre Andrea para ver el detalle.`
        : `${timeLabel(item.time)}${item.place ? ' · ' + item.place : ''}${item.kind === 'event' && item.event && item.event.repeat !== 'none' ? ' · se repite' : ''}`;
      const ok = await notificar(titulo, cuerpo, flag);
      if (ok) { day.notified[flag] = true; save(); }
    }
  }

  // Momentos de la familia
  if (state.settings.momentsEnabled && state.momentos.length) {
    for (const t of (state.settings.momentTimes || [])) {
      const [h, m] = String(t).split(':').map(Number);
      const diff = now - (h * 60 + m);
      const flag = 'mom:' + t;
      if (diff >= 0 && diff <= 2 && !day.notified[flag]) {
        const mom = momentoDelDia();
        if (mom) {
          const quien = mom.from ? `De ${mom.from}` : 'De tu familia';
          const texto = String(mom.text || '').trim();
          const cuerpo = texto ? `${quien}: ${texto.slice(0, 110)}` : `${quien}: te dejó un recuerdo. Ábrelo cuando quieras.`;
          const ok = await notificar(
            state.settings.discreet ? 'Andrea' : 'Alguien pensó en ti',
            cuerpo,
            'momento-' + t
          );
          if (ok) { day.notified[flag] = true; save(); }
        }
      }
    }
  }

  // Registro del día: un solo recordatorio amable a la hora elegida,
  // solo si todavía no se ha registrado cómo está hoy.
  const horaRegistro = state.settings.registroReminder || '20:00';
  const [rh, rm] = String(horaRegistro).split(':').map(Number);
  const flagRegistro = 'checkin:' + today;
  if (Number.isFinite(rh) && !checkinDone(today) && !day.notified[flagRegistro] && now >= rh * 60 + rm) {
    const ok = await notificar(
      state.settings.discreet ? 'Andrea' : 'Un momentito, Andrea',
      '¿Cómo estuvo tu día? 60 segundos para contarme. Si no puedes ahora, no pasa nada.',
      'checkin-' + today
    );
    if (ok) { day.notified[flagRegistro] = true; save(); }
  }
}

/* ---------- privacidad ---------- */
async function sha256(text) {
  try {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) { /* fallback */ }
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return 'fallback_' + h.toString(16);
}
async function setPin(pin) {
  if (!pin || String(pin).length < 4) { toast('El PIN debe tener al menos 4 caracteres.'); return; }
  state.settings.pinHash = await sha256(String(pin));
  locked = false;
  save(); render(); closeModal();
  toast('PIN configurado.');
}
async function unlock(pin) {
  const hash = await sha256(String(pin));
  if (hash === state.settings.pinHash) {
    locked = false;
    render();
    toast('Hola de nuevo.');
    quizasMostrarInduccion();
  } else {
    toast('PIN incorrecto.');
    const input = $('#pin');
    if (input) { input.value = ''; input.focus(); }
  }
}
function lockNow() {
  if (!state.settings.pinHash) {
    navigate('ajustes');
    toast('Primero configura un PIN en Ajustes → Privacidad.');
    return;
  }
  locked = true;
  render();
}

/* ---------- exportar / importar ---------- */
function exportJSON() {
  state.settings.lastBackup = nowISO();
  save();
  downloadFile(`andrea-backup-${todayISO()}.json`, JSON.stringify(state, null, 2));
  render();
  toast('Respaldo descargado. Guárdalo en un lugar seguro.');
}
function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !data.profile) throw new Error('El archivo no parece un respaldo de Andrea.');
      if (!confirm('Esto reemplazará los datos actuales por los del respaldo. ¿Continuar?')) return;
      state = normalizeState(data);
      locked = !!state.settings.pinHash;
      save(); render();
      /* Poner al día: si el plan empezó hace días, las alarmas del calendario
         cuentan desde hoy y las tomas de hoy se marcan desde cero. */
      const nombre = state.profile.displayName || state.profile.name;
      const meds = state.medications.filter(m => m.active !== false).length;
      const citas = state.appointments.length;
      const resumen = [];
      if (meds) resumen.push(`${meds} medicamento${meds === 1 ? '' : 's'}`);
      if (citas) resumen.push(`${citas} cita${citas === 1 ? '' : 's'}`);
      toast(nombre
        ? `Bienvenida, ${nombre.split(' ')[0]}. ${resumen.length ? 'Ya están aquí tus ' + resumen.join(' y ') + '. ' : ''}Las alarmas cuentan desde hoy. Lo que falte, lo completamos juntas.`
        : 'Datos restaurados. Las alarmas cuentan desde hoy.');
      quizasMostrarInduccion();
    } catch (e) {
      toast('No se pudo importar: ' + e.message);
    }
  };
  reader.readAsText(file);
}
async function resetAll() {
  if (!confirm('Esto borrará TODOS los datos de Andrea en este dispositivo. ¿Continuar?')) return;
  if (!confirm('Última confirmación: no se puede deshacer sin un respaldo. ¿Borrar todo?')) return;
  await fotoBorrarTodo();
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
    localStorage.removeItem(DEVICE_KEY);
  } catch (e) { /* sin acceso al almacenamiento */ }
  state = emptyState();
  locked = false;
  save(); render();
  toast('Datos y fotos borrados.');
  quizasMostrarInduccion();
}
function loadSeed() {
  const seed = window.ANDREA_SEED || window.ALBA_SEED;
  if (!seed) { toast('No hay un plan inicial disponible.'); return; }
  if (!confirm('Esto reemplazará los datos actuales por el plan inicial de Yasmin. ¿Continuar?')) return;
  state = normalizeState(clone(seed));
  locked = false;
  save(); render();
  toast('Plan inicial cargado.');
  quizasMostrarInduccion();
}
function storageSize() {
  try { return new Blob([JSON.stringify(state)]).size; } catch (e) { return 0; }
}
