import { a as s, b as r, c as l, d as n } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var j = {
    about: 'k\xF6r\xFClbel\xFCl',
    over: 't\xF6bb mint',
    almost: 'majdnem',
    lessthan: 'kevesebb mint',
  },
  w = {
    xseconds: ' m\xE1sodperc',
    halfaminute: 'f\xE9l perc',
    xminutes: ' perc',
    xhours: ' \xF3ra',
    xdays: ' nap',
    xweeks: ' h\xE9t',
    xmonths: ' h\xF3nap',
    xyears: ' \xE9v',
  },
  P = {
    xseconds: {
      '-1': ' m\xE1sodperccel ezel\u0151tt',
      1: ' m\xE1sodperc m\xFAlva',
      0: ' m\xE1sodperce',
    },
    halfaminute: {
      '-1': 'f\xE9l perccel ezel\u0151tt',
      1: 'f\xE9l perc m\xFAlva',
      0: 'f\xE9l perce',
    },
    xminutes: { '-1': ' perccel ezel\u0151tt', 1: ' perc m\xFAlva', 0: ' perce' },
    xhours: { '-1': ' \xF3r\xE1val ezel\u0151tt', 1: ' \xF3ra m\xFAlva', 0: ' \xF3r\xE1ja' },
    xdays: { '-1': ' nappal ezel\u0151tt', 1: ' nap m\xFAlva', 0: ' napja' },
    xweeks: { '-1': ' h\xE9ttel ezel\u0151tt', 1: ' h\xE9t m\xFAlva', 0: ' hete' },
    xmonths: { '-1': ' h\xF3nappal ezel\u0151tt', 1: ' h\xF3nap m\xFAlva', 0: ' h\xF3napja' },
    xyears: { '-1': ' \xE9vvel ezel\u0151tt', 1: ' \xE9v m\xFAlva', 0: ' \xE9ve' },
  },
  u = (e, a, t) => {
    let i = e.match(/about|over|almost|lessthan/i),
      z = i ? e.replace(i[0], '') : e,
      b = t?.addSuffix === !0,
      o = z.toLowerCase(),
      g = t?.comparison || 0,
      m = b ? P[o][g] : w[o],
      d = o === 'halfaminute' ? m : a + m
    if (i) {
      let y = i[0].toLowerCase()
      d = j[y] + ' ' + d
    }
    return d
  }
var k = { full: 'y. MMMM d., EEEE', long: 'y. MMMM d.', medium: 'y. MMM d.', short: 'y. MM. dd.' },
  I = { full: 'H:mm:ss zzzz', long: 'H:mm:ss z', medium: 'H:mm:ss', short: 'H:mm' },
  x = {
    full: '{{date}} {{time}}',
    long: '{{date}} {{time}}',
    medium: '{{date}} {{time}}',
    short: '{{date}} {{time}}',
  },
  c = {
    date: s({ formats: k, defaultWidth: 'full' }),
    time: s({ formats: I, defaultWidth: 'full' }),
    dateTime: s({ formats: x, defaultWidth: 'full' }),
  }
var M = [
  'vas\xE1rnap',
  'h\xE9tf\u0151n',
  'kedden',
  'szerd\xE1n',
  'cs\xFCt\xF6rt\xF6k\xF6n',
  'p\xE9nteken',
  'szombaton',
]
function f(e) {
  return (a) => {
    let t = M[a.getDay()]
    return `${e ? '' : "'m\xFAlt' "}'${t}' p'-kor'`
  }
}
var W = {
    lastWeek: f(!1),
    yesterday: "'tegnap' p'-kor'",
    today: "'ma' p'-kor'",
    tomorrow: "'holnap' p'-kor'",
    nextWeek: f(!0),
    other: 'P',
  },
  h = (e, a) => {
    let t = W[e]
    return typeof t == 'function' ? t(a) : t
  }
var V = {
    narrow: ['ie.', 'isz.'],
    abbreviated: ['i. e.', 'i. sz.'],
    wide: ['Krisztus el\u0151tt', 'id\u0151sz\xE1m\xEDt\xE1sunk szerint'],
  },
  S = {
    narrow: ['1.', '2.', '3.', '4.'],
    abbreviated: ['1. n.\xE9v', '2. n.\xE9v', '3. n.\xE9v', '4. n.\xE9v'],
    wide: ['1. negyed\xE9v', '2. negyed\xE9v', '3. negyed\xE9v', '4. negyed\xE9v'],
  },
  D = {
    narrow: ['I.', 'II.', 'III.', 'IV.'],
    abbreviated: ['I. n.\xE9v', 'II. n.\xE9v', 'III. n.\xE9v', 'IV. n.\xE9v'],
    wide: ['I. negyed\xE9v', 'II. negyed\xE9v', 'III. negyed\xE9v', 'IV. negyed\xE9v'],
  },
  F = {
    narrow: ['J', 'F', 'M', '\xC1', 'M', 'J', 'J', 'A', 'Sz', 'O', 'N', 'D'],
    abbreviated: [
      'jan.',
      'febr.',
      'm\xE1rc.',
      '\xE1pr.',
      'm\xE1j.',
      'j\xFAn.',
      'j\xFAl.',
      'aug.',
      'szept.',
      'okt.',
      'nov.',
      'dec.',
    ],
    wide: [
      'janu\xE1r',
      'febru\xE1r',
      'm\xE1rcius',
      '\xE1prilis',
      'm\xE1jus',
      'j\xFAnius',
      'j\xFAlius',
      'augusztus',
      'szeptember',
      'okt\xF3ber',
      'november',
      'december',
    ],
  },
  C = {
    narrow: ['V', 'H', 'K', 'Sz', 'Cs', 'P', 'Sz'],
    short: ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'],
    abbreviated: ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'],
    wide: [
      'vas\xE1rnap',
      'h\xE9tf\u0151',
      'kedd',
      'szerda',
      'cs\xFCt\xF6rt\xF6k',
      'p\xE9ntek',
      'szombat',
    ],
  },
  L = {
    narrow: {
      am: 'de.',
      pm: 'du.',
      midnight: '\xE9jf\xE9l',
      noon: 'd\xE9l',
      morning: 'reggel',
      afternoon: 'du.',
      evening: 'este',
      night: '\xE9jjel',
    },
    abbreviated: {
      am: 'de.',
      pm: 'du.',
      midnight: '\xE9jf\xE9l',
      noon: 'd\xE9l',
      morning: 'reggel',
      afternoon: 'du.',
      evening: 'este',
      night: '\xE9jjel',
    },
    wide: {
      am: 'de.',
      pm: 'du.',
      midnight: '\xE9jf\xE9l',
      noon: 'd\xE9l',
      morning: 'reggel',
      afternoon: 'd\xE9lut\xE1n',
      evening: 'este',
      night: '\xE9jjel',
    },
  },
  H = (e, a) => Number(e) + '.',
  p = {
    ordinalNumber: H,
    era: r({ values: V, defaultWidth: 'wide' }),
    quarter: r({
      values: S,
      defaultWidth: 'wide',
      argumentCallback: (e) => e - 1,
      formattingValues: D,
      defaultFormattingWidth: 'wide',
    }),
    month: r({ values: F, defaultWidth: 'wide' }),
    day: r({ values: C, defaultWidth: 'wide' }),
    dayPeriod: r({ values: L, defaultWidth: 'wide' }),
  }
