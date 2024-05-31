import { a as d, b as t, c as s, d as n } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var g = {
    lessThanXSeconds: { one: 'minder dan een seconde', other: 'minder dan {{count}} seconden' },
    xSeconds: { one: '1 seconde', other: '{{count}} seconden' },
    halfAMinute: 'een halve minuut',
    lessThanXMinutes: { one: 'minder dan een minuut', other: 'minder dan {{count}} minuten' },
    xMinutes: { one: 'een minuut', other: '{{count}} minuten' },
    aboutXHours: { one: 'ongeveer 1 uur', other: 'ongeveer {{count}} uur' },
    xHours: { one: '1 uur', other: '{{count}} uur' },
    xDays: { one: '1 dag', other: '{{count}} dagen' },
    aboutXWeeks: { one: 'ongeveer 1 week', other: 'ongeveer {{count}} weken' },
    xWeeks: { one: '1 week', other: '{{count}} weken' },
    aboutXMonths: { one: 'ongeveer 1 maand', other: 'ongeveer {{count}} maanden' },
    xMonths: { one: '1 maand', other: '{{count}} maanden' },
    aboutXYears: { one: 'ongeveer 1 jaar', other: 'ongeveer {{count}} jaar' },
    xYears: { one: '1 jaar', other: '{{count}} jaar' },
    overXYears: { one: 'meer dan 1 jaar', other: 'meer dan {{count}} jaar' },
    almostXYears: { one: 'bijna 1 jaar', other: 'bijna {{count}} jaar' },
  },
  m = (e, o, r) => {
    let a,
      i = g[e]
    return (
      typeof i == 'string'
        ? (a = i)
        : o === 1
          ? (a = i.one)
          : (a = i.other.replace('{{count}}', String(o))),
      r?.addSuffix ? (r.comparison && r.comparison > 0 ? 'over ' + a : a + ' geleden') : a
    )
  }
var f = { full: 'EEEE d MMMM y', long: 'd MMMM y', medium: 'd MMM y', short: 'dd-MM-y' },
  v = { full: 'HH:mm:ss zzzz', long: 'HH:mm:ss z', medium: 'HH:mm:ss', short: 'HH:mm' },
  p = {
    full: "{{date}} 'om' {{time}}",
    long: "{{date}} 'om' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
  u = {
    date: d({ formats: f, defaultWidth: 'full' }),
    time: d({ formats: v, defaultWidth: 'full' }),
    dateTime: d({ formats: p, defaultWidth: 'full' }),
  }
var b = {
    lastWeek: "'afgelopen' eeee 'om' p",
    yesterday: "'gisteren om' p",
    today: "'vandaag om' p",
    tomorrow: "'morgen om' p",
    nextWeek: "eeee 'om' p",
    other: 'P',
  },
  c = (e, o, r, a) => b[e]
var w = {
    narrow: ['v.C.', 'n.C.'],
    abbreviated: ['v.Chr.', 'n.Chr.'],
    wide: ['voor Christus', 'na Christus'],
  },
  P = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['K1', 'K2', 'K3', 'K4'],
    wide: ['1e kwartaal', '2e kwartaal', '3e kwartaal', '4e kwartaal'],
  },
  M = {
    narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    abbreviated: [
      'jan.',
      'feb.',
      'mrt.',
      'apr.',
      'mei',
      'jun.',
      'jul.',
      'aug.',
      'sep.',
      'okt.',
      'nov.',
      'dec.',
    ],
    wide: [
      'januari',
      'februari',
      'maart',
      'april',
      'mei',
      'juni',
      'juli',
      'augustus',
      'september',
      'oktober',
      'november',
      'december',
    ],
  },
  j = {
    narrow: ['Z', 'M', 'D', 'W', 'D', 'V', 'Z'],
    short: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
    abbreviated: ['zon', 'maa', 'din', 'woe', 'don', 'vri', 'zat'],
    wide: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
  },
  y = {
    narrow: {
      am: 'AM',
      pm: 'PM',
      midnight: 'middernacht',
      noon: 'het middaguur',
      morning: "'s ochtends",
      afternoon: "'s middags",
      evening: "'s avonds",
      night: "'s nachts",
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'middernacht',
      noon: 'het middaguur',
      morning: "'s ochtends",
      afternoon: "'s middags",
      evening: "'s avonds",
      night: "'s nachts",
    },
    wide: {
      am: 'AM',
      pm: 'PM',
      midnight: 'middernacht',
      noon: 'het middaguur',
      morning: "'s ochtends",
      afternoon: "'s middags",
      evening: "'s avonds",
      night: "'s nachts",
    },
  },
  z = (e, o) => Number(e) + 'e',
  h = {
    ordinalNumber: z,
    era: t({ values: w, defaultWidth: 'wide' }),
    quarter: t({ values: P, defaultWidth: 'wide', argumentCallback: (e) => e - 1 }),
    month: t({ values: M, defaultWidth: 'wide' }),
    day: t({ values: j, defaultWidth: 'wide' }),
    dayPeriod: t({ values: y, defaultWidth: 'wide' }),
  }
