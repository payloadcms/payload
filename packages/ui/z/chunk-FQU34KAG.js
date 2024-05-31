import { a as s, b as a, c as m, d as o } from './chunk-RD4BVJYH.js'
var f = {
    lessThanXSeconds: { one: 'less than a second', other: 'less than {{count}} seconds' },
    xSeconds: { one: '1 second', other: '{{count}} seconds' },
    halfAMinute: 'half a minute',
    lessThanXMinutes: { one: 'less than a minute', other: 'less than {{count}} minutes' },
    xMinutes: { one: '1 minute', other: '{{count}} minutes' },
    aboutXHours: { one: 'about 1 hour', other: 'about {{count}} hours' },
    xHours: { one: '1 hour', other: '{{count}} hours' },
    xDays: { one: '1 day', other: '{{count}} days' },
    aboutXWeeks: { one: 'about 1 week', other: 'about {{count}} weeks' },
    xWeeks: { one: '1 week', other: '{{count}} weeks' },
    aboutXMonths: { one: 'about 1 month', other: 'about {{count}} months' },
    xMonths: { one: '1 month', other: '{{count}} months' },
    aboutXYears: { one: 'about 1 year', other: 'about {{count}} years' },
    xYears: { one: '1 year', other: '{{count}} years' },
    overXYears: { one: 'over 1 year', other: 'over {{count}} years' },
    almostXYears: { one: 'almost 1 year', other: 'almost {{count}} years' },
  },
  d = (t, r, n) => {
    let e,
      i = f[t]
    return (
      typeof i == 'string'
        ? (e = i)
        : r === 1
          ? (e = i.one)
          : (e = i.other.replace('{{count}}', r.toString())),
      n?.addSuffix ? (n.comparison && n.comparison > 0 ? 'in ' + e : e + ' ago') : e
    )
  }
var g = { full: 'EEEE, MMMM do, y', long: 'MMMM do, y', medium: 'MMM d, y', short: 'MM/dd/yyyy' },
  y = { full: 'h:mm:ss a zzzz', long: 'h:mm:ss a z', medium: 'h:mm:ss a', short: 'h:mm a' },
  b = {
    full: "{{date}} 'at' {{time}}",
    long: "{{date}} 'at' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
  u = {
    date: s({ formats: g, defaultWidth: 'full' }),
    time: s({ formats: y, defaultWidth: 'full' }),
    dateTime: s({ formats: b, defaultWidth: 'full' }),
  }
var p = {
    lastWeek: "'last' eeee 'at' p",
    yesterday: "'yesterday at' p",
    today: "'today at' p",
    tomorrow: "'tomorrow at' p",
    nextWeek: "eeee 'at' p",
    other: 'P',
  },
  h = (t, r, n, e) => p[t]
var w = { narrow: ['B', 'A'], abbreviated: ['BC', 'AD'], wide: ['Before Christ', 'Anno Domini'] },
  v = {
    narrow: ['1', '2', '3', '4'],
    abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
    wide: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter'],
  },
  M = {
    narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    abbreviated: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
    wide: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
  },
  P = {
    narrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    short: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    abbreviated: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    wide: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  W = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mi',
      noon: 'n',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night',
    },
  },
  S = {
    narrow: {
      am: 'a',
      pm: 'p',
      midnight: 'mi',
      noon: 'n',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
    wide: {
      am: 'a.m.',
      pm: 'p.m.',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'in the morning',
      afternoon: 'in the afternoon',
      evening: 'in the evening',
      night: 'at night',
    },
  },
  D = (t, r) => {
    let n = Number(t),
      e = n % 100
    if (e > 20 || e < 10)
      switch (e % 10) {
        case 1:
          return n + 'st'
        case 2:
          return n + 'nd'
        case 3:
          return n + 'rd'
      }
    return n + 'th'
  },
  c = {
    ordinalNumber: D,
    era: a({ values: w, defaultWidth: 'wide' }),
    quarter: a({ values: v, defaultWidth: 'wide', argumentCallback: (t) => t - 1 }),
    month: a({ values: M, defaultWidth: 'wide' }),
    day: a({ values: P, defaultWidth: 'wide' }),
    dayPeriod: a({
      values: W,
      defaultWidth: 'wide',
      formattingValues: S,
      defaultFormattingWidth: 'wide',
    }),
  }
var x = /^(\d+)(th|st|nd|rd)?/i,
  F = /\d+/i,
  k = {
    narrow: /^(b|a)/i,
    abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
    wide: /^(before christ|before common era|anno domini|common era)/i,
  },
  j = { any: [/^b/i, /^(a|c)/i] },
  A = { narrow: /^[1234]/i, abbreviated: /^q[1234]/i, wide: /^[1234](th|st|nd|rd)? quarter/i },
  T = { any: [/1/i, /2/i, /3/i, /4/i] },
  q = {
    narrow: /^[jfmasond]/i,
    abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
  },
  z = {
    narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
    any: [
      /^ja/i,
      /^f/i,
      /^mar/i,
      /^ap/i,
      /^may/i,
      /^jun/i,
      /^jul/i,
      /^au/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
  },
  J = {
    narrow: /^[smtwf]/i,
    short: /^(su|mo|tu|we|th|fr|sa)/i,
    abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
    wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i,
  },
  N = {
    narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
    any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i],
  },
  V = {
    narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
    any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i,
  },
  X = {
    any: {
      am: /^a/i,
      pm: /^p/i,
      midnight: /^mi/i,
      noon: /^no/i,
      morning: /morning/i,
      afternoon: /afternoon/i,
      evening: /evening/i,
      night: /night/i,
    },
  },
  l = {
    ordinalNumber: m({ matchPattern: x, parsePattern: F, valueCallback: (t) => parseInt(t, 10) }),
    era: o({
      matchPatterns: k,
      defaultMatchWidth: 'wide',
      parsePatterns: j,
      defaultParseWidth: 'any',
    }),
    quarter: o({
      matchPatterns: A,
      defaultMatchWidth: 'wide',
      parsePatterns: T,
      defaultParseWidth: 'any',
      valueCallback: (t) => t + 1,
    }),
    month: o({
      matchPatterns: q,
      defaultMatchWidth: 'wide',
      parsePatterns: z,
      defaultParseWidth: 'any',
    }),
    day: o({
      matchPatterns: J,
      defaultMatchWidth: 'wide',
      parsePatterns: N,
      defaultParseWidth: 'any',
    }),
    dayPeriod: o({
      matchPatterns: V,
      defaultMatchWidth: 'any',
      parsePatterns: X,
      defaultParseWidth: 'any',
    }),
  }
var L = {
    code: 'en-US',
    formatDistance: d,
    formatLong: u,
    formatRelative: h,
    localize: c,
    match: l,
    options: { weekStartsOn: 0, firstWeekContainsDate: 1 },
  },
  $ = L
export { L as a, $ as b }
