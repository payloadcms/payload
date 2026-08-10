import type { PayloadRequest } from '../types/index.js'
import type { SanitizedBranchingConfig } from './types.js'

import { MAIN_BRANCH } from './types.js'

/**
 * Per-request branch state, memoized on `req` so a page rendering many
 * collections resolves the branch once and loads the change manifest once.
 */
type BranchState = {
  branch: string
  /** Canonical shadowed document IDs, keyed by collection slug. */
  manifest: Map<string, (number | string)[]>
  manifestLoaded: boolean
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
 * admin UI's business (`initReq`), the same division `locale` already uses.
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

  const branch = resolveBranchFromRequest(req) ?? MAIN_BRANCH

  if (context) {
    context[stateKey] = { branch, manifest: new Map(), manifestLoaded: false } satisfies BranchState
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
 * Loads every change the active branch has made, in one query, and groups it
 * by collection in memory.
 *
 * One query per request rather than per collection: a request touching a dozen
 * collections still issues a single manifest read. Bounded by branch size, not
 * table size.
 */
export const loadBranchManifest = async (
  req: PayloadRequest,
): Promise<Map<string, (number | string)[]>> => {
  const branch = resolveBranch(req)
  const context = req.context as Record<string, unknown> | undefined
  const state = context?.[stateKey] as BranchState | undefined

  if (!state || branch === MAIN_BRANCH) {
    return new Map()
  }

  if (state.manifestLoaded) {
    return state.manifest
  }

  // Marked loaded up front so the manifest read below — which itself goes
  // through the adapter — cannot recurse back into loading the manifest.
  state.manifestLoaded = true

  const { docs } = await req.payload.db.find({
    collection: 'payload-branch-changes',
    limit: 0,
    pagination: false,
    req,
    where: {
      and: [{ branch: { equals: branch } }, { entityType: { equals: 'collection' } }],
    },
  })

  for (const change of docs as Record<string, any>[]) {
    const slug = change.collectionSlug as string
    const docID = change.doc?.value ?? change.doc

    if (!slug || docID === undefined || docID === null) {
      continue
    }

    const existing = state.manifest.get(slug)

    if (existing) {
      existing.push(docID)
    } else {
      state.manifest.set(slug, [docID])
    }
  }

  return state.manifest
}

/** Clears memoized branch state, for tests and for cross-branch reads. */
export const resetBranchState = (req: PayloadRequest): void => {
  const context = req.context as Record<string, unknown> | undefined

  if (context) {
    delete context[stateKey]
  }
}

/**
 * The manifest already loaded for this request, without loading it.
 *
 * For synchronous callers such as join query builders, which run after the
 * top-level read has resolved the branch and populated the manifest.
 */
export const peekBranchManifest = (req: PayloadRequest): Map<string, (number | string)[]> => {
  const context = req?.context as Record<string, unknown> | undefined
  const state = context?.[stateKey] as BranchState | undefined

  return state?.manifest ?? new Map()
}
