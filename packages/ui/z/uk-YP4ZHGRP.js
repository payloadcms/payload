import { a as m } from './chunk-YZ5EFHMQ.js'
import { a as c } from './chunk-N2T43CBH.js'
import { a as s, b as o, c as g, d as u } from './chunk-RD4BVJYH.js'
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
function r(t) {
  return (e, n) =>
    n && n.addSuffix
      ? n.comparison && n.comparison > 0
        ? t.future
          ? l(t.future, e)
          : '\u0437\u0430 ' + l(t.regular, e)
        : t.past
          ? l(t.past, e)
          : l(t.regular, e) + ' \u0442\u043E\u043C\u0443'
      : l(t.regular, e)
}
var b = (t, e) =>
    e && e.addSuffix
      ? e.comparison && e.comparison > 0
        ? '\u0437\u0430 \u043F\u0456\u0432\u0445\u0432\u0438\u043B\u0438\u043D\u0438'
        : '\u043F\u0456\u0432\u0445\u0432\u0438\u043B\u0438\u043D\u0438 \u0442\u043E\u043C\u0443'
      : '\u043F\u0456\u0432\u0445\u0432\u0438\u043B\u0438\u043D\u0438',
  y = {
    lessThanXSeconds: r({
      regular: {
        one: '\u043C\u0435\u043D\u0448\u0435 \u0441\u0435\u043A\u0443\u043D\u0434\u0438',
        singularNominative:
          '\u043C\u0435\u043D\u0448\u0435 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u0438',
        singularGenitive:
          '\u043C\u0435\u043D\u0448\u0435 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434',
        pluralGenitive:
          '\u043C\u0435\u043D\u0448\u0435 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434',
      },
      future: {
        one: '\u043C\u0435\u043D\u0448\u0435, \u043D\u0456\u0436 \u0437\u0430 \u0441\u0435\u043A\u0443\u043D\u0434\u0443',
        singularNominative:
          '\u043C\u0435\u043D\u0448\u0435, \u043D\u0456\u0436 \u0437\u0430 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u0443',
        singularGenitive:
          '\u043C\u0435\u043D\u0448\u0435, \u043D\u0456\u0436 \u0437\u0430 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u0438',
        pluralGenitive:
          '\u043C\u0435\u043D\u0448\u0435, \u043D\u0456\u0436 \u0437\u0430 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434',
      },
    }),
    xSeconds: r({
      regular: {
        singularNominative: '{{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u0430',
        singularGenitive: '{{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u0438',
        pluralGenitive: '{{count}} \u0441\u0435\u043A\u0443\u043D\u0434',
      },
      past: {
        singularNominative:
          '{{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u0443 \u0442\u043E\u043C\u0443',
        singularGenitive:
          '{{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u0438 \u0442\u043E\u043C\u0443',
        pluralGenitive: '{{count}} \u0441\u0435\u043A\u0443\u043D\u0434 \u0442\u043E\u043C\u0443',
      },
      future: {
        singularNominative: '\u0437\u0430 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u0443',
        singularGenitive: '\u0437\u0430 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434\u0438',
        pluralGenitive: '\u0437\u0430 {{count}} \u0441\u0435\u043A\u0443\u043D\u0434',
      },
    }),
    halfAMinute: b,
    lessThanXMinutes: r({
      regular: {
        one: '\u043C\u0435\u043D\u0448\u0435 \u0445\u0432\u0438\u043B\u0438\u043D\u0438',
        singularNominative:
          '\u043C\u0435\u043D\u0448\u0435 {{count}} \u0445\u0432\u0438\u043B\u0438\u043D\u0438',
        singularGenitive:
          '\u043C\u0435\u043D\u0448\u0435 {{count}} \u0445\u0432\u0438\u043B\u0438\u043D',
        pluralGenitive:
          '\u043C\u0435\u043D\u0448\u0435 {{count}} \u0445\u0432\u0438\u043B\u0438\u043D',
      },
      future: {
        one: '\u043C\u0435\u043D\u0448\u0435, \u043D\u0456\u0436 \u0437\u0430 \u0445\u0432\u0438\u043B\u0438\u043D\u0443',
        singularNominative:
          '\u043C\u0435\u043D\u0448\u0435, \u043D\u0456\u0436 \u0437\u0430 {{count}} \u0445\u0432\u0438\u043B\u0438\u043D\u0443',
        singularGenitive:
          '\u043C\u0435\u043D\u0448\u0435, \u043D\u0456\u0436 \u0437\u0430 {{count}} \u0445\u0432\u0438\u043B\u0438\u043D\u0438',
        pluralGenitive:
          '\u043C\u0435\u043D\u0448\u0435, \u043D\u0456\u0436 \u0437\u0430 {{count}} \u0445\u0432\u0438\u043B\u0438\u043D',
      },
    }),
    xMinutes: r({
      regular: {
        singularNominative: '{{count}} \u0445\u0432\u0438\u043B\u0438\u043D\u0430',
        singularGenitive: '{{count}} \u0445\u0432\u0438\u043B\u0438\u043D\u0438',
        pluralGenitive: '{{count}} \u0445\u0432\u0438\u043B\u0438\u043D',
      },
      past: {
        singularNominative:
          '{{count}} \u0445\u0432\u0438\u043B\u0438\u043D\u0443 \u0442\u043E\u043C\u0443',
        singularGenitive:
          '{{count}} \u0445\u0432\u0438\u043B\u0438\u043D\u0438 \u0442\u043E\u043C\u0443',
        pluralGenitive: '{{count}} \u0445\u0432\u0438\u043B\u0438\u043D \u0442\u043E\u043C\u0443',
      },
      future: {
        singularNominative: '\u0437\u0430 {{count}} \u0445\u0432\u0438\u043B\u0438\u043D\u0443',
        singularGenitive: '\u0437\u0430 {{count}} \u0445\u0432\u0438\u043B\u0438\u043D\u0438',
        pluralGenitive: '\u0437\u0430 {{count}} \u0445\u0432\u0438\u043B\u0438\u043D',
      },
    }),
    aboutXHours: r({
      regular: {
        singularNominative:
          '\u0431\u043B\u0438\u0437\u044C\u043A\u043E {{count}} \u0433\u043E\u0434\u0438\u043D\u0438',
        singularGenitive:
          '\u0431\u043B\u0438\u0437\u044C\u043A\u043E {{count}} \u0433\u043E\u0434\u0438\u043D',
        pluralGenitive:
          '\u0431\u043B\u0438\u0437\u044C\u043A\u043E {{count}} \u0433\u043E\u0434\u0438\u043D',
      },
      future: {
        singularNominative:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u043D\u043E \u0437\u0430 {{count}} \u0433\u043E\u0434\u0438\u043D\u0443',
        singularGenitive:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u043D\u043E \u0437\u0430 {{count}} \u0433\u043E\u0434\u0438\u043D\u0438',
        pluralGenitive:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u043D\u043E \u0437\u0430 {{count}} \u0433\u043E\u0434\u0438\u043D',
      },
    }),
    xHours: r({
      regular: {
        singularNominative: '{{count}} \u0433\u043E\u0434\u0438\u043D\u0443',
        singularGenitive: '{{count}} \u0433\u043E\u0434\u0438\u043D\u0438',
        pluralGenitive: '{{count}} \u0433\u043E\u0434\u0438\u043D',
      },
    }),
    xDays: r({
      regular: {
        singularNominative: '{{count}} \u0434\u0435\u043D\u044C',
        singularGenitive: '{{count}} \u0434\u043Di',
        pluralGenitive: '{{count}} \u0434\u043D\u0456\u0432',
      },
    }),
    aboutXWeeks: r({
      regular: {
        singularNominative:
          '\u0431\u043B\u0438\u0437\u044C\u043A\u043E {{count}} \u0442\u0438\u0436\u043D\u044F',
        singularGenitive:
          '\u0431\u043B\u0438\u0437\u044C\u043A\u043E {{count}} \u0442\u0438\u0436\u043D\u0456\u0432',
        pluralGenitive:
          '\u0431\u043B\u0438\u0437\u044C\u043A\u043E {{count}} \u0442\u0438\u0436\u043D\u0456\u0432',
      },
      future: {
        singularNominative:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u043D\u043E \u0437\u0430 {{count}} \u0442\u0438\u0436\u0434\u0435\u043D\u044C',
        singularGenitive:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u043D\u043E \u0437\u0430 {{count}} \u0442\u0438\u0436\u043D\u0456',
        pluralGenitive:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u043D\u043E \u0437\u0430 {{count}} \u0442\u0438\u0436\u043D\u0456\u0432',
      },
    }),
    xWeeks: r({
      regular: {
        singularNominative: '{{count}} \u0442\u0438\u0436\u0434\u0435\u043D\u044C',
        singularGenitive: '{{count}} \u0442\u0438\u0436\u043D\u0456',
        pluralGenitive: '{{count}} \u0442\u0438\u0436\u043D\u0456\u0432',
      },
    }),
    aboutXMonths: r({
      regular: {
        singularNominative:
          '\u0431\u043B\u0438\u0437\u044C\u043A\u043E {{count}} \u043C\u0456\u0441\u044F\u0446\u044F',
        singularGenitive:
          '\u0431\u043B\u0438\u0437\u044C\u043A\u043E {{count}} \u043C\u0456\u0441\u044F\u0446\u0456\u0432',
        pluralGenitive:
          '\u0431\u043B\u0438\u0437\u044C\u043A\u043E {{count}} \u043C\u0456\u0441\u044F\u0446\u0456\u0432',
      },
      future: {
        singularNominative:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u043D\u043E \u0437\u0430 {{count}} \u043C\u0456\u0441\u044F\u0446\u044C',
        singularGenitive:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u043D\u043E \u0437\u0430 {{count}} \u043C\u0456\u0441\u044F\u0446\u0456',
        pluralGenitive:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u043D\u043E \u0437\u0430 {{count}} \u043C\u0456\u0441\u044F\u0446\u0456\u0432',
      },
    }),
    xMonths: r({
      regular: {
        singularNominative: '{{count}} \u043C\u0456\u0441\u044F\u0446\u044C',
        singularGenitive: '{{count}} \u043C\u0456\u0441\u044F\u0446\u0456',
        pluralGenitive: '{{count}} \u043C\u0456\u0441\u044F\u0446\u0456\u0432',
      },
    }),
    aboutXYears: r({
      regular: {
        singularNominative:
          '\u0431\u043B\u0438\u0437\u044C\u043A\u043E {{count}} \u0440\u043E\u043A\u0443',
        singularGenitive:
          '\u0431\u043B\u0438\u0437\u044C\u043A\u043E {{count}} \u0440\u043E\u043A\u0456\u0432',
        pluralGenitive:
          '\u0431\u043B\u0438\u0437\u044C\u043A\u043E {{count}} \u0440\u043E\u043A\u0456\u0432',
      },
      future: {
        singularNominative:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u043D\u043E \u0437\u0430 {{count}} \u0440\u0456\u043A',
        singularGenitive:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u043D\u043E \u0437\u0430 {{count}} \u0440\u043E\u043A\u0438',
        pluralGenitive:
          '\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u043D\u043E \u0437\u0430 {{count}} \u0440\u043E\u043A\u0456\u0432',
      },
    }),
    xYears: r({
      regular: {
        singularNominative: '{{count}} \u0440\u0456\u043A',
        singularGenitive: '{{count}} \u0440\u043E\u043A\u0438',
        pluralGenitive: '{{count}} \u0440\u043E\u043A\u0456\u0432',
      },
    }),
    overXYears: r({
      regular: {
        singularNominative:
          '\u0431\u0456\u043B\u044C\u0448\u0435 {{count}} \u0440\u043E\u043A\u0443',
        singularGenitive:
          '\u0431\u0456\u043B\u044C\u0448\u0435 {{count}} \u0440\u043E\u043A\u0456\u0432',
        pluralGenitive:
          '\u0431\u0456\u043B\u044C\u0448\u0435 {{count}} \u0440\u043E\u043A\u0456\u0432',
      },
      future: {
        singularNominative:
          '\u0431\u0456\u043B\u044C\u0448\u0435, \u043D\u0456\u0436 \u0437\u0430 {{count}} \u0440\u0456\u043A',
        singularGenitive:
          '\u0431\u0456\u043B\u044C\u0448\u0435, \u043D\u0456\u0436 \u0437\u0430 {{count}} \u0440\u043E\u043A\u0438',
        pluralGenitive:
          '\u0431\u0456\u043B\u044C\u0448\u0435, \u043D\u0456\u0436 \u0437\u0430 {{count}} \u0440\u043E\u043A\u0456\u0432',
      },
    }),
    almostXYears: r({
      regular: {
        singularNominative: '\u043C\u0430\u0439\u0436\u0435 {{count}} \u0440\u0456\u043A',
        singularGenitive: '\u043C\u0430\u0439\u0436\u0435 {{count}} \u0440\u043E\u043A\u0438',
        pluralGenitive: '\u043C\u0430\u0439\u0436\u0435 {{count}} \u0440\u043E\u043A\u0456\u0432',
      },
      future: {
        singularNominative:
          '\u043C\u0430\u0439\u0436\u0435 \u0437\u0430 {{count}} \u0440\u0456\u043A',
        singularGenitive:
          '\u043C\u0430\u0439\u0436\u0435 \u0437\u0430 {{count}} \u0440\u043E\u043A\u0438',
        pluralGenitive:
          '\u043C\u0430\u0439\u0436\u0435 \u0437\u0430 {{count}} \u0440\u043E\u043A\u0456\u0432',
      },
    }),
  },
  v = (t, e, n) => ((n = n || {}), y[t](e, n))
