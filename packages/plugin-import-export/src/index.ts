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
import { getFlattenedFieldKeys } from './utilities/getFlattenedFieldKeys.js'

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
    ;((config.jobs ??= {}).tasks ??= []).push(getCreateCollectionExportTask(config))

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

        const { collectionSlug, draft, fields, limit, locale, sort, where } = req.data as {
          collectionSlug: string
          draft?: 'no' | 'yes'
          fields?: string[]
          limit?: number
          locale?: string
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
          req,
          select,
          sort,
          where,
        })

        const docs = result.docs

        const toCSVFunctions = getCustomFieldFunctions({
          fields: collection.config.fields as FlattenedField[],
          select,
        })

        const possibleKeys = getFlattenedFieldKeys(collection.config.fields as FlattenedField[])

        const transformed = docs.map((doc) => {
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
      toCSV?: ToCSVFunction
    }
  }
}
