import { a as m } from './chunk-YZ5EFHMQ.js'
import './chunk-N2T43CBH.js'
import { a as s, b as a, c as f, d as i } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
function y(t, e) {
  return e === 1 && t.one ? t.one : e >= 2 && e <= 4 && t.twoFour ? t.twoFour : t.other
}
function p(t, e, n) {
  return y(t, e)[n].replace('{{count}}', String(e))
}
function P(t) {
  return ['lessThan', 'about', 'over', 'almost'].filter(function (n) {
    return !!t.match(new RegExp('^' + n))
  })[0]
}
function d(t) {
  let e = ''
  return (
    t === 'almost' && (e = 'takmer'),
    t === 'about' && (e = 'pribli\u017Ene'),
    e.length > 0 ? e + ' ' : ''
  )
}
function c(t) {
  let e = ''
  return (
    t === 'lessThan' && (e = 'menej ne\u017E'),
    t === 'over' && (e = 'viac ne\u017E'),
    e.length > 0 ? e + ' ' : ''
  )
}
function j(t) {
  return t.charAt(0).toLowerCase() + t.slice(1)
}
var M = {
    xSeconds: {
      one: { present: 'sekunda', past: 'sekundou', future: 'sekundu' },
      twoFour: {
        present: '{{count}} sekundy',
        past: '{{count}} sekundami',
        future: '{{count}} sekundy',
      },
      other: {
        present: '{{count}} sek\xFAnd',
        past: '{{count}} sekundami',
        future: '{{count}} sek\xFAnd',
      },
    },
    halfAMinute: {
      other: { present: 'pol min\xFAty', past: 'pol min\xFAtou', future: 'pol min\xFAty' },
    },
    xMinutes: {
      one: { present: 'min\xFAta', past: 'min\xFAtou', future: 'min\xFAtu' },
      twoFour: {
        present: '{{count}} min\xFAty',
        past: '{{count}} min\xFAtami',
        future: '{{count}} min\xFAty',
      },
      other: {
        present: '{{count}} min\xFAt',
        past: '{{count}} min\xFAtami',
        future: '{{count}} min\xFAt',
      },
    },
    xHours: {
      one: { present: 'hodina', past: 'hodinou', future: 'hodinu' },
      twoFour: {
        present: '{{count}} hodiny',
        past: '{{count}} hodinami',
        future: '{{count}} hodiny',
      },
      other: {
        present: '{{count}} hod\xEDn',
        past: '{{count}} hodinami',
        future: '{{count}} hod\xEDn',
      },
    },
    xDays: {
      one: { present: 'de\u0148', past: 'd\u0148om', future: 'de\u0148' },
      twoFour: { present: '{{count}} dni', past: '{{count}} d\u0148ami', future: '{{count}} dni' },
      other: {
        present: '{{count}} dn\xED',
        past: '{{count}} d\u0148ami',
        future: '{{count}} dn\xED',
      },
    },
    xWeeks: {
      one: {
        present: 't\xFD\u017Ede\u0148',
        past: 't\xFD\u017Ed\u0148om',
        future: 't\xFD\u017Ede\u0148',
      },
      twoFour: {
        present: '{{count}} t\xFD\u017Edne',
        past: '{{count}} t\xFD\u017Ed\u0148ami',
        future: '{{count}} t\xFD\u017Edne',
      },
      other: {
        present: '{{count}} t\xFD\u017Ed\u0148ov',
        past: '{{count}} t\xFD\u017Ed\u0148ami',
        future: '{{count}} t\xFD\u017Ed\u0148ov',
      },
    },
    xMonths: {
      one: { present: 'mesiac', past: 'mesiacom', future: 'mesiac' },
      twoFour: {
        present: '{{count}} mesiace',
        past: '{{count}} mesiacmi',
        future: '{{count}} mesiace',
      },
      other: {
        present: '{{count}} mesiacov',
        past: '{{count}} mesiacmi',
        future: '{{count}} mesiacov',
      },
    },
    xYears: {
      one: { present: 'rok', past: 'rokom', future: 'rok' },
      twoFour: { present: '{{count}} roky', past: '{{count}} rokmi', future: '{{count}} roky' },
      other: { present: '{{count}} rokov', past: '{{count}} rokmi', future: '{{count}} rokov' },
    },
  },
  h = (t, e, n) => {
    let o = P(t) || '',
      r = j(t.substring(o.length)),
      u = M[r]
    return n?.addSuffix
      ? n.comparison && n.comparison > 0
        ? d(o) + 'o ' + c(o) + p(u, e, 'future')
        : d(o) + 'pred ' + c(o) + p(u, e, 'past')
      : d(o) + c(o) + p(u, e, 'present')
  }
var W = { full: 'EEEE d. MMMM y', long: 'd. MMMM y', medium: 'd. M. y', short: 'd. M. y' },
  x = { full: 'H:mm:ss zzzz', long: 'H:mm:ss z', medium: 'H:mm:ss', short: 'H:mm' },
  F = {
    full: '{{date}}, {{time}}',
    long: '{{date}}, {{time}}',
    medium: '{{date}}, {{time}}',
    short: '{{date}} {{time}}',
  },
  v = {
    date: s({ formats: W, defaultWidth: 'full' }),
    time: s({ formats: x, defaultWidth: 'full' }),
    dateTime: s({ formats: F, defaultWidth: 'full' }),
  }
