import { a as s, b as a, c as d, d as n } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var f = {
    lessThanXSeconds: {
      one: '\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32 1 \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35',
      other:
        '\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32 {{count}} \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35',
    },
    xSeconds: {
      one: '1 \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35',
      other: '{{count}} \u0E27\u0E34\u0E19\u0E32\u0E17\u0E35',
    },
    halfAMinute: '\u0E04\u0E23\u0E36\u0E48\u0E07\u0E19\u0E32\u0E17\u0E35',
    lessThanXMinutes: {
      one: '\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32 1 \u0E19\u0E32\u0E17\u0E35',
      other: '\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32 {{count}} \u0E19\u0E32\u0E17\u0E35',
    },
    xMinutes: { one: '1 \u0E19\u0E32\u0E17\u0E35', other: '{{count}} \u0E19\u0E32\u0E17\u0E35' },
    aboutXHours: {
      one: '\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 1 \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07',
      other:
        '\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 {{count}} \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07',
    },
    xHours: {
      one: '1 \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07',
      other: '{{count}} \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07',
    },
    xDays: { one: '1 \u0E27\u0E31\u0E19', other: '{{count}} \u0E27\u0E31\u0E19' },
    aboutXWeeks: {
      one: '\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 1 \u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C',
      other:
        '\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 {{count}} \u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C',
    },
    xWeeks: {
      one: '1 \u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C',
      other: '{{count}} \u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C',
    },
    aboutXMonths: {
      one: '\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 1 \u0E40\u0E14\u0E37\u0E2D\u0E19',
      other: '\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 {{count}} \u0E40\u0E14\u0E37\u0E2D\u0E19',
    },
    xMonths: {
      one: '1 \u0E40\u0E14\u0E37\u0E2D\u0E19',
      other: '{{count}} \u0E40\u0E14\u0E37\u0E2D\u0E19',
    },
    aboutXYears: {
      one: '\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 1 \u0E1B\u0E35',
      other: '\u0E1B\u0E23\u0E30\u0E21\u0E32\u0E13 {{count}} \u0E1B\u0E35',
    },
    xYears: { one: '1 \u0E1B\u0E35', other: '{{count}} \u0E1B\u0E35' },
    overXYears: {
      one: '\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 1 \u0E1B\u0E35',
      other: '\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 {{count}} \u0E1B\u0E35',
    },
    almostXYears: {
      one: '\u0E40\u0E01\u0E37\u0E2D\u0E1A 1 \u0E1B\u0E35',
      other: '\u0E40\u0E01\u0E37\u0E2D\u0E1A {{count}} \u0E1B\u0E35',
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
          ? t === 'halfAMinute'
            ? '\u0E43\u0E19' + e
            : '\u0E43\u0E19 ' + e
          : e + '\u0E17\u0E35\u0E48\u0E1C\u0E48\u0E32\u0E19\u0E21\u0E32'
        : e
    )
  }
