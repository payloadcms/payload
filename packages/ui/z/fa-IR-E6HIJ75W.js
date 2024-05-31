import { a as s, b as a, c as d, d as n } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var f = {
    lessThanXSeconds: {
      one: '\u06A9\u0645\u062A\u0631 \u0627\u0632 \u06CC\u06A9 \u062B\u0627\u0646\u06CC\u0647',
      other: '\u06A9\u0645\u062A\u0631 \u0627\u0632 {{count}} \u062B\u0627\u0646\u06CC\u0647',
    },
    xSeconds: {
      one: '1 \u062B\u0627\u0646\u06CC\u0647',
      other: '{{count}} \u062B\u0627\u0646\u06CC\u0647',
    },
    halfAMinute: '\u0646\u06CC\u0645 \u062F\u0642\u06CC\u0642\u0647',
    lessThanXMinutes: {
      one: '\u06A9\u0645\u062A\u0631 \u0627\u0632 \u06CC\u06A9 \u062F\u0642\u06CC\u0642\u0647',
      other: '\u06A9\u0645\u062A\u0631 \u0627\u0632 {{count}} \u062F\u0642\u06CC\u0642\u0647',
    },
    xMinutes: {
      one: '1 \u062F\u0642\u06CC\u0642\u0647',
      other: '{{count}} \u062F\u0642\u06CC\u0642\u0647',
    },
    aboutXHours: {
      one: '\u062D\u062F\u0648\u062F 1 \u0633\u0627\u0639\u062A',
      other: '\u062D\u062F\u0648\u062F {{count}} \u0633\u0627\u0639\u062A',
    },
    xHours: { one: '1 \u0633\u0627\u0639\u062A', other: '{{count}} \u0633\u0627\u0639\u062A' },
    xDays: { one: '1 \u0631\u0648\u0632', other: '{{count}} \u0631\u0648\u0632' },
    aboutXWeeks: {
      one: '\u062D\u062F\u0648\u062F 1 \u0647\u0641\u062A\u0647',
      other: '\u062D\u062F\u0648\u062F {{count}} \u0647\u0641\u062A\u0647',
    },
    xWeeks: { one: '1 \u0647\u0641\u062A\u0647', other: '{{count}} \u0647\u0641\u062A\u0647' },
    aboutXMonths: {
      one: '\u062D\u062F\u0648\u062F 1 \u0645\u0627\u0647',
      other: '\u062D\u062F\u0648\u062F {{count}} \u0645\u0627\u0647',
    },
    xMonths: { one: '1 \u0645\u0627\u0647', other: '{{count}} \u0645\u0627\u0647' },
    aboutXYears: {
      one: '\u062D\u062F\u0648\u062F 1 \u0633\u0627\u0644',
      other: '\u062D\u062F\u0648\u062F {{count}} \u0633\u0627\u0644',
    },
    xYears: { one: '1 \u0633\u0627\u0644', other: '{{count}} \u0633\u0627\u0644' },
    overXYears: {
      one: '\u0628\u06CC\u0634\u062A\u0631 \u0627\u0632 1 \u0633\u0627\u0644',
      other: '\u0628\u06CC\u0634\u062A\u0631 \u0627\u0632 {{count}} \u0633\u0627\u0644',
    },
    almostXYears: {
      one: '\u0646\u0632\u062F\u06CC\u06A9 1 \u0633\u0627\u0644',
      other: '\u0646\u0632\u062F\u06CC\u06A9 {{count}} \u0633\u0627\u0644',
    },
  },
  m = (t, o, i) => {
    let e,
      r = f[t]
    return (
      typeof r == 'string'
        ? (e = r)
        : o === 1
          ? (e = r.one)
          : (e = r.other.replace('{{count}}', String(o))),
      i?.addSuffix
        ? i.comparison && i.comparison > 0
          ? '\u062F\u0631 ' + e
          : e + ' \u0642\u0628\u0644'
        : e
    )
  }
