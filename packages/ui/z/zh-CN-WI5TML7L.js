import { a as d } from './chunk-YZ5EFHMQ.js'
import './chunk-N2T43CBH.js'
import { a as s, b as o, c as m, d as i } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var p = {
    lessThanXSeconds: { one: '\u4E0D\u5230 1 \u79D2', other: '\u4E0D\u5230 {{count}} \u79D2' },
    xSeconds: { one: '1 \u79D2', other: '{{count}} \u79D2' },
    halfAMinute: '\u534A\u5206\u949F',
    lessThanXMinutes: {
      one: '\u4E0D\u5230 1 \u5206\u949F',
      other: '\u4E0D\u5230 {{count}} \u5206\u949F',
    },
    xMinutes: { one: '1 \u5206\u949F', other: '{{count}} \u5206\u949F' },
    xHours: { one: '1 \u5C0F\u65F6', other: '{{count}} \u5C0F\u65F6' },
    aboutXHours: {
      one: '\u5927\u7EA6 1 \u5C0F\u65F6',
      other: '\u5927\u7EA6 {{count}} \u5C0F\u65F6',
    },
    xDays: { one: '1 \u5929', other: '{{count}} \u5929' },
    aboutXWeeks: {
      one: '\u5927\u7EA6 1 \u4E2A\u661F\u671F',
      other: '\u5927\u7EA6 {{count}} \u4E2A\u661F\u671F',
    },
    xWeeks: { one: '1 \u4E2A\u661F\u671F', other: '{{count}} \u4E2A\u661F\u671F' },
    aboutXMonths: {
      one: '\u5927\u7EA6 1 \u4E2A\u6708',
      other: '\u5927\u7EA6 {{count}} \u4E2A\u6708',
    },
    xMonths: { one: '1 \u4E2A\u6708', other: '{{count}} \u4E2A\u6708' },
    aboutXYears: { one: '\u5927\u7EA6 1 \u5E74', other: '\u5927\u7EA6 {{count}} \u5E74' },
    xYears: { one: '1 \u5E74', other: '{{count}} \u5E74' },
    overXYears: { one: '\u8D85\u8FC7 1 \u5E74', other: '\u8D85\u8FC7 {{count}} \u5E74' },
    almostXYears: { one: '\u5C06\u8FD1 1 \u5E74', other: '\u5C06\u8FD1 {{count}} \u5E74' },
  },
  u = (t, n, e) => {
    let a,
      r = p[t]
    return (
      typeof r == 'string'
        ? (a = r)
        : n === 1
          ? (a = r.one)
          : (a = r.other.replace('{{count}}', String(n))),
      e?.addSuffix ? (e.comparison && e.comparison > 0 ? a + '\u5185' : a + '\u524D') : a
    )
  }
var P = {
    full: "y'\u5E74'M'\u6708'd'\u65E5' EEEE",
    long: "y'\u5E74'M'\u6708'd'\u65E5'",
    medium: 'yyyy-MM-dd',
    short: 'yy-MM-dd',
  },
  b = { full: 'zzzz a h:mm:ss', long: 'z a h:mm:ss', medium: 'a h:mm:ss', short: 'a h:mm' },
  y = {
    full: '{{date}} {{time}}',
    long: '{{date}} {{time}}',
    medium: '{{date}} {{time}}',
    short: '{{date}} {{time}}',
  },
  c = {
    date: s({ formats: P, defaultWidth: 'full' }),
    time: s({ formats: b, defaultWidth: 'full' }),
    dateTime: s({ formats: y, defaultWidth: 'full' }),
  }
function h(t, n, e) {
  let a = 'eeee p'
  return d(t, n, e) ? a : t.getTime() > n.getTime() ? "'\u4E0B\u4E2A'" + a : "'\u4E0A\u4E2A'" + a
}
var w = {
    lastWeek: h,
    yesterday: "'\u6628\u5929' p",
    today: "'\u4ECA\u5929' p",
    tomorrow: "'\u660E\u5929' p",
    nextWeek: h,
    other: 'PP p',
  },
  l = (t, n, e, a) => {
    let r = w[t]
    return typeof r == 'function' ? r(n, e, a) : r
  }
