import { a as c } from './chunk-YZ5EFHMQ.js'
import './chunk-N2T43CBH.js'
import { a as s, b as u, c as d, d as o } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
function l(t, e) {
  if (t.one !== void 0 && e === 1) return t.one
  let n = e % 10,
    i = e % 100
  return n === 1 && i !== 11
    ? t.singularNominative.replace('{{count}}', String(e))
    : n >= 2 && n <= 4 && (i < 10 || i > 20)
      ? t.singularGenitive.replace('{{count}}', String(e))
      : t.pluralGenitive.replace('{{count}}', String(e))
}
function a(t) {
  return (e, n) =>
    n?.addSuffix
      ? n.comparison && n.comparison > 0
        ? t.future
          ? l(t.future, e)
          : '\u0447\u0435\u0440\u0435\u0437 ' + l(t.regular, e)
        : t.past
          ? l(t.past, e)
          : l(t.regular, e) + ' \u043D\u0430\u0437\u0430\u0434'
      : l(t.regular, e)
}
var w = {
    lessThanXSeconds: a({
      regular: {
        one: '\u043C\u0435\u043D\u044C\u0448\u0435 \u0441\u0435\u043A\u0443\u043D\u0434\u044B',
        singularNominative:
          '\u043C\u0435\u043D\u044C\u0448\u0435 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u044B',
        singularGenitive:
          '\u043C\u0435\u043D\u044C\u0448\u0435 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434',
        pluralGenitive:
          '\u043C\u0435\u043D\u044C\u0448\u0435 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434',
      },
      future: {
        one: '\u043C\u0435\u043D\u044C\u0448\u0435, \u0447\u0435\u043C \u0447\u0435\u0440\u0435\u0437 \u0441\u0435\u043A\u0443\u043D\u0434\u0443',
        singularNominative:
          '\u043C\u0435\u043D\u044C\u0448\u0435, \u0447\u0435\u043C \u0447\u0435\u0440\u0435\u0437 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u0443',
        singularGenitive:
          '\u043C\u0435\u043D\u044C\u0448\u0435, \u0447\u0435\u043C \u0447\u0435\u0440\u0435\u0437 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u044B',
        pluralGenitive:
          '\u043C\u0435\u043D\u044C\u0448\u0435, \u0447\u0435\u043C \u0447\u0435\u0440\u0435\u0437 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434',
      },
    }),
    xSeconds: a({
      regular: {
        singularNominative: '{{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u0430',
        singularGenitive: '{{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u044B',
        pluralGenitive: '{{count}} \u0441\u0435\u043A\u0443\u043D\u0434',
      },
      past: {
        singularNominative:
          '{{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u0443 \u043D\u0430\u0437\u0430\u0434',
        singularGenitive:
          '{{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u044B \u043D\u0430\u0437\u0430\u0434',
        pluralGenitive:
          '{{count}} \u0441\u0435\u043A\u0443\u043D\u0434 \u043D\u0430\u0437\u0430\u0434',
      },
      future: {
        singularNominative:
          '\u0447\u0435\u0440\u0435\u0437 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u0443',
        singularGenitive:
          '\u0447\u0435\u0440\u0435\u0437 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u044B',
        pluralGenitive:
          '\u0447\u0435\u0440\u0435\u0437 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434',
      },
    }),
    halfAMinute: (t, e) =>
      e?.addSuffix
        ? e.comparison && e.comparison > 0
          ? '\u0447\u0435\u0440\u0435\u0437 \u043F\u043E\u043B\u043C\u0438\u043D\u0443\u0442\u044B'
          : '\u043F\u043E\u043B\u043C\u0438\u043D\u0443\u0442\u044B \u043D\u0430\u0437\u0430\u0434'
        : '\u043F\u043E\u043B\u043C\u0438\u043D\u0443\u0442\u044B',
    lessThanXMinutes: a({
      regular: {
        one: '\u043C\u0435\u043D\u044C\u0448\u0435 \u043C\u0438\u043D\u0443\u0442\u044B',
        singularNominative:
          '\u043C\u0435\u043D\u044C\u0448\u0435 {{count}} \u043C\u0438\u043D\u0443\u0442\u044B',
        singularGenitive:
          '\u043C\u0435\u043D\u044C\u0448\u0435 {{count}} \u043C\u0438\u043D\u0443\u0442',
        pluralGenitive:
          '\u043C\u0435\u043D\u044C\u0448\u0435 {{count}} \u043C\u0438\u043D\u0443\u0442',
      },
      future: {
        one: '\u043C\u0435\u043D\u044C\u0448\u0435, \u0447\u0435\u043C \u0447\u0435\u0440\u0435\u0437 \u043C\u0438\u043D\u0443\u0442\u0443',
        singularNominative:
          '\u043C\u0435\u043D\u044C\u0448\u0435, \u0447\u0435\u043C \u0447\u0435\u0440\u0435\u0437 {{count}} \u043C\u0438\u043D\u0443\u0442\u0443',
        singularGenitive:
          '\u043C\u0435\u043D\u044C\u0448\u0435, \u0447\u0435\u043C \u0447\u0435\u0440\u0435\u0437 {{count}} \u043C\u0438\u043D\u0443\u0442\u044B',
        pluralGenitive:
          '\u043C\u0435\u043D\u044C\u0448\u0435, \u0447\u0435\u043C \u0447\u0435\u0440\u0435\u0437 {{count}} \u043C\u0438\u043D\u0443\u0442',
      },
    }),
    xMinutes: a({
      regular: {
        singularNominative: '{{count}} \u043C\u0438\u043D\u0443\u0442\u0430',
        singularGenitive: '{{count}} \u043C\u0438\u043D\u0443\u0442\u044B',
        pluralGenitive: '{{count}} \u043C\u0438\u043D\u0443\u0442',
      },
      past: {
        singularNominative:
          '{{count}} \u043C\u0438\u043D\u0443\u0442\u0443 \u043D\u0430\u0437\u0430\u0434',
        singularGenitive:
          '{{count}} \u043C\u0438\u043D\u0443\u0442\u044B \u043D\u0430\u0437\u0430\u0434',
        pluralGenitive: '{{count}} \u043C\u0438\u043D\u0443\u0442 \u043D\u0430\u0437\u0430\u0434',
      },
      future: {
        singularNominative:
          '\u0447\u0435\u0440\u0435\u0437 {{count}} \u043C\u0438\u043D\u0443\u0442\u0443',
        singularGenitive:
          '\u0447\u0435\u0440\u0435\u0437 {{count}} \u043C\u0438\u043D\u0443\u0442\u044B',
        pluralGenitive: '\u0447\u0435\u0440\u0435\u0437 {{count}} \u043C\u0438\u043D\u0443\u0442',
      },
    }),
    aboutXHours: a({
      regular: {
        singularNominative: '\u043E\u043A\u043E\u043B\u043E {{count}} \u0447\u0430\u0441\u0430',
        singularGenitive: '\u043E\u043A\u043E\u043B\u043E {{count}} \u0447\u0430\u0441\u043E\u0432',
        pluralGenitive: '\u043E\u043A\u043E\u043B\u043E {{count}} \u0447\u0430\u0441\u043E\u0432',
      },
      future: {
        singularNominative:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0447\u0435\u0440\u0435\u0437 {{count}} \u0447\u0430\u0441',
        singularGenitive:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0447\u0435\u0440\u0435\u0437 {{count}} \u0447\u0430\u0441\u0430',
        pluralGenitive:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0447\u0435\u0440\u0435\u0437 {{count}} \u0447\u0430\u0441\u043E\u0432',
      },
    }),
    xHours: a({
      regular: {
        singularNominative: '{{count}} \u0447\u0430\u0441',
        singularGenitive: '{{count}} \u0447\u0430\u0441\u0430',
        pluralGenitive: '{{count}} \u0447\u0430\u0441\u043E\u0432',
      },
    }),
    xDays: a({
      regular: {
        singularNominative: '{{count}} \u0434\u0435\u043D\u044C',
        singularGenitive: '{{count}} \u0434\u043D\u044F',
        pluralGenitive: '{{count}} \u0434\u043D\u0435\u0439',
      },
    }),
    aboutXWeeks: a({
      regular: {
        singularNominative:
          '\u043E\u043A\u043E\u043B\u043E {{count}} \u043D\u0435\u0434\u0435\u043B\u0438',
        singularGenitive:
          '\u043E\u043A\u043E\u043B\u043E {{count}} \u043D\u0435\u0434\u0435\u043B\u044C',
        pluralGenitive:
          '\u043E\u043A\u043E\u043B\u043E {{count}} \u043D\u0435\u0434\u0435\u043B\u044C',
      },
      future: {
        singularNominative:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0447\u0435\u0440\u0435\u0437 {{count}} \u043D\u0435\u0434\u0435\u043B\u044E',
        singularGenitive:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0447\u0435\u0440\u0435\u0437 {{count}} \u043D\u0435\u0434\u0435\u043B\u0438',
        pluralGenitive:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0447\u0435\u0440\u0435\u0437 {{count}} \u043D\u0435\u0434\u0435\u043B\u044C',
      },
    }),
    xWeeks: a({
      regular: {
        singularNominative: '{{count}} \u043D\u0435\u0434\u0435\u043B\u044F',
        singularGenitive: '{{count}} \u043D\u0435\u0434\u0435\u043B\u0438',
        pluralGenitive: '{{count}} \u043D\u0435\u0434\u0435\u043B\u044C',
      },
    }),
    aboutXMonths: a({
      regular: {
        singularNominative:
          '\u043E\u043A\u043E\u043B\u043E {{count}} \u043C\u0435\u0441\u044F\u0446\u0430',
        singularGenitive:
          '\u043E\u043A\u043E\u043B\u043E {{count}} \u043C\u0435\u0441\u044F\u0446\u0435\u0432',
        pluralGenitive:
          '\u043E\u043A\u043E\u043B\u043E {{count}} \u043C\u0435\u0441\u044F\u0446\u0435\u0432',
      },
      future: {
        singularNominative:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0447\u0435\u0440\u0435\u0437 {{count}} \u043C\u0435\u0441\u044F\u0446',
        singularGenitive:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0447\u0435\u0440\u0435\u0437 {{count}} \u043C\u0435\u0441\u044F\u0446\u0430',
        pluralGenitive:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0447\u0435\u0440\u0435\u0437 {{count}} \u043C\u0435\u0441\u044F\u0446\u0435\u0432',
      },
    }),
    xMonths: a({
      regular: {
        singularNominative: '{{count}} \u043C\u0435\u0441\u044F\u0446',
        singularGenitive: '{{count}} \u043C\u0435\u0441\u044F\u0446\u0430',
        pluralGenitive: '{{count}} \u043C\u0435\u0441\u044F\u0446\u0435\u0432',
      },
    }),
    aboutXYears: a({
      regular: {
        singularNominative: '\u043E\u043A\u043E\u043B\u043E {{count}} \u0433\u043E\u0434\u0430',
        singularGenitive: '\u043E\u043A\u043E\u043B\u043E {{count}} \u043B\u0435\u0442',
        pluralGenitive: '\u043E\u043A\u043E\u043B\u043E {{count}} \u043B\u0435\u0442',
      },
      future: {
        singularNominative:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0447\u0435\u0440\u0435\u0437 {{count}} \u0433\u043E\u0434',
        singularGenitive:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0447\u0435\u0440\u0435\u0437 {{count}} \u0433\u043E\u0434\u0430',
        pluralGenitive:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0447\u0435\u0440\u0435\u0437 {{count}} \u043B\u0435\u0442',
      },
    }),
    xYears: a({
      regular: {
        singularNominative: '{{count}} \u0433\u043E\u0434',
        singularGenitive: '{{count}} \u0433\u043E\u0434\u0430',
        pluralGenitive: '{{count}} \u043B\u0435\u0442',
      },
    }),
    overXYears: a({
      regular: {
        singularNominative:
          '\u0431\u043E\u043B\u044C\u0448\u0435 {{count}} \u0433\u043E\u0434\u0430',
        singularGenitive: '\u0431\u043E\u043B\u044C\u0448\u0435 {{count}} \u043B\u0435\u0442',
        pluralGenitive: '\u0431\u043E\u043B\u044C\u0448\u0435 {{count}} \u043B\u0435\u0442',
      },
      future: {
        singularNominative:
          '\u0431\u043E\u043B\u044C\u0448\u0435, \u0447\u0435\u043C \u0447\u0435\u0440\u0435\u0437 {{count}} \u0433\u043E\u0434',
        singularGenitive:
          '\u0431\u043E\u043B\u044C\u0448\u0435, \u0447\u0435\u043C \u0447\u0435\u0440\u0435\u0437 {{count}} \u0433\u043E\u0434\u0430',
        pluralGenitive:
          '\u0431\u043E\u043B\u044C\u0448\u0435, \u0447\u0435\u043C \u0447\u0435\u0440\u0435\u0437 {{count}} \u043B\u0435\u0442',
      },
    }),
    almostXYears: a({
      regular: {
        singularNominative: '\u043F\u043E\u0447\u0442\u0438 {{count}} \u0433\u043E\u0434',
        singularGenitive: '\u043F\u043E\u0447\u0442\u0438 {{count}} \u0433\u043E\u0434\u0430',
        pluralGenitive: '\u043F\u043E\u0447\u0442\u0438 {{count}} \u043B\u0435\u0442',
      },
      future: {
        singularNominative:
          '\u043F\u043E\u0447\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 {{count}} \u0433\u043E\u0434',
        singularGenitive:
          '\u043F\u043E\u0447\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 {{count}} \u0433\u043E\u0434\u0430',
        pluralGenitive:
          '\u043F\u043E\u0447\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 {{count}} \u043B\u0435\u0442',
      },
    }),
  },
  g = (t, e, n) => w[t](e, n)
