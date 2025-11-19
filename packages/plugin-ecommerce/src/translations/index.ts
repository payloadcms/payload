import type { GenericTranslationsObject, NestedKeysStripped } from '@payloadcms/translations'

import { de } from './de.js'
import { en } from './en.js'

export const translations = {
  de,
  en,
}

export type EcommerceTranslations = GenericTranslationsObject

export type EcommerceTranslationKeys = NestedKeysStripped<EcommerceTranslations>
