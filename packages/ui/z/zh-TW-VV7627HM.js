import { a as s, b as n, c as d, d as o } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var f = {
    lessThanXSeconds: { one: '\u5C11\u65BC 1 \u79D2', other: '\u5C11\u65BC {{count}} \u79D2' },
    xSeconds: { one: '1 \u79D2', other: '{{count}} \u79D2' },
    halfAMinute: '\u534A\u5206\u9418',
    lessThanXMinutes: {
      one: '\u5C11\u65BC 1 \u5206\u9418',
      other: '\u5C11\u65BC {{count}} \u5206\u9418',
    },
    xMinutes: { one: '1 \u5206\u9418', other: '{{count}} \u5206\u9418' },
    xHours: { one: '1 \u5C0F\u6642', other: '{{count}} \u5C0F\u6642' },
    aboutXHours: {
      one: '\u5927\u7D04 1 \u5C0F\u6642',
      other: '\u5927\u7D04 {{count}} \u5C0F\u6642',
    },
    xDays: { one: '1 \u5929', other: '{{count}} \u5929' },
    aboutXWeeks: {
      one: '\u5927\u7D04 1 \u500B\u661F\u671F',
      other: '\u5927\u7D04 {{count}} \u500B\u661F\u671F',
    },
    xWeeks: { one: '1 \u500B\u661F\u671F', other: '{{count}} \u500B\u661F\u671F' },
    aboutXMonths: {
      one: '\u5927\u7D04 1 \u500B\u6708',
      other: '\u5927\u7D04 {{count}} \u500B\u6708',
    },
    xMonths: { one: '1 \u500B\u6708', other: '{{count}} \u500B\u6708' },
    aboutXYears: { one: '\u5927\u7D04 1 \u5E74', other: '\u5927\u7D04 {{count}} \u5E74' },
    xYears: { one: '1 \u5E74', other: '{{count}} \u5E74' },
    overXYears: { one: '\u8D85\u904E 1 \u5E74', other: '\u8D85\u904E {{count}} \u5E74' },
    almostXYears: { one: '\u5C07\u8FD1 1 \u5E74', other: '\u5C07\u8FD1 {{count}} \u5E74' },
  },
  m = (t, r, e) => {
    let a,
      i = f[t]
    return (
      typeof i == 'string'
        ? (a = i)
        : r === 1
          ? (a = i.one)
          : (a = i.other.replace('{{count}}', String(r))),
      e?.addSuffix ? (e.comparison && e.comparison > 0 ? a + '\u5167' : a + '\u524D') : a
    )
  }
var p = {
    full: "y'\u5E74'M'\u6708'd'\u65E5' EEEE",
    long: "y'\u5E74'M'\u6708'd'\u65E5'",
    medium: 'yyyy-MM-dd',
    short: 'yy-MM-dd',
  },
  g = { full: 'zzzz a h:mm:ss', long: 'z a h:mm:ss', medium: 'a h:mm:ss', short: 'a h:mm' },
  b = {
    full: '{{date}} {{time}}',
    long: '{{date}} {{time}}',
    medium: '{{date}} {{time}}',
    short: '{{date}} {{time}}',
  },
  u = {
    date: s({ formats: p, defaultWidth: 'full' }),
    time: s({ formats: g, defaultWidth: 'full' }),
    dateTime: s({ formats: b, defaultWidth: 'full' }),
  }
var P = {
    lastWeek: "'\u4E0A\u500B'eeee p",
    yesterday: "'\u6628\u5929' p",
    today: "'\u4ECA\u5929' p",
    tomorrow: "'\u660E\u5929' p",
    nextWeek: "'\u4E0B\u500B'eeee p",
    other: 'P',
  },
  h = (t, r, e, a) => P[t]
