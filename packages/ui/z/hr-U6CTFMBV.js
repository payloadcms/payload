import { a as s, b as i, c as u, d as r } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var h = {
    lessThanXSeconds: {
      one: {
        standalone: 'manje od 1 sekunde',
        withPrepositionAgo: 'manje od 1 sekunde',
        withPrepositionIn: 'manje od 1 sekundu',
      },
      dual: 'manje od {{count}} sekunde',
      other: 'manje od {{count}} sekundi',
    },
    xSeconds: {
      one: {
        standalone: '1 sekunda',
        withPrepositionAgo: '1 sekunde',
        withPrepositionIn: '1 sekundu',
      },
      dual: '{{count}} sekunde',
      other: '{{count}} sekundi',
    },
    halfAMinute: 'pola minute',
    lessThanXMinutes: {
      one: {
        standalone: 'manje od 1 minute',
        withPrepositionAgo: 'manje od 1 minute',
        withPrepositionIn: 'manje od 1 minutu',
      },
      dual: 'manje od {{count}} minute',
      other: 'manje od {{count}} minuta',
    },
    xMinutes: {
      one: {
        standalone: '1 minuta',
        withPrepositionAgo: '1 minute',
        withPrepositionIn: '1 minutu',
      },
      dual: '{{count}} minute',
      other: '{{count}} minuta',
    },
    aboutXHours: {
      one: {
        standalone: 'oko 1 sat',
        withPrepositionAgo: 'oko 1 sat',
        withPrepositionIn: 'oko 1 sat',
      },
      dual: 'oko {{count}} sata',
      other: 'oko {{count}} sati',
    },
    xHours: {
      one: { standalone: '1 sat', withPrepositionAgo: '1 sat', withPrepositionIn: '1 sat' },
      dual: '{{count}} sata',
      other: '{{count}} sati',
    },
    xDays: {
      one: { standalone: '1 dan', withPrepositionAgo: '1 dan', withPrepositionIn: '1 dan' },
      dual: '{{count}} dana',
      other: '{{count}} dana',
    },
    aboutXWeeks: {
      one: {
        standalone: 'oko 1 tjedan',
        withPrepositionAgo: 'oko 1 tjedan',
        withPrepositionIn: 'oko 1 tjedan',
      },
      dual: 'oko {{count}} tjedna',
      other: 'oko {{count}} tjedana',
    },
    xWeeks: {
      one: {
        standalone: '1 tjedan',
        withPrepositionAgo: '1 tjedan',
        withPrepositionIn: '1 tjedan',
      },
      dual: '{{count}} tjedna',
      other: '{{count}} tjedana',
    },
    aboutXMonths: {
      one: {
        standalone: 'oko 1 mjesec',
        withPrepositionAgo: 'oko 1 mjesec',
        withPrepositionIn: 'oko 1 mjesec',
      },
      dual: 'oko {{count}} mjeseca',
      other: 'oko {{count}} mjeseci',
    },
    xMonths: {
      one: {
        standalone: '1 mjesec',
        withPrepositionAgo: '1 mjesec',
        withPrepositionIn: '1 mjesec',
      },
      dual: '{{count}} mjeseca',
      other: '{{count}} mjeseci',
    },
    aboutXYears: {
      one: {
        standalone: 'oko 1 godinu',
        withPrepositionAgo: 'oko 1 godinu',
        withPrepositionIn: 'oko 1 godinu',
      },
      dual: 'oko {{count}} godine',
      other: 'oko {{count}} godina',
    },
    xYears: {
      one: {
        standalone: '1 godina',
        withPrepositionAgo: '1 godine',
        withPrepositionIn: '1 godinu',
      },
      dual: '{{count}} godine',
      other: '{{count}} godina',
    },
    overXYears: {
      one: {
        standalone: 'preko 1 godinu',
        withPrepositionAgo: 'preko 1 godinu',
        withPrepositionIn: 'preko 1 godinu',
      },
      dual: 'preko {{count}} godine',
      other: 'preko {{count}} godina',
    },
    almostXYears: {
      one: {
        standalone: 'gotovo 1 godinu',
        withPrepositionAgo: 'gotovo 1 godinu',
        withPrepositionIn: 'gotovo 1 godinu',
      },
      dual: 'gotovo {{count}} godine',
      other: 'gotovo {{count}} godina',
    },
  },
  d = (o, n, a) => {
    let t,
      e = h[o]
    return (
      typeof e == 'string'
        ? (t = e)
        : n === 1
          ? a?.addSuffix
            ? a.comparison && a.comparison > 0
              ? (t = e.one.withPrepositionIn)
              : (t = e.one.withPrepositionAgo)
            : (t = e.one.standalone)
          : n % 10 > 1 && n % 10 < 5 && String(n).substr(-2, 1) !== '1'
            ? (t = e.dual.replace('{{count}}', String(n)))
            : (t = e.other.replace('{{count}}', String(n))),
      a?.addSuffix ? (a.comparison && a.comparison > 0 ? 'za ' + t : 'prije ' + t) : t
    )
  }