var E = /^(\d+)\.?/i,
  N = /\d+/i,
  K = {
    narrow: /^(ie\.|isz\.)/i,
    abbreviated: /^(i\.\s?e\.?|b?\s?c\s?e|i\.\s?sz\.?)/i,
    wide: /^(Krisztus előtt|időszámításunk előtt|időszámításunk szerint|i\. sz\.)/i,
  },
  O = {
    narrow: [/ie/i, /isz/i],
    abbreviated: [/^(i\.?\s?e\.?|b\s?ce)/i, /^(i\.?\s?sz\.?|c\s?e)/i],
    any: [/előtt/i, /(szerint|i. sz.)/i],
  },
  R = {
    narrow: /^[1234]\.?/i,
    abbreviated: /^[1234]?\.?\s?n\.év/i,
    wide: /^([1234]|I|II|III|IV)?\.?\s?negyedév/i,
  },
  $ = { any: [/1|I$/i, /2|II$/i, /3|III/i, /4|IV/i] },
  q = {
    narrow: /^[jfmaásond]|sz/i,
    abbreviated:
      /^(jan\.?|febr\.?|márc\.?|ápr\.?|máj\.?|jún\.?|júl\.?|aug\.?|szept\.?|okt\.?|nov\.?|dec\.?)/i,
    wide: /^(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)/i,
  },
  J = {
    narrow: [
      /^j/i,
      /^f/i,
      /^m/i,
      /^a|á/i,
      /^m/i,
      /^j/i,
      /^j/i,
      /^a/i,
      /^s|sz/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
    any: [
      /^ja/i,
      /^f/i,
      /^már/i,
      /^áp/i,
      /^máj/i,
      /^jún/i,
      /^júl/i,
      /^au/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
  },
  Q = {
    narrow: /^([vhkpc]|sz|cs|sz)/i,
    short: /^([vhkp]|sze|cs|szo)/i,
    abbreviated: /^([vhkp]|sze|cs|szo)/i,
    wide: /^(vasárnap|hétfő|kedd|szerda|csütörtök|péntek|szombat)/i,
  },
  T = {
    narrow: [/^v/i, /^h/i, /^k/i, /^sz/i, /^c/i, /^p/i, /^sz/i],
    any: [/^v/i, /^h/i, /^k/i, /^sze/i, /^c/i, /^p/i, /^szo/i],
  },
  A = { any: /^((de|du)\.?|éjfél|délután|dél|reggel|este|éjjel)/i },
  _ = {
    any: {
      am: /^de\.?/i,
      pm: /^du\.?/i,
      midnight: /^éjf/i,
      noon: /^dé/i,
      morning: /reg/i,
      afternoon: /^délu\.?/i,
      evening: /es/i,
      night: /éjj/i,
    },
  },
  v = {
    ordinalNumber: l({ matchPattern: E, parsePattern: N, valueCallback: (e) => parseInt(e, 10) }),
    era: n({
      matchPatterns: K,
      defaultMatchWidth: 'wide',
      parsePatterns: O,
      defaultParseWidth: 'any',
    }),
    quarter: n({
      matchPatterns: R,
      defaultMatchWidth: 'wide',
      parsePatterns: $,
      defaultParseWidth: 'any',
      valueCallback: (e) => e + 1,
    }),
    month: n({
      matchPatterns: q,
      defaultMatchWidth: 'wide',
      parsePatterns: J,
      defaultParseWidth: 'any',
    }),
    day: n({
      matchPatterns: Q,
      defaultMatchWidth: 'wide',
      parsePatterns: T,
      defaultParseWidth: 'any',
    }),
    dayPeriod: n({
      matchPatterns: A,
      defaultMatchWidth: 'any',
      parsePatterns: _,
      defaultParseWidth: 'any',
    }),
  }
var B = {
    code: 'hu',
    formatDistance: u,
    formatLong: c,
    formatRelative: h,
    localize: p,
    match: v,
    options: { weekStartsOn: 1, firstWeekContainsDate: 4 },
  },
  me = B
export { me as default, B as hu }