var y = {
    narrow: ['\u524D', '\u516C\u5143'],
    abbreviated: ['\u524D', '\u516C\u5143'],
    wide: ['\u516C\u5143\u524D', '\u516C\u5143'],
  },
  w = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: [
      '\u7B2C\u4E00\u523B',
      '\u7B2C\u4E8C\u523B',
      '\u7B2C\u4E09\u523B',
      '\u7B2C\u56DB\u523B',
    ],
    wide: [
      '\u7B2C\u4E00\u523B\u9418',
      '\u7B2C\u4E8C\u523B\u9418',
      '\u7B2C\u4E09\u523B\u9418',
      '\u7B2C\u56DB\u523B\u9418',
    ],
  },
  v = {
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
  W = {
    narrow: ['\u65E5', '\u4E00', '\u4E8C', '\u4E09', '\u56DB', '\u4E94', '\u516D'],
    short: ['\u65E5', '\u4E00', '\u4E8C', '\u4E09', '\u56DB', '\u4E94', '\u516D'],
    abbreviated: [
      '\u9031\u65E5',
      '\u9031\u4E00',
      '\u9031\u4E8C',
      '\u9031\u4E09',
      '\u9031\u56DB',
      '\u9031\u4E94',
      '\u9031\u516D',
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
  M = {
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
      night: '\u591C\u9593',
    },
    wide: {
      am: '\u4E0A\u5348',
      pm: '\u4E0B\u5348',
      midnight: '\u51CC\u6668',
      noon: '\u4E2D\u5348',
      morning: '\u65E9\u6668',
      afternoon: '\u4E2D\u5348',
      evening: '\u665A\u4E0A',
      night: '\u591C\u9593',
    },
  },
  x = {
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
      night: '\u591C\u9593',
    },
    wide: {
      am: '\u4E0A\u5348',
      pm: '\u4E0B\u5348',
      midnight: '\u51CC\u6668',
      noon: '\u4E2D\u5348',
      morning: '\u65E9\u6668',
      afternoon: '\u4E2D\u5348',
      evening: '\u665A\u4E0A',
      night: '\u591C\u9593',
    },
  },
  D = (t, r) => {
    let e = Number(t)
    switch (r?.unit) {
      case 'date':
        return e + '\u65E5'
      case 'hour':
        return e + '\u6642'
      case 'minute':
        return e + '\u5206'
      case 'second':
        return e + '\u79D2'
      default:
        return '\u7B2C ' + e
    }
  },
  c = {
    ordinalNumber: D,
    era: n({ values: y, defaultWidth: 'wide' }),
    quarter: n({ values: w, defaultWidth: 'wide', argumentCallback: (t) => t - 1 }),
    month: n({ values: v, defaultWidth: 'wide' }),
    day: n({ values: W, defaultWidth: 'wide' }),
    dayPeriod: n({
      values: M,
      defaultWidth: 'wide',
      formattingValues: x,
      defaultFormattingWidth: 'wide',
    }),
  }
var z = /^(第\s*)?\d+(日|時|分|秒)?/i,
  k = /\d+/i,
  F = { narrow: /^(前)/i, abbreviated: /^(前)/i, wide: /^(公元前|公元)/i },
  V = { any: [/^(前)/i, /^(公元)/i] },
  X = { narrow: /^[1234]/i, abbreviated: /^第[一二三四]刻/i, wide: /^第[一二三四]刻鐘/i },
  L = { any: [/(1|一)/i, /(2|二)/i, /(3|三)/i, /(4|四)/i] },
  E = {
    narrow: /^(一|二|三|四|五|六|七|八|九|十[二一])/i,
    abbreviated: /^(一|二|三|四|五|六|七|八|九|十[二一]|\d|1[12])月/i,
    wide: /^(一|二|三|四|五|六|七|八|九|十[二一])月/i,
  },
  T = {
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
  N = {
    narrow: /^[一二三四五六日]/i,
    short: /^[一二三四五六日]/i,
    abbreviated: /^週[一二三四五六日]/i,
    wide: /^星期[一二三四五六日]/i,
  },
  S = { any: [/日/i, /一/i, /二/i, /三/i, /四/i, /五/i, /六/i] },
  C = { any: /^(上午?|下午?|午夜|[中正]午|早上?|下午|晚上?|凌晨)/i },
  R = {
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
  l = {
    ordinalNumber: d({ matchPattern: z, parsePattern: k, valueCallback: (t) => parseInt(t, 10) }),
    era: o({
      matchPatterns: F,
      defaultMatchWidth: 'wide',
      parsePatterns: V,
      defaultParseWidth: 'any',
    }),
    quarter: o({
      matchPatterns: X,
      defaultMatchWidth: 'wide',
      parsePatterns: L,
      defaultParseWidth: 'any',
      valueCallback: (t) => t + 1,
    }),
    month: o({
      matchPatterns: E,
      defaultMatchWidth: 'wide',
      parsePatterns: T,
      defaultParseWidth: 'any',
    }),
    day: o({
      matchPatterns: N,
      defaultMatchWidth: 'wide',
      parsePatterns: S,
      defaultParseWidth: 'any',
    }),
    dayPeriod: o({
      matchPatterns: C,
      defaultMatchWidth: 'any',
      parsePatterns: R,
      defaultParseWidth: 'any',
    }),
  }
var Y = {
    code: 'zh-TW',
    formatDistance: m,
    formatLong: u,
    formatRelative: h,
    localize: c,
    match: l,
    options: { weekStartsOn: 1, firstWeekContainsDate: 4 },
  },
  $ = Y
export { $ as default, Y as zhTW }
