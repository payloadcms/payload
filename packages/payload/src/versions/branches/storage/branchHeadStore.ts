import { randomUUID } from 'node:crypto'

import type { JsonObject, PayloadRequest, Where } from '../../../types/index.js'
import type {
  BranchContentScope,
  BranchHead,
  BranchHeadID,
  BranchHeadState,
  BranchHeadToken,
  BranchVersionReference,
} from '../types.js'
import type { BranchStorageTarget } from './branchStorage.js'

import { areBranchHeadTokensEqual } from '../compareBranchHeads.js'
import { maintainBranchProjections } from '../queries/branchProjectionStore.js'
import {
  assertBranchTransaction,
  getBranchKey,
  getBranchStorage,
  getBranchStorageKey,
} from './branchStorage.js'
import {
  initializeBranchVersion,
  pinBranchVersion,
  readBranchVersion,
} from './branchVersionStore.js'
import { decodeBranchHead } from './decodeBranchHead.js'

export const readBranchHead = async (args: {
  branchID: BranchHeadID
  req: PayloadRequest
  scope: BranchContentScope
  target: BranchStorageTarget
}): Promise<BranchHead | null> => {
  getBranchStorage({ req: args.req, target: args.target })
  const row = await args.req.payload.db.findOne<{ [key: string]: unknown; id: number | string }>({
    collection: args.target.collection,
    req: args.req,
    where: getHeadWhere(args),
  })

  return row && row.state !== 'absent'
    ? decodeBranchHead({ branchID: args.branchID, row, scope: args.scope })
    : null
}

/** Absence retains its durable incarnation after discard. */
export const readBranchHeadToken = async ({
  branchID,
  req,
  scope,
  target,
}: {
  branchID: BranchHeadID
  req: PayloadRequest
  scope: BranchContentScope
  target: BranchStorageTarget
}): Promise<BranchHeadToken> => {
  getBranchStorage({ req, target })
  const row = await req.payload.db.findOne<{ [key: string]: unknown; id: number | string }>({
    collection: target.collection,
    req,
    where: getHeadWhere({ branchID, scope, target }),
  })

  if (!row || row.state === 'absent') {
    const incarnation = row ? getIncarnation({ value: row.incarnation }) : 0

    return { branchID, generation: null, incarnation, scope, state: null }
  }

  const head = decodeBranchHead({ branchID, row, scope })

  return {
    branchID,
    generation: head.generation,
    incarnation: head.incarnation ?? 0,
    scope,
    state: head.state,
  }
}

/** Trusted primitive: freezes content and guards the complete expected state in a caller transaction. */
export const writeBranchHead = async (args: {
  base?: BranchHeadToken | null
  expected: BranchHeadToken
  nextState: BranchHeadState
  req: PayloadRequest
  target: BranchStorageTarget
}): Promise<BranchHead | null> => writeBranchHeadRecord(args)

