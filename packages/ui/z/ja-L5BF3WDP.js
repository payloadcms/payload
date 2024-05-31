import { a as s, b as o, c as d, d as i } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var f = {
    lessThanXSeconds: {
      one: '1\u79D2\u672A\u6E80',
      other: '{{count}}\u79D2\u672A\u6E80',
      oneWithSuffix: '\u7D041\u79D2',
      otherWithSuffix: '\u7D04{{count}}\u79D2',
    },
    xSeconds: { one: '1\u79D2', other: '{{count}}\u79D2' },
    halfAMinute: '30\u79D2',
    lessThanXMinutes: {
      one: '1\u5206\u672A\u6E80',
      other: '{{count}}\u5206\u672A\u6E80',
      oneWithSuffix: '\u7D041\u5206',
      otherWithSuffix: '\u7D04{{count}}\u5206',
    },
    xMinutes: { one: '1\u5206', other: '{{count}}\u5206' },
    aboutXHours: { one: '\u7D041\u6642\u9593', other: '\u7D04{{count}}\u6642\u9593' },
    xHours: { one: '1\u6642\u9593', other: '{{count}}\u6642\u9593' },
    xDays: { one: '1\u65E5', other: '{{count}}\u65E5' },
    aboutXWeeks: { one: '\u7D041\u9031\u9593', other: '\u7D04{{count}}\u9031\u9593' },
    xWeeks: { one: '1\u9031\u9593', other: '{{count}}\u9031\u9593' },
    aboutXMonths: { one: '\u7D041\u304B\u6708', other: '\u7D04{{count}}\u304B\u6708' },
    xMonths: { one: '1\u304B\u6708', other: '{{count}}\u304B\u6708' },
    aboutXYears: { one: '\u7D041\u5E74', other: '\u7D04{{count}}\u5E74' },
    xYears: { one: '1\u5E74', other: '{{count}}\u5E74' },
    overXYears: { one: '1\u5E74\u4EE5\u4E0A', other: '{{count}}\u5E74\u4EE5\u4E0A' },
    almostXYears: { one: '1\u5E74\u8FD1\u304F', other: '{{count}}\u5E74\u8FD1\u304F' },
  },
  m = (e, r, t) => {
    t = t || {}
    let a,
      n = f[e]
    return (
      typeof n == 'string'
        ? (a = n)
        : r === 1
          ? t.addSuffix && n.oneWithSuffix
            ? (a = n.oneWithSuffix)
            : (a = n.one)
          : t.addSuffix && n.otherWithSuffix
            ? (a = n.otherWithSuffix.replace('{{count}}', String(r)))
            : (a = n.other.replace('{{count}}', String(r))),
      t.addSuffix ? (t.comparison && t.comparison > 0 ? a + '\u5F8C' : a + '\u524D') : a
    )
  }
var g = {
    full: 'y\u5E74M\u6708d\u65E5EEEE',
    long: 'y\u5E74M\u6708d\u65E5',
    medium: 'y/MM/dd',
    short: 'y/MM/dd',
  },
  p = { full: 'H\u6642mm\u5206ss\u79D2 zzzz', long: 'H:mm:ss z', medium: 'H:mm:ss', short: 'H:mm' },
  b = {
    full: '{{date}} {{time}}',
    long: '{{date}} {{time}}',
    medium: '{{date}} {{time}}',
    short: '{{date}} {{time}}',
  },
  u = {
    date: s({ formats: g, defaultWidth: 'full' }),
    time: s({ formats: p, defaultWidth: 'full' }),
    dateTime: s({ formats: b, defaultWidth: 'full' }),
  }
var P = {
    lastWeek: '\u5148\u9031\u306Eeeee\u306Ep',
    yesterday: '\u6628\u65E5\u306Ep',
    today: '\u4ECA\u65E5\u306Ep',
    tomorrow: '\u660E\u65E5\u306Ep',
    nextWeek: '\u7FCC\u9031\u306Eeeee\u306Ep',
    other: 'P',
  },
  c = (e, r, t, a) => P[e]
