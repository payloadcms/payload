import { a as d } from './chunk-YZ5EFHMQ.js'
import { a as u } from './chunk-N2T43CBH.js'
import { a as c, b as i, c as l, d as s } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var W = {
    lessThanXSeconds: {
      one: '\u043F\u043E-\u043C\u0430\u043B\u043A\u043E \u043E\u0442 \u0441\u0435\u043A\u0443\u043D\u0434\u0430',
      other:
        '\u043F\u043E-\u043C\u0430\u043B\u043A\u043E \u043E\u0442 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u0438',
    },
    xSeconds: {
      one: '1 \u0441\u0435\u043A\u0443\u043D\u0434\u0430',
      other: '{{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u0438',
    },
    halfAMinute: '\u043F\u043E\u043B\u043E\u0432\u0438\u043D \u043C\u0438\u043D\u0443\u0442\u0430',
    lessThanXMinutes: {
      one: '\u043F\u043E-\u043C\u0430\u043B\u043A\u043E \u043E\u0442 \u043C\u0438\u043D\u0443\u0442\u0430',
      other:
        '\u043F\u043E-\u043C\u0430\u043B\u043A\u043E \u043E\u0442 {{count}} \u043C\u0438\u043D\u0443\u0442\u0438',
    },
    xMinutes: {
      one: '1 \u043C\u0438\u043D\u0443\u0442\u0430',
      other: '{{count}} \u043C\u0438\u043D\u0443\u0442\u0438',
    },
    aboutXHours: {
      one: '\u043E\u043A\u043E\u043B\u043E \u0447\u0430\u0441',
      other: '\u043E\u043A\u043E\u043B\u043E {{count}} \u0447\u0430\u0441\u0430',
    },
    xHours: { one: '1 \u0447\u0430\u0441', other: '{{count}} \u0447\u0430\u0441\u0430' },
    xDays: { one: '1 \u0434\u0435\u043D', other: '{{count}} \u0434\u043D\u0438' },
    aboutXWeeks: {
      one: '\u043E\u043A\u043E\u043B\u043E \u0441\u0435\u0434\u043C\u0438\u0446\u0430',
      other: '\u043E\u043A\u043E\u043B\u043E {{count}} \u0441\u0435\u0434\u043C\u0438\u0446\u0438',
    },
    xWeeks: {
      one: '1 \u0441\u0435\u0434\u043C\u0438\u0446\u0430',
      other: '{{count}} \u0441\u0435\u0434\u043C\u0438\u0446\u0438',
    },
    aboutXMonths: {
      one: '\u043E\u043A\u043E\u043B\u043E \u043C\u0435\u0441\u0435\u0446',
      other: '\u043E\u043A\u043E\u043B\u043E {{count}} \u043C\u0435\u0441\u0435\u0446\u0430',
    },
    xMonths: {
      one: '1 \u043C\u0435\u0441\u0435\u0446',
      other: '{{count}} \u043C\u0435\u0441\u0435\u0446\u0430',
    },
    aboutXYears: {
      one: '\u043E\u043A\u043E\u043B\u043E \u0433\u043E\u0434\u0438\u043D\u0430',
      other: '\u043E\u043A\u043E\u043B\u043E {{count}} \u0433\u043E\u0434\u0438\u043D\u0438',
    },
    xYears: {
      one: '1 \u0433\u043E\u0434\u0438\u043D\u0430',
      other: '{{count}} \u0433\u043E\u0434\u0438\u043D\u0438',
    },
    overXYears: {
      one: '\u043D\u0430\u0434 \u0433\u043E\u0434\u0438\u043D\u0430',
      other: '\u043D\u0430\u0434 {{count}} \u0433\u043E\u0434\u0438\u043D\u0438',
    },
    almostXYears: {
      one: '\u043F\u043E\u0447\u0442\u0438 \u0433\u043E\u0434\u0438\u043D\u0430',
      other: '\u043F\u043E\u0447\u0442\u0438 {{count}} \u0433\u043E\u0434\u0438\u043D\u0438',
    },
  },
  f = (t, a, r) => {
    let e,
      n = W[t]
    return (
      typeof n == 'string'
        ? (e = n)
        : a === 1
          ? (e = n.one)
          : (e = n.other.replace('{{count}}', String(a))),
      r?.addSuffix
        ? r.comparison && r.comparison > 0
          ? '\u0441\u043B\u0435\u0434 ' + e
          : '\u043F\u0440\u0435\u0434\u0438 ' + e
        : e
    )
  }