const writeBranchHeadRecord = async ({
  base,
  expected,
  mutableReference,
  nextState,
  req,
  shouldMaintainProjection = true,
  target,
}: {
  base?: BranchHeadToken | null
  expected: BranchHeadToken
  mutableReference?: BranchVersionReference
  nextState: BranchHeadState
  req: PayloadRequest
  shouldMaintainProjection?: boolean
  target: BranchStorageTarget
}): Promise<BranchHead | null> => {
  await assertBranchTransaction({ req })
  getBranchStorage({ req, target })
  const incarnation = getIncarnation({ value: expected.incarnation ?? 0 })

  if (
    expected.generation !== null &&
    (!Number.isSafeInteger(expected.generation) ||
      expected.generation < 1 ||
      expected.generation === Number.MAX_SAFE_INTEGER)
  ) {
    throw new Error('Cannot advance an invalid or exhausted branch head generation.')
  }

  const generation = expected.generation === null ? 1 : expected.generation + 1
  const version = nextState.type === 'version' ? nextState.version : null
  const structure = nextState.type === 'version' ? nextState.structure : null
  const data = {
    ...(base !== undefined ? { base } : {}),
    generation,
    incarnation,
    state: nextState.type,
    structureVersionGeneration: structure?.generation ?? null,
    structureVersionID: structure?.id ?? null,
    versionGeneration: version?.generation ?? null,
    versionID: version?.id ?? null,
  }

  decodeBranchHead({ branchID: expected.branchID, row: data, scope: expected.scope })
  const current = await readBranchHeadToken({
    branchID: expected.branchID,
    req,
    scope: expected.scope,
    target,
  })

  if (!areBranchHeadTokensEqual({ left: current, right: expected })) {
    return null
  }

  if (
    expected.state?.type === 'version' &&
    (!mutableReference || expected.state.version.id !== mutableReference.id)
  ) {
    await freezeRetiredBranchVersion({ reference: expected.state.version, req, target })
  }

  if (version) {
    const rootKey = `head:${getBranchKey({ branchID: expected.branchID })}:${getScopeKey({ scope: expected.scope })}:${incarnation}:${generation}`

    if (
      !mutableReference ||
      version.id !== mutableReference.id ||
      version.generation !== mutableReference.generation
    ) {
      await pinBranchVersion({ reference: version, req, rootKey, target })
    }
    if (structure) {
      await pinBranchVersion({ reference: structure, req, rootKey: `${rootKey}:structure`, target })
    }
  }

  if (base?.state?.type === 'version') {
    const rootKey = `base:${JSON.stringify([getBranchKey({ branchID: expected.branchID }), getScopeKey({ scope: expected.scope }), incarnation, generation])}`

    await pinBranchVersion({ reference: base.state.version, req, rootKey, target })

    if (base.state.structure) {
      await pinBranchVersion({
        reference: base.state.structure,
        req,
        rootKey: `${rootKey}:structure`,
        target,
      })
    }
  }

  const where = getHeadWhere({ branchID: expected.branchID, scope: expected.scope, target })
  const existing = await req.payload.db.findOne<{ [key: string]: unknown; id: number | string }>({
    collection: target.collection,
    req,
    where,
  })

  if (!existing) {
    if (expected.generation !== null || incarnation !== 0) {
      return null
    }

    const row = await req.payload.db.create({
      collection: target.collection,
      data: {
        ...data,
        base: base ?? null,
        branchKey: getBranchKey({ branchID: expected.branchID }),
        coordinateKey: getHeadCoordinateKey({
          branchID: expected.branchID,
          scope: expected.scope,
          target,
        }),
        ...(target.parentID !== undefined ? { parent: target.parentID } : {}),
        scopeKey: getScopeKey({ scope: expected.scope }),
      },
      req,
    })

    if (shouldMaintainProjection) {
      await maintainBranchProjections({ branchID: expected.branchID, req, target })
    }

    return decodeBranchHead({ branchID: expected.branchID, row, scope: expected.scope })
  }

  const row = await req.payload.db.updateOne({
    collection: target.collection,
    data,
    options: { atomic: true },
    req,
    where: {
      and: [
        where,
        { incarnation: { equals: incarnation } },
        ...(expected.generation === null
          ? [{ state: { equals: 'absent' } }]
          : [{ generation: { equals: expected.generation } }, { state: { not_equals: 'absent' } }]),
      ],
    },
  })

  if (row && shouldMaintainProjection) {
    await maintainBranchProjections({ branchID: expected.branchID, req, target })
  }

  return row ? decodeBranchHead({ branchID: expected.branchID, row, scope: expected.scope }) : null
}

/** Logical removal updates one durable row; physical deletion would reintroduce ABA. */
export const discardBranchHead = async ({
  expected,
  req,
  target,
}: {
  expected: BranchHeadToken
  req: PayloadRequest
  target: BranchStorageTarget
}): Promise<BranchHeadToken | null> => {
  await assertBranchTransaction({ req })
  getBranchStorage({ req, target })
  const incarnation = getIncarnation({ value: expected.incarnation ?? 0 })

  if (incarnation === Number.MAX_SAFE_INTEGER) {
    throw new Error('Cannot advance an exhausted branch incarnation.')
  }

  const current = await readBranchHeadToken({
    branchID: expected.branchID,
    req,
    scope: expected.scope,
    target,
  })

  if (!areBranchHeadTokensEqual({ left: current, right: expected })) {
    return null
  }

  if (expected.generation === null) {
    return current
  }

  if (expected.state?.type === 'version') {
    await freezeRetiredBranchVersion({ reference: expected.state.version, req, target })
  }
  const row = await req.payload.db.updateOne({
    collection: target.collection,
    data: {
      base: null,
      generation: null,
      incarnation: incarnation + 1,
      state: 'absent',
      structureVersionGeneration: null,
      structureVersionID: null,
      versionGeneration: null,
      versionID: null,
    },
    options: { atomic: true },
    req,
    where: {
      and: [
        getHeadWhere({ branchID: expected.branchID, scope: expected.scope, target }),
        { generation: { equals: expected.generation } },
        { incarnation: { equals: incarnation } },
        { state: { not_equals: 'absent' } },
      ],
    },
  })

  if (row) {
    await maintainBranchProjections({ branchID: expected.branchID, req, target })
  }

  return row
    ? {
        branchID: expected.branchID,
        generation: null,
        incarnation: incarnation + 1,
        scope: expected.scope,
        state: null,
      }
    : null
}

