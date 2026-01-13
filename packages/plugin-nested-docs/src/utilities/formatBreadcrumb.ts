import type { PayloadRequest, SanitizedCollectionConfig } from 'payload'

import type { Breadcrumb, GenerateLabel, GenerateURL } from '../types.js'

type Args = {
  /**
   * Existing breadcrumb, if any, to base the new breadcrumb on.
   * This ensures that row IDs are maintained across updates, etc.
   */
  breadcrumb?: Breadcrumb
  collection: SanitizedCollectionConfig
  docs: Record<string, unknown>[]
  generateLabel?: GenerateLabel
  generateURL?: GenerateURL
  req: PayloadRequest
}

export const formatBreadcrumb = ({
  breadcrumb,
  collection,
  docs,
  generateLabel,
  generateURL,
  req,
}: Args): Breadcrumb => {
  let url: string | undefined = undefined
  let label: string

  const lastDoc = docs[docs.length - 1]!

  if (typeof generateURL === 'function') {
    url = generateURL(docs, lastDoc, collection, req)
  }

  if (typeof generateLabel === 'function') {
    label = generateLabel(docs, lastDoc, collection, req)
  } else {
    const title = collection.admin?.useAsTitle ? lastDoc[collection.admin.useAsTitle] : ''

    label = typeof title === 'string' || typeof title === 'number' ? String(title) : ''
  }

  return {
    ...(breadcrumb || {}),
    doc: lastDoc.id as string,
    label,
    url,
  }
}
