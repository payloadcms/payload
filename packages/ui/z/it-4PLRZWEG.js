import { a as s } from './chunk-YZ5EFHMQ.js'
import './chunk-N2T43CBH.js'
import { a as m, b as i, c as u, d as r } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var b = {
    lessThanXSeconds: { one: 'meno di un secondo', other: 'meno di {{count}} secondi' },
    xSeconds: { one: 'un secondo', other: '{{count}} secondi' },
    halfAMinute: 'alcuni secondi',
    lessThanXMinutes: { one: 'meno di un minuto', other: 'meno di {{count}} minuti' },
    xMinutes: { one: 'un minuto', other: '{{count}} minuti' },
    aboutXHours: { one: "circa un'ora", other: 'circa {{count}} ore' },
    xHours: { one: "un'ora", other: '{{count}} ore' },
    xDays: { one: 'un giorno', other: '{{count}} giorni' },
    aboutXWeeks: { one: 'circa una settimana', other: 'circa {{count}} settimane' },
    xWeeks: { one: 'una settimana', other: '{{count}} settimane' },
    aboutXMonths: { one: 'circa un mese', other: 'circa {{count}} mesi' },
    xMonths: { one: 'un mese', other: '{{count}} mesi' },
    aboutXYears: { one: 'circa un anno', other: 'circa {{count}} anni' },
    xYears: { one: 'un anno', other: '{{count}} anni' },
    overXYears: { one: 'pi\xF9 di un anno', other: 'pi\xF9 di {{count}} anni' },
    almostXYears: { one: 'quasi un anno', other: 'quasi {{count}} anni' },
  },
  l = (e, o, a) => {
    let t,
      n = b[e]
    return (
      typeof n == 'string'
        ? (t = n)
        : o === 1
          ? (t = n.one)
          : (t = n.other.replace('{{count}}', o.toString())),
      a?.addSuffix ? (a.comparison && a.comparison > 0 ? 'tra ' + t : t + ' fa') : t
    )
  }
var v = { full: 'EEEE d MMMM y', long: 'd MMMM y', medium: 'd MMM y', short: 'dd/MM/y' },
  z = { full: 'HH:mm:ss zzzz', long: 'HH:mm:ss z', medium: 'HH:mm:ss', short: 'HH:mm' },
  P = {
    full: '{{date}} {{time}}',
    long: '{{date}} {{time}}',
    medium: '{{date}} {{time}}',
    short: '{{date}} {{time}}',
  },
  c = {
    date: m({ formats: v, defaultWidth: 'full' }),
    time: m({ formats: z, defaultWidth: 'full' }),
    dateTime: m({ formats: P, defaultWidth: 'full' }),
  }
var d = [
  'domenica',
  'luned\xEC',
  'marted\xEC',
  'mercoled\xEC',
  'gioved\xEC',
  'venerd\xEC',
  'sabato',
]
function M(e) {
  switch (e) {
    case 0:
      return "'domenica scorsa alle' p"
    default:
      return "'" + d[e] + " scorso alle' p"
  }
}
function g(e) {
  return "'" + d[e] + " alle' p"
}
function w(e) {
  switch (e) {
    case 0:
      return "'domenica prossima alle' p"
    default:
      return "'" + d[e] + " prossimo alle' p"
  }
}
var y = {
    lastWeek: (e, o, a) => {
      let t = e.getDay()
      return s(e, o, a) ? g(t) : M(t)
    },
    yesterday: "'ieri alle' p",
    today: "'oggi alle' p",
    tomorrow: "'domani alle' p",
    nextWeek: (e, o, a) => {
      let t = e.getDay()
      return s(e, o, a) ? g(t) : w(t)
    },
    other: 'P',
  },
  h = (e, o, a, t) => {
    let n = y[e]
    return typeof n == 'function' ? n(o, a, t) : n
  }