export const readBranchHeads = async ({
  req,
  selections,
  target,
}: {
  req: PayloadRequest
  selections: readonly { branchID: BranchHeadID; scope: BranchContentScope }[]
  target: BranchStorageTarget
}): Promise<BranchHeadToken[]> => {
  getBranchStorage({ req, target })

  if (!selections.length) {
    return []
  }

  const result = await req.payload.db.find<Record<string, unknown>>({
    collection: target.collection,
    limit: selections.length,
    pagination: false,
    req,
    where: {
      or: selections.map(({ branchID, scope }) => getHeadWhere({ branchID, scope, target })),
    },
  })
  const rows = new Map(
    result.docs.map((row) => [JSON.stringify([row.branchKey, row.scopeKey]), row]),
  )

  return selections.map(({ branchID, scope }) => {
    const row = rows.get(JSON.stringify([getBranchKey({ branchID }), getScopeKey({ scope })]))

    if (!row || row.state === 'absent') {
      return {
        branchID,
        generation: null,
        incarnation: row ? getIncarnation({ value: row.incarnation }) : 0,
        scope,
        state: null,
      }
    }

    const head = decodeBranchHead({ branchID, row, scope })

    return {
      branchID,
      generation: head.generation,
      incarnation: head.incarnation ?? 0,
      scope,
      state: head.state,
    }
  })
}

/**
 * Lock every observed row, including inherited absence, before applying a batch. A nonce write
 * makes read dependencies participate in native transaction conflict detection (avoids write skew).
 * A conflict is thrown so the owner must roll back the whole transaction; no partial success commits.
 */
export const commitBranchHeads = async ({
  changes,
  readSet,
  req,
  target,
}: {
  changes: readonly {
    base?: BranchHeadToken | null
    expected: BranchHeadToken
    nextState: BranchHeadState | null
  }[]
  readSet: readonly BranchHeadToken[]
  req: PayloadRequest
  target: BranchStorageTarget
}): Promise<readonly BranchHeadToken[]> => {
  await lockBranchHeadReadSet({
    readSet: [...readSet, ...changes.map(({ expected }) => expected)],
    req,
    target,
  })

  const results: BranchHeadToken[] = []

  for (const change of changes) {
    const result =
      change.nextState === null
        ? await discardBranchHead({ expected: change.expected, req, target })
        : await writeBranchHead({ ...change, nextState: change.nextState, req, target })

    if (!result) {
      throw new Error('Branch batch observation changed; roll back the caller transaction.')
    }

    results.push({
      branchID: result.branchID,
      generation: result.generation,
      incarnation: result.incarnation ?? 0,
      scope: result.scope,
      state: result.state,
    } as BranchHeadToken)
  }

  return results
}

