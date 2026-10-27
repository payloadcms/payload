import type { PayloadRequest } from '../types/index.js'

import type { BranchOperation, SanitizedBranchingConfig } from './types.js'

import { branchesCollectionSlug, MAIN_BRANCH } from './types.js'

/**
 * Per-request branch state, memoized on `req` so a page rendering many
 * collections resolves the branch once and loads the change manifest once.
 */
type BranchState = {
  branch: string
  /** The branch's own row, read once per request rather than per check. */
  branchRow?: null | Record<string, unknown>
  /** Canonical IDs tombstoned on this branch, keyed by collection slug. */
  deleted: Map<string, (number | string)[]>
  /** Canonical shadowed document IDs, keyed by collection slug. */
  manifest: Map<string, (number | string)[]>
  manifestLoaded: boolean
  /** Change-record operation keyed by collection and canonical document ID. */
  operations: Map<string, BranchOperation>
  /** Canonical ID → shadow row primary key, for the writes that resolved it. */
  rowIDs: Map<string, number | string>
}

const stateKey = '_branchState'

const getBranchingConfig = (req: PayloadRequest): SanitizedBranchingConfig | undefined =>
  req?.payload?.config?.branching

/**
 * Resolves the active branch for a request.
 *
 * The branch is an argument, exactly like `locale` and `depth`: it is whatever
 * the caller passed, and `main` when they passed nothing. Nothing is read from
 * storage here — no preference lookup, no cookie — so an unbranched request
 * costs nothing beyond this function.
 *
 * Where the admin UI's persisted selection turns into that argument is the
 * admin UI's business (`initAdminContext`), the same division `locale` already uses.
 *
 * Precedence, highest first:
 *   1. explicit Local API argument (`req.branch`, set by the caller)
 *   2. `branch` query param
 *   3. `main`
 */
export const resolveBranch = (req: PayloadRequest): string => {
  const branching = getBranchingConfig(req)

  if (!branching?.enabled) {
    return MAIN_BRANCH
  }

  const context = req.context as Record<string, unknown> | undefined
  const existing = context?.[stateKey] as BranchState | undefined

  if (existing) {
    return existing.branch
  }

  // The bypass sentinel `createPayloadRequest` sets for `branch: false`. Honoured here and not
  // only at the database layer, because a request told to ignore branching must not
  // report a branch to anything that asks — a `branch: false` request built from an HTTP
  // request still carries `?branch=` in its query, and falling through to it made the
  // merge engine resolve against the very branch it was merging.
  if (context?._branchBypass) {
    req.branch = MAIN_BRANCH

    return MAIN_BRANCH
  }

  const branch = resolveBranchFromRequest(req) ?? MAIN_BRANCH

  if (context) {
    context[stateKey] = {
      branch,
      deleted: new Map(),
      manifest: new Map(),
      manifestLoaded: false,
      operations: new Map(),
      rowIDs: new Map(),
    } satisfies BranchState
  }

  req.branch = branch

  return branch
}

/**
 * The branch the caller asked for, whether through the Local API option or the
 * `branch` query param — the same two ways `locale` is supplied.
 */
const resolveBranchFromRequest = (req: PayloadRequest): string | undefined => {
  if (typeof req.branch === 'string' && req.branch) {
    return req.branch
  }

  if (typeof req.query?.branch === 'string' && req.query.branch) {
    return req.query.branch
  }

  return undefined
}

/**
 * The branch's own row, read once per request.
 *
 * Three separate checks want it — whether the branch is closed, whether a merged branch
 * should reopen, and whether the caller may see it at all — and each used to read it
 * again. This is the trusted read (`overrideAccess: true`), so it deliberately does *not*
 * serve the access-checked visibility gate: a row fetched without access control must
 * never stand in for one fetched with it.
 */
export const loadBranchRow = async ({
  branch,
  req,
}: {
  branch: string
  req: PayloadRequest
}): Promise<null | Record<string, unknown>> => {
  const context = req.context as Record<string, unknown> | undefined
  const state = context?.[stateKey] as BranchState | undefined

  if (state && state.branch === branch && state.branchRow !== undefined) {
    return state.branchRow
  }

  const { docs } = await req.payload.find({
    collection: branchesCollectionSlug,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    select: { slug: true, status: true },
    where: { slug: { equals: branch } },
  })

  const row = (docs[0] as Record<string, unknown> | undefined) ?? null

  if (state && state.branch === branch) {
    state.branchRow = row
  }

  return row
}

/** Clears memoized branch state, for tests and for cross-branch reads. */
export const resetBranchState = (req: PayloadRequest): void => {
  const context = req.context as Record<string, unknown> | undefined

  if (context) {
    delete context[stateKey]
  }
}