var p = { full: 'EEEE do MMMM y', long: 'do MMMM y', medium: 'd MMM y', short: 'yyyy/MM/dd' },
  g = { full: 'h:mm:ss a zzzz', long: 'h:mm:ss a z', medium: 'h:mm:ss a', short: 'h:mm a' },
  b = {
    full: "{{date}} '\u062F\u0631' {{time}}",
    long: "{{date}} '\u062F\u0631' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
  h = {
    date: s({ formats: p, defaultWidth: 'full' }),
    time: s({ formats: g, defaultWidth: 'full' }),
    dateTime: s({ formats: b, defaultWidth: 'full' }),
  }
var w = {
    lastWeek: "eeee '\u06AF\u0630\u0634\u062A\u0647 \u062F\u0631' p",
    yesterday: "'\u062F\u06CC\u0631\u0648\u0632 \u062F\u0631' p",
    today: "'\u0627\u0645\u0631\u0648\u0632 \u062F\u0631' p",
    tomorrow: "'\u0641\u0631\u062F\u0627 \u062F\u0631' p",
    nextWeek: "eeee '\u062F\u0631' p",
    other: 'P',
  },
  l = (t, o, i, e) => w[t]
var P = {
    narrow: ['\u0642', '\u0628'],
    abbreviated: ['\u0642.\u0645.', '\u0628.\u0645.'],
    wide: [
      '\u0642\u0628\u0644 \u0627\u0632 \u0645\u06CC\u0644\u0627\u062F',
      '\u0628\u0639\u062F \u0627\u0632 \u0645\u06CC\u0644\u0627\u062F',
    ],
  },
  y = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: [
      '\u0633\u200C\u06451',
      '\u0633\u200C\u06452',
      '\u0633\u200C\u06453',
      '\u0633\u200C\u06454',
    ],
    wide: [
      '\u0633\u0647\u200C\u0645\u0627\u0647\u0647 1',
      '\u0633\u0647\u200C\u0645\u0627\u0647\u0647 2',
      '\u0633\u0647\u200C\u0645\u0627\u0647\u0647 3',
      '\u0633\u0647\u200C\u0645\u0627\u0647\u0647 4',
    ],
  },
  v = {
    narrow: [
      '\u0698',
      '\u0641',
      '\u0645',
      '\u0622',
      '\u0645',
      '\u062C',
      '\u062C',
      '\u0622',
      '\u0633',
      '\u0627',
      '\u0646',
      '\u062F',
    ],
    abbreviated: [
      '\u0698\u0627\u0646\u0640',
      '\u0641\u0648\u0631',
      '\u0645\u0627\u0631\u0633',
      '\u0622\u067E\u0631',
      '\u0645\u06CC',
      '\u062C\u0648\u0646',
      '\u062C\u0648\u0644\u0640',
      '\u0622\u06AF\u0648',
      '\u0633\u067E\u062A\u0640',
      '\u0627\u06A9\u062A\u0640',
      '\u0646\u0648\u0627\u0645\u0640',
      '\u062F\u0633\u0627\u0645\u0640',
    ],
    wide: [
      '\u0698\u0627\u0646\u0648\u06CC\u0647',
      '\u0641\u0648\u0631\u06CC\u0647',
      '\u0645\u0627\u0631\u0633',
      '\u0622\u067E\u0631\u06CC\u0644',
      '\u0645\u06CC',
      '\u062C\u0648\u0646',
      '\u062C\u0648\u0644\u0627\u06CC',
      '\u0622\u06AF\u0648\u0633\u062A',
      '\u0633\u067E\u062A\u0627\u0645\u0628\u0631',
      '\u0627\u06A9\u062A\u0628\u0631',
      '\u0646\u0648\u0627\u0645\u0628\u0631',
      '\u062F\u0633\u0627\u0645\u0628\u0631',
    ],
  },
  M = {
    narrow: ['\u06CC', '\u062F', '\u0633', '\u0686', '\u067E', '\u062C', '\u0634'],
    short: ['1\u0634', '2\u0634', '3\u0634', '4\u0634', '5\u0634', '\u062C', '\u0634'],
    abbreviated: [
      '\u06CC\u06A9\u0634\u0646\u0628\u0647',
      '\u062F\u0648\u0634\u0646\u0628\u0647',
      '\u0633\u0647\u200C\u0634\u0646\u0628\u0647',
      '\u0686\u0647\u0627\u0631\u0634\u0646\u0628\u0647',
      '\u067E\u0646\u062C\u0634\u0646\u0628\u0647',
      '\u062C\u0645\u0639\u0647',
      '\u0634\u0646\u0628\u0647',
    ],
    wide: [
      '\u06CC\u06A9\u0634\u0646\u0628\u0647',
      '\u062F\u0648\u0634\u0646\u0628\u0647',
      '\u0633\u0647\u200C\u0634\u0646\u0628\u0647',
      '\u0686\u0647\u0627\u0631\u0634\u0646\u0628\u0647',
      '\u067E\u0646\u062C\u0634\u0646\u0628\u0647',
      '\u062C\u0645\u0639\u0647',
      '\u0634\u0646\u0628\u0647',
    ],
  },
  W = {
    narrow: {
      am: '\u0642',
      pm: '\u0628',
      midnight: '\u0646',
      noon: '\u0638',
      morning: '\u0635',
      afternoon: '\u0628.\u0638.',
      evening: '\u0639',
      night: '\u0634',
    },
    abbreviated: {
      am: '\u0642.\u0638.',
      pm: '\u0628.\u0638.',
      midnight: '\u0646\u06CC\u0645\u0647\u200C\u0634\u0628',
      noon: '\u0638\u0647\u0631',
      morning: '\u0635\u0628\u062D',
      afternoon: '\u0628\u0639\u062F\u0627\u0632\u0638\u0647\u0631',
      evening: '\u0639\u0635\u0631',
      night: '\u0634\u0628',
    },
    wide: {
      am: '\u0642\u0628\u0644\u200C\u0627\u0632\u0638\u0647\u0631',
      pm: '\u0628\u0639\u062F\u0627\u0632\u0638\u0647\u0631',
      midnight: '\u0646\u06CC\u0645\u0647\u200C\u0634\u0628',
      noon: '\u0638\u0647\u0631',
      morning: '\u0635\u0628\u062D',
      afternoon: '\u0628\u0639\u062F\u0627\u0632\u0638\u0647\u0631',
      evening: '\u0639\u0635\u0631',
      night: '\u0634\u0628',
    },
  },
  x = {
    narrow: {
      am: '\u0642',
      pm: '\u0628',
      midnight: '\u0646',
      noon: '\u0638',
      morning: '\u0635',
      afternoon: '\u0628.\u0638.',
      evening: '\u0639',
      night: '\u0634',
    },
    abbreviated: {
      am: '\u0642.\u0638.',
      pm: '\u0628.\u0638.',
      midnight: '\u0646\u06CC\u0645\u0647\u200C\u0634\u0628',
      noon: '\u0638\u0647\u0631',
      morning: '\u0635\u0628\u062D',
      afternoon: '\u0628\u0639\u062F\u0627\u0632\u0638\u0647\u0631',
      evening: '\u0639\u0635\u0631',
      night: '\u0634\u0628',
    },
    wide: {
      am: '\u0642\u0628\u0644\u200C\u0627\u0632\u0638\u0647\u0631',
      pm: '\u0628\u0639\u062F\u0627\u0632\u0638\u0647\u0631',
      midnight: '\u0646\u06CC\u0645\u0647\u200C\u0634\u0628',
      noon: '\u0638\u0647\u0631',
      morning: '\u0635\u0628\u062D',
      afternoon: '\u0628\u0639\u062F\u0627\u0632\u0638\u0647\u0631',
      evening: '\u0639\u0635\u0631',
      night: '\u0634\u0628',
    },
  },
  D = (t, o) => String(t),
  u = {
    ordinalNumber: D,
    era: a({ values: P, defaultWidth: 'wide' }),
    quarter: a({ values: y, defaultWidth: 'wide', argumentCallback: (t) => t - 1 }),
    month: a({ values: v, defaultWidth: 'wide' }),
    day: a({ values: M, defaultWidth: 'wide' }),
    dayPeriod: a({
      values: W,
      defaultWidth: 'wide',
      formattingValues: x,
      defaultFormattingWidth: 'wide',
    }),
  }
