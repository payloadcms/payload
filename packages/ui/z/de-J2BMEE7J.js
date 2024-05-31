import { a as s, b as n, c as m, d as a } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var d = {
    lessThanXSeconds: {
      standalone: { one: 'weniger als 1 Sekunde', other: 'weniger als {{count}} Sekunden' },
      withPreposition: { one: 'weniger als 1 Sekunde', other: 'weniger als {{count}} Sekunden' },
    },
    xSeconds: {
      standalone: { one: '1 Sekunde', other: '{{count}} Sekunden' },
      withPreposition: { one: '1 Sekunde', other: '{{count}} Sekunden' },
    },
    halfAMinute: { standalone: 'halbe Minute', withPreposition: 'halben Minute' },
    lessThanXMinutes: {
      standalone: { one: 'weniger als 1 Minute', other: 'weniger als {{count}} Minuten' },
      withPreposition: { one: 'weniger als 1 Minute', other: 'weniger als {{count}} Minuten' },
    },
    xMinutes: {
      standalone: { one: '1 Minute', other: '{{count}} Minuten' },
      withPreposition: { one: '1 Minute', other: '{{count}} Minuten' },
    },
    aboutXHours: {
      standalone: { one: 'etwa 1 Stunde', other: 'etwa {{count}} Stunden' },
      withPreposition: { one: 'etwa 1 Stunde', other: 'etwa {{count}} Stunden' },
    },
    xHours: {
      standalone: { one: '1 Stunde', other: '{{count}} Stunden' },
      withPreposition: { one: '1 Stunde', other: '{{count}} Stunden' },
    },
    xDays: {
      standalone: { one: '1 Tag', other: '{{count}} Tage' },
      withPreposition: { one: '1 Tag', other: '{{count}} Tagen' },
    },
    aboutXWeeks: {
      standalone: { one: 'etwa 1 Woche', other: 'etwa {{count}} Wochen' },
      withPreposition: { one: 'etwa 1 Woche', other: 'etwa {{count}} Wochen' },
    },
    xWeeks: {
      standalone: { one: '1 Woche', other: '{{count}} Wochen' },
      withPreposition: { one: '1 Woche', other: '{{count}} Wochen' },
    },
    aboutXMonths: {
      standalone: { one: 'etwa 1 Monat', other: 'etwa {{count}} Monate' },
      withPreposition: { one: 'etwa 1 Monat', other: 'etwa {{count}} Monaten' },
    },
    xMonths: {
      standalone: { one: '1 Monat', other: '{{count}} Monate' },
      withPreposition: { one: '1 Monat', other: '{{count}} Monaten' },
    },
    aboutXYears: {
      standalone: { one: 'etwa 1 Jahr', other: 'etwa {{count}} Jahre' },
      withPreposition: { one: 'etwa 1 Jahr', other: 'etwa {{count}} Jahren' },
    },
    xYears: {
      standalone: { one: '1 Jahr', other: '{{count}} Jahre' },
      withPreposition: { one: '1 Jahr', other: '{{count}} Jahren' },
    },
    overXYears: {
      standalone: { one: 'mehr als 1 Jahr', other: 'mehr als {{count}} Jahre' },
      withPreposition: { one: 'mehr als 1 Jahr', other: 'mehr als {{count}} Jahren' },
    },
    almostXYears: {
      standalone: { one: 'fast 1 Jahr', other: 'fast {{count}} Jahre' },
      withPreposition: { one: 'fast 1 Jahr', other: 'fast {{count}} Jahren' },
    },
  },
  u = (t, r, o) => {
    let e,
      i = o?.addSuffix ? d[t].withPreposition : d[t].standalone
    return (
      typeof i == 'string'
        ? (e = i)
        : r === 1
          ? (e = i.one)
          : (e = i.other.replace('{{count}}', String(r))),
      o?.addSuffix ? (o.comparison && o.comparison > 0 ? 'in ' + e : 'vor ' + e) : e
    )
  }
