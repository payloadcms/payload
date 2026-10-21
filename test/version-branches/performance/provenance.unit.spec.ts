import { expect, test } from 'vitest'

import { validatePerformanceGitState } from './provenance.mjs'

test('should reject an untracked or changed hashed input while allowing unrelated dirty notes', () => {
  const state = {
    changedPaths: [
      'notes/private.md',
      '.codex/local.json',
      'test/databaseAdapter.js',
      'test/version-branches/performance/RESULTS.md',
    ],
    expectedHead: 'measurement',
    head: 'measurement',
    sourcePaths: [
      'packages/payload/src/query.ts',
      'test/version-branches/performance/tsconfig.json',
    ],
    trackedPaths: [
      'packages/payload/src/query.ts',
      'test/version-branches/performance/tsconfig.json',
    ],
  }

  expect(() => validatePerformanceGitState(state)).not.toThrow()
  expect(() =>
    validatePerformanceGitState({ ...state, trackedPaths: [state.trackedPaths[0]!] }),
  ).toThrow('untracked or changed')
  expect(() =>
    validatePerformanceGitState({
      ...state,
      changedPaths: [...state.changedPaths, state.sourcePaths[0]!],
    }),
  ).toThrow('untracked or changed')
  expect(() => validatePerformanceGitState({ ...state, head: 'moved' })).toThrow('HEAD changed')
  expect(() =>
    validatePerformanceGitState({
      ...state,
      changedPaths: [...state.changedPaths, 'packages/payload/src/deleted-helper.ts'],
    }),
  ).toThrow('deleted-helper.ts')
})

test('should allow a later evidence-only reporting commit when hashed inputs match the measurement commit', () => {
  expect(() =>
    validatePerformanceGitState({
      head: 'later-results-only-commit',
      sourcePaths: ['packages/payload/src/query.ts'],
      trackedPaths: ['packages/payload/src/query.ts'],
      changedPaths: ['test/version-branches/performance/RESULTS.md'],
    }),
  ).not.toThrow()
})
