import type { GenericTranslationsObject, NestedKeysStripped } from '@payloadcms/translations'

import { ar } from './ar.js'
import { az } from './az.js'
import { bg } from './bg.js'
import { ca } from './ca.js'
import { cs } from './cs.js'
import { da } from './da.js'
import { de } from './de.js'
import { en } from './en.js'
import { es } from './es.js'
import { et } from './et.js'
import { fa } from './fa.js'
import { fr } from './fr.js'
import { he } from './he.js'
import { hr } from './hr.js'
import { hu } from './hu.js'
import { it } from './it.js'
import { ja } from './ja.js'
import { ko } from './ko.js'
import { lt } from './lt.js'
import { my } from './my.js'
import { nb } from './nb.js'
import { nl } from './nl.js'
import { pl } from './pl.js'
import { pt } from './pt.js'
import { ro } from './ro.js'
import { rs } from './rs.js'
import { rsLatin } from './rsLatin.js'
import { ru } from './ru.js'
import { sk } from './sk.js'
import { sl } from './sl.js'
import { sv } from './sv.js'
import { th } from './th.js'
import { tr } from './tr.js'
import { uk } from './uk.js'
import { vi } from './vi.js'
import { zh } from './zh.js'
import { zhTw } from './zhTw.js'

export const translations = {
  ar,
  az,
  bg,
  ca,
  cs,
  da,
  de,
  en,
  es,
  et,
  fa,
  fr,
  he,
  hr,
  hu,
  it,
  ja,
  ko,
  lt,
  my,
  nb,
  nl,
  pl,
  pt,
  ro,
  rs,
  'rs-latin': rsLatin,
  ru,
  sk,
  sl,
  sv,
  th,
  tr,
  uk,
  vi,
  zh,
  'zh-TW': zhTw,
}

export type PluginSEOTranslations = GenericTranslationsObject

export type PluginSEOTranslationKeys = NestedKeysStripped<PluginSEOTranslations>