var p = {
    full: '\u0E27\u0E31\u0E19EEEE\u0E17\u0E35\u0E48 do MMMM y',
    long: 'do MMMM y',
    medium: 'd MMM y',
    short: 'dd/MM/yyyy',
  },
  g = {
    full: 'H:mm:ss \u0E19. zzzz',
    long: 'H:mm:ss \u0E19. z',
    medium: 'H:mm:ss \u0E19.',
    short: 'H:mm \u0E19.',
  },
  b = {
    full: "{{date}} '\u0E40\u0E27\u0E25\u0E32' {{time}}",
    long: "{{date}} '\u0E40\u0E27\u0E25\u0E32' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
  c = {
    date: s({ formats: p, defaultWidth: 'full' }),
    time: s({ formats: g, defaultWidth: 'medium' }),
    dateTime: s({ formats: b, defaultWidth: 'full' }),
  }
var P = {
    lastWeek: "eeee'\u0E17\u0E35\u0E48\u0E41\u0E25\u0E49\u0E27\u0E40\u0E27\u0E25\u0E32' p",
    yesterday:
      "'\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E27\u0E32\u0E19\u0E19\u0E35\u0E49\u0E40\u0E27\u0E25\u0E32' p",
    today: "'\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E40\u0E27\u0E25\u0E32' p",
    tomorrow: "'\u0E1E\u0E23\u0E38\u0E48\u0E07\u0E19\u0E35\u0E49\u0E40\u0E27\u0E25\u0E32' p",
    nextWeek: "eeee '\u0E40\u0E27\u0E25\u0E32' p",
    other: 'P',
  },
  h = (t, o, i, e) => P[t]
var y = {
    narrow: ['B', '\u0E04\u0E28'],
    abbreviated: ['BC', '\u0E04.\u0E28.'],
    wide: [
      '\u0E1B\u0E35\u0E01\u0E48\u0E2D\u0E19\u0E04\u0E23\u0E34\u0E2A\u0E15\u0E01\u0E32\u0E25',
      '\u0E04\u0E23\u0E34\u0E2A\u0E15\u0E4C\u0E28\u0E31\u0E01\u0E23\u0E32\u0E0A',
    ],
  },
  w = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
    wide: [
      '\u0E44\u0E15\u0E23\u0E21\u0E32\u0E2A\u0E41\u0E23\u0E01',
      '\u0E44\u0E15\u0E23\u0E21\u0E32\u0E2A\u0E17\u0E35\u0E48\u0E2A\u0E2D\u0E07',
      '\u0E44\u0E15\u0E23\u0E21\u0E32\u0E2A\u0E17\u0E35\u0E48\u0E2A\u0E32\u0E21',
      '\u0E44\u0E15\u0E23\u0E21\u0E32\u0E2A\u0E17\u0E35\u0E48\u0E2A\u0E35\u0E48',
    ],
  },
  v = {
    narrow: [
      '\u0E2D\u0E32.',
      '\u0E08.',
      '\u0E2D.',
      '\u0E1E.',
      '\u0E1E\u0E24.',
      '\u0E28.',
      '\u0E2A.',
    ],
    short: [
      '\u0E2D\u0E32.',
      '\u0E08.',
      '\u0E2D.',
      '\u0E1E.',
      '\u0E1E\u0E24.',
      '\u0E28.',
      '\u0E2A.',
    ],
    abbreviated: [
      '\u0E2D\u0E32.',
      '\u0E08.',
      '\u0E2D.',
      '\u0E1E.',
      '\u0E1E\u0E24.',
      '\u0E28.',
      '\u0E2A.',
    ],
    wide: [
      '\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C',
      '\u0E08\u0E31\u0E19\u0E17\u0E23\u0E4C',
      '\u0E2D\u0E31\u0E07\u0E04\u0E32\u0E23',
      '\u0E1E\u0E38\u0E18',
      '\u0E1E\u0E24\u0E2B\u0E31\u0E2A\u0E1A\u0E14\u0E35',
      '\u0E28\u0E38\u0E01\u0E23\u0E4C',
      '\u0E40\u0E2A\u0E32\u0E23\u0E4C',
    ],
  },
  M = {
    narrow: [
      '\u0E21.\u0E04.',
      '\u0E01.\u0E1E.',
      '\u0E21\u0E35.\u0E04.',
      '\u0E40\u0E21.\u0E22.',
      '\u0E1E.\u0E04.',
      '\u0E21\u0E34.\u0E22.',
      '\u0E01.\u0E04.',
      '\u0E2A.\u0E04.',
      '\u0E01.\u0E22.',
      '\u0E15.\u0E04.',
      '\u0E1E.\u0E22.',
      '\u0E18.\u0E04.',
    ],
    abbreviated: [
      '\u0E21.\u0E04.',
      '\u0E01.\u0E1E.',
      '\u0E21\u0E35.\u0E04.',
      '\u0E40\u0E21.\u0E22.',
      '\u0E1E.\u0E04.',
      '\u0E21\u0E34.\u0E22.',
      '\u0E01.\u0E04.',
      '\u0E2A.\u0E04.',
      '\u0E01.\u0E22.',
      '\u0E15.\u0E04.',
      '\u0E1E.\u0E22.',
      '\u0E18.\u0E04.',
    ],
    wide: [
      '\u0E21\u0E01\u0E23\u0E32\u0E04\u0E21',
      '\u0E01\u0E38\u0E21\u0E20\u0E32\u0E1E\u0E31\u0E19\u0E18\u0E4C',
      '\u0E21\u0E35\u0E19\u0E32\u0E04\u0E21',
      '\u0E40\u0E21\u0E29\u0E32\u0E22\u0E19',
      '\u0E1E\u0E24\u0E29\u0E20\u0E32\u0E04\u0E21',
      '\u0E21\u0E34\u0E16\u0E38\u0E19\u0E32\u0E22\u0E19',
      '\u0E01\u0E23\u0E01\u0E0E\u0E32\u0E04\u0E21',
      '\u0E2A\u0E34\u0E07\u0E2B\u0E32\u0E04\u0E21',
      '\u0E01\u0E31\u0E19\u0E22\u0E32\u0E22\u0E19',
      '\u0E15\u0E38\u0E25\u0E32\u0E04\u0E21',
      '\u0E1E\u0E24\u0E28\u0E08\u0E34\u0E01\u0E32\u0E22\u0E19',
      '\u0E18\u0E31\u0E19\u0E27\u0E32\u0E04\u0E21',
    ],
  },
  W = {
    narrow: {
      am: '\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      pm: '\u0E2B\u0E25\u0E31\u0E07\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      midnight: '\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07\u0E04\u0E37\u0E19',
      noon: '\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      morning: '\u0E40\u0E0A\u0E49\u0E32',
      afternoon: '\u0E1A\u0E48\u0E32\u0E22',
      evening: '\u0E40\u0E22\u0E47\u0E19',
      night: '\u0E01\u0E25\u0E32\u0E07\u0E04\u0E37\u0E19',
    },
    abbreviated: {
      am: '\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      pm: '\u0E2B\u0E25\u0E31\u0E07\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      midnight: '\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07\u0E04\u0E37\u0E19',
      noon: '\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      morning: '\u0E40\u0E0A\u0E49\u0E32',
      afternoon: '\u0E1A\u0E48\u0E32\u0E22',
      evening: '\u0E40\u0E22\u0E47\u0E19',
      night: '\u0E01\u0E25\u0E32\u0E07\u0E04\u0E37\u0E19',
    },
    wide: {
      am: '\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      pm: '\u0E2B\u0E25\u0E31\u0E07\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      midnight: '\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07\u0E04\u0E37\u0E19',
      noon: '\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      morning: '\u0E40\u0E0A\u0E49\u0E32',
      afternoon: '\u0E1A\u0E48\u0E32\u0E22',
      evening: '\u0E40\u0E22\u0E47\u0E19',
      night: '\u0E01\u0E25\u0E32\u0E07\u0E04\u0E37\u0E19',
    },
  },
  x = {
    narrow: {
      am: '\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      pm: '\u0E2B\u0E25\u0E31\u0E07\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      midnight: '\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07\u0E04\u0E37\u0E19',
      noon: '\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      morning: '\u0E15\u0E2D\u0E19\u0E40\u0E0A\u0E49\u0E32',
      afternoon: '\u0E15\u0E2D\u0E19\u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19',
      evening: '\u0E15\u0E2D\u0E19\u0E40\u0E22\u0E47\u0E19',
      night: '\u0E15\u0E2D\u0E19\u0E01\u0E25\u0E32\u0E07\u0E04\u0E37\u0E19',
    },
    abbreviated: {
      am: '\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      pm: '\u0E2B\u0E25\u0E31\u0E07\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      midnight: '\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07\u0E04\u0E37\u0E19',
      noon: '\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      morning: '\u0E15\u0E2D\u0E19\u0E40\u0E0A\u0E49\u0E32',
      afternoon: '\u0E15\u0E2D\u0E19\u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19',
      evening: '\u0E15\u0E2D\u0E19\u0E40\u0E22\u0E47\u0E19',
      night: '\u0E15\u0E2D\u0E19\u0E01\u0E25\u0E32\u0E07\u0E04\u0E37\u0E19',
    },
    wide: {
      am: '\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      pm: '\u0E2B\u0E25\u0E31\u0E07\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      midnight: '\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07\u0E04\u0E37\u0E19',
      noon: '\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07',
      morning: '\u0E15\u0E2D\u0E19\u0E40\u0E0A\u0E49\u0E32',
      afternoon: '\u0E15\u0E2D\u0E19\u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19',
      evening: '\u0E15\u0E2D\u0E19\u0E40\u0E22\u0E47\u0E19',
      night: '\u0E15\u0E2D\u0E19\u0E01\u0E25\u0E32\u0E07\u0E04\u0E37\u0E19',
    },
  },
  D = (t, o) => String(t),
  u = {
    ordinalNumber: D,
    era: a({ values: y, defaultWidth: 'wide' }),
    quarter: a({ values: w, defaultWidth: 'wide', argumentCallback: (t) => t - 1 }),
    month: a({ values: M, defaultWidth: 'wide' }),
    day: a({ values: v, defaultWidth: 'wide' }),
    dayPeriod: a({
      values: W,
      defaultWidth: 'wide',
      formattingValues: x,
      defaultFormattingWidth: 'wide',
    }),
  }
