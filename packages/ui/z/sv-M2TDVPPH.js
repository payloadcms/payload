import { a as m, b as r, c as d, d as i } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var g = {
    lessThanXSeconds: { one: 'mindre \xE4n en sekund', other: 'mindre \xE4n {{count}} sekunder' },
    xSeconds: { one: 'en sekund', other: '{{count}} sekunder' },
    halfAMinute: 'en halv minut',
    lessThanXMinutes: { one: 'mindre \xE4n en minut', other: 'mindre \xE4n {{count}} minuter' },
    xMinutes: { one: 'en minut', other: '{{count}} minuter' },
    aboutXHours: { one: 'ungef\xE4r en timme', other: 'ungef\xE4r {{count}} timmar' },
    xHours: { one: 'en timme', other: '{{count}} timmar' },
    xDays: { one: 'en dag', other: '{{count}} dagar' },
    aboutXWeeks: { one: 'ungef\xE4r en vecka', other: 'ungef\xE4r {{count}} veckor' },
    xWeeks: { one: 'en vecka', other: '{{count}} veckor' },
    aboutXMonths: { one: 'ungef\xE4r en m\xE5nad', other: 'ungef\xE4r {{count}} m\xE5nader' },
    xMonths: { one: 'en m\xE5nad', other: '{{count}} m\xE5nader' },
    aboutXYears: { one: 'ungef\xE4r ett \xE5r', other: 'ungef\xE4r {{count}} \xE5r' },
    xYears: { one: 'ett \xE5r', other: '{{count}} \xE5r' },
    overXYears: { one: '\xF6ver ett \xE5r', other: '\xF6ver {{count}} \xE5r' },
    almostXYears: { one: 'n\xE4stan ett \xE5r', other: 'n\xE4stan {{count}} \xE5r' },
  },
  h = [
    'noll',
    'en',
    'tv\xE5',
    'tre',
    'fyra',
    'fem',
    'sex',
    'sju',
    '\xE5tta',
    'nio',
    'tio',
    'elva',
    'tolv',
  ],
  s = (e, n, a) => {
    let t,
      o = g[e]
    return (
      typeof o == 'string'
        ? (t = o)
        : n === 1
          ? (t = o.one)
          : (t = o.other.replace('{{count}}', n < 13 ? h[n] : String(n))),
      a?.addSuffix ? (a.comparison && a.comparison > 0 ? 'om ' + t : t + ' sedan') : t
    )
  }
var p = { full: 'EEEE d MMMM y', long: 'd MMMM y', medium: 'd MMM y', short: 'y-MM-dd' },
  v = { full: "'kl'. HH:mm:ss zzzz", long: 'HH:mm:ss z', medium: 'HH:mm:ss', short: 'HH:mm' },
  b = {
    full: "{{date}} 'kl.' {{time}}",
    long: "{{date}} 'kl.' {{time}}",
    medium: '{{date}} {{time}}',
    short: '{{date}} {{time}}',
  },
  l = {
    date: m({ formats: p, defaultWidth: 'full' }),
    time: m({ formats: v, defaultWidth: 'full' }),
    dateTime: m({ formats: b, defaultWidth: 'full' }),
  }
var k = {
    lastWeek: "'i' EEEE's kl.' p",
    yesterday: "'ig\xE5r kl.' p",
    today: "'idag kl.' p",
    tomorrow: "'imorgon kl.' p",
    nextWeek: "EEEE 'kl.' p",
    other: 'P',
  },
  u = (e, n, a, t) => k[e]
