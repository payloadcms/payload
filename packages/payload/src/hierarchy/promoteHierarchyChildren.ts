import type { SanitizedCollectionConfig, TypeWithID } from '../collections/config/types.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'

import { updateDocument } from '../collections/operations/utilities/update.js'
import { APIError, NotFound } from '../errors/index.js'
import { shareFileOperationScope } from '../uploads/fileVersioning/fileOperationManager.js'
import { deepCopyObjectSimple } from '../utilities/deepCopyObject.js'
import { hasDraftsEnabled, hasLocalizeStatusEnabled } from '../utilities/getVersionsConfig.js'
import { isolateObjectProperty } from '../utilities/isolateObjectProperty.js'
import { appendVersionToQueryKey } from '../versions/drafts/appendVersionToQueryKey.js'
import { getLatestCollectionVersion } from '../versions/getLatestCollectionVersion.js'

type HierarchyDocument = JsonObject & TypeWithID

/** Reparent both stored documents and pending drafts without publishing pending content. */
export async function promoteHierarchyChildren({
  id,
  collection,
  parentFieldName,
  req,
}: {
  collection: SanitizedCollectionConfig
  id: number | string
  parentFieldName: string
  req: PayloadRequest
}): Promise<Set<number | string>> {
  // Isolate locale without losing native Request getters or the parent transaction.
  const structuralReq = isolateObjectProperty(req, 'locale')

  structuralReq.locale = 'all'
  shareFileOperationScope({ owner: req, req: structuralReq })

  const hasDrafts = hasDraftsEnabled(collection)
  const query = {
    collection: collection.slug,
    joins: false as const,
    locale: 'all',
    req: structuralReq,
  }
  const where = { [parentFieldName]: { equals: id } }
  // Adapter reads include hidden fields and preserve raw, locale-keyed values. Read hooks must
  // not supply the snapshots used as the original document for a structural update.
  const storedChildren = await req.payload.db.find<HierarchyDocument>({
    ...query,
    limit: 0,
    pagination: false,
    where,
  })
  const latestChildren = hasDrafts
    ? await req.payload.db.queryDrafts<HierarchyDocument>({
        ...query,
        limit: 0,
        pagination: false,
        where: appendVersionToQueryKey(where),
      })
    : storedChildren
  const childIDs = new Map(
    [...storedChildren.docs, ...latestChildren.docs].map((child) => [String(child.id), child.id]),
  )

  if (!childIDs.size) {
    return new Set()
  }

  if (hasLocalizeStatusEnabled(collection)) {
    throw new APIError(
      'Hierarchy children cannot be reparented during deletion when localized draft status is enabled.',
      400,
    )
  }

  const parentQuery = { ...query, where: { id: { equals: id } } }
  const storedParent = await req.payload.db.findOne<HierarchyDocument>(parentQuery)

  if (!storedParent) {
    throw new NotFound(req.t)
  }

  const latestParent = hasDrafts
    ? await getLatestCollectionVersion<HierarchyDocument>({
        id,
        config: collection,
        payload: req.payload,
        query: parentQuery,
        req: structuralReq,
      })
    : storedParent

  for (const childID of childIDs.values()) {
    if (!hasDrafts) {
      await req.payload.update({
        id: childID,
        collection: collection.slug,
        data: { [parentFieldName]: storedParent[parentFieldName] ?? null },
        depth: 0,
        locale: 'all',
        overrideAccess: true,
        req: structuralReq,
        trash: true,
        user: req.user,
      })
      continue
    }

    const childQuery = { ...query, where: { id: { equals: childID } } }
    const storedChild = await req.payload.db.findOne<HierarchyDocument>(childQuery)
    const latestChild = await getLatestCollectionVersion<HierarchyDocument>({
      id: childID,
      config: collection,
      payload: req.payload,
      query: childQuery,
      req: structuralReq,
    })

    if (!storedChild || !latestChild) {
      throw new NotFound(req.t)
    }

    // Capture the draft before the published write creates a new latest version. Replaying
    // that snapshot preserves its content and files even when only the published parent moved.
    const storedSnapshot = deepCopyObjectSimple(storedChild)
    const latestSnapshot = deepCopyObjectSimple(latestChild)
    const shouldUpdateStored =
      storedSnapshot[parentFieldName] != null &&
      String(storedSnapshot[parentFieldName]) === String(id)
    const hasPendingDraft = latestSnapshot._status === 'draft'

    if (shouldUpdateStored) {
      await updateSnapshot({
        collection,
        doc: storedSnapshot,
        draft: false,
        parentFieldName,
        parentID: storedParent[parentFieldName] ?? null,
        req: structuralReq,
      })
    }

    if (hasPendingDraft) {
      const shouldUpdateDraft =
        latestSnapshot[parentFieldName] != null &&
        String(latestSnapshot[parentFieldName]) === String(id)

      if (shouldUpdateStored || shouldUpdateDraft) {
        await updateSnapshot({
          collection,
          doc: latestSnapshot,
          draft: true,
          parentFieldName,
          parentID: shouldUpdateDraft
            ? (latestParent?.[parentFieldName] ?? null)
            : (latestSnapshot[parentFieldName] ?? null),
          req: structuralReq,
        })
      }
    }
  }

  return new Set(childIDs.values())
}

async function updateSnapshot({
  collection,
  doc,
  draft,
  parentFieldName,
  parentID,
  req,
}: {
  collection: SanitizedCollectionConfig
  doc: HierarchyDocument
  draft: boolean
  parentFieldName: string
  parentID: unknown
  req: PayloadRequest
}) {
  return updateDocument({
    id: doc.id,
    autosave: false,
    collectionConfig: collection,
    config: req.payload.config,
    data: { [parentFieldName]: parentID },
    depth: 0,
    docWithLocales: doc,
    draftArg: draft,
    fallbackLocale: req.fallbackLocale!,
    filesToUpload: [],
    locale: 'all',
    overrideAccess: true,
    overrideLock: false,
    payload: req.payload,
    publishAllLocales: false,
    req,
    select: undefined!,
    shouldManageLocalFiles: false,
    showHiddenFields: true,
  })
}
