import { describe, expect, it } from 'vitest'

import { fuzzyMatch } from './fuzzyMatch.js'

describe('fuzzyMatch', () => {
  it('should match a subsequence case-insensitively', () => {
    const result = fuzzyMatch('pst', 'Posts')
    expect(result).not.toBeNull()
    expect(result?.indices).toEqual([0, 2, 3])
  })

  it('should match regardless of query case', () => {
    expect(fuzzyMatch('POS', 'Posts')).not.toBeNull()
  })

  it('should return null when not all query chars are present in order', () => {
    expect(fuzzyMatch('xyz', 'Posts')).toBeNull()
    expect(fuzzyMatch('sp', 'Posts')).toBeNull() // wrong order
  })

  it('should return a zero-score empty match for an empty query', () => {
    expect(fuzzyMatch('', 'Posts')).toEqual({ indices: [], score: 0 })
  })

  it('should score a leading consecutive match higher than a mid-word match', () => {
    const leading = fuzzyMatch('pa', 'Pages')
    const midWord = fuzzyMatch('pa', 'Media Packs')
    expect(leading!.score).toBeGreaterThan(midWord!.score)
  })

  it('should score consecutive matches higher than gapped matches', () => {
    const consecutive = fuzzyMatch('po', 'Posts')
    const gapped = fuzzyMatch('ps', 'Posts')
    expect(consecutive!.score).toBeGreaterThan(gapped!.score)
  })
})
