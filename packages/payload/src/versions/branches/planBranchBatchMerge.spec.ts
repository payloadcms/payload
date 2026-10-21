import { describe, expect, it } from 'vitest'

import type {
  BranchBatchMergePlan,
  BranchEntityIdentity,
  BranchMergeCandidate,
  BranchMergeReceipt,
  BranchMergeSelection,
} from './transitionTypes.js'
import type {
  BranchContentScope,
  BranchHeadState,
  BranchVersionReference,
  ResolvedBranchScope,
} from './types.js'

import {
  combineBranchEntityReadSets,
  isBranchEntityReadSetCurrent,
} from './compareBranchEntities.js'
import { normalizeBranchMergeSelection } from './normalizeBranchMergeSelection.js'
import { planBranchBatchMerge } from './planBranchBatchMerge.js'
import { planBranchScopeTransition } from './planBranchScopeTransition.js'
import { planBranchSourceReconciliation } from './planBranchSourceReconciliation.js'
import { resolveBranchScope } from './resolveBranchScope.js'

const entity: BranchEntityIdentity = { collection: 'articles', id: 1, type: 'collection' }
const shared: BranchContentScope = { type: 'shared' }
const english: BranchContentScope = { locale: 'en', type: 'locale' }
const french: BranchContentScope = { locale: 'fr', type: 'locale' }
const locales = ['en', 'fr']

describe('entity-qualified branch observations', () => {
  it.each<BranchEntityIdentity>([
    { collection: 'articles', id: '1', type: 'collection' },
    { collection: 'other', id: 1, type: 'collection' },
    { global: 'articles', type: 'global' },
  ])('should reject a token from another logical identity %j', (otherEntity) => {
    const head = getScope({ branchID: 'main' }).source

    expect(
      isBranchEntityReadSetCurrent({
        actual: [{ entity, head }],
        expected: [{ entity: otherEntity, head }],
      }),
    ).toBe(false)
    expect(
      combineBranchEntityReadSets({
        readSets: [[{ entity, head }], [{ entity: otherEntity, head }]],
      }),
    ).toHaveLength(2)
  })

  it('should reject duplicate and contradictory observations while deduplicating identical dependencies', () => {
    const token = { entity, head: getScope({ branchID: 'main' }).source }
    const changed = { entity, head: getScope({ branchID: 'main', generation: 2 }).source }

    expect(isBranchEntityReadSetCurrent({ actual: [token, token], expected: [token, token] })).toBe(
      false,
    )
    expect(combineBranchEntityReadSets({ readSets: [[token], [token]] })).toStrictEqual([token])
    expect(() => combineBranchEntityReadSets({ readSets: [[token], [changed]] })).toThrow(
      'Contradictory',
    )
  })
})

