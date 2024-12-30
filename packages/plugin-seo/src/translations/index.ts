import type { GenericTranslationsObject, NestedKeysStripped } from '@payloadcms/translations'

import { cs } from './cs.js'
import { de } from './de.js'
import { en } from './en.js'
import { es } from './es.js'
import { fa } from './fa.js'
import { fr } from './fr.js'
import { it } from './it.js'
import { nb } from './nb.js'
import { pl } from './pl.js'
import { ru } from './ru.js'
import { sv } from './sv.js'
import { tr } from './tr.js'
import { uk } from './uk.js'

export const translations = {
  cs,
  de,
  en,
  es,
  fa,
  fr,
  it,
  nb,
  pl,
  ru,
  sv,
  tr,
  uk,
}

export type PluginSEOTranslations = GenericTranslationsObject

export type PluginSEOTranslationKeys = NestedKeysStripped<PluginSEOTranslations>
