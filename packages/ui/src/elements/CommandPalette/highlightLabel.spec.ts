import { describe, expect, it } from 'vitest'

import { splitLabelByMatches } from './highlightLabel.js'

describe('splitLabelByMatches', () => {
  it('returns a single unmatched segment when no indices are provided', () => {
    expect(splitLabelByMatches('Posts')).toEqual([{ isMatch: false, text: 'Posts' }])
  })

  it('returns a single unmatched segment for an empty indices array', () => {
    expect(splitLabelByMatches('Posts', [])).toEqual([{ isMatch: false, text: 'Posts' }])
  })

  it('returns empty array for an empty label', () => {
    expect(splitLabelByMatches('')).toEqual([])
  })

  it('returns empty array for an empty label even with indices', () => {
    expect(splitLabelByMatches('', [0])).toEqual([])
  })

  it('groups leading consecutive matches into a single matched segment', () => {
    // indices [0,1] on "Posts" → matched "Po", unmatched "sts"
    expect(splitLabelByMatches('Posts', [0, 1])).toEqual([
      { isMatch: true, text: 'Po' },
      { isMatch: false, text: 'sts' },
    ])
  })

  it('handles non-contiguous indices as alternating segments', () => {
    // indices [0,2] on "Posts" → matched "P", unmatched "o", matched "s", unmatched "ts"
    expect(splitLabelByMatches('Posts', [0, 2])).toEqual([
      { isMatch: true, text: 'P' },
      { isMatch: false, text: 'o' },
      { isMatch: true, text: 's' },
      { isMatch: false, text: 'ts' },
    ])
  })

  it('handles a match at the end of the label', () => {
    // indices [4] on "Posts" → unmatched "Post", matched "s"
    expect(splitLabelByMatches('Posts', [4])).toEqual([
      { isMatch: false, text: 'Post' },
      { isMatch: true, text: 's' },
    ])
  })

  it('handles all characters matched', () => {
    expect(splitLabelByMatches('ab', [0, 1])).toEqual([{ isMatch: true, text: 'ab' }])
  })

  it('handles a single character match in the middle', () => {
    // indices [2] on "Posts" → unmatched "Po", matched "s", unmatched "ts"
    expect(splitLabelByMatches('Posts', [2])).toEqual([
      { isMatch: false, text: 'Po' },
      { isMatch: true, text: 's' },
      { isMatch: false, text: 'ts' },
    ])
  })
})
