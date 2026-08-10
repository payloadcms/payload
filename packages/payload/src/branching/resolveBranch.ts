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
 * Precedence, highest first:
 *   1. explicit Local API argument (`req.branch`, set by the caller)
 *   2. `branch` query param
 *   3. `X-Payload-Branch` header
 *   4. `payload-branch` cookie
 *   5. `main`
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

  let branch: string = MAIN_BRANCH

  if (typeof req.branch === 'string' && req.branch) {
    branch = req.branch
  } else if (typeof req.query?.branch === 'string' && req.query.branch) {
    branch = req.query.branch
  } else {
    const header = req.headers?.get?.('x-payload-branch')

    if (header) {
      branch = header
    } else {
      const cookie = req.headers?.get?.('cookie')
      const match = cookie?.match(/(?:^|;\s*)payload-branch=([^;]+)/)

      if (match?.[1]) {
        branch = decodeURIComponent(match[1])
      }
    }
  }

  if (context) {
    context[stateKey] = { branch, manifest: new Map(), manifestLoaded: false } satisfies BranchState
  }

  req.branch = branch

  return branch
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
