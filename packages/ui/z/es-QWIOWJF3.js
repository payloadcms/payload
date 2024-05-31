import { a as d, b as t, c as s, d as o } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var f = {
    lessThanXSeconds: { one: 'menos de un segundo', other: 'menos de {{count}} segundos' },
    xSeconds: { one: '1 segundo', other: '{{count}} segundos' },
    halfAMinute: 'medio minuto',
    lessThanXMinutes: { one: 'menos de un minuto', other: 'menos de {{count}} minutos' },
    xMinutes: { one: '1 minuto', other: '{{count}} minutos' },
    aboutXHours: { one: 'alrededor de 1 hora', other: 'alrededor de {{count}} horas' },
    xHours: { one: '1 hora', other: '{{count}} horas' },
    xDays: { one: '1 d\xEDa', other: '{{count}} d\xEDas' },
    aboutXWeeks: { one: 'alrededor de 1 semana', other: 'alrededor de {{count}} semanas' },
    xWeeks: { one: '1 semana', other: '{{count}} semanas' },
    aboutXMonths: { one: 'alrededor de 1 mes', other: 'alrededor de {{count}} meses' },
    xMonths: { one: '1 mes', other: '{{count}} meses' },
    aboutXYears: { one: 'alrededor de 1 a\xF1o', other: 'alrededor de {{count}} a\xF1os' },
    xYears: { one: '1 a\xF1o', other: '{{count}} a\xF1os' },
    overXYears: { one: 'm\xE1s de 1 a\xF1o', other: 'm\xE1s de {{count}} a\xF1os' },
    almostXYears: { one: 'casi 1 a\xF1o', other: 'casi {{count}} a\xF1os' },
  },
  m = (e, n, r) => {
    let a,
      i = f[e]
    return (
      typeof i == 'string'
        ? (a = i)
        : n === 1
          ? (a = i.one)
          : (a = i.other.replace('{{count}}', n.toString())),
      r?.addSuffix ? (r.comparison && r.comparison > 0 ? 'en ' + a : 'hace ' + a) : a
    )
  }
var p = {
    full: "EEEE, d 'de' MMMM 'de' y",
    long: "d 'de' MMMM 'de' y",
    medium: 'd MMM y',
    short: 'dd/MM/y',
  },
  b = { full: 'HH:mm:ss zzzz', long: 'HH:mm:ss z', medium: 'HH:mm:ss', short: 'HH:mm' },
  g = {
    full: "{{date}} 'a las' {{time}}",
    long: "{{date}} 'a las' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
  l = {
    date: d({ formats: p, defaultWidth: 'full' }),
    time: d({ formats: b, defaultWidth: 'full' }),
    dateTime: d({ formats: g, defaultWidth: 'full' }),
  }
var v = {
    lastWeek: "'el' eeee 'pasado a la' p",
    yesterday: "'ayer a la' p",
    today: "'hoy a la' p",
    tomorrow: "'ma\xF1ana a la' p",
    nextWeek: "eeee 'a la' p",
    other: 'P',
  },
  y = {
    lastWeek: "'el' eeee 'pasado a las' p",
    yesterday: "'ayer a las' p",
    today: "'hoy a las' p",
    tomorrow: "'ma\xF1ana a las' p",
    nextWeek: "eeee 'a las' p",
    other: 'P',
  },
  u = (e, n, r, a) => (n.getHours() !== 1 ? y[e] : v[e])
var P = {
    narrow: ['AC', 'DC'],
    abbreviated: ['AC', 'DC'],
    wide: ['antes de cristo', 'despu\xE9s de cristo'],
  },
  w = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['T1', 'T2', 'T3', 'T4'],
    wide: ['1\xBA trimestre', '2\xBA trimestre', '3\xBA trimestre', '4\xBA trimestre'],
  },
  M = {
    narrow: ['e', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'],
    abbreviated: [
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
    ],
    wide: [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ],
  },
  W = {
    narrow: ['d', 'l', 'm', 'm', 'j', 'v', 's'],
    short: ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 's\xE1'],
    abbreviated: ['dom', 'lun', 'mar', 'mi\xE9', 'jue', 'vie', 's\xE1b'],
    wide: ['domingo', 'lunes', 'martes', 'mi\xE9rcoles', 'jueves', 'viernes', 's\xE1bado'],
  },
  j = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mn',
      noon: 'md',
      morning: 'ma\xF1ana',
      afternoon: 'tarde',
      evening: 'tarde',
      night: 'noche',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'medianoche',
      noon: 'mediodia',
      morning: 'ma\xF1ana',
      afternoon: 'tarde',
      evening: 'tarde',
      night: 'noche',
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'medianoche',
      noon: 'mediodia',
      morning: 'ma\xF1ana',
      afternoon: 'tarde',
      evening: 'tarde',
      night: 'noche',
    },
  },
  x = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mn',
      noon: 'md',
      morning: 'de la ma\xF1ana',
      afternoon: 'de la tarde',
      evening: 'de la tarde',
      night: 'de la noche',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'medianoche',
      noon: 'mediodia',
      morning: 'de la ma\xF1ana',
      afternoon: 'de la tarde',
      evening: 'de la tarde',
      night: 'de la noche',
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'medianoche',
      noon: 'mediodia',
      morning: 'de la ma\xF1ana',
      afternoon: 'de la tarde',
      evening: 'de la tarde',
      night: 'de la noche',
    },
  },
  D = (e, n) => Number(e) + '\xBA',
  c = {
    ordinalNumber: D,
    era: t({ values: P, defaultWidth: 'wide' }),
    quarter: t({ values: w, defaultWidth: 'wide', argumentCallback: (e) => Number(e) - 1 }),
    month: t({ values: M, defaultWidth: 'wide' }),
    day: t({ values: W, defaultWidth: 'wide' }),
    dayPeriod: t({
      values: j,
      defaultWidth: 'wide',
      formattingValues: x,
      defaultFormattingWidth: 'wide',
    }),
  }
