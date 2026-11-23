import { describe, expect, it } from 'vitest'

import { decidePrStep, formatFingerprint, hasForeignCommits, parseFingerprint } from './decide.mjs'

const BOT = { login: 'github-actions[bot]' }
const PERSON = { login: 'elliot' }

const major = (to) => ({ prId: 'csv-parse-7', bumps: [['csv-parse', to]], advisories: ['G1'] })
const group = (bumps) => ({ prId: 'non-major', bumps, advisories: ['G1'] })

describe('hasForeignCommits', () => {
  it.each([
    ['the bot authored but a person committed', [{ author: BOT, committer: PERSON }], true],
    ['a committer is null', [{ author: BOT, committer: null }], true],
    ['an author is null', [{ author: null, committer: BOT }], true],
  ])('should decide when %s', (_name, commits, expected) => {
    expect(hasForeignCommits({ commits })).toBe(expected)
  })
})

describe('fingerprints', () => {
  it('should return the last fingerprint so an earlier forged one cannot win', () => {
    const forged = formatFingerprint({ fingerprint: { prId: 'x', bumps: [], advisories: [] } })
    const real = formatFingerprint({ fingerprint: { prId: 'y', bumps: [], advisories: [] } })

    expect(parseFingerprint({ body: `${forged}\n${real}` })?.prId).toBe('y')
  })

  it('should return null for malformed json', () => {
    expect(parseFingerprint({ body: '<!-- audit-deps: not json -->' })).toBeNull()
  })
})

describe('decidePrStep', () => {
  const prState = (f, { hasForeignCommits = false, isConflicted } = {}) => ({
    fingerprint: f,
    hasForeignCommits,
    isConflicted,
  })

  it.each([
    [
      'skip-rejected for a rejected major at the same major',
      major('7.0.3'),
      { rejectedPr: prState(major('7.0.2')) },
      'skip-rejected',
    ],
    [
      'create when the target major moved',
      major('8.0.0'),
      { rejectedPr: prState(major('7.0.2')) },
      'create',
    ],
    [
      'create when a rejected group has a different bump set',
      group([
        ['a', '1.0.1'],
        ['b', '2.0.1'],
      ]),
      { rejectedPr: prState(group([['a', '1.0.1']])) },
      'create',
    ],
    [
      'update an open PR whose target version moved',
      major('7.0.3'),
      { openPr: prState(major('7.0.2')) },
      'update',
    ],
    [
      'block a conflicted open PR with foreign commits',
      major('7.0.3'),
      { openPr: prState(major('7.0.3'), { hasForeignCommits: true, isConflicted: true }) },
      'blocked',
    ],
  ])('should %s', (_name, f, state, expected) => {
    expect(
      decidePrStep({
        openPr: null,
        rejectedPr: null,
        fingerprint: f,
        ...state,
      }),
    ).toBe(expected)
  })
})
