import type { CollectionConfig } from 'payload'

import type { ImportExportPluginConfig } from './types.js'

export const getExportCollection = ({
  pluginConfig,
}: {
  pluginConfig: ImportExportPluginConfig
}): CollectionConfig => {
  const { overrideExportCollection } = pluginConfig

  const collection: CollectionConfig = {
    slug: 'exports',
    admin: {
      // TODO: this will likely need to be false
      group: 'System',
    },
    fields: [
      {
        name: 'collections',
        type: 'array',
        fields: [
          {
            name: 'slug',
            type: 'text',
          },
          // other options like filters, limit, etc.
        ],
        minRows: 1,
        required: true,
      },
      {
        name: 'globals',
        type: 'text',
        hasMany: true,
      },
      {
        name: 'format',
        type: 'select',
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
    upload: true,
  }

  if (typeof overrideExportCollection === 'function') {
    return overrideExportCollection(collection)
  }

  return collection
}
