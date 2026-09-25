import assert from 'node:assert/strict'
import test from 'node:test'

import { blockRowPathPattern, blockTableKey } from './blockRowPath.ts'

test('a block inside an array is stored on the collection table', () => {
  const tables = new Set(['events_blocks_artist'])
  const arrayTable = 'events_lineup'
  const rootTable = 'events'

  assert.equal(tables.has(`${arrayTable}_blocks_artist`), false)
  assert.equal(tables.has(blockTableKey(rootTable, 'artist')), true)
})

test('block row paths keep array indexes and drop the field wildcard', () => {
  assert.equal(blockRowPathPattern('lineup.%.performers.%'), 'lineup.%.performers')
  assert.equal(blockRowPathPattern('performers.%'), 'performers')
  assert.equal(blockRowPathPattern('meta.lineup.%.performers.%'), 'meta.lineup.%.performers')
})
