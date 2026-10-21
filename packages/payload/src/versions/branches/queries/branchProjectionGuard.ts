import { randomUUID } from 'node:crypto'

import type { PayloadRequest, Where } from '../../../types/index.js'
import type { BranchContentScope, BranchHeadID } from '../types.js'

import {
  assertBranchTransaction,
  getBranchKey,
  getBranchStorageKey,
} from '../storage/branchStorage.js'

export type BranchProjectionControl = {
  invalidations: string
  states: string
}

type StateRow = {
  branchKey: string
  generation: number
  id: BranchHeadID
  isInitialized: boolean
  pendingCount: number
  rowKey: string
  scopeKey: string
}

export type BranchProjectionInvalidation = {
  branchKey: string
  id: BranchHeadID
  identityKey: string
  lifetime: string
  logicalID: BranchHeadID
  revision: number
  rowKey: string
  scopeKey: string
  state: 'pending' | 'structural-conflict'
}

export type BranchProjectionGuard = {
  control: BranchProjectionControl
  observations: { generation: number; id: BranchHeadID }[]
}

export class BranchProjectionError extends Error {
  readonly code:
    | 'branch-projection-conflict'
    | 'branch-projection-not-ready'
    | 'branch-structural-conflict'

  constructor({ code }: { code: BranchProjectionError['code'] }) {
    super(
      code === 'branch-structural-conflict'
        ? 'The selected branch content requires structural conflict resolution.'
        : code === 'branch-projection-not-ready'
          ? 'The selected branch query projection is not ready.'
          : 'The selected branch content changed during the read operation.',
    )
    this.name = 'BranchProjectionError'
    this.code = code
  }
}

/** Real write dependency: snapshot readers cannot clean a cache across main publication. */
export const lockBranchProjectionMain = async ({
  control,
  req,
}: {
  control: BranchProjectionControl
  req: PayloadRequest
}): Promise<void> => {
  await assertBranchTransaction({ req })
  const state = await getOrCreateState({
    branchKey: getBranchKey({ branchID: 'main' }),
    control,
    req,
    scopeKey: 'dependency',
  })

  await advanceState({ control, pendingCount: state.pendingCount, req, state })
}

export const registerBranchProjectionScopes = async ({
  branchID,
  control,
  req,
  scopes,
}: {
  branchID: BranchHeadID
  control: BranchProjectionControl
  req: PayloadRequest
  scopes: readonly BranchContentScope[]
}): Promise<void> => {
  await assertBranchTransaction({ req })

  for (const scope of scopes) {
    await getOrCreateState({
      branchKey: getBranchKey({ branchID }),
      control,
      req,
      scopeKey: getScopeKey({ scope }),
    })
  }
}

/** Each authoritative mutation advances the query guard in its caller transaction. */
export const invalidateBranchProjection = async ({
  branchID,
  control,
  logicalID,
  req,
  scope,
}: {
  branchID: BranchHeadID
  control: BranchProjectionControl
  logicalID: BranchHeadID
  req: PayloadRequest
  scope: BranchContentScope
}): Promise<BranchProjectionInvalidation> => {
  await assertBranchTransaction({ req })
  const branchKey = getBranchKey({ branchID })
  const scopeKey = getScopeKey({ scope })
  const identityKey = getBranchStorageKey({ coordinates: [getBranchKey({ branchID: logicalID })] })
  const rowKey = getBranchStorageKey({ coordinates: [branchKey, scopeKey, identityKey] })
  const state = await getOrCreateState({ branchKey, control, req, scopeKey })
  const where = getInvalidationWhere({ branchKey, identityKey, logicalID, rowKey, scopeKey })
  const existing = await req.payload.db.findOne<BranchProjectionInvalidation>({
    collection: control.invalidations,
    req,
    where,
  })

  if (existing && existing.logicalID !== logicalID) {
    throw new BranchProjectionError({ code: 'branch-projection-conflict' })
  }

  // This real write serializes insert/remove accounting, including absent queue rows.
  await advanceState({
    control,
    pendingCount: state.pendingCount + (existing ? 0 : 1),
    req,
    state,
  })

  if (!existing) {
    return req.payload.db.create({
      collection: control.invalidations,
      data: {
        branchKey,
        identityKey,
        lifetime: randomUUID(),
        logicalID,
        revision: 1,
        rowKey,
        scopeKey,
        state: 'pending',
      },
      req,
    }) as Promise<BranchProjectionInvalidation>
  }

  assertCounter({ isPositive: true, value: existing.revision })
  const updated = await req.payload.db.updateOne({
    collection: control.invalidations,
    data: { revision: existing.revision + 1, state: 'pending' },
    options: { atomic: true },
    req,
    where: { and: [where, { revision: { equals: existing.revision } }] },
  })

  if (!updated) {
    throw new BranchProjectionError({ code: 'branch-projection-conflict' })
  }

  return updated as BranchProjectionInvalidation
}

