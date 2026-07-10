import type { Language } from '@payloadcms/translations'

import type { enTranslations } from './languages/en.js'

export type PluginDefaultTranslationsObject = typeof enTranslations

export type PluginLanguage = Language<PluginDefaultTranslationsObject>
