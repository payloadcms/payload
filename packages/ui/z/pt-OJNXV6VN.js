import { a as s, b as i, c as m, d as r } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var f = {
    lessThanXSeconds: { one: 'menos de um segundo', other: 'menos de {{count}} segundos' },
    xSeconds: { one: '1 segundo', other: '{{count}} segundos' },
    halfAMinute: 'meio minuto',
    lessThanXMinutes: { one: 'menos de um minuto', other: 'menos de {{count}} minutos' },
    xMinutes: { one: '1 minuto', other: '{{count}} minutos' },
    aboutXHours: { one: 'aproximadamente 1 hora', other: 'aproximadamente {{count}} horas' },
    xHours: { one: '1 hora', other: '{{count}} horas' },
    xDays: { one: '1 dia', other: '{{count}} dias' },
    aboutXWeeks: { one: 'aproximadamente 1 semana', other: 'aproximadamente {{count}} semanas' },
    xWeeks: { one: '1 semana', other: '{{count}} semanas' },
    aboutXMonths: { one: 'aproximadamente 1 m\xEAs', other: 'aproximadamente {{count}} meses' },
    xMonths: { one: '1 m\xEAs', other: '{{count}} meses' },
    aboutXYears: { one: 'aproximadamente 1 ano', other: 'aproximadamente {{count}} anos' },
    xYears: { one: '1 ano', other: '{{count}} anos' },
    overXYears: { one: 'mais de 1 ano', other: 'mais de {{count}} anos' },
    almostXYears: { one: 'quase 1 ano', other: 'quase {{count}} anos' },
  },
  d = (a, e, n) => {
    let o,
      t = f[a]
    return (
      typeof t == 'string'
        ? (o = t)
        : e === 1
          ? (o = t.one)
          : (o = t.other.replace('{{count}}', String(e))),
      n?.addSuffix ? (n.comparison && n.comparison > 0 ? 'daqui a ' + o : 'h\xE1 ' + o) : o
    )
  }
var g = {
    full: "EEEE, d 'de' MMMM 'de' y",
    long: "d 'de' MMMM 'de' y",
    medium: "d 'de' MMM 'de' y",
    short: 'dd/MM/y',
  },
  p = { full: 'HH:mm:ss zzzz', long: 'HH:mm:ss z', medium: 'HH:mm:ss', short: 'HH:mm' },
  b = {
    full: "{{date}} '\xE0s' {{time}}",
    long: "{{date}} '\xE0s' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
  u = {
    date: s({ formats: g, defaultWidth: 'full' }),
    time: s({ formats: p, defaultWidth: 'full' }),
    dateTime: s({ formats: b, defaultWidth: 'full' }),
  }
var P = {
    lastWeek: (a) => {
      let e = a.getDay()
      return "'" + (e === 0 || e === 6 ? '\xFAltimo' : '\xFAltima') + "' eeee '\xE0s' p"
    },
    yesterday: "'ontem \xE0s' p",
    today: "'hoje \xE0s' p",
    tomorrow: "'amanh\xE3 \xE0s' p",
    nextWeek: "eeee '\xE0s' p",
    other: 'P',
  },
  c = (a, e, n, o) => {
    let t = P[a]
    return typeof t == 'function' ? t(e) : t
  }
var M = {
    narrow: ['aC', 'dC'],
    abbreviated: ['a.C.', 'd.C.'],
    wide: ['antes de Cristo', 'depois de Cristo'],
  },
  v = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['T1', 'T2', 'T3', 'T4'],
    wide: ['1\xBA trimestre', '2\xBA trimestre', '3\xBA trimestre', '4\xBA trimestre'],
  },
  w = {
    narrow: ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'],
    abbreviated: [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
    ],
    wide: [
      'janeiro',
      'fevereiro',
      'mar\xE7o',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ],
  },
  y = {
    narrow: ['d', 's', 't', 'q', 'q', 's', 's'],
    short: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 's\xE1b'],
    abbreviated: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 's\xE1b'],
    wide: [
      'domingo',
      'segunda-feira',
      'ter\xE7a-feira',
      'quarta-feira',
      'quinta-feira',
      'sexta-feira',
      's\xE1bado',
    ],
  },
  x = {
    narrow: {
      am: 'AM',
      pm: 'PM',
      midnight: 'meia-noite',
      noon: 'meio-dia',
      morning: 'manh\xE3',
      afternoon: 'tarde',
      evening: 'noite',
      night: 'madrugada',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'meia-noite',
      noon: 'meio-dia',
      morning: 'manh\xE3',
      afternoon: 'tarde',
      evening: 'noite',
      night: 'madrugada',
    },
    wide: {
      am: 'AM',
      pm: 'PM',
      midnight: 'meia-noite',
      noon: 'meio-dia',
      morning: 'manh\xE3',
      afternoon: 'tarde',
      evening: 'noite',
      night: 'madrugada',
    },
  },
  q = {
    narrow: {
      am: 'AM',
      pm: 'PM',
      midnight: 'meia-noite',
      noon: 'meio-dia',
      morning: 'da manh\xE3',
      afternoon: 'da tarde',
      evening: 'da noite',
      night: 'da madrugada',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'meia-noite',
      noon: 'meio-dia',
      morning: 'da manh\xE3',
      afternoon: 'da tarde',
      evening: 'da noite',
      night: 'da madrugada',
    },
    wide: {
      am: 'AM',
      pm: 'PM',
      midnight: 'meia-noite',
      noon: 'meio-dia',
      morning: 'da manh\xE3',
      afternoon: 'da tarde',
      evening: 'da noite',
      night: 'da madrugada',
    },
  },
  W = (a, e) => Number(a) + '\xBA',
  h = {
    ordinalNumber: W,
    era: i({ values: M, defaultWidth: 'wide' }),
    quarter: i({ values: v, defaultWidth: 'wide', argumentCallback: (a) => a - 1 }),
    month: i({ values: w, defaultWidth: 'wide' }),
    day: i({ values: y, defaultWidth: 'wide' }),
    dayPeriod: i({
      values: x,
      defaultWidth: 'wide',
      formattingValues: q,
      defaultFormattingWidth: 'wide',
    }),
  }
