import { isDeepStrictEqual } from 'node:util'

import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { BranchHeadState, BranchHeadToken } from '../types.js'
import type { BranchWriteObservation } from './prepareBranchWrite.js'

import { hasLocalizeStatusEnabled } from '../../../utilities/getVersionsConfig.js'
import { compileBranchScopeFields } from '../compileBranchScopeFields.js'
import { projectBranchScopeData } from '../projectBranchScopeData.js'
import { commitBranchAutosaveHeads, commitBranchHeads } from '../storage/branchHeadStore.js'
import {
  createBranchIdentityVisibility,
  readBranchIdentityVisibility,
  updateBranchIdentityVisibility,
} from '../storage/branchIdentityStore.js'
import { getBranchStorage } from '../storage/branchStorage.js'
import { initializeBranchVersion, readBranchVersion } from '../storage/branchVersionStore.js'
import {
  areBranchAutosaveScopesEqual,
  planBranchAutosaveOwnership,
  prepareBranchAutosave,
} from './prepareBranchAutosave.js'

/** Install references to canonical native bodies inside the original operation transaction. */
export const persistBranchWrite = async ({
  id,
  collection,
  draft,
  global,
  observation,
  req,
  versionID,
}: {
  collection?: SanitizedCollectionConfig
  draft: boolean
  global?: SanitizedGlobalConfig
  id?: number | string
  observation: BranchWriteObservation
  req: PayloadRequest
  versionID: number | string
}): Promise<void> => {
  const config = (collection ?? global)!
  const target = {
    ...observation.target,
    ...(collection ? { parentID: id } : {}),
  }
  const { entity } = getBranchStorage({ req, target })
  const branchID = draft ? observation.workingBranchID : 'main'
  let reference = await initializeBranchVersion({
    branchID,
    isFrozen: true,
    req,
    target,
    versionID,
  })

  if (!draft) {
    // A legacy single-locale publish version can still contain sibling working content.
    // Main must select what the ordinary native write actually materialized.
    const materialized = collection
      ? await req.payload.db.findOne<{ id: number | string } & JsonObject>({
          collection: collection.slug,
          joins: false,
          locale: 'all',
          req,
          where: { id: { equals: id } },
        })
      : await req.payload.db.findGlobal({ slug: global!.slug, locale: 'all', req })

    if (!materialized) {
      throw new Error('A live branch write requires its canonical native materialization.')
    }
    const timestamp = new Date().toISOString()
    const args = {
      autosave: false,
      branchMode: true as const,
      createdAt: timestamp,
      req,
      updatedAt: timestamp,
      versionData: materialized,
    }
    const created = collection
      ? await req.payload.db.createVersion({
          ...args,
          collectionSlug: collection.slug,
          parent: id!,
        })
      : await req.payload.db.createGlobalVersion({ ...args, globalSlug: global!.slug })

    reference = await initializeBranchVersion({
      branchID,
      isFrozen: true,
      req,
      target,
      versionID: created.id,
    })
  }
  const stored = await readBranchVersion({ entity, req, versionID: reference.id })

  if (!stored || stored.branchGeneration !== reference.generation || !stored.version) {
    throw new Error('The canonical branch write revision is missing.')
  }
  const data = stored.version as JsonObject
  const fields = compileBranchScopeFields({
    blocks: req.payload.config.blocks,
    fields: config.fields,
  })
  const local = observation.readSet.filter((token) => token.branchID === branchID)
  const shared = local.find(({ scope }) => scope.type === 'shared')!
  const mainShared = observation.readSet.find(
    ({ branchID, scope }) => branchID === 'main' && scope.type === 'shared',
  )!
  const previousShared = shared.state ?? (draft ? mainShared.state : null)
  let hasSharedChange = true

  if (previousShared?.type === 'version') {
    const previous = await readBranchVersion({ entity, req, versionID: previousShared.version.id })

    if (!previous || previous.branchGeneration !== previousShared.version.generation) {
      throw new Error('The observed shared branch revision is missing or stale.')
    }
    hasSharedChange = !isDeepStrictEqual(
      projectBranchScopeData({ data: previous.version as JsonObject, fields, scope: shared.scope }),
      projectBranchScopeData({ data, fields, scope: shared.scope }),
    )
  }
  const structure =
    hasSharedChange || previousShared?.type !== 'version' ? reference : previousShared.version
  const selected = local.filter(({ scope }) =>
    scope.type === 'shared'
      ? hasSharedChange
      : !draft || req.locale === 'all' || scope.locale === req.locale,
  )
  const changes = selected.map((expected) => {
    const status =
      hasLocalizeStatusEnabled(config) && expected.scope.type === 'locale'
        ? (data._status as Record<string, unknown> | undefined)?.[expected.scope.locale]
        : data._status
    const nextState: BranchHeadState =
      !draft && expected.scope.type === 'locale' && status !== 'published'
        ? { type: 'withdrawn' }
        : {
            type: 'version',
            structure: expected.scope.type === 'locale' ? structure : null,
            version: reference,
          }
    const base: BranchHeadToken | null = draft
      ? observation.readSet.find(
          (token) =>
            token.branchID === 'main' &&
            token.scope.type === expected.scope.type &&
            (token.scope.type === 'shared' ||
              (expected.scope.type === 'locale' && token.scope.locale === expected.scope.locale)),
        )!
      : null

    const original = observation.bases.find(
      ({ scope }) =>
        scope.type === expected.scope.type &&
        (scope.type === 'shared' ||
          (expected.scope.type === 'locale' && scope.locale === expected.scope.locale)),
    )

    return { base: draft && original ? original.base : base, expected, nextState }
  })
  let visibility = await readBranchIdentityVisibility({ req, target })

  if (!visibility) {
    visibility = await createBranchIdentityVisibility({
      branchID: draft ? branchID : 'drafts',
      isLegacyDraftVisible: !draft || branchID === 'drafts',
      req,
      target,
    })
  }
  await commitBranchHeads({ changes, readSet: observation.readSet, req, target })

  if (!draft) {
    const isPublished = hasLocalizeStatusEnabled(config)
      ? Object.values((data._status ?? {}) as Record<string, unknown>).includes('published')
      : data._status === 'published'

    if (visibility.isPublished !== isPublished) {
      const updated = await updateBranchIdentityVisibility({
        expectedGeneration: visibility.generation,
        isPublished,
        req,
        target,
      })

      if (!updated) {
        throw new Error('The branch identity changed during the live write.')
      }
    }
  }
}

