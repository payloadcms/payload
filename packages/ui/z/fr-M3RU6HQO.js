import { a as s, b as r, c as d, d as o } from './chunk-RD4BVJYH.js'
import './chunk-DGJUBN33.js'
var v = {
    lessThanXSeconds: { one: 'moins d\u2019une seconde', other: 'moins de {{count}} secondes' },
    xSeconds: { one: '1 seconde', other: '{{count}} secondes' },
    halfAMinute: '30 secondes',
    lessThanXMinutes: { one: 'moins d\u2019une minute', other: 'moins de {{count}} minutes' },
    xMinutes: { one: '1 minute', other: '{{count}} minutes' },
    aboutXHours: { one: 'environ 1 heure', other: 'environ {{count}} heures' },
    xHours: { one: '1 heure', other: '{{count}} heures' },
    xDays: { one: '1 jour', other: '{{count}} jours' },
    aboutXWeeks: { one: 'environ 1 semaine', other: 'environ {{count}} semaines' },
    xWeeks: { one: '1 semaine', other: '{{count}} semaines' },
    aboutXMonths: { one: 'environ 1 mois', other: 'environ {{count}} mois' },
    xMonths: { one: '1 mois', other: '{{count}} mois' },
    aboutXYears: { one: 'environ 1 an', other: 'environ {{count}} ans' },
    xYears: { one: '1 an', other: '{{count}} ans' },
    overXYears: { one: 'plus d\u2019un an', other: 'plus de {{count}} ans' },
    almostXYears: { one: 'presqu\u2019un an', other: 'presque {{count}} ans' },
  },
  u = (t, a, i) => {
    let e,
      n = v[t]
    return (
      typeof n == 'string'
        ? (e = n)
        : a === 1
          ? (e = n.one)
          : (e = n.other.replace('{{count}}', String(a))),
      i?.addSuffix ? (i.comparison && i.comparison > 0 ? 'dans ' + e : 'il y a ' + e) : e
    )
  }
var p = { full: 'EEEE d MMMM y', long: 'd MMMM y', medium: 'd MMM y', short: 'dd/MM/y' },
  M = { full: 'HH:mm:ss zzzz', long: 'HH:mm:ss z', medium: 'HH:mm:ss', short: 'HH:mm' },
  b = {
    full: "{{date}} '\xE0' {{time}}",
    long: "{{date}} '\xE0' {{time}}",
    medium: '{{date}}, {{time}}',
    short: '{{date}}, {{time}}',
  },
  l = {
    date: s({ formats: p, defaultWidth: 'full' }),
    time: s({ formats: M, defaultWidth: 'full' }),
    dateTime: s({ formats: b, defaultWidth: 'full' }),
  }
var P = {
    lastWeek: "eeee 'dernier \xE0' p",
    yesterday: "'hier \xE0' p",
    today: "'aujourd\u2019hui \xE0' p",
    tomorrow: "'demain \xE0' p'",
    nextWeek: "eeee 'prochain \xE0' p",
    other: 'P',
  },
  c = (t, a, i, e) => P[t]
var w = {
    narrow: ['av. J.-C', 'ap. J.-C'],
    abbreviated: ['av. J.-C', 'ap. J.-C'],
    wide: ['avant J\xE9sus-Christ', 'apr\xE8s J\xE9sus-Christ'],
  },
  y = {
    narrow: ['T1', 'T2', 'T3', 'T4'],
    abbreviated: ['1er trim.', '2\xE8me trim.', '3\xE8me trim.', '4\xE8me trim.'],
    wide: ['1er trimestre', '2\xE8me trimestre', '3\xE8me trimestre', '4\xE8me trimestre'],
  },
  j = {
    narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    abbreviated: [
      'janv.',
      'f\xE9vr.',
      'mars',
      'avr.',
      'mai',
      'juin',
      'juil.',
      'ao\xFBt',
      'sept.',
      'oct.',
      'nov.',
      'd\xE9c.',
    ],
    wide: [
      'janvier',
      'f\xE9vrier',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'ao\xFBt',
      'septembre',
      'octobre',
      'novembre',
      'd\xE9cembre',
    ],
  },
  g = {
    narrow: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
    short: ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'],
    abbreviated: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
    wide: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  },
  W = {
    narrow: {
      am: 'AM',
      pm: 'PM',
      midnight: 'minuit',
      noon: 'midi',
      morning: 'mat.',
      afternoon: 'ap.m.',
      evening: 'soir',
      night: 'mat.',
    },
    abbreviated: {
      am: 'AM',
      pm: 'PM',
      midnight: 'minuit',
      noon: 'midi',
      morning: 'matin',
      afternoon: 'apr\xE8s-midi',
      evening: 'soir',
      night: 'matin',
    },
    wide: {
      am: 'AM',
      pm: 'PM',
      midnight: 'minuit',
      noon: 'midi',
      morning: 'du matin',
      afternoon: 'de l\u2019apr\xE8s-midi',
      evening: 'du soir',
      night: 'du matin',
    },
  },
  C = (t, a) => {
    let i = Number(t),
      e = a?.unit
    if (i === 0) return '0'
    let n = ['year', 'week', 'hour', 'minute', 'second'],
      m
    return i === 1 ? (m = e && n.includes(e) ? '\xE8re' : 'er') : (m = '\xE8me'), i + m
  },
  J = ['MMM', 'MMMM'],
  h = {
    preprocessor: (t, a) =>
      t.getDate() === 1 || !a.some((e) => e.isToken && J.includes(e.value))
        ? a
        : a.map((e) => (e.isToken && e.value === 'do' ? { isToken: !0, value: 'd' } : e)),
    ordinalNumber: C,
    era: r({ values: w, defaultWidth: 'wide' }),
    quarter: r({ values: y, defaultWidth: 'wide', argumentCallback: (t) => t - 1 }),
    month: r({ values: j, defaultWidth: 'wide' }),
    day: r({ values: g, defaultWidth: 'wide' }),
    dayPeriod: r({ values: W, defaultWidth: 'wide' }),
  }