var k = /^(\d+)(º)?/i,
  z = /\d+/i,
  H = {
    narrow: /^(ac|dc|a|d)/i,
    abbreviated: /^(a\.?\s?c\.?|a\.?\s?e\.?\s?c\.?|d\.?\s?c\.?|e\.?\s?c\.?)/i,
    wide: /^(antes de cristo|antes de la era com[uú]n|despu[eé]s de cristo|era com[uú]n)/i,
  },
  F = {
    any: [/^ac/i, /^dc/i],
    wide: [/^(antes de cristo|antes de la era com[uú]n)/i, /^(despu[eé]s de cristo|era com[uú]n)/i],
  },
  T = { narrow: /^[1234]/i, abbreviated: /^T[1234]/i, wide: /^[1234](º)? trimestre/i },
  C = { any: [/1/i, /2/i, /3/i, /4/i] },
  L = {
    narrow: /^[efmajsond]/i,
    abbreviated: /^(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i,
    wide: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
  },
  V = {
    narrow: [/^e/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
    any: [
      /^en/i,
      /^feb/i,
      /^mar/i,
      /^abr/i,
      /^may/i,
      /^jun/i,
      /^jul/i,
      /^ago/i,
      /^sep/i,
      /^oct/i,
      /^nov/i,
      /^dic/i,
    ],
  },
  X = {
    narrow: /^[dlmjvs]/i,
    short: /^(do|lu|ma|mi|ju|vi|s[áa])/i,
    abbreviated: /^(dom|lun|mar|mi[ée]|jue|vie|s[áa]b)/i,
    wide: /^(domingo|lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado)/i,
  },
  N = {
    narrow: [/^d/i, /^l/i, /^m/i, /^m/i, /^j/i, /^v/i, /^s/i],
    any: [/^do/i, /^lu/i, /^ma/i, /^mi/i, /^ju/i, /^vi/i, /^sa/i],
  },
  E = {
    narrow: /^(a|p|mn|md|(de la|a las) (mañana|tarde|noche))/i,
    any: /^([ap]\.?\s?m\.?|medianoche|mediodia|(de la|a las) (mañana|tarde|noche))/i,
  },
  A = {
    any: {
      am: /^a/i,
      pm: /^p/i,
      midnight: /^mn/i,
      noon: /^md/i,
      morning: /mañana/i,
      afternoon: /tarde/i,
      evening: /tarde/i,
      night: /noche/i,
    },
  },
  h = {
    ordinalNumber: s({
      matchPattern: k,
      parsePattern: z,
      valueCallback: function (e) {
        return parseInt(e, 10)
      },
    }),
    era: o({
      matchPatterns: H,
      defaultMatchWidth: 'wide',
      parsePatterns: F,
      defaultParseWidth: 'any',
    }),
    quarter: o({
      matchPatterns: T,
      defaultMatchWidth: 'wide',
      parsePatterns: C,
      defaultParseWidth: 'any',
      valueCallback: (e) => e + 1,
    }),
    month: o({
      matchPatterns: L,
      defaultMatchWidth: 'wide',
      parsePatterns: V,
      defaultParseWidth: 'any',
    }),
    day: o({
      matchPatterns: X,
      defaultMatchWidth: 'wide',
      parsePatterns: N,
      defaultParseWidth: 'any',
    }),
    dayPeriod: o({
      matchPatterns: E,
      defaultMatchWidth: 'any',
      parsePatterns: A,
      defaultParseWidth: 'any',
    }),
  }
var R = {
    code: 'es',
    formatDistance: m,
    formatLong: l,
    formatRelative: u,
    localize: c,
    match: h,
    options: { weekStartsOn: 1, firstWeekContainsDate: 1 },
  },
  ee = R
export { ee as default, R as es }