describe('branch merge selection', () => {
  it('should distinguish omitted selection from an explicit empty selection', () => {
    const candidates = [getCandidate({ scope: english }), getCandidate({ scope: french })]

    expect(normalizeBranchMergeSelection({ candidates, locales })).toStrictEqual({
      selected: candidates,
      status: 'ready',
    })
    expect(normalizeBranchMergeSelection({ candidates, locales, selection: [] })).toStrictEqual({
      selected: [],
      status: 'ready',
    })
    expect(getPlan({ candidates, selection: [] })).toMatchObject({
      readSet: [],
      receipts: [],
      selected: [],
      status: 'ready',
      writes: [],
    })
  })

  it('should expand all locales to the configured set without adding shared content', () => {
    const candidates = [
      getCandidate({ scope: shared }),
      getCandidate({ scope: english }),
      getCandidate({ scope: french }),
    ]
    const selection = getSelection({ candidates: candidates.slice(1) })

    selection[0] = { ...selection[0]!, scopes: ['all-locales'] }

    expect(normalizeBranchMergeSelection({ candidates, locales, selection })).toStrictEqual({
      selected: candidates.slice(1),
      status: 'ready',
    })
  })

  it('should reject stale source generations in an explicit selection', () => {
    const reviewed = getCandidate({ scope: english })
    const current = getCandidate({ scope: english, sourceGeneration: 2 })

    expect(
      normalizeBranchMergeSelection({
        candidates: [current],
        locales,
        selection: getSelection({ candidates: [reviewed] }),
      }),
    ).toMatchObject({
      conflicts: [{ entity, reason: 'source-changed', scope: english }],
      status: 'conflict',
    })
  })

  it('should report a disappeared selected scope instead of selecting replacement work', () => {
    const reviewed = getCandidate({ scope: english })

    expect(
      normalizeBranchMergeSelection({
        candidates: [getCandidate({ scope: french })],
        locales,
        selection: getSelection({ candidates: [reviewed] }),
      }),
    ).toMatchObject({
      conflicts: expect.arrayContaining([{ entity, reason: 'selection-missing', scope: english }]),
      status: 'conflict',
    })
  })

  it('should reject duplicate or unknown scopes and invalid locale configuration', () => {
    const candidate = getCandidate({ scope: english })

    expect(() =>
      normalizeBranchMergeSelection({ candidates: [candidate, candidate], locales }),
    ).toThrow('Duplicate')
    expect(() =>
      normalizeBranchMergeSelection({
        candidates: [candidate],
        locales,
        selection: [
          ...getSelection({ candidates: [candidate] }),
          ...getSelection({ candidates: [candidate] }),
        ],
      }),
    ).toThrow('more than once')
    expect(() =>
      normalizeBranchMergeSelection({ candidates: [candidate], locales: ['en', 'en'] }),
    ).toThrow('unique')
    expect(() =>
      normalizeBranchMergeSelection({ candidates: [candidate], locales: ['fr'] }),
    ).toThrow('unknown locale')
  })

  it('should allow reviewed all-locale publication when one locale already inherits live content', () => {
    const en = getCandidate({ scope: english })
    const inherited = resolveBranchScope({
      branchHead: null,
      branchID: 'drafts',
      publishedBranchID: 'main',
      publishedHead: {
        base: null,
        branchID: 'main',
        generation: 1,
        scope: french,
        state: version({ id: 'live' }),
      },
      scope: french,
    })
    const fr = { ...getCandidate({ scope: french }), source: inherited }
    const selection: BranchMergeSelection[] = [
      {
        entity,
        expectedPending: [english],
        expectedSource: [en, fr].flatMap((candidate) =>
          candidate.source.readSet.map((head) => ({ entity, head })),
        ),
        scopes: ['all-locales'],
      },
    ]
    const plan = getReady({ candidates: [en, fr], selection })

    expect(plan.selected).toHaveLength(2)
    expect(plan.writes).toHaveLength(1)
    expect(plan.writes[0]?.head.scope).toStrictEqual(english)
    expect(plan.readSet).toContainEqual({ entity, head: fr.source.readSet[0] })
    expect(plan.receipts).toHaveLength(1)
  })

  it('should preserve reviewed already-applied scopes as no-ops in all-locale publication', () => {
    const en = getCandidate({ scope: english })
    const previousFr = getCandidate({ scope: french })
    const receipt = getReady({ candidates: [previousFr] }).receipts[0]!
    const fr = {
      ...getCandidate({ destinationGeneration: 2, destinationVersion: 'working', scope: french }),
      receipt,
    }
    const selection = getSelection({ candidates: [en, fr] })

    selection[0] = { ...selection[0]!, expectedPending: [english], scopes: ['all-locales'] }

    expect(getReady({ candidates: [en, fr], selection }).writes).toHaveLength(1)
  })

  it('should normalize a large inventory using logical typed keys', () => {
    const template = getCandidate({ scope: english })
    const candidates = Array.from({ length: 10000 }, (_, id) => ({
      ...template,
      entity: { collection: 'articles', id, type: 'collection' as const },
    }))
    const plan = getReady({ candidates })

    expect(plan.writes).toHaveLength(10000)
    expect(plan.readSet).toHaveLength(20000)
    expect(plan.receipts.at(-1)?.entity).toStrictEqual(candidates.at(-1)?.entity)
  })
})

