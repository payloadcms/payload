import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  fetchAdvisory,
  fetchCommits,
  fetchPackageMeta,
  fetchReleaseNotes,
  fetchWeeklyDownloads,
} from './upstream.mjs'

const GH = 'https://api.github.com'

/** Builds a fetch from a URL to body map: objects are JSON, strings are text, `{ status }` is an error. */
function fakeFetch(responses) {
  return async (url) => {
    const body = responses[url]
    if (body === undefined) {
      return makeResponse({ status: 404, body: { message: 'Not Found' } })
    }
    if (body?.status) {
      return makeResponse({ status: body.status, body: {} })
    }
    return makeResponse({ status: 200, body })
  }
}

function makeResponse({ status, body }) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => (typeof body === 'string' ? JSON.parse(body) : body),
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  }
}

const csvRepo = { owner: 'adaltas', name: 'node-csv', directory: 'packages/csv-parse' }
const repo = { owner: 'o', name: 'r', directory: undefined }

const refUrl = (target, tag) =>
  `${GH}/repos/${target.owner}/${target.name}/git/ref/tags/${encodeURIComponent(tag)}`
const packumentUrl = (name) => `https://registry.npmjs.org/${name.replace('/', '%2F')}`
const refs = (target, ...tags) =>
  Object.fromEntries(tags.map((tag) => [refUrl(target, tag), { ref: `refs/tags/${tag}` }]))

describe('fetchPackageMeta', () => {
  it('should parse a git+https repository with a directory', async () => {
    const fetch = fakeFetch({
      [packumentUrl('csv-parse')]: {
        versions: {
          '7.0.2': {
            repository: {
              type: 'git',
              url: 'git+https://github.com/adaltas/node-csv.git',
              directory: 'packages/csv-parse',
            },
          },
        },
        time: { '7.0.2': '2026-01-02T00:00:00.000Z' },
        homepage: 'https://csv.js.org/parse',
      },
    })

    expect(await fetchPackageMeta({ fetch, name: 'csv-parse', version: '7.0.2' })).toEqual({
      repo: csvRepo,
      publishedAt: '2026-01-02T00:00:00.000Z',
    })
  })

  it.each([
    ['a parent segment', 'https://github.com/o/..'],
    ['a dot owner', 'github:./r'],
    ['a query in the owner', 'https://github.com/o?x=1/r'],
    ['a query in the name', 'https://github.com/o/r?x=1'],
  ])('should drop a repository with %s', async (_name, url) => {
    const fetch = fakeFetch({ [packumentUrl('a')]: { versions: { '1.0.0': { repository: url } } } })

    expect(await fetchPackageMeta({ fetch, name: 'a', version: '1.0.0' })).toEqual({
      repo: null,
      publishedAt: null,
    })
  })

  it('should return the empty shape on 403 and on thrown errors', async () => {
    const empty = { repo: null, publishedAt: null }
    const forbidden = fakeFetch({ [packumentUrl('a')]: { status: 403 } })
    const throwing = async () => {
      throw new Error('offline')
    }

    expect(await fetchPackageMeta({ fetch: forbidden, name: 'a', version: '1.0.0' })).toEqual(empty)
    expect(await fetchPackageMeta({ fetch: throwing, name: 'a', version: '1.0.0' })).toEqual(empty)
  })
})