var v = {
    narrow: ['\u524D', '\u516C\u5143'],
    abbreviated: ['\u524D', '\u516C\u5143'],
    wide: ['\u516C\u5143\u524D', '\u516C\u5143'],
  },
  W = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: [
      '\u7B2C\u4E00\u5B63',
      '\u7B2C\u4E8C\u5B63',
      '\u7B2C\u4E09\u5B63',
      '\u7B2C\u56DB\u5B63',
    ],
    wide: [
      '\u7B2C\u4E00\u5B63\u5EA6',
      '\u7B2C\u4E8C\u5B63\u5EA6',
      '\u7B2C\u4E09\u5B63\u5EA6',
      '\u7B2C\u56DB\u5B63\u5EA6',
    ],
  },
  M = {
    narrow: [
      '\u4E00',
      '\u4E8C',
      '\u4E09',
      '\u56DB',
      '\u4E94',
      '\u516D',
      '\u4E03',
      '\u516B',
      '\u4E5D',
      '\u5341',
      '\u5341\u4E00',
      '\u5341\u4E8C',
    ],
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
      '\u4E00\u6708',
      '\u4E8C\u6708',
      '\u4E09\u6708',
      '\u56DB\u6708',
      '\u4E94\u6708',
      '\u516D\u6708',
      '\u4E03\u6708',
      '\u516B\u6708',
      '\u4E5D\u6708',
      '\u5341\u6708',
      '\u5341\u4E00\u6708',
      '\u5341\u4E8C\u6708',
    ],
  },
  x = {
    narrow: ['\u65E5', '\u4E00', '\u4E8C', '\u4E09', '\u56DB', '\u4E94', '\u516D'],
    short: ['\u65E5', '\u4E00', '\u4E8C', '\u4E09', '\u56DB', '\u4E94', '\u516D'],
    abbreviated: [
      '\u5468\u65E5',
      '\u5468\u4E00',
      '\u5468\u4E8C',
      '\u5468\u4E09',
      '\u5468\u56DB',
      '\u5468\u4E94',
      '\u5468\u516D',
    ],
    wide: [
      '\u661F\u671F\u65E5',
      '\u661F\u671F\u4E00',
      '\u661F\u671F\u4E8C',
      '\u661F\u671F\u4E09',
      '\u661F\u671F\u56DB',
      '\u661F\u671F\u4E94',
      '\u661F\u671F\u516D',
    ],
  },
  k = {
    narrow: {
      am: '\u4E0A',
      pm: '\u4E0B',
      midnight: '\u51CC\u6668',
      noon: '\u5348',
      morning: '\u65E9',
      afternoon: '\u4E0B\u5348',
      evening: '\u665A',
      night: '\u591C',
    },
    abbreviated: {
      am: '\u4E0A\u5348',
      pm: '\u4E0B\u5348',
      midnight: '\u51CC\u6668',
      noon: '\u4E2D\u5348',
      morning: '\u65E9\u6668',
      afternoon: '\u4E2D\u5348',
      evening: '\u665A\u4E0A',
      night: '\u591C\u95F4',
    },
    wide: {
      am: '\u4E0A\u5348',
      pm: '\u4E0B\u5348',
      midnight: '\u51CC\u6668',
      noon: '\u4E2D\u5348',
      morning: '\u65E9\u6668',
      afternoon: '\u4E2D\u5348',
      evening: '\u665A\u4E0A',
      night: '\u591C\u95F4',
    },
  },
  z = {
    narrow: {
      am: '\u4E0A',
      pm: '\u4E0B',
      midnight: '\u51CC\u6668',
      noon: '\u5348',
      morning: '\u65E9',
      afternoon: '\u4E0B\u5348',
      evening: '\u665A',
      night: '\u591C',
    },
    abbreviated: {
      am: '\u4E0A\u5348',
      pm: '\u4E0B\u5348',
      midnight: '\u51CC\u6668',
      noon: '\u4E2D\u5348',
      morning: '\u65E9\u6668',
      afternoon: '\u4E2D\u5348',
      evening: '\u665A\u4E0A',
      night: '\u591C\u95F4',
    },
    wide: {
      am: '\u4E0A\u5348',
      pm: '\u4E0B\u5348',
      midnight: '\u51CC\u6668',
      noon: '\u4E2D\u5348',
      morning: '\u65E9\u6668',
      afternoon: '\u4E2D\u5348',
      evening: '\u665A\u4E0A',
      night: '\u591C\u95F4',
    },
  },
  S = (t, n) => {
    let e = Number(t)
    switch (n?.unit) {
      case 'date':
        return e.toString() + '\u65E5'
      case 'hour':
        return e.toString() + '\u65F6'
      case 'minute':
        return e.toString() + '\u5206'
      case 'second':
        return e.toString() + '\u79D2'
      default:
        return '\u7B2C ' + e.toString()
    }
  },
  f = {
    ordinalNumber: S,
    era: o({ values: v, defaultWidth: 'wide' }),
    quarter: o({ values: W, defaultWidth: 'wide', argumentCallback: (t) => t - 1 }),
    month: o({ values: M, defaultWidth: 'wide' }),
    day: o({ values: x, defaultWidth: 'wide' }),
    dayPeriod: o({
      values: k,
      defaultWidth: 'wide',
      formattingValues: z,
      defaultFormattingWidth: 'wide',
    }),
  }
