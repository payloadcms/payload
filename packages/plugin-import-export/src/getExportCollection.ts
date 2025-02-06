import type {
  CollectionAfterChangeHook,
  CollectionBeforeOperationHook,
  CollectionConfig,
} from 'payload'

import type { CollectionOverride, ImportExportPluginConfig } from './types.js'

import { createExport } from './export/createExport.js'
import { fields } from './exportFields.js'

export const getExportCollection = ({
  pluginConfig,
}: {
  pluginConfig: ImportExportPluginConfig
}): CollectionConfig => {
  const { overrideExportCollection } = pluginConfig

  const beforeOperation: CollectionBeforeOperationHook[] = []
  const afterChange: CollectionAfterChangeHook[] = []

  if (pluginConfig.disableJobsQueue) {
    beforeOperation.push(async ({ args, operation, req }) => {
      if (operation !== 'create') {
        return
      }
      const { user } = req
      if (args.data.collections.length === 1) {
        await createExport({ input: { ...args.data, user }, req })
      }
    })
  } else {
    afterChange.push(async ({ doc, operation, req }) => {
      if (operation !== 'create') {
        return
      }

      if (doc.collections.length === 1) {
        const input = { ...doc, user: req?.user?.id }
        const { id } = await req.payload.jobs.queue({
          input,
          task: 'createCollectionExport',
        })
        void req.payload.jobs.runByID({ id })
      }
    })
  }

  const collection: CollectionOverride = {
    slug: 'exports',
    access: {
      update: () => false,
    },
    admin: {
      group: false,
      useAsTitle: 'filename',
    },
    disableDuplicate: true,
    fields,
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
    return overrideExportCollection(collection)
  }

  return collection
}
