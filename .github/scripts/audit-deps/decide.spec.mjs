import { describe, expect, it } from 'vitest'

import { decideNextStep, hasForeignCommits } from './decide.mjs'

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