/** Owner-only path: guard the complete read set before native replacement and rebuild once. */
export const commitBranchAutosaveHeads = async ({
  branchID,
  prepare,
  readSet,
  req,
  target,
}: {
  branchID: BranchHeadID
  prepare: (args: {
    initialize: (args: { versionID: BranchHeadID }) => Promise<BranchVersionReference>
    replace: (args: {
      data: JsonObject
      expected: BranchVersionReference
      latest?: boolean
      updatedAt: string
    }) => Promise<BranchVersionReference>
  }) => Promise<{
    changes: readonly {
      base?: BranchHeadToken | null
      expected: BranchHeadToken
      nextState: BranchHeadState
    }[]
    reference: BranchVersionReference
    version: JsonObject
  }>
  readSet: readonly BranchHeadToken[]
  req: PayloadRequest
  target: BranchStorageTarget
}): Promise<JsonObject> => {
  await lockBranchHeadReadSet({ readSet, req, target })
  const { entity } = getBranchStorage({ req, target })
  let mutableReference: BranchVersionReference | undefined
  let isPreparing = true
  let hasMutationStarted = false
  const assertMutationAvailable = () => {
    if (!isPreparing || hasMutationStarted) {
      throw new Error(
        'An autosave transition requires exactly one operation-scoped native mutation.',
      )
    }
    hasMutationStarted = true
  }
  let prepared: Awaited<ReturnType<typeof prepare>>

  try {
    prepared = await prepare({
      initialize: async ({ versionID }) => {
        assertMutationAvailable()
        mutableReference = Object.freeze(
          await initializeBranchVersion({ branchID, isFrozen: false, req, target, versionID }),
        )

        return mutableReference
      },
      replace: async ({ data, expected, latest, updatedAt }) => {
        assertMutationAvailable()
        if (
          !readSet.some(
            (token) =>
              token.branchID === branchID &&
              token.state?.type === 'version' &&
              token.state.version.id === expected.id &&
              token.state.version.generation === expected.generation,
          )
        ) {
          throw new Error('Only an observed attached owner autosave can be replaced.')
        }
        const updated = await req.payload.db.branching!.mutateVersion({
          entity,
          expected,
          mutation: {
            type: 'replace',
            data,
            envelope: { updatedAt, ...(latest !== undefined ? { latest } : {}) },
            ownerKey: getBranchKey({ branchID }),
          },
          req,
        })

        if (!updated) {
          throw new Error('Autosave version revision changed or was pinned concurrently.')
        }
        mutableReference = Object.freeze({ id: expected.id, generation: expected.generation + 1 })

        return mutableReference
      },
    })
  } finally {
    isPreparing = false
  }
  if (!mutableReference || prepared.reference !== mutableReference) {
    throw new Error('Mutable head attachment requires this operation’s native generation CAS.')
  }
  const stored = await readBranchVersion({ entity, req, versionID: prepared.reference.id })

  if (
    !stored ||
    stored.autosave !== true ||
    stored.branchFrozen !== false ||
    stored.branchOwnerKey !== getBranchKey({ branchID }) ||
    stored.branchGeneration !== prepared.reference.generation
  ) {
    throw new Error('Mutable branch heads require an exact owned autosave revision.')
  }

  for (const change of prepared.changes) {
    if (
      change.expected.branchID !== branchID ||
      !readSet.some((token) => areBranchHeadTokensEqual({ left: token, right: change.expected }))
    ) {
      throw new Error('An autosave cannot advance an unobserved or differently owned head.')
    }
    const result = await writeBranchHeadRecord({
      ...change,
      mutableReference: prepared.reference,
      req,
      shouldMaintainProjection: false,
      target,
    })

    if (!result) {
      throw new Error('Autosave head observation changed; roll back the caller transaction.')
    }
  }
  const committedReference = mutableReference
  const references = await req.payload.db.find<Record<string, unknown>>({
    collection: target.collection,
    limit: 0,
    pagination: false,
    req,
    where: {
      and: [
        ...(target.parentID !== undefined ? [{ parent: { equals: target.parentID } }] : []),
        {
          or: [
            { versionID: { equals: committedReference.id } },
            { structureVersionID: { equals: committedReference.id } },
          ],
        },
      ],
    },
  })

  if (
    !references.docs.length ||
    references.docs.some(
      (row) =>
        row.state !== 'version' ||
        row.branchKey !== getBranchKey({ branchID }) ||
        row.versionID !== committedReference.id ||
        row.versionGeneration !== committedReference.generation ||
        row.structureVersionID === committedReference.id,
    )
  ) {
    throw new Error('An autosave transition must advance its complete content ownership closure.')
  }
  const finalVersion = await readBranchVersion({ entity, req, versionID: committedReference.id })

  if (
    finalVersion?.branchFrozen !== false ||
    finalVersion.branchGeneration !== committedReference.generation
  ) {
    throw new Error('An autosave reference cannot also be an immutable structural or base root.')
  }
  await maintainBranchProjections({ branchID, req, target })

  return prepared.version
}