describe('batch branch transitions', () => {
  it('should refuse the first promotion when main diverged from the captured base', () => {
    const candidate = getCandidate({
      destinationGeneration: 2,
      destinationVersion: 'concurrent',
      scope: english,
    })

    expect(getPlan({ candidates: [candidate] })).toMatchObject({
      conflicts: [{ entity, reason: 'base-changed', scope: english }],
      status: 'conflict',
    })
  })

  it('should detect a main generation change even if its version returned to the original state', () => {
    const candidate = getCandidate({ destinationGeneration: 3, scope: english })

    expect(getPlan({ candidates: [candidate] })).toMatchObject({
      conflicts: [{ reason: 'base-changed' }],
      status: 'conflict',
    })
  })

  it('should allow authorized base overwrite while retaining current destination concurrency guards', () => {
    const candidate = getCandidate({ destinationVersion: 'diverged', scope: english })
    const plan = getReady({ candidates: [candidate], shouldOverwrite: true })

    expect(plan.writes[0]?.head.state).toStrictEqual(candidate.source.state)
    expect(plan.readSet).toContainEqual({ entity, head: candidate.destination.source })

    const staleReview = {
      ...candidate,
      expectedDestination: getScope({ branchID: 'main', scope: english }).readSet,
    }

    expect(getPlan({ candidates: [staleReview], shouldOverwrite: true })).toMatchObject({
      conflicts: [{ reason: 'destination-changed' }],
      status: 'conflict',
    })
  })

  it('should allow disjoint locale promotion and leave unselected work absent from the plan', () => {
    const en = getCandidate({ scope: english })
    const fr = getCandidate({
      destinationGeneration: 2,
      destinationVersion: 'french-live-edit',
      scope: french,
    })
    const plan = getReady({ candidates: [en, fr], selection: getSelection({ candidates: [en] }) })

    expect(plan.selected).toStrictEqual([{ entity, scope: english }])
    expect(plan.writes).toHaveLength(1)
    expect(
      plan.readSet.every(
        (token) => token.head.scope.type === 'locale' && token.head.scope.locale === 'en',
      ),
    ).toBe(true)
  })

  it('should establish an owned destination when staging currently inherits matching main content', () => {
    const candidate = getCandidate({
      destinationBranchID: 'staging',
      scope: english,
      sourceVersion: 'live',
    })
    const inherited = resolveBranchScope({
      branchHead: null,
      branchID: 'staging',
      publishedBranchID: 'main',
      publishedHead: {
        base: null,
        branchID: 'main',
        generation: 1,
        scope: english,
        state: version({ id: 'live' }),
      },
      scope: english,
    })
    const plan = getReady({
      candidates: [
        { ...candidate, destination: inherited, expectedDestination: inherited.readSet },
      ],
      destinationBranchID: 'staging',
    })

    expect(plan.writes[0]?.head).toMatchObject({
      base: inherited.source,
      branchID: 'staging',
      generation: 1,
      state: inherited.state,
    })
    expect(plan.readSet).toContainEqual({ entity, head: inherited.readSet[0] })
    expect(plan.readSet).toContainEqual({ entity, head: inherited.readSet[1] })
  })

  it('should retain drafts after staging and use its destination-specific receipt for the next promotion', () => {
    const first = getCandidate({ destinationBranchID: 'staging', scope: english })
    const initial = getReady({ candidates: [first], destinationBranchID: 'staging' })
    const receipt = initial.receipts[0]!
    const staged = getScope({
      branchID: 'staging',
      generation: 2,
      scope: english,
      versionID: 'working',
    })

    expect(
      planBranchSourceReconciliation({
        currentPublished: getScope({ branchID: 'main', scope: english }),
        currentSource: first.source,
        entity,
        publishedBranchID: 'main',
        receipt,
      }),
    ).toStrictEqual({ reason: 'working-destination', status: 'retain' })

    const next = getCandidate({
      destinationBranchID: 'staging',
      destinationGeneration: 2,
      destinationVersion: 'working',
      scope: english,
      sourceGeneration: 2,
      sourceVersion: 'new-working',
    })
    const nextPlan = getReady({
      candidates: [{ ...next, receipt }],
      destinationBranchID: 'staging',
    })

    expect(nextPlan.writes[0]?.head.state).toStrictEqual(next.source.state)
    expect(nextPlan.receipts[0]?.destinationReadSet[0]?.generation).toBe(3)
    expect(staged.state).toStrictEqual(first.source.state)
  })

  it('should exclude receipt-confirmed work from omitted selection and conflict on stale explicit selection', () => {
    const first = getCandidate({ scope: english })
    const receipt = getReady({ candidates: [first] }).receipts[0]!
    const applied = getCandidate({
      destinationGeneration: 2,
      destinationVersion: 'working',
      scope: english,
    })
    const candidate = { ...applied, receipt }

    expect(getReady({ candidates: [candidate] }).selected).toStrictEqual([])
    expect(
      getPlan({ candidates: [candidate], selection: getSelection({ candidates: [candidate] }) }),
    ).toMatchObject({ conflicts: [{ reason: 'selection-missing' }], status: 'conflict' })
  })

  it('should conflict when destination changes after the last applied receipt', () => {
    const first = getCandidate({ scope: english })
    const receipt = getReady({ candidates: [first] }).receipts[0]!
    const candidate = getCandidate({
      destinationGeneration: 3,
      destinationVersion: 'live-concurrent',
      scope: english,
      sourceGeneration: 2,
    })

    expect(getPlan({ candidates: [{ ...candidate, receipt }] })).toMatchObject({
      conflicts: [{ reason: 'base-changed' }],
      status: 'conflict',
    })
  })

  it.each(['entity', 'destination', 'future-source'] as const)(
    'should reject an unrelated or impossible receipt: %s',
    (kind) => {
      const candidate = getCandidate({ scope: english })
      const original = getReady({ candidates: [candidate] }).receipts[0]!
      const receipt =
        kind === 'entity'
          ? { ...original, entity: { global: 'articles', type: 'global' as const } }
          : kind === 'destination'
            ? { ...original, destinationBranchID: 'staging' }
            : { ...original, sourceReadSet: [{ ...original.sourceReadSet[0]!, generation: 99 }] }

      expect(
        getPlan({ candidates: [{ ...candidate, receipt }], shouldOverwrite: true }),
      ).toMatchObject({ conflicts: [{ reason: 'receipt-invalid' }], status: 'conflict' })
    },
  )

  it.each([1, 2, 9])(
    'should reject a previous source incarnation receipt regardless of recreated generation %i',
    (generation) => {
      const first = getCandidate({ scope: english, sourceGeneration: 2 })
      const receipt = getReady({ candidates: [first] }).receipts[0]!
      const recreated = resolveBranchScope({
        branchHead: {
          base: first.base,
          branchID: 'drafts',
          generation,
          incarnation: 1,
          scope: english,
          state: first.source.state!,
        },
        branchID: 'drafts',
        branchIncarnation: 1,
        publishedBranchID: 'main',
        scope: english,
      })

      expect(getPlan({ candidates: [{ ...first, receipt, source: recreated }] })).toMatchObject({
        conflicts: [{ reason: 'receipt-invalid' }],
        status: 'conflict',
      })
    },
  )

  it('should publish selected shared structure and dependent locale together', () => {
    const newRows = { generation: 1, id: 'new-rows' }
    const sharedCandidate = getCandidate({
      scope: shared,
      sourceState: version({ id: 'shared-new', structure: newRows }),
    })
    const en = getCandidate({
      scope: english,
      sourceState: version({ id: 'en-new', structure: newRows }),
    })
    const fr = getCandidate({ scope: french })
    const plan = getReady({
      candidates: [sharedCandidate, en, fr],
      selection: getSelection({ candidates: [sharedCandidate, en] }),
    })

    expect(plan.writes).toHaveLength(2)
    expect(plan.readSet).toContainEqual({ entity, head: fr.destination.source })
    expect(plan.readSet).not.toContainEqual({ entity, head: fr.source.source })
  })

  it('should reject shared structure that would invalidate an unselected destination locale', () => {
    const sharedCandidate = getCandidate({
      scope: shared,
      sourceState: version({ id: 'new-rows' }),
    })
    const fr = getCandidate({
      destinationState: version({ id: 'fr-live', structure: { generation: 1, id: 'old-rows' } }),
      scope: french,
    })

    expect(
      getPlan({
        candidates: [sharedCandidate, getCandidate({ scope: english }), fr],
        selection: getSelection({ candidates: [sharedCandidate] }),
      }),
    ).toMatchObject({
      conflicts: [{ reason: 'shared-structure-changed', scope: french }],
      status: 'conflict',
    })
  })

  it('should require complete locale closure for shared publication', () => {
    const candidate = getCandidate({ scope: shared })

    expect(() => getPlan({ candidates: [candidate] })).toThrow('every destination locale')
  })

  it('should reject locale-only publication without compatible shared structure, including overwrite', () => {
    const candidate = getCandidate({
      scope: english,
      sourceState: version({ id: 'translation', structure: { generation: 1, id: 'rows' } }),
    })

    expect(getPlan({ candidates: [candidate], shouldOverwrite: true })).toMatchObject({
      conflicts: [{ reason: 'shared-structure-changed' }],
      status: 'conflict',
    })
  })

  it('should check locale structure against the actual destination when reviewed shared content is a no-op', () => {
    const mainShared = getScope({ branchID: 'main', scope: shared, versionID: 'new-rows' })
    const inherited = resolveBranchScope({
      branchHead: null,
      branchID: 'drafts',
      publishedBranchID: 'main',
      publishedHead: {
        base: null,
        branchID: 'main',
        generation: 1,
        scope: shared,
        state: mainShared.state!,
      },
      scope: shared,
    })
    const sharedCandidate = {
      ...getCandidate({
        destinationBranchID: 'staging',
        destinationVersion: 'old-rows',
        scope: shared,
      }),
      source: inherited,
    }
    const en = getCandidate({
      destinationBranchID: 'staging',
      scope: english,
      sourceState: version({ id: 'en-new', structure: { generation: 1, id: 'new-rows' } }),
    })
    const selection = getSelection({ candidates: [sharedCandidate, en] })

    selection[0] = { ...selection[0]!, expectedPending: [english] }

    expect(
      getPlan({ candidates: [sharedCandidate, en], destinationBranchID: 'staging', selection }),
    ).toMatchObject({
      conflicts: [{ reason: 'shared-structure-changed', scope: english }],
      status: 'conflict',
    })
  })

  it('should carry shared dependencies for locale-only publication without publishing other shared changes', () => {
    const sharedCandidate = getCandidate({
      destinationState: version({
        id: 'shared-label-change',
        structure: { generation: 1, id: 'rows' },
      }),
      scope: shared,
    })
    const en = getCandidate({
      scope: english,
      sourceState: version({ id: 'translation', structure: { generation: 1, id: 'rows' } }),
    })
    const plan = getReady({
      candidates: [sharedCandidate, en],
      selection: getSelection({ candidates: [en] }),
    })

    expect(plan.writes).toHaveLength(1)
    expect(plan.readSet).toContainEqual({ entity, head: sharedCandidate.destination.source })
    expect(plan.readSet).not.toContainEqual({ entity, head: sharedCandidate.source.source })
  })

  it('should plan explicit withdrawal without any reference to unrelated working content', () => {
    const candidate = getCandidate({ scope: english, sourceState: { type: 'withdrawn' } })
    const plan = getReady({ candidates: [candidate] })

    expect(plan.writes[0]?.head.state).toStrictEqual({ type: 'withdrawn' })
  })

  it('should return an observable no-op receipt when owned destination content already matches', () => {
    const candidate = getCandidate({ scope: english, sourceVersion: 'live' })
    const plan = getReady({ candidates: [candidate] })

    expect(plan.writes).toStrictEqual([])
    expect(plan.receipts[0]?.destinationReadSet).toStrictEqual(candidate.destination.readSet)
    expect(plan.selected).toHaveLength(1)
  })

  it('should plan main to staging explicitly and reject a branch merged into itself', () => {
    const candidate = getCandidate({ destinationBranchID: 'staging', scope: english })
    const main = getScope({ branchID: 'main', scope: english, versionID: 'live' })

    expect(
      getPlan({
        candidates: [{ ...candidate, base: null, source: main }],
        destinationBranchID: 'staging',
        sourceBranchID: 'main',
      }),
    ).toMatchObject({ status: 'ready' })
    expect(() => getPlan({ candidates: [], destinationBranchID: 'drafts' })).toThrow('itself')
  })

  it('should not mutate deeply frozen planning inputs', () => {
    const candidate = getCandidate({ scope: english })
    const before = structuredClone(candidate)

    deepFreeze({ value: candidate })
    getReady({ candidates: Object.freeze([candidate]) })
    expect(candidate).toStrictEqual(before)
  })
})

