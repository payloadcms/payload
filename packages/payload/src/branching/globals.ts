import type { PayloadRequest, Where } from '../types/index.js'

import { resolveBranch } from './resolveBranch.js'
import { branchChangesCollectionSlug, branchField, MAIN_BRANCH } from './types.js'

type BaseArgs = {
  branch?: false | string
  globalSlug: string
  req?: Partial<PayloadRequest>
}

const bypassed = (branch: false | string | undefined, req?: Partial<PayloadRequest>): boolean =>
  branch === false ||
  !req?.payload ||
  Boolean((req.context as Record<string, unknown> | undefined)?._branchBypass)

const recordedGlobalsKey = '_branchRecordedGlobals'

const activeBranch = ({ branch, globalSlug, req }: BaseArgs): null | string => {
  if (bypassed(branch, req)) {
    return null
  }

  const branching = req!.payload!.config?.branching

  if (!branching?.enabled || !branching.branchableGlobals.has(globalSlug)) {
    return null
  }

  return branch === false ? null : (branch ?? resolveBranch(req as PayloadRequest))
}

/**
 * Branch predicate for reading a global.
 *
 * Unlike collections, this does not have to resolve everything inside one
 * query: a global is a single document, so there is no result set to paginate
 * or count and nothing a post-query step could get wrong. The query fetches the
 * branch's row and main's row together and `pickBranchGlobal` prefers the
 * branch's — one round trip, at most two rows.
 */
export const resolveBranchGlobalQuery = ({
  branch,
  globalSlug,
  req,
  where,
}: { where: undefined | Where } & BaseArgs): undefined | Where => {
  const active = activeBranch({ branch, globalSlug, req })

  if (!active) {
    return where
  }

  const base = where && Object.keys(where).length ? [where] : []

  if (active === MAIN_BRANCH) {
    return { and: [...base, { [branchField]: { equals: MAIN_BRANCH } }] }
  }

  return { and: [...base, { [branchField]: { in: [active, MAIN_BRANCH] } }] }
}

/** True when the read should fetch two rows so the branch's copy can win. */
export const branchGlobalNeedsBothRows = (args: BaseArgs): boolean => {
  const active = activeBranch(args)

  return Boolean(active) && active !== MAIN_BRANCH
}

/** Picks the branch's copy of a global when it has one, else main's. */
export const pickBranchGlobal = <T extends Record<string, any>>(
  docs: T[],
  branch: string,
): T | undefined => docs.find((doc) => doc?.[branchField] === branch) ?? docs[0]

/**
 * The branch a global write should be scoped to, or `null` on main.
 *
 * Storage differs too much between adapters to upsert the branch's copy here —
 * Mongo keeps every global in one discriminated collection, Drizzle gives each
 * its own table — so each adapter performs the upsert and calls
 * `recordBranchGlobalChange` once it has.
 */
export const resolveBranchGlobalWrite = (args: BaseArgs): null | string => {
  const active = activeBranch(args)

  return active && active !== MAIN_BRANCH ? active : null
}

/** Registers a global as changed on a branch, if it is not already. */
export const recordBranchGlobalChange = async ({
  branch,
  globalSlug,
  req,
}: { branch: string } & BaseArgs): Promise<void> => {
  // Every write to a branched global asks whether it is already registered. The answer
  // cannot change within a request except by this function, so it is remembered — which
  // matters for a request that writes several globals, or one global repeatedly.
  const context = req!.context as Record<string, unknown> | undefined
  const recorded = (context?.[recordedGlobalsKey] as Set<string> | undefined) ?? new Set<string>()
  const key = `${branch}:${globalSlug}`

  if (context && !context[recordedGlobalsKey]) {
    context[recordedGlobalsKey] = recorded
  }

  if (recorded.has(key)) {
    return
  }

  const existing = await req!.payload!.find({
    collection: branchChangesCollectionSlug,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req: req as PayloadRequest,
    where: {
      and: [{ branch: { equals: branch } }, { globalSlug: { equals: globalSlug } }],
    },
  })

  if (existing.docs.length) {
    recorded.add(key)

    return
  }

  await req!.payload!.create({
    collection: branchChangesCollectionSlug,
    data: {
      branch,
      entityType: 'global',
      globalSlug,
      operation: 'update',
    },
    overrideAccess: true,
    req: req as PayloadRequest,
  })

  recorded.add(key)
}

/**
 * Branch predicate for global version reads.
 *
 * Strict equality rather than the read-through used for the global itself: a
 * version list must not interleave two branches' histories, and ordering by
 * timestamp would pick between them nondeterministically. A branch that has
 * never touched the global simply has no versions of it, and the global read
 * still falls back to main.
 */
export const resolveBranchGlobalVersionQuery = ({
  branch,
  globalSlug,
  req,
  where,
}: { where: undefined | Where } & BaseArgs): undefined | Where => {
  const active = activeBranch({ branch, globalSlug, req })

  if (!active) {
    return where
  }

  const base = where && Object.keys(where).length ? [where] : []

  return { and: [...base, { [branchField]: { equals: active } }] }
}
