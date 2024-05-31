import { a as s, b as n, c as d, d as o } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var f = {
    lessThanXSeconds: { one: '1\uCD08 \uBBF8\uB9CC', other: '{{count}}\uCD08 \uBBF8\uB9CC' },
    xSeconds: { one: '1\uCD08', other: '{{count}}\uCD08' },
    halfAMinute: '30\uCD08',
    lessThanXMinutes: { one: '1\uBD84 \uBBF8\uB9CC', other: '{{count}}\uBD84 \uBBF8\uB9CC' },
    xMinutes: { one: '1\uBD84', other: '{{count}}\uBD84' },
    aboutXHours: { one: '\uC57D 1\uC2DC\uAC04', other: '\uC57D {{count}}\uC2DC\uAC04' },
    xHours: { one: '1\uC2DC\uAC04', other: '{{count}}\uC2DC\uAC04' },
    xDays: { one: '1\uC77C', other: '{{count}}\uC77C' },
    aboutXWeeks: { one: '\uC57D 1\uC8FC', other: '\uC57D {{count}}\uC8FC' },
    xWeeks: { one: '1\uC8FC', other: '{{count}}\uC8FC' },
    aboutXMonths: { one: '\uC57D 1\uAC1C\uC6D4', other: '\uC57D {{count}}\uAC1C\uC6D4' },
    xMonths: { one: '1\uAC1C\uC6D4', other: '{{count}}\uAC1C\uC6D4' },
    aboutXYears: { one: '\uC57D 1\uB144', other: '\uC57D {{count}}\uB144' },
    xYears: { one: '1\uB144', other: '{{count}}\uB144' },
    overXYears: { one: '1\uB144 \uC774\uC0C1', other: '{{count}}\uB144 \uC774\uC0C1' },
    almostXYears: { one: '\uAC70\uC758 1\uB144', other: '\uAC70\uC758 {{count}}\uB144' },
  },
  m = (t, r, e) => {
    let a,
      i = f[t]
    return (
      typeof i == 'string'
        ? (a = i)
        : r === 1
          ? (a = i.one)
          : (a = i.other.replace('{{count}}', r.toString())),
      e?.addSuffix ? (e.comparison && e.comparison > 0 ? a + ' \uD6C4' : a + ' \uC804') : a
    )
  }
var p = {
    full: 'y\uB144 M\uC6D4 d\uC77C EEEE',
    long: 'y\uB144 M\uC6D4 d\uC77C',
    medium: 'y.MM.dd',
    short: 'y.MM.dd',
  },
  b = {
    full: 'a H\uC2DC mm\uBD84 ss\uCD08 zzzz',
    long: 'a H:mm:ss z',
    medium: 'HH:mm:ss',
    short: 'HH:mm',
  },
  g = {
    full: '{{date}} {{time}}',
    long: '{{date}} {{time}}',
    medium: '{{date}} {{time}}',
    short: '{{date}} {{time}}',
  },
  c = {
    date: s({ formats: p, defaultWidth: 'full' }),
    time: s({ formats: b, defaultWidth: 'full' }),
    dateTime: s({ formats: g, defaultWidth: 'full' }),
  }
var P = {
    lastWeek: "'\uC9C0\uB09C' eeee p",
    yesterday: "'\uC5B4\uC81C' p",
    today: "'\uC624\uB298' p",
    tomorrow: "'\uB0B4\uC77C' p",
    nextWeek: "'\uB2E4\uC74C' eeee p",
    other: 'P',
  },
  u = (t, r, e, a) => P[t]
