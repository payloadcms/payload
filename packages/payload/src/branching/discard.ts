import type { Payload, PayloadRequest } from '../types/index.js'
import type { BranchOperation } from './types.js'

import { executeAccess } from '../auth/executeAccess.js'
import { hasWhereAccessResult } from '../auth/types.js'
import { combineQueries } from '../database/combineQueries.js'
import { Forbidden } from '../errors/index.js'
import { deleteUploadFilesExclusiveToDocument } from '../uploads/deleteUploadFilesExclusiveToDocument.js'
import { commitTransaction } from '../utilities/commitTransaction.js'
import { createPayloadRequest } from '../utilities/createPayloadRequest.js'
import { initTransaction } from '../utilities/initTransaction.js'
import { killTransaction } from '../utilities/killTransaction.js'
import {
  beginDeferredCleanupScope,
  clearDeferredCleanupScope,
  flushDeferredCleanupScope,
} from '../utilities/transactionCallbacks.js'
import { assertBranchCreatedDocumentsUnreferenced } from './assertBranchCreatedDocumentsUnreferenced.js'
import { assertBranchWritable } from './assertBranchWritable.js'
import { resetBranchState, withoutBranch } from './resolveBranch.js'
import {
  branchChangesCollectionSlug,
  branchDocIDField,
  branchesCollectionSlug,
  branchField,
  branchParentField,
  MAIN_BRANCH,
} from './types.js'
import { deleteBranchGlobalVersionChain, deleteBranchVersionChain } from './versions.js'

export type DiscardedChange = {
  changeID: number | string
  /** Absent for a global. */
  collectionSlug?: string
  /** Absent for a global. */
  docID?: number | string
  entityType: 'collection' | 'global'
  globalSlug?: string
  operation: BranchOperation
}

export type DiscardResult = {
  discarded: DiscardedChange[]
}

export type DiscardOptions = {
  branch: string
  /** Change IDs to discard. Omit to discard everything pending on the branch. */
  changes?: (number | string)[]
  /**
   * Skip branch read and delete access checks.
   *
   * @default false
   */
  overrideAccess?: boolean
  req?: PayloadRequest
  user?: NonNullable<PayloadRequest['user']>
}

type DiscardInternalOptions = {
  shouldCheckBranchWritable: boolean
} & DiscardOptions

/**
 * Throws away a branch's changes, returning the documents to main's state.
 *
 * The mirror of merge, and structurally simpler: merge has to reconcile with
 * production, while discard only has to forget. Every operation reduces to the same
 * act — drop the branch's row — because the branch's row *is* the change:
 *
 * - **create** — the row is the document, so dropping it removes it from the branch.
 * - **update** — the row is the branch's copy, so dropping it makes the branch read
 *   through to main again.
 * - **delete** — the row is the tombstone, so dropping it un-hides main's document.
 *
 * Nothing on `main` is touched in any of the three, which is why this needs no
 * per-document preflight the way merge does (§13): a branch is a proposal, and
 * withdrawing a proposal is not a production write.
 *
 * Before a branch-created row is removed, reference checks verify that no surviving
 * document, global or version still points to it. Rows removed by the same discard
 * are excluded from that check.
 */
export const discardBranchChanges = async (
  payload: Payload,
  options: DiscardOptions,
): Promise<DiscardResult> =>
  discardBranchChangesInternal(payload, { ...options, shouldCheckBranchWritable: true })

/** Removes all state for a branch that its owning collection row is about to delete. */
export const discardBranchChangesBeforeBranchDeletion = async (
  payload: Payload,
  { branch, req }: Pick<DiscardOptions, 'branch' | 'req'>,
): Promise<DiscardResult> =>
  discardBranchChangesInternal(payload, {
    branch,
    overrideAccess: true,
    req,
    shouldCheckBranchWritable: false,
  })

