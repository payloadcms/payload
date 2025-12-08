import type { GenericTranslationsObject, NestedKeysStripped } from '@payloadcms/translations'

import { en } from './languages/en.js'
import { es } from './languages/es.js'
import { fr } from './languages/fr.js'

export const translations = {
  en,
  es,
  fr,
}

export type RedirectsTranslations = GenericTranslationsObject

export type RedirectsTranslationKeys = NestedKeysStripped<RedirectsTranslations>
