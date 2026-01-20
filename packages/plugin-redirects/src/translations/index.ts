import type { GenericTranslationsObject, NestedKeysStripped } from '@payloadcms/translations'

import { en } from './languages/en.js'
import { es } from './languages/es.js'
import { fr } from './languages/fr.js'
import { ja } from './languages/ja.js'
import { sv } from './languages/sv.js'
import { pt } from './languages/pt.js'

export const translations = {
  en,
  es,
  fr,
  ja,
  sv,
  pt
}

export type RedirectsTranslations = GenericTranslationsObject

export type RedirectsTranslationKeys = NestedKeysStripped<RedirectsTranslations>
