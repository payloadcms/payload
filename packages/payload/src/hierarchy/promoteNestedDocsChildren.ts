import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { hasDraftsEnabled } from '../utilities/getVersionsConfig.js'

/** Preserve published content and pending drafts while repairing the structural parent pointers. */
export async function promoteNestedDocsChildren({
  id,
  collection,
  parentFieldName,
  req,
}: {
  collection: SanitizedCollectionConfig
  id: number | string
  parentFieldName: string
  req: PayloadRequest
}) {
  const hasDrafts = hasDraftsEnabled(collection)
  const findArgs = {
    collection: collection.slug,
    depth: 0,
    overrideAccess: true,
    req,
    showHiddenFields: true,
    trash: true,
  }
  const parent = await req.payload.findByID({ ...findArgs, id })
  const draftParent = hasDrafts
    ? await req.payload.findByID({ ...findArgs, id, draft: true })
    : parent
  const childrenArgs = {
    ...findArgs,
    pagination: false,
    sort: 'id',
    where: { [parentFieldName]: { equals: id } },
  }
  // Structural cleanup includes unreadable children and bypasses child write permissions.
  const children = await req.payload.find(childrenArgs)
  const draftChildren = hasDrafts
    ? await req.payload.find({ ...childrenArgs, draft: true })
    : children
  const childIDs = new Set([...children.docs, ...draftChildren.docs].map((child) => child.id))

  for (const childID of childIDs) {
    const child = await req.payload.findByID({ ...findArgs, id: childID, draft: hasDrafts })
    const storedChild = hasDrafts ? await req.payload.findByID({ ...findArgs, id: childID }) : child
    const isDraft = hasDrafts && child._status === 'draft'
    const newParent =
      child[parentFieldName] === id
        ? ((isDraft ? draftParent : parent)[parentFieldName] ?? null)
        : (child[parentFieldName] ?? null)
    const data = { [parentFieldName]: newParent }

    const shouldUpdateStoredParent = hasDrafts && storedChild[parentFieldName] === id
    const storedData = { [parentFieldName]: parent[parentFieldName] ?? null }

    await req.payload.update({
      id: childID,
      collection: collection.slug,
      data,
      depth: 0,
      draft: isDraft,
      overrideAccess: true,
      req,
      trash: true,
      user: req.user,
    })

    if (shouldUpdateStoredParent) {
      // The ordinary update operation starts from the latest version. Applying that draft to
      // the main document would publish pending content. Change only its structural pointer.
      await req.payload.db.updateOne({
        id: childID,
        collection: collection.slug,
        data: storedData,
        req,
      })
    }
  }

  return childIDs
}
