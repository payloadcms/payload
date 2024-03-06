const { default: ar } = await import('./ar.json', { assert: { type: 'json' } })
const { default: az } = await import('./az.json', { assert: { type: 'json' } })
const { default: bg } = await import('./bg.json', { assert: { type: 'json' } })
const { default: cs } = await import('./cs.json', { assert: { type: 'json' } })
const { default: de } = await import('./de.json', { assert: { type: 'json' } })
const { default: en } = await import('./en.json', { assert: { type: 'json' } })
const { default: es } = await import('./es.json', { assert: { type: 'json' } })
const { default: fa } = await import('./fa.json', { assert: { type: 'json' } })
const { default: fr } = await import('./fr.json', { assert: { type: 'json' } })
const { default: hr } = await import('./hr.json', { assert: { type: 'json' } })
const { default: hu } = await import('./hu.json', { assert: { type: 'json' } })
const { default: it } = await import('./it.json', { assert: { type: 'json' } })
const { default: ja } = await import('./ja.json', { assert: { type: 'json' } })
const { default: ko } = await import('./ko.json', { assert: { type: 'json' } })
const { default: my } = await import('./my.json', { assert: { type: 'json' } })
const { default: nb } = await import('./nb.json', { assert: { type: 'json' } })
const { default: nl } = await import('./nl.json', { assert: { type: 'json' } })
const { default: pl } = await import('./pl.json', { assert: { type: 'json' } })
const { default: pt } = await import('./pt.json', { assert: { type: 'json' } })
const { default: ro } = await import('./ro.json', { assert: { type: 'json' } })
const { default: rs } = await import('./rs.json', { assert: { type: 'json' } })
const { default: rsLatin } = await import('./rs-latin.json', { assert: { type: 'json' } })
const { default: ru } = await import('./ru.json', { assert: { type: 'json' } })
const { default: sv } = await import('./sv.json', { assert: { type: 'json' } })
const { default: th } = await import('./th.json', { assert: { type: 'json' } })
const { default: tr } = await import('./tr.json', { assert: { type: 'json' } })
const { default: ua } = await import('./ua.json', { assert: { type: 'json' } })
const { default: vi } = await import('./vi.json', { assert: { type: 'json' } })
const { default: zh } = await import('./zh.json', { assert: { type: 'json' } })
const { default: zhTw } = await import('./zh-tw.json', { assert: { type: 'json' } })

export const translations = {
  ar,
  az,
  bg,
  cs,
  de,
  en,
  es,
  fa,
  fr,
  hr,
  hu,
  it,
  ja,
  ko,
  my,
  nb,
  nl,
  pl,
  pt,
  ro,
  rs,
  rsLatin,
  ru,
  sv,
  th,
  tr,
  ua,
  vi,
  zh,
  zhTw,
}