describe('source reconciliation and explicit transitions', () => {
  const first = getCandidate({ scope: english })
  const receipt: BranchMergeReceipt = getReady({ candidates: [first] }).receipts[0]!
  const published = getScope({
    branchID: 'main',
    generation: 2,
    scope: english,
    versionID: 'working',
  })

  it('should discard only an unchanged published source scope when inheritance resolves to the applied content', () => {
    const result = planBranchSourceReconciliation({
      currentPublished: published,
      currentSource: first.source,
      entity,
      publishedBranchID: 'main',
      receipt,
    })

    expect(result).toMatchObject({ status: 'discard' })

    if (result.status === 'discard') {
      expect(result.readSet).toHaveLength(2)
      expect(result.readSet).toContainEqual({ entity, head: first.source.source })
    }
  })

  it('should retain source edits made after capture', () => {
    expect(
      planBranchSourceReconciliation({
        currentPublished: published,
        currentSource: getScope({
          branchID: 'drafts',
          generation: 2,
          scope: english,
          versionID: 'newer-working',
        }),
        entity,
        publishedBranchID: 'main',
        receipt,
      }),
    ).toStrictEqual({ reason: 'source-changed', status: 'retain' })
  })

  it('should retain source work when publication changes before reconciliation', () => {
    expect(
      planBranchSourceReconciliation({
        currentPublished: getScope({
          branchID: 'main',
          generation: 3,
          scope: english,
          versionID: 'new-live',
        }),
        currentSource: first.source,
        entity,
        publishedBranchID: 'main',
        receipt,
      }),
    ).toStrictEqual({ reason: 'publication-changed', status: 'retain' })
  })

  it('should guard published shared structure before restoring locale inheritance', () => {
    const required = { generation: 1, id: 'rows' }
    const candidate = getCandidate({
      scope: english,
      sourceState: version({ id: 'translation', structure: required }),
    })
    const sharedCandidate = getCandidate({
      destinationState: version({ id: 'rows' }),
      scope: shared,
    })
    const localeReceipt = getReady({
      candidates: [candidate, sharedCandidate],
      selection: getSelection({ candidates: [candidate] }),
    }).receipts[0]!
    const live = getScope({
      branchID: 'main',
      generation: 2,
      scope: english,
      state: candidate.source.state!,
    })
    const result = planBranchSourceReconciliation({
      currentPublished: live,
      currentPublishedShared: sharedCandidate.destination,
      currentSource: candidate.source,
      entity,
      publishedBranchID: 'main',
      receipt: localeReceipt,
    })

    expect(result).toMatchObject({ status: 'discard' })

    if (result.status === 'discard') {
      expect(result.readSet).toContainEqual({ entity, head: sharedCandidate.destination.source })
    }

    expect(
      planBranchSourceReconciliation({
        currentPublished: live,
        currentPublishedShared: getScope({
          branchID: 'main',
          scope: shared,
          versionID: 'different-rows',
        }),
        currentSource: candidate.source,
        entity,
        publishedBranchID: 'main',
        receipt: localeReceipt,
      }),
    ).toStrictEqual({ reason: 'publication-changed', status: 'retain' })
  })

  it('should discard a working override without withdrawing main', () => {
    const result = planBranchScopeTransition({
      originalBase: first.base,
      action: 'discard',
      current: first.source,
      entity,
      expected: first.source.readSet,
      publishedBranchID: 'main',
    })

    expect(result).toMatchObject({
      inheritance: { branchID: 'drafts', entity, nextIncarnation: 1, scope: english },
      status: 'ready',
      write: null,
    })
    expect(() =>
      planBranchScopeTransition({
        originalBase: first.base,
        action: 'discard',
        current: published,
        entity,
        expected: published.readSet,
        publishedBranchID: 'main',
      }),
    ).toThrow('cannot be discarded')
  })

  it('should retain the previous publication for audit when planning a guarded withdrawal', () => {
    const result = planBranchScopeTransition({
      originalBase: first.base,
      action: 'withdraw',
      current: published,
      entity,
      expected: published.readSet,
      publishedBranchID: 'main',
    })

    expect(result).toMatchObject({
      previousState: published.state,
      inheritance: null,
      status: 'ready',
      write: { head: { base: null, generation: 3, state: { type: 'withdrawn' } } },
    })
    expect(
      planBranchScopeTransition({
        originalBase: first.base,
        action: 'withdraw',
        current: published,
        entity,
        expected: first.destination.readSet,
        publishedBranchID: 'main',
      }),
    ).toStrictEqual({ reason: 'destination-changed', status: 'conflict' })
  })

  it('should preserve a working scope original main base when it becomes withdrawn', () => {
    const transition = planBranchScopeTransition({
      action: 'withdraw',
      current: first.source,
      entity,
      expected: first.source.readSet,
      originalBase: first.base,
      publishedBranchID: 'main',
    })

    expect(transition.status).toBe('ready')

    if (transition.status !== 'ready' || !transition.write) {
      throw new Error('Expected a working withdrawal.')
    }

    expect(transition.write.head.base).toStrictEqual(first.base)

    const withdrawn = resolveBranchScope({
      branchHead: transition.write.head,
      branchID: 'drafts',
      publishedBranchID: 'main',
      scope: english,
    })

    expect(
      getReady({ candidates: [{ ...first, source: withdrawn }] }).writes[0]?.head.state,
    ).toStrictEqual({ type: 'withdrawn' })
  })

  it('should preserve read conditions for a no-op withdrawal', () => {
    const withdrawn = getScope({ branchID: 'main', state: { type: 'withdrawn' } })

    expect(
      planBranchScopeTransition({
        action: 'withdraw',
        current: withdrawn,
        entity,
        expected: withdrawn.readSet,
        originalBase: null,
        publishedBranchID: 'main',
      }),
    ).toStrictEqual({ readSet: [{ entity, head: withdrawn.source }], status: 'noop' })
  })

  it('should distinguish absent and recreated scopes after a guarded discard', () => {
    const transition = planBranchScopeTransition({
      action: 'discard',
      current: first.source,
      entity,
      expected: first.source.readSet,
      originalBase: first.base,
      publishedBranchID: 'main',
    })

    if (transition.status !== 'ready' || !transition.inheritance) {
      throw new Error('Expected guarded inheritance.')
    }

    const inherited = resolveBranchScope({
      branchHead: null,
      branchID: 'drafts',
      branchIncarnation: transition.inheritance.nextIncarnation,
      publishedBranchID: 'main',
      scope: english,
    })
    const recreated = resolveBranchScope({
      branchHead: {
        base: first.base,
        branchID: 'drafts',
        generation: 1,
        incarnation: transition.inheritance.nextIncarnation,
        scope: english,
        state: first.source.state!,
      },
      branchID: 'drafts',
      branchIncarnation: transition.inheritance.nextIncarnation,
      publishedBranchID: 'main',
      scope: english,
    })
    const originalAbsent = resolveBranchScope({
      branchHead: null,
      branchID: 'drafts',
      publishedBranchID: 'main',
      scope: english,
    })

    expect(
      isBranchEntityReadSetCurrent({
        actual: [{ entity, head: recreated.source }],
        expected: [{ entity, head: first.source.source }],
      }),
    ).toBe(false)
    expect(
      isBranchEntityReadSetCurrent({
        actual: inherited.readSet.map((head) => ({ entity, head })),
        expected: originalAbsent.readSet.map((head) => ({ entity, head })),
      }),
    ).toBe(false)
    expect(() =>
      resolveBranchScope({
        branchHead: {
          base: first.base,
          branchID: 'drafts',
          generation: 1,
          incarnation: 0,
          scope: english,
          state: first.source.state!,
        },
        branchID: 'drafts',
        branchIncarnation: 1,
        publishedBranchID: 'main',
        scope: english,
      }),
    ).toThrow('durable incarnation')
  })
})