var b = {
    full: "EEEE, d MMMM y '\u0433.'",
    long: "d MMMM y '\u0433.'",
    medium: "d MMM y '\u0433.'",
    short: 'dd.MM.y',
  },
  y = { full: 'H:mm:ss zzzz', long: 'H:mm:ss z', medium: 'H:mm:ss', short: 'H:mm' },
  P = { any: '{{date}}, {{time}}' },
  v = {
    date: s({ formats: b, defaultWidth: 'full' }),
    time: s({ formats: y, defaultWidth: 'full' }),
    dateTime: s({ formats: P, defaultWidth: 'any' }),
  }
var m = [
  '\u0432\u043E\u0441\u043A\u0440\u0435\u0441\u0435\u043D\u044C\u0435',
  '\u043F\u043E\u043D\u0435\u0434\u0435\u043B\u044C\u043D\u0438\u043A',
  '\u0432\u0442\u043E\u0440\u043D\u0438\u043A',
  '\u0441\u0440\u0435\u0434\u0443',
  '\u0447\u0435\u0442\u0432\u0435\u0440\u0433',
  '\u043F\u044F\u0442\u043D\u0438\u0446\u0443',
  '\u0441\u0443\u0431\u0431\u043E\u0442\u0443',
]
function N(t) {
  let e = m[t]
  switch (t) {
    case 0:
      return "'\u0432 \u043F\u0440\u043E\u0448\u043B\u043E\u0435 " + e + " \u0432' p"
    case 1:
    case 2:
    case 4:
      return "'\u0432 \u043F\u0440\u043E\u0448\u043B\u044B\u0439 " + e + " \u0432' p"
    case 3:
    case 5:
    case 6:
      return "'\u0432 \u043F\u0440\u043E\u0448\u043B\u0443\u044E " + e + " \u0432' p"
  }
}
function f(t) {
  let e = m[t]
  return t === 2 ? "'\u0432\u043E " + e + " \u0432' p" : "'\u0432 " + e + " \u0432' p"
}
function W(t) {
  let e = m[t]
  switch (t) {
    case 0:
      return "'\u0432 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0435 " + e + " \u0432' p"
    case 1:
    case 2:
    case 4:
      return "'\u0432 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 " + e + " \u0432' p"
    case 3:
    case 5:
    case 6:
      return "'\u0432 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0443\u044E " + e + " \u0432' p"
  }
}
var M = {
    lastWeek: (t, e, n) => {
      let i = t.getDay()
      return c(t, e, n) ? f(i) : N(i)
    },
    yesterday: "'\u0432\u0447\u0435\u0440\u0430 \u0432' p",
    today: "'\u0441\u0435\u0433\u043E\u0434\u043D\u044F \u0432' p",
    tomorrow: "'\u0437\u0430\u0432\u0442\u0440\u0430 \u0432' p",
    nextWeek: (t, e, n) => {
      let i = t.getDay()
      return c(t, e, n) ? f(i) : W(i)
    },
    other: 'P',
  },
  p = (t, e, n, i) => {
    let r = M[t]
    return typeof r == 'function' ? r(e, n, i) : r
  }
