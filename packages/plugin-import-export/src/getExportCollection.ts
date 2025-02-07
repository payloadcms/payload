import type {
  CollectionAfterChangeHook,
  CollectionBeforeOperationHook,
  CollectionConfig,
  Config,
} from 'payload'

import type { CollectionOverride, ImportExportPluginConfig } from './types.js'

import { createExport } from './export/createExport.js'
import { getFields } from './export/getFields.js'

export const getExportCollection = ({
  config,
  pluginConfig,
}: {
  config: Config
  pluginConfig: ImportExportPluginConfig
}): CollectionConfig => {
  const { overrideExportCollection } = pluginConfig

  const beforeOperation: CollectionBeforeOperationHook[] = []
  const afterChange: CollectionAfterChangeHook[] = []

  let collection: CollectionOverride = {
    slug: 'exports',
    access: {
      update: () => false,
    },
    admin: {
      group: false,
      useAsTitle: 'name',
    },
    disableDuplicate: true,
    fields: getFields(config),
    hooks: {
      afterChange,
      beforeOperation,
    },
    upload: {
      filesRequiredOnCreate: false,
      // must be csv, json or zip
      mimeTypes: ['application/json', 'text/csv', 'application/zip'],
    },
  }

  if (typeof overrideExportCollection === 'function') {
    collection = overrideExportCollection(collection)
  }

  if (pluginConfig.disableJobsQueue) {
    beforeOperation.push(async ({ args, operation, req }) => {
      if (operation !== 'create') {
        return
      }
      const { user } = req
      await createExport({ input: { ...args.data, user }, req })
    })
  } else {
    afterChange.push(async ({ doc, operation, req }) => {
      if (operation !== 'create') {
        return
      }

      const input = {
        ...doc,
        exportsCollection: collection.slug,
        user: req?.user?.id || req?.user?.user?.id,
        userCollection: 'users',
      }
      await req.payload.jobs.queue({
        input,
        task: 'createCollectionExport',
      })
    })
  }

  return collection
}