var w = {
    narrow: ['BC', 'AC'],
    abbreviated: ['\u7D00\u5143\u524D', '\u897F\u66A6'],
    wide: ['\u7D00\u5143\u524D', '\u897F\u66A6'],
  },
  y = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
    wide: [
      '\u7B2C1\u56DB\u534A\u671F',
      '\u7B2C2\u56DB\u534A\u671F',
      '\u7B2C3\u56DB\u534A\u671F',
      '\u7B2C4\u56DB\u534A\u671F',
    ],
  },
  W = {
    narrow: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    abbreviated: [
      '1\u6708',
      '2\u6708',
      '3\u6708',
      '4\u6708',
      '5\u6708',
      '6\u6708',
      '7\u6708',
      '8\u6708',
      '9\u6708',
      '10\u6708',
      '11\u6708',
      '12\u6708',
    ],
    wide: [
      '1\u6708',
      '2\u6708',
      '3\u6708',
      '4\u6708',
      '5\u6708',
      '6\u6708',
      '7\u6708',
      '8\u6708',
      '9\u6708',
      '10\u6708',
      '11\u6708',
      '12\u6708',
    ],
  },
  v = {
    narrow: ['\u65E5', '\u6708', '\u706B', '\u6C34', '\u6728', '\u91D1', '\u571F'],
    short: ['\u65E5', '\u6708', '\u706B', '\u6C34', '\u6728', '\u91D1', '\u571F'],
    abbreviated: ['\u65E5', '\u6708', '\u706B', '\u6C34', '\u6728', '\u91D1', '\u571F'],
    wide: [
      '\u65E5\u66DC\u65E5',
      '\u6708\u66DC\u65E5',
      '\u706B\u66DC\u65E5',
      '\u6C34\u66DC\u65E5',
      '\u6728\u66DC\u65E5',
      '\u91D1\u66DC\u65E5',
      '\u571F\u66DC\u65E5',
    ],
  },
  x = {
    narrow: {
      am: '\u5348\u524D',
      pm: '\u5348\u5F8C',
      midnight: '\u6DF1\u591C',
      noon: '\u6B63\u5348',
      morning: '\u671D',
      afternoon: '\u5348\u5F8C',
      evening: '\u591C',
      night: '\u6DF1\u591C',
    },
    abbreviated: {
      am: '\u5348\u524D',
      pm: '\u5348\u5F8C',
      midnight: '\u6DF1\u591C',
      noon: '\u6B63\u5348',
      morning: '\u671D',
      afternoon: '\u5348\u5F8C',
      evening: '\u591C',
      night: '\u6DF1\u591C',
    },
    wide: {
      am: '\u5348\u524D',
      pm: '\u5348\u5F8C',
      midnight: '\u6DF1\u591C',
      noon: '\u6B63\u5348',
      morning: '\u671D',
      afternoon: '\u5348\u5F8C',
      evening: '\u591C',
      night: '\u6DF1\u591C',
    },
  },
  M = {
    narrow: {
      am: '\u5348\u524D',
      pm: '\u5348\u5F8C',
      midnight: '\u6DF1\u591C',
      noon: '\u6B63\u5348',
      morning: '\u671D',
      afternoon: '\u5348\u5F8C',
      evening: '\u591C',
      night: '\u6DF1\u591C',
    },
    abbreviated: {
      am: '\u5348\u524D',
      pm: '\u5348\u5F8C',
      midnight: '\u6DF1\u591C',
      noon: '\u6B63\u5348',
      morning: '\u671D',
      afternoon: '\u5348\u5F8C',
      evening: '\u591C',
      night: '\u6DF1\u591C',
    },
    wide: {
      am: '\u5348\u524D',
      pm: '\u5348\u5F8C',
      midnight: '\u6DF1\u591C',
      noon: '\u6B63\u5348',
      morning: '\u671D',
      afternoon: '\u5348\u5F8C',
      evening: '\u591C',
      night: '\u6DF1\u591C',
    },
  },
  S = (e, r) => {
    let t = Number(e)
    switch (String(r?.unit)) {
      case 'year':
        return `${t}\u5E74`
      case 'quarter':
        return `\u7B2C${t}\u56DB\u534A\u671F`
      case 'month':
        return `${t}\u6708`
      case 'week':
        return `\u7B2C${t}\u9031`
      case 'date':
        return `${t}\u65E5`
      case 'hour':
        return `${t}\u6642`
      case 'minute':
        return `${t}\u5206`
      case 'second':
        return `${t}\u79D2`
      default:
        return `${t}`
    }
  },
  h = {
    ordinalNumber: S,
    era: o({ values: w, defaultWidth: 'wide' }),
    quarter: o({ values: y, defaultWidth: 'wide', argumentCallback: (e) => Number(e) - 1 }),
    month: o({ values: W, defaultWidth: 'wide' }),
    day: o({ values: v, defaultWidth: 'wide' }),
    dayPeriod: o({
      values: x,
      defaultWidth: 'wide',
      formattingValues: M,
      defaultFormattingWidth: 'wide',
    }),
  }
