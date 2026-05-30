import type { GenericTranslationsObject, NestedKeysStripped } from '@payloadcms/translations'

import { de } from './languages/de.js'
import { en } from './languages/en.js'
import { it } from './languages/it.js'

export const translations = {
  de,
  en,
  it,
}

export type PluginSearchTranslations = GenericTranslationsObject

export type PluginSearchTranslationKeys = NestedKeysStripped<PluginSearchTranslations>