var w = {
    narrow: ['BC', 'AD'],
    abbreviated: ['BC', 'AD'],
    wide: ['\uAE30\uC6D0\uC804', '\uC11C\uAE30'],
  },
  y = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
    wide: ['1\uBD84\uAE30', '2\uBD84\uAE30', '3\uBD84\uAE30', '4\uBD84\uAE30'],
  },
  v = {
    narrow: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    abbreviated: [
      '1\uC6D4',
      '2\uC6D4',
      '3\uC6D4',
      '4\uC6D4',
      '5\uC6D4',
      '6\uC6D4',
      '7\uC6D4',
      '8\uC6D4',
      '9\uC6D4',
      '10\uC6D4',
      '11\uC6D4',
      '12\uC6D4',
    ],
    wide: [
      '1\uC6D4',
      '2\uC6D4',
      '3\uC6D4',
      '4\uC6D4',
      '5\uC6D4',
      '6\uC6D4',
      '7\uC6D4',
      '8\uC6D4',
      '9\uC6D4',
      '10\uC6D4',
      '11\uC6D4',
      '12\uC6D4',
    ],
  },
  W = {
    narrow: ['\uC77C', '\uC6D4', '\uD654', '\uC218', '\uBAA9', '\uAE08', '\uD1A0'],
    short: ['\uC77C', '\uC6D4', '\uD654', '\uC218', '\uBAA9', '\uAE08', '\uD1A0'],
    abbreviated: ['\uC77C', '\uC6D4', '\uD654', '\uC218', '\uBAA9', '\uAE08', '\uD1A0'],
    wide: [
      '\uC77C\uC694\uC77C',
      '\uC6D4\uC694\uC77C',
      '\uD654\uC694\uC77C',
      '\uC218\uC694\uC77C',
      '\uBAA9\uC694\uC77C',
      '\uAE08\uC694\uC77C',
      '\uD1A0\uC694\uC77C',
    ],
  },
  M = {
    narrow: {
      am: '\uC624\uC804',
      pm: '\uC624\uD6C4',
      midnight: '\uC790\uC815',
      noon: '\uC815\uC624',
      morning: '\uC544\uCE68',
      afternoon: '\uC624\uD6C4',
      evening: '\uC800\uB141',
      night: '\uBC24',
    },
    abbreviated: {
      am: '\uC624\uC804',
      pm: '\uC624\uD6C4',
      midnight: '\uC790\uC815',
      noon: '\uC815\uC624',
      morning: '\uC544\uCE68',
      afternoon: '\uC624\uD6C4',
      evening: '\uC800\uB141',
      night: '\uBC24',
    },
    wide: {
      am: '\uC624\uC804',
      pm: '\uC624\uD6C4',
      midnight: '\uC790\uC815',
      noon: '\uC815\uC624',
      morning: '\uC544\uCE68',
      afternoon: '\uC624\uD6C4',
      evening: '\uC800\uB141',
      night: '\uBC24',
    },
  },
  x = {
    narrow: {
      am: '\uC624\uC804',
      pm: '\uC624\uD6C4',
      midnight: '\uC790\uC815',
      noon: '\uC815\uC624',
      morning: '\uC544\uCE68',
      afternoon: '\uC624\uD6C4',
      evening: '\uC800\uB141',
      night: '\uBC24',
    },
    abbreviated: {
      am: '\uC624\uC804',
      pm: '\uC624\uD6C4',
      midnight: '\uC790\uC815',
      noon: '\uC815\uC624',
      morning: '\uC544\uCE68',
      afternoon: '\uC624\uD6C4',
      evening: '\uC800\uB141',
      night: '\uBC24',
    },
    wide: {
      am: '\uC624\uC804',
      pm: '\uC624\uD6C4',
      midnight: '\uC790\uC815',
      noon: '\uC815\uC624',
      morning: '\uC544\uCE68',
      afternoon: '\uC624\uD6C4',
      evening: '\uC800\uB141',
      night: '\uBC24',
    },
  },
  D = (t, r) => {
    let e = Number(t)
    switch (String(r?.unit)) {
      case 'minute':
      case 'second':
        return String(e)
      case 'date':
        return e + '\uC77C'
      default:
        return e + '\uBC88\uC9F8'
    }
  },
  l = {
    ordinalNumber: D,
    era: n({ values: w, defaultWidth: 'wide' }),
    quarter: n({ values: y, defaultWidth: 'wide', argumentCallback: (t) => t - 1 }),
    month: n({ values: v, defaultWidth: 'wide' }),
    day: n({ values: W, defaultWidth: 'wide' }),
    dayPeriod: n({
      values: M,
      defaultWidth: 'wide',
      formattingValues: x,
      defaultFormattingWidth: 'wide',
    }),
  }
var k = /^(\d+)(일|번째)?/i,
  z = /\d+/i,
  F = {
    narrow: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
    abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
    wide: /^(기원전|서기)/i,
  },
  H = { any: [/^(bc|기원전)/i, /^(ad|서기)/i] },
  V = { narrow: /^[1234]/i, abbreviated: /^q[1234]/i, wide: /^[1234]사?분기/i },
  X = { any: [/1/i, /2/i, /3/i, /4/i] },
  L = {
    narrow: /^(1[012]|[123456789])/,
    abbreviated: /^(1[012]|[123456789])월/i,
    wide: /^(1[012]|[123456789])월/i,
  },
  S = { any: [/^1월?$/, /^2/, /^3/, /^4/, /^5/, /^6/, /^7/, /^8/, /^9/, /^10/, /^11/, /^12/] },
  C = {
    narrow: /^[일월화수목금토]/,
    short: /^[일월화수목금토]/,
    abbreviated: /^[일월화수목금토]/,
    wide: /^[일월화수목금토]요일/,
  },
  E = { any: [/^일/, /^월/, /^화/, /^수/, /^목/, /^금/, /^토/] },
  Q = { any: /^(am|pm|오전|오후|자정|정오|아침|저녁|밤)/i },
  N = {
    any: {
      am: /^(am|오전)/i,
      pm: /^(pm|오후)/i,
      midnight: /^자정/i,
      noon: /^정오/i,
      morning: /^아침/i,
      afternoon: /^오후/i,
      evening: /^저녁/i,
      night: /^밤/i,
    },
  },
  h = {
    ordinalNumber: d({ matchPattern: k, parsePattern: z, valueCallback: (t) => parseInt(t, 10) }),
    era: o({
      matchPatterns: F,
      defaultMatchWidth: 'wide',
      parsePatterns: H,
      defaultParseWidth: 'any',
    }),
    quarter: o({
      matchPatterns: V,
      defaultMatchWidth: 'wide',
      parsePatterns: X,
      defaultParseWidth: 'any',
      valueCallback: (t) => t + 1,
    }),
    month: o({
      matchPatterns: L,
      defaultMatchWidth: 'wide',
      parsePatterns: S,
      defaultParseWidth: 'any',
    }),
    day: o({
      matchPatterns: C,
      defaultMatchWidth: 'wide',
      parsePatterns: E,
      defaultParseWidth: 'any',
    }),
    dayPeriod: o({
      matchPatterns: Q,
      defaultMatchWidth: 'any',
      parsePatterns: N,
      defaultParseWidth: 'any',
    }),
  }
var q = {
    code: 'ko',
    formatDistance: m,
    formatLong: c,
    formatRelative: u,
    localize: l,
    match: h,
    options: { weekStartsOn: 0, firstWeekContainsDate: 1 },
  },
  Z = q
export { Z as default, q as ko }
