import type { Config, FlattenedField } from 'payload'

import { addDataAndFileToRequest, deepMergeSimple } from 'payload'

import type { PluginDefaultTranslationsObject } from './translations/types.js'
import type { ImportExportPluginConfig, ToCSVFunction } from './types.js'

import { flattenObject } from './export/flattenObject.js'
import { getCreateCollectionExportTask } from './export/getCreateExportCollectionTask.js'
import { getCustomFieldFunctions } from './export/getCustomFieldFunctions.js'
import { getSelect } from './export/getSelect.js'
import { getExportCollection } from './getExportCollection.js'
import { translations } from './translations/index.js'
import { collectDisabledFieldPaths } from './utilities/collectDisabledFieldPaths.js'
import { getFlattenedFieldKeys } from './utilities/getFlattenedFieldKeys.js'
import { getValueAtPath } from './utilities/getvalueAtPath.js'
import { removeDisabledFields } from './utilities/removeDisabledFields.js'
import { setNestedValue } from './utilities/setNestedValue.js'

export const importExportPlugin =
  (pluginConfig: ImportExportPluginConfig) =>
  (config: Config): Config => {
    const exportCollection = getExportCollection({ config, pluginConfig })
    if (config.collections) {
      config.collections.push(exportCollection)
    } else {
      config.collections = [exportCollection]
    }

    // inject custom import export provider
    config.admin = config.admin || {}
    config.admin.components = config.admin.components || {}
    config.admin.components.providers = config.admin.components.providers || []
    config.admin.components.providers.push(
      '@payloadcms/plugin-import-export/rsc#ImportExportProvider',
    )

    // inject the createExport job into the config
    ;((config.jobs ??= {}).tasks ??= []).push(getCreateCollectionExportTask(config, pluginConfig))

    let collectionsToUpdate = config.collections

    const usePluginCollections = pluginConfig.collections && pluginConfig.collections?.length > 0

    if (usePluginCollections) {
      collectionsToUpdate = config.collections?.filter((collection) => {
        return pluginConfig.collections?.includes(collection.slug)
      })
    }

    collectionsToUpdate.forEach((collection) => {
      if (!collection.admin) {
        collection.admin = { components: { listMenuItems: [] } }
      }
      const components = collection.admin.components || {}
      if (!components.listMenuItems) {
        components.listMenuItems = []
      }
      components.listMenuItems.push({
        clientProps: {
          exportCollectionSlug: exportCollection.slug,
        },
        path: '@payloadcms/plugin-import-export/rsc#ExportListMenuItem',
      })

      // Find fields explicitly marked as disabled for import/export
      const disabledFieldAccessors = collectDisabledFieldPaths(collection.fields)

      // Store disabled field accessors in the admin config for use in the UI
      collection.admin.custom = {
        ...(collection.admin.custom || {}),
        'plugin-import-export': {
          ...(collection.admin.custom?.['plugin-import-export'] || {}),
          disabledFields: disabledFieldAccessors,
        },
      }

      collection.admin.components = components
    })

    if (!config.i18n) {
      config.i18n = {}
    }

    // config.i18n.translations = deepMergeSimple(translations, config.i18n?.translations ?? {})

    // Inject custom REST endpoints into the config
    config.endpoints = config.endpoints || []
    config.endpoints.push({
      handler: async (req) => {
        await addDataAndFileToRequest(req)

        const { collectionSlug, draft, fields, limit, locale, page, sort, where } = req.data as {
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

        const collection = req.payload.collections[collectionSlug]
        if (!collection) {
          return Response.json(
            { error: `Collection with slug ${collectionSlug} not found` },
            { status: 400 },
          )
        }

        const select = Array.isArray(fields) && fields.length > 0 ? getSelect(fields) : undefined

        const result = await req.payload.find({
          collection: collectionSlug,
          depth: 1,
          draft: draft === 'yes',
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
            fields: collection.config.fields as FlattenedField[],
          })

          const possibleKeys = getFlattenedFieldKeys(collection.config.fields as FlattenedField[])

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
            collection.config.admin.custom?.['plugin-import-export']?.disabledFields

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
          totalDocs: result.totalDocs,
        })
      },
      method: 'post',
      path: '/preview-data',
    })

    /**
     * Merge plugin translations
     */
    const simplifiedTranslations = Object.entries(translations).reduce(
      (acc, [key, value]) => {
        acc[key] = value.translations
        return acc
      },
      {} as Record<string, PluginDefaultTranslationsObject>,
    )

    config.i18n = {
      ...config.i18n,
      translations: deepMergeSimple(simplifiedTranslations, config.i18n?.translations ?? {}),
    }

    return config
  }

declare module 'payload' {
  export interface FieldCustom {
    'plugin-import-export'?: {
      /**
       * When `true` the field is **completely excluded** from the import-export plugin:
       * - It will not appear in the "Fields to export" selector.
       * - It is hidden from the preview list when no specific fields are chosen.
       * - Its data is omitted from the final CSV / JSON export.
       * @default false
       */
      disabled?: boolean
      /**
       * Custom function used to modify the outgoing csv data by manipulating the data, siblingData or by returning the desired value
       */
      toCSV?: ToCSVFunction
    }
  }

  export interface CollectionAdminCustom {
    'plugin-import-export'?: {
      /**
       * Array of field paths that are disabled for import/export.
       * These paths are collected from fields marked with `custom['plugin-import-export'].disabled = true`.
       */
      disabledFields?: string[]
    }
  }
}