const lockBranchHeadReadSet = async ({
  readSet,
  req,
  target,
}: {
  readSet: readonly BranchHeadToken[]
  req: PayloadRequest
  target: BranchStorageTarget
}): Promise<void> => {
  await assertBranchTransaction({ req })
  getBranchStorage({ req, target })
  const observations = new Map<string, BranchHeadToken>()

  for (const token of readSet) {
    const key = JSON.stringify([
      getBranchKey({ branchID: token.branchID }),
      getScopeKey({ scope: token.scope }),
    ])
    const existing = observations.get(key)

    if (existing && !areBranchHeadTokensEqual({ left: existing, right: token })) {
      throw new Error('A branch batch contains inconsistent observations.')
    }

    observations.set(key, token)
  }

  for (const [, token] of [...observations].sort(([left], [right]) => left.localeCompare(right))) {
    const current = await readBranchHeadToken({
      branchID: token.branchID,
      req,
      scope: token.scope,
      target,
    })

    if (!areBranchHeadTokensEqual({ left: current, right: token })) {
      throw new Error('Branch batch observation changed; roll back the caller transaction.')
    }

    const where = getHeadWhere({ branchID: token.branchID, scope: token.scope, target })
    const existing = await req.payload.db.findOne({ collection: target.collection, req, where })

    if (!existing) {
      await req.payload.db.create({
        collection: target.collection,
        data: {
          branchKey: getBranchKey({ branchID: token.branchID }),
          coordinateKey: getHeadCoordinateKey({
            branchID: token.branchID,
            scope: token.scope,
            target,
          }),
          scopeKey: getScopeKey({ scope: token.scope }),
          ...(target.parentID !== undefined ? { parent: target.parentID } : {}),
          generation: null,
          incarnation: token.incarnation ?? 0,
          lockNonce: randomUUID(),
          state: 'absent',
        },
        req,
      })
    } else {
      const locked = await req.payload.db.updateOne({
        collection: target.collection,
        data: { lockNonce: randomUUID() },
        options: { atomic: true },
        req,
        where: {
          and: [
            where,
            { incarnation: { equals: token.incarnation ?? 0 } },
            ...(token.generation === null
              ? [{ state: { equals: 'absent' } }]
              : [
                  { generation: { equals: token.generation } },
                  { state: { not_equals: 'absent' } },
                ]),
          ],
        },
      })

      if (!locked) {
        throw new Error('Branch batch observation changed; roll back the caller transaction.')
      }
    }
  }
}

const getHeadWhere = ({
  branchID,
  scope,
  target,
}: {
  branchID: BranchHeadID
  scope: BranchContentScope
  target: BranchStorageTarget
}): Where => ({
  and: [
    { coordinateKey: { equals: getHeadCoordinateKey({ branchID, scope, target }) } },
    { branchKey: { equals: getBranchKey({ branchID }) } },
    { scopeKey: { equals: getScopeKey({ scope }) } },
    ...(target.parentID !== undefined ? [{ parent: { equals: target.parentID } }] : []),
  ],
})

const getScopeKey = ({ scope }: { scope: BranchContentScope }): string => {
  if (scope.type === 'shared') {
    return 'shared'
  }

  if (!scope.locale.length) {
    throw new Error('A branch locale scope requires a locale code.')
  }

  return `locale:${scope.locale}`
}

const getIncarnation = ({ value }: { value: unknown }): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error('Branch incarnation must be a nonnegative safe integer.')
  }

  return value
}

const getHeadCoordinateKey = ({
  branchID,
  scope,
  target,
}: {
  branchID: BranchHeadID
  scope: BranchContentScope
  target: BranchStorageTarget
}): string =>
  getBranchStorageKey({
    coordinates: [target.parentID ?? null, getBranchKey({ branchID }), getScopeKey({ scope })],
  })

/** Detaching a mutable owner makes its historical body immutable without keeping it forever. */
const freezeRetiredBranchVersion = async ({
  reference,
  req,
  target,
}: {
  reference: BranchVersionReference
  req: PayloadRequest
  target: BranchStorageTarget
}): Promise<void> => {
  const { entity } = getBranchStorage({ req, target })
  const frozen = await req.payload.db.branching!.mutateVersion({
    entity,
    expected: reference,
    mutation: { type: 'freeze' },
    req,
  })

  if (!frozen) {
    throw new Error('The retired branch revision changed; roll back the caller transaction.')
  }
}
