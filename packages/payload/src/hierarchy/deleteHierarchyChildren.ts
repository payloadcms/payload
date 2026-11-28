import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { APIError, NotFound } from '../errors/index.js'
import { shareFileOperationScope } from '../uploads/fileVersioning/fileOperationManager.js'
import { hasDraftsEnabled } from '../utilities/getVersionsConfig.js'
import { isolateObjectProperty } from '../utilities/isolateObjectProperty.js'
import { promoteHierarchyChildren } from './promoteHierarchyChildren.js'

type Args = {
  collection: SanitizedCollectionConfig
  deletedAt?: string
  id: number | string
  parentFieldName: string
  req: PayloadRequest
}

/** Apply the current operation's deletion choice to hierarchy children, not assigned content. */
export async function deleteHierarchyChildren({
  id,
  collection,
  deletedAt,
  parentFieldName,
  req,
}: Args): Promise<void> {
  const strategy =
    req.context.hierarchyDeleteStrategy === undefined
      ? 'reparent'
      : req.context.hierarchyDeleteStrategy

  if (strategy !== 'reparent' && strategy !== 'cascade') {
    throw new APIError('Invalid hierarchy deletion strategy', 400)
  }
  if (strategy === 'reparent') {
    await promoteHierarchyChildren({ id, collection, parentFieldName, req })
    return
  }

  const identity = JSON.stringify([collection.slug, String(id)])
  const path = req.context._payloadHierarchyDeletionPath
  const ancestors = Array.isArray(path)
    ? path.filter((value): value is string => typeof value === 'string')
    : []

  if (ancestors.includes(identity)) {
    throw new APIError('Cannot cascade through a circular hierarchy', 400)
  }

  // A request view keeps the recursion path local to this branch, including in bulk operations.
  const childReq = isolateObjectProperty(req, 'context')
  childReq.context = { ...req.context, _payloadHierarchyDeletionPath: [...ancestors, identity] }
  shareFileOperationScope({ owner: req, req: childReq })

  const findArgs = {
    collection: collection.slug,
    depth: 0,
    overrideAccess: true,
    pagination: false,
    req,
    select: { id: true, deletedAt: true } as const,
    showHiddenFields: true,
    sort: 'id',
    trash: true,
    where: { [parentFieldName]: { equals: id } },
  }
  const stored = await req.payload.find(findArgs)
  const latest = hasDraftsEnabled(collection)
    ? await req.payload.find({ ...findArgs, draft: true })
    : stored
  const children = new Map(
    [...stored.docs, ...latest.docs].map((child) => [String(child.id), child]),
  )

  for (const child of children.values()) {
    if (deletedAt) {
      if (child.deletedAt) {
        await deleteHierarchyChildren({
          id: child.id,
          collection,
          deletedAt,
          parentFieldName,
          req: childReq,
        })
      } else {
        await req.payload.update({
          id: child.id,
          collection: collection.slug,
          data: { deletedAt },
          overrideAccess: false,
          req: childReq,
          trash: true,
          user: req.user,
        })
      }
    } else {
      try {
        await req.payload.delete({
          id: child.id,
          collection: collection.slug,
          overrideAccess: false,
          req: childReq,
          trash: true,
          user: req.user,
        })
      } catch (err) {
        // A bulk selection can include both an ancestor and a descendant. Only tolerate a
        // missing child when it has actually gone, not when a delete access filter hid it.
        if (
          !(err instanceof NotFound) ||
          (await req.payload.db.findOne({
            collection: collection.slug,
            req,
            where: { id: { equals: child.id } },
          }))
        ) {
          throw err
        }
      }
    }
  }
}
