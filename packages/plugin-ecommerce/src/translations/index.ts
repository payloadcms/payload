import type { GenericTranslationsObject, NestedKeysStripped } from '@payloadcms/translations'

import { en } from './en.js'

export const translations = {
  en,
}

export type EcommerceTranslations = GenericTranslationsObject

export type EcommerceTranslationKeys = NestedKeysStripped<EcommerceTranslations>