describe('fetchReleaseNotes', () => {
  it('should take each major from its release, else from its changelog section', async () => {
    const changelog = [
      '## Version 7.0.0',
      '',
      'Seven notes',
      '',
      '## Version 6.1.0',
      '',
      'Six one notes',
      '',
      '## [6.0.0](https://example.com) (2024-01-01)',
      '',
      'Six notes',
    ].join('\n')
    const fetch = fakeFetch({
      [packumentUrl('csv-parse')]: {
        versions: { '5.6.0': {}, '6.0.0': {}, '6.1.0': {}, '7.0.0': {}, '7.0.2': {} },
      },
      ...refs(csvRepo, 'csv-parse@5.6.0', 'csv-parse@6.0.0', 'csv-parse@7.0.0', 'csv-parse@7.0.2'),
      [`${GH}/repos/adaltas/node-csv/releases/tags/${encodeURIComponent('csv-parse@7.0.0')}`]: {
        html_url: 'https://github.com/adaltas/node-csv/releases/tag/csv-parse@7.0.0',
        body: 'release seven',
      },
      [`${GH}/repos/adaltas/node-csv/contents/packages/csv-parse/CHANGELOG.md`]: changelog,
    })

    const result = await fetchReleaseNotes({
      fetch,
      repo: csvRepo,
      name: 'csv-parse',
      from: '5.6.0',
      to: '7.0.2',
      isMajor: true,
    })

    expect(result.entries.map((entry) => [entry.version, entry.text])).toEqual([
      ['7.0.0', 'release seven'],
      ['6.0.0', 'Six notes'],
    ])
    expect(result.source).toBe('changelog')
    expect(result.links).toEqual({
      releases: 'https://github.com/adaltas/node-csv/releases',
      changelog: 'https://github.com/adaltas/node-csv/blob/HEAD/packages/csv-parse/CHANGELOG.md',
      compare: 'https://github.com/adaltas/node-csv/compare/csv-parse@5.6.0...csv-parse@7.0.2',
    })
  })

  it('should take only the to release of a non-major bump', async () => {
    const fetch = fakeFetch({
      ...refs(repo, 'v1.2.0', 'v1.2.1', 'v1.3.0'),
      [`${GH}/repos/o/r/releases/tags/v1.2.1`]: { html_url: 'u121', body: 'patch notes' },
      [`${GH}/repos/o/r/releases/tags/v1.3.0`]: { html_url: 'u130', body: 'minor notes' },
    })

    const result = await fetchReleaseNotes({
      fetch,
      repo,
      name: 'pkg',
      from: '1.2.0',
      to: '1.3.0',
      isMajor: false,
    })

    expect(result.entries.map((entry) => [entry.version, entry.text])).toEqual([
      ['1.3.0', 'minor notes'],
    ])
    expect(result.source).toBe('releases')
  })

  it('should take the 0.Y.0 release of a 0.x breaking bump', async () => {
    const fetch = fakeFetch({
      [packumentUrl('lexical')]: { versions: { '0.52.0': {}, '0.52.1': {}, '0.53.0': {} } },
      ...refs(repo, 'v0.52.0', 'v0.53.0'),
      [`${GH}/repos/o/r/releases/tags/v0.53.0`]: {
        html_url: 'https://github.com/o/r/releases/tag/v0.53.0',
        body: 'breaking 0.53',
      },
    })

    const result = await fetchReleaseNotes({
      fetch,
      repo,
      name: 'lexical',
      from: '0.52.0',
      to: '0.53.0',
      isMajor: true,
    })

    expect(result.entries.map((entry) => [entry.version, entry.text])).toEqual([
      ['0.53.0', 'breaking 0.53'],
    ])
    expect(result.source).toBe('releases')
  })

  it('should degrade to links when the repo is missing or GitHub answers 403', async () => {
    const forbidden = fakeFetch({
      [refUrl(repo, 'v2.0.0')]: { status: 403 },
      [`${GH}/repos/o/r/contents/CHANGELOG.md`]: { status: 403 },
    })
    const params = { fetch: forbidden, name: 'x', from: '1.0.0', to: '2.0.0', isMajor: true }

    expect(await fetchReleaseNotes({ ...params, repo: null })).toEqual({
      entries: [],
      links: { releases: null, changelog: null, compare: null },
      source: 'none',
    })
    expect(await fetchReleaseNotes({ ...params, repo })).toEqual({
      entries: [],
      links: { releases: 'https://github.com/o/r/releases', changelog: null, compare: null },
      source: 'none',
    })
  })
})

describe('fetchCommits', () => {
  const commit = (sha, login) => ({
    sha,
    html_url: `https://github.com/o/r/commit/${sha}`,
    author: { login },
    commit: { message: `msg ${sha}\n\nbody`, author: { name: login } },
  })
  const packument = { versions: { '1.0.0': { repository: 'github:o/r' } } }
  const params = { repo, name: 'pkg', from: '1.0.0', to: '2.0.0' }

  it('should drop bot commits, keep 10 and report the total', async () => {
    const humans = Array.from({ length: 12 }, (_, index) => commit(`h${index}`, 'alice'))
    const fetch = fakeFetch({
      [packumentUrl('pkg')]: packument,
      ...refs(repo, 'v1.0.0', 'v2.0.0'),
      [`${GH}/repos/o/r/compare/v1.0.0...v2.0.0?per_page=100`]: {
        commits: [
          commit('b1', 'renovate[bot]'),
          commit('b2', 'renovate'),
          commit('b3', 'dependabot'),
          commit('b4', 'github-actions[bot]'),
          ...humans,
        ],
      },
    })

    const result = await fetchCommits({ fetch, ...params })

    expect(result.total).toBe(12)
    expect(result.commits).toHaveLength(10)
    expect(result.commits[0]).toEqual({
      sha: 'h0',
      message: 'msg h0',
      url: 'https://github.com/o/r/commit/h0',
    })
    expect(result.compareUrl).toBe('https://github.com/o/r/compare/v1.0.0...v2.0.0')
  })

  it('should return the empty shape when tags are missing or GitHub answers 403', async () => {
    const empty = { commits: [], total: 0, compareUrl: null, repoMoved: false, releaseLinks: [] }
    const noTags = fakeFetch({ [packumentUrl('pkg')]: packument })
    const forbidden = fakeFetch({
      [packumentUrl('pkg')]: { status: 403 },
      [refUrl(repo, 'v1.0.0')]: { status: 403 },
    })

    expect(await fetchCommits({ fetch: noTags, ...params })).toEqual(empty)
    expect(await fetchCommits({ fetch: forbidden, ...params })).toEqual(empty)
  })
})

describe('upstream requests', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should give each request a 30 s timeout', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    const inits = []
    const base = fakeFetch({})
    const fetch = async (url, init) => {
      inits.push(init)
      return base(url, init)
    }

    await fetchWeeklyDownloads({ fetch, name: 'a', version: '1.0.0' })
    await fetchAdvisory({ fetch, ghsa: 'GHSA-x' })

    expect(timeout).toHaveBeenCalledWith(30_000)
    expect(inits.every((init) => init?.signal instanceof AbortSignal)).toBe(true)
  })
})
