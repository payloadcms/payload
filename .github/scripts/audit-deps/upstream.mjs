const GITHUB_API = 'https://api.github.com'
const MAX_PAGES = 5
const PAGE_SIZE = 100
const MAX_COMMITS = 10
const DEFAULT_EVIDENCE_BUDGET = 120000
const BOT_PATTERN = /(\[bot\]$|^(renovate|dependabot|github-actions)$)/i
const VERSION_PATTERN = /(\d+)\.(\d+)\.(\d+)/
const STRICT_VERSION_PATTERN = /^\d+\.\d+\.\d+$/
const HEADING_PATTERN = /^(#{1,3})\s+(.*)$/

/**
 * @typedef {object} Repo
 * @property {string} owner
 * @property {string} name
 * @property {string | undefined} directory
 */

/**
 * @typedef {object} NoteEntry
 * @property {string} version
 * @property {string} url
 * @property {string} text
 * @property {boolean} isMajor True for an X.0.0 release.
 */

/**
 * Reads repository, publish time and homepage from the npm registry. Never throws.
 * @returns {Promise<{ repo: Repo | null, publishedAt: string | null, homepage: string | null }>}
 */
export async function fetchPackageMeta({ fetch, name, version }) {
  const empty = { repo: null, publishedAt: null, homepage: null }
  const packument = await getJson({ fetch, url: `https://registry.npmjs.org/${encodeName(name)}` })
  if (!packument) {
    return empty
  }

  const repository = packument.versions?.[version]?.repository ?? packument.repository
  return {
    repo: parseRepository({ repository }),
    publishedAt: packument.time?.[version] ?? null,
    homepage: packument.homepage ?? null,
  }
}

/** @returns {Promise<number | null>} */
export async function fetchWeeklyDownloads({ fetch, name, version }) {
  const data = await getJson({
    fetch,
    url: `https://api.npmjs.org/versions/${encodeName(name)}/last-week`,
  })
  const count = data?.downloads?.[version]
  return typeof count === 'number' ? count : null
}

/**
 * Resolves the first existing tag among v<ver>, <ver>, <name>@<ver>, <dir>-v<ver>.
 * @returns {Promise<string | null>}
 */
export async function findTag({ fetch, repo, name, version, token }) {
  if (!repo) {
    return null
  }
  return createTagResolver({ fetch, repo, name, token })(version)
}

/**
 * Release notes for one bump. Majors list X.0.0 versions in (from, to], taken from the npm
 * packument; with `includeMinors` the other releases in range follow. Non-majors list only
 * the `to` release. Each version uses its GitHub release, else its CHANGELOG.md section.
 * @returns {Promise<{
 *   entries: NoteEntry[],
 *   links: { releases: string | null, changelog: string | null, compare: string | null },
 *   source: 'releases' | 'changelog' | 'none',
 * }>}
 */
export async function fetchReleaseNotes({
  fetch,
  repo,
  name,
  from,
  to,
  isMajor,
  includeMinors = false,
  token,
}) {
  const links = { releases: null, changelog: null, compare: null }
  if (!repo || !isStrictVersion({ version: from }) || !isStrictVersion({ version: to })) {
    return { entries: [], links, source: 'none' }
  }

  const repoUrl = `https://github.com/${repo.owner}/${repo.name}`
  links.releases = `${repoUrl}/releases`

  const resolveTag = createTagResolver({ fetch, repo, name, token })
  const [fromTag, toTag] = await Promise.all([resolveTag(from), resolveTag(to)])
  if (fromTag && toTag) {
    links.compare = `${repoUrl}/compare/${fromTag}...${toTag}`
  }

  const shouldIncludeMinors = isMajor && includeMinors
  const targets = isMajor ? await listMajorVersions({ fetch, name, from, to }) : [to]
  const released = await Promise.all(
    targets.map(async (version) => {
      const tag = await resolveTag(version)
      return tag ? fetchTagRelease({ fetch, repo, tag, version, token }) : null
    }),
  )
  const releasedVersions = new Set(released.filter(Boolean).map((entry) => entry.version))
  const missingVersions = targets.filter((version) => !releasedVersions.has(version))

  const listedMinors = shouldIncludeMinors
    ? (await fetchReleaseCandidates({ fetch, repo, name, token })).filter((candidate) =>
        isMinorInRange({ version: candidate.version, from, to }),
      )
    : []

  const needsChangelog =
    missingVersions.length > 0 || (shouldIncludeMinors && listedMinors.length === 0)
  const sections = []
  if (needsChangelog) {
    const changelogPath = repo.directory ? `${repo.directory}/CHANGELOG.md` : 'CHANGELOG.md'
    const text = await getText({
      fetch,
      url: `${GITHUB_API}/repos/${repo.owner}/${repo.name}/contents/${encodeURI(changelogPath)}`,
      token,
      accept: 'application/vnd.github.raw+json',
    })
    if (text !== null) {
      links.changelog = `${repoUrl}/blob/HEAD/${changelogPath}`
      sections.push(...cutChangelog({ text, url: links.changelog }))
    }
  }

  const releaseEntries = [...released.filter(Boolean), ...toEntries({ candidates: listedMinors })]
  const shouldTakeChangelogMinors = shouldIncludeMinors && listedMinors.length === 0
  const changelogEntries = toEntries({
    candidates: dedupeByVersion({ candidates: sections }).filter(
      (section) =>
        missingVersions.includes(section.version) ||
        (shouldTakeChangelogMinors && isMinorInRange({ version: section.version, from, to })),
    ),
  })

  const entries = sortEntries({ entries: [...releaseEntries, ...changelogEntries] })
  return { entries, links, source: pickSource({ releaseEntries, changelogEntries }) }
}

/**
 * Non-bot commits between two version tags. A repo move
 * (the `from` version published from another repo) yields no commits and both release links.
 * @returns {Promise<{
 *   commits: Array<{ sha: string, message: string, url: string }>,
 *   total: number,
 *   compareUrl: string | null,
 *   repoMoved: boolean,
 *   releaseLinks: string[],
 * }>}
 */
export async function fetchCommits({ fetch, repo, name, from, to, token }) {
  const empty = { commits: [], total: 0, compareUrl: null, repoMoved: false, releaseLinks: [] }
  if (!repo) {
    return empty
  }

  const fromMeta = await fetchPackageMeta({ fetch, name, version: from })
  if (fromMeta.repo && !isSameRepo({ a: fromMeta.repo, b: repo })) {
    return {
      ...empty,
      repoMoved: true,
      releaseLinks: [releasesLink({ repo: fromMeta.repo }), releasesLink({ repo })],
    }
  }

  const resolveTag = createTagResolver({ fetch, repo, name, token })
  const [fromTag, toTag] = await Promise.all([resolveTag(from), resolveTag(to)])
  if (!fromTag || !toTag) {
    return empty
  }

  const compareUrl = `https://github.com/${repo.owner}/${repo.name}/compare/${fromTag}...${toTag}`
  const fetched = repo.directory
    ? await fetchPathCommits({ fetch, repo, fromTag, toTag, token })
    : await fetchCompareCommits({ fetch, repo, fromTag, toTag, token })
  if (!fetched) {
    return empty
  }

  const humanCommits = fetched.commits.filter((commit) => !isBotCommit({ commit }))
  const botCount = fetched.commits.length - humanCommits.length
  return {
    ...empty,
    commits: humanCommits.slice(0, MAX_COMMITS).map(toCommitSummary),
    total:
      typeof fetched.totalCommits === 'number'
        ? Math.max(humanCommits.length, fetched.totalCommits - botCount)
        : humanCommits.length,
    compareUrl,
  }
}

/** @returns {Promise<{ summary: string, description: string, severity: string, url: string } | null>} */
export async function fetchAdvisory({ fetch, ghsa, token }) {
  const advisory = await getJson({
    fetch,
    url: `${GITHUB_API}/advisories/${encodeURIComponent(ghsa)}`,
    token,
  })
  if (!advisory) {
    return null
  }
  return {
    summary: advisory.summary ?? '',
    description: advisory.description ?? '',
    severity: advisory.severity ?? '',
    url: advisory.html_url ?? '',
  }
}

/**
 * Joins release notes for Codex. Major entries are always whole; other entries are added
 * in order until the next one would pass `budget`.
 * @param {{ notes: NoteEntry[], budget?: number }} params
 */
export function buildCodexEvidence({ notes, budget = DEFAULT_EVIDENCE_BUDGET }) {
  const majors = notes.filter((note) => note.isMajor)
  const others = notes.filter((note) => !note.isMajor)
  const sections = majors.map(formatEvidenceSection)
  let length = sections.join('\n').length

  for (const note of others) {
    const section = formatEvidenceSection(note)
    const nextLength = length + section.length + (sections.length > 0 ? 1 : 0)
    if (nextLength > budget) {
      break
    }
    sections.push(section)
    length = nextLength
  }

  return sections.join('\n')
}

function formatEvidenceSection({ version, url, text }) {
  return `## ${version} (${url})\n\n${text}\n`
}

function encodeName(name) {
  return name.replace('/', '%2F')
}

function parseRepository({ repository }) {
  const url = typeof repository === 'string' ? repository : repository?.url
  const directory = typeof repository === 'object' ? repository?.directory : undefined
  if (typeof url !== 'string') {
    return null
  }

  const match =
    url.match(/github\.com[/:]([^/\s]+)\/([^/\s#]+?)(?:\.git)?(?:[/#].*)?$/) ??
    url.match(/^github:([^/\s]+)\/([^/\s#]+?)(?:\.git)?$/) ??
    url.match(/^([\w.-]+)\/([\w.-]+)$/)
  if (!match) {
    return null
  }
  return { owner: match[1], name: match[2], directory: directory || undefined }
}

function isSameRepo({ a, b }) {
  return (
    a.owner.toLowerCase() === b.owner.toLowerCase() && a.name.toLowerCase() === b.name.toLowerCase()
  )
}

function releasesLink({ repo }) {
  return `https://github.com/${repo.owner}/${repo.name}/releases`
}

function tagPrefixes({ repo, name }) {
  const directoryName = repo.directory?.split('/').pop()
  return ['v', '', `${name}@`, directoryName ? `${directoryName}-v` : null].filter(
    (prefix) => prefix !== null,
  )
}

/** Returns a memoized `(version) => tag | null` that probes each candidate via the git ref API. */
function createTagResolver({ fetch, repo, name, token }) {
  const cache = new Map()

  const resolveOne = async (version) => {
    for (const prefix of tagPrefixes({ repo, name })) {
      const tag = `${prefix}${version}`
      const ref = await getJson({
        fetch,
        url: `${GITHUB_API}/repos/${repo.owner}/${repo.name}/git/ref/tags/${encodeURIComponent(tag)}`,
        token,
      })
      if (ref) {
        return tag
      }
    }
    return null
  }

  return (version) => {
    if (!cache.has(version)) {
      cache.set(version, resolveOne(version))
    }
    return cache.get(version)
  }
}

async function fetchTagRelease({ fetch, repo, tag, version, token }) {
  const release = await getJson({
    fetch,
    url: `${GITHUB_API}/repos/${repo.owner}/${repo.name}/releases/tags/${encodeURIComponent(tag)}`,
    token,
  })
  const text = (release?.body ?? '').trim()
  if (!release || release.draft || !text) {
    return null
  }
  return { version, url: release.html_url ?? '', text, isMajor: isMajorRelease({ version }) }
}

async function listMajorVersions({ fetch, name, from, to }) {
  const packument = await getJson({ fetch, url: `https://registry.npmjs.org/${encodeName(name)}` })
  const versions = new Set(Object.keys(packument?.versions ?? {}))
  versions.add(to)

  return [...versions].filter(
    (version) =>
      isStrictVersion({ version }) &&
      isMajorRelease({ version }) &&
      compareVersions({ a: version, b: from }) > 0 &&
      compareVersions({ a: version, b: to }) <= 0,
  )
}

function isMinorInRange({ version, from, to }) {
  return (
    !isMajorRelease({ version }) &&
    compareVersions({ a: version, b: from }) > 0 &&
    compareVersions({ a: version, b: to }) <= 0
  )
}

function isStrictVersion({ version }) {
  return STRICT_VERSION_PATTERN.test(version)
}

function dedupeByVersion({ candidates }) {
  const byVersion = new Map()
  for (const candidate of candidates) {
    if (!byVersion.has(candidate.version)) {
      byVersion.set(candidate.version, candidate)
    }
  }
  return [...byVersion.values()]
}

function toEntries({ candidates }) {
  return candidates
    .filter((candidate) => isStrictVersion({ version: candidate.version }))
    .map((candidate) => ({ ...candidate, isMajor: isMajorRelease({ version: candidate.version }) }))
}

function pickSource({ releaseEntries, changelogEntries }) {
  if (changelogEntries.length > 0) {
    return 'changelog'
  }
  return releaseEntries.length > 0 ? 'releases' : 'none'
}

function versionFromTag({ tag, repo, name }) {
  for (const prefix of tagPrefixes({ repo, name })) {
    if (!tag.startsWith(prefix)) {
      continue
    }
    const rest = tag.slice(prefix.length)
    if (/^\d+\.\d+\.\d+$/.test(rest)) {
      return rest
    }
  }
  return null
}

async function fetchReleaseCandidates({ fetch, repo, name, token }) {
  const releases = await listPages({
    fetch,
    token,
    url: (page) =>
      `${GITHUB_API}/repos/${repo.owner}/${repo.name}/releases?per_page=${PAGE_SIZE}&page=${page}`,
  })

  return releases.flatMap((release) => {
    const version = versionFromTag({ tag: release.tag_name ?? '', repo, name })
    if (!version || release.draft) {
      return []
    }
    return [{ version, url: release.html_url ?? '', text: (release.body ?? '').trim() }]
  })
}

async function listPages({ fetch, url, token }) {
  const items = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await getJson({ fetch, url: url(page), token })
    if (!Array.isArray(data)) {
      break
    }
    items.push(...data)
    if (data.length < PAGE_SIZE) {
      break
    }
  }
  return items
}

async function fetchCompareCommits({ fetch, repo, fromTag, toTag, token }) {
  const data = await getJson({
    fetch,
    url: `${GITHUB_API}/repos/${repo.owner}/${repo.name}/compare/${encodeURIComponent(fromTag)}...${encodeURIComponent(toTag)}?per_page=${PAGE_SIZE}`,
    token,
  })
  if (!Array.isArray(data?.commits)) {
    return null
  }
  return { commits: data.commits, totalCommits: data.total_commits }
}

async function fetchPathCommits({ fetch, repo, fromTag, toTag, token }) {
  const [fromCommit, toCommit] = await Promise.all(
    [fromTag, toTag].map((tag) =>
      getJson({
        fetch,
        url: `${GITHUB_API}/repos/${repo.owner}/${repo.name}/commits/${encodeURIComponent(tag)}`,
        token,
      }),
    ),
  )
  const since = fromCommit?.commit?.committer?.date
  const until = toCommit?.commit?.committer?.date
  if (!since || !until) {
    return null
  }

  const commits = await listPages({
    fetch,
    token,
    url: (page) => {
      const query = new URLSearchParams({
        path: repo.directory,
        since,
        until,
        per_page: String(PAGE_SIZE),
        page: String(page),
      })
      return `${GITHUB_API}/repos/${repo.owner}/${repo.name}/commits?${query}`
    },
  })
  return { commits: commits.filter((commit) => commit.sha !== fromCommit.sha), totalCommits: null }
}

function isBotCommit({ commit }) {
  const login = commit.author?.login ?? commit.commit?.author?.name ?? ''
  return BOT_PATTERN.test(login)
}

function toCommitSummary(commit) {
  return {
    sha: commit.sha,
    message: String(commit.commit?.message ?? '').split('\n')[0],
    url: commit.html_url ?? '',
  }
}

function parseVersion(version) {
  const match = version.match(VERSION_PATTERN)
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null
}

function compareVersions({ a, b }) {
  const left = parseVersion(a)
  const right = parseVersion(b)
  for (let index = 0; index < 3; index++) {
    if (left[index] !== right[index]) {
      return left[index] - right[index]
    }
  }
  return 0
}

function sortEntries({ entries }) {
  const newestFirst = (a, b) => compareVersions({ a: b.version, b: a.version })
  return [
    ...entries.filter((entry) => entry.isMajor).sort(newestFirst),
    ...entries.filter((entry) => !entry.isMajor).sort(newestFirst),
  ]
}

function isMajorRelease({ version }) {
  const [, minor, patch] = parseVersion(version)
  return minor === 0 && patch === 0
}

/** Splits a changelog at the shallowest heading level that carries a semver. */
function cutChangelog({ text, url }) {
  const lines = text.split('\n')
  const versionLevels = lines
    .map((line) => line.match(HEADING_PATTERN))
    .filter((heading) => heading?.[2].match(VERSION_PATTERN))
    .map((heading) => heading[1].length)
  const sectionLevel = Math.min(...versionLevels)

  const sections = []
  let current = null

  for (const line of lines) {
    const heading = line.match(HEADING_PATTERN)
    const version = heading?.[2].match(VERSION_PATTERN)?.[0]
    if (version && heading[1].length === sectionLevel) {
      current = { version, url, lines: [] }
      sections.push(current)
      continue
    }
    current?.lines.push(line)
  }

  return sections.map(({ version, url: sectionUrl, lines }) => ({
    version,
    url: sectionUrl,
    text: lines.join('\n').trim(),
  }))
}

function buildHeaders({ token, accept = 'application/vnd.github+json' }) {
  const headers = { Accept: accept, 'X-GitHub-Api-Version': '2022-11-28' }
  return token ? { Authorization: `Bearer ${token}`, ...headers } : headers
}

async function request({ fetch, url, token, accept }) {
  try {
    const isGithub = url.startsWith(GITHUB_API)
    const response = await fetch(url, isGithub ? { headers: buildHeaders({ token, accept }) } : {})
    return response.ok ? response : null
  } catch {
    return null
  }
}

async function getJson({ fetch, url, token }) {
  const response = await request({ fetch, url, token })
  if (!response) {
    return null
  }
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function getText({ fetch, url, token, accept }) {
  const response = await request({ fetch, url, token, accept })
  if (!response) {
    return null
  }
  try {
    return await response.text()
  } catch {
    return null
  }
}
