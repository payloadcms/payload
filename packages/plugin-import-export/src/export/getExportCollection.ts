import type {
  CollectionAfterChangeHook,
  CollectionBeforeOperationHook,
  CollectionConfig,
  Config,
  FlattenedField,
  Where,
} from 'payload'

import { addDataAndFileToRequest } from 'payload'

import type { ExportConfig, ImportExportPluginConfig } from '../types.js'

import { getFlattenedFieldKeys } from '../utilities/getFlattenedFieldKeys.js'
import { getValueAtPath } from '../utilities/getvalueAtPath.js'
import { removeDisabledFields } from '../utilities/removeDisabledFields.js'
import { setNestedValue } from '../utilities/setNestedValue.js'
import { createExport } from './createExport.js'
import { flattenObject } from './flattenObject.js'
import { getCustomFieldFunctions } from './getCustomFieldFunctions.js'
import { getFields } from './getFields.js'
import { getSelect } from './getSelect.js'
import { handleDownload } from './handleDownload.js'

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
        handler: (req) => {
          return handleDownload(req, pluginConfig.debug)
        },
        method: 'post',
        path: '/download',
      },
      {
        handler: async (req) => {
          await addDataAndFileToRequest(req)

          const {
            collectionSlug,
            draft: draftFromReq,
            fields,
            limit,
            locale,
            page,
            sort,
            where: whereFromReq = {},
          } = req.data as {
            collectionSlug: string
            draft?: 'no' | 'yes'
            fields?: string[]
            format?: 'csv' | 'json'
            limit?: number
            locale?: string
            page?: number
            sort?: any
            where?: any
          }

          const targetCollection = req.payload.collections[collectionSlug]
          if (!targetCollection) {
            return Response.json(
              { error: `Collection with slug ${collectionSlug} not found` },
              { status: 400 },
            )
          }

          const select = Array.isArray(fields) && fields.length > 0 ? getSelect(fields) : undefined
          const draft = draftFromReq === 'yes'

          const publishedWhere: Where = {
            _status: { equals: 'published' },
          }

          const where: Where = {
            and: [whereFromReq, draft ? {} : publishedWhere],
          }

          const result = await req.payload.find({
            collection: collectionSlug,
            depth: 1,
            draft,
            limit: limit && limit > 10 ? 10 : limit,
            locale,
            overrideAccess: false,
            page,
            req,
            select,
            sort,
            where,
          })

          const isCSV = req?.data?.format === 'csv'
          const docs = result.docs

          let transformed: Record<string, unknown>[] = []

          if (isCSV) {
            const toCSVFunctions = getCustomFieldFunctions({
              fields: targetCollection.config.fields as FlattenedField[],
            })

            const possibleKeys = getFlattenedFieldKeys(
              targetCollection.config.fields as FlattenedField[],
            )

            transformed = docs.map((doc) => {
              const row = flattenObject({
                doc,
                fields,
                toCSVFunctions,
              })

              for (const key of possibleKeys) {
                if (!(key in row)) {
                  row[key] = null
                }
              }

              return row
            })
          } else {
            const disabledFields =
              targetCollection.config.admin.custom?.['plugin-import-export']?.disabledFields

            transformed = docs.map((doc) => {
              let output: Record<string, unknown> = { ...doc }

              // Remove disabled fields first
              output = removeDisabledFields(output, disabledFields)

              // Then trim to selected fields only (if fields are provided)
              if (Array.isArray(fields) && fields.length > 0) {
                const trimmed: Record<string, unknown> = {}

                for (const key of fields) {
                  const value = getValueAtPath(output, key)
                  setNestedValue(trimmed, key, value ?? null)
                }

                output = trimmed
              }

              return output
            })
          }

          return Response.json({
            docs: transformed,
            page: result.page,
            totalDocs: result.totalDocs,
            totalPages: result.totalPages,
          })
        },
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