var k = /^(\d+)(th|st|nd|rd)?/i,
  z = /\d+/i,
  F = {
    narrow: /^(ق|ب)/i,
    abbreviated: /^(ق\.?\s?م\.?|ق\.?\s?د\.?\s?م\.?|م\.?\s?|د\.?\s?م\.?)/i,
    wide: /^(قبل از میلاد|قبل از دوران مشترک|میلادی|دوران مشترک|بعد از میلاد)/i,
  },
  V = { any: [/^قبل/i, /^بعد/i] },
  X = { narrow: /^[1234]/i, abbreviated: /^س‌م[1234]/i, wide: /^سه‌ماهه [1234]/i },
  L = { any: [/1/i, /2/i, /3/i, /4/i] },
  E = {
    narrow: /^[جژفمآاماسند]/i,
    abbreviated:
      /^(جنو|ژانـ|ژانویه|فوریه|فور|مارس|آوریل|آپر|مه|می|ژوئن|جون|جول|جولـ|ژوئیه|اوت|آگو|سپتمبر|سپتامبر|اکتبر|اکتوبر|نوامبر|نوامـ|دسامبر|دسامـ|دسم)/i,
    wide: /^(ژانویه|جنوری|فبروری|فوریه|مارچ|مارس|آپریل|اپریل|ایپریل|آوریل|مه|می|ژوئن|جون|جولای|ژوئیه|آگست|اگست|آگوست|اوت|سپتمبر|سپتامبر|اکتبر|اکتوبر|نوامبر|نومبر|دسامبر|دسمبر)/i,
  },
  R = {
    narrow: [
      /^(ژ|ج)/i,
      /^ف/i,
      /^م/i,
      /^(آ|ا)/i,
      /^م/i,
      /^(ژ|ج)/i,
      /^(ج|ژ)/i,
      /^(آ|ا)/i,
      /^س/i,
      /^ا/i,
      /^ن/i,
      /^د/i,
    ],
    any: [
      /^ژا/i,
      /^ف/i,
      /^ما/i,
      /^آپ/i,
      /^(می|مه)/i,
      /^(ژوئن|جون)/i,
      /^(ژوئی|جول)/i,
      /^(اوت|آگ)/i,
      /^س/i,
      /^(اوک|اک)/i,
      /^ن/i,
      /^د/i,
    ],
  },
  S = {
    narrow: /^[شیدسچپج]/i,
    short: /^(ش|ج|1ش|2ش|3ش|4ش|5ش)/i,
    abbreviated: /^(یکشنبه|دوشنبه|سه‌شنبه|چهارشنبه|پنج‌شنبه|جمعه|شنبه)/i,
    wide: /^(یکشنبه|دوشنبه|سه‌شنبه|چهارشنبه|پنج‌شنبه|جمعه|شنبه)/i,
  },
  C = {
    narrow: [/^ی/i, /^دو/i, /^س/i, /^چ/i, /^پ/i, /^ج/i, /^ش/i],
    any: [
      /^(ی|1ش|یکشنبه)/i,
      /^(د|2ش|دوشنبه)/i,
      /^(س|3ش|سه‌شنبه)/i,
      /^(چ|4ش|چهارشنبه)/i,
      /^(پ|5ش|پنجشنبه)/i,
      /^(ج|جمعه)/i,
      /^(ش|شنبه)/i,
    ],
  },
  N = {
    narrow: /^(ب|ق|ن|ظ|ص|ب.ظ.|ع|ش)/i,
    abbreviated: /^(ق.ظ.|ب.ظ.|نیمه‌شب|ظهر|صبح|بعدازظهر|عصر|شب)/i,
    wide: /^(قبل‌ازظهر|نیمه‌شب|ظهر|صبح|بعدازظهر|عصر|شب)/i,
  },
  T = {
    any: {
      am: /^(ق|ق.ظ.|قبل‌ازظهر)/i,
      pm: /^(ب|ب.ظ.|بعدازظهر)/i,
      midnight: /^(‌نیمه‌شب|ن)/i,
      noon: /^(ظ|ظهر)/i,
      morning: /(ص|صبح)/i,
      afternoon: /(ب|ب.ظ.|بعدازظهر)/i,
      evening: /(ع|عصر)/i,
      night: /(ش|شب)/i,
    },
  },
  c = {
    ordinalNumber: d({ matchPattern: k, parsePattern: z, valueCallback: (t) => parseInt(t, 10) }),
    era: n({
      matchPatterns: F,
      defaultMatchWidth: 'wide',
      parsePatterns: V,
      defaultParseWidth: 'any',
    }),
    quarter: n({
      matchPatterns: X,
      defaultMatchWidth: 'wide',
      parsePatterns: L,
      defaultParseWidth: 'any',
      valueCallback: (t) => t + 1,
    }),
    month: n({
      matchPatterns: E,
      defaultMatchWidth: 'wide',
      parsePatterns: R,
      defaultParseWidth: 'any',
    }),
    day: n({
      matchPatterns: S,
      defaultMatchWidth: 'wide',
      parsePatterns: C,
      defaultParseWidth: 'any',
    }),
    dayPeriod: n({
      matchPatterns: N,
      defaultMatchWidth: 'wide',
      parsePatterns: T,
      defaultParseWidth: 'any',
    }),
  }
var Y = {
    code: 'fa-IR',
    formatDistance: m,
    formatLong: h,
    formatRelative: l,
    localize: u,
    match: c,
    options: { weekStartsOn: 6, firstWeekContainsDate: 1 },
  },
  $ = Y
export { $ as default, Y as faIR }
