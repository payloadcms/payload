import { a as m, b as a, c as s, d as r } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var h = {
    lessThanXSeconds: { one: 'mindre enn ett sekund', other: 'mindre enn {{count}} sekunder' },
    xSeconds: { one: 'ett sekund', other: '{{count}} sekunder' },
    halfAMinute: 'et halvt minutt',
    lessThanXMinutes: { one: 'mindre enn ett minutt', other: 'mindre enn {{count}} minutter' },
    xMinutes: { one: 'ett minutt', other: '{{count}} minutter' },
    aboutXHours: { one: 'omtrent en time', other: 'omtrent {{count}} timer' },
    xHours: { one: 'en time', other: '{{count}} timer' },
    xDays: { one: 'en dag', other: '{{count}} dager' },
    aboutXWeeks: { one: 'omtrent en uke', other: 'omtrent {{count}} uker' },
    xWeeks: { one: 'en uke', other: '{{count}} uker' },
    aboutXMonths: { one: 'omtrent en m\xE5ned', other: 'omtrent {{count}} m\xE5neder' },
    xMonths: { one: 'en m\xE5ned', other: '{{count}} m\xE5neder' },
    aboutXYears: { one: 'omtrent ett \xE5r', other: 'omtrent {{count}} \xE5r' },
    xYears: { one: 'ett \xE5r', other: '{{count}} \xE5r' },
    overXYears: { one: 'over ett \xE5r', other: 'over {{count}} \xE5r' },
    almostXYears: { one: 'nesten ett \xE5r', other: 'nesten {{count}} \xE5r' },
  },
  d = (t, o, n) => {
    let e,
      i = h[t]
    return (
      typeof i == 'string'
        ? (e = i)
        : o === 1
          ? (e = i.one)
          : (e = i.other.replace('{{count}}', String(o))),
      n?.addSuffix ? (n.comparison && n.comparison > 0 ? 'om ' + e : e + ' siden') : e
    )
  }
var p = { full: 'EEEE d. MMMM y', long: 'd. MMMM y', medium: 'd. MMM y', short: 'dd.MM.y' },
  g = { full: "'kl'. HH:mm:ss zzzz", long: 'HH:mm:ss z', medium: 'HH:mm:ss', short: 'HH:mm' },
  b = {
    full: "{{date}} 'kl.' {{time}}",
    long: "{{date}} 'kl.' {{time}}",
    medium: '{{date}} {{time}}',
    short: '{{date}} {{time}}',
  },
  u = {
    date: m({ formats: p, defaultWidth: 'full' }),
    time: m({ formats: g, defaultWidth: 'full' }),
    dateTime: m({ formats: b, defaultWidth: 'full' }),
  }
var v = {
    lastWeek: "'forrige' eeee 'kl.' p",
    yesterday: "'i g\xE5r kl.' p",
    today: "'i dag kl.' p",
    tomorrow: "'i morgen kl.' p",
    nextWeek: "EEEE 'kl.' p",
    other: 'P',
  },
  l = (t, o, n, e) => v[t]
var k = {
    narrow: ['f.Kr.', 'e.Kr.'],
    abbreviated: ['f.Kr.', 'e.Kr.'],
    wide: ['f\xF8r Kristus', 'etter Kristus'],
  },
  P = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
    wide: ['1. kvartal', '2. kvartal', '3. kvartal', '4. kvartal'],
  },
  w = {
    narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    abbreviated: [
      'jan.',
      'feb.',
      'mars',
      'apr.',
      'mai',
      'juni',
      'juli',
      'aug.',
      'sep.',
      'okt.',
      'nov.',
      'des.',
    ],
    wide: [
      'januar',
      'februar',
      'mars',
      'april',
      'mai',
      'juni',
      'juli',
      'august',
      'september',
      'oktober',
      'november',
      'desember',
    ],
  },
  y = {
    narrow: ['S', 'M', 'T', 'O', 'T', 'F', 'L'],
    short: ['s\xF8', 'ma', 'ti', 'on', 'to', 'fr', 'l\xF8'],
    abbreviated: ['s\xF8n', 'man', 'tir', 'ons', 'tor', 'fre', 'l\xF8r'],
    wide: ['s\xF8ndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'l\xF8rdag'],
  },
  M = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'midnatt',
      noon: 'middag',
      morning: 'p\xE5 morg.',
      afternoon: 'p\xE5 etterm.',
      evening: 'p\xE5 kvelden',
      night: 'p\xE5 natten',
    },
    abbreviated: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'midnatt',
      noon: 'middag',
      morning: 'p\xE5 morg.',
      afternoon: 'p\xE5 etterm.',
      evening: 'p\xE5 kvelden',
      night: 'p\xE5 natten',
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'midnatt',
      noon: 'middag',
      morning: 'p\xE5 morgenen',
      afternoon: 'p\xE5 ettermiddagen',
      evening: 'p\xE5 kvelden',
      night: 'p\xE5 natten',
    },
  },
  W = (t, o) => Number(t) + '.',
  c = {
    ordinalNumber: W,
    era: a({ values: k, defaultWidth: 'wide' }),
    quarter: a({ values: P, defaultWidth: 'wide', argumentCallback: (t) => t - 1 }),
    month: a({ values: w, defaultWidth: 'wide' }),
    day: a({ values: y, defaultWidth: 'wide' }),
    dayPeriod: a({ values: M, defaultWidth: 'wide' }),
  }
