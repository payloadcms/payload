import type { CollectionConfig } from 'payload'

import type { CollectionOverride, ImportExportPluginConfig } from './types.js'

import { createExport } from './export/createExport.js'

export const getExportCollection = ({
  pluginConfig,
}: {
  pluginConfig: ImportExportPluginConfig
}): CollectionConfig => {
  const { overrideExportCollection } = pluginConfig

  const collection: CollectionOverride = {
    slug: 'exports',
    admin: {
      group: false,
    },
    disableDuplicate: true,
    fields: [
      {
        name: 'collections',
        type: 'array',
        fields: [
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
          // other options like where filters, limit, drafts, etc.
        ],
      },
      {
        name: 'locales',
        type: 'text',
        hasMany: true,
      },
      {
        name: 'globals',
        type: 'text',
        hasMany: true,
      },
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
    ],
    hooks: {
      beforeOperation: [
        async ({ args, operation, req }) => {
          if (operation !== 'create') {
            return
          }
          // TODO:
          //  if configured to use jobs, queue the export job
          //  await req.payload.jobs.queue({ input: { doc, req }, task: 'createExport' })
          //  otherwise, start the export immediately and don't await it

          // TODO: need a way to not await createExport so that this operation can happen in the background
          await createExport({ data: args.data, req })
        },
      ],
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