var j = { full: 'EEEE, d. MMMM y.', long: 'd. MMMM y.', medium: 'd. MMM y.', short: 'dd. MM. y.' },
  g = { full: 'HH:mm:ss (zzzz)', long: 'HH:mm:ss z', medium: 'HH:mm:ss', short: 'HH:mm' },
  v = {
    full: "{{date}} 'u' {{time}}",
    long: "{{date}} 'u' {{time}}",
    medium: '{{date}} {{time}}',
    short: '{{date}} {{time}}',
  },
  l = {
    date: s({ formats: j, defaultWidth: 'full' }),
    time: s({ formats: g, defaultWidth: 'full' }),
    dateTime: s({ formats: v, defaultWidth: 'full' }),
  }
var f = {
    lastWeek: (o) => {
      switch (o.getDay()) {
        case 0:
          return "'pro\u0161lu nedjelju u' p"
        case 3:
          return "'pro\u0161lu srijedu u' p"
        case 6:
          return "'pro\u0161lu subotu u' p"
        default:
          return "'pro\u0161li' EEEE 'u' p"
      }
    },
    yesterday: "'ju\u010Der u' p",
    today: "'danas u' p",
    tomorrow: "'sutra u' p",
    nextWeek: (o) => {
      switch (o.getDay()) {
        case 0:
          return "'idu\u0107u nedjelju u' p"
        case 3:
          return "'idu\u0107u srijedu u' p"
        case 6:
          return "'idu\u0107u subotu u' p"
        default:
          return "'pro\u0161li' EEEE 'u' p"
      }
    },
    other: 'P',
  },
  p = (o, n, a, t) => {
    let e = f[o]
    return typeof e == 'function' ? e(n) : e
  }
