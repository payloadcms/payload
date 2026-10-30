import { describe, expect, it } from 'vitest'

import {
  findStoredOutcome,
  mergeStore,
  pruneStore,
  readStore,
  selectResearchBumps,
  writeStore,
} from './store.mjs'

const now = new Date('2026-10-30T00:00:00Z')
const daysAgo = (days) => new Date(now.getTime() - days * 86400000).toISOString()
const entry = (overrides = {}) => ({
  ref: 'main',
  dependency: 'csv-parse',
  to: '7.0.2',
  outcome: 'declined',
  reason: 'r',
  at: daysAgo(1),
  ...overrides,
})

describe('store', () => {
  it('reads empty or invalid text as []', () => {
    expect(readStore({ text: '' })).toEqual([])
    expect(readStore({ text: 'nope' })).toEqual([])
  })

  it('round-trips through writeStore', () => {
    expect(readStore({ text: writeStore({ entries: [entry()] }) })).toEqual([entry()])
  })

  it('prunes entries older than 30 days only', () => {
    const entries = [entry({ at: daysAgo(31) }), entry({ dependency: 'b', at: daysAgo(29) })]

    expect(pruneStore({ entries, now }).map((e) => e.dependency)).toEqual(['b'])
  })

  it('finds an outcome by ref, dependency, and to', () => {
    expect(
      findStoredOutcome({ entries: [entry()], ref: 'main', dependency: 'csv-parse', to: '7.0.2' }),
    ).toEqual(entry())
    expect(
      findStoredOutcome({ entries: [entry()], ref: '3.x', dependency: 'csv-parse', to: '7.0.2' }),
    ).toBeNull()
  })

  it('merge replaces the older entry for the same key', () => {
    const merged = mergeStore({
      entries: [entry({ reason: 'old', at: daysAgo(5) })],
      updates: [entry({ reason: 'new', outcome: 'failed' })],
    })

    expect(merged).toHaveLength(1)
    expect(merged[0].reason).toBe('new')
  })
})

describe('selectResearchBumps', () => {
  const bump = (id, dependency, to, extra = {}) => ({ id, dependency, to, ...extra })

  it('moves a bump with a fresh stored entry for the same to into stored', () => {
    const bumps = [bump('csv-parse-7', 'csv-parse', '7.0.2')]
    const result = selectResearchBumps({ bumps, entries: [entry()], ref: 'main', now })

    expect(result.research).toEqual([])
    expect(result.stored).toEqual([entry()])
  })

  it('keeps a bump whose stored entry has an older to', () => {
    const bumps = [bump('csv-parse-7', 'csv-parse', '7.0.3')]
    const result = selectResearchBumps({ bumps, entries: [entry()], ref: 'main', now })

    expect(result.research).toEqual(bumps)
  })

  it('ignores expired entries', () => {
    const bumps = [bump('csv-parse-7', 'csv-parse', '7.0.2')]
    const result = selectResearchBumps({
      bumps,
      entries: [entry({ at: daysAgo(31) })],
      ref: 'main',
      now,
    })

    expect(result.research).toEqual(bumps)
  })

  it('keeps the fallback in research when only the major is stored', () => {
    const major = bump('csv-parse-7', 'csv-parse', '7.0.2')
    const fallback = bump('csv-parse-6-fallback', 'csv-parse', '6.1.1', {
      fallbackFor: 'csv-parse-7',
    })
    const result = selectResearchBumps({
      bumps: [major, fallback],
      entries: [entry()],
      ref: 'main',
      now,
    })

    expect(result.research).toEqual([fallback])
  })
})