var l = ['nede\u013Eu', 'pondelok', 'utorok', 'stredu', '\u0161tvrtok', 'piatok', 'sobotu']
function D(t) {
  let e = l[t]
  switch (t) {
    case 0:
    case 3:
    case 6:
      return "'minul\xFA " + e + " o' p"
    default:
      return "'minul\xFD' eeee 'o' p"
  }
}
function b(t) {
  let e = l[t]
  return t === 4 ? "'vo' eeee 'o' p" : "'v " + e + " o' p"
}
function K(t) {
  let e = l[t]
  switch (t) {
    case 0:
    case 4:
    case 6:
      return "'bud\xFAcu " + e + " o' p"
    default:
      return "'bud\xFAci' eeee 'o' p"
  }
}
var z = {
    lastWeek: (t, e, n) => {
      let o = t.getDay()
      return m(t, e, n) ? b(o) : D(o)
    },
    yesterday: "'v\u010Dera o' p",
    today: "'dnes o' p",
    tomorrow: "'zajtra o' p",
    nextWeek: (t, e, n) => {
      let o = t.getDay()
      return m(t, e, n) ? b(o) : K(o)
    },
    other: 'P',
  },
  k = (t, e, n, o) => {
    let r = z[t]
    return typeof r == 'function' ? r(e, n, o) : r
  }
var L = {
    narrow: ['pred Kr.', 'po Kr.'],
    abbreviated: ['pred Kr.', 'po Kr.'],
    wide: ['pred Kristom', 'po Kristovi'],
  },
  V = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
    wide: [
      '1. \u0161tvr\u0165rok',
      '2. \u0161tvr\u0165rok',
      '3. \u0161tvr\u0165rok',
      '4. \u0161tvr\u0165rok',
    ],
  },
  A = {
    narrow: ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'],
    abbreviated: [
      'jan',
      'feb',
      'mar',
      'apr',
      'm\xE1j',
      'j\xFAn',
      'j\xFAl',
      'aug',
      'sep',
      'okt',
      'nov',
      'dec',
    ],
    wide: [
      'janu\xE1r',
      'febru\xE1r',
      'marec',
      'apr\xEDl',
      'm\xE1j',
      'j\xFAn',
      'j\xFAl',
      'august',
      'september',
      'okt\xF3ber',
      'november',
      'december',
    ],
  },
  E = {
    narrow: ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'],
    abbreviated: [
      'jan',
      'feb',
      'mar',
      'apr',
      'm\xE1j',
      'j\xFAn',
      'j\xFAl',
      'aug',
      'sep',
      'okt',
      'nov',
      'dec',
    ],
    wide: [
      'janu\xE1ra',
      'febru\xE1ra',
      'marca',
      'apr\xEDla',
      'm\xE1ja',
      'j\xFAna',
      'j\xFAla',
      'augusta',
      'septembra',
      'okt\xF3bra',
      'novembra',
      'decembra',
    ],
  },
  Q = {
    narrow: ['n', 'p', 'u', 's', '\u0161', 'p', 's'],
    short: ['ne', 'po', 'ut', 'st', '\u0161t', 'pi', 'so'],
    abbreviated: ['ne', 'po', 'ut', 'st', '\u0161t', 'pi', 'so'],
    wide: ['nede\u013Ea', 'pondelok', 'utorok', 'streda', '\u0161tvrtok', 'piatok', 'sobota'],
  },
  T = {
    narrow: {
      am: 'AM',
      pm: 'PM',
      midnight: 'poln.',
      noon: 'pol.',
      morning: 'r\xE1no',
      afternoon: 'pop.',
      evening: 've\u010D.',
      night: 'noc',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'poln.',
      noon: 'pol.',
      morning: 'r\xE1no',
      afternoon: 'popol.',
      evening: 've\u010Der',
      night: 'noc',
    },
    wide: {
      am: 'AM',
      pm: 'PM',
      midnight: 'polnoc',
      noon: 'poludnie',
      morning: 'r\xE1no',
      afternoon: 'popoludnie',
      evening: 've\u010Der',
      night: 'noc',
    },
  },
  C = {
    narrow: {
      am: 'AM',
      pm: 'PM',
      midnight: 'o poln.',
      noon: 'nap.',
      morning: 'r\xE1no',
      afternoon: 'pop.',
      evening: 've\u010D.',
      night: 'v n.',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'o poln.',
      noon: 'napol.',
      morning: 'r\xE1no',
      afternoon: 'popol.',
      evening: 've\u010Der',
      night: 'v noci',
    },
    wide: {
      am: 'AM',
      pm: 'PM',
      midnight: 'o polnoci',
      noon: 'napoludnie',
      morning: 'r\xE1no',
      afternoon: 'popoludn\xED',
      evening: 've\u010Der',
      night: 'v noci',
    },
  },
  H = (t, e) => Number(t) + '.',
  g = {
    ordinalNumber: H,
    era: a({ values: L, defaultWidth: 'wide' }),
    quarter: a({ values: V, defaultWidth: 'wide', argumentCallback: (t) => t - 1 }),
    month: a({
      values: A,
      defaultWidth: 'wide',
      formattingValues: E,
      defaultFormattingWidth: 'wide',
    }),
    day: a({ values: Q, defaultWidth: 'wide' }),
    dayPeriod: a({
      values: T,
      defaultWidth: 'wide',
      formattingValues: C,
      defaultFormattingWidth: 'wide',
    }),
  }