var D = /^第?\d+(年|四半期|月|週|日|時|分|秒)?/i,
  k = /\d+/i,
  z = {
    narrow: /^(B\.?C\.?|A\.?D\.?)/i,
    abbreviated: /^(紀元[前後]|西暦)/i,
    wide: /^(紀元[前後]|西暦)/i,
  },
  F = { narrow: [/^B/i, /^A/i], any: [/^(紀元前)/i, /^(西暦|紀元後)/i] },
  $ = { narrow: /^[1234]/i, abbreviated: /^Q[1234]/i, wide: /^第[1234一二三四１２３４]四半期/i },
  V = { any: [/(1|一|１)/i, /(2|二|２)/i, /(3|三|３)/i, /(4|四|４)/i] },
  X = {
    narrow: /^([123456789]|1[012])/,
    abbreviated: /^([123456789]|1[012])月/i,
    wide: /^([123456789]|1[012])月/i,
  },
  C = { any: [/^1\D/, /^2/, /^3/, /^4/, /^5/, /^6/, /^7/, /^8/, /^9/, /^10/, /^11/, /^12/] },
  L = {
    narrow: /^[日月火水木金土]/,
    short: /^[日月火水木金土]/,
    abbreviated: /^[日月火水木金土]/,
    wide: /^[日月火水木金土]曜日/,
  },
  N = { any: [/^日/, /^月/, /^火/, /^水/, /^木/, /^金/, /^土/] },
  Q = { any: /^(AM|PM|午前|午後|正午|深夜|真夜中|夜|朝)/i },
  A = {
    any: {
      am: /^(A|午前)/i,
      pm: /^(P|午後)/i,
      midnight: /^深夜|真夜中/i,
      noon: /^正午/i,
      morning: /^朝/i,
      afternoon: /^午後/i,
      evening: /^夜/i,
      night: /^深夜/i,
    },
  },
  l = {
    ordinalNumber: d({
      matchPattern: D,
      parsePattern: k,
      valueCallback: function (e) {
        return parseInt(e, 10)
      },
    }),
    era: i({
      matchPatterns: z,
      defaultMatchWidth: 'wide',
      parsePatterns: F,
      defaultParseWidth: 'any',
    }),
    quarter: i({
      matchPatterns: $,
      defaultMatchWidth: 'wide',
      parsePatterns: V,
      defaultParseWidth: 'any',
      valueCallback: (e) => e + 1,
    }),
    month: i({
      matchPatterns: X,
      defaultMatchWidth: 'wide',
      parsePatterns: C,
      defaultParseWidth: 'any',
    }),
    day: i({
      matchPatterns: L,
      defaultMatchWidth: 'wide',
      parsePatterns: N,
      defaultParseWidth: 'any',
    }),
    dayPeriod: i({
      matchPatterns: Q,
      defaultMatchWidth: 'any',
      parsePatterns: A,
      defaultParseWidth: 'any',
    }),
  }
var E = {
    code: 'ja',
    formatDistance: m,
    formatLong: u,
    formatRelative: c,
    localize: h,
    match: l,
    options: { weekStartsOn: 0, firstWeekContainsDate: 1 },
  },
  Z = E
export { Z as default, E as ja }