const discardBranchChangesInternal = async (
  payload: Payload,
  {
    branch,
    changes: selected,
    overrideAccess = false,
    req: incomingReq,
    shouldCheckBranchWritable,
    user,
  }: DiscardInternalOptions,
): Promise<DiscardResult> => {
  // `branch: false` throughout, as with merge: the rows being dropped are addressed
  // by their real primary keys, so the read predicate must not be in the way.
  const req = incomingReq
    ? withoutBranch(incomingReq)
    : await createPayloadRequest({ branch: false, payload, user })

  if (user && !req.user) {
    req.user = user
  }

  const branchDocs = await payload.find({
    collection: branchesCollectionSlug,
    limit: 1,
    overrideAccess,
    pagination: false,
    req,
    where: { slug: { equals: branch } },
  })

  if (!branchDocs.docs[0]) {
    throw new Error(`Branch "${branch}" was not found.`)
  }

  const branchDoc = branchDocs.docs[0]

  if (!overrideAccess) {
    const deleteAccessResult = await executeAccess(
      {
        id: branchDoc.id,
        slug: branchesCollectionSlug,
        disableErrors: true,
        req,
      },
      payload.collections[branchesCollectionSlug]!.config.access.delete,
    )

    if (!deleteAccessResult) {
      throw new Forbidden(req.t)
    }

    if (hasWhereAccessResult(deleteAccessResult)) {
      const matchesDeleteAccess = await payload.db.findOne({
        collection: branchesCollectionSlug,
        req,
        where: combineQueries({ id: { equals: branchDoc.id } }, deleteAccessResult),
      })

      if (!matchesDeleteAccess) {
        throw new Forbidden(req.t)
      }
    }
  }

  // Discarding is a write, so a closed branch refuses it — its archive is a record,
  // and a record that can be edited is not one.
  if (shouldCheckBranchWritable) {
    await assertBranchWritable({ branch, req })
  }

  const allChanges = await payload.find({
    collection: branchChangesCollectionSlug,
    overrideAccess: true,
    pagination: false,
    req,
    sort: 'createdAt',
    where: {
      branch: { equals: branch },
    },
  })

  const applicable = allChanges.docs.filter(
    (change) => !selected || selected.map(String).includes(String(change.id)),
  )

  const result: DiscardResult = { discarded: [] }

  if (!applicable.length) {
    return result
  }

  // Gated on `req.transactionID`, not on whether a `req` was passed in: a discard
  // triggered over HTTP hands in a `req` of its own that has no transaction on it
  // yet, and it must get one just as much as a Local API call would.
  const shouldCommit = await initTransaction(req)
  const cleanupScope = await beginDeferredCleanupScope({ req })
  const uploadCleanupPlans: {
    collectionSlug: string
    retainedDoc: null | Record<string, unknown>
    sourceDoc: Record<string, unknown>
  }[] = []
  const plannedUploadIdentities = new Set<string>()

  try {
    const shadowsByChangeID = new Map<string, null | Record<string, unknown>>()
    const ignoredGlobalOwnerBranches = new Map<string, Set<string>>()
    const ignoredOwnerRowIDs = new Map<string, Set<number | string>>()

    for (const change of applicable) {
      if (change.entityType === 'global') {
        if (typeof change.globalSlug === 'string') {
          ignoredGlobalOwnerBranches.set(change.globalSlug, new Set([branch]))
        }

        continue
      }

      const collectionSlug = change.collectionSlug as string
      const docID = (change.doc as { value?: number | string })?.value ?? change.doc
      const shadow = (await payload.db.findOne({
        branch: false,
        collection: collectionSlug,
        req,
        where: {
          and: [
            { [branchField]: { equals: branch } },
            { or: [{ id: { equals: docID } }, { [branchDocIDField]: { equals: docID } }] },
          ],
        },
      })) as null | Record<string, unknown>

      shadowsByChangeID.set(String(change.id), shadow)

      if (shadow?.id !== undefined && shadow.id !== null) {
        const ignoredIDs = ignoredOwnerRowIDs.get(collectionSlug) ?? new Set<number | string>()

        ignoredIDs.add(shadow.id as number | string)
        ignoredOwnerRowIDs.set(collectionSlug, ignoredIDs)
      }
    }

    await assertBranchCreatedDocumentsUnreferenced({
      ignoredGlobalOwnerBranches,
      ignoredOwnerBranch: selected ? undefined : branch,
      ignoredOwnerRowIDs,
      req,
      targets: applicable.flatMap((change) => {
        if (
          change.entityType === 'global' ||
          change.operation !== 'create' ||
          typeof change.collectionSlug !== 'string'
        ) {
          return []
        }

        const docID = (change.doc as { value?: number | string })?.value ?? change.doc

        return typeof docID === 'number' || typeof docID === 'string'
          ? [{ collectionSlug: change.collectionSlug, docID }]
          : []
      }),
    })

    for (const change of applicable) {
      // A global has no shadow row to look up and no tombstone to undo: its branch copy
      // *is* the change, so dropping the copy is the entire discard, and the branch reads
      // through to main again immediately.
      if (change.entityType === 'global') {
        const globalSlug = change.globalSlug as string

        if (!payload.db.deleteBranchGlobal) {
          throw new Error(
            `The database adapter cannot remove a branch's copy of a global, so "${globalSlug}" cannot be discarded.`,
          )
        }

        await deleteBranchGlobalVersionChain({ branch, globalSlug, payload, req })
        await payload.db.deleteBranchGlobal({ branch, globalSlug, req })

        await payload.delete({
          id: change.id,
          collection: branchChangesCollectionSlug,
          overrideAccess: true,
          req,
        })

        result.discarded.push({
          changeID: change.id,
          entityType: 'global',
          globalSlug,
          operation: 'update',
        })

        continue
      }

      const collectionSlug = change.collectionSlug as string
      const docID = (change.doc as { value?: number | string })?.value ?? change.doc
      const shadow = shadowsByChangeID.get(String(change.id))

      if (shadow) {
        const collectionConfig = payload.collections[collectionSlug]!.config

        if (collectionConfig.upload) {
          const retainedDoc =
            change.operation === 'create'
              ? null
              : ((await payload.db.findOne({
                  branch: false,
                  collection: collectionSlug,
                  req,
                  where: {
                    and: [{ [branchField]: { equals: MAIN_BRANCH } }, { id: { equals: docID } }],
                  },
                })) as null | Record<string, unknown>)
          const versionDocuments = await readBranchVersionDocuments({
            branch,
            collectionSlug,
            payload,
            req,
            rowID: shadow.id as number | string,
          })
          const sourceDocuments =
            change.operation === 'create' ? versionDocuments : [shadow, ...versionDocuments]

          if (change.operation === 'create') {
            plannedUploadIdentities.add(`${collectionSlug}:${getUploadIdentity(shadow)}`)
          }

          for (const sourceDoc of sourceDocuments) {
            const identity = `${collectionSlug}:${getUploadIdentity(sourceDoc)}`

            if (!plannedUploadIdentities.has(identity)) {
              plannedUploadIdentities.add(identity)
              uploadCleanupPlans.push({ collectionSlug, retainedDoc, sourceDoc })
            }
          }
        }

        if (change.operation === 'create') {
          await payload.delete({
            id: shadow.id as number | string,
            branch: false,
            collection: collectionSlug,
            overrideAccess: true,
            req,
            trash: true,
          })
        } else {
          await deleteBranchVersionChain({
            branch,
            collectionSlug,
            payload,
            req,
            rowID: shadow.id as number | string,
          })

          await payload.db.deleteOne({
            branch: false,
            collection: collectionSlug,
            req,
            where: { id: { equals: shadow.id } },
          })
        }
      }

      await payload.delete({
        id: change.id,
        collection: branchChangesCollectionSlug,
        overrideAccess: true,
        req,
      })

      result.discarded.push({
        changeID: change.id,
        collectionSlug,
        docID: docID as number | string,
        entityType: 'collection',
        operation: change.operation as BranchOperation,
      })
    }

    for (const { collectionSlug, retainedDoc, sourceDoc } of uploadCleanupPlans) {
      await deleteUploadFilesExclusiveToDocument({
        collectionConfig: payload.collections[collectionSlug]!.config,
        config: payload.config,
        req,
        retainedDoc,
        sourceDoc,
      })
    }

    if (cleanupScope) {
      await flushDeferredCleanupScope({ req, scope: cleanupScope })
    }
    if (shouldCommit) {
      await commitTransaction(req)
    }
  } catch (error) {
    if (cleanupScope) {
      clearDeferredCleanupScope({ req, scope: cleanupScope })
    }

    if (shouldCommit) {
      await killTransaction(req)
    }
    throw error
  }

  // The manifest this request memoized still lists the discarded documents as
  // shadowed, which would hide main's copies from any later read on this request.
  resetBranchState(req)

  return result
}

