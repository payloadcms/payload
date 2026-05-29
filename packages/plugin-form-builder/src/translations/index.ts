import type { GenericTranslationsObject, NestedKeysStripped } from '@payloadcms/translations'

import { en } from './en.js'
import { fr } from './fr.js'

export const translations = {
  en,
  fr,
}

export type PluginFormBuilderTranslations = GenericTranslationsObject

export type PluginFormBuilderTranslationKeys = NestedKeysStripped<PluginFormBuilderTranslations>
