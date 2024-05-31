import { a as s, b as i, c as m, d as r } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var g = {
    lessThanXSeconds: {
      one: '\u05E4\u05D7\u05D5\u05EA \u05DE\u05E9\u05E0\u05D9\u05D9\u05D4',
      two: '\u05E4\u05D7\u05D5\u05EA \u05DE\u05E9\u05EA\u05D9 \u05E9\u05E0\u05D9\u05D5\u05EA',
      other: '\u05E4\u05D7\u05D5\u05EA \u05DE\u05BE{{count}} \u05E9\u05E0\u05D9\u05D5\u05EA',
    },
    xSeconds: {
      one: '\u05E9\u05E0\u05D9\u05D9\u05D4',
      two: '\u05E9\u05EA\u05D9 \u05E9\u05E0\u05D9\u05D5\u05EA',
      other: '{{count}} \u05E9\u05E0\u05D9\u05D5\u05EA',
    },
    halfAMinute: '\u05D7\u05E6\u05D9 \u05D3\u05E7\u05D4',
    lessThanXMinutes: {
      one: '\u05E4\u05D7\u05D5\u05EA \u05DE\u05D3\u05E7\u05D4',
      two: '\u05E4\u05D7\u05D5\u05EA \u05DE\u05E9\u05EA\u05D9 \u05D3\u05E7\u05D5\u05EA',
      other: '\u05E4\u05D7\u05D5\u05EA \u05DE\u05BE{{count}} \u05D3\u05E7\u05D5\u05EA',
    },
    xMinutes: {
      one: '\u05D3\u05E7\u05D4',
      two: '\u05E9\u05EA\u05D9 \u05D3\u05E7\u05D5\u05EA',
      other: '{{count}} \u05D3\u05E7\u05D5\u05EA',
    },
    aboutXHours: {
      one: '\u05DB\u05E9\u05E2\u05D4',
      two: '\u05DB\u05E9\u05E2\u05EA\u05D9\u05D9\u05DD',
      other: '\u05DB\u05BE{{count}} \u05E9\u05E2\u05D5\u05EA',
    },
    xHours: {
      one: '\u05E9\u05E2\u05D4',
      two: '\u05E9\u05E2\u05EA\u05D9\u05D9\u05DD',
      other: '{{count}} \u05E9\u05E2\u05D5\u05EA',
    },
    xDays: {
      one: '\u05D9\u05D5\u05DD',
      two: '\u05D9\u05D5\u05DE\u05D9\u05D9\u05DD',
      other: '{{count}} \u05D9\u05DE\u05D9\u05DD',
    },
    aboutXWeeks: {
      one: '\u05DB\u05E9\u05D1\u05D5\u05E2',
      two: '\u05DB\u05E9\u05D1\u05D5\u05E2\u05D9\u05D9\u05DD',
      other: '\u05DB\u05BE{{count}} \u05E9\u05D1\u05D5\u05E2\u05D5\u05EA',
    },
    xWeeks: {
      one: '\u05E9\u05D1\u05D5\u05E2',
      two: '\u05E9\u05D1\u05D5\u05E2\u05D9\u05D9\u05DD',
      other: '{{count}} \u05E9\u05D1\u05D5\u05E2\u05D5\u05EA',
    },
    aboutXMonths: {
      one: '\u05DB\u05D7\u05D5\u05D3\u05E9',
      two: '\u05DB\u05D7\u05D5\u05D3\u05E9\u05D9\u05D9\u05DD',
      other: '\u05DB\u05BE{{count}} \u05D7\u05D5\u05D3\u05E9\u05D9\u05DD',
    },
    xMonths: {
      one: '\u05D7\u05D5\u05D3\u05E9',
      two: '\u05D7\u05D5\u05D3\u05E9\u05D9\u05D9\u05DD',
      other: '{{count}} \u05D7\u05D5\u05D3\u05E9\u05D9\u05DD',
    },
    aboutXYears: {
      one: '\u05DB\u05E9\u05E0\u05D4',
      two: '\u05DB\u05E9\u05E0\u05EA\u05D9\u05D9\u05DD',
      other: '\u05DB\u05BE{{count}} \u05E9\u05E0\u05D9\u05DD',
    },
    xYears: {
      one: '\u05E9\u05E0\u05D4',
      two: '\u05E9\u05E0\u05EA\u05D9\u05D9\u05DD',
      other: '{{count}} \u05E9\u05E0\u05D9\u05DD',
    },
    overXYears: {
      one: '\u05D9\u05D5\u05EA\u05E8 \u05DE\u05E9\u05E0\u05D4',
      two: '\u05D9\u05D5\u05EA\u05E8 \u05DE\u05E9\u05E0\u05EA\u05D9\u05D9\u05DD',
      other: '\u05D9\u05D5\u05EA\u05E8 \u05DE\u05BE{{count}} \u05E9\u05E0\u05D9\u05DD',
    },
    almostXYears: {
      one: '\u05DB\u05DE\u05E2\u05D8 \u05E9\u05E0\u05D4',
      two: '\u05DB\u05DE\u05E2\u05D8 \u05E9\u05E0\u05EA\u05D9\u05D9\u05DD',
      other: '\u05DB\u05DE\u05E2\u05D8 {{count}} \u05E9\u05E0\u05D9\u05DD',
    },
  },
  u = (t, e, a) => {
    if (t === 'xDays' && a?.addSuffix && e <= 2)
      return a.comparison && a.comparison > 0
        ? e === 1
          ? '\u05DE\u05D7\u05E8'
          : '\u05DE\u05D7\u05E8\u05EA\u05D9\u05D9\u05DD'
        : e === 1
          ? '\u05D0\u05EA\u05DE\u05D5\u05DC'
          : '\u05E9\u05DC\u05E9\u05D5\u05DD'
    let n,
      o = g[t]
    return (
      typeof o == 'string'
        ? (n = o)
        : e === 1
          ? (n = o.one)
          : e === 2
            ? (n = o.two)
            : (n = o.other.replace('{{count}}', String(e))),
      a?.addSuffix
        ? a.comparison && a.comparison > 0
          ? '\u05D1\u05E2\u05D5\u05D3 ' + n
          : '\u05DC\u05E4\u05E0\u05D9 ' + n
        : n
    )
  }
