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
      hideFileInputOnCreate: true,
      hideRemoveFile: true,
    },
  }

  if (typeof overrideExportCollection === 'function') {
    collection = overrideExportCollection(collection)
  }

  // TODO: this should not be needed, we have to fix the select inputs
  // sanitize incoming data
  beforeOperation.push(({ args, operation }) => {
    if (operation === 'create') {
      if (args.data.sort) {
        args.data.sort = typeof args.data.sort === 'string' ? args.data.sort : args.data.sort.value
      }
      args.data.fields = args.data.fields.map(
        (option: { label: string; value: string } | string) =>
          typeof option === 'string' ? option : option.value,
      )
    }

    return args
  })

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
