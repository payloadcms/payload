import type { Config, JobsConfig } from 'payload'

import { deepMergeSimple } from 'payload'

import type { ImportExportPluginConfig } from './types.js'

import { createCollectionExportTask } from './export/createExportCollectionTask.js'
import { getExportCollection } from './getExportCollection.js'
import { translations } from './translations/index.js'

export const importExportPlugin =
  (pluginConfig: ImportExportPluginConfig) =>
  (config: Config): Config => {
    const exportCollection = getExportCollection({ pluginConfig })
    if (config.collections) {
      config.collections.push(exportCollection)
    } else {
      config.collections = [exportCollection]
    }

    // inject the createExport job into the config
    config.jobs =
      config.jobs ||
      ({
        tasks: [createCollectionExportTask],
      } as unknown as JobsConfig) // cannot type jobs config inside of plugins

    // Ensure that `config.admin` and `config.admin.components` are initialized
    config.admin = config.admin || {}
    config.admin.components = config.admin.components || {}
    // Now we can safely push to `actions`
    config.admin.components.actions = config.admin.components.actions || []
    config.admin.components.actions.push({
      path: '@payloadcms/plugin-import-export/rsc#ExportButton',
    })

    config.i18n = deepMergeSimple(translations, config.i18n?.translations ?? {})

    return config
  }
