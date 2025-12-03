import type {
  CollectionAfterChangeHook,
  CollectionBeforeOperationHook,
  CollectionConfig,
  Config,
} from 'payload'

import type { ExportConfig, ImportExportPluginConfig } from '../types.js'

import { createExport } from './createExport.js'
import { getFields } from './getFields.js'
import { handleDownload } from './handleDownload.js'
import { handlePreview } from './handlePreview.js'

export const getExportCollection = ({
  config,
  exportConfig,
  pluginConfig,
}: {
  config: Config
  exportConfig?: ExportConfig
  pluginConfig: ImportExportPluginConfig
}): CollectionConfig => {
  const beforeOperation: CollectionBeforeOperationHook[] = []
  const afterChange: CollectionAfterChangeHook[] = []

  // Extract export-specific settings
  const disableDownload = exportConfig?.disableDownload ?? false
  const disableSave = exportConfig?.disableSave ?? false
  const disableJobsQueue = exportConfig?.disableJobsQueue ?? false
  const batchSize = exportConfig?.batchSize ?? 100
  const format = exportConfig?.format

  const collection: CollectionConfig = {
    slug: 'exports',
    access: {
      update: () => false,
    },
    admin: {
      components: {
        edit: {
          SaveButton: '@payloadcms/plugin-import-export/rsc#ExportSaveButton',
        },
      },
      custom: {
        disableDownload,
        disableSave,
        format,
      },
      disableCopyToLocale: true,
      group: false,
      useAsTitle: 'name',
    },
    disableDuplicate: true,
    endpoints: [
      {
        handler: (req) => handleDownload(req, pluginConfig.debug),
        method: 'post',
        path: '/download',
      },
      {
        handler: handlePreview,
        method: 'post',
        path: '/export-preview',
      },
    ],
    fields: getFields(config, { format }),
    hooks: {
      afterChange,
      beforeOperation,
    },
    upload: {
      filesRequiredOnCreate: false,
      hideFileInputOnCreate: true,
      hideRemoveFile: true,
    },
  }

  if (disableJobsQueue) {
    beforeOperation.push(async ({ args, operation, req }) => {
      if (operation !== 'create') {
        return
      }
      const { user } = req
      const debug = pluginConfig.debug
      await createExport({ batchSize, input: { ...args.data, debug, user }, req })
    })
  } else {
    afterChange.push(async ({ collection: collectionConfig, doc, operation, req }) => {
      if (operation !== 'create') {
        return
      }

      const input = {
        ...doc,
        batchSize,
        exportsCollection: collectionConfig.slug,
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