var M = {
    full: 'EEEE, dd MMMM yyyy',
    long: 'dd MMMM yyyy',
    medium: 'dd MMM yyyy',
    short: 'dd/MM/yyyy',
  },
  k = { full: 'HH:mm:ss zzzz', long: 'HH:mm:ss z', medium: 'HH:mm:ss', short: 'H:mm' },
  v = { any: '{{date}} {{time}}' },
  h = {
    date: c({ formats: M, defaultWidth: 'full' }),
    time: c({ formats: k, defaultWidth: 'full' }),
    dateTime: c({ formats: v, defaultWidth: 'any' }),
  }
var m = [
  '\u043D\u0435\u0434\u0435\u043B\u044F',
  '\u043F\u043E\u043D\u0435\u0434\u0435\u043B\u043D\u0438\u043A',
  '\u0432\u0442\u043E\u0440\u043D\u0438\u043A',
  '\u0441\u0440\u044F\u0434\u0430',
  '\u0447\u0435\u0442\u0432\u044A\u0440\u0442\u044A\u043A',
  '\u043F\u0435\u0442\u044A\u043A',
  '\u0441\u044A\u0431\u043E\u0442\u0430',
]
function g(t) {
  let a = m[t]
  switch (t) {
    case 0:
    case 3:
    case 6:
      return "'\u043C\u0438\u043D\u0430\u043B\u0430\u0442\u0430 " + a + " \u0432' p"
    case 1:
    case 2:
    case 4:
    case 5:
      return "'\u043C\u0438\u043D\u0430\u043B\u0438\u044F " + a + " \u0432' p"
  }
}
function y(t) {
  let a = m[t]
  return t === 2 ? "'\u0432\u044A\u0432 " + a + " \u0432' p" : "'\u0432 " + a + " \u0432' p"
}
function x(t) {
  let a = m[t]
  switch (t) {
    case 0:
    case 3:
    case 6:
      return "'\u0441\u043B\u0435\u0434\u0432\u0430\u0449\u0430\u0442\u0430 " + a + " \u0432' p"
    case 1:
    case 2:
    case 4:
    case 5:
      return "'\u0441\u043B\u0435\u0434\u0432\u0430\u0449\u0438\u044F " + a + " \u0432' p"
  }
}
var D = (t, a, r) => {
    let e = u(t),
      n = e.getDay()
    return d(e, a, r) ? y(n) : g(n)
  },
  F = (t, a, r) => {
    let e = u(t),
      n = e.getDay()
    return d(e, a, r) ? y(n) : x(n)
  },
  z = {
    lastWeek: D,
    yesterday: "'\u0432\u0447\u0435\u0440\u0430 \u0432' p",
    today: "'\u0434\u043D\u0435\u0441 \u0432' p",
    tomorrow: "'\u0443\u0442\u0440\u0435 \u0432' p",
    nextWeek: F,
    other: 'P',
  },
  p = (t, a, r, e) => {
    let n = z[t]
    return typeof n == 'function' ? n(a, r, e) : n
  }