var D = /^(第\s*)?\d+(日|时|分|秒)?/i,
  F = /\d+/i,
  V = { narrow: /^(前)/i, abbreviated: /^(前)/i, wide: /^(公元前|公元)/i },
  X = { any: [/^(前)/i, /^(公元)/i] },
  L = { narrow: /^[1234]/i, abbreviated: /^第[一二三四]刻/i, wide: /^第[一二三四]刻钟/i },
  N = { any: [/(1|一)/i, /(2|二)/i, /(3|三)/i, /(4|四)/i] },
  C = {
    narrow: /^(一|二|三|四|五|六|七|八|九|十[二一])/i,
    abbreviated: /^(一|二|三|四|五|六|七|八|九|十[二一]|\d|1[12])月/i,
    wide: /^(一|二|三|四|五|六|七|八|九|十[二一])月/i,
  },
  E = {
    narrow: [
      /^一/i,
      /^二/i,
      /^三/i,
      /^四/i,
      /^五/i,
      /^六/i,
      /^七/i,
      /^八/i,
      /^九/i,
      /^十(?!(一|二))/i,
      /^十一/i,
      /^十二/i,
    ],
    any: [
      /^一|1/i,
      /^二|2/i,
      /^三|3/i,
      /^四|4/i,
      /^五|5/i,
      /^六|6/i,
      /^七|7/i,
      /^八|8/i,
      /^九|9/i,
      /^十(?!(一|二))|10/i,
      /^十一|11/i,
      /^十二|12/i,
    ],
  },
  T = {
    narrow: /^[一二三四五六日]/i,
    short: /^[一二三四五六日]/i,
    abbreviated: /^周[一二三四五六日]/i,
    wide: /^星期[一二三四五六日]/i,
  },
  R = { any: [/日/i, /一/i, /二/i, /三/i, /四/i, /五/i, /六/i] },
  Y = { any: /^(上午?|下午?|午夜|[中正]午|早上?|下午|晚上?|凌晨|)/i },
  q = {
    any: {
      am: /^上午?/i,
      pm: /^下午?/i,
      midnight: /^午夜/i,
      noon: /^[中正]午/i,
      morning: /^早上/i,
      afternoon: /^下午/i,
      evening: /^晚上?/i,
      night: /^凌晨/i,
    },
  },
  g = {
    ordinalNumber: m({ matchPattern: D, parsePattern: F, valueCallback: (t) => parseInt(t, 10) }),
    era: i({
      matchPatterns: V,
      defaultMatchWidth: 'wide',
      parsePatterns: X,
      defaultParseWidth: 'any',
    }),
    quarter: i({
      matchPatterns: L,
      defaultMatchWidth: 'wide',
      parsePatterns: N,
      defaultParseWidth: 'any',
      valueCallback: (t) => t + 1,
    }),
    month: i({
      matchPatterns: C,
      defaultMatchWidth: 'wide',
      parsePatterns: E,
      defaultParseWidth: 'any',
    }),
    day: i({
      matchPatterns: T,
      defaultMatchWidth: 'wide',
      parsePatterns: R,
      defaultParseWidth: 'any',
    }),
    dayPeriod: i({
      matchPatterns: Y,
      defaultMatchWidth: 'any',
      parsePatterns: q,
      defaultParseWidth: 'any',
    }),
  }
var O = {
    code: 'zh-CN',
    formatDistance: u,
    formatLong: c,
    formatRelative: l,
    localize: f,
    match: g,
    options: { weekStartsOn: 1, firstWeekContainsDate: 4 },
  },
  at = O
export { at as default, O as zhCN }