/** Autosave candidates are composed once by the operation, then persisted under the full head guard. */
export const persistBranchAutosave = async ({
  id,
  collection,
  global,
  now,
  observation,
  req,
  versionData,
}: {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id?: number | string
  now: string
  observation: BranchWriteObservation
  req: PayloadRequest
  versionData: JsonObject
}): Promise<JsonObject> => {
  const config = (collection ?? global)!
  const target = { ...observation.target, ...(collection ? { parentID: id } : {}) }
  const { entity } = getBranchStorage({ req, target })
  const branchID = observation.workingBranchID
  const fields = compileBranchScopeFields({
    blocks: req.payload.config.blocks,
    fields: config.fields,
  })
  const local = observation.readSet.filter((token) => token.branchID === branchID)
  const shared = local.find(({ scope }) => scope.type === 'shared')!
  const mainShared = observation.readSet.find(
    ({ branchID, scope }) => branchID === 'main' && scope.type === 'shared',
  )!
  const previousShared = shared.state ?? mainShared.state
  const hasLocales = local.some(({ scope }) => scope.type === 'locale')
  let hasSharedChange = true

  if (previousShared?.type === 'version') {
    const previous = await readBranchVersion({ entity, req, versionID: previousShared.version.id })

    if (!previous || previous.branchGeneration !== previousShared.version.generation) {
      throw new Error('The observed shared branch revision is missing or stale.')
    }
    hasSharedChange = !areBranchAutosaveScopesEqual({
      left: projectBranchScopeData({
        data: previous.version as JsonObject,
        fields,
        scope: shared.scope,
      }),
      right: projectBranchScopeData({ data: versionData, fields, scope: shared.scope }),
    })
  }
  const selected = local.filter(({ scope }) =>
    scope.type === 'shared'
      ? !hasLocales || hasSharedChange
      : req.locale === 'all' || scope.locale === req.locale,
  )
  const visibility = await readBranchIdentityVisibility({ req, target })

  if (!visibility) {
    await createBranchIdentityVisibility({
      branchID,
      isLegacyDraftVisible: branchID === 'drafts',
      req,
      target,
    })
  }

  return commitBranchAutosaveHeads({
    branchID,
    prepare: async ({ initialize, replace }) => {
      const ownership = await prepareBranchAutosave({
        branchID,
        data: versionData,
        fields,
        hasSharedChange,
        readSet: observation.readSet,
        req,
        selected,
        target,
      })
      let reference

      if (ownership) {
        reference = await replace({
          data: versionData,
          expected: ownership.reference,
          updatedAt: now,
          ...(branchID === 'drafts' ? { latest: true } : {}),
        })
      } else {
        const args = {
          autosave: true,
          ...(branchID !== 'drafts' ? { branchMode: true as const } : {}),
          createdAt: now,
          req,
          updatedAt: now,
          versionData,
        }
        const created = collection
          ? await req.payload.db.createVersion({
              ...args,
              collectionSlug: collection.slug,
              parent: id!,
            })
          : await req.payload.db.createGlobalVersion({ ...args, globalSlug: global!.slug })

        reference = await initialize({ versionID: created.id })
      }
      const stored = await readBranchVersion({ entity, req, versionID: reference.id })

      if (!stored || stored.branchGeneration !== reference.generation || !stored.version) {
        throw new Error('The canonical autosave revision is missing.')
      }
      const data = stored.version as JsonObject

      if (
        ownership &&
        !planBranchAutosaveOwnership({
          branchID,
          data,
          fields,
          hasSharedChange,
          observed: observation.readSet,
          reference: ownership.reference,
          references: ownership.closure,
          selected,
          stored: ownership.previous,
        })
      ) {
        throw new Error(
          'Native autosave canonicalization changed an unselected scope; roll back the caller transaction.',
        )
      }
      let structure = previousShared?.type === 'version' ? previousShared.version : reference

      if (hasLocales && hasSharedChange) {
        const args = {
          autosave: false,
          branchMode: true as const,
          createdAt: now,
          req,
          updatedAt: now,
          versionData: data,
        }
        const checkpoint = collection
          ? await req.payload.db.createVersion({
              ...args,
              collectionSlug: collection.slug,
              parent: id!,
            })
          : await req.payload.db.createGlobalVersion({ ...args, globalSlug: global!.slug })

        structure = await initializeBranchVersion({
          branchID,
          isFrozen: true,
          req,
          target,
          versionID: checkpoint.id,
        })
      }
      const advancing = [...selected]

      for (const expected of ownership?.closure ?? []) {
        if (!advancing.includes(expected)) {
          advancing.push(expected)
        }
      }
      const changes = advancing.map((expected) => {
        const isSelected = selected.includes(expected)
        const nextState: BranchHeadState =
          !isSelected && expected.state?.type === 'version'
            ? { ...expected.state, version: reference }
            : {
                type: 'version',
                structure: expected.scope.type === 'locale' ? structure : null,
                version: hasLocales && expected.scope.type === 'shared' ? structure : reference,
              }
        const original = observation.bases.find(
          ({ scope }) =>
            scope.type === expected.scope.type &&
            (scope.type === 'shared' ||
              (expected.scope.type === 'locale' && scope.locale === expected.scope.locale)),
        )
        const base = original
          ? original.base
          : observation.readSet.find(
              (token) =>
                token.branchID === 'main' &&
                token.scope.type === expected.scope.type &&
                (token.scope.type === 'shared' ||
                  (expected.scope.type === 'locale' &&
                    token.scope.locale === expected.scope.locale)),
            )!

        return { base, expected, nextState }
      })

      return { changes, reference, version: stored as JsonObject }
    },
    readSet: observation.readSet,
    req,
    target,
  })
}