const readBranchVersionDocuments = async ({
  branch,
  collectionSlug,
  payload,
  req,
  rowID,
}: {
  branch: string
  collectionSlug: string
  payload: Payload
  req: PayloadRequest
  rowID: number | string
}): Promise<Record<string, unknown>[]> => {
  if (!payload.collections[collectionSlug]?.config.versions) {
    return []
  }

  const { docs } = await payload.db.findVersions({
    branch: false,
    collection: collectionSlug,
    limit: 0,
    pagination: false,
    req,
    where: {
      and: [
        { parent: { equals: rowID } },
        { [branchField]: { equals: branch } },
        { [branchParentField]: { exists: true } },
      ],
    },
  })

  return docs.flatMap((version) =>
    version.version && typeof version.version === 'object' && !Array.isArray(version.version)
      ? [version.version as Record<string, unknown>]
      : [],
  )
}

const getUploadIdentity = (doc: Record<string, unknown>): string => {
  const sizeFilenames =
    doc.sizes && typeof doc.sizes === 'object' && !Array.isArray(doc.sizes)
      ? Object.entries(doc.sizes)
          .flatMap(([name, size]) => {
            if (!size || typeof size !== 'object' || Array.isArray(size)) {
              return []
            }

            const filename = (size as Record<string, unknown>).filename

            return typeof filename === 'string' ? [[name, filename] as [string, string]] : []
          })
          .sort(([left], [right]) => left.localeCompare(right))
      : []

  return JSON.stringify({
    filename: doc.filename,
    objectKey: doc._objectKey,
    prefix: doc.prefix,
    sizes: sizeFilenames,
  })
}