var k = {
    narrow: ['\u0434\u043E \u043D.\u044D.', '\u043D.\u044D.'],
    abbreviated: ['\u0434\u043E \u043D. \u044D.', '\u043D. \u044D.'],
    wide: [
      '\u0434\u043E \u043D\u0430\u0448\u0435\u0439 \u044D\u0440\u044B',
      '\u043D\u0430\u0448\u0435\u0439 \u044D\u0440\u044B',
    ],
  },
  x = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: [
      '1-\u0439 \u043A\u0432.',
      '2-\u0439 \u043A\u0432.',
      '3-\u0439 \u043A\u0432.',
      '4-\u0439 \u043A\u0432.',
    ],
    wide: [
      '1-\u0439 \u043A\u0432\u0430\u0440\u0442\u0430\u043B',
      '2-\u0439 \u043A\u0432\u0430\u0440\u0442\u0430\u043B',
      '3-\u0439 \u043A\u0432\u0430\u0440\u0442\u0430\u043B',
      '4-\u0439 \u043A\u0432\u0430\u0440\u0442\u0430\u043B',
    ],
  },
  D = {
    narrow: [
      '\u042F',
      '\u0424',
      '\u041C',
      '\u0410',
      '\u041C',
      '\u0418',
      '\u0418',
      '\u0410',
      '\u0421',
      '\u041E',
      '\u041D',
      '\u0414',
    ],
    abbreviated: [
      '\u044F\u043D\u0432.',
      '\u0444\u0435\u0432.',
      '\u043C\u0430\u0440\u0442',
      '\u0430\u043F\u0440.',
      '\u043C\u0430\u0439',
      '\u0438\u044E\u043D\u044C',
      '\u0438\u044E\u043B\u044C',
      '\u0430\u0432\u0433.',
      '\u0441\u0435\u043D\u0442.',
      '\u043E\u043A\u0442.',
      '\u043D\u043E\u044F\u0431.',
      '\u0434\u0435\u043A.',
    ],
    wide: [
      '\u044F\u043D\u0432\u0430\u0440\u044C',
      '\u0444\u0435\u0432\u0440\u0430\u043B\u044C',
      '\u043C\u0430\u0440\u0442',
      '\u0430\u043F\u0440\u0435\u043B\u044C',
      '\u043C\u0430\u0439',
      '\u0438\u044E\u043D\u044C',
      '\u0438\u044E\u043B\u044C',
      '\u0430\u0432\u0433\u0443\u0441\u0442',
      '\u0441\u0435\u043D\u0442\u044F\u0431\u0440\u044C',
      '\u043E\u043A\u0442\u044F\u0431\u0440\u044C',
      '\u043D\u043E\u044F\u0431\u0440\u044C',
      '\u0434\u0435\u043A\u0430\u0431\u0440\u044C',
    ],
  },
  F = {
    narrow: [
      '\u042F',
      '\u0424',
      '\u041C',
      '\u0410',
      '\u041C',
      '\u0418',
      '\u0418',
      '\u0410',
      '\u0421',
      '\u041E',
      '\u041D',
      '\u0414',
    ],
    abbreviated: [
      '\u044F\u043D\u0432.',
      '\u0444\u0435\u0432.',
      '\u043C\u0430\u0440.',
      '\u0430\u043F\u0440.',
      '\u043C\u0430\u044F',
      '\u0438\u044E\u043D.',
      '\u0438\u044E\u043B.',
      '\u0430\u0432\u0433.',
      '\u0441\u0435\u043D\u0442.',
      '\u043E\u043A\u0442.',
      '\u043D\u043E\u044F\u0431.',
      '\u0434\u0435\u043A.',
    ],
    wide: [
      '\u044F\u043D\u0432\u0430\u0440\u044F',
      '\u0444\u0435\u0432\u0440\u0430\u043B\u044F',
      '\u043C\u0430\u0440\u0442\u0430',
      '\u0430\u043F\u0440\u0435\u043B\u044F',
      '\u043C\u0430\u044F',
      '\u0438\u044E\u043D\u044F',
      '\u0438\u044E\u043B\u044F',
      '\u0430\u0432\u0433\u0443\u0441\u0442\u0430',
      '\u0441\u0435\u043D\u0442\u044F\u0431\u0440\u044F',
      '\u043E\u043A\u0442\u044F\u0431\u0440\u044F',
      '\u043D\u043E\u044F\u0431\u0440\u044F',
      '\u0434\u0435\u043A\u0430\u0431\u0440\u044F',
    ],
  },
  z = {
    narrow: ['\u0412', '\u041F', '\u0412', '\u0421', '\u0427', '\u041F', '\u0421'],
    short: [
      '\u0432\u0441',
      '\u043F\u043D',
      '\u0432\u0442',
      '\u0441\u0440',
      '\u0447\u0442',
      '\u043F\u0442',
      '\u0441\u0431',
    ],
    abbreviated: [
      '\u0432\u0441\u043A',
      '\u043F\u043D\u0434',
      '\u0432\u0442\u0440',
      '\u0441\u0440\u0434',
      '\u0447\u0442\u0432',
      '\u043F\u0442\u043D',
      '\u0441\u0443\u0431',
    ],
    wide: [
      '\u0432\u043E\u0441\u043A\u0440\u0435\u0441\u0435\u043D\u044C\u0435',
      '\u043F\u043E\u043D\u0435\u0434\u0435\u043B\u044C\u043D\u0438\u043A',
      '\u0432\u0442\u043E\u0440\u043D\u0438\u043A',
      '\u0441\u0440\u0435\u0434\u0430',
      '\u0447\u0435\u0442\u0432\u0435\u0440\u0433',
      '\u043F\u044F\u0442\u043D\u0438\u0446\u0430',
      '\u0441\u0443\u0431\u0431\u043E\u0442\u0430',
    ],
  },
  S = {
    narrow: {
      am: '\u0414\u041F',
      pm: '\u041F\u041F',
      midnight: '\u043F\u043E\u043B\u043D.',
      noon: '\u043F\u043E\u043B\u0434.',
      morning: '\u0443\u0442\u0440\u043E',
      afternoon: '\u0434\u0435\u043D\u044C',
      evening: '\u0432\u0435\u0447.',
      night: '\u043D\u043E\u0447\u044C',
    },
    abbreviated: {
      am: '\u0414\u041F',
      pm: '\u041F\u041F',
      midnight: '\u043F\u043E\u043B\u043D.',
      noon: '\u043F\u043E\u043B\u0434.',
      morning: '\u0443\u0442\u0440\u043E',
      afternoon: '\u0434\u0435\u043D\u044C',
      evening: '\u0432\u0435\u0447.',
      night: '\u043D\u043E\u0447\u044C',
    },
    wide: {
      am: '\u0414\u041F',
      pm: '\u041F\u041F',
      midnight: '\u043F\u043E\u043B\u043D\u043E\u0447\u044C',
      noon: '\u043F\u043E\u043B\u0434\u0435\u043D\u044C',
      morning: '\u0443\u0442\u0440\u043E',
      afternoon: '\u0434\u0435\u043D\u044C',
      evening: '\u0432\u0435\u0447\u0435\u0440',
      night: '\u043D\u043E\u0447\u044C',
    },
  },
  V = {
    narrow: {
      am: '\u0414\u041F',
      pm: '\u041F\u041F',
      midnight: '\u043F\u043E\u043B\u043D.',
      noon: '\u043F\u043E\u043B\u0434.',
      morning: '\u0443\u0442\u0440\u0430',
      afternoon: '\u0434\u043D\u044F',
      evening: '\u0432\u0435\u0447.',
      night: '\u043D\u043E\u0447\u0438',
    },
    abbreviated: {
      am: '\u0414\u041F',
      pm: '\u041F\u041F',
      midnight: '\u043F\u043E\u043B\u043D.',
      noon: '\u043F\u043E\u043B\u0434.',
      morning: '\u0443\u0442\u0440\u0430',
      afternoon: '\u0434\u043D\u044F',
      evening: '\u0432\u0435\u0447.',
      night: '\u043D\u043E\u0447\u0438',
    },
    wide: {
      am: '\u0414\u041F',
      pm: '\u041F\u041F',
      midnight: '\u043F\u043E\u043B\u043D\u043E\u0447\u044C',
      noon: '\u043F\u043E\u043B\u0434\u0435\u043D\u044C',
      morning: '\u0443\u0442\u0440\u0430',
      afternoon: '\u0434\u043D\u044F',
      evening: '\u0432\u0435\u0447\u0435\u0440\u0430',
      night: '\u043D\u043E\u0447\u0438',
    },
  },
  L = (t, e) => {
    let n = Number(t),
      i = e?.unit,
      r
    return (
      i === 'date'
        ? (r = '-\u0435')
        : i === 'week' || i === 'minute' || i === 'second'
          ? (r = '-\u044F')
          : (r = '-\u0439'),
      n + r
    )
  },
  h = {
    ordinalNumber: L,
    era: u({ values: k, defaultWidth: 'wide' }),
    quarter: u({ values: x, defaultWidth: 'wide', argumentCallback: (t) => t - 1 }),
    month: u({
      values: D,
      defaultWidth: 'wide',
      formattingValues: F,
      defaultFormattingWidth: 'wide',
    }),
    day: u({ values: z, defaultWidth: 'wide' }),
    dayPeriod: u({
      values: S,
      defaultWidth: 'any',
      formattingValues: V,
      defaultFormattingWidth: 'wide',
    }),
  }
