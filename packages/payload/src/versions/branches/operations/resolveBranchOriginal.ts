import type { TypeWithID } from '../../../collections/config/types.js'
import type { JsonObject, PayloadRequest, Sort, Where } from '../../../types/index.js'
import type { BranchHeadID } from '../types.js'
import type { BranchWriteObservation } from '../writes/prepareBranchWrite.js'

import { areBranchHeadTokensEqual } from '../compareBranchHeads.js'
import { queryBranchContent } from '../queries/queryBranchContent.js'
import { createBranchGlobalSourceRequest } from '../queries/queryBranchGlobal.js'
import { withBranchReadSnapshot } from '../queries/withBranchReadSnapshot.js'
import { readBranchHeads } from '../storage/branchHeadStore.js'
import { readBranchIdentityVisibility } from '../storage/branchIdentityStore.js'
import { getBranchStorage } from '../storage/branchStorage.js'
import { readBranchVersion } from '../storage/branchVersionStore.js'
import { createBranchOriginalPolicy } from './branchOriginalPolicy.js'
import { getSelectedBranch } from './selectedBranchContext.js'

/** Update/restore policy was already evaluated; related read policies remain independent. */
export const resolveBranchOriginal = async ({
  collection,
  global,
  observation,
  overrideAccess = false,
  req,
  userWhere,
  where,
}: {
  collection?: string
  global?: string
  observation: BranchWriteObservation
  overrideAccess?: boolean
  req: PayloadRequest
  userWhere?: Where
  where?: Where
}): Promise<Record<string, unknown> | undefined> => {
  return withBranchReadSnapshot({
    locale: req.locale ?? undefined,
    read: async ({ req }) => {
      if (global && observation.readSet.every(({ state }) => state === null)) {
        const existing = await req.payload.db.findGlobal({ slug: global, locale: 'all', req })
        const history = await req.payload.db.findGlobalVersions({ global, limit: 1, req })
        if (existing && Object.keys(existing).length > 0) {
          throw new Error('Authoritative global heads are missing for existing content or history.')
        }
        if (history.docs.length > 0) {
          const visibility = await readBranchIdentityVisibility({ req, target: observation.target })
          const owner = visibility
            ? await req.payload.db.findOne({
                collection: observation.target.collection,
                req,
                where: {
                  and: [
                    { branchKey: { equals: visibility.ownerKey } },
                    { state: { equals: 'version' } },
                  ],
                },
              })
            : null
          if (!owner) {
            throw new Error(
              'Authoritative global heads are missing for existing content or history.',
            )
          }
        }
        return undefined
      }
      const source = global
        ? createBranchGlobalSourceRequest({ global, req })
        : { scopedReq: req, sourceSlug: collection! }
      const branchID = observation.workingBranchID
      const result = await queryBranchContent({
        branchID,
        collection: source.sourceSlug,
        joins: false,
        limit: 1,
        locale: req.locale ?? undefined,
        originalPolicy: createBranchOriginalPolicy({
          branchID,
          collection: source.sourceSlug,
          overrideAccess,
          req: source.scopedReq,
          where: where ?? {},
        }),
        pagination: false,
        req: source.scopedReq,
        sort: 'id',
        where: userWhere,
      })
      const doc = result.docs[0]
      if (doc) {
        await normalizeBranchOriginal({
          branchID,
          doc,
          readSet: observation.readSet,
          req,
          target: observation.target,
        })
      }
      const verified = await readBranchHeads({
        req,
        selections: observation.readSet.map(({ branchID, scope }) => ({ branchID, scope })),
        target: observation.target,
      })
      if (
        observation.readSet.some(
          (token, index) => !areBranchHeadTokensEqual({ left: token, right: verified[index]! }),
        )
      ) {
        throw new Error('Branch batch observation changed while resolving the operation original.')
      }
      return doc
    },
    req,
  })
}

