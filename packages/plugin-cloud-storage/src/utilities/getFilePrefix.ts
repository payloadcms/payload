import type { CollectionConfig, PayloadRequest, TextField, UploadConfig } from 'payload'

import { sanitizePrefix } from './sanitizePrefix.js'

/**
 * Resolves the file prefix from the highest-priority available source and
 * always returns a sanitized value.
 *
 * Resolution order:
 * 1. `prefixQueryParam`
 * 2. `clientUploadContext.prefix`
 * 3. Stored document `prefix` from the database
 * 4. `defaultValue` of the injected `prefix` field on the collection (fallback
 *    for in-flight creates where the document is not yet committed)
 *
 * Resolved values are passed through `sanitizePrefix`.
 */
export async function getFilePrefix({
  clientUploadContext,
  collection,
  filename,
  prefixQueryParam,
  req,
}: {
  clientUploadContext?: unknown
  collection: CollectionConfig
  filename: string
  prefixQueryParam?: string
  req: PayloadRequest
}): Promise<string> {
  if (typeof prefixQueryParam === 'string') {
    return sanitizePrefix(prefixQueryParam)
  }

  // Prioritize from clientUploadContext if there is:
  if (
    clientUploadContext &&
    typeof clientUploadContext === 'object' &&
    'prefix' in clientUploadContext &&
    typeof clientUploadContext.prefix === 'string'
  ) {
    return sanitizePrefix(clientUploadContext.prefix)
  }

  const imageSizes = (collection?.upload as UploadConfig)?.imageSizes || []

  const files = await req.payload.find({
    collection: collection.slug,
    depth: 0,
    draft: true,
    limit: 1,
    pagination: false,
    where: {
      or: [
        {
          filename: { equals: filename },
        },
        ...imageSizes.map((imageSize) => ({
          [`sizes.${imageSize.name}.filename`]: { equals: filename },
        })),
      ],
    },
  })

  if (files?.docs?.length) {
    const prefix = files.docs[0].prefix
    return prefix ? sanitizePrefix(prefix as string) : ''
  }

  // The document may not be committed yet (e.g. crop/save during a create
  // transaction). Fall back to the `defaultValue` of the `prefix` field that
  // the cloud-storage plugin injects via `getFields()`. That value equals the
  // collection-level prefix configured in the adapter, which is what was used
  // when the file was originally uploaded.
  const prefixField = collection.fields?.find(
    (field): field is TextField => 'name' in field && field.name === 'prefix',
  )
  if (prefixField && typeof prefixField.defaultValue === 'string' && prefixField.defaultValue) {
    return sanitizePrefix(prefixField.defaultValue)
  }

  return ''
}
