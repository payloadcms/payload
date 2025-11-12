import type { PayloadHandler, Where } from 'payload'

import {
  addLocalesToRequestFromData,
  commitTransaction,
  getAccessResults,
  headersWithCors,
  initTransaction,
  killTransaction,
} from 'payload'

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
    const reindexLocales = pluginConfig?.locales?.length
      ? pluginConfig.locales
      : req.locale
        ? [req.locale]
        : []

    const validatePermissions = async (): Promise<ValidationResult> => {
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

    const validateCollections = (): ValidationResult => {
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
    let aggregateDocsWithDrafts = 0
    let aggregateErrors = 0
    let aggregateDocs = 0

    const countDocuments = async (collection: string, drafts?: boolean): Promise<number> => {
      const { totalDocs } = await payload.count({
        collection,
        ...defaultLocalApiProps,
        req: undefined,
        where: drafts ? undefined : whereStatusPublished,
      })
      return totalDocs
    }

    const deleteIndexes = async (collection: string) => {
      await payload.delete({
        collection: searchSlug,
        depth: 0,
        select: { id: true },
        where: { 'doc.relationTo': { equals: collection } },
        ...defaultLocalApiProps,
      })
    }

    const reindexCollection = async (collection: string) => {
      const draftsEnabled = Boolean(payload.collections[collection]?.config.versions?.drafts)

      const totalDocsWithDrafts = await countDocuments(collection, true)
      const totalDocs =
        syncDrafts || !draftsEnabled
          ? totalDocsWithDrafts
          : await countDocuments(collection, !draftsEnabled)
      const totalBatches = Math.ceil(totalDocs / batchSize)

      aggregateDocsWithDrafts += totalDocsWithDrafts
      aggregateDocs += totalDocs

      for (let j = 0; j < reindexLocales.length; j++) {
        // create first index, then we update with other locales accordingly
        const operation = j === 0 ? 'create' : 'update'
        const localeToSync = reindexLocales[j]

        for (let i = 0; i < totalBatches; i++) {
          const { docs } = await payload.find({
            collection,
            depth: 0,
            limit: batchSize,
            locale: localeToSync,
            page: i + 1,
            where: syncDrafts || !draftsEnabled ? undefined : whereStatusPublished,
            ...defaultLocalApiProps,
          })

          for (const doc of docs) {
            await syncDocAsSearchIndex({
              collection,
              data: doc,
              doc,
              locale: localeToSync,
              onSyncError: () => operation === 'create' && aggregateErrors++,
              operation,
              pluginConfig,
              req,
            })
          }
        }
      }
    }

    const shouldCommit = await initTransaction(req)

    try {
      const promises = collections.map(async (collection) => {
        try {
          await deleteIndexes(collection)
          await reindexCollection(collection)
        } catch (err) {
          const message = t('error:unableToReindexCollection', { collection })
          payload.logger.error({ err, msg: message })
        }
      })

      await Promise.all(promises)
    } catch (err: any) {
      if (shouldCommit) {
        await killTransaction(req)
      }
      return Response.json({ message: err.message }, { headers, status: 500 })
    }

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
