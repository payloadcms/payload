import type { CollectionBeforeChangeHook, Where } from 'payload/types'

import { APIError } from 'payload/errors'

import type { NestedDocsPluginConfig } from '../types.js'

import { getParents } from './getParents.js'

type ExtendedBeforeChangeHook = (
  args: Parameters<CollectionBeforeChangeHook>[0] & {
    pluginConfig: NestedDocsPluginConfig
  },
) => Promise<any>

function generateRandomString(length = 20) {
  return [...Array(length)].map(() => Math.random().toString(36)[2]).join('')
}

type CalculateNewPathParams = Parameters<CollectionBeforeChangeHook>[0] & {
  currentDoc: any
  pluginConfig: NestedDocsPluginConfig
}

/**
 * We can't soloy relay on the breadcrumbs field to generate the path because it's not guaranteed to be populated nor
 * exisit for the collection. User might have opted to only have `parent` field & path field.
 */
export async function calculateNewPath({
  collection,
  currentDoc,
  operation,
  pluginConfig,
  req,
}: CalculateNewPathParams): Promise<string> {
  const isAutoSave = operation === 'create' && currentDoc?._status === 'draft'
  if (isAutoSave) return `/${currentDoc?.id || generateRandomString(20)}`
  const breadcrumbsFieldSlug = pluginConfig?.breadcrumbsFieldSlug || 'breadcrumbs'
  const newPath = currentDoc?.[breadcrumbsFieldSlug]?.at(-1)?.url
  if (newPath) return newPath
  const docs = await getParents(req, pluginConfig, collection, currentDoc, [currentDoc])

  return (
    pluginConfig.generateURL?.(docs, currentDoc) || `/${currentDoc?.id || generateRandomString(20)}`
  )
}

export const setPathFieldOrThrow: ExtendedBeforeChangeHook = async (args) => {
  const { collection, data, originalDoc, pluginConfig, req } = args
  const collections = pluginConfig?.collections || []
  const pathFieldSlug =
    pluginConfig?.pathFieldSlug !== false ? pluginConfig?.pathFieldSlug || 'path' : false
  const uniquePathCollections =
    pluginConfig?.uniquePathCollections?.length > 0
      ? pluginConfig?.uniquePathCollections
      : collections.length > 0
        ? collections
        : []

  if (!uniquePathCollections.includes(collection.slug) || !pathFieldSlug) return data

  const currentDoc = { ...originalDoc, ...data }
  const newPath = await calculateNewPath({ ...args, currentDoc })

  const collectionDocsThatConflict = await Promise.all(
    uniquePathCollections.map((collectionSlug) => {
      const where: Where = {
        [pathFieldSlug]: {
          equals: newPath,
        },
      }
      if (originalDoc && originalDoc?.id && collectionSlug === collection.slug) {
        where.id = { not_equals: originalDoc.id }
      }
      return req.payload.find({
        collection: collectionSlug,
        where,
      })
    }),
  )

  const foundDocument = collectionDocsThatConflict
    .find((result) => result.docs.length > 0)
    ?.docs.at(0)
  const willConflict = !!foundDocument
  if (willConflict) {
    const error = new APIError(
      `The new path "${newPath}" will create a conflict with document: ${foundDocument.id}.`,
      400,
      [{ field: pathFieldSlug, message: `New path would conflict with another document.` }],
      false,
    )
    throw error
  }
  data[pathFieldSlug] = newPath
  return data
}
