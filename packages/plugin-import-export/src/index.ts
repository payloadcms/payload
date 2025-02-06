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

    let collectionsToUpdate = config.collections

    const usePluginCollections = pluginConfig.collections && pluginConfig.collections?.length > 0

    if (usePluginCollections) {
      collectionsToUpdate = config.collections?.filter((collection) => {
        return pluginConfig.collections?.includes(collection.slug)
      })
    }

    collectionsToUpdate.forEach((collection) => {
      if (!collection.admin) {
        collection.admin = { components: { listControlsMenu: [] } }
      }
      if (!collection.admin.components) {
        collection.admin.components = { listControlsMenu: [] }
      }
      if (!collection.admin.components.listControlsMenu) {
        collection.admin.components.listControlsMenu = []
      }
      collection.admin.components.listControlsMenu.push({
        clientProps: {
          exportCollectionSlug: exportCollection.slug,
        },
        path: '@payloadcms/plugin-import-export/rsc#ExportButton',
      })
    })

    config.i18n = deepMergeSimple(translations, config.i18n?.translations ?? {})

    return config
  }
