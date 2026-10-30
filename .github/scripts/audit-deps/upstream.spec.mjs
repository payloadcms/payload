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

const refUrl = (repo, tag) =>
  `${GH}/repos/${repo.owner}/${repo.name}/git/ref/tags/${encodeURIComponent(tag)}`
const releaseByTagUrl = (repo, tag) =>
  `${GH}/repos/${repo.owner}/${repo.name}/releases/tags/${encodeURIComponent(tag)}`
const releasesUrl = (repo, page = 1) =>
  `${GH}/repos/${repo.owner}/${repo.name}/releases?per_page=100&page=${page}`
const packumentUrl = (name) => `https://registry.npmjs.org/${name.replace('/', '%2F')}`
const refs = (repo, ...tags) =>
  Object.fromEntries(tags.map((tag) => [refUrl(repo, tag), { ref: `refs/tags/${tag}` }]))
const packumentOf = (...versions) => ({
  versions: Object.fromEntries(versions.map((version) => [version, {}])),
})

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
  it('finds the name@version pattern through the ref endpoint', async () => {
    const fetch = fakeFetch(refs(csvRepo, 'csv-parse@7.0.2'))

    expect(await findTag({ fetch, repo: csvRepo, name: 'csv-parse', version: '7.0.2' })).toBe(
      'csv-parse@7.0.2',
    )
  })

  it('finds the directory-basename pattern', async () => {
    const fetch = fakeFetch(refs(storageRepo, 'storage-v8.3.0'))

    expect(
      await findTag({ fetch, repo: storageRepo, name: '@google-cloud/storage', version: '8.3.0' }),
    ).toBe('storage-v8.3.0')
  })

  it('tries candidates in order and stops at the first 200', async () => {
    const fetch = fakeFetch(refs(scalarsRepo, '2.0.0', 'v2.0.0'))

    expect(await findTag({ fetch, repo: scalarsRepo, name: 'x', version: '2.0.0' })).toBe('v2.0.0')
    expect(fetch.calls.map((call) => call.url)).toEqual([refUrl(scalarsRepo, 'v2.0.0')])
    expect(await findTag({ fetch, repo: scalarsRepo, name: 'x', version: '9.9.9' })).toBeNull()
  })

  it('returns null when repo is missing or GitHub says 403', async () => {
    const fetch = fakeFetch({ [refUrl(scalarsRepo, 'v1.0.0')]: { status: 403 } })

    expect(await findTag({ fetch, repo: null, name: 'x', version: '1.0.0' })).toBeNull()
    expect(await findTag({ fetch, repo: scalarsRepo, name: 'x', version: '1.0.0' })).toBeNull()
  })

  it('sends auth headers only when a token is given', async () => {
    const withToken = fakeFetch(refs(scalarsRepo, 'v1.0.0'))
    const withoutToken = fakeFetch(refs(scalarsRepo, 'v1.0.0'))

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
  const csvPackument = packumentOf('5.6.0', '6.0.0', '6.1.0', '7.0.0', '7.0.2')
  const csvTags = refs(
    csvRepo,
    'csv-parse@5.6.0',
    'csv-parse@6.0.0',
    'csv-parse@6.1.0',
    'csv-parse@7.0.0',
    'csv-parse@7.0.2',
  )
  const csvParams = {
    repo: csvRepo,
    name: 'csv-parse',
    from: '5.6.0',
    to: '7.0.2',
    isMajor: true,
  }

  it('falls back to the changelog sections when tags have no releases', async () => {
    const fetch = fakeFetch({
      [packumentUrl('csv-parse')]: csvPackument,
      ...csvTags,
      [csvChangelogUrl]: csvChangelog,
    })

    const result = await fetchReleaseNotes({ fetch, ...csvParams })

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

  it('does not split a changelog section at deeper headings with versions', async () => {
    const changelog = [
      '## 7.0.0',
      '',
      'Seven notes',
      '',
      '### Bump foo to 1.2.3',
      '',
      'inner',
      '',
      '## 6.0.0',
      '',
      'Six notes',
    ].join('\n')
    const fetch = fakeFetch({
      [packumentUrl('csv-parse')]: packumentOf('5.6.0', '6.0.0', '7.0.0'),
      ...refs(csvRepo, 'csv-parse@6.0.0', 'csv-parse@7.0.0'),
      [csvChangelogUrl]: changelog,
    })

    const result = await fetchReleaseNotes({ fetch, ...csvParams, to: '7.0.0' })

    expect(result.entries.map((entry) => entry.version)).toEqual(['7.0.0', '6.0.0'])
    expect(result.entries[0].text).toContain('inner')
  })

  it('mixes releases and changelog sections and reports changelog as the source', async () => {
    const fetch = fakeFetch({
      [packumentUrl('csv-parse')]: csvPackument,
      ...csvTags,
      [releaseByTagUrl(csvRepo, 'csv-parse@7.0.0')]: {
        html_url: 'https://github.com/adaltas/node-csv/releases/tag/csv-parse@7.0.0',
        body: 'release seven',
      },
      [csvChangelogUrl]: csvChangelog,
    })

    const result = await fetchReleaseNotes({ fetch, ...csvParams })

    expect(result.entries.map((entry) => [entry.version, entry.text])).toEqual([
      ['7.0.0', 'release seven'],
      ['6.0.0', 'Six notes'],
    ])
    expect(result.source).toBe('changelog')
  })

  it('includes other releases after the majors when includeMinors is set', async () => {
    const fetch = fakeFetch({
      [packumentUrl('csv-parse')]: csvPackument,
      ...csvTags,
      [releasesUrl(csvRepo)]: [],
      [csvChangelogUrl]: csvChangelog,
    })

    const result = await fetchReleaseNotes({ fetch, ...csvParams, includeMinors: true })

    expect(result.entries.map((entry) => [entry.version, entry.isMajor])).toEqual([
      ['7.0.0', true],
      ['6.0.0', true],
      ['6.1.0', false],
    ])
  })

  it('takes minors from the paged releases list when it has them', async () => {
    const fetch = fakeFetch({
      [packumentUrl('csv-parse')]: csvPackument,
      ...csvTags,
      [releasesUrl(csvRepo)]: [
        { tag_name: 'csv-parse@6.1.0', html_url: 'u61', body: 'minor six one' },
        { tag_name: 'csv-stringify@6.2.0', html_url: 'x', body: 'other package' },
      ],
      [csvChangelogUrl]: csvChangelog,
    })

    const result = await fetchReleaseNotes({ fetch, ...csvParams, includeMinors: true })

    expect(result.entries.map((entry) => [entry.version, entry.text])).toEqual([
      ['7.0.0', 'Seven notes\n\n### Breaking\n\n- esm only'],
      ['6.0.0', 'Six notes'],
      ['6.1.0', 'minor six one'],
    ])
  })

  it('returns only the X.0.0 release for a major from GitHub releases', async () => {
    const fetch = fakeFetch({
      [packumentUrl('graphql-scalars')]: packumentOf('1.22.2', '1.23.0', '2.0.0', '2.0.1'),
      ...refs(scalarsRepo, 'v1.22.2', 'v2.0.0', 'v2.0.1'),
      [releaseByTagUrl(scalarsRepo, 'v2.0.0')]: {
        tag_name: 'v2.0.0',
        html_url: 'https://github.com/ardatan/graphql-scalars/releases/tag/v2.0.0',
        body: 'major notes',
      },
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
      ...refs(scalarsRepo, 'v1.2.4'),
      [releaseByTagUrl(scalarsRepo, 'v1.2.4')]: { html_url: 'u4', body: 'four' },
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
    expect(result.source).toBe('releases')
  })

  it('returns the empty shape for non-semver versions', async () => {
    const fetch = fakeFetch({})

    const result = await fetchReleaseNotes({
      fetch,
      repo: scalarsRepo,
      name: 'x',
      from: 'latest',
      to: 'next',
      isMajor: true,
    })

    expect(result).toEqual({
      entries: [],
      links: { releases: null, changelog: null, compare: null },
      source: 'none',
    })
  })

  it('degrades to links when the repo is missing or GitHub answers 403', async () => {
    const forbidden = fakeFetch({
      [refUrl(scalarsRepo, 'v2.0.0')]: { status: 403 },
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
  const compareUrl = `${GH}/repos/o/r/compare/v1.0.0...v2.0.0?per_page=100`
  const storagePackument = {
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
  }
  const storageBase = `${GH}/repos/googleapis/google-cloud-node`
  const storageCommitsUrl = (page) =>
    `${storageBase}/commits?path=handwritten%2Fstorage&since=2026-01-01T00%3A00%3A00Z&until=2026-03-01T00%3A00%3A00Z&per_page=100&page=${page}`
  const storageTagCommits = {
    [`${storageBase}/commits/storage-v8.0.0`]: {
      sha: 'sha-storage-v8.0.0',
      commit: { committer: { date: '2026-01-01T00:00:00Z' } },
    },
    [`${storageBase}/commits/storage-v8.3.0`]: {
      sha: 'sha-storage-v8.3.0',
      commit: { committer: { date: '2026-03-01T00:00:00Z' } },
    },
  }

  it('drops bot commits, keeps 10 and reports the total', async () => {
    const humans = Array.from({ length: 12 }, (_, index) => commit(`h${index}`, 'alice'))
    const fetch = fakeFetch({
      [packumentUrl('pkg')]: packument('github:o/r'),
      ...refs(repo, 'v1.0.0', 'v2.0.0'),
      [compareUrl]: {
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

  it('keeps authors whose login only starts with a bot name', async () => {
    const fetch = fakeFetch({
      [packumentUrl('pkg')]: packument('github:o/r'),
      ...refs(repo, 'v1.0.0', 'v2.0.0'),
      [compareUrl]: { commits: [commit('k1', 'renovatefan'), commit('k2', 'dependabot-fan')] },
    })

    const result = await fetchCommits({ fetch, repo, name: 'pkg', from: '1.0.0', to: '2.0.0' })

    expect(result.total).toBe(2)
  })

  it('takes total from total_commits when GitHub reports it', async () => {
    const fetch = fakeFetch({
      [packumentUrl('pkg')]: packument('github:o/r'),
      ...refs(repo, 'v1.0.0', 'v2.0.0'),
      [compareUrl]: {
        total_commits: 140,
        commits: [commit('b1', 'renovate[bot]'), commit('h1', 'alice')],
      },
    })

    const result = await fetchCommits({ fetch, repo, name: 'pkg', from: '1.0.0', to: '2.0.0' })

    expect(result.total).toBe(139)
    expect(result.commits.map((entry) => entry.sha)).toEqual(['h1'])
  })

  it('sends the token on the compare call', async () => {
    const fetch = fakeFetch({
      [packumentUrl('pkg')]: packument('github:o/r'),
      ...refs(repo, 'v1.0.0', 'v2.0.0'),
      [compareUrl]: { commits: [commit('h1', 'alice')] },
    })

    await fetchCommits({ fetch, repo, name: 'pkg', from: '1.0.0', to: '2.0.0', token: 't0k' })

    const compareCall = fetch.calls.find((call) => call.url === compareUrl)
    expect(compareCall.headers.Authorization).toBe('Bearer t0k')
  })

  it('filters a monorepo by path between the two tag dates and sends the token', async () => {
    const fetch = fakeFetch({
      [packumentUrl('@google-cloud/storage')]: storagePackument,
      ...refs(storageRepo, 'storage-v8.0.0', 'storage-v8.3.0'),
      ...storageTagCommits,
      [storageCommitsUrl(1)]: [
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
      token: 't0k',
    })

    expect(result.commits.map((entry) => entry.sha)).toEqual(['sha-storage-v8.3.0', 'c1'])
    expect(result.total).toBe(2)
    const pathCall = fetch.calls.find((call) => call.url === storageCommitsUrl(1))
    expect(pathCall.headers.Authorization).toBe('Bearer t0k')
  })

  it('paginates monorepo path commits', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => commit(`p${index}`, 'alice'))
    const fetch = fakeFetch({
      [packumentUrl('@google-cloud/storage')]: storagePackument,
      ...refs(storageRepo, 'storage-v8.0.0', 'storage-v8.3.0'),
      ...storageTagCommits,
      [storageCommitsUrl(1)]: firstPage,
      [storageCommitsUrl(2)]: [commit('last', 'bob')],
    })

    const result = await fetchCommits({
      fetch,
      repo: storageRepo,
      name: '@google-cloud/storage',
      from: '8.0.0',
      to: '8.3.0',
    })

    expect(result.total).toBe(101)
  })

  it('returns no commits and release links when the repo moved', async () => {
    const fetch = fakeFetch({
      [packumentUrl('@google-cloud/storage')]: {
        versions: {
          '7.0.0': { repository: 'github:googleapis/nodejs-storage' },
          '8.3.0': storagePackument.versions['8.3.0'],
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
    const noTags = fakeFetch({ [packumentUrl('pkg')]: packument('github:o/r') })
    const forbidden = fakeFetch({
      [packumentUrl('pkg')]: { status: 403 },
      [refUrl(repo, 'v1.0.0')]: { status: 403 },
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
