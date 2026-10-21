import { describe, expect, it } from 'vitest'

import type {
  BranchContentScope,
  BranchHeadState,
  BranchVersionReference,
  ResolvedBranchScope,
} from './types.js'

import { isBranchHeadReadSetCurrent } from './compareBranchHeads.js'
import { planBranchScopeMerge } from './planBranchScopeMerge.js'
import { resolveBranchScope } from './resolveBranchScope.js'

const english: BranchContentScope = { locale: 'en', type: 'locale' }
const shared: BranchContentScope = { type: 'shared' }

describe('planBranchScopeMerge', () => {
  it('should plan drafts to staging without a separate draft publication flag', () => {
    const source = getScope({ branchID: 'drafts', versionID: 'working' })
    const destination = getScope({ branchID: 'staging', versionID: 'previous' })
    const result = planBranchScopeMerge({
      destination,
      expectedDestination: destination.readSet,
      source,
    })

    expect(result).toStrictEqual({
      dependencyReadSet: [],
      destinationReadSet: destination.readSet,
      nextState: source.state,
      sourceReadSet: source.readSet,
      status: 'ready',
    })
  })

  it('should promote the same selected version from staging into main', () => {
    const working = getScope({ branchID: 'drafts', versionID: 'reviewed' })
    const staging = getScope({ branchID: 'staging', versionID: 'old' })
    const stagePlan = planBranchScopeMerge({
      destination: staging,
      expectedDestination: staging.readSet,
      source: working,
    })

    expect(stagePlan.status).toBe('ready')

    if (stagePlan.status !== 'ready') {
      throw new Error('Expected a staging promotion.')
    }

    const staged = getScope({ branchID: 'staging', state: stagePlan.nextState })
    const published = getScope({ branchID: 'main', versionID: 'live' })
    const publishPlan = planBranchScopeMerge({
      destination: published,
      expectedDestination: published.readSet,
      source: staged,
    })

    expect(publishPlan.status).toBe('ready')

    if (publishPlan.status !== 'ready') {
      throw new Error('Expected a publication promotion.')
    }

    expect(publishPlan.nextState).toStrictEqual(working.state)
    expect(published.state).not.toStrictEqual(working.state)
  })

  it('should preserve both destination preconditions when staging inherits main', () => {
    const destination = resolveBranchScope({
      branchHead: null,
      branchID: 'staging',
      publishedBranchID: 'main',
      publishedHead: {
        base: null,
        branchID: 'main',
        generation: 1,
        scope: english,
        state: getVersionState({ id: 'live' }),
      },
      scope: english,
    })
    const result = planBranchScopeMerge({
      destination,
      expectedDestination: destination.readSet,
      source: getScope({ branchID: 'drafts', versionID: 'new' }),
    })

    expect(result.status).toBe('ready')

    if (result.status === 'ready') {
      expect(result.destinationReadSet.map((token) => token.branchID)).toStrictEqual([
        'staging',
        'main',
      ])
    }
  })

  it('should refuse to replace a destination edited since review', () => {
    const reviewed = getScope({ branchID: 'main' })
    const current = getScope({ branchID: 'main', generation: 2 })

    expect(
      planBranchScopeMerge({
        destination: current,
        expectedDestination: reviewed.readSet,
        source: getScope({ branchID: 'drafts', versionID: 'new' }),
      }),
    ).toStrictEqual({ reason: 'destination-changed', status: 'conflict' })
  })

  it('should retain current destination preconditions for an explicit overwrite', () => {
    const reviewed = getScope({ branchID: 'main' })
    const current = getScope({ branchID: 'main', generation: 2 })
    const result = planBranchScopeMerge({
      destination: current,
      expectedDestination: reviewed.readSet,
      shouldOverwrite: true,
      source: getScope({ branchID: 'drafts', versionID: 'new' }),
    })

    expect(result.status).toBe('ready')

    if (result.status === 'ready') {
      expect(result.destinationReadSet).toStrictEqual(current.readSet)
      expect(result.destinationReadSet).not.toStrictEqual(reviewed.readSet)
    }
  })

  it('should treat missing source content as a conflict rather than a withdrawal', () => {
    const source = resolveBranchScope({
      branchHead: null,
      branchID: 'drafts',
      publishedBranchID: 'main',
      scope: english,
    })
    const destination = getScope({ branchID: 'main' })

    expect(
      planBranchScopeMerge({ destination, expectedDestination: destination.readSet, source }),
    ).toStrictEqual({ reason: 'source-missing', status: 'conflict' })
  })

  it('should plan an explicit withdrawal without selecting newer working content', () => {
    const source = getScope({ branchID: 'staging', state: { type: 'withdrawn' } })
    const destination = getScope({ branchID: 'main' })
    const result = planBranchScopeMerge({
      destination,
      expectedDestination: destination.readSet,
      source,
    })

    expect(result.status).toBe('ready')

    if (result.status === 'ready') {
      expect(result.nextState).toStrictEqual({ type: 'withdrawn' })
    }
  })

  it('should return no work when the selected version is already at the destination', () => {
    const source = getScope({ branchID: 'drafts' })
    const destination = getScope({ branchID: 'staging' })

    expect(
      planBranchScopeMerge({ destination, expectedDestination: destination.readSet, source }),
    ).toStrictEqual({ status: 'noop' })
  })

  it('should return no work when a withdrawal is already applied', () => {
    const source = getScope({ branchID: 'drafts', state: { type: 'withdrawn' } })
    const destination = getScope({ branchID: 'main', state: { type: 'withdrawn' } })

    expect(
      planBranchScopeMerge({ destination, expectedDestination: destination.readSet, source }),
    ).toStrictEqual({ status: 'noop' })
  })

  it.each<BranchHeadState>([
    { structure: null, type: 'version', version: { generation: 1, id: 'reviewed' } },
    { type: 'withdrawn' },
  ])(
    'should establish an owned staging head even when its inherited state already matches %j',
    (state) => {
      const source = getScope({ branchID: 'drafts', state })
      const destination = resolveBranchScope({
        branchHead: null,
        branchID: 'staging',
        publishedBranchID: 'main',
        publishedHead: {
          base: null,
          branchID: 'main',
          generation: 1,
          scope: english,
          state,
        },
        scope: english,
      })
      const result = planBranchScopeMerge({
        destination,
        expectedDestination: destination.readSet,
        source,
      })

      expect(result.status).toBe('ready')

      if (result.status === 'ready') {
        expect(result.nextState).toStrictEqual(state)
        expect(result.destinationReadSet).toHaveLength(2)
      }
    },
  )

  it('should refuse locale content whose shared structure is not available', () => {
    const source = getScope({
      branchID: 'drafts',
      state: getVersionState({ id: 'translation', structure: { generation: 1, id: 'new-rows' } }),
    })
    const destination = getScope({ branchID: 'main' })

    expect(
      planBranchScopeMerge({ destination, expectedDestination: destination.readSet, source }),
    ).toStrictEqual({ reason: 'shared-structure-changed', status: 'conflict' })
  })

  it('should keep shared structure checks when destination overwrite is requested', () => {
    const source = getScope({
      branchID: 'drafts',
      state: getVersionState({ id: 'translation', structure: { generation: 2, id: 'rows' } }),
    })
    const destination = getScope({ branchID: 'main' })

    expect(
      planBranchScopeMerge({
        destination,
        destinationSharedScope: getScope({ branchID: 'main', scope: shared, versionID: 'rows' }),
        expectedDestination: destination.readSet,
        shouldOverwrite: true,
        source,
      }),
    ).toStrictEqual({ reason: 'shared-structure-changed', status: 'conflict' })
  })

  it('should include the shared head preconditions for a locale that depends on row structure', () => {
    const source = getScope({
      branchID: 'drafts',
      state: getVersionState({ id: 'translation', structure: { generation: 1, id: 'rows' } }),
    })
    const destination = getScope({ branchID: 'main' })
    const destinationSharedScope = getScope({ branchID: 'main', scope: shared, versionID: 'rows' })
    const result = planBranchScopeMerge({
      destination,
      destinationSharedScope,
      expectedDestination: destination.readSet,
      source,
    })

    expect(result.status).toBe('ready')

    if (result.status === 'ready') {
      expect(result.dependencyReadSet).toStrictEqual(destinationSharedScope.readSet)
      expect(result.nextState).toStrictEqual(source.state)
    }
  })

  it('should detect shared structure changing after the locale plan was created', () => {
    const source = getScope({
      branchID: 'drafts',
      state: getVersionState({ id: 'translation', structure: { generation: 1, id: 'rows' } }),
    })
    const destination = getScope({ branchID: 'main' })
    const result = planBranchScopeMerge({
      destination,
      destinationSharedScope: getScope({ branchID: 'main', scope: shared, versionID: 'rows' }),
      expectedDestination: destination.readSet,
      source,
    })
    const changedStructure = getScope({
      branchID: 'main',
      generation: 2,
      scope: shared,
      versionID: 'different-rows',
    })

    expect(result.status).toBe('ready')

    if (result.status === 'ready') {
      expect(
        isBranchHeadReadSetCurrent({
          actual: changedStructure.readSet,
          expected: result.dependencyReadSet,
        }),
      ).toBe(false)
    }
  })

  it('should reject a shared dependency from the source branch', () => {
    const destination = getScope({ branchID: 'main' })

    expect(() =>
      planBranchScopeMerge({
        destination,
        destinationSharedScope: getScope({ branchID: 'drafts', scope: shared }),
        expectedDestination: destination.readSet,
        source: getScope({ branchID: 'drafts' }),
      }),
    ).toThrow('Shared content must belong to the destination')
  })

  it('should reject a locale passed as a shared dependency', () => {
    const destination = getScope({ branchID: 'main' })

    expect(() =>
      planBranchScopeMerge({
        destination,
        destinationSharedScope: destination,
        expectedDestination: destination.readSet,
        source: getScope({ branchID: 'drafts' }),
      }),
    ).toThrow('Shared content must belong to the destination')
  })

  it('should reject selecting a different locale at the destination', () => {
    const destination = getScope({
      branchID: 'main',
      scope: { locale: 'fr', type: 'locale' },
    })

    expect(() =>
      planBranchScopeMerge({
        destination,
        expectedDestination: destination.readSet,
        source: getScope({ branchID: 'drafts' }),
      }),
    ).toThrow('Source and destination must select the same content scope')
  })

  it('should reject merging a branch into itself', () => {
    const scope = getScope({ branchID: 'drafts' })

    expect(() =>
      planBranchScopeMerge({
        destination: scope,
        expectedDestination: scope.readSet,
        source: scope,
      }),
    ).toThrow('A branch cannot be merged into itself')
  })

  it('should plan frozen source and destination inputs without advancing either head', () => {
    const source = Object.freeze(getScope({ branchID: 'drafts', versionID: 'new' }))
    const destination = Object.freeze(getScope({ branchID: 'main', versionID: 'old' }))
    const result = planBranchScopeMerge({
      destination,
      expectedDestination: Object.freeze([...destination.readSet]),
      source,
    })

    expect(result.status).toBe('ready')
    expect(destination.state).toStrictEqual(getVersionState({ id: 'old' }))
    expect(source.state).toStrictEqual(getVersionState({ id: 'new' }))
  })
})

const getScope = ({
  branchID,
  generation = 1,
  scope = english,
  state,
  versionID = 'version',
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
      state: state ?? getVersionState({ id: versionID }),
    },
    branchID,
    publishedBranchID: 'main',
    scope,
  })

const getVersionState = ({
  id,
  structure = null,
}: {
  id: string
  structure?: BranchVersionReference | null
}): BranchHeadState => ({
  structure,
  type: 'version',
  version: { generation: 1, id },
})
