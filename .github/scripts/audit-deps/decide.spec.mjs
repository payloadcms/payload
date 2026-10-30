import { describe, expect, it } from 'vitest'

import {
  decideNextStep,
  decideUnitStep,
  findStalePrs,
  formatMarker,
  hasForeignCommits,
  markerForUnit,
  parseMarker,
} from './decide.mjs'

const openPrSame = { advisories: ['A', 'B'], hasForeignCommits: false }

describe('decideNextStep', () => {
  it('non-default inputs with fixable is dry-run', () => {
    expect(
      decideNextStep({
        fixable: ['A'],
        isDefaultInputs: false,
        openPr: openPrSame,
        rejectedPr: null,
      }),
    ).toBe('dry-run')
  })

  it('non-default inputs without fixable is none', () => {
    expect(
      decideNextStep({ fixable: [], isDefaultInputs: false, openPr: openPrSame, rejectedPr: null }),
    ).toBe('none')
  })

  it('default inputs, nothing fixable, no PR is none', () => {
    expect(
      decideNextStep({ fixable: [], isDefaultInputs: true, openPr: null, rejectedPr: null }),
    ).toBe('none')
  })

  it('default inputs, nothing fixable, open PR is close', () => {
    expect(
      decideNextStep({
        fixable: [],
        isDefaultInputs: true,
        openPr: openPrSame,
        rejectedPr: null,
      }),
    ).toBe('close')
  })

  it('rejected PR with same advisories is skip', () => {
    expect(
      decideNextStep({
        fixable: ['A'],
        isDefaultInputs: true,
        openPr: null,
        rejectedPr: { advisories: ['A'] },
      }),
    ).toBe('skip')
  })

  it('rejected PR with new advisory is create', () => {
    expect(
      decideNextStep({
        fixable: ['A', 'B'],
        isDefaultInputs: true,
        openPr: null,
        rejectedPr: { advisories: ['A'] },
      }),
    ).toBe('create')
  })

  it('rejected PR without marker is create', () => {
    expect(
      decideNextStep({
        fixable: ['A'],
        isDefaultInputs: true,
        openPr: null,
        rejectedPr: { advisories: null },
      }),
    ).toBe('create')
  })

  it('no open or rejected PR is create', () => {
    expect(
      decideNextStep({ fixable: ['A'], isDefaultInputs: true, openPr: null, rejectedPr: null }),
    ).toBe('create')
  })

  it('open PR with matching marker is skip', () => {
    expect(
      decideNextStep({
        fixable: ['B', 'A'],
        isDefaultInputs: true,
        openPr: openPrSame,
        rejectedPr: null,
      }),
    ).toBe('skip')
  })

  it('open PR with differing marker and foreign commits is blocked', () => {
    expect(
      decideNextStep({
        fixable: ['A', 'B', 'C'],
        isDefaultInputs: true,
        openPr: { advisories: ['A', 'B'], hasForeignCommits: true },
        rejectedPr: null,
      }),
    ).toBe('blocked')
  })

  it('open PR with differing marker is update', () => {
    expect(
      decideNextStep({
        fixable: ['A', 'B', 'C'],
        isDefaultInputs: true,
        openPr: openPrSame,
        rejectedPr: null,
      }),
    ).toBe('update')
  })

  it('missing marker is not skip', () => {
    expect(
      decideNextStep({
        fixable: ['A'],
        isDefaultInputs: true,
        openPr: { advisories: null, hasForeignCommits: false },
        rejectedPr: null,
      }),
    ).toBe('update')
  })

  it('missing marker with foreign commits is blocked', () => {
    expect(
      decideNextStep({
        fixable: ['A'],
        isDefaultInputs: true,
        openPr: { advisories: null, hasForeignCommits: true },
        rejectedPr: null,
      }),
    ).toBe('blocked')
  })
})

describe('hasForeignCommits', () => {
  it('is false when all commits are by github-actions[bot]', () => {
    const commits = [
      { author: { login: 'github-actions[bot]' } },
      { author: { login: 'github-actions[bot]' } },
    ]

    expect(hasForeignCommits({ commits })).toBe(false)
  })

  it('is true when a person authored a commit', () => {
    const commits = [{ author: { login: 'github-actions[bot]' } }, { author: { login: 'elliot' } }]

    expect(hasForeignCommits({ commits })).toBe(true)
  })

  it('is true when an author is null', () => {
    expect(hasForeignCommits({ commits: [{ author: null }] })).toBe(true)
  })
})

const unit = (id, branch) => ({
  id,
  kind: id === 'non-major' ? 'group' : 'major',
  branch,
  bumpIds: [],
})
const marker = (u, bumps, advisories) => ({ unit: u, bumps, advisories })