var X = /^(\d+)(-?(е|я|й|ое|ье|ая|ья|ый|ой|ий|ый))?/i,
  E = /\d+/i,
  H = {
    narrow: /^((до )?н\.?\s?э\.?)/i,
    abbreviated: /^((до )?н\.?\s?э\.?)/i,
    wide: /^(до нашей эры|нашей эры|наша эра)/i,
  },
  T = { any: [/^д/i, /^н/i] },
  C = {
    narrow: /^[1234]/i,
    abbreviated: /^[1234](-?[ыои]?й?)? кв.?/i,
    wide: /^[1234](-?[ыои]?й?)? квартал/i,
  },
  R = { any: [/1/i, /2/i, /3/i, /4/i] },
  Y = {
    narrow: /^[яфмаисонд]/i,
    abbreviated: /^(янв|фев|март?|апр|ма[йя]|июн[ья]?|июл[ья]?|авг|сент?|окт|нояб?|дек)\.?/i,
    wide: /^(январ[ья]|феврал[ья]|марта?|апрел[ья]|ма[йя]|июн[ья]|июл[ья]|августа?|сентябр[ья]|октябр[ья]|октябр[ья]|ноябр[ья]|декабр[ья])/i,
  },
  q = {
    narrow: [/^я/i, /^ф/i, /^м/i, /^а/i, /^м/i, /^и/i, /^и/i, /^а/i, /^с/i, /^о/i, /^н/i, /^я/i],
    any: [
      /^я/i,
      /^ф/i,
      /^мар/i,
      /^ап/i,
      /^ма[йя]/i,
      /^июн/i,
      /^июл/i,
      /^ав/i,
      /^с/i,
      /^о/i,
      /^н/i,
      /^д/i,
    ],
  },
  O = {
    narrow: /^[впсч]/i,
    short: /^(вс|во|пн|по|вт|ср|чт|че|пт|пя|сб|су)\.?/i,
    abbreviated: /^(вск|вос|пнд|пон|втр|вто|срд|сре|чтв|чет|птн|пят|суб).?/i,
    wide: /^(воскресень[ея]|понедельника?|вторника?|сред[аы]|четверга?|пятниц[аы]|суббот[аы])/i,
  },
  Q = {
    narrow: [/^в/i, /^п/i, /^в/i, /^с/i, /^ч/i, /^п/i, /^с/i],
    any: [/^в[ос]/i, /^п[он]/i, /^в/i, /^ср/i, /^ч/i, /^п[ят]/i, /^с[уб]/i],
  },
  A = {
    narrow: /^([дп]п|полн\.?|полд\.?|утр[оа]|день|дня|веч\.?|ноч[ьи])/i,
    abbreviated: /^([дп]п|полн\.?|полд\.?|утр[оа]|день|дня|веч\.?|ноч[ьи])/i,
    wide: /^([дп]п|полночь|полдень|утр[оа]|день|дня|вечера?|ноч[ьи])/i,
  },
  I = {
    any: {
      am: /^дп/i,
      pm: /^пп/i,
      midnight: /^полн/i,
      noon: /^полд/i,
      morning: /^у/i,
      afternoon: /^д[ен]/i,
      evening: /^в/i,
      night: /^н/i,
    },
  },
  G = {
    ordinalNumber: d({ matchPattern: X, parsePattern: E, valueCallback: (t) => parseInt(t, 10) }),
    era: o({
      matchPatterns: H,
      defaultMatchWidth: 'wide',
      parsePatterns: T,
      defaultParseWidth: 'any',
    }),
    quarter: o({
      matchPatterns: C,
      defaultMatchWidth: 'wide',
      parsePatterns: R,
      defaultParseWidth: 'any',
      valueCallback: (t) => t + 1,
    }),
    month: o({
      matchPatterns: Y,
      defaultMatchWidth: 'wide',
      parsePatterns: q,
      defaultParseWidth: 'any',
    }),
    day: o({
      matchPatterns: O,
      defaultMatchWidth: 'wide',
      parsePatterns: Q,
      defaultParseWidth: 'any',
    }),
    dayPeriod: o({
      matchPatterns: A,
      defaultMatchWidth: 'wide',
      parsePatterns: I,
      defaultParseWidth: 'any',
    }),
  }
var _ = {
    code: 'ru',
    formatDistance: g,
    formatLong: v,
    formatRelative: p,
    localize: h,
    match: G,
    options: { weekStartsOn: 1, firstWeekContainsDate: 1 },
  },
  lt = _
export { lt as default, _ as ru }
