import { describe, expect, it } from 'vitest'

import {
  buildCodexEvidence,
  fetchAdvisory,
  fetchCommits,
  fetchPackageMeta,
  fetchReleaseNotes,
  fetchWeeklyDownloads,
  findTag,
} from './upstream.mjs'

const GH = 'https://api.github.com'

/** Builds a fetch from a URL to body map: objects are JSON, strings are text, `{ status }` is an error. */
function fakeFetch(responses) {
  const calls = []
  const fetch = async (url, init = {}) => {
    calls.push({ url, headers: init.headers ?? {} })
    const body = responses[url]
    if (body === undefined) {
      return makeResponse({ status: 404, body: { message: 'Not Found' } })
    }
    if (body?.status) {
      return makeResponse({ status: body.status, body: {} })
    }
    return makeResponse({ status: 200, body })
  }
  fetch.calls = calls
  return fetch
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
const storageRepo = {
  owner: 'googleapis',
  name: 'google-cloud-node',
  directory: 'handwritten/storage',
}
const scalarsRepo = { owner: 'ardatan', name: 'graphql-scalars', directory: undefined }

const tagsUrl = (repo, page = 1) =>
  `${GH}/repos/${repo.owner}/${repo.name}/tags?per_page=100&page=${page}`
const releasesUrl = (repo, page = 1) =>
  `${GH}/repos/${repo.owner}/${repo.name}/releases?per_page=100&page=${page}`
const tagList = (...names) => names.map((name) => ({ name, commit: { sha: `sha-${name}` } }))

const csvChangelog = [
  '# Change Log',
  '',
  '## Version 7.0.0',
  '',
  'Seven notes',
  '',
  '### Breaking',
  '',
  '- esm only',
  '',
  '## Version 6.1.0',
  '',
  'Six one notes',
  '',
  '## [6.0.0](https://example.com) (2024-01-01)',
  '',
  'Six notes',
  '',
  '## 5.6.0',
  '',
  'Old notes',
].join('\n')

describe('fetchPackageMeta', () => {
  it('parses a git+https repository with a directory', async () => {
    const fetch = fakeFetch({
      'https://registry.npmjs.org/csv-parse': {
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
      homepage: 'https://csv.js.org/parse',
    })
  })

  it('returns repo null for non-GitHub or missing repositories', async () => {
    const fetch = fakeFetch({
      'https://registry.npmjs.org/a': {
        repository: { url: 'git+https://gitlab.com/o/r.git' },
      },
      'https://registry.npmjs.org/b': { versions: { '1.0.0': {} } },
    })

    expect((await fetchPackageMeta({ fetch, name: 'a', version: '1.0.0' })).repo).toBeNull()
    expect((await fetchPackageMeta({ fetch, name: 'b', version: '1.0.0' })).repo).toBeNull()
  })

  it('parses string repositories', async () => {
    const fetch = fakeFetch({
      'https://registry.npmjs.org/a': { repository: 'github:o/r' },
    })

    expect((await fetchPackageMeta({ fetch, name: 'a', version: '1.0.0' })).repo).toEqual({
      owner: 'o',
      name: 'r',
      directory: undefined,
    })
  })

  it('returns the empty shape on 403 and on thrown errors', async () => {
    const empty = { repo: null, publishedAt: null, homepage: null }
    const forbidden = fakeFetch({ 'https://registry.npmjs.org/a': { status: 403 } })
    const throwing = async () => {
      throw new Error('offline')
    }

    expect(await fetchPackageMeta({ fetch: forbidden, name: 'a', version: '1.0.0' })).toEqual(empty)
    expect(await fetchPackageMeta({ fetch: throwing, name: 'a', version: '1.0.0' })).toEqual(empty)
  })
})

describe('fetchWeeklyDownloads', () => {
  it('reads the count for one version', async () => {
    const fetch = fakeFetch({
      'https://api.npmjs.org/versions/@sentry%2Fnextjs/last-week': {
        downloads: { '10.54.0': 1234, '10.53.0': 5 },
      },
    })

    expect(await fetchWeeklyDownloads({ fetch, name: '@sentry/nextjs', version: '10.54.0' })).toBe(
      1234,
    )
  })

  it('returns null on 404 and for a missing version', async () => {
    const fetch = fakeFetch({
      'https://api.npmjs.org/versions/a/last-week': { downloads: {} },
    })

    expect(await fetchWeeklyDownloads({ fetch, name: 'a', version: '1.0.0' })).toBeNull()
    expect(await fetchWeeklyDownloads({ fetch, name: 'missing', version: '1.0.0' })).toBeNull()
  })
})

describe('findTag', () => {
  it('finds the name@version pattern', async () => {
    const fetch = fakeFetch({
      [tagsUrl(csvRepo)]: tagList('csv-parse@7.0.2', 'csv-stringify@1.0.0'),
    })

    expect(await findTag({ fetch, repo: csvRepo, name: 'csv-parse', version: '7.0.2' })).toBe(
      'csv-parse@7.0.2',
    )
  })

  it('finds the directory-basename pattern', async () => {
    const fetch = fakeFetch({ [tagsUrl(storageRepo)]: tagList('storage-v8.3.0', 'pubsub-v1.0.0') })

    expect(
      await findTag({ fetch, repo: storageRepo, name: '@google-cloud/storage', version: '8.3.0' }),
    ).toBe('storage-v8.3.0')
  })

  it('prefers v<version> and returns null when nothing matches', async () => {
    const fetch = fakeFetch({ [tagsUrl(scalarsRepo)]: tagList('2.0.0', 'v2.0.0') })

    expect(await findTag({ fetch, repo: scalarsRepo, name: 'x', version: '2.0.0' })).toBe('v2.0.0')
    expect(await findTag({ fetch, repo: scalarsRepo, name: 'x', version: '9.9.9' })).toBeNull()
  })

  it('paginates tags', async () => {
    const page1 = Array.from({ length: 100 }, (_, index) => ({
      name: `old-${index}`,
      commit: { sha: 's' },
    }))
    const fetch = fakeFetch({
      [tagsUrl(scalarsRepo, 1)]: page1,
      [tagsUrl(scalarsRepo, 2)]: tagList('v3.0.0'),
    })

    expect(await findTag({ fetch, repo: scalarsRepo, name: 'x', version: '3.0.0' })).toBe('v3.0.0')
  })

  it('returns null when repo is missing or GitHub says 403', async () => {
    const fetch = fakeFetch({ [tagsUrl(scalarsRepo)]: { status: 403 } })

    expect(await findTag({ fetch, repo: null, name: 'x', version: '1.0.0' })).toBeNull()
    expect(await findTag({ fetch, repo: scalarsRepo, name: 'x', version: '1.0.0' })).toBeNull()
  })

  it('sends auth headers only when a token is given', async () => {
    const withToken = fakeFetch({ [tagsUrl(scalarsRepo)]: tagList('v1.0.0') })
    const withoutToken = fakeFetch({ [tagsUrl(scalarsRepo)]: tagList('v1.0.0') })

    await findTag({
      fetch: withToken,
      repo: scalarsRepo,
      name: 'x',
      version: '1.0.0',
      token: 't0k',
    })
    await findTag({ fetch: withoutToken, repo: scalarsRepo, name: 'x', version: '1.0.0' })

    expect(withToken.calls[0].headers).toEqual({
      Authorization: 'Bearer t0k',
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    })
    expect(withoutToken.calls[0].headers.Authorization).toBeUndefined()
  })
})

describe('fetchReleaseNotes', () => {
  const csvChangelogUrl = `${GH}/repos/adaltas/node-csv/contents/packages/csv-parse/CHANGELOG.md`

  it('cuts the changelog to major versions in range when there are no releases', async () => {
    const fetch = fakeFetch({
      [releasesUrl(csvRepo)]: [],
      [csvChangelogUrl]: csvChangelog,
      [tagsUrl(csvRepo)]: tagList('csv-parse@5.6.0', 'csv-parse@7.0.2'),
    })

    const result = await fetchReleaseNotes({
      fetch,
      repo: csvRepo,
      name: 'csv-parse',
      from: '5.6.0',
      to: '7.0.2',
      isMajor: true,
    })

    expect(result.source).toBe('changelog')
    expect(result.entries.map((entry) => entry.version)).toEqual(['7.0.0', '6.0.0'])
    expect(result.entries.every((entry) => entry.isMajor)).toBe(true)
    expect(result.entries[0].text).toContain('esm only')
    expect(result.entries[0].text).not.toContain('Six one notes')
    expect(result.entries[1].text).toBe('Six notes')
    expect(result.links.releases).toBe('https://github.com/adaltas/node-csv/releases')
    expect(result.links.changelog).toBe(
      'https://github.com/adaltas/node-csv/blob/HEAD/packages/csv-parse/CHANGELOG.md',
    )
    expect(result.links.compare).toBe(
      'https://github.com/adaltas/node-csv/compare/csv-parse@5.6.0...csv-parse@7.0.2',
    )
  })

  it('includes other releases after the majors when includeMinors is set', async () => {
    const fetch = fakeFetch({
      [releasesUrl(csvRepo)]: [],
      [csvChangelogUrl]: csvChangelog,
      [tagsUrl(csvRepo)]: [],
    })

    const result = await fetchReleaseNotes({
      fetch,
      repo: csvRepo,
      name: 'csv-parse',
      from: '5.6.0',
      to: '7.0.2',
      isMajor: true,
      includeMinors: true,
    })

    expect(result.entries.map((entry) => [entry.version, entry.isMajor])).toEqual([
      ['7.0.0', true],
      ['6.0.0', true],
      ['6.1.0', false],
    ])
    expect(result.links.compare).toBeNull()
  })

  it('returns only the X.0.0 release for a major from GitHub releases', async () => {
    const release = (tag, body) => ({
      tag_name: tag,
      html_url: `https://github.com/ardatan/graphql-scalars/releases/tag/${tag}`,
      body,
      draft: false,
    })
    const fetch = fakeFetch({
      [releasesUrl(scalarsRepo)]: [
        release('v2.0.1', 'patch'),
        release('v2.0.0', 'major notes'),
        release('v1.23.0', 'minor'),
        release('v1.22.2', 'from'),
      ],
      [tagsUrl(scalarsRepo)]: tagList('v1.22.2', 'v2.0.1'),
    })

    const result = await fetchReleaseNotes({
      fetch,
      repo: scalarsRepo,
      name: 'graphql-scalars',
      from: '1.22.2',
      to: '2.0.1',
      isMajor: true,
    })

    expect(result.source).toBe('releases')
    expect(result.entries).toEqual([
      {
        version: '2.0.0',
        url: 'https://github.com/ardatan/graphql-scalars/releases/tag/v2.0.0',
        text: 'major notes',
        isMajor: true,
      },
    ])
  })

  it('returns only the to release for a non-major', async () => {
    const fetch = fakeFetch({
      [releasesUrl(scalarsRepo)]: [
        { tag_name: 'v1.2.4', html_url: 'u4', body: 'four' },
        { tag_name: 'v1.2.3', html_url: 'u3', body: 'three' },
      ],
    })

    const result = await fetchReleaseNotes({
      fetch,
      repo: scalarsRepo,
      name: 'x',
      from: '1.2.3',
      to: '1.2.4',
      isMajor: false,
    })

    expect(result.entries).toEqual([{ version: '1.2.4', url: 'u4', text: 'four', isMajor: false }])
  })

  it('ignores releases of other monorepo packages', async () => {
    const fetch = fakeFetch({
      [releasesUrl(storageRepo)]: [
        { tag_name: 'pubsub-v9.0.0', html_url: 'p', body: 'pubsub' },
        { tag_name: 'storage-v8.0.0', html_url: 's', body: 'storage' },
      ],
    })

    const result = await fetchReleaseNotes({
      fetch,
      repo: storageRepo,
      name: '@google-cloud/storage',
      from: '7.0.0',
      to: '8.0.0',
      isMajor: true,
    })

    expect(result.entries.map((entry) => entry.text)).toEqual(['storage'])
  })

  it('degrades to links when the repo is missing or GitHub answers 403', async () => {
    const forbidden = fakeFetch({
      [releasesUrl(scalarsRepo)]: { status: 403 },
      [`${GH}/repos/ardatan/graphql-scalars/contents/CHANGELOG.md`]: { status: 403 },
    })

    const none = await fetchReleaseNotes({
      fetch: forbidden,
      repo: null,
      name: 'x',
      from: '1.0.0',
      to: '2.0.0',
      isMajor: true,
    })
    const blocked = await fetchReleaseNotes({
      fetch: forbidden,
      repo: scalarsRepo,
      name: 'x',
      from: '1.0.0',
      to: '2.0.0',
      isMajor: true,
    })

    expect(none).toEqual({
      entries: [],
      links: { releases: null, changelog: null, compare: null },
      source: 'none',
    })
    expect(blocked.entries).toEqual([])
    expect(blocked.source).toBe('none')
    expect(blocked.links.releases).toBe('https://github.com/ardatan/graphql-scalars/releases')
  })
})

describe('fetchCommits', () => {
  const commit = (sha, login, message = `msg ${sha}`) => ({
    sha,
    html_url: `https://github.com/o/r/commit/${sha}`,
    author: login ? { login } : null,
    commit: {
      message,
      author: { name: login ?? 'someone' },
      committer: { date: '2026-01-01T00:00:00Z' },
    },
  })
  const repo = { owner: 'o', name: 'r', directory: undefined }
  const packument = (repository) => ({
    versions: {
      '1.0.0': { repository },
      '2.0.0': { repository },
    },
  })

  it('drops bot commits, keeps 10 and reports the total', async () => {
    const humans = Array.from({ length: 12 }, (_, index) => commit(`h${index}`, 'alice'))
    const fetch = fakeFetch({
      'https://registry.npmjs.org/pkg': packument('github:o/r'),
      [tagsUrl(repo)]: tagList('v1.0.0', 'v2.0.0'),
      [`${GH}/repos/o/r/compare/v1.0.0...v2.0.0`]: {
        commits: [
          commit('b1', 'renovate[bot]'),
          commit('b2', 'renovate'),
          commit('b3', 'dependabot'),
          commit('b4', 'github-actions[bot]'),
          ...humans,
        ],
      },
    })

    const result = await fetchCommits({ fetch, repo, name: 'pkg', from: '1.0.0', to: '2.0.0' })

    expect(result.total).toBe(12)
    expect(result.commits).toHaveLength(10)
    expect(result.commits[0]).toEqual({
      sha: 'h0',
      message: 'msg h0',
      url: 'https://github.com/o/r/commit/h0',
    })
    expect(result.compareUrl).toBe('https://github.com/o/r/compare/v1.0.0...v2.0.0')
    expect(result.repoMoved).toBe(false)
  })

  it('filters a monorepo by path between the two tag dates', async () => {
    const fetch = fakeFetch({
      'https://registry.npmjs.org/@google-cloud%2Fstorage': {
        versions: {
          '8.0.0': {
            repository: {
              url: 'git+https://github.com/googleapis/google-cloud-node.git',
              directory: 'handwritten/storage',
            },
          },
          '8.3.0': {
            repository: {
              url: 'git+https://github.com/googleapis/google-cloud-node.git',
              directory: 'handwritten/storage',
            },
          },
        },
      },
      [tagsUrl(storageRepo)]: tagList('storage-v8.0.0', 'storage-v8.3.0'),
      [`${GH}/repos/googleapis/google-cloud-node/commits/storage-v8.0.0`]: {
        sha: 'sha-storage-v8.0.0',
        commit: { committer: { date: '2026-01-01T00:00:00Z' } },
      },
      [`${GH}/repos/googleapis/google-cloud-node/commits/storage-v8.3.0`]: {
        sha: 'sha-storage-v8.3.0',
        commit: { committer: { date: '2026-03-01T00:00:00Z' } },
      },
      [`${GH}/repos/googleapis/google-cloud-node/commits?path=handwritten%2Fstorage&since=2026-01-01T00%3A00%3A00Z&until=2026-03-01T00%3A00%3A00Z&per_page=100`]:
        [
          commit('sha-storage-v8.3.0', 'alice'),
          commit('c2', 'dependabot[bot]'),
          commit('c1', 'bob'),
          commit('sha-storage-v8.0.0', 'alice'),
        ],
    })

    const result = await fetchCommits({
      fetch,
      repo: storageRepo,
      name: '@google-cloud/storage',
      from: '8.0.0',
      to: '8.3.0',
    })

    expect(result.commits.map((entry) => entry.sha)).toEqual(['sha-storage-v8.3.0', 'c1'])
    expect(result.total).toBe(2)
  })

  it('returns no commits and release links when the repo moved', async () => {
    const oldRepo = 'github:googleapis/nodejs-storage'
    const fetch = fakeFetch({
      'https://registry.npmjs.org/@google-cloud%2Fstorage': {
        versions: {
          '7.0.0': { repository: oldRepo },
          '8.3.0': {
            repository: {
              url: 'git+https://github.com/googleapis/google-cloud-node.git',
              directory: 'handwritten/storage',
            },
          },
        },
      },
    })

    const result = await fetchCommits({
      fetch,
      repo: storageRepo,
      name: '@google-cloud/storage',
      from: '7.0.0',
      to: '8.3.0',
    })

    expect(result).toEqual({
      commits: [],
      total: 0,
      compareUrl: null,
      repoMoved: true,
      releaseLinks: [
        'https://github.com/googleapis/nodejs-storage/releases',
        'https://github.com/googleapis/google-cloud-node/releases',
      ],
    })
  })

  it('returns the empty shape when tags are missing or GitHub answers 403', async () => {
    const empty = { commits: [], total: 0, compareUrl: null, repoMoved: false, releaseLinks: [] }
    const noTags = fakeFetch({
      'https://registry.npmjs.org/pkg': packument('github:o/r'),
      [tagsUrl(repo)]: [],
    })
    const forbidden = fakeFetch({
      'https://registry.npmjs.org/pkg': { status: 403 },
      [tagsUrl(repo)]: { status: 403 },
    })

    expect(
      await fetchCommits({ fetch: noTags, repo, name: 'pkg', from: '1.0.0', to: '2.0.0' }),
    ).toEqual(empty)
    expect(
      await fetchCommits({ fetch: forbidden, repo, name: 'pkg', from: '1.0.0', to: '2.0.0' }),
    ).toEqual(empty)
    expect(
      await fetchCommits({ fetch: forbidden, repo: null, name: 'pkg', from: '1.0.0', to: '2.0.0' }),
    ).toEqual(empty)
  })
})

describe('fetchAdvisory', () => {
  it('returns text fields with html_url as url', async () => {
    const fetch = fakeFetch({
      [`${GH}/advisories/GHSA-aaaa-bbbb-cccc`]: {
        summary: 'Bad',
        description: 'Very bad',
        severity: 'high',
        html_url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc',
      },
    })

    expect(await fetchAdvisory({ fetch, ghsa: 'GHSA-aaaa-bbbb-cccc' })).toEqual({
      summary: 'Bad',
      description: 'Very bad',
      severity: 'high',
      url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc',
    })
  })

  it('returns null on 404 and 403', async () => {
    const fetch = fakeFetch({ [`${GH}/advisories/GHSA-x`]: { status: 403 } })

    expect(await fetchAdvisory({ fetch, ghsa: 'GHSA-x' })).toBeNull()
    expect(await fetchAdvisory({ fetch, ghsa: 'GHSA-y' })).toBeNull()
  })
})

describe('buildCodexEvidence', () => {
  const entry = (version, size, isMajor) => ({
    version,
    url: `https://example.com/${version}`,
    text: 'x'.repeat(size),
    isMajor,
  })

  it('keeps a 10,000-character major whole and stops adding minors at the budget', () => {
    const text = buildCodexEvidence({
      notes: [entry('1.1.0', 600, false), entry('2.0.0', 10000, true), entry('1.2.0', 600, false)],
      budget: 11000,
    })

    expect(text).toContain('x'.repeat(10000))
    expect(text.indexOf('2.0.0')).toBeLessThan(text.indexOf('1.1.0'))
    expect(text).toContain('1.1.0')
    expect(text).not.toContain('1.2.0')
    expect(text.length).toBeLessThanOrEqual(11000)
  })

  it('keeps every major even when they exceed the budget', () => {
    const text = buildCodexEvidence({
      notes: [entry('3.0.0', 200, true), entry('2.0.0', 200, true), entry('1.5.0', 10, false)],
      budget: 100,
    })

    expect(text).toContain('3.0.0')
    expect(text).toContain('2.0.0')
    expect(text).not.toContain('1.5.0')
  })

  it('returns an empty string for no notes', () => {
    expect(buildCodexEvidence({ notes: [] })).toBe('')
  })
})
