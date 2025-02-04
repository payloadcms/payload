import type {
  CollectionAfterChangeHook,
  CollectionBeforeOperationHook,
  CollectionConfig,
  Field,
} from 'payload'

import type { CollectionOverride, ImportExportPluginConfig } from './types.js'

import { createExport } from './export/createExport.js'
import { getFilename } from './export/getFilename.js'

export const exportCollectionFields: Field[] = [
  {
    name: 'slug',
    type: 'text',
    required: true,
  },
  {
    name: 'fields',
    type: 'text',
    hasMany: true,
  },
  {
    name: 'sort',
    type: 'text',
    hasMany: true,
  },
  {
    name: 'limit',
    type: 'number',
  },
  {
    name: 'where',
    type: 'json',
  },
]

export const fields: Field[] = [
  {
    name: 'name',
    type: 'text',
    defaultValue: () => getFilename(),
    virtual: true,
  },
  {
    name: 'collections',
    type: 'array',
    fields: exportCollectionFields,
  },
  {
    name: 'locales',
    type: 'text',
    hasMany: true,
  },
  // {
  //   name: 'globals',
  //   type: 'text',
  //   hasMany: true,
  // },
  {
    name: 'format',
    type: 'radio',
    options: [
      {
        label: 'JSON',
        value: 'json',
      },
      {
        label: 'CSV',
        value: 'csv',
      },
    ],
    required: true,
  },
]

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
