import type { Config, JobsConfig } from 'payload'

import { deepMergeSimple } from 'payload'

import type { ImportExportPluginConfig } from './types.js'

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
    config.jobs =
      config.jobs ||
      ({
        tasks: [getCreateCollectionExportTask(config)],
      } as unknown as JobsConfig) // cannot type jobs config inside of plugins

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
      if (!collection.admin.components) {
        collection.admin.components = { listMenuItems: [] }
      }
      if (!collection.admin.components.listMenuItems) {
        collection.admin.components.listMenuItems = []
      }
      collection.admin.components.listMenuItems.push({
        clientProps: {
          exportCollectionSlug: exportCollection.slug,
        },
        path: '@payloadcms/plugin-import-export/rsc#ExportButton',
      })
    })

    config.i18n = deepMergeSimple(translations, config.i18n?.translations ?? {})

    return config
  }
