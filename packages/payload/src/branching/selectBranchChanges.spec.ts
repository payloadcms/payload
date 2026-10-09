import { expect, test } from 'vitest'

import { selectBranchChanges } from './selectBranchChanges.js'

test('should select changes by equivalent string and number IDs', () => {
  const changes = [{ id: 1 }, { id: '2' }, { id: 3 }]

  expect(selectBranchChanges({ changes, selected: ['1', 2] })).toEqual([changes[0], changes[1]])
})

test('should exclude handled changes from the selection', () => {
  const changes = [{ id: 1 }, { id: 2 }, { id: 3 }]

  expect(
    selectBranchChanges({
      changes,
      excluded: new Set(['2']),
      selected: [1, 2],
    }),
  ).toEqual([changes[0]])
})

test('should return every non-excluded change when no selection is provided', () => {
  const changes = [{ id: 1 }, { id: 2 }]

  expect(selectBranchChanges({ changes, excluded: new Set(['1']) })).toEqual([changes[1]])
})