var H = {
    narrow: ['\u043F\u0440.\u043D.\u0435.', '\u043D.\u0435.'],
    abbreviated: ['\u043F\u0440\u0435\u0434\u0438 \u043D. \u0435.', '\u043D. \u0435.'],
    wide: [
      '\u043F\u0440\u0435\u0434\u0438 \u043D\u043E\u0432\u0430\u0442\u0430 \u0435\u0440\u0430',
      '\u043D\u043E\u0432\u0430\u0442\u0430 \u0435\u0440\u0430',
    ],
  },
  X = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: [
      '1-\u0432\u043E \u0442\u0440\u0438\u043C\u0435\u0441.',
      '2-\u0440\u043E \u0442\u0440\u0438\u043C\u0435\u0441.',
      '3-\u0442\u043E \u0442\u0440\u0438\u043C\u0435\u0441.',
      '4-\u0442\u043E \u0442\u0440\u0438\u043C\u0435\u0441.',
    ],
    wide: [
      '1-\u0432\u043E \u0442\u0440\u0438\u043C\u0435\u0441\u0435\u0447\u0438\u0435',
      '2-\u0440\u043E \u0442\u0440\u0438\u043C\u0435\u0441\u0435\u0447\u0438\u0435',
      '3-\u0442\u043E \u0442\u0440\u0438\u043C\u0435\u0441\u0435\u0447\u0438\u0435',
      '4-\u0442\u043E \u0442\u0440\u0438\u043C\u0435\u0441\u0435\u0447\u0438\u0435',
    ],
  },
  L = {
    abbreviated: [
      '\u044F\u043D\u0443',
      '\u0444\u0435\u0432',
      '\u043C\u0430\u0440',
      '\u0430\u043F\u0440',
      '\u043C\u0430\u0439',
      '\u044E\u043D\u0438',
      '\u044E\u043B\u0438',
      '\u0430\u0432\u0433',
      '\u0441\u0435\u043F',
      '\u043E\u043A\u0442',
      '\u043D\u043E\u0435',
      '\u0434\u0435\u043A',
    ],
    wide: [
      '\u044F\u043D\u0443\u0430\u0440\u0438',
      '\u0444\u0435\u0432\u0440\u0443\u0430\u0440\u0438',
      '\u043C\u0430\u0440\u0442',
      '\u0430\u043F\u0440\u0438\u043B',
      '\u043C\u0430\u0439',
      '\u044E\u043D\u0438',
      '\u044E\u043B\u0438',
      '\u0430\u0432\u0433\u0443\u0441\u0442',
      '\u0441\u0435\u043F\u0442\u0435\u043C\u0432\u0440\u0438',
      '\u043E\u043A\u0442\u043E\u043C\u0432\u0440\u0438',
      '\u043D\u043E\u0435\u043C\u0432\u0440\u0438',
      '\u0434\u0435\u043A\u0435\u043C\u0432\u0440\u0438',
    ],
  },
  S = {
    narrow: ['\u041D', '\u041F', '\u0412', '\u0421', '\u0427', '\u041F', '\u0421'],
    short: [
      '\u043D\u0434',
      '\u043F\u043D',
      '\u0432\u0442',
      '\u0441\u0440',
      '\u0447\u0442',
      '\u043F\u0442',
      '\u0441\u0431',
    ],
    abbreviated: [
      '\u043D\u0435\u0434',
      '\u043F\u043E\u043D',
      '\u0432\u0442\u043E',
      '\u0441\u0440\u044F',
      '\u0447\u0435\u0442',
      '\u043F\u0435\u0442',
      '\u0441\u044A\u0431',
    ],
    wide: [
      '\u043D\u0435\u0434\u0435\u043B\u044F',
      '\u043F\u043E\u043D\u0435\u0434\u0435\u043B\u043D\u0438\u043A',
      '\u0432\u0442\u043E\u0440\u043D\u0438\u043A',
      '\u0441\u0440\u044F\u0434\u0430',
      '\u0447\u0435\u0442\u0432\u044A\u0440\u0442\u044A\u043A',
      '\u043F\u0435\u0442\u044A\u043A',
      '\u0441\u044A\u0431\u043E\u0442\u0430',
    ],
  },
  E = {
    wide: {
      am: '\u043F\u0440\u0435\u0434\u0438 \u043E\u0431\u044F\u0434',
      pm: '\u0441\u043B\u0435\u0434 \u043E\u0431\u044F\u0434',
      midnight: '\u0432 \u043F\u043E\u043B\u0443\u043D\u043E\u0449',
      noon: '\u043D\u0430 \u043E\u0431\u044F\u0434',
      morning: '\u0441\u0443\u0442\u0440\u0438\u043D\u0442\u0430',
      afternoon: '\u0441\u043B\u0435\u0434\u043E\u0431\u0435\u0434',
      evening: '\u0432\u0435\u0447\u0435\u0440\u0442\u0430',
      night: '\u043F\u0440\u0435\u0437 \u043D\u043E\u0449\u0442\u0430',
    },
  }
function N(t) {
  return t === 'year' || t === 'week' || t === 'minute' || t === 'second'
}
function T(t) {
  return t === 'quarter'
}
function o(t, a, r, e, n) {
  let w = T(a) ? n : N(a) ? e : r
  return t + '-' + w
}
var V = (t, a) => {
    let r = Number(t),
      e = a?.unit
    if (r === 0) return o(0, e, '\u0435\u0432', '\u0435\u0432\u0430', '\u0435\u0432\u043E')
    if (r % 1e3 === 0) return o(r, e, '\u0435\u043D', '\u043D\u0430', '\u043D\u043E')
    if (r % 100 === 0)
      return o(r, e, '\u0442\u0435\u043D', '\u0442\u043D\u0430', '\u0442\u043D\u043E')
    let n = r % 100
    if (n > 20 || n < 10)
      switch (n % 10) {
        case 1:
          return o(r, e, '\u0432\u0438', '\u0432\u0430', '\u0432\u043E')
        case 2:
          return o(r, e, '\u0440\u0438', '\u0440\u0430', '\u0440\u043E')
        case 7:
        case 8:
          return o(r, e, '\u043C\u0438', '\u043C\u0430', '\u043C\u043E')
      }
    return o(r, e, '\u0442\u0438', '\u0442\u0430', '\u0442\u043E')
  },
  b = {
    ordinalNumber: V,
    era: i({ values: H, defaultWidth: 'wide' }),
    quarter: i({ values: X, defaultWidth: 'wide', argumentCallback: (t) => t - 1 }),
    month: i({ values: L, defaultWidth: 'wide' }),
    day: i({ values: S, defaultWidth: 'wide' }),
    dayPeriod: i({ values: E, defaultWidth: 'wide' }),
  }