var M = { full: 'EEEE, do MMMM y', long: 'do MMMM y', medium: 'do MMM y', short: 'dd.MM.y' },
  w = { full: 'HH:mm:ss zzzz', long: 'HH:mm:ss z', medium: 'HH:mm:ss', short: 'HH:mm' },
  p = {
    full: "{{date}} 'um' {{time}}",
    long: "{{date}} 'um' {{time}}",
    medium: '{{date}} {{time}}',
    short: '{{date}} {{time}}',
  },
  c = {
    date: s({ formats: M, defaultWidth: 'full' }),
    time: s({ formats: w, defaultWidth: 'full' }),
    dateTime: s({ formats: p, defaultWidth: 'full' }),
  }
var b = {
    lastWeek: "'letzten' eeee 'um' p",
    yesterday: "'gestern um' p",
    today: "'heute um' p",
    tomorrow: "'morgen um' p",
    nextWeek: "eeee 'um' p",
    other: 'P',
  },
  l = (t, r, o, e) => b[t]
var v = {
    narrow: ['v.Chr.', 'n.Chr.'],
    abbreviated: ['v.Chr.', 'n.Chr.'],
    wide: ['vor Christus', 'nach Christus'],
  },
  P = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
    wide: ['1. Quartal', '2. Quartal', '3. Quartal', '4. Quartal'],
  },
  h = {
    narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    abbreviated: [
      'Jan',
      'Feb',
      'M\xE4r',
      'Apr',
      'Mai',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Okt',
      'Nov',
      'Dez',
    ],
    wide: [
      'Januar',
      'Februar',
      'M\xE4rz',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Dezember',
    ],
  },
  S = {
    narrow: h.narrow,
    abbreviated: [
      'Jan.',
      'Feb.',
      'M\xE4rz',
      'Apr.',
      'Mai',
      'Juni',
      'Juli',
      'Aug.',
      'Sep.',
      'Okt.',
      'Nov.',
      'Dez.',
    ],
    wide: h.wide,
  },
  W = {
    narrow: ['S', 'M', 'D', 'M', 'D', 'F', 'S'],
    short: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    abbreviated: ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'],
    wide: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  },
  y = {
    narrow: {
      am: 'vm.',
      pm: 'nm.',
      midnight: 'Mitternacht',
      noon: 'Mittag',
      morning: 'Morgen',
      afternoon: 'Nachm.',
      evening: 'Abend',
      night: 'Nacht',
    },
    abbreviated: {
      am: 'vorm.',
      pm: 'nachm.',
      midnight: 'Mitternacht',
      noon: 'Mittag',
      morning: 'Morgen',
      afternoon: 'Nachmittag',
      evening: 'Abend',
      night: 'Nacht',
    },
    wide: {
      am: 'vormittags',
      pm: 'nachmittags',
      midnight: 'Mitternacht',
      noon: 'Mittag',
      morning: 'Morgen',
      afternoon: 'Nachmittag',
      evening: 'Abend',
      night: 'Nacht',
    },
  },
  J = {
    narrow: {
      am: 'vm.',
      pm: 'nm.',
      midnight: 'Mitternacht',
      noon: 'Mittag',
      morning: 'morgens',
      afternoon: 'nachm.',
      evening: 'abends',
      night: 'nachts',
    },
    abbreviated: {
      am: 'vorm.',
      pm: 'nachm.',
      midnight: 'Mitternacht',
      noon: 'Mittag',
      morning: 'morgens',
      afternoon: 'nachmittags',
      evening: 'abends',
      night: 'nachts',
    },
    wide: {
      am: 'vormittags',
      pm: 'nachmittags',
      midnight: 'Mitternacht',
      noon: 'Mittag',
      morning: 'morgens',
      afternoon: 'nachmittags',
      evening: 'abends',
      night: 'nachts',
    },
  },
  D = (t) => Number(t) + '.',
  g = {
    ordinalNumber: D,
    era: n({ values: v, defaultWidth: 'wide' }),
    quarter: n({ values: P, defaultWidth: 'wide', argumentCallback: (t) => t - 1 }),
    month: n({ values: h, formattingValues: S, defaultWidth: 'wide' }),
    day: n({ values: W, defaultWidth: 'wide' }),
    dayPeriod: n({
      values: y,
      defaultWidth: 'wide',
      formattingValues: J,
      defaultFormattingWidth: 'wide',
    }),
  }
