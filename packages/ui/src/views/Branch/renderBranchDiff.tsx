import type { CollectionSlug, ServerFunction } from 'payload'
import type React from 'react'

import { getTranslation } from '@payloadcms/translations'
import { isolateBranchState } from 'payload'
import { MAIN_BRANCH } from 'payload/shared'

import { formatDocTitle } from '../../utilities/formatDocTitle/index.js'
import { getClientConfig } from '../../utilities/getClientConfig.js'
import { getClientSchemaMap } from '../../utilities/getClientSchemaMap.js'
import { getSchemaMap } from '../../utilities/getSchemaMap.js'
import { RenderDiff } from '../Version/RenderFieldsToDiff/index.js'

export type RenderBranchDiffArgs = {
  branch: string
  /** Absent for a global. */
  collectionSlug?: CollectionSlug
  /** Absent for a global. */
  docID?: number | string
  globalSlug?: string
  operation: 'create' | 'delete' | 'update'
}

export type RenderBranchDiffResult = {
  diff: React.ReactNode
  title: string
}

const timestampFields = new Set(['createdAt', 'updatedAt'])

/**
 * Renders one changed document's diff, on demand.
 *
 * Per document rather than per branch because a branch can hold hundreds of
 * changes and each diff is a full field-tree render — building them all up front
 * would be the slowest thing in the admin panel. The client asks for one at a
 * time, as rows are opened or come into view.
 *
 * The diff itself is the version-comparison renderer, unmodified: the shape of
 * the question is identical — two versions of one document, only the changed
 * fields — so `main`'s copy stands in for "before" and the branch's for "after".
 */
export const renderBranchDiffHandler: ServerFunction<
  RenderBranchDiffArgs,
  Promise<RenderBranchDiffResult>
> = async ({ branch, collectionSlug, docID, globalSlug, operation, req }) => {
  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const { i18n, payload } = req
  const { config } = payload

  // A global is the same question asked of a different entity: two copies of one thing,
  // only the changed fields. Everything below is shared; only what is read differs.
  const globalConfig = globalSlug
    ? config.globals.find((each) => each.slug === globalSlug)
    : undefined
  const collectionConfig = collectionSlug ? payload.collections[collectionSlug]?.config : undefined
  const entityConfig = globalConfig ?? collectionConfig

  if (!entityConfig) {
    throw new Error(`Unknown entity: ${globalSlug ?? collectionSlug}`)
  }

  // Drafts are the point of comparison on a versioned collection: a branch edit
  // that was only ever saved as a draft never touches the document row, so reading
  // published state returns main's own values on both sides and renders an empty
  // diff for a change that is really there.
  const draft = Boolean(entityConfig.versions?.drafts)

  const read = async (fromBranch: string) => {
    try {
      if (globalSlug) {
        return await payload.findGlobal({
          slug: globalSlug,
          branch: fromBranch,
          depth: 0,
          draft,
          overrideAccess: false,
          req: isolateBranchState(req),
          user: req.user,
        })
      }

      return await payload.findByID({
        id: docID,
        branch: fromBranch,
        collection: collectionSlug,
        depth: 0,
        disableErrors: true,
        draft,
        overrideAccess: false,
        req: isolateBranchState(req),
        user: req.user,
      })
    } catch (_err) {
      // A document that does not exist on one side is the normal case for a
      // create or a delete — the diff renders it as wholly added or removed.
      return null
    }
  }

  // A delete is a tombstone, so the branch read hides it: `before` is main's copy
  // and `after` is nothing. A create is the mirror of that.
  const [before, after] = await Promise.all([
    operation === 'create' ? Promise.resolve(null) : read(MAIN_BRANCH),
    operation === 'delete' ? Promise.resolve(null) : read(branch),
  ])

  // Timestamps are bookkeeping, not content. A branched document is written when
  // it is branched, so `updatedAt` differs on every single change — it would be
  // the one row present in every diff, and never the one worth reading.
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

  const diff = RenderDiff({
    clientSchemaMap,
    customDiffComponents: {},
    entitySlug: globalSlug ?? collectionSlug,
    fields: contentFields,
    i18n,
    // Only what the branch changed. The unchanged remainder of a document is
    // noise when the question is "what does merging this do?".
    fieldsPermissions: true,
    modifiedOnly: true,
    parentIndexPath: '',
    parentIsLocalized: false,
    parentPath: '',
    parentSchemaPath: '',
    req,
    selectedLocales: [],
    versionFromSiblingData: before ?? {},
    versionToSiblingData: after ?? {},
  })

  // A global has one of itself, so its label *is* its title — there is no document to name.
  if (globalSlug) {
    return {
      diff,
      title: getTranslation(globalConfig?.label ?? globalSlug, i18n),
    }
  }

  return {
    diff,
    title: formatDocTitle({
      collectionConfig: clientConfig.collections.find(({ slug }) => slug === collectionSlug),
      data: (after ?? before ?? { id: docID }) as Parameters<typeof formatDocTitle>[0]['data'],
      dateFormat: config.admin.dateFormat,
      fallback: String(docID),
      i18n,
    }),
  }
}
