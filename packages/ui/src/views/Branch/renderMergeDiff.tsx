import type { ServerFunction } from 'payload'
import type React from 'react'

import { branchMergesCollectionSlug } from 'payload/shared'

import { getClientConfig } from '../../utilities/getClientConfig.js'
import { getClientSchemaMap } from '../../utilities/getClientSchemaMap.js'
import { getSchemaMap } from '../../utilities/getSchemaMap.js'
import { RenderDiff } from '../Version/RenderFieldsToDiff/index.js'

export type RenderMergeDiffArgs = {
  /** Position within the merge event's `changes` array. */
  changeIndex: number
  mergeID: number | string
}

export type RenderMergeDiffResult = {
  diff: React.ReactNode
}

const timestampFields = new Set(['createdAt', 'updatedAt'])

/**
 * Renders what one already-merged document changed, from the ledger.
 *
 * The live document is no longer a useful source here: main has moved on since, and
 * the branch's copy is gone. So this reads the two snapshots taken either side of
 * the merge write — the only record of that moment — and renders them through the
 * same version-comparison renderer the pre-merge diff uses.
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

  const { i18n, payload } = req
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
      changes?: {
        after?: unknown
        before?: unknown
        collectionSlug?: string
        globalSlug?: string
      }[]
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

  // Timestamps are bookkeeping, not content, and `updatedAt` differs on every
  // merged document by definition — it would be the one row present in every diff.
  const contentFields = entityConfig.fields.filter(
    (field) => !('name' in field) || !timestampFields.has(field.name),
  )

  const schemaMap = getSchemaMap({ collectionSlug, config, globalSlug, i18n })

  const clientConfig = getClientConfig({
    config,
    i18n,
    importMap: payload.importMap,
    user: req.user,
  })

  const clientSchemaMap = getClientSchemaMap({
    collectionSlug,
    config: clientConfig,
    globalSlug,
    i18n,
    payload,
    schemaMap,
  })

  return {
    diff: RenderDiff({
      clientSchemaMap,
      customDiffComponents: {},
      entitySlug: globalSlug ?? collectionSlug,
      fields: contentFields,
      fieldsPermissions: true,
      i18n,
      modifiedOnly: true,
      parentIndexPath: '',
      parentIsLocalized: false,
      parentPath: '',
      parentSchemaPath: '',
      req,
      selectedLocales: [],
      versionFromSiblingData: (change.before ?? {}) as Record<string, unknown>,
      versionToSiblingData: (change.after ?? {}) as Record<string, unknown>,
    }),
  }
}
