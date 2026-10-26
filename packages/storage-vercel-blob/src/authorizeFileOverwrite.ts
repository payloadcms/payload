import type { FileData, PayloadRequest, TypeWithID, Where } from 'payload'

import {
  buildStoragePathData,
  isStoragePathWithinCollectionPrefix,
} from '@payloadcms/plugin-cloud-storage/utilities'
import { combineQueries, executeAccess, Forbidden } from 'payload'

export type VercelBlobCollectionOptions = Record<string, { prefix?: string } | true | undefined>

type OwnerDocument = { prefix?: string } & FileData & TypeWithID

type Owner = {
  collectionSlug: string
  doc: OwnerDocument
}

function getDocumentFileKeys({
  collectionPrefix,
  doc,
  useCompositePrefixes,
}: {
  collectionPrefix: string
  doc: OwnerDocument
  useCompositePrefixes: boolean
}): string[] {
  return [doc.filename, ...Object.values(doc.sizes || {}).map((size) => size?.filename)]
    .filter((filename): filename is string => typeof filename === 'string')
    .map(
      (filename) =>
        buildStoragePathData({
          collectionPrefix,
          docPrefix: doc.prefix,
          filename,
          useCompositePrefixes,
        }).storageFilePath,
    )
}

async function findMatchingDocs({
  collectionPrefix,
  collectionSlug,
  req,
  requestedFilename,
  requestedStorageFilePath,
  useCompositePrefixes,
}: {
  collectionPrefix: string
  collectionSlug: string
  req: PayloadRequest
  requestedFilename: string
  requestedStorageFilePath: string
  useCompositePrefixes: boolean
}): Promise<OwnerDocument[]> {
  const collection = req.payload.collections[collectionSlug]

  if (!collection) {
    return []
  }

  const imageSizes =
    collection.config.upload && typeof collection.config.upload === 'object'
      ? collection.config.upload.imageSizes || []
      : []
  const filenameQueries: Where[] = [
    { filename: { equals: requestedFilename } },
    ...imageSizes.map(({ name }) => ({
      [`sizes.${name}.filename`]: { equals: requestedFilename },
    })),
  ]
  const result = await req.payload.find({
    collection: collectionSlug,
    depth: 0,
    draft: true,
    overrideAccess: true,
    pagination: false,
    req,
    where: { or: filenameQueries },
  })

  return (result.docs as OwnerDocument[]).filter((doc) =>
    getDocumentFileKeys({ collectionPrefix, doc, useCompositePrefixes }).includes(
      requestedStorageFilePath,
    ),
  )
}

async function canUpdateDoc({
  collectionSlug,
  doc,
  req,
}: {
  collectionSlug: string
  doc: OwnerDocument
  req: PayloadRequest
}): Promise<boolean> {
  const collection = req.payload.collections[collectionSlug]

  if (!collection) {
    return false
  }

  const accessResult = await executeAccess(
    { id: doc.id, disableErrors: true, req },
    collection.config.access.update,
  )

  if (typeof accessResult === 'boolean') {
    return accessResult
  }

  const result = await req.payload.find({
    collection: collectionSlug,
    depth: 0,
    draft: true,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: combineQueries({ id: { equals: doc.id } }, accessResult),
  })

  return result.docs.length === 1
}

export async function authorizeClientOverwrite({
  collectionPrefix: collectionPrefixArg,
  collections,
  req,
  requestedCollectionSlug,
  requestedFilename,
  requestedStorageFilePath,
  useCompositePrefixes = false,
}: {
  collectionPrefix: string
  collections: VercelBlobCollectionOptions
  req: PayloadRequest
  requestedCollectionSlug: string
  requestedFilename: string
  requestedStorageFilePath: string
  useCompositePrefixes?: boolean
}): Promise<boolean> {
  if (
    !isStoragePathWithinCollectionPrefix({
      collectionPrefix: collectionPrefixArg,
      docPrefix: requestedStorageFilePath,
    })
  ) {
    throw new Forbidden(req.t)
  }

  const matchedDocs = (
    await Promise.all(
      Object.entries(collections).map(async ([collectionSlug, options]): Promise<Owner[]> => {
        const docs = await findMatchingDocs({
          collectionPrefix: options === true ? '' : options?.prefix || '',
          collectionSlug,
          req,
          requestedFilename,
          requestedStorageFilePath,
          useCompositePrefixes,
        })

        return docs.map((doc) => ({ collectionSlug, doc }))
      }),
    )
  ).flat()

  if (matchedDocs.length === 0) {
    return false
  }

  const matchedDoc = matchedDocs[0]!
  if (matchedDocs.length !== 1 || matchedDoc.collectionSlug !== requestedCollectionSlug) {
    throw new Forbidden(req.t)
  }

  if (
    !(await canUpdateDoc({ collectionSlug: matchedDoc.collectionSlug, doc: matchedDoc.doc, req }))
  ) {
    throw new Forbidden(req.t)
  }

  return true
}
