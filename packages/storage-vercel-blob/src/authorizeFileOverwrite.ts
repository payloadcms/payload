import type { FileData, PayloadRequest, TypeWithID, Where } from 'payload'

import { getFileKey } from '@payloadcms/plugin-cloud-storage/utilities'
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
        getFileKey({
          collectionPrefix,
          docPrefix: doc.prefix,
          filename,
          useCompositePrefixes,
        }).fileKey,
    )
}

async function findOwners({
  collectionPrefix,
  collectionSlug,
  fileKey,
  req,
  useCompositePrefixes,
}: {
  collectionPrefix: string
  collectionSlug: string
  fileKey: string
  req: PayloadRequest
  useCompositePrefixes: boolean
}): Promise<OwnerDocument[]> {
  const collection = req.payload.collections[collectionSlug]

  if (!collection) {
    return []
  }

  const filename = fileKey.split('/').pop()!
  const imageSizes =
    collection.config.upload && typeof collection.config.upload === 'object'
      ? collection.config.upload.imageSizes || []
      : []
  const filenameQueries: Where[] = [
    { filename: { equals: filename } },
    ...imageSizes.map(({ name }) => ({ [`sizes.${name}.filename`]: { equals: filename } })),
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
    getDocumentFileKeys({ collectionPrefix, doc, useCompositePrefixes }).includes(fileKey),
  )
}

async function canUpdateOwner({
  collectionSlug,
  owner,
  req,
}: {
  collectionSlug: string
  owner: OwnerDocument
  req: PayloadRequest
}): Promise<boolean> {
  const collection = req.payload.collections[collectionSlug]

  if (!collection) {
    return false
  }

  const accessResult = await executeAccess(
    { id: owner.id, disableErrors: true, req },
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
    where: combineQueries({ id: { equals: owner.id } }, accessResult),
  })

  return result.docs.length === 1
}

export async function authorizeClientOverwrite({
  collections,
  fileKey,
  req,
  requestedCollectionSlug,
  useCompositePrefixes = false,
}: {
  collections: VercelBlobCollectionOptions
  fileKey: string
  req: PayloadRequest
  requestedCollectionSlug: string
  useCompositePrefixes?: boolean
}): Promise<boolean> {
  const owners = (
    await Promise.all(
      Object.entries(collections).map(async ([collectionSlug, options]): Promise<Owner[]> => {
        const docs = await findOwners({
          collectionPrefix: options === true ? '' : options?.prefix || '',
          collectionSlug,
          fileKey,
          req,
          useCompositePrefixes,
        })

        return docs.map((doc) => ({ collectionSlug, doc }))
      }),
    )
  ).flat()

  if (owners.length === 0) {
    return false
  }

  const owner = owners[0]!
  if (owners.length !== 1 || owner.collectionSlug !== requestedCollectionSlug) {
    throw new Forbidden(req.t)
  }

  if (!(await canUpdateOwner({ collectionSlug: owner.collectionSlug, owner: owner.doc, req }))) {
    throw new Forbidden(req.t)
  }

  return true
}
