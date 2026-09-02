import type { JsonObject, PayloadHandler, TypeWithID, Where } from 'payload'

import {
  addLocalesToRequestFromData,
  commitTransaction,
  getAccessResults,
  headersWithCors,
  initTransaction,
  killTransaction,
} from 'payload'
import { hasLocalizeStatusEnabled } from 'payload/shared'

import type { SanitizedSearchPluginConfig } from '../types.js'

import { syncDocAsSearchIndex } from './syncDocAsSearchIndex.js'

type ValidationResult = {
  isValid: boolean
  message?: string
}

export const generateReindexHandler =
  (pluginConfig: SanitizedSearchPluginConfig): PayloadHandler =>
  async (req) => {
    addLocalesToRequestFromData(req)
    if (!req.json) {
      return new Response('Req.json is undefined', { status: 400 })
    }
    const { collections = [] } = (await req.json()) as { collections: string[] }
    const t = req.t

    const searchSlug = pluginConfig?.searchOverrides?.slug || 'search'
    const searchCollections = pluginConfig?.collections || []

    async function validatePermissions(): Promise<ValidationResult> {
      const accessResults = await getAccessResults({ req })
      const searchAccessResults = accessResults.collections?.[searchSlug]
      if (!searchAccessResults) {
        return { isValid: false, message: t('error:notAllowedToPerformAction') }
      }

      const permissions = [searchAccessResults.delete, searchAccessResults.update]
      // plugin doesn't allow create by default:
      // if user provided, then add it to check
      if (pluginConfig.searchOverrides?.access?.create) {
        permissions.push(searchAccessResults.create)
      }
      // plugin allows reads by anyone by default:
      // so if user provided, then add to check
      if (pluginConfig.searchOverrides?.access?.read) {
        permissions.push(searchAccessResults.read)
      }
      return permissions.every(Boolean)
        ? { isValid: true }
        : { isValid: false, message: t('error:notAllowedToPerformAction') }
    }

    function validateCollections(): ValidationResult {
      const collectionsAreValid = collections.every((col) => searchCollections.includes(col))
      return collections.length && collectionsAreValid
        ? { isValid: true }
        : { isValid: false, message: t('error:invalidRequestArgs', { args: `'collections'` }) }
    }

    const headers = headersWithCors({
      headers: new Headers(),
      req,
    })

    const { isValid: hasPermissions, message: permissionError } = await validatePermissions()
    if (!hasPermissions) {
      return Response.json({ message: permissionError }, { headers, status: 401 })
    }

    const { isValid: validCollections, message: collectionError } = validateCollections()
    if (!validCollections) {
      return Response.json({ message: collectionError }, { headers, status: 400 })
    }

    const payload = req.payload
    const { reindexBatchSize: batchSize, syncDrafts } = pluginConfig

    const defaultLocale = payload.config.localization
      ? payload.config.localization.defaultLocale
      : req.locale

    const defaultLocalApiProps = {
      overrideAccess: false,
      req,
      user: req.user,
    }
    const whereStatusPublished: Where = {
      _status: {
        equals: 'published',
      },
    }
    // Localized `_status` tracks published state per-locale; match docs published in any locale.
    function buildPublishedWhere(collection: string): Where {
      const collectionConfig = payload.collections[collection]?.config
      const localeCodes = payload.config.localization ? payload.config.localization.localeCodes : []

      if (collectionConfig && hasLocalizeStatusEnabled(collectionConfig) && localeCodes.length) {
        return {
          or: localeCodes.map((localeCode) => ({
            [`_status.${localeCode}`]: {
              equals: 'published',
            },
          })),
        }
      }

      return whereStatusPublished
    }
    async function countDocuments(collection: string, drafts?: boolean): Promise<number> {
      const { totalDocs } = await payload.count({
        collection,
        ...defaultLocalApiProps,
        req: undefined,
        where: drafts ? undefined : buildPublishedWhere(collection),
      })
      return totalDocs
    }

    async function deleteIndexes(collection: string) {
      await payload.delete({
        collection: searchSlug,
        depth: 0,
        select: { id: true },
        where: { 'doc.relationTo': { equals: collection } },
        ...defaultLocalApiProps,
      })
    }

    async function reindexCollection(
      collection: string,
    ): Promise<{ docs: number; docsWithDrafts: number; errors: number }> {
      const collectionConfig = payload.collections[collection]?.config
      const draftsEnabled = Boolean(collectionConfig?.versions?.drafts)
      const localizeStatusEnabled = collectionConfig
        ? hasLocalizeStatusEnabled(collectionConfig)
        : false

      const totalDocsWithDrafts = await countDocuments(collection, true)
      const totalDocs =
        syncDrafts || !draftsEnabled
          ? totalDocsWithDrafts
          : await countDocuments(collection, !draftsEnabled)
      const totalBatches = Math.ceil(totalDocs / batchSize)

      let localErrors = 0

      // Loop through batches, then documents, then locales per document
      for (let i = 0; i < totalBatches; i++) {
        const { docs } = await payload.find({
          collection,
          depth: 0,
          limit: batchSize,
          // Fetch all locales so each locale's `_status` is available for gating below.
          locale: localizeStatusEnabled ? 'all' : defaultLocale,
          page: i + 1,
          // Only `_status` is needed here; per-locale content is loaded scoped inside the loop.
          // If that per-locale re-fetch is ever removed, widen this select to the indexed fields.
          select: localizeStatusEnabled ? { _status: true } : undefined,
          where: syncDrafts || !draftsEnabled ? undefined : buildPublishedWhere(collection),
          ...defaultLocalApiProps,
        })

        for (const doc of docs) {
          // Get all configured locales
          // If no localization, use [undefined] to sync once without a locale
          const allLocales = req.payload.config.localization
            ? req.payload.config.localization.localeCodes
            : [undefined]

          // Loop through all locales and check each one
          let firstAllowedLocale = true
          for (const localeToSync of allLocales) {
            // For localized status, skip locales that aren't published (unless syncing drafts),
            // then load the doc scoped to this locale so downstream sees per-locale scalars
            // (the batch only selected `_status`).
            let docToSync: JsonObject & TypeWithID = doc
            if (localizeStatusEnabled) {
              const localeStatus = (doc as { _status?: Record<string, string> })._status?.[
                localeToSync as string
              ]

              if (!syncDrafts && localeStatus !== 'published') {
                continue
              }

              docToSync =
                (await payload.findByID({
                  id: doc.id,
                  collection,
                  depth: 0,
                  disableErrors: true,
                  locale: localeToSync,
                  ...defaultLocalApiProps,
                })) ?? doc
            }

            // Check if we should skip this locale for this document
            let shouldSkip = false
            if (typeof pluginConfig.skipSync === 'function') {
              try {
                shouldSkip = await pluginConfig.skipSync({
                  collectionSlug: collection,
                  doc: docToSync,
                  locale: localeToSync,
                  req,
                })
              } catch (err) {
                req.payload.logger.error({
                  err,
                  msg: 'Search plugin: Error executing skipSync. Proceeding with sync.',
                })
              }
            }

            if (shouldSkip) {
              continue // Skip this locale
            }

            // Sync this locale (create first index, then update with other locales accordingly)
            const operation = firstAllowedLocale ? 'create' : 'update'
            firstAllowedLocale = false

            await syncDocAsSearchIndex({
              collection,
              data: docToSync,
              doc: docToSync,
              locale: localeToSync,
              onSyncError: () => operation === 'create' && localErrors++,
              operation,
              pluginConfig,
              req,
            })
          }
        }
      }

      return { docs: totalDocs, docsWithDrafts: totalDocsWithDrafts, errors: localErrors }
    }

    const shouldCommit = await initTransaction(req)

    // Collections are processed sequentially to avoid race conditions within the shared transaction.
    // Concurrent writes to the search collection interleave on the same DB connection and can cause
    // locale data to be missing non-deterministically.
    const results: Array<{ docs: number; docsWithDrafts: number; errors: number }> = []
    try {
      for (const collection of collections) {
        try {
          await deleteIndexes(collection)
          results.push(await reindexCollection(collection))
        } catch (err) {
          const message = t('error:unableToReindexCollection', { collection })
          payload.logger.error({ err, msg: message })
          results.push({ docs: 0, docsWithDrafts: 0, errors: 0 })
        }
      }
    } catch (err: unknown) {
      if (shouldCommit) {
        await killTransaction(req)
      }
      return Response.json(
        { message: err instanceof Error ? err.message : String(err) },
        { headers, status: 500 },
      )
    }

    const aggregateDocsWithDrafts = results.reduce((sum, r) => sum + r.docsWithDrafts, 0)
    const aggregateDocs = results.reduce((sum, r) => sum + r.docs, 0)
    const aggregateErrors = results.reduce((sum, r) => sum + r.errors, 0)

    const message = t('general:successfullyReindexed', {
      collections: collections.join(', '),
      count: aggregateDocs - aggregateErrors,
      skips: syncDrafts ? 0 : aggregateDocsWithDrafts - aggregateDocs,
      total: aggregateDocsWithDrafts,
    })

    if (shouldCommit) {
      await commitTransaction(req)
    }

    return Response.json({ message }, { headers, status: 200 })
  }
