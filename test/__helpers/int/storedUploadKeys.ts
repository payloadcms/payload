import type { CollectionSlug, Payload } from 'payload'

type StoredRepresentation = {
  _objectKey?: null | string
  filename?: null | string
  prefix?: null | string
}

export type StoredUpload = {
  original?: null | StoredRepresentation
  variants?: null | Record<string, null | StoredRepresentation>
} & StoredRepresentation

export const getStoredUploadKey = ({
  collectionSlug,
  payload,
  representation,
}: {
  collectionSlug: string
  payload: Payload
  representation: StoredRepresentation
}): string | undefined => {
  if (!representation.filename) {
    return
  }
  const operations =
    payload.collections[collectionSlug as CollectionSlug]?.config.upload.fileOperations
  return operations
    ? operations.resolveStorageKey({
        _objectKey: representation._objectKey ?? undefined,
        filename: representation.filename,
        prefix: representation.prefix ?? undefined,
      })
    : representation.filename
}

export const getStoredUploadKeys = ({
  collectionSlug,
  doc,
  payload,
}: {
  collectionSlug: string
  doc: null | StoredUpload | undefined
  payload: Payload
}): string[] => {
  if (!doc) {
    return []
  }
  const representations = [doc, doc.original, ...Object.values(doc.variants ?? {})]
  return [
    ...new Set(
      representations.flatMap((representation) => {
        const key =
          representation && getStoredUploadKey({ collectionSlug, payload, representation })
        return key ? [key] : []
      }),
    ),
  ]
}
