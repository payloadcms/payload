import type {
  CollectionAfterChangeHook,
  CollectionBeforeOperationHook,
  CollectionConfig,
  Config,
} from 'payload'

import type { CollectionOverride, ImportExportPluginConfig } from './types.js'

import { createExport } from './export/createExport.js'
import { download } from './export/download.js'
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
      components: {
        edit: {
          SaveButton: '@payloadcms/plugin-import-export/rsc#ExportSaveButton',
        },
      },
      custom: {
        disableDownload: pluginConfig.disableDownload ?? false,
        disableSave: pluginConfig.disableSave ?? false,
      },
      group: false,
      useAsTitle: 'name',
    },
    disableDuplicate: true,
    endpoints: [
      {
        handler: (req) => {
          return download(req, pluginConfig.debug)
        },
        method: 'post',
        path: '/download',
      },
    ],
    fields: getFields(config, pluginConfig),
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

  if (typeof overrideExportCollection === 'function') {
    collection = overrideExportCollection(collection)
  }

  if (pluginConfig.disableJobsQueue) {
    beforeOperation.push(async ({ args, operation, req }) => {
      if (operation !== 'create') {
        return
      }
      const { user } = req
      const debug = pluginConfig.debug
      await createExport({ input: { ...args.data, debug } as any, req, user })
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
        userCollection: req.payload.config.admin.user,
      }
      await req.payload.jobs.queue({
        input,
        task: 'createCollectionExport',
      })
    })
  }

  return collection
}