describe('markers', () => {
  it('round-trips and sorts', () => {
    const m = marker(
      'non-major',
      [
        ['b', '2.0.0'],
        ['a', '1.0.1'],
      ],
      ['GHSA-2', 'GHSA-1'],
    )
    const parsed = parseMarker({ body: `text\n${formatMarker({ marker: m })}` })

    expect(parsed).toEqual({
      unit: 'non-major',
      bumps: [
        ['a', '1.0.1'],
        ['b', '2.0.0'],
      ],
      advisories: ['GHSA-1', 'GHSA-2'],
    })
  })

  it('returns the last marker', () => {
    const forged = formatMarker({ marker: marker('x', [], ['FORGED']) })
    const real = formatMarker({ marker: marker('y', [], ['REAL']) })

    expect(parseMarker({ body: `${forged}\n${real}` })?.unit).toBe('y')
  })

  it('returns null for malformed json', () => {
    expect(parseMarker({ body: '<!-- audit-deps: not json -->' })).toBeNull()
  })

  it('builds a marker from a unit and its bumps', () => {
    const bumps = [
      { dependency: 'b', to: '2.0.0', advisories: ['G2', 'G1'] },
      { dependency: 'a', to: '1.0.1', advisories: ['G1'] },
    ]

    expect(markerForUnit({ unit: { id: 'non-major' }, bumps })).toEqual({
      unit: 'non-major',
      bumps: [
        ['a', '1.0.1'],
        ['b', '2.0.0'],
      ],
      advisories: ['G1', 'G2'],
    })
  })
})

describe('decideUnitStep', () => {
  const major = (to, advisories = ['G1']) => marker('csv-parse-7', [['csv-parse', to]], advisories)
  const pr = (m, hasForeignCommits = false) => ({ marker: m, hasForeignCommits })
  const base = { isDefaultInputs: true, openPr: null, rejectedPr: null }

  it('non-default inputs dry-run', () => {
    expect(decideUnitStep({ ...base, isDefaultInputs: false, marker: major('7.0.3') })).toBe(
      'dry-run',
    )
  })

  it('skips a rejected equal marker', () => {
    const m = marker('non-major', [['a', '1.0.1']], ['G1'])

    expect(decideUnitStep({ ...base, marker: m, rejectedPr: pr(m) })).toBe('skip-rejected')
  })

  it('skips a rejected major at the same major with the same advisories', () => {
    expect(
      decideUnitStep({ ...base, marker: major('7.0.3'), rejectedPr: pr(major('7.0.2')) }),
    ).toBe('skip-rejected')
  })

  it('creates when the target major moved', () => {
    expect(
      decideUnitStep({ ...base, marker: major('8.0.0'), rejectedPr: pr(major('7.0.2')) }),
    ).toBe('create')
  })

  it('creates when a rejected group has a different bump set', () => {
    const a = marker('non-major', [['a', '1.0.1']], ['G1'])
    const b = marker(
      'non-major',
      [
        ['a', '1.0.1'],
        ['b', '2.0.1'],
      ],
      ['G1'],
    )

    expect(decideUnitStep({ ...base, marker: b, rejectedPr: pr(a) })).toBe('create')
  })

  it('does not treat a rejected PR without a marker as a rejection', () => {
    expect(decideUnitStep({ ...base, marker: major('7.0.3'), rejectedPr: pr(null) })).toBe('create')
  })

  it('skips an open PR with an equal marker', () => {
    expect(decideUnitStep({ ...base, marker: major('7.0.3'), openPr: pr(major('7.0.3')) })).toBe(
      'skip',
    )
  })

  it('updates an open PR with a different marker', () => {
    expect(decideUnitStep({ ...base, marker: major('7.0.3'), openPr: pr(major('7.0.2')) })).toBe(
      'update',
    )
  })

  it('blocks a different marker with foreign commits', () => {
    expect(
      decideUnitStep({ ...base, marker: major('7.0.3'), openPr: pr(major('7.0.2'), true) }),
    ).toBe('blocked')
  })

  it('updates an open PR without a marker', () => {
    expect(decideUnitStep({ ...base, marker: major('7.0.3'), openPr: pr(null) })).toBe('update')
  })
})

describe('findStalePrs', () => {
  const units = [unit('non-major', 'ci/audit-deps-fix-main-non-major')]

  it('returns bot PRs on this ref whose branch matches no unit', () => {
    const openPrs = [
      { number: 1, branch: 'ci/audit-deps-fix-main-graphql-scalars-2' },
      { number: 2, branch: 'ci/audit-deps-fix-main-non-major' },
      { number: 3, branch: 'ci/audit-deps-fix-3.x-graphql-scalars-2' },
      { number: 4, branch: 'feature/x' },
    ]

    expect(findStalePrs({ openPrs, ref: 'main', units })).toEqual([1])
  })
})
