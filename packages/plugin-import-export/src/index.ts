import type { Config } from 'payload'

import { deepMergeSimple } from 'payload'

import type { ImportExportPluginConfig } from './types.js'

import { getExportCollection } from './getExportCollection.js'
import { translations } from './translations/index.js'

export const importExportPlugin =
  (pluginConfig: ImportExportPluginConfig) =>
  (config: Config): Config => {
    config.collections.push(getExportCollection({ pluginConfig }))

    config.i18n = deepMergeSimple(translations, config.i18n?.translations ?? {})

    return config
  }
