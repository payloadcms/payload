import type { Config } from 'payload'

import type { ImportExportPluginOptions } from './types.js'

import { exportsCollection } from './collections/exportsCollection.js'
import { exportsUploadsCollection } from './collections/exportsUploadCollection.js'
import { exportData } from './lib/exportData.js'

export const importExportPlugin =
  (pluginOptions?: ImportExportPluginOptions) =>
  (incomingConfig: Config): Config => {
    const config = { ...incomingConfig }

    if (!config.collections) {
      config.collections = []
    }

    config.collections.push(exportsCollection)
    config.collections.push(exportsUploadsCollection)

    if (!config.endpoints) {
      config.endpoints = []
    }

    config.endpoints.push({
      handler: async (req) => {
        await exportData({ payload: req.payload })
        return Response.json({ message: 'Export complete' })
      },
      method: 'post',
      path: '/export',
    })

    return config
  }