var j = /^(\d+)\.?/i,
  x = /\d+/i,
  D = {
    narrow: /^(f\.? ?Kr\.?|fvt\.?|e\.? ?Kr\.?|evt\.?)/i,
    abbreviated: /^(f\.? ?Kr\.?|fvt\.?|e\.? ?Kr\.?|evt\.?)/i,
    wide: /^(før Kristus|før vår tid|etter Kristus|vår tid)/i,
  },
  K = { any: [/^f/i, /^e/i] },
  E = { narrow: /^[1234]/i, abbreviated: /^q[1234]/i, wide: /^[1234](\.)? kvartal/i },
  F = { any: [/1/i, /2/i, /3/i, /4/i] },
  H = {
    narrow: /^[jfmasond]/i,
    abbreviated: /^(jan|feb|mars?|apr|mai|juni?|juli?|aug|sep|okt|nov|des)\.?/i,
    wide: /^(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)/i,
  },
  z = {
    narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
    any: [
      /^ja/i,
      /^f/i,
      /^mar/i,
      /^ap/i,
      /^mai/i,
      /^jun/i,
      /^jul/i,
      /^aug/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
  },
  L = {
    narrow: /^[smtofl]/i,
    short: /^(sø|ma|ti|on|to|fr|lø)/i,
    abbreviated: /^(søn|man|tir|ons|tor|fre|lør)/i,
    wide: /^(søndag|mandag|tirsdag|onsdag|torsdag|fredag|lørdag)/i,
  },
  X = { any: [/^s/i, /^m/i, /^ti/i, /^o/i, /^to/i, /^f/i, /^l/i] },
  S = {
    narrow: /^(midnatt|middag|(på) (morgenen|ettermiddagen|kvelden|natten)|[ap])/i,
    any: /^([ap]\.?\s?m\.?|midnatt|middag|(på) (morgenen|ettermiddagen|kvelden|natten))/i,
  },
  N = {
    any: {
      am: /^a(\.?\s?m\.?)?$/i,
      pm: /^p(\.?\s?m\.?)?$/i,
      midnight: /^midn/i,
      noon: /^midd/i,
      morning: /morgen/i,
      afternoon: /ettermiddag/i,
      evening: /kveld/i,
      night: /natt/i,
    },
  },
  f = {
    ordinalNumber: s({ matchPattern: j, parsePattern: x, valueCallback: (t) => parseInt(t, 10) }),
    era: r({
      matchPatterns: D,
      defaultMatchWidth: 'wide',
      parsePatterns: K,
      defaultParseWidth: 'any',
    }),
    quarter: r({
      matchPatterns: E,
      defaultMatchWidth: 'wide',
      parsePatterns: F,
      defaultParseWidth: 'any',
      valueCallback: (t) => t + 1,
    }),
    month: r({
      matchPatterns: H,
      defaultMatchWidth: 'wide',
      parsePatterns: z,
      defaultParseWidth: 'any',
    }),
    day: r({
      matchPatterns: L,
      defaultMatchWidth: 'wide',
      parsePatterns: X,
      defaultParseWidth: 'any',
    }),
    dayPeriod: r({
      matchPatterns: S,
      defaultMatchWidth: 'any',
      parsePatterns: N,
      defaultParseWidth: 'any',
    }),
  }
var Q = {
    code: 'nb',
    formatDistance: d,
    formatLong: u,
    formatRelative: l,
    localize: c,
    match: f,
    options: { weekStartsOn: 1, firstWeekContainsDate: 4 },
  },
  U = Q
export { U as default, Q as nb }