var N = /^(\d+)\.?/i,
  R = /\d+/i,
  S = {
    narrow: /^(pred Kr\.|pred n\. l\.|po Kr\.|n\. l\.)/i,
    abbreviated: /^(pred Kr\.|pred n\. l\.|po Kr\.|n\. l\.)/i,
    wide: /^(pred Kristom|pred na[šs][íi]m letopo[čc]tom|po Kristovi|n[áa][šs]ho letopo[čc]tu)/i,
  },
  q = { any: [/^pr/i, /^(po|n)/i] },
  O = { narrow: /^[1234]/i, abbreviated: /^q[1234]/i, wide: /^[1234]\. [šs]tvr[ťt]rok/i },
  G = { any: [/1/i, /2/i, /3/i, /4/i] },
  I = {
    narrow: /^[jfmasond]/i,
    abbreviated: /^(jan|feb|mar|apr|m[áa]j|j[úu]n|j[úu]l|aug|sep|okt|nov|dec)/i,
    wide: /^(janu[áa]ra?|febru[áa]ra?|(marec|marca)|apr[íi]la?|m[áa]ja?|j[úu]na?|j[úu]la?|augusta?|(september|septembra)|(okt[óo]ber|okt[óo]bra)|(november|novembra)|(december|decembra))/i,
  },
  Y = {
    narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
    any: [
      /^ja/i,
      /^f/i,
      /^mar/i,
      /^ap/i,
      /^m[áa]j/i,
      /^j[úu]n/i,
      /^j[úu]l/i,
      /^au/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
  },
  _ = {
    narrow: /^[npusšp]/i,
    short: /^(ne|po|ut|st|št|pi|so)/i,
    abbreviated: /^(ne|po|ut|st|št|pi|so)/i,
    wide: /^(nede[ľl]a|pondelok|utorok|streda|[šs]tvrtok|piatok|sobota])/i,
  },
  B = {
    narrow: [/^n/i, /^p/i, /^u/i, /^s/i, /^š/i, /^p/i, /^s/i],
    any: [/^n/i, /^po/i, /^u/i, /^st/i, /^(št|stv)/i, /^pi/i, /^so/i],
  },
  J = {
    narrow: /^(am|pm|(o )?poln\.?|(nap\.?|pol\.?)|r[áa]no|pop\.?|ve[čc]\.?|(v n\.?|noc))/i,
    abbreviated: /^(am|pm|(o )?poln\.?|(napol\.?|pol\.?)|r[áa]no|pop\.?|ve[čc]er|(v )?noci?)/i,
    any: /^(am|pm|(o )?polnoci?|(na)?poludnie|r[áa]no|popoludn(ie|í|i)|ve[čc]er|(v )?noci?)/i,
  },
  U = {
    any: {
      am: /^am/i,
      pm: /^pm/i,
      midnight: /poln/i,
      noon: /^(nap|(na)?pol(\.|u))/i,
      morning: /^r[áa]no/i,
      afternoon: /^pop/i,
      evening: /^ve[čc]/i,
      night: /^(noc|v n\.)/i,
    },
  },
  w = {
    ordinalNumber: f({ matchPattern: N, parsePattern: R, valueCallback: (t) => parseInt(t, 10) }),
    era: i({
      matchPatterns: S,
      defaultMatchWidth: 'wide',
      parsePatterns: q,
      defaultParseWidth: 'any',
    }),
    quarter: i({
      matchPatterns: O,
      defaultMatchWidth: 'wide',
      parsePatterns: G,
      defaultParseWidth: 'any',
      valueCallback: (t) => t + 1,
    }),
    month: i({
      matchPatterns: I,
      defaultMatchWidth: 'wide',
      parsePatterns: Y,
      defaultParseWidth: 'any',
    }),
    day: i({
      matchPatterns: _,
      defaultMatchWidth: 'wide',
      parsePatterns: B,
      defaultParseWidth: 'any',
    }),
    dayPeriod: i({
      matchPatterns: J,
      defaultMatchWidth: 'any',
      parsePatterns: U,
      defaultParseWidth: 'any',
    }),
  }
var X = {
    code: 'sk',
    formatDistance: h,
    formatLong: v,
    formatRelative: k,
    localize: g,
    match: w,
    options: { weekStartsOn: 1, firstWeekContainsDate: 4 },
  },
  lt = X
export { lt as default, X as sk }
