import type {
  GenericTranslationsObject,
  NestedKeysStripped,
  SupportedLanguages,
} from '@payloadcms/translations'

import type { PluginDefaultTranslationsObject } from './types.js'

import { en } from './languages/en.js'

export const translations = {
  en,
} as SupportedLanguages<PluginDefaultTranslationsObject>

export type EcommerceTranslations = GenericTranslationsObject

export type EcommerceTranslationKeys = NestedKeysStripped<EcommerceTranslations>