var W = {
    narrow: ['aC', 'dC'],
    abbreviated: ['a.C.', 'd.C.'],
    wide: ['avanti Cristo', 'dopo Cristo'],
  },
  x = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['T1', 'T2', 'T3', 'T4'],
    wide: ['1\xBA trimestre', '2\xBA trimestre', '3\xBA trimestre', '4\xBA trimestre'],
  },
  C = {
    narrow: ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D'],
    abbreviated: [
      'gen',
      'feb',
      'mar',
      'apr',
      'mag',
      'giu',
      'lug',
      'ago',
      'set',
      'ott',
      'nov',
      'dic',
    ],
    wide: [
      'gennaio',
      'febbraio',
      'marzo',
      'aprile',
      'maggio',
      'giugno',
      'luglio',
      'agosto',
      'settembre',
      'ottobre',
      'novembre',
      'dicembre',
    ],
  },
  k = {
    narrow: ['D', 'L', 'M', 'M', 'G', 'V', 'S'],
    short: ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'],
    abbreviated: ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'],
    wide: [
      'domenica',
      'luned\xEC',
      'marted\xEC',
      'mercoled\xEC',
      'gioved\xEC',
      'venerd\xEC',
      'sabato',
    ],
  },
  D = {
    narrow: {
      am: 'm.',
      pm: 'p.',
      midnight: 'mezzanotte',
      noon: 'mezzogiorno',
      morning: 'mattina',
      afternoon: 'pomeriggio',
      evening: 'sera',
      night: 'notte',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'mezzanotte',
      noon: 'mezzogiorno',
      morning: 'mattina',
      afternoon: 'pomeriggio',
      evening: 'sera',
      night: 'notte',
    },
    wide: {
      am: 'AM',
      pm: 'PM',
      midnight: 'mezzanotte',
      noon: 'mezzogiorno',
      morning: 'mattina',
      afternoon: 'pomeriggio',
      evening: 'sera',
      night: 'notte',
    },
  },
  V = {
    narrow: {
      am: 'm.',
      pm: 'p.',
      midnight: 'mezzanotte',
      noon: 'mezzogiorno',
      morning: 'di mattina',
      afternoon: 'del pomeriggio',
      evening: 'di sera',
      night: 'di notte',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'mezzanotte',
      noon: 'mezzogiorno',
      morning: 'di mattina',
      afternoon: 'del pomeriggio',
      evening: 'di sera',
      night: 'di notte',
    },
    wide: {
      am: 'AM',
      pm: 'PM',
      midnight: 'mezzanotte',
      noon: 'mezzogiorno',
      morning: 'di mattina',
      afternoon: 'del pomeriggio',
      evening: 'di sera',
      night: 'di notte',
    },
  },
  F = (e, o) => {
    let a = Number(e)
    return String(a)
  },
  f = {
    ordinalNumber: F,
    era: i({ values: W, defaultWidth: 'wide' }),
    quarter: i({ values: x, defaultWidth: 'wide', argumentCallback: (e) => e - 1 }),
    month: i({ values: C, defaultWidth: 'wide' }),
    day: i({ values: k, defaultWidth: 'wide' }),
    dayPeriod: i({
      values: D,
      defaultWidth: 'wide',
      formattingValues: V,
      defaultFormattingWidth: 'wide',
    }),
  }
var H = /^(\d+)(º)?/i,
  L = /\d+/i,
  S = {
    narrow: /^(aC|dC)/i,
    abbreviated: /^(a\.?\s?C\.?|a\.?\s?e\.?\s?v\.?|d\.?\s?C\.?|e\.?\s?v\.?)/i,
    wide: /^(avanti Cristo|avanti Era Volgare|dopo Cristo|Era Volgare)/i,
  },
  E = { any: [/^a/i, /^(d|e)/i] },
  T = { narrow: /^[1234]/i, abbreviated: /^t[1234]/i, wide: /^[1234](º)? trimestre/i },
  X = { any: [/1/i, /2/i, /3/i, /4/i] },
  A = {
    narrow: /^[gfmalsond]/i,
    abbreviated: /^(gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic)/i,
    wide: /^(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/i,
  },
  N = {
    narrow: [/^g/i, /^f/i, /^m/i, /^a/i, /^m/i, /^g/i, /^l/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
    any: [
      /^ge/i,
      /^f/i,
      /^mar/i,
      /^ap/i,
      /^mag/i,
      /^gi/i,
      /^l/i,
      /^ag/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
  },
  q = {
    narrow: /^[dlmgvs]/i,
    short: /^(do|lu|ma|me|gi|ve|sa)/i,
    abbreviated: /^(dom|lun|mar|mer|gio|ven|sab)/i,
    wide: /^(domenica|luned[i|ì]|marted[i|ì]|mercoled[i|ì]|gioved[i|ì]|venerd[i|ì]|sabato)/i,
  },
  O = {
    narrow: [/^d/i, /^l/i, /^m/i, /^m/i, /^g/i, /^v/i, /^s/i],
    any: [/^d/i, /^l/i, /^ma/i, /^me/i, /^g/i, /^v/i, /^s/i],
  },
  R = {
    narrow: /^(a|m\.|p|mezzanotte|mezzogiorno|(di|del) (mattina|pomeriggio|sera|notte))/i,
    any: /^([ap]\.?\s?m\.?|mezzanotte|mezzogiorno|(di|del) (mattina|pomeriggio|sera|notte))/i,
  },
  Y = {
    any: {
      am: /^a/i,
      pm: /^p/i,
      midnight: /^mezza/i,
      noon: /^mezzo/i,
      morning: /mattina/i,
      afternoon: /pomeriggio/i,
      evening: /sera/i,
      night: /notte/i,
    },
  },
  p = {
    ordinalNumber: u({ matchPattern: H, parsePattern: L, valueCallback: (e) => parseInt(e, 10) }),
    era: r({
      matchPatterns: S,
      defaultMatchWidth: 'wide',
      parsePatterns: E,
      defaultParseWidth: 'any',
    }),
    quarter: r({
      matchPatterns: T,
      defaultMatchWidth: 'wide',
      parsePatterns: X,
      defaultParseWidth: 'any',
      valueCallback: (e) => e + 1,
    }),
    month: r({
      matchPatterns: A,
      defaultMatchWidth: 'wide',
      parsePatterns: N,
      defaultParseWidth: 'any',
    }),
    day: r({
      matchPatterns: q,
      defaultMatchWidth: 'wide',
      parsePatterns: O,
      defaultParseWidth: 'any',
    }),
    dayPeriod: r({
      matchPatterns: R,
      defaultMatchWidth: 'any',
      parsePatterns: Y,
      defaultParseWidth: 'any',
    }),
  }
var G = {
    code: 'it',
    formatDistance: l,
    formatLong: c,
    formatRelative: h,
    localize: f,
    match: p,
    options: { weekStartsOn: 1, firstWeekContainsDate: 4 },
  },
  ie = G
export { ie as default, G as it }