var k = /^(\d+)(\.)?/i,
  z = /\d+/i,
  x = {
    narrow: /^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
    abbreviated: /^(v\.? ?Chr\.?|n\.? ?Chr\.?)/i,
    wide: /^(vor Christus|vor unserer Zeitrechnung|nach Christus|unserer Zeitrechnung)/i,
  },
  F = { any: [/^v/i, /^n/i] },
  C = { narrow: /^[1234]/i, abbreviated: /^q[1234]/i, wide: /^[1234](\.)? Quartal/i },
  N = { any: [/1/i, /2/i, /3/i, /4/i] },
  j = {
    narrow: /^[jfmasond]/i,
    abbreviated: /^(j[aä]n|feb|mär[z]?|apr|mai|jun[i]?|jul[i]?|aug|sep|okt|nov|dez)\.?/i,
    wide: /^(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)/i,
  },
  A = {
    narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
    any: [
      /^j[aä]/i,
      /^f/i,
      /^mär/i,
      /^ap/i,
      /^mai/i,
      /^jun/i,
      /^jul/i,
      /^au/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
  },
  Q = {
    narrow: /^[smdmf]/i,
    short: /^(so|mo|di|mi|do|fr|sa)/i,
    abbreviated: /^(son?|mon?|die?|mit?|don?|fre?|sam?)\.?/i,
    wide: /^(sonntag|montag|dienstag|mittwoch|donnerstag|freitag|samstag)/i,
  },
  H = { any: [/^so/i, /^mo/i, /^di/i, /^mi/i, /^do/i, /^f/i, /^sa/i] },
  V = {
    narrow: /^(vm\.?|nm\.?|Mitternacht|Mittag|morgens|nachm\.?|abends|nachts)/i,
    abbreviated: /^(vorm\.?|nachm\.?|Mitternacht|Mittag|morgens|nachm\.?|abends|nachts)/i,
    wide: /^(vormittags|nachmittags|Mitternacht|Mittag|morgens|nachmittags|abends|nachts)/i,
  },
  T = {
    any: {
      am: /^v/i,
      pm: /^n/i,
      midnight: /^Mitte/i,
      noon: /^Mitta/i,
      morning: /morgens/i,
      afternoon: /nachmittags/i,
      evening: /abends/i,
      night: /nachts/i,
    },
  },
  f = {
    ordinalNumber: m({ matchPattern: k, parsePattern: z, valueCallback: (t) => parseInt(t) }),
    era: a({
      matchPatterns: x,
      defaultMatchWidth: 'wide',
      parsePatterns: F,
      defaultParseWidth: 'any',
    }),
    quarter: a({
      matchPatterns: C,
      defaultMatchWidth: 'wide',
      parsePatterns: N,
      defaultParseWidth: 'any',
      valueCallback: (t) => t + 1,
    }),
    month: a({
      matchPatterns: j,
      defaultMatchWidth: 'wide',
      parsePatterns: A,
      defaultParseWidth: 'any',
    }),
    day: a({
      matchPatterns: Q,
      defaultMatchWidth: 'wide',
      parsePatterns: H,
      defaultParseWidth: 'any',
    }),
    dayPeriod: a({
      matchPatterns: V,
      defaultMatchWidth: 'wide',
      parsePatterns: T,
      defaultParseWidth: 'any',
    }),
  }
var X = {
    code: 'de',
    formatDistance: u,
    formatLong: c,
    formatRelative: l,
    localize: g,
    match: f,
    options: { weekStartsOn: 1, firstWeekContainsDate: 4 },
  },
  tt = X
export { X as de, tt as default }