/** Only the exact rebuilt identity revision can remove its pending work. */
export const settleBranchProjectionInvalidation = async ({
  control,
  expected,
  hasStructuralConflict = false,
  req,
}: {
  control: BranchProjectionControl
  expected: BranchProjectionInvalidation
  hasStructuralConflict?: boolean
  req: PayloadRequest
}): Promise<void> => {
  await assertBranchTransaction({ req })
  const state = await readState({ ...expected, control, req })
  const current = await req.payload.db.findOne<BranchProjectionInvalidation>({
    collection: control.invalidations,
    req,
    where: getInvalidationWhere(expected),
  })

  if (
    !state ||
    !current ||
    current.logicalID !== expected.logicalID ||
    current.revision !== expected.revision ||
    current.lifetime !== expected.lifetime ||
    state.pendingCount < 1
  ) {
    throw new BranchProjectionError({ code: 'branch-projection-conflict' })
  }

  await advanceState({
    control,
    pendingCount: state.pendingCount - (hasStructuralConflict ? 0 : 1),
    req,
    state,
  })

  if (hasStructuralConflict) {
    const updated = await req.payload.db.updateOne({
      collection: control.invalidations,
      data: { state: 'structural-conflict' },
      options: { atomic: true },
      req,
      where: {
        and: [
          { id: { equals: current.id } },
          { lifetime: { equals: current.lifetime } },
          { revision: { equals: current.revision } },
        ],
      },
    })

    if (!updated) {
      throw new BranchProjectionError({ code: 'branch-projection-conflict' })
    }
  } else {
    await req.payload.db.deleteMany({
      collection: control.invalidations,
      req,
      where: {
        and: [
          { id: { equals: current.id } },
          { lifetime: { equals: current.lifetime } },
          { revision: { equals: current.revision } },
        ],
      },
    })
  }
}

/** Bootstrap may complete only after all per-identity invalidations have settled. */
export const initializeBranchProjectionScope = async ({
  branchID,
  control,
  req,
  scope,
}: {
  branchID: BranchHeadID
  control: BranchProjectionControl
  req: PayloadRequest
  scope: BranchContentScope
}): Promise<void> => {
  await assertBranchTransaction({ req })
  const state = await getOrCreateState({
    branchKey: getBranchKey({ branchID }),
    control,
    req,
    scopeKey: getScopeKey({ scope }),
  })

  if (state.pendingCount) {
    throw new BranchProjectionError({ code: 'branch-projection-not-ready' })
  }

  await advanceState({ control, isInitialized: true, pendingCount: 0, req, state })
}

/**
 * A raw query boundary captures every reachable branchable relation before filtering.
 * Complete generation validation must run before document-dependent application hooks.
 */
export const captureBranchProjectionGuard = async ({
  branchID,
  control,
  req,
  scopes,
}: {
  branchID: BranchHeadID
  control: BranchProjectionControl
  req: PayloadRequest
  scopes: readonly BranchContentScope[]
}): Promise<BranchProjectionGuard> => {
  const branchKey = getBranchKey({ branchID })
  const scopeKeys = [...new Set(scopes.map((scope) => getScopeKey({ scope })))]

  if (!scopeKeys.length) {
    throw new Error('A branch query requires at least its shared projection scope.')
  }

  const result = await req.payload.db.find<StateRow>({
    collection: control.states,
    limit: scopeKeys.length,
    pagination: false,
    req,
    where: {
      and: [
        {
          rowKey: {
            in: scopeKeys.map((scopeKey) =>
              getBranchStorageKey({ coordinates: [branchKey, scopeKey] }),
            ),
          },
        },
        { branchKey: { equals: branchKey } },
        { scopeKey: { in: scopeKeys } },
      ],
    },
  })

  if (
    result.docs.length !== scopeKeys.length ||
    result.docs.some((state) => !state.isInitialized || state.pendingCount !== 0)
  ) {
    const conflict = await req.payload.db.findOne<BranchProjectionInvalidation>({
      collection: control.invalidations,
      req,
      where: {
        and: [
          { branchKey: { equals: branchKey } },
          { scopeKey: { in: scopeKeys } },
          { state: { equals: 'structural-conflict' } },
        ],
      },
    })

    throw new BranchProjectionError({
      code: conflict ? 'branch-structural-conflict' : 'branch-projection-not-ready',
    })
  }

  for (const row of result.docs) {
    assertCounter({ isPositive: true, value: row.generation })
  }

  return {
    control,
    observations: result.docs.map(({ id, generation }) => ({ id, generation })),
  }
}