var P = {
    narrow: ['f.Kr.', 'e.Kr.'],
    abbreviated: ['f.Kr.', 'e.Kr.'],
    wide: ['f\xF6re Kristus', 'efter Kristus'],
  },
  w = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
    wide: ['1:a kvartalet', '2:a kvartalet', '3:e kvartalet', '4:e kvartalet'],
  },
  y = {
    narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    abbreviated: [
      'jan.',
      'feb.',
      'mars',
      'apr.',
      'maj',
      'juni',
      'juli',
      'aug.',
      'sep.',
      'okt.',
      'nov.',
      'dec.',
    ],
    wide: [
      'januari',
      'februari',
      'mars',
      'april',
      'maj',
      'juni',
      'juli',
      'augusti',
      'september',
      'oktober',
      'november',
      'december',
    ],
  },
  M = {
    narrow: ['S', 'M', 'T', 'O', 'T', 'F', 'L'],
    short: ['s\xF6', 'm\xE5', 'ti', 'on', 'to', 'fr', 'l\xF6'],
    abbreviated: ['s\xF6n', 'm\xE5n', 'tis', 'ons', 'tors', 'fre', 'l\xF6r'],
    wide: ['s\xF6ndag', 'm\xE5ndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'l\xF6rdag'],
  },
  j = {
    narrow: {
      am: 'fm',
      pm: 'em',
      midnight: 'midnatt',
      noon: 'middag',
      morning: 'morg.',
      afternoon: 'efterm.',
      evening: 'kv\xE4ll',
      night: 'natt',
    },
    abbreviated: {
      am: 'f.m.',
      pm: 'e.m.',
      midnight: 'midnatt',
      noon: 'middag',
      morning: 'morgon',
      afternoon: 'efterm.',
      evening: 'kv\xE4ll',
      night: 'natt',
    },
    wide: {
      am: 'f\xF6rmiddag',
      pm: 'eftermiddag',
      midnight: 'midnatt',
      noon: 'middag',
      morning: 'morgon',
      afternoon: 'eftermiddag',
      evening: 'kv\xE4ll',
      night: 'natt',
    },
  },
  W = {
    narrow: {
      am: 'fm',
      pm: 'em',
      midnight: 'midnatt',
      noon: 'middag',
      morning: 'p\xE5 morg.',
      afternoon: 'p\xE5 efterm.',
      evening: 'p\xE5 kv\xE4llen',
      night: 'p\xE5 natten',
    },
    abbreviated: {
      am: 'fm',
      pm: 'em',
      midnight: 'midnatt',
      noon: 'middag',
      morning: 'p\xE5 morg.',
      afternoon: 'p\xE5 efterm.',
      evening: 'p\xE5 kv\xE4llen',
      night: 'p\xE5 natten',
    },
    wide: {
      am: 'fm',
      pm: 'em',
      midnight: 'midnatt',
      noon: 'middag',
      morning: 'p\xE5 morgonen',
      afternoon: 'p\xE5 eftermiddagen',
      evening: 'p\xE5 kv\xE4llen',
      night: 'p\xE5 natten',
    },
  },
  x = (e, n) => {
    let a = Number(e),
      t = a % 100
    if (t > 20 || t < 10)
      switch (t % 10) {
        case 1:
        case 2:
          return a + ':a'
      }
    return a + ':e'
  },
  f = {
    ordinalNumber: x,
    era: r({ values: P, defaultWidth: 'wide' }),
    quarter: r({ values: w, defaultWidth: 'wide', argumentCallback: (e) => e - 1 }),
    month: r({ values: y, defaultWidth: 'wide' }),
    day: r({ values: M, defaultWidth: 'wide' }),
    dayPeriod: r({
      values: j,
      defaultWidth: 'wide',
      formattingValues: W,
      defaultFormattingWidth: 'wide',
    }),
  }
var E = /^(\d+)(:a|:e)?/i,
  D = /\d+/i,
  K = {
    narrow: /^(f\.? ?Kr\.?|f\.? ?v\.? ?t\.?|e\.? ?Kr\.?|v\.? ?t\.?)/i,
    abbreviated: /^(f\.? ?Kr\.?|f\.? ?v\.? ?t\.?|e\.? ?Kr\.?|v\.? ?t\.?)/i,
    wide: /^(före Kristus|före vår tid|efter Kristus|vår tid)/i,
  },
  F = { any: [/^f/i, /^[ev]/i] },
  H = { narrow: /^[1234]/i, abbreviated: /^q[1234]/i, wide: /^[1234](:a|:e)? kvartalet/i },
  z = { any: [/1/i, /2/i, /3/i, /4/i] },
  L = {
    narrow: /^[jfmasond]/i,
    abbreviated: /^(jan|feb|mar[s]?|apr|maj|jun[i]?|jul[i]?|aug|sep|okt|nov|dec)\.?/i,
    wide: /^(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)/i,
  },
  V = {
    narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
    any: [
      /^ja/i,
      /^f/i,
      /^mar/i,
      /^ap/i,
      /^maj/i,
      /^jun/i,
      /^jul/i,
      /^au/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
  },
  X = {
    narrow: /^[smtofl]/i,
    short: /^(sö|må|ti|on|to|fr|lö)/i,
    abbreviated: /^(sön|mån|tis|ons|tors|fre|lör)/i,
    wide: /^(söndag|måndag|tisdag|onsdag|torsdag|fredag|lördag)/i,
  },
  S = { any: [/^s/i, /^m/i, /^ti/i, /^o/i, /^to/i, /^f/i, /^l/i] },
  N = {
    any: /^([fe]\.?\s?m\.?|midn(att)?|midd(ag)?|(på) (morgonen|eftermiddagen|kvällen|natten))/i,
  },
  Q = {
    any: {
      am: /^f/i,
      pm: /^e/i,
      midnight: /^midn/i,
      noon: /^midd/i,
      morning: /morgon/i,
      afternoon: /eftermiddag/i,
      evening: /kväll/i,
      night: /natt/i,
    },
  },
  c = {
    ordinalNumber: d({ matchPattern: E, parsePattern: D, valueCallback: (e) => parseInt(e, 10) }),
    era: i({
      matchPatterns: K,
      defaultMatchWidth: 'wide',
      parsePatterns: F,
      defaultParseWidth: 'any',
    }),
    quarter: i({
      matchPatterns: H,
      defaultMatchWidth: 'wide',
      parsePatterns: z,
      defaultParseWidth: 'any',
      valueCallback: (e) => e + 1,
    }),
    month: i({
      matchPatterns: L,
      defaultMatchWidth: 'wide',
      parsePatterns: V,
      defaultParseWidth: 'any',
    }),
    day: i({
      matchPatterns: X,
      defaultMatchWidth: 'wide',
      parsePatterns: S,
      defaultParseWidth: 'any',
    }),
    dayPeriod: i({
      matchPatterns: N,
      defaultMatchWidth: 'any',
      parsePatterns: Q,
      defaultParseWidth: 'any',
    }),
  }
var T = {
    code: 'sv',
    formatDistance: s,
    formatLong: l,
    formatRelative: u,
    localize: f,
    match: c,
    options: { weekStartsOn: 1, firstWeekContainsDate: 4 },
  },
  ee = T
export { ee as default, T as sv }