const getScope = ({
  branchID,
  generation = 1,
  scope = english,
  state,
  versionID = 'live',
}: {
  branchID: string
  generation?: number
  scope?: BranchContentScope
  state?: BranchHeadState
  versionID?: string
}): ResolvedBranchScope =>
  resolveBranchScope({
    branchHead: {
      base: null,
      branchID,
      generation,
      scope,
      state: state ?? version({ id: versionID }),
    },
    branchID,
    publishedBranchID: 'main',
    scope,
  })

const version = ({
  id,
  structure = null,
}: {
  id: string
  structure?: BranchVersionReference | null
}): BranchHeadState => ({ structure, type: 'version', version: { generation: 1, id } })

const getCandidate = ({
  destinationBranchID = 'main',
  destinationGeneration = 1,
  destinationState,
  destinationVersion = 'live',
  scope,
  sourceGeneration = 1,
  sourceState,
  sourceVersion = 'working',
}: {
  destinationBranchID?: string
  destinationGeneration?: number
  destinationState?: BranchHeadState
  destinationVersion?: string
  scope: BranchContentScope
  sourceGeneration?: number
  sourceState?: BranchHeadState
  sourceVersion?: string
}): BranchMergeCandidate => {
  const destination = getScope({
    branchID: destinationBranchID,
    generation: destinationGeneration,
    scope,
    state: destinationState,
    versionID: destinationVersion,
  })

  return {
    base: getScope({ branchID: 'main', scope }).source,
    destination,
    destinationBase: getScope({ branchID: 'main', scope }).source,
    entity,
    expectedDestination: destination.readSet,
    receipt: null,
    source: getScope({
      branchID: 'drafts',
      generation: sourceGeneration,
      scope,
      state: sourceState,
      versionID: sourceVersion,
    }),
  }
}