var x = /^(\d+)(ième|ère|ème|er|e)?/i,
  T = /\d+/i,
  k = {
    narrow: /^(av\.J\.C|ap\.J\.C|ap\.J\.-C)/i,
    abbreviated: /^(av\.J\.-C|av\.J-C|apr\.J\.-C|apr\.J-C|ap\.J-C)/i,
    wide: /^(avant Jésus-Christ|après Jésus-Christ)/i,
  },
  D = { any: [/^av/i, /^ap/i] },
  H = {
    narrow: /^T?[1234]/i,
    abbreviated: /^[1234](er|ème|e)? trim\.?/i,
    wide: /^[1234](er|ème|e)? trimestre/i,
  },
  L = { any: [/1/i, /2/i, /3/i, /4/i] },
  z = {
    narrow: /^[jfmasond]/i,
    abbreviated: /^(janv|févr|mars|avr|mai|juin|juill|juil|août|sept|oct|nov|déc)\.?/i,
    wide: /^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i,
  },
  F = {
    narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
    any: [
      /^ja/i,
      /^f/i,
      /^mar/i,
      /^av/i,
      /^ma/i,
      /^juin/i,
      /^juil/i,
      /^ao/i,
      /^s/i,
      /^o/i,
      /^n/i,
      /^d/i,
    ],
  },
  N = {
    narrow: /^[lmjvsd]/i,
    short: /^(di|lu|ma|me|je|ve|sa)/i,
    abbreviated: /^(dim|lun|mar|mer|jeu|ven|sam)\.?/i,
    wide: /^(dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi)/i,
  },
  S = {
    narrow: [/^d/i, /^l/i, /^m/i, /^m/i, /^j/i, /^v/i, /^s/i],
    any: [/^di/i, /^lu/i, /^ma/i, /^me/i, /^je/i, /^ve/i, /^sa/i],
  },
  X = {
    narrow: /^(a|p|minuit|midi|mat\.?|ap\.?m\.?|soir|nuit)/i,
    any: /^([ap]\.?\s?m\.?|du matin|de l'après[-\s]midi|du soir|de la nuit)/i,
  },
  E = {
    any: {
      am: /^a/i,
      pm: /^p/i,
      midnight: /^min/i,
      noon: /^mid/i,
      morning: /mat/i,
      afternoon: /ap/i,
      evening: /soir/i,
      night: /nuit/i,
    },
  },
  f = {
    ordinalNumber: d({ matchPattern: x, parsePattern: T, valueCallback: (t) => parseInt(t) }),
    era: o({
      matchPatterns: k,
      defaultMatchWidth: 'wide',
      parsePatterns: D,
      defaultParseWidth: 'any',
    }),
    quarter: o({
      matchPatterns: H,
      defaultMatchWidth: 'wide',
      parsePatterns: L,
      defaultParseWidth: 'any',
      valueCallback: (t) => t + 1,
    }),
    month: o({
      matchPatterns: z,
      defaultMatchWidth: 'wide',
      parsePatterns: F,
      defaultParseWidth: 'any',
    }),
    day: o({
      matchPatterns: N,
      defaultMatchWidth: 'wide',
      parsePatterns: S,
      defaultParseWidth: 'any',
    }),
    dayPeriod: o({
      matchPatterns: X,
      defaultMatchWidth: 'any',
      parsePatterns: E,
      defaultParseWidth: 'any',
    }),
  }
var O = {
    code: 'fr',
    formatDistance: u,
    formatLong: l,
    formatRelative: c,
    localize: h,
    match: f,
    options: { weekStartsOn: 1, firstWeekContainsDate: 4 },
  },
  ee = O
export { ee as default, O as fr }
