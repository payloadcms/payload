import type {
  CollectionAfterChangeHook,
  CollectionBeforeOperationHook,
  CollectionConfig,
  Config,
} from 'payload'

import type { ExportConfig, ImportExportPluginConfig, Limit } from '../types.js'
import type { Export } from './createExport.js'

import { resolveLimit } from '../utilities/resolveLimit.js'
import { createExport } from './createExport.js'
import { getFields } from './getFields.js'
import { handleDownload } from './handleDownload.js'
import { handlePreview } from './handlePreview.js'

const FALLBACK_BATCH_SIZE = 100

export const getExportCollection = ({
  collectionSlugs,
  config,
  exportConfig,
  pluginConfig,
}: {
  /**
   * Collection slugs that this export collection supports.
   */
  collectionSlugs: string[]
  config: Config
  exportConfig?: ExportConfig
  pluginConfig: ImportExportPluginConfig
}): CollectionConfig => {
  const beforeOperation: CollectionBeforeOperationHook[] = []
  const afterChange: CollectionAfterChangeHook[] = []

  const disableDownload = exportConfig?.disableDownload ?? false
  const disableSave = exportConfig?.disableSave ?? false
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
        'plugin-import-export': {
          collectionSlugs,
        },
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
    fields: getFields({ collectionSlugs, config, format }),
    hooks: {
      afterChange,
      beforeOperation,
    },
    lockDocuments: false,
    upload: {
      filesRequiredOnCreate: false,
      hideFileInputOnCreate: true,
      hideRemoveFile: true,
    },
  }

  // Synchronous export hook - runs when target collection has disableJobsQueue enabled
  beforeOperation.push(async ({ args, collection: collectionConfig, operation, req }) => {
    if (operation !== 'create') {
      return
    }

    const exportData = args.data as Export
    const targetCollection = req.payload.collections[exportData.collectionSlug]
    const targetPluginConfig = targetCollection?.config.custom?.['plugin-import-export']

    // Check if this target collection should use sync mode
    // Fall back to exportConfig (for custom collections with overrideCollection)
    const disableJobsQueue =
      targetPluginConfig?.exportDisableJobsQueue ?? exportConfig?.disableJobsQueue ?? false
    if (!disableJobsQueue) {
      return
    }

    const { user } = req
    const debug = pluginConfig.debug

    const exportLimitConfig: Limit | undefined = targetPluginConfig?.exportLimit
    const maxLimit = await resolveLimit({
      limit: exportLimitConfig,
      req,
    })

    const batchSize =
      targetPluginConfig?.exportBatchSize ??
      exportConfig?.batchSize ??
      pluginConfig.batchSize ??
      FALLBACK_BATCH_SIZE

    await createExport({
      ...exportData,
      batchSize,
      debug,
      exportCollection: collectionConfig.slug,
      maxLimit,
      req,
      userCollection: user?.collection || user?.user?.collection,
      userID: user?.id || user?.user?.id,
    })
  })

  afterChange.push(async ({ collection: collectionConfig, doc, operation, req }) => {
    if (operation !== 'create') {
      return
    }

    const targetCollection = req.payload.collections[doc.collectionSlug]
    const targetPluginConfig = targetCollection?.config.custom?.['plugin-import-export']
    const disableJobsQueue =
      targetPluginConfig?.exportDisableJobsQueue ?? exportConfig?.disableJobsQueue ?? false
    if (disableJobsQueue) {
      return
    }

    const { user } = req

    // Get max limit from the target collection's config
    // For job-based exports, we resolve the limit now since function limits
    // cannot be serialized. This means dynamic limits are resolved at queue time.
    const exportLimitConfig: Limit | undefined = targetPluginConfig?.exportLimit
    const maxLimit = await resolveLimit({
      limit: exportLimitConfig,
      req,
    })

    const batchSize =
      targetPluginConfig?.exportBatchSize ??
      exportConfig?.batchSize ??
      pluginConfig.batchSize ??
      FALLBACK_BATCH_SIZE

    const input: Export = {
      id: doc.id,
      name: doc.name,
      batchSize,
      collectionSlug: doc.collectionSlug,
      drafts: doc.drafts,
      exportCollection: collectionConfig.slug,
      fields: doc.fields,
      format: doc.format,
      limit: doc.limit,
      locale: doc.locale,
      maxLimit,
      page: doc.page,
      sort: doc.sort,
      userCollection: user?.collection || user?.user?.collection,
      userID: user?.id || user?.user?.id,
      where: doc.where,
    }

    await req.payload.jobs.queue({
      input,
      task: 'createCollectionExport',
    })
  })

  return collection
}