const getSelection = ({
  candidates,
}: {
  candidates: readonly BranchMergeCandidate[]
}): BranchMergeSelection[] => [
  {
    entity: candidates[0]!.entity,
    expectedPending: candidates.map((candidate) => candidate.source.scope),
    expectedSource: candidates.flatMap((candidate) =>
      candidate.source.readSet.map((head) => ({ entity: candidate.entity, head })),
    ),
    scopes: candidates.map((candidate) => candidate.source.scope),
  },
]

const getPlan = ({
  candidates,
  destinationBranchID = 'main',
  selection,
  shouldOverwrite = false,
  sourceBranchID = 'drafts',
}: {
  candidates: readonly BranchMergeCandidate[]
  destinationBranchID?: string
  selection?: readonly BranchMergeSelection[]
  shouldOverwrite?: boolean
  sourceBranchID?: string
}): BranchBatchMergePlan =>
  planBranchBatchMerge({
    candidates,
    destinationBranchID,
    locales,
    publishedBranchID: 'main',
    selection,
    shouldOverwrite,
    sourceBranchID,
  })

const getReady = (
  args: Parameters<typeof getPlan>[0],
): Extract<BranchBatchMergePlan, { status: 'ready' }> => {
  const plan = getPlan(args)

  expect(plan.status).toBe('ready')

  if (plan.status !== 'ready') {
    throw new Error(JSON.stringify(plan))
  }

  return plan
}

const deepFreeze = ({ value }: { value: object }): void => {
  Object.values(value).forEach((entry) => {
    if (entry && typeof entry === 'object') {
      deepFreeze({ value: entry })
    }
  })
  Object.freeze(value)
}
