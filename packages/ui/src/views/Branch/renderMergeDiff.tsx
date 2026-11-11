import type { MergeEventChange, ServerFunction } from 'payload'
import type React from 'react'

import { branchMergesCollectionSlug } from 'payload/shared'

import { renderBranchEntityDiff } from './renderBranchEntityDiff.js'

export type RenderMergeDiffArgs = {
  /** Position within the merge event's `changes` array. */
  changeIndex: number
  mergeID: number | string
}

export type RenderMergeDiffResult = {
  diff?: React.ReactNode
  status: 'ready' | 'unavailable'
}

/**
 * Renders what one already-merged document changed, from the ledger.
 *
 * The live document is no longer a useful source here because main can move on.
 * The target versions recorded by the merge are read with the current user's
 * version access and rendered through the ordinary version-comparison renderer.
 *
 * Per change rather than with the page, for the reason `renderBranchDiff` is: a
 * branch's history can hold hundreds of documents and each diff is a full field-tree
 * render.
 */
export const renderMergeDiffHandler: ServerFunction<
  RenderMergeDiffArgs,
  Promise<RenderMergeDiffResult>
> = async ({ changeIndex, mergeID, req }) => {
  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const { payload } = req
  const { config } = payload

  const event = await payload.findByID({
    id: mergeID,
    collection: branchMergesCollectionSlug,
    depth: 0,
    overrideAccess: false,
    req,
    user: req.user,
  })

  const change = (
    event as {
      changes?: Partial<
        Pick<
          MergeEventChange,
          | 'after'
          | 'afterVersionID'
          | 'before'
          | 'beforeVersionID'
          | 'collectionSlug'
          | 'globalSlug'
          | 'operation'
        >
      >[]
    }
  )?.changes?.[changeIndex]

  const collectionSlug = change?.collectionSlug
  const globalSlug = change?.globalSlug
  // A merged global's snapshots are the same pair of documents any other row holds; only
  // the field set they are read against comes from somewhere else.
  const entityConfig = globalSlug
    ? config.globals.find((each) => each.slug === globalSlug)
    : collectionSlug
      ? payload.collections[collectionSlug]?.config
      : undefined

  if (!change || !entityConfig) {
    throw new Error('Unknown merged change')
  }

  const hasLegacySnapshots =
    Object.prototype.hasOwnProperty.call(change, 'before') ||
    Object.prototype.hasOwnProperty.call(change, 'after')
  const needsBeforeVersion = change.operation !== 'create'
  const needsAfterVersion = change.operation !== 'delete'
  let versionFromSiblingData: Record<string, unknown>
  let versionToSiblingData: Record<string, unknown>

  if (
    (!needsBeforeVersion || change.beforeVersionID) &&
    (!needsAfterVersion || change.afterVersionID)
  ) {
    try {
      const readVersion = async ({ id }: { id: string }): Promise<Record<string, unknown>> => {
        const version = collectionSlug
          ? await payload.findVersionByID({
              id,
              collection: collectionSlug,
              depth: 1,
              locale: 'all',
              overrideAccess: false,
              req,
              user: req.user,
            })
          : await payload.findGlobalVersionByID({
              id,
              slug: globalSlug,
              depth: 1,
              locale: 'all',
              overrideAccess: false,
              req,
              user: req.user,
            })

        return (version.version ?? {}) as Record<string, unknown>
      }

      const [beforeVersion, afterVersion] = await Promise.all([
        needsBeforeVersion ? readVersion({ id: change.beforeVersionID }) : Promise.resolve({}),
        needsAfterVersion ? readVersion({ id: change.afterVersionID }) : Promise.resolve({}),
      ])

      versionFromSiblingData = beforeVersion
      versionToSiblingData = afterVersion
    } catch (_error) {
      return { status: 'unavailable' }
    }
  } else if (hasLegacySnapshots) {
    versionFromSiblingData = (change.before ?? {}) as Record<string, unknown>
    versionToSiblingData = (change.after ?? {}) as Record<string, unknown>
  } else {
    return { status: 'unavailable' }
  }

  const { diff } = renderBranchEntityDiff({
    collectionSlug,
    fields: entityConfig.fields,
    globalSlug,
    req,
    versionFromSiblingData,
    versionToSiblingData,
  })

  return {
    diff,
    status: 'ready',
  }
}
