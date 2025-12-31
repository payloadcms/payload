import type { GenericTranslationsObject, NestedKeysStripped } from '@payloadcms/translations'

import { en } from './en.js'
import { es } from './es.js'

export const translations = {
  en,
  es,
}

export type EcommerceTranslations = GenericTranslationsObject

export type EcommerceTranslationKeys = NestedKeysStripped<EcommerceTranslations>