var P = {
    narrow: ['pr.n.e.', 'AD'],
    abbreviated: ['pr. Kr.', 'po. Kr.'],
    wide: ['Prije Krista', 'Poslije Krista'],
  },
  k = {
    narrow: ['1.', '2.', '3.', '4.'],
    abbreviated: ['1. kv.', '2. kv.', '3. kv.', '4. kv.'],
    wide: ['1. kvartal', '2. kvartal', '3. kvartal', '4. kvartal'],
  },
  w = {
    narrow: ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '11.', '12.'],
    abbreviated: [
      'sij',
      'velj',
      'o\u017Eu',
      'tra',
      'svi',
      'lip',
      'srp',
      'kol',
      'ruj',
      'lis',
      'stu',
      'pro',
    ],
    wide: [
      'sije\u010Danj',
      'velja\u010Da',
      'o\u017Eujak',
      'travanj',
      'svibanj',
      'lipanj',
      'srpanj',
      'kolovoz',
      'rujan',
      'listopad',
      'studeni',
      'prosinac',
    ],
  },
  b = {
    narrow: ['1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '11.', '12.'],
    abbreviated: [
      'sij',
      'velj',
      'o\u017Eu',
      'tra',
      'svi',
      'lip',
      'srp',
      'kol',
      'ruj',
      'lis',
      'stu',
      'pro',
    ],
    wide: [
      'sije\u010Dnja',
      'velja\u010De',
      'o\u017Eujka',
      'travnja',
      'svibnja',
      'lipnja',
      'srpnja',
      'kolovoza',
      'rujna',
      'listopada',
      'studenog',
      'prosinca',
    ],
  },
  M = {
    narrow: ['N', 'P', 'U', 'S', '\u010C', 'P', 'S'],
    short: ['ned', 'pon', 'uto', 'sri', '\u010Det', 'pet', 'sub'],
    abbreviated: ['ned', 'pon', 'uto', 'sri', '\u010Det', 'pet', 'sub'],
    wide: ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', '\u010Detvrtak', 'petak', 'subota'],
  },
  y = {
    narrow: {
      am: 'AM',
      pm: 'PM',
      midnight: 'pono\u0107',
      noon: 'podne',
      morning: 'ujutro',
      afternoon: 'popodne',
      evening: 'nave\u010Der',
      night: 'no\u0107u',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'pono\u0107',
      noon: 'podne',
      morning: 'ujutro',
      afternoon: 'popodne',
      evening: 'nave\u010Der',
      night: 'no\u0107u',
    },
    wide: {
      am: 'AM',
      pm: 'PM',
      midnight: 'pono\u0107',
      noon: 'podne',
      morning: 'ujutro',
      afternoon: 'poslije podne',
      evening: 'nave\u010Der',
      night: 'no\u0107u',
    },
  },
  A = {
    narrow: {
      am: 'AM',
      pm: 'PM',
      midnight: 'pono\u0107',
      noon: 'podne',
      morning: 'ujutro',
      afternoon: 'popodne',
      evening: 'nave\u010Der',
      night: 'no\u0107u',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'pono\u0107',
      noon: 'podne',
      morning: 'ujutro',
      afternoon: 'popodne',
      evening: 'nave\u010Der',
      night: 'no\u0107u',
    },
    wide: {
      am: 'AM',
      pm: 'PM',
      midnight: 'pono\u0107',
      noon: 'podne',
      morning: 'ujutro',
      afternoon: 'poslije podne',
      evening: 'nave\u010Der',
      night: 'no\u0107u',
    },
  },
  W = (o, n) => Number(o) + '.',
  m = {
    ordinalNumber: W,
    era: i({ values: P, defaultWidth: 'wide' }),
    quarter: i({ values: k, defaultWidth: 'wide', argumentCallback: (o) => o - 1 }),
    month: i({
      values: w,
      defaultWidth: 'wide',
      formattingValues: b,
      defaultFormattingWidth: 'wide',
    }),
    day: i({ values: M, defaultWidth: 'wide' }),
    dayPeriod: i({
      values: A,
      defaultWidth: 'wide',
      formattingValues: y,
      defaultFormattingWidth: 'wide',
    }),
  }
var z = /^(\d+)\./i,
  x = /\d+/i,
  I = {
    narrow: /^(pr\.n\.e\.|AD)/i,
    abbreviated: /^(pr\.\s?Kr\.|po\.\s?Kr\.)/i,
    wide: /^(Prije Krista|prije nove ere|Poslije Krista|nova era)/i,
  },
  D = { any: [/^pr/i, /^(po|nova)/i] },
  E = { narrow: /^[1234]/i, abbreviated: /^[1234]\.\s?kv\.?/i, wide: /^[1234]\. kvartal/i },
  F = { any: [/1/i, /2/i, /3/i, /4/i] },
  H = {
    narrow: /^(10|11|12|[123456789])\./i,
    abbreviated: /^(sij|velj|(ožu|ozu)|tra|svi|lip|srp|kol|ruj|lis|stu|pro)/i,
    wide: /^((siječanj|siječnja|sijecanj|sijecnja)|(veljača|veljače|veljaca|veljace)|(ožujak|ožujka|ozujak|ozujka)|(travanj|travnja)|(svibanj|svibnja)|(lipanj|lipnja)|(srpanj|srpnja)|(kolovoz|kolovoza)|(rujan|rujna)|(listopad|listopada)|(studeni|studenog)|(prosinac|prosinca))/i,
  },
  S = {
    narrow: [/1/i, /2/i, /3/i, /4/i, /5/i, /6/i, /7/i, /8/i, /9/i, /10/i, /11/i, /12/i],
    abbreviated: [
      /^sij/i,
      /^velj/i,
      /^(ožu|ozu)/i,
      /^tra/i,
      /^svi/i,
      /^lip/i,
      /^srp/i,
      /^kol/i,
      /^ruj/i,
      /^lis/i,
      /^stu/i,
      /^pro/i,
    ],
    wide: [
      /^sij/i,
      /^velj/i,
      /^(ožu|ozu)/i,
      /^tra/i,
      /^svi/i,
      /^lip/i,
      /^srp/i,
      /^kol/i,
      /^ruj/i,
      /^lis/i,
      /^stu/i,
      /^pro/i,
    ],
  },
  V = {
    narrow: /^[npusčc]/i,
    short: /^(ned|pon|uto|sri|(čet|cet)|pet|sub)/i,
    abbreviated: /^(ned|pon|uto|sri|(čet|cet)|pet|sub)/i,
    wide: /^(nedjelja|ponedjeljak|utorak|srijeda|(četvrtak|cetvrtak)|petak|subota)/i,
  },
  K = {
    narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
    any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i],
  },
  X = { any: /^(am|pm|ponoc|ponoć|(po)?podne|navecer|navečer|noću|poslije podne|ujutro)/i },
  L = {
    any: {
      am: /^a/i,
      pm: /^p/i,
      midnight: /^pono/i,
      noon: /^pod/i,
      morning: /jutro/i,
      afternoon: /(poslije\s|po)+podne/i,
      evening: /(navece|naveče)/i,
      night: /(nocu|noću)/i,
    },
  },
  c = {
    ordinalNumber: u({ matchPattern: z, parsePattern: x, valueCallback: (o) => parseInt(o, 10) }),
    era: r({
      matchPatterns: I,
      defaultMatchWidth: 'wide',
      parsePatterns: D,
      defaultParseWidth: 'any',
    }),
    quarter: r({
      matchPatterns: E,
      defaultMatchWidth: 'wide',
      parsePatterns: F,
      defaultParseWidth: 'any',
      valueCallback: (o) => o + 1,
    }),
    month: r({
      matchPatterns: H,
      defaultMatchWidth: 'wide',
      parsePatterns: S,
      defaultParseWidth: 'wide',
    }),
    day: r({
      matchPatterns: V,
      defaultMatchWidth: 'wide',
      parsePatterns: K,
      defaultParseWidth: 'any',
    }),
    dayPeriod: r({
      matchPatterns: X,
      defaultMatchWidth: 'any',
      parsePatterns: L,
      defaultParseWidth: 'any',
    }),
  }
var N = {
    code: 'hr',
    formatDistance: d,
    formatLong: l,
    formatRelative: p,
    localize: m,
    match: c,
    options: { weekStartsOn: 1, firstWeekContainsDate: 1 },
  },
  oo = N
export { oo as default, N as hr }
