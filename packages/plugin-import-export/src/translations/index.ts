import type { GenericTranslationsObject, NestedKeysStripped } from '@payloadcms/translations'

import { en } from './en.js'

export const translations = {
  en,
}

export type PluginImportExportTranslations = GenericTranslationsObject

export type PluginImportExportTranslationKeys = NestedKeysStripped<PluginImportExportTranslations>