var q = /^(\d+)(-?[врмт][аи]|-?т?(ен|на)|-?(ев|ева))?/i,
  C = /\d+/i,
  R = {
    narrow: /^((пр)?н\.?\s?е\.?)/i,
    abbreviated: /^((пр)?н\.?\s?е\.?)/i,
    wide: /^(преди новата ера|новата ера|нова ера)/i,
  },
  Y = { any: [/^п/i, /^н/i] },
  O = {
    narrow: /^[1234]/i,
    abbreviated: /^[1234](-?[врт]?o?)? тримес.?/i,
    wide: /^[1234](-?[врт]?о?)? тримесечие/i,
  },
  Q = { any: [/1/i, /2/i, /3/i, /4/i] },
  A = {
    narrow: /^[нпвсч]/i,
    short: /^(нд|пн|вт|ср|чт|пт|сб)/i,
    abbreviated: /^(нед|пон|вто|сря|чет|пет|съб)/i,
    wide: /^(неделя|понеделник|вторник|сряда|четвъртък|петък|събота)/i,
  },
  I = {
    narrow: [/^н/i, /^п/i, /^в/i, /^с/i, /^ч/i, /^п/i, /^с/i],
    any: [/^н[ед]/i, /^п[он]/i, /^вт/i, /^ср/i, /^ч[ет]/i, /^п[ет]/i, /^с[ъб]/i],
  },
  j = {
    abbreviated: /^(яну|фев|мар|апр|май|юни|юли|авг|сеп|окт|ное|дек)/i,
    wide: /^(януари|февруари|март|април|май|юни|юли|август|септември|октомври|ноември|декември)/i,
  },
  B = {
    any: [
      /^я/i,
      /^ф/i,
      /^мар/i,
      /^ап/i,
      /^май/i,
      /^юн/i,
      /^юл/i,
      /^ав/i,
      /^се/i,
      /^окт/i,
      /^но/i,
      /^де/i,
    ],
  },
  G = { any: /^(преди о|след о|в по|на о|през|веч|сут|следо)/i },
  J = {
    any: {
      am: /^преди о/i,
      pm: /^след о/i,
      midnight: /^в пол/i,
      noon: /^на об/i,
      morning: /^сут/i,
      afternoon: /^следо/i,
      evening: /^веч/i,
      night: /^през н/i,
    },
  },
  P = {
    ordinalNumber: l({ matchPattern: q, parsePattern: C, valueCallback: (t) => parseInt(t, 10) }),
    era: s({
      matchPatterns: R,
      defaultMatchWidth: 'wide',
      parsePatterns: Y,
      defaultParseWidth: 'any',
    }),
    quarter: s({
      matchPatterns: O,
      defaultMatchWidth: 'wide',
      parsePatterns: Q,
      defaultParseWidth: 'any',
      valueCallback: (t) => t + 1,
    }),
    month: s({
      matchPatterns: j,
      defaultMatchWidth: 'wide',
      parsePatterns: B,
      defaultParseWidth: 'any',
    }),
    day: s({
      matchPatterns: A,
      defaultMatchWidth: 'wide',
      parsePatterns: I,
      defaultParseWidth: 'any',
    }),
    dayPeriod: s({
      matchPatterns: G,
      defaultMatchWidth: 'any',
      parsePatterns: J,
      defaultParseWidth: 'any',
    }),
  }
var K = {
    code: 'bg',
    formatDistance: f,
    formatLong: h,
    formatRelative: p,
    localize: b,
    match: P,
    options: { weekStartsOn: 1, firstWeekContainsDate: 1 },
  },
  lt = K
export { K as bg, lt as default }
