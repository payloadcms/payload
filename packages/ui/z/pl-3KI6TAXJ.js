import { a as c } from './chunk-YZ5EFHMQ.js'
import './chunk-N2T43CBH.js'
import { a as s, b as a, c as u, d as r } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var k = {
  lessThanXSeconds: {
    one: {
      regular: 'mniej ni\u017C sekunda',
      past: 'mniej ni\u017C sekund\u0119',
      future: 'mniej ni\u017C sekund\u0119',
    },
    twoFour: 'mniej ni\u017C {{count}} sekundy',
    other: 'mniej ni\u017C {{count}} sekund',
  },
  xSeconds: {
    one: { regular: 'sekunda', past: 'sekund\u0119', future: 'sekund\u0119' },
    twoFour: '{{count}} sekundy',
    other: '{{count}} sekund',
  },
  halfAMinute: {
    one: 'p\xF3\u0142 minuty',
    twoFour: 'p\xF3\u0142 minuty',
    other: 'p\xF3\u0142 minuty',
  },
  lessThanXMinutes: {
    one: {
      regular: 'mniej ni\u017C minuta',
      past: 'mniej ni\u017C minut\u0119',
      future: 'mniej ni\u017C minut\u0119',
    },
    twoFour: 'mniej ni\u017C {{count}} minuty',
    other: 'mniej ni\u017C {{count}} minut',
  },
  xMinutes: {
    one: { regular: 'minuta', past: 'minut\u0119', future: 'minut\u0119' },
    twoFour: '{{count}} minuty',
    other: '{{count}} minut',
  },
  aboutXHours: {
    one: {
      regular: 'oko\u0142o godziny',
      past: 'oko\u0142o godziny',
      future: 'oko\u0142o godzin\u0119',
    },
    twoFour: 'oko\u0142o {{count}} godziny',
    other: 'oko\u0142o {{count}} godzin',
  },
  xHours: {
    one: { regular: 'godzina', past: 'godzin\u0119', future: 'godzin\u0119' },
    twoFour: '{{count}} godziny',
    other: '{{count}} godzin',
  },
  xDays: {
    one: { regular: 'dzie\u0144', past: 'dzie\u0144', future: '1 dzie\u0144' },
    twoFour: '{{count}} dni',
    other: '{{count}} dni',
  },
  aboutXWeeks: {
    one: 'oko\u0142o tygodnia',
    twoFour: 'oko\u0142o {{count}} tygodni',
    other: 'oko\u0142o {{count}} tygodni',
  },
  xWeeks: { one: 'tydzie\u0144', twoFour: '{{count}} tygodnie', other: '{{count}} tygodni' },
  aboutXMonths: {
    one: 'oko\u0142o miesi\u0105c',
    twoFour: 'oko\u0142o {{count}} miesi\u0105ce',
    other: 'oko\u0142o {{count}} miesi\u0119cy',
  },
  xMonths: {
    one: 'miesi\u0105c',
    twoFour: '{{count}} miesi\u0105ce',
    other: '{{count}} miesi\u0119cy',
  },
  aboutXYears: {
    one: 'oko\u0142o rok',
    twoFour: 'oko\u0142o {{count}} lata',
    other: 'oko\u0142o {{count}} lat',
  },
  xYears: { one: 'rok', twoFour: '{{count}} lata', other: '{{count}} lat' },
  overXYears: { one: 'ponad rok', twoFour: 'ponad {{count}} lata', other: 'ponad {{count}} lat' },
  almostXYears: {
    one: 'prawie rok',
    twoFour: 'prawie {{count}} lata',
    other: 'prawie {{count}} lat',
  },
}
function y(e, t) {
  if (t === 1) return e.one
  let n = t % 100
  if (n <= 20 && n > 10) return e.other
  let o = n % 10
  return o >= 2 && o <= 4 ? e.twoFour : e.other
}
function d(e, t, n) {
  let o = y(e, t)
  return (typeof o == 'string' ? o : o[n]).replace('{{count}}', String(t))
}
var m = (e, t, n) => {
  let o = k[e]
  return n?.addSuffix
    ? n.comparison && n.comparison > 0
      ? 'za ' + d(o, t, 'future')
      : d(o, t, 'past') + ' temu'
    : d(o, t, 'regular')
}
var b = { full: 'EEEE, do MMMM y', long: 'do MMMM y', medium: 'do MMM y', short: 'dd.MM.y' },
  P = { full: 'HH:mm:ss zzzz', long: 'HH:mm:ss z', medium: 'HH:mm:ss', short: 'HH:mm' },
  v = {
    full: '{{date}} {{time}}',
    long: '{{date}} {{time}}',
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
  p = {
    date: s({ formats: b, defaultWidth: 'full' }),
    time: s({ formats: P, defaultWidth: 'full' }),
    dateTime: s({ formats: v, defaultWidth: 'full' }),
  }
var M = { masculine: 'ostatni', feminine: 'ostatnia' },
  I = { masculine: 'ten', feminine: 'ta' },
  W = { masculine: 'nast\u0119pny', feminine: 'nast\u0119pna' },
  j = {
    0: 'feminine',
    1: 'masculine',
    2: 'masculine',
    3: 'feminine',
    4: 'masculine',
    5: 'masculine',
    6: 'feminine',
  }
function l(e, t, n, o) {
  let i
  if (c(t, n, o)) i = I
  else if (e === 'lastWeek') i = M
  else if (e === 'nextWeek') i = W
  else throw new Error(`Cannot determine adjectives for token ${e}`)
  let g = t.getDay(),
    z = j[g]
  return `'${i[z]}' eeee 'o' p`
}
var F = {
    lastWeek: l,
    yesterday: "'wczoraj o' p",
    today: "'dzisiaj o' p",
    tomorrow: "'jutro o' p",
    nextWeek: l,
    other: 'P',
  },
  w = (e, t, n, o) => {
    let i = F[e]
    return typeof i == 'function' ? i(e, t, n, o) : i
  }
var x = {
    narrow: ['p.n.e.', 'n.e.'],
    abbreviated: ['p.n.e.', 'n.e.'],
    wide: ['przed nasz\u0105 er\u0105', 'naszej ery'],
  },
  V = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['I kw.', 'II kw.', 'III kw.', 'IV kw.'],
    wide: ['I kwarta\u0142', 'II kwarta\u0142', 'III kwarta\u0142', 'IV kwarta\u0142'],
  },
  D = {
    narrow: ['S', 'L', 'M', 'K', 'M', 'C', 'L', 'S', 'W', 'P', 'L', 'G'],
    abbreviated: [
      'sty',
      'lut',
      'mar',
      'kwi',
      'maj',
      'cze',
      'lip',
      'sie',
      'wrz',
      'pa\u017A',
      'lis',
      'gru',
    ],
    wide: [
      'stycze\u0144',
      'luty',
      'marzec',
      'kwiecie\u0144',
      'maj',
      'czerwiec',
      'lipiec',
      'sierpie\u0144',
      'wrzesie\u0144',
      'pa\u017Adziernik',
      'listopad',
      'grudzie\u0144',
    ],
  },
  L = {
    narrow: ['s', 'l', 'm', 'k', 'm', 'c', 'l', 's', 'w', 'p', 'l', 'g'],
    abbreviated: [
      'sty',
      'lut',
      'mar',
      'kwi',
      'maj',
      'cze',
      'lip',
      'sie',
      'wrz',
      'pa\u017A',
      'lis',
      'gru',
    ],
    wide: [
      'stycznia',
      'lutego',
      'marca',
      'kwietnia',
      'maja',
      'czerwca',
      'lipca',
      'sierpnia',
      'wrze\u015Bnia',
      'pa\u017Adziernika',
      'listopada',
      'grudnia',
    ],
  },
  H = {
    narrow: ['N', 'P', 'W', '\u015A', 'C', 'P', 'S'],
    short: ['nie', 'pon', 'wto', '\u015Bro', 'czw', 'pi\u0105', 'sob'],
    abbreviated: ['niedz.', 'pon.', 'wt.', '\u015Br.', 'czw.', 'pt.', 'sob.'],
    wide: [
      'niedziela',
      'poniedzia\u0142ek',
      'wtorek',
      '\u015Broda',
      'czwartek',
      'pi\u0105tek',
      'sobota',
    ],
  },
  S = {
    narrow: ['n', 'p', 'w', '\u015B', 'c', 'p', 's'],
    short: ['nie', 'pon', 'wto', '\u015Bro', 'czw', 'pi\u0105', 'sob'],
    abbreviated: ['niedz.', 'pon.', 'wt.', '\u015Br.', 'czw.', 'pt.', 'sob.'],
    wide: [
      'niedziela',
      'poniedzia\u0142ek',
      'wtorek',
      '\u015Broda',
      'czwartek',
      'pi\u0105tek',
      'sobota',
    ],
  },
  T = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'p\xF3\u0142n.',
      noon: 'po\u0142',
      morning: 'rano',
      afternoon: 'popo\u0142.',
      evening: 'wiecz.',
      night: 'noc',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'p\xF3\u0142noc',
      noon: 'po\u0142udnie',
      morning: 'rano',
      afternoon: 'popo\u0142udnie',
      evening: 'wiecz\xF3r',
      night: 'noc',
    },
    wide: {
      am: 'AM',
      pm: 'PM',
      midnight: 'p\xF3\u0142noc',
      noon: 'po\u0142udnie',
      morning: 'rano',
      afternoon: 'popo\u0142udnie',
      evening: 'wiecz\xF3r',
      night: 'noc',
    },
  },
  X = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'o p\xF3\u0142n.',
      noon: 'w po\u0142.',
      morning: 'rano',
      afternoon: 'po po\u0142.',
      evening: 'wiecz.',
      night: 'w nocy',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'o p\xF3\u0142nocy',
      noon: 'w po\u0142udnie',
      morning: 'rano',
      afternoon: 'po po\u0142udniu',
      evening: 'wieczorem',
      night: 'w nocy',
    },
    wide: {
      am: 'AM',
      pm: 'PM',
      midnight: 'o p\xF3\u0142nocy',
      noon: 'w po\u0142udnie',
      morning: 'rano',
      afternoon: 'po po\u0142udniu',
      evening: 'wieczorem',
      night: 'w nocy',
    },
  },
  A = (e, t) => String(e),
  f = {
    ordinalNumber: A,
    era: a({ values: x, defaultWidth: 'wide' }),
    quarter: a({ values: V, defaultWidth: 'wide', argumentCallback: (e) => e - 1 }),
    month: a({
      values: D,
      defaultWidth: 'wide',
      formattingValues: L,
      defaultFormattingWidth: 'wide',
    }),
    day: a({
      values: H,
      defaultWidth: 'wide',
      formattingValues: S,
      defaultFormattingWidth: 'wide',
    }),
    dayPeriod: a({
      values: T,
      defaultWidth: 'wide',
      formattingValues: X,
      defaultFormattingWidth: 'wide',
    }),
  }