/** Unknown bulk identities are observed inside the same raw selection snapshot. */
export const queryBranchOriginalCandidates = async ({
  access,
  collection,
  limit,
  overrideAccess = false,
  readBranchID,
  req,
  sort,
  where,
}: {
  access?: Where
  collection: string
  limit: number
  overrideAccess?: boolean
  readBranchID?: BranchHeadID
  req: PayloadRequest
  sort?: Sort
  where: Where
}) =>
  withBranchReadSnapshot({
    locale: req.locale ?? undefined,
    read: async ({ req: snapshotReq }) => {
      const workingBranchID = getSelectedBranch({ req }) ?? 'drafts'
      const branchID = readBranchID ?? workingBranchID
      const result = await queryBranchContent({
        branchID,
        collection,
        joins: false,
        limit,
        locale: req.locale ?? undefined,
        originalPolicy: createBranchOriginalPolicy({
          branchID,
          collection,
          overrideAccess,
          req: snapshotReq,
          where: access ?? {},
        }),
        pagination: false,
        req: snapshotReq,
        sort,
        where,
      })
      const scopes = [
        { type: 'shared' as const },
        ...(req.payload.config.localization
          ? req.payload.config.localization.localeCodes.map((locale) => ({
              type: 'locale' as const,
              locale,
            }))
          : []),
      ]
      const selections = scopes.flatMap((scope) => [
        { branchID: 'main', scope },
        { branchID: workingBranchID, scope },
      ])
      const observations = new Map<BranchHeadID, import('../types.js').BranchHeadToken[]>()
      for (const doc of result.docs) {
        const target = {
          collection: req.payload.collections[collection]!.config.custom.branchStorage.heads,
          parentID: doc.id as BranchHeadID,
        }
        const tokens = await readBranchHeads({ req: snapshotReq, selections, target })
        observations.set(doc.id as BranchHeadID, tokens)
        await normalizeBranchOriginal({ branchID, doc, readSet: tokens, req: snapshotReq, target })
      }
      return { docs: result.docs as (JsonObject & TypeWithID)[], observations }
    },
    req,
  })

/** Restore native presence and latest effective timestamps without changing content selection. */
const normalizeBranchOriginal = async ({
  branchID,
  doc,
  readSet,
  req,
  target,
}: {
  branchID: BranchHeadID
  doc: Record<string, unknown>
  readSet: BranchWriteObservation['readSet']
  req: PayloadRequest
  target: BranchWriteObservation['target']
}): Promise<Record<string, unknown>> => {
  if (doc) {
    const { entity } = getBranchStorage({ req, target })
    const selected = readSet.filter((token) => token.branchID === branchID)
    const hasMainShared = readSet.some(
      (token) =>
        token.branchID === 'main' &&
        token.scope.type === 'shared' &&
        token.state?.type === 'version',
    )
    const materialized =
      hasMainShared && (branchID === 'main' || selected.some((token) => token.state === null))
        ? entity.type === 'collection'
          ? await req.payload.db.findOne({
              collection: entity.slug,
              joins: false,
              locale: 'all',
              req,
              where: { id: { equals: entity.parentID } },
            })
          : await req.payload.db.findGlobal({ slug: entity.slug, locale: 'all', req })
        : undefined
    if (
      typeof materialized?.updatedAt === 'string' &&
      (typeof doc.updatedAt !== 'string' || materialized.updatedAt > doc.updatedAt)
    ) {
      doc.updatedAt = materialized.updatedAt
    }
    for (const token of selected) {
      let state =
        token.state ??
        readSet.find(
          (main) =>
            main.branchID === 'main' &&
            main.scope.type === token.scope.type &&
            (main.scope.type === 'shared' ||
              (token.scope.type === 'locale' && main.scope.locale === token.scope.locale)),
        )?.state
      if (state?.type !== 'version' && token.scope.type === 'locale') {
        state =
          readSet.find((head) => head.branchID === branchID && head.scope.type === 'shared')
            ?.state ??
          readSet.find((head) => head.branchID === 'main' && head.scope.type === 'shared')?.state
      }
      if (state?.type !== 'version') {
        continue
      }
      const stored = await readBranchVersion({ entity, req, versionID: state.version.id })
      if (!stored || stored.branchGeneration !== state.version.generation) {
        throw new Error('The selected original revision is missing or stale.')
      }
      const data = stored.version as Record<string, unknown>
      if (entity.type === 'global' && token.scope.type === 'shared') {
        if (Object.hasOwn(data, 'id')) {
          doc.id = data.id
        } else {
          delete doc.id
        }
      }
      if (
        token.scope.type === 'locale' &&
        doc._status &&
        typeof doc._status === 'object' &&
        !Array.isArray(doc._status)
      ) {
        const status = (
          materialized && (branchID === 'main' || token.state === null) ? materialized : data
        )._status
        if (!status || typeof status !== 'object' || !Object.hasOwn(status, token.scope.locale)) {
          delete (doc._status as Record<string, unknown>)[token.scope.locale]
        }
      }
      if (
        typeof data.updatedAt === 'string' &&
        (typeof doc.updatedAt !== 'string' || data.updatedAt > doc.updatedAt)
      ) {
        doc.updatedAt = data.updatedAt
      }
    }
  }
  return doc
}
