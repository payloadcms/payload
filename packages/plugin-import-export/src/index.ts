import type { Config } from 'payload'

import { deepMergeSimple } from 'payload'

import type { PluginDefaultTranslationsObject } from './translations/types.js'
import type { ImportExportPluginConfig, ToCSVFunction } from './types.js'

import { getCreateCollectionExportTask } from './export/getCreateExportCollectionTask.js'
import { getExportCollection } from './getExportCollection.js'
import { translations } from './translations/index.js'

export const importExportPlugin =
  (pluginConfig: ImportExportPluginConfig) =>
  (config: Config): Config => {
    const exportCollection = getExportCollection({ config, pluginConfig })
    if (config.collections) {
      config.collections.push(exportCollection)
    } else {
      config.collections = [exportCollection]
    }

    // inject custom import export provider
    config.admin = config.admin || {}
    config.admin.components = config.admin.components || {}
    config.admin.components.providers = config.admin.components.providers || []
    config.admin.components.providers.push(
      '@payloadcms/plugin-import-export/rsc#ImportExportProvider',
    )

    // inject the createExport job into the config
    ;((config.jobs ??= {}).tasks ??= []).push(getCreateCollectionExportTask(config))

    let collectionsToUpdate = config.collections

    const usePluginCollections = pluginConfig.collections && pluginConfig.collections?.length > 0

    if (usePluginCollections) {
      collectionsToUpdate = config.collections?.filter((collection) => {
        return pluginConfig.collections?.includes(collection.slug)
      })
    }

    collectionsToUpdate.forEach((collection) => {
      if (!collection.admin) {
        collection.admin = { components: { listMenuItems: [] } }
      }
      const components = collection.admin.components || {}
      if (!components.listMenuItems) {
        components.listMenuItems = []
      }
      components.listMenuItems.push({
        clientProps: {
          exportCollectionSlug: exportCollection.slug,
        },
        path: '@payloadcms/plugin-import-export/rsc#ExportListMenuItem',
      })
      collection.admin.components = components
    })

    if (!config.i18n) {
      config.i18n = {}
    }

    // config.i18n.translations = deepMergeSimple(translations, config.i18n?.translations ?? {})

    /**
     * Merge plugin translations
     */
    const simplifiedTranslations = Object.entries(translations).reduce(
      (acc, [key, value]) => {
        acc[key] = value.translations
        return acc
      },
      {} as Record<string, PluginDefaultTranslationsObject>,
    )

    config.i18n = {
      ...config.i18n,
      translations: deepMergeSimple(simplifiedTranslations, config.i18n?.translations ?? {}),
    }

    return config
  }

declare module 'payload' {
  export interface FieldCustom {
    'plugin-import-export'?: {
      toCSV?: ToCSVFunction
    }
  }
}
