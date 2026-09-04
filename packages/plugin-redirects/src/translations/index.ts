import type { GenericTranslationsObject, NestedKeysStripped } from '@payloadcms/translations'

import { en } from './languages/en.js'
import { es } from './languages/es.js'
import { fi } from './languages/fi.js'
import { fr } from './languages/fr.js'
import { ja } from './languages/ja.js'
import { pt } from './languages/pt.js'
import { sv } from './languages/sv.js'

export const translations = {
  en,
  es,
  fi,
  fr,
  ja,
  pt,
  sv,
}

export type RedirectsTranslations = GenericTranslationsObject

export type RedirectsTranslationKeys = NestedKeysStripped<RedirectsTranslations>