var P = {
    full: "EEEE, do MMMM y '\u0440.'",
    long: "do MMMM y '\u0440.'",
    medium: "d MMM y '\u0440.'",
    short: 'dd.MM.y',
  },
  W = { full: 'H:mm:ss zzzz', long: 'H:mm:ss z', medium: 'H:mm:ss', short: 'H:mm' },
  N = {
    full: "{{date}} '\u043E' {{time}}",
    long: "{{date}} '\u043E' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
  f = {
    date: s({ formats: P, defaultWidth: 'full' }),
    time: s({ formats: W, defaultWidth: 'full' }),
    dateTime: s({ formats: N, defaultWidth: 'full' }),
  }
var d = [
  '\u043D\u0435\u0434\u0456\u043B\u044E',
  '\u043F\u043E\u043D\u0435\u0434\u0456\u043B\u043E\u043A',
  '\u0432\u0456\u0432\u0442\u043E\u0440\u043E\u043A',
  '\u0441\u0435\u0440\u0435\u0434\u0443',
  '\u0447\u0435\u0442\u0432\u0435\u0440',
  '\u043F\u2019\u044F\u0442\u043D\u0438\u0446\u044E',
  '\u0441\u0443\u0431\u043E\u0442\u0443',
]
function M(t) {
  let e = d[t]
  switch (t) {
    case 0:
    case 3:
    case 5:
    case 6:
      return "'\u0443 \u043C\u0438\u043D\u0443\u043B\u0443 " + e + " \u043E' p"
    case 1:
    case 2:
    case 4:
      return "'\u0443 \u043C\u0438\u043D\u0443\u043B\u0438\u0439 " + e + " \u043E' p"
  }
}
function p(t) {
  return "'\u0443 " + d[t] + " \u043E' p"
}
function k(t) {
  let e = d[t]
  switch (t) {
    case 0:
    case 3:
    case 5:
    case 6:
      return "'\u0443 \u043D\u0430\u0441\u0442\u0443\u043F\u043D\u0443 " + e + " \u043E' p"
    case 1:
    case 2:
    case 4:
      return "'\u0443 \u043D\u0430\u0441\u0442\u0443\u043F\u043D\u0438\u0439 " + e + " \u043E' p"
  }
}
var x = (t, e, n) => {
    let i = c(t),
      a = i.getDay()
    return m(i, e, n) ? p(a) : M(a)
  },
  D = (t, e, n) => {
    let i = c(t),
      a = i.getDay()
    return m(i, e, n) ? p(a) : k(a)
  },
  F = {
    lastWeek: x,
    yesterday: "'\u0432\u0447\u043E\u0440\u0430 \u043E' p",
    today: "'\u0441\u044C\u043E\u0433\u043E\u0434\u043D\u0456 \u043E' p",
    tomorrow: "'\u0437\u0430\u0432\u0442\u0440\u0430 \u043E' p",
    nextWeek: D,
    other: 'P',
  },
  h = (t, e, n, i) => {
    let a = F[t]
    return typeof a == 'function' ? a(e, n, i) : a
  }
var z = {
    narrow: ['\u0434\u043E \u043D.\u0435.', '\u043D.\u0435.'],
    abbreviated: ['\u0434\u043E \u043D. \u0435.', '\u043D. \u0435.'],
    wide: [
      '\u0434\u043E \u043D\u0430\u0448\u043E\u0457 \u0435\u0440\u0438',
      '\u043D\u0430\u0448\u043E\u0457 \u0435\u0440\u0438',
    ],
  },
  S = {
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
  V = {
    narrow: [
      '\u0421',
      '\u041B',
      '\u0411',
      '\u041A',
      '\u0422',
      '\u0427',
      '\u041B',
      '\u0421',
      '\u0412',
      '\u0416',
      '\u041B',
      '\u0413',
    ],
    abbreviated: [
      '\u0441\u0456\u0447.',
      '\u043B\u044E\u0442.',
      '\u0431\u0435\u0440\u0435\u0437.',
      '\u043A\u0432\u0456\u0442.',
      '\u0442\u0440\u0430\u0432.',
      '\u0447\u0435\u0440\u0432.',
      '\u043B\u0438\u043F.',
      '\u0441\u0435\u0440\u043F.',
      '\u0432\u0435\u0440\u0435\u0441.',
      '\u0436\u043E\u0432\u0442.',
      '\u043B\u0438\u0441\u0442\u043E\u043F.',
      '\u0433\u0440\u0443\u0434.',
    ],
    wide: [
      '\u0441\u0456\u0447\u0435\u043D\u044C',
      '\u043B\u044E\u0442\u0438\u0439',
      '\u0431\u0435\u0440\u0435\u0437\u0435\u043D\u044C',
      '\u043A\u0432\u0456\u0442\u0435\u043D\u044C',
      '\u0442\u0440\u0430\u0432\u0435\u043D\u044C',
      '\u0447\u0435\u0440\u0432\u0435\u043D\u044C',
      '\u043B\u0438\u043F\u0435\u043D\u044C',
      '\u0441\u0435\u0440\u043F\u0435\u043D\u044C',
      '\u0432\u0435\u0440\u0435\u0441\u0435\u043D\u044C',
      '\u0436\u043E\u0432\u0442\u0435\u043D\u044C',
      '\u043B\u0438\u0441\u0442\u043E\u043F\u0430\u0434',
      '\u0433\u0440\u0443\u0434\u0435\u043D\u044C',
    ],
  },
  L = {
    narrow: [
      '\u0421',
      '\u041B',
      '\u0411',
      '\u041A',
      '\u0422',
      '\u0427',
      '\u041B',
      '\u0421',
      '\u0412',
      '\u0416',
      '\u041B',
      '\u0413',
    ],
    abbreviated: [
      '\u0441\u0456\u0447.',
      '\u043B\u044E\u0442.',
      '\u0431\u0435\u0440\u0435\u0437.',
      '\u043A\u0432\u0456\u0442.',
      '\u0442\u0440\u0430\u0432.',
      '\u0447\u0435\u0440\u0432.',
      '\u043B\u0438\u043F.',
      '\u0441\u0435\u0440\u043F.',
      '\u0432\u0435\u0440\u0435\u0441.',
      '\u0436\u043E\u0432\u0442.',
      '\u043B\u0438\u0441\u0442\u043E\u043F.',
      '\u0433\u0440\u0443\u0434.',
    ],
    wide: [
      '\u0441\u0456\u0447\u043D\u044F',
      '\u043B\u044E\u0442\u043E\u0433\u043E',
      '\u0431\u0435\u0440\u0435\u0437\u043D\u044F',
      '\u043A\u0432\u0456\u0442\u043D\u044F',
      '\u0442\u0440\u0430\u0432\u043D\u044F',
      '\u0447\u0435\u0440\u0432\u043D\u044F',
      '\u043B\u0438\u043F\u043D\u044F',
      '\u0441\u0435\u0440\u043F\u043D\u044F',
      '\u0432\u0435\u0440\u0435\u0441\u043D\u044F',
      '\u0436\u043E\u0432\u0442\u043D\u044F',
      '\u043B\u0438\u0441\u0442\u043E\u043F\u0430\u0434\u0430',
      '\u0433\u0440\u0443\u0434\u043D\u044F',
    ],
  },
  X = {
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
      '\u0432\u0456\u0432',
      '\u0441\u0435\u0440',
      '\u0447\u0442\u0432',
      '\u043F\u0442\u043D',
      '\u0441\u0443\u0431',
    ],
    wide: [
      '\u043D\u0435\u0434\u0456\u043B\u044F',
      '\u043F\u043E\u043D\u0435\u0434\u0456\u043B\u043E\u043A',
      '\u0432\u0456\u0432\u0442\u043E\u0440\u043E\u043A',
      '\u0441\u0435\u0440\u0435\u0434\u0430',
      '\u0447\u0435\u0442\u0432\u0435\u0440',
      '\u043F\u2019\u044F\u0442\u043D\u0438\u0446\u044F',
      '\u0441\u0443\u0431\u043E\u0442\u0430',
    ],
  },
  E = {
    narrow: {
      am: '\u0414\u041F',
      pm: '\u041F\u041F',
      midnight: '\u043F\u0456\u0432\u043D.',
      noon: '\u043F\u043E\u043B.',
      morning: '\u0440\u0430\u043D\u043E\u043A',
      afternoon: '\u0434\u0435\u043D\u044C',
      evening: '\u0432\u0435\u0447.',
      night: '\u043D\u0456\u0447',
    },
    abbreviated: {
      am: '\u0414\u041F',
      pm: '\u041F\u041F',
      midnight: '\u043F\u0456\u0432\u043D.',
      noon: '\u043F\u043E\u043B.',
      morning: '\u0440\u0430\u043D\u043E\u043A',
      afternoon: '\u0434\u0435\u043D\u044C',
      evening: '\u0432\u0435\u0447.',
      night: '\u043D\u0456\u0447',
    },
    wide: {
      am: '\u0414\u041F',
      pm: '\u041F\u041F',
      midnight: '\u043F\u0456\u0432\u043D\u0456\u0447',
      noon: '\u043F\u043E\u043B\u0443\u0434\u0435\u043D\u044C',
      morning: '\u0440\u0430\u043D\u043E\u043A',
      afternoon: '\u0434\u0435\u043D\u044C',
      evening: '\u0432\u0435\u0447\u0456\u0440',
      night: '\u043D\u0456\u0447',
    },
  },
  H = {
    narrow: {
      am: '\u0414\u041F',
      pm: '\u041F\u041F',
      midnight: '\u043F\u0456\u0432\u043D.',
      noon: '\u043F\u043E\u043B.',
      morning: '\u0440\u0430\u043D\u043A\u0443',
      afternoon: '\u0434\u043D\u044F',
      evening: '\u0432\u0435\u0447.',
      night: '\u043D\u043E\u0447\u0456',
    },
    abbreviated: {
      am: '\u0414\u041F',
      pm: '\u041F\u041F',
      midnight: '\u043F\u0456\u0432\u043D.',
      noon: '\u043F\u043E\u043B.',
      morning: '\u0440\u0430\u043D\u043A\u0443',
      afternoon: '\u0434\u043D\u044F',
      evening: '\u0432\u0435\u0447.',
      night: '\u043D\u043E\u0447\u0456',
    },
    wide: {
      am: '\u0414\u041F',
      pm: '\u041F\u041F',
      midnight: '\u043F\u0456\u0432\u043D\u0456\u0447',
      noon: '\u043F\u043E\u043B\u0443\u0434\u0435\u043D\u044C',
      morning: '\u0440\u0430\u043D\u043A\u0443',
      afternoon: '\u0434\u043D\u044F',
      evening: '\u0432\u0435\u0447.',
      night: '\u043D\u043E\u0447\u0456',
    },
  },
  T = (t, e) => {
    let n = String(e?.unit),
      i = Number(t),
      a
    return (
      n === 'date'
        ? i === 3 || i === 23
          ? (a = '-\u0454')
          : (a = '-\u0435')
        : n === 'minute' || n === 'second' || n === 'hour'
          ? (a = '-\u0430')
          : (a = '-\u0439'),
      i + a
    )
  },
  G = {
    ordinalNumber: T,
    era: o({ values: z, defaultWidth: 'wide' }),
    quarter: o({ values: S, defaultWidth: 'wide', argumentCallback: (t) => t - 1 }),
    month: o({
      values: V,
      defaultWidth: 'wide',
      formattingValues: L,
      defaultFormattingWidth: 'wide',
    }),
    day: o({ values: X, defaultWidth: 'wide' }),
    dayPeriod: o({
      values: E,
      defaultWidth: 'any',
      formattingValues: H,
      defaultFormattingWidth: 'wide',
    }),
  }
var C = /^(\d+)(-?(е|й|є|а|я))?/i,
  R = /\d+/i,
  Y = {
    narrow: /^((до )?н\.?\s?е\.?)/i,
    abbreviated: /^((до )?н\.?\s?е\.?)/i,
    wide: /^(до нашої ери|нашої ери|наша ера)/i,
  },
  q = { any: [/^д/i, /^н/i] },
  O = {
    narrow: /^[1234]/i,
    abbreviated: /^[1234](-?[иі]?й?)? кв.?/i,
    wide: /^[1234](-?[иі]?й?)? квартал/i,
  },
  A = { any: [/1/i, /2/i, /3/i, /4/i] },
  Q = {
    narrow: /^[слбктчвжг]/i,
    abbreviated: /^(січ|лют|бер(ез)?|квіт|трав|черв|лип|серп|вер(ес)?|жовт|лис(топ)?|груд)\.?/i,
    wide: /^(січень|січня|лютий|лютого|березень|березня|квітень|квітня|травень|травня|червня|червень|липень|липня|серпень|серпня|вересень|вересня|жовтень|жовтня|листопад[а]?|грудень|грудня)/i,
  },
  I = {
    narrow: [/^с/i, /^л/i, /^б/i, /^к/i, /^т/i, /^ч/i, /^л/i, /^с/i, /^в/i, /^ж/i, /^л/i, /^г/i],
    any: [
      /^сі/i,
      /^лю/i,
      /^б/i,
      /^к/i,
      /^т/i,
      /^ч/i,
      /^лип/i,
      /^се/i,
      /^в/i,
      /^ж/i,
      /^лис/i,
      /^г/i,
    ],
  },
  _ = {
    narrow: /^[нпвсч]/i,
    short: /^(нд|пн|вт|ср|чт|пт|сб)\.?/i,
    abbreviated: /^(нед|пон|вів|сер|че?тв|птн?|суб)\.?/i,
    wide: /^(неділ[яі]|понеділ[ок][ка]|вівтор[ок][ка]|серед[аи]|четвер(га)?|п\W*?ятниц[яі]|субот[аи])/i,
  },
  j = {
    narrow: [/^н/i, /^п/i, /^в/i, /^с/i, /^ч/i, /^п/i, /^с/i],
    any: [/^н/i, /^п[он]/i, /^в/i, /^с[ер]/i, /^ч/i, /^п\W*?[ят]/i, /^с[уб]/i],
  },
  B = {
    narrow: /^([дп]п|півн\.?|пол\.?|ранок|ранку|день|дня|веч\.?|ніч|ночі)/i,
    abbreviated: /^([дп]п|півн\.?|пол\.?|ранок|ранку|день|дня|веч\.?|ніч|ночі)/i,
    wide: /^([дп]п|північ|полудень|ранок|ранку|день|дня|вечір|вечора|ніч|ночі)/i,
  },
  J = {
    any: {
      am: /^дп/i,
      pm: /^пп/i,
      midnight: /^півн/i,
      noon: /^пол/i,
      morning: /^р/i,
      afternoon: /^д[ен]/i,
      evening: /^в/i,
      night: /^н/i,
    },
  },
  w = {
    ordinalNumber: g({ matchPattern: C, parsePattern: R, valueCallback: (t) => parseInt(t, 10) }),
    era: u({
      matchPatterns: Y,
      defaultMatchWidth: 'wide',
      parsePatterns: q,
      defaultParseWidth: 'any',
    }),
    quarter: u({
      matchPatterns: O,
      defaultMatchWidth: 'wide',
      parsePatterns: A,
      defaultParseWidth: 'any',
      valueCallback: (t) => t + 1,
    }),
    month: u({
      matchPatterns: Q,
      defaultMatchWidth: 'wide',
      parsePatterns: I,
      defaultParseWidth: 'any',
    }),
    day: u({
      matchPatterns: _,
      defaultMatchWidth: 'wide',
      parsePatterns: j,
      defaultParseWidth: 'any',
    }),
    dayPeriod: u({
      matchPatterns: B,
      defaultMatchWidth: 'wide',
      parsePatterns: J,
      defaultParseWidth: 'any',
    }),
  }
var K = {
    code: 'uk',
    formatDistance: v,
    formatLong: f,
    formatRelative: h,
    localize: G,
    match: w,
    options: { weekStartsOn: 1, firstWeekContainsDate: 1 },
  },
  gt = K
export { gt as default, K as uk }