var b = {
    full: 'EEEE, d \u05D1MMMM y',
    long: 'd \u05D1MMMM y',
    medium: 'd \u05D1MMM y',
    short: 'd.M.y',
  },
  P = { full: 'H:mm:ss zzzz', long: 'H:mm:ss z', medium: 'H:mm:ss', short: 'H:mm' },
  y = {
    full: "{{date}} '\u05D1\u05E9\u05E2\u05D4' {{time}}",
    long: "{{date}} '\u05D1\u05E9\u05E2\u05D4' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
  c = {
    date: s({ formats: b, defaultWidth: 'full' }),
    time: s({ formats: P, defaultWidth: 'full' }),
    dateTime: s({ formats: y, defaultWidth: 'full' }),
  }
var v = {
    lastWeek: "eeee '\u05E9\u05E2\u05D1\u05E8 \u05D1\u05E9\u05E2\u05D4' p",
    yesterday: "'\u05D0\u05EA\u05DE\u05D5\u05DC \u05D1\u05E9\u05E2\u05D4' p",
    today: "'\u05D4\u05D9\u05D5\u05DD \u05D1\u05E9\u05E2\u05D4' p",
    tomorrow: "'\u05DE\u05D7\u05E8 \u05D1\u05E9\u05E2\u05D4' p",
    nextWeek: "eeee '\u05D1\u05E9\u05E2\u05D4' p",
    other: 'P',
  },
  l = (t, e, a, n) => v[t]
var M = {
    narrow: ['\u05DC\u05E4\u05E0\u05D4\u05F4\u05E1', '\u05DC\u05E1\u05E4\u05D9\u05E8\u05D4'],
    abbreviated: ['\u05DC\u05E4\u05E0\u05D4\u05F4\u05E1', '\u05DC\u05E1\u05E4\u05D9\u05E8\u05D4'],
    wide: [
      '\u05DC\u05E4\u05E0\u05D9 \u05D4\u05E1\u05E4\u05D9\u05E8\u05D4',
      '\u05DC\u05E1\u05E4\u05D9\u05E8\u05D4',
    ],
  },
  W = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
    wide: [
      '\u05E8\u05D1\u05E2\u05D5\u05DF 1',
      '\u05E8\u05D1\u05E2\u05D5\u05DF 2',
      '\u05E8\u05D1\u05E2\u05D5\u05DF 3',
      '\u05E8\u05D1\u05E2\u05D5\u05DF 4',
    ],
  },
  x = {
    narrow: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    abbreviated: [
      '\u05D9\u05E0\u05D5\u05F3',
      '\u05E4\u05D1\u05E8\u05F3',
      '\u05DE\u05E8\u05E5',
      '\u05D0\u05E4\u05E8\u05F3',
      '\u05DE\u05D0\u05D9',
      '\u05D9\u05D5\u05E0\u05D9',
      '\u05D9\u05D5\u05DC\u05D9',
      '\u05D0\u05D5\u05D2\u05F3',
      '\u05E1\u05E4\u05D8\u05F3',
      '\u05D0\u05D5\u05E7\u05F3',
      '\u05E0\u05D5\u05D1\u05F3',
      '\u05D3\u05E6\u05DE\u05F3',
    ],
    wide: [
      '\u05D9\u05E0\u05D5\u05D0\u05E8',
      '\u05E4\u05D1\u05E8\u05D5\u05D0\u05E8',
      '\u05DE\u05E8\u05E5',
      '\u05D0\u05E4\u05E8\u05D9\u05DC',
      '\u05DE\u05D0\u05D9',
      '\u05D9\u05D5\u05E0\u05D9',
      '\u05D9\u05D5\u05DC\u05D9',
      '\u05D0\u05D5\u05D2\u05D5\u05E1\u05D8',
      '\u05E1\u05E4\u05D8\u05DE\u05D1\u05E8',
      '\u05D0\u05D5\u05E7\u05D8\u05D5\u05D1\u05E8',
      '\u05E0\u05D5\u05D1\u05DE\u05D1\u05E8',
      '\u05D3\u05E6\u05DE\u05D1\u05E8',
    ],
  },
  $ = {
    narrow: [
      '\u05D0\u05F3',
      '\u05D1\u05F3',
      '\u05D2\u05F3',
      '\u05D3\u05F3',
      '\u05D4\u05F3',
      '\u05D5\u05F3',
      '\u05E9\u05F3',
    ],
    short: [
      '\u05D0\u05F3',
      '\u05D1\u05F3',
      '\u05D2\u05F3',
      '\u05D3\u05F3',
      '\u05D4\u05F3',
      '\u05D5\u05F3',
      '\u05E9\u05F3',
    ],
    abbreviated: [
      '\u05D9\u05D5\u05DD \u05D0\u05F3',
      '\u05D9\u05D5\u05DD \u05D1\u05F3',
      '\u05D9\u05D5\u05DD \u05D2\u05F3',
      '\u05D9\u05D5\u05DD \u05D3\u05F3',
      '\u05D9\u05D5\u05DD \u05D4\u05F3',
      '\u05D9\u05D5\u05DD \u05D5\u05F3',
      '\u05E9\u05D1\u05EA',
    ],
    wide: [
      '\u05D9\u05D5\u05DD \u05E8\u05D0\u05E9\u05D5\u05DF',
      '\u05D9\u05D5\u05DD \u05E9\u05E0\u05D9',
      '\u05D9\u05D5\u05DD \u05E9\u05DC\u05D9\u05E9\u05D9',
      '\u05D9\u05D5\u05DD \u05E8\u05D1\u05D9\u05E2\u05D9',
      '\u05D9\u05D5\u05DD \u05D7\u05DE\u05D9\u05E9\u05D9',
      '\u05D9\u05D5\u05DD \u05E9\u05D9\u05E9\u05D9',
      '\u05D9\u05D5\u05DD \u05E9\u05D1\u05EA',
    ],
  },
  D = {
    narrow: {
      am: '\u05DC\u05E4\u05E0\u05D4\u05F4\u05E6',
      pm: '\u05D0\u05D7\u05D4\u05F4\u05E6',
      midnight: '\u05D7\u05E6\u05D5\u05EA',
      noon: '\u05E6\u05D4\u05E8\u05D9\u05D9\u05DD',
      morning: '\u05D1\u05D5\u05E7\u05E8',
      afternoon: '\u05D0\u05D7\u05E8 \u05D4\u05E6\u05D4\u05E8\u05D9\u05D9\u05DD',
      evening: '\u05E2\u05E8\u05D1',
      night: '\u05DC\u05D9\u05DC\u05D4',
    },
    abbreviated: {
      am: '\u05DC\u05E4\u05E0\u05D4\u05F4\u05E6',
      pm: '\u05D0\u05D7\u05D4\u05F4\u05E6',
      midnight: '\u05D7\u05E6\u05D5\u05EA',
      noon: '\u05E6\u05D4\u05E8\u05D9\u05D9\u05DD',
      morning: '\u05D1\u05D5\u05E7\u05E8',
      afternoon: '\u05D0\u05D7\u05E8 \u05D4\u05E6\u05D4\u05E8\u05D9\u05D9\u05DD',
      evening: '\u05E2\u05E8\u05D1',
      night: '\u05DC\u05D9\u05DC\u05D4',
    },
    wide: {
      am: '\u05DC\u05E4\u05E0\u05D4\u05F4\u05E6',
      pm: '\u05D0\u05D7\u05D4\u05F4\u05E6',
      midnight: '\u05D7\u05E6\u05D5\u05EA',
      noon: '\u05E6\u05D4\u05E8\u05D9\u05D9\u05DD',
      morning: '\u05D1\u05D5\u05E7\u05E8',
      afternoon: '\u05D0\u05D7\u05E8 \u05D4\u05E6\u05D4\u05E8\u05D9\u05D9\u05DD',
      evening: '\u05E2\u05E8\u05D1',
      night: '\u05DC\u05D9\u05DC\u05D4',
    },
  },
  F = {
    narrow: {
      am: '\u05DC\u05E4\u05E0\u05D4\u05F4\u05E6',
      pm: '\u05D0\u05D7\u05D4\u05F4\u05E6',
      midnight: '\u05D7\u05E6\u05D5\u05EA',
      noon: '\u05E6\u05D4\u05E8\u05D9\u05D9\u05DD',
      morning: '\u05D1\u05D1\u05D5\u05E7\u05E8',
      afternoon: '\u05D1\u05E6\u05D4\u05E8\u05D9\u05D9\u05DD',
      evening: '\u05D1\u05E2\u05E8\u05D1',
      night: '\u05D1\u05DC\u05D9\u05DC\u05D4',
    },
    abbreviated: {
      am: '\u05DC\u05E4\u05E0\u05D4\u05F4\u05E6',
      pm: '\u05D0\u05D7\u05D4\u05F4\u05E6',
      midnight: '\u05D7\u05E6\u05D5\u05EA',
      noon: '\u05E6\u05D4\u05E8\u05D9\u05D9\u05DD',
      morning: '\u05D1\u05D1\u05D5\u05E7\u05E8',
      afternoon: '\u05D0\u05D7\u05E8 \u05D4\u05E6\u05D4\u05E8\u05D9\u05D9\u05DD',
      evening: '\u05D1\u05E2\u05E8\u05D1',
      night: '\u05D1\u05DC\u05D9\u05DC\u05D4',
    },
    wide: {
      am: '\u05DC\u05E4\u05E0\u05D4\u05F4\u05E6',
      pm: '\u05D0\u05D7\u05D4\u05F4\u05E6',
      midnight: '\u05D7\u05E6\u05D5\u05EA',
      noon: '\u05E6\u05D4\u05E8\u05D9\u05D9\u05DD',
      morning: '\u05D1\u05D1\u05D5\u05E7\u05E8',
      afternoon: '\u05D0\u05D7\u05E8 \u05D4\u05E6\u05D4\u05E8\u05D9\u05D9\u05DD',
      evening: '\u05D1\u05E2\u05E8\u05D1',
      night: '\u05D1\u05DC\u05D9\u05DC\u05D4',
    },
  },
  k = (t, e) => {
    let a = Number(t)
    if (a <= 0 || a > 10) return String(a)
    let n = String(e?.unit),
      o = ['year', 'hour', 'minute', 'second'].indexOf(n) >= 0,
      w = [
        '\u05E8\u05D0\u05E9\u05D5\u05DF',
        '\u05E9\u05E0\u05D9',
        '\u05E9\u05DC\u05D9\u05E9\u05D9',
        '\u05E8\u05D1\u05D9\u05E2\u05D9',
        '\u05D7\u05DE\u05D9\u05E9\u05D9',
        '\u05E9\u05D9\u05E9\u05D9',
        '\u05E9\u05D1\u05D9\u05E2\u05D9',
        '\u05E9\u05DE\u05D9\u05E0\u05D9',
        '\u05EA\u05E9\u05D9\u05E2\u05D9',
        '\u05E2\u05E9\u05D9\u05E8\u05D9',
      ],
      p = [
        '\u05E8\u05D0\u05E9\u05D5\u05E0\u05D4',
        '\u05E9\u05E0\u05D9\u05D9\u05D4',
        '\u05E9\u05DC\u05D9\u05E9\u05D9\u05EA',
        '\u05E8\u05D1\u05D9\u05E2\u05D9\u05EA',
        '\u05D7\u05DE\u05D9\u05E9\u05D9\u05EA',
        '\u05E9\u05D9\u05E9\u05D9\u05EA',
        '\u05E9\u05D1\u05D9\u05E2\u05D9\u05EA',
        '\u05E9\u05DE\u05D9\u05E0\u05D9\u05EA',
        '\u05EA\u05E9\u05D9\u05E2\u05D9\u05EA',
        '\u05E2\u05E9\u05D9\u05E8\u05D9\u05EA',
      ],
      d = a - 1
    return o ? p[d] : w[d]
  },
  h = {
    ordinalNumber: k,
    era: i({ values: M, defaultWidth: 'wide' }),
    quarter: i({ values: W, defaultWidth: 'wide', argumentCallback: (t) => t - 1 }),
    month: i({ values: x, defaultWidth: 'wide' }),
    day: i({ values: $, defaultWidth: 'wide' }),
    dayPeriod: i({
      values: D,
      defaultWidth: 'wide',
      formattingValues: F,
      defaultFormattingWidth: 'wide',
    }),
  }