var C = /^(\d+)?/i,
  E = /\d+/i,
  N = {
    narrow: /^(p\.?\s*n\.?\s*e\.?\s*|n\.?\s*e\.?\s*)/i,
    abbreviated: /^(p\.?\s*n\.?\s*e\.?\s*|n\.?\s*e\.?\s*)/i,
    wide: /^(przed\s*nasz(ą|a)\s*er(ą|a)|naszej\s*ery)/i,
  },
  $ = { any: [/^p/i, /^n/i] },
  G = {
    narrow: /^[1234]/i,
    abbreviated: /^(I|II|III|IV)\s*kw\.?/i,
    wide: /^(I|II|III|IV)\s*kwarta(ł|l)/i,
  },
  R = { narrow: [/1/i, /2/i, /3/i, /4/i], any: [/^I kw/i, /^II kw/i, /^III kw/i, /^IV kw/i] },
  Y = {
    narrow: /^[slmkcwpg]/i,
    abbreviated: /^(sty|lut|mar|kwi|maj|cze|lip|sie|wrz|pa(ź|z)|lis|gru)/i,
    wide: /^(stycznia|stycze(ń|n)|lutego|luty|marca|marzec|kwietnia|kwiecie(ń|n)|maja|maj|czerwca|czerwiec|lipca|lipiec|sierpnia|sierpie(ń|n)|wrze(ś|s)nia|wrzesie(ń|n)|pa(ź|z)dziernika|pa(ź|z)dziernik|listopada|listopad|grudnia|grudzie(ń|n))/i,
  },
  q = {
    narrow: [/^s/i, /^l/i, /^m/i, /^k/i, /^m/i, /^c/i, /^l/i, /^s/i, /^w/i, /^p/i, /^l/i, /^g/i],
    any: [
      /^st/i,
      /^lu/i,
      /^mar/i,
      /^k/i,
      /^maj/i,
      /^c/i,
      /^lip/i,
      /^si/i,
      /^w/i,
      /^p/i,
      /^lis/i,
      /^g/i,
    ],
  },
  O = {
    narrow: /^[npwścs]/i,
    short: /^(nie|pon|wto|(ś|s)ro|czw|pi(ą|a)|sob)/i,
    abbreviated: /^(niedz|pon|wt|(ś|s)r|czw|pt|sob)\.?/i,
    wide: /^(niedziela|poniedzia(ł|l)ek|wtorek|(ś|s)roda|czwartek|pi(ą|a)tek|sobota)/i,
  },
  Q = {
    narrow: [/^n/i, /^p/i, /^w/i, /^ś/i, /^c/i, /^p/i, /^s/i],
    abbreviated: [/^n/i, /^po/i, /^w/i, /^(ś|s)r/i, /^c/i, /^pt/i, /^so/i],
    any: [/^n/i, /^po/i, /^w/i, /^(ś|s)r/i, /^c/i, /^pi/i, /^so/i],
  },
  K = {
    narrow:
      /^(^a$|^p$|pó(ł|l)n\.?|o\s*pó(ł|l)n\.?|po(ł|l)\.?|w\s*po(ł|l)\.?|po\s*po(ł|l)\.?|rano|wiecz\.?|noc|w\s*nocy)/i,
    any: /^(am|pm|pó(ł|l)noc|o\s*pó(ł|l)nocy|po(ł|l)udnie|w\s*po(ł|l)udnie|popo(ł|l)udnie|po\s*po(ł|l)udniu|rano|wieczór|wieczorem|noc|w\s*nocy)/i,
  },
  _ = {
    narrow: {
      am: /^a$/i,
      pm: /^p$/i,
      midnight: /pó(ł|l)n/i,
      noon: /po(ł|l)/i,
      morning: /rano/i,
      afternoon: /po\s*po(ł|l)/i,
      evening: /wiecz/i,
      night: /noc/i,
    },
    any: {
      am: /^am/i,
      pm: /^pm/i,
      midnight: /pó(ł|l)n/i,
      noon: /po(ł|l)/i,
      morning: /rano/i,
      afternoon: /po\s*po(ł|l)/i,
      evening: /wiecz/i,
      night: /noc/i,
    },
  },
  h = {
    ordinalNumber: u({ matchPattern: C, parsePattern: E, valueCallback: (e) => parseInt(e, 10) }),
    era: r({
      matchPatterns: N,
      defaultMatchWidth: 'wide',
      parsePatterns: $,
      defaultParseWidth: 'any',
    }),
    quarter: r({
      matchPatterns: G,
      defaultMatchWidth: 'wide',
      parsePatterns: R,
      defaultParseWidth: 'any',
      valueCallback: (e) => e + 1,
    }),
    month: r({
      matchPatterns: Y,
      defaultMatchWidth: 'wide',
      parsePatterns: q,
      defaultParseWidth: 'any',
    }),
    day: r({
      matchPatterns: O,
      defaultMatchWidth: 'wide',
      parsePatterns: Q,
      defaultParseWidth: 'any',
    }),
    dayPeriod: r({
      matchPatterns: K,
      defaultMatchWidth: 'any',
      parsePatterns: _,
      defaultParseWidth: 'any',
    }),
  }
var B = {
    code: 'pl',
    formatDistance: m,
    formatLong: p,
    formatRelative: w,
    localize: f,
    match: h,
    options: { weekStartsOn: 1, firstWeekContainsDate: 4 },
  },
  le = B
export { le as default, B as pl }