/** Fail before decoded content reaches application hooks or callers if any generation moved. */
export const validateBranchProjectionGuard = async ({
  guard,
  req,
}: {
  guard: BranchProjectionGuard
  req: PayloadRequest
}): Promise<void> => {
  const result = await req.payload.db.find<StateRow>({
    collection: guard.control.states,
    limit: guard.observations.length,
    pagination: false,
    req,
    where: {
      or: guard.observations.map(({ id, generation }): Where => ({
        and: [
          { id: { equals: id } },
          { generation: { equals: generation } },
          { isInitialized: { equals: true } },
          { pendingCount: { equals: 0 } },
        ],
      })),
    },
  })

  if (result.docs.length !== guard.observations.length) {
    throw new BranchProjectionError({ code: 'branch-projection-conflict' })
  }
}

const advanceState = async ({
  control,
  isInitialized,
  pendingCount,
  req,
  state,
}: {
  control: BranchProjectionControl
  isInitialized?: boolean
  pendingCount: number
  req: PayloadRequest
  state: StateRow
}): Promise<void> => {
  assertCounter({ isPositive: true, value: state.generation })
  assertCounter({ isPositive: false, value: state.pendingCount })
  assertCounter({ isPositive: false, value: pendingCount })
  const updated = await req.payload.db.updateOne({
    collection: control.states,
    data: {
      generation: state.generation + 1,
      ...(isInitialized === undefined ? {} : { isInitialized }),
      pendingCount,
    },
    options: { atomic: true },
    req,
    where: {
      and: [
        { id: { equals: state.id } },
        { generation: { equals: state.generation } },
        { pendingCount: { equals: state.pendingCount } },
      ],
    },
  })

  if (!updated) {
    throw new BranchProjectionError({ code: 'branch-projection-conflict' })
  }
}

const getOrCreateState = async ({
  branchKey,
  control,
  req,
  scopeKey,
}: {
  branchKey: string
  control: BranchProjectionControl
  req: PayloadRequest
  scopeKey: string
}): Promise<StateRow> => {
  const existing = await readState({ branchKey, control, req, scopeKey })

  if (existing) {
    return existing
  }

  return req.payload.db.create({
    collection: control.states,
    data: {
      branchKey,
      generation: 1,
      isInitialized: false,
      pendingCount: 0,
      rowKey: getBranchStorageKey({ coordinates: [branchKey, scopeKey] }),
      scopeKey,
    },
    req,
  }) as Promise<StateRow>
}

const readState = async ({
  branchKey,
  control,
  req,
  scopeKey,
}: {
  branchKey: string
  control: BranchProjectionControl
  req: PayloadRequest
  scopeKey: string
}): Promise<null | StateRow> =>
  req.payload.db.findOne<StateRow>({
    collection: control.states,
    req,
    where: {
      and: [
        { rowKey: { equals: getBranchStorageKey({ coordinates: [branchKey, scopeKey] }) } },
        { branchKey: { equals: branchKey } },
        { scopeKey: { equals: scopeKey } },
      ],
    },
  })

const getInvalidationWhere = ({
  branchKey,
  identityKey,
  rowKey,
  scopeKey,
}: {
  branchKey: string
  identityKey: string
  logicalID: BranchHeadID
  rowKey: string
  scopeKey: string
}): Where => ({
  and: [
    { branchKey: { equals: branchKey } },
    { scopeKey: { equals: scopeKey } },
    { identityKey: { equals: identityKey } },
    { rowKey: { equals: rowKey } },
  ],
})

const getScopeKey = ({ scope }: { scope: BranchContentScope }): string =>
  scope.type === 'shared' ? 'shared' : `locale:${scope.locale}`

const assertCounter = ({ isPositive, value }: { isPositive: boolean; value: unknown }): void => {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < (isPositive ? 1 : 0) ||
    value === Number.MAX_SAFE_INTEGER
  ) {
    throw new Error('Invalid or exhausted branch projection generation counter.')
  }
}
