import { describe, expect, it } from 'vitest'

import {
  decidePrStep,
  findStalePrs,
  formatFingerprint,
  hasForeignCommits,
  parseFingerprint,
} from './decide.mjs'

const BOT = { login: 'github-actions[bot]' }
const PERSON = { login: 'elliot' }

const major = (to) => ({ prId: 'csv-parse-7', bumps: [['csv-parse', to]], advisories: ['G1'] })
const group = (bumps) => ({ prId: 'non-major', bumps, advisories: ['G1'] })

describe('hasForeignCommits', () => {
  it.each([
    ['all commits are by the bot', [{ author: BOT, committer: BOT }], false],
    ['a person authored a commit', [{ author: BOT, committer: BOT }, { author: PERSON }], true],
    ['the bot authored but a person committed', [{ author: BOT, committer: PERSON }], true],
    ['a committer is null', [{ author: BOT, committer: null }], true],
    ['an author is null', [{ author: null, committer: BOT }], true],
  ])('should decide when %s', (_name, commits, expected) => {
    expect(hasForeignCommits({ commits })).toBe(expected)
  })
})

describe('fingerprints', () => {
  it('should round-trip and sort', () => {
    const fingerprint = {
      prId: 'non-major',
      bumps: [
        ['b', '2.0.0'],
        ['a', '1.0.1'],
      ],
      advisories: ['GHSA-2', 'GHSA-1'],
    }

    expect(parseFingerprint({ body: `text\n${formatFingerprint({ fingerprint })}` })).toEqual({
      prId: 'non-major',
      bumps: [
        ['a', '1.0.1'],
        ['b', '2.0.0'],
      ],
      advisories: ['GHSA-1', 'GHSA-2'],
    })
  })

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
      'skip-rejected for a rejected equal group',
      group([['a', '1.0.1']]),
      { rejectedPr: prState(group([['a', '1.0.1']])) },
      'skip-rejected',
    ],
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
      'create for a rejected PR without a fingerprint',
      major('7.0.3'),
      { rejectedPr: prState(null) },
      'create',
    ],
    [
      'skip an open PR with an equal fingerprint',
      major('7.0.3'),
      { openPr: prState(major('7.0.3')) },
      'skip',
    ],
    [
      'update an open PR with a different fingerprint',
      major('7.0.3'),
      { openPr: prState(major('7.0.2')) },
      'update',
    ],
    [
      'update an open PR without a fingerprint',
      major('7.0.3'),
      { openPr: prState(null) },
      'update',
    ],
    [
      'block a different fingerprint with foreign commits',
      major('7.0.3'),
      { openPr: prState(major('7.0.2'), { hasForeignCommits: true }) },
      'blocked',
    ],
    [
      'update a conflicted open PR with an equal fingerprint',
      major('7.0.3'),
      { openPr: prState(major('7.0.3'), { isConflicted: true }) },
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

describe('findStalePrs', () => {
  it('should return bot PRs on this ref whose branch matches no planned PR', () => {
    const prs = [{ id: 'non-major', branch: 'ci/audit-deps-fix-main-non-major' }]
    const openPrs = [
      { number: 1, branch: 'ci/audit-deps-fix-main-graphql-scalars-2' },
      { number: 2, branch: 'ci/audit-deps-fix-main-non-major' },
      { number: 3, branch: 'ci/audit-deps-fix-3.x-graphql-scalars-2' },
      { number: 4, branch: 'feature/x' },
    ]

    expect(findStalePrs({ openPrs, prs, ref: 'main' })).toEqual([1])
  })
})