var k = /^(\d+)e?/i,
  W = /\d+/i,
  x = {
    narrow: /^([vn]\.? ?C\.?)/,
    abbreviated: /^([vn]\. ?Chr\.?)/,
    wide: /^((voor|na) Christus)/,
  },
  D = { any: [/^v/, /^n/] },
  C = { narrow: /^[1234]/i, abbreviated: /^K[1234]/i, wide: /^[1234]e kwartaal/i },
  H = { any: [/1/i, /2/i, /3/i, /4/i] },
  F = {
    narrow: /^[jfmasond]/i,
    abbreviated: /^(jan.|feb.|mrt.|apr.|mei|jun.|jul.|aug.|sep.|okt.|nov.|dec.)/i,
    wide: /^(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)/i,
  },
  X = {
    narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
    any: [
      /^jan/i,
      /^feb/i,
      /^m(r|a)/i,
      /^apr/i,
      /^mei/i,
      /^jun/i,
      /^jul/i,
      /^aug/i,
      /^sep/i,
      /^okt/i,
      /^nov/i,
      /^dec/i,
    ],
  },
  L = {
    narrow: /^[zmdwv]/i,
    short: /^(zo|ma|di|wo|do|vr|za)/i,
    abbreviated: /^(zon|maa|din|woe|don|vri|zat)/i,
    wide: /^(zondag|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag)/i,
  },
  V = {
    narrow: [/^z/i, /^m/i, /^d/i, /^w/i, /^d/i, /^v/i, /^z/i],
    any: [/^zo/i, /^ma/i, /^di/i, /^wo/i, /^do/i, /^vr/i, /^za/i],
  },
  A = { any: /^(am|pm|middernacht|het middaguur|'s (ochtends|middags|avonds|nachts))/i },
  E = {
    any: {
      am: /^am/i,
      pm: /^pm/i,
      midnight: /^middernacht/i,
      noon: /^het middaguur/i,
      morning: /ochtend/i,
      afternoon: /middag/i,
      evening: /avond/i,
      night: /nacht/i,
    },
  },
  l = {
    ordinalNumber: s({ matchPattern: k, parsePattern: W, valueCallback: (e) => parseInt(e, 10) }),
    era: n({
      matchPatterns: x,
      defaultMatchWidth: 'wide',
      parsePatterns: D,
      defaultParseWidth: 'any',
    }),
    quarter: n({
      matchPatterns: C,
      defaultMatchWidth: 'wide',
      parsePatterns: H,
      defaultParseWidth: 'any',
      valueCallback: (e) => e + 1,
    }),
    month: n({
      matchPatterns: F,
      defaultMatchWidth: 'wide',
      parsePatterns: X,
      defaultParseWidth: 'any',
    }),
    day: n({
      matchPatterns: L,
      defaultMatchWidth: 'wide',
      parsePatterns: V,
      defaultParseWidth: 'any',
    }),
    dayPeriod: n({
      matchPatterns: A,
      defaultMatchWidth: 'any',
      parsePatterns: E,
      defaultParseWidth: 'any',
    }),
  }
var N = {
    code: 'nl',
    formatDistance: m,
    formatLong: u,
    formatRelative: c,
    localize: h,
    match: l,
    options: { weekStartsOn: 1, firstWeekContainsDate: 4 },
  },
  U = N
export { U as default, N as nl }