var j = /^(\d+)(º|ª)?/i,
  z = /\d+/i,
  D = {
    narrow: /^(ac|dc|a|d)/i,
    abbreviated: /^(a\.?\s?c\.?|a\.?\s?e\.?\s?c\.?|d\.?\s?c\.?|e\.?\s?c\.?)/i,
    wide: /^(antes de cristo|antes da era comum|depois de cristo|era comum)/i,
  },
  k = {
    any: [/^ac/i, /^dc/i],
    wide: [/^(antes de cristo|antes da era comum)/i, /^(depois de cristo|era comum)/i],
  },
  C = { narrow: /^[1234]/i, abbreviated: /^T[1234]/i, wide: /^[1234](º|ª)? trimestre/i },
  H = { any: [/1/i, /2/i, /3/i, /4/i] },
  F = {
    narrow: /^[jfmasond]/i,
    abbreviated: /^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i,
    wide: /^(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i,
  },
  T = {
    narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
    any: [
      /^ja/i,
      /^f/i,
      /^mar/i,
      /^ab/i,
      /^mai/i,
      /^jun/i,
      /^jul/i,
      /^ag/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
  },
  V = {
    narrow: /^[dstq]/i,
    short: /^(dom|seg|ter|qua|qui|sex|s[áa]b)/i,
    abbreviated: /^(dom|seg|ter|qua|qui|sex|s[áa]b)/i,
    wide: /^(domingo|segunda-?\s?feira|terça-?\s?feira|quarta-?\s?feira|quinta-?\s?feira|sexta-?\s?feira|s[áa]bado)/i,
  },
  X = {
    narrow: [/^d/i, /^s/i, /^t/i, /^q/i, /^q/i, /^s/i, /^s/i],
    any: [/^d/i, /^seg/i, /^t/i, /^qua/i, /^qui/i, /^sex/i, /^s[áa]/i],
  },
  A = {
    narrow: /^(a|p|meia-?\s?noite|meio-?\s?dia|(da) (manh[ãa]|tarde|noite|madrugada))/i,
    any: /^([ap]\.?\s?m\.?|meia-?\s?noite|meio-?\s?dia|(da) (manh[ãa]|tarde|noite|madrugada))/i,
  },
  L = {
    any: {
      am: /^a/i,
      pm: /^p/i,
      midnight: /^meia/i,
      noon: /^meio/i,
      morning: /manh[ãa]/i,
      afternoon: /tarde/i,
      evening: /noite/i,
      night: /madrugada/i,
    },
  },
  l = {
    ordinalNumber: m({ matchPattern: j, parsePattern: z, valueCallback: (a) => parseInt(a, 10) }),
    era: r({
      matchPatterns: D,
      defaultMatchWidth: 'wide',
      parsePatterns: k,
      defaultParseWidth: 'any',
    }),
    quarter: r({
      matchPatterns: C,
      defaultMatchWidth: 'wide',
      parsePatterns: H,
      defaultParseWidth: 'any',
      valueCallback: (a) => a + 1,
    }),
    month: r({
      matchPatterns: F,
      defaultMatchWidth: 'wide',
      parsePatterns: T,
      defaultParseWidth: 'any',
    }),
    day: r({
      matchPatterns: V,
      defaultMatchWidth: 'wide',
      parsePatterns: X,
      defaultParseWidth: 'any',
    }),
    dayPeriod: r({
      matchPatterns: A,
      defaultMatchWidth: 'any',
      parsePatterns: L,
      defaultParseWidth: 'any',
    }),
  }
var E = {
    code: 'pt',
    formatDistance: d,
    formatLong: u,
    formatRelative: c,
    localize: h,
    match: l,
    options: { weekStartsOn: 1, firstWeekContainsDate: 4 },
  },
  $ = E
export { $ as default, E as pt }