var z =
    /^(\d+|(ראשון|שני|שלישי|רביעי|חמישי|שישי|שביעי|שמיני|תשיעי|עשירי|ראשונה|שנייה|שלישית|רביעית|חמישית|שישית|שביעית|שמינית|תשיעית|עשירית))/i,
  N = /^(\d+|רא|שנ|של|רב|ח|שי|שב|שמ|ת|ע)/i,
  S = { narrow: /^ל(ספירה|פנה״ס)/i, abbreviated: /^ל(ספירה|פנה״ס)/i, wide: /^ל(פני ה)?ספירה/i },
  V = { any: [/^לפ/i, /^לס/i] },
  X = { narrow: /^[1234]/i, abbreviated: /^q[1234]/i, wide: /^רבעון [1234]/i },
  L = { any: [/1/i, /2/i, /3/i, /4/i] },
  E = {
    narrow: /^\d+/i,
    abbreviated: /^(ינו|פבר|מרץ|אפר|מאי|יוני|יולי|אוג|ספט|אוק|נוב|דצמ)׳?/i,
    wide: /^(ינואר|פברואר|מרץ|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר)/i,
  },
  H = {
    narrow: [
      /^1$/i,
      /^2/i,
      /^3/i,
      /^4/i,
      /^5/i,
      /^6/i,
      /^7/i,
      /^8/i,
      /^9/i,
      /^10/i,
      /^11/i,
      /^12/i,
    ],
    any: [
      /^ינ/i,
      /^פ/i,
      /^מר/i,
      /^אפ/i,
      /^מא/i,
      /^יונ/i,
      /^יול/i,
      /^אוג/i,
      /^ס/i,
      /^אוק/i,
      /^נ/i,
      /^ד/i,
    ],
  },
  Q = {
    narrow: /^[אבגדהוש]׳/i,
    short: /^[אבגדהוש]׳/i,
    abbreviated: /^(שבת|יום (א|ב|ג|ד|ה|ו)׳)/i,
    wide: /^יום (ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)/i,
  },
  O = {
    abbreviated: [/א׳$/i, /ב׳$/i, /ג׳$/i, /ד׳$/i, /ה׳$/i, /ו׳$/i, /^ש/i],
    wide: [/ן$/i, /ני$/i, /לישי$/i, /עי$/i, /מישי$/i, /שישי$/i, /ת$/i],
    any: [/^א/i, /^ב/i, /^ג/i, /^ד/i, /^ה/i, /^ו/i, /^ש/i],
  },
  q = { any: /^(אחר ה|ב)?(חצות|צהריים|בוקר|ערב|לילה|אחה״צ|לפנה״צ)/i },
  C = {
    any: {
      am: /^לפ/i,
      pm: /^אחה/i,
      midnight: /^ח/i,
      noon: /^צ/i,
      morning: /בוקר/i,
      afternoon: /בצ|אחר/i,
      evening: /ערב/i,
      night: /לילה/i,
    },
  },
  R = [
    '\u05E8\u05D0',
    '\u05E9\u05E0',
    '\u05E9\u05DC',
    '\u05E8\u05D1',
    '\u05D7',
    '\u05E9\u05D9',
    '\u05E9\u05D1',
    '\u05E9\u05DE',
    '\u05EA',
    '\u05E2',
  ],
  f = {
    ordinalNumber: m({
      matchPattern: z,
      parsePattern: N,
      valueCallback: (t) => {
        let e = parseInt(t, 10)
        return isNaN(e) ? R.indexOf(t) + 1 : e
      },
    }),
    era: r({
      matchPatterns: S,
      defaultMatchWidth: 'wide',
      parsePatterns: V,
      defaultParseWidth: 'any',
    }),
    quarter: r({
      matchPatterns: X,
      defaultMatchWidth: 'wide',
      parsePatterns: L,
      defaultParseWidth: 'any',
      valueCallback: (t) => t + 1,
    }),
    month: r({
      matchPatterns: E,
      defaultMatchWidth: 'wide',
      parsePatterns: H,
      defaultParseWidth: 'any',
    }),
    day: r({
      matchPatterns: Q,
      defaultMatchWidth: 'wide',
      parsePatterns: O,
      defaultParseWidth: 'any',
    }),
    dayPeriod: r({
      matchPatterns: q,
      defaultMatchWidth: 'any',
      parsePatterns: C,
      defaultParseWidth: 'any',
    }),
  }
var T = {
    code: 'he',
    formatDistance: u,
    formatLong: c,
    formatRelative: l,
    localize: h,
    match: f,
    options: { weekStartsOn: 0, firstWeekContainsDate: 1 },
  },
  nt = T
export { nt as default, T as he }