var k = /^\d+/i,
  z = /\d+/i,
  F = {
    narrow: /^([bB]|[aA]|คศ)/i,
    abbreviated: /^([bB]\.?\s?[cC]\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?|ค\.?ศ\.?)/i,
    wide: /^(ก่อนคริสตกาล|คริสต์ศักราช|คริสตกาล)/i,
  },
  V = { any: [/^[bB]/i, /^(^[aA]|ค\.?ศ\.?|คริสตกาล|คริสต์ศักราช|)/i] },
  X = { narrow: /^[1234]/i, abbreviated: /^q[1234]/i, wide: /^ไตรมาส(ที่)? ?[1234]/i },
  L = { any: [/(1|แรก|หนึ่ง)/i, /(2|สอง)/i, /(3|สาม)/i, /(4|สี่)/i] },
  C = {
    narrow:
      /^(ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?)/i,
    abbreviated:
      /^(ม\.?ค\.?|ก\.?พ\.?|มี\.?ค\.?|เม\.?ย\.?|พ\.?ค\.?|มิ\.?ย\.?|ก\.?ค\.?|ส\.?ค\.?|ก\.?ย\.?|ต\.?ค\.?|พ\.?ย\.?|ธ\.?ค\.?')/i,
    wide: /^(มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)/i,
  },
  E = {
    wide: [
      /^มก/i,
      /^กุม/i,
      /^มี/i,
      /^เม/i,
      /^พฤษ/i,
      /^มิ/i,
      /^กรก/i,
      /^ส/i,
      /^กัน/i,
      /^ต/i,
      /^พฤศ/i,
      /^ธ/i,
    ],
    any: [
      /^ม\.?ค\.?/i,
      /^ก\.?พ\.?/i,
      /^มี\.?ค\.?/i,
      /^เม\.?ย\.?/i,
      /^พ\.?ค\.?/i,
      /^มิ\.?ย\.?/i,
      /^ก\.?ค\.?/i,
      /^ส\.?ค\.?/i,
      /^ก\.?ย\.?/i,
      /^ต\.?ค\.?/i,
      /^พ\.?ย\.?/i,
      /^ธ\.?ค\.?/i,
    ],
  },
  H = {
    narrow: /^(อา\.?|จ\.?|อ\.?|พฤ\.?|พ\.?|ศ\.?|ส\.?)/i,
    short: /^(อา\.?|จ\.?|อ\.?|พฤ\.?|พ\.?|ศ\.?|ส\.?)/i,
    abbreviated: /^(อา\.?|จ\.?|อ\.?|พฤ\.?|พ\.?|ศ\.?|ส\.?)/i,
    wide: /^(อาทิตย์|จันทร์|อังคาร|พุธ|พฤหัสบดี|ศุกร์|เสาร์)/i,
  },
  Q = {
    wide: [/^อา/i, /^จั/i, /^อั/i, /^พุธ/i, /^พฤ/i, /^ศ/i, /^เส/i],
    any: [/^อา/i, /^จ/i, /^อ/i, /^พ(?!ฤ)/i, /^พฤ/i, /^ศ/i, /^ส/i],
  },
  S = {
    any: /^(ก่อนเที่ยง|หลังเที่ยง|เที่ยงคืน|เที่ยง|(ตอน.*?)?.*(เที่ยง|เช้า|บ่าย|เย็น|กลางคืน))/i,
  },
  B = {
    any: {
      am: /^ก่อนเที่ยง/i,
      pm: /^หลังเที่ยง/i,
      midnight: /^เที่ยงคืน/i,
      noon: /^เที่ยง/i,
      morning: /เช้า/i,
      afternoon: /บ่าย/i,
      evening: /เย็น/i,
      night: /กลางคืน/i,
    },
  },
  l = {
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
      matchPatterns: C,
      defaultMatchWidth: 'wide',
      parsePatterns: E,
      defaultParseWidth: 'any',
    }),
    day: n({
      matchPatterns: H,
      defaultMatchWidth: 'wide',
      parsePatterns: Q,
      defaultParseWidth: 'any',
    }),
    dayPeriod: n({
      matchPatterns: S,
      defaultMatchWidth: 'any',
      parsePatterns: B,
      defaultParseWidth: 'any',
    }),
  }
var q = {
    code: 'th',
    formatDistance: m,
    formatLong: c,
    formatRelative: h,
    localize: u,
    match: l,
    options: { weekStartsOn: 0, firstWeekContainsDate: 1 },
  },
  $ = q
export { $ as default, q as th }
