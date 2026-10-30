const GITHUB_API = 'https://api.github.com'
const MAX_PAGES = 5
const PAGE_SIZE = 100
const MAX_COMMITS = 10
const DEFAULT_EVIDENCE_BUDGET = 120000
const BOT_PATTERN = /(\[bot\]$|^renovate|^dependabot|^github-actions)/i
const VERSION_PATTERN = /(\d+)\.(\d+)\.(\d+)/
const HEADING_PATTERN = /^#{1,3}\s+(.*)$/

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

/** @returns {Promise<string | null>} */
export async function findTag({ fetch, repo, name, version, token }) {
  if (!repo) {
    return null
  }
  const tags = await listTags({ fetch, repo, token })
  return pickTag({ tags, repo, name, version })?.name ?? null
}

/**
 * Release notes for one bump. Majors list X.0.0 releases in (from, to]; with `includeMinors`
 * every other release in range follows them. Non-majors list only the `to` release.
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
  if (!repo) {
    return { entries: [], links, source: 'none' }
  }

  const repoUrl = `https://github.com/${repo.owner}/${repo.name}`
  links.releases = `${repoUrl}/releases`

  const tags = await listTags({ fetch, repo, token })
  const fromTag = pickTag({ tags, repo, name, version: from })
  const toTag = pickTag({ tags, repo, name, version: to })
  if (fromTag && toTag) {
    links.compare = `${repoUrl}/compare/${fromTag.name}...${toTag.name}`
  }

  const select = (candidates) => selectEntries({ candidates, from, to, isMajor, includeMinors })

  const releaseEntries = select(await fetchReleaseCandidates({ fetch, repo, name, token }))
  if (releaseEntries.length > 0) {
    return { entries: releaseEntries, links, source: 'releases' }
  }

  const changelogPath = repo.directory ? `${repo.directory}/CHANGELOG.md` : 'CHANGELOG.md'
  const changelogText = await getText({
    fetch,
    url: `${GITHUB_API}/repos/${repo.owner}/${repo.name}/contents/${encodeURI(changelogPath)}`,
    token,
    accept: 'application/vnd.github.raw+json',
  })
  if (changelogText === null) {
    return { entries: [], links, source: 'none' }
  }

  links.changelog = `${repoUrl}/blob/HEAD/${changelogPath}`
  const changelogEntries = select(cutChangelog({ text: changelogText, url: links.changelog }))
  return {
    entries: changelogEntries,
    links,
    source: changelogEntries.length > 0 ? 'changelog' : 'none',
  }
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

  const tags = await listTags({ fetch, repo, token })
  const fromTag = pickTag({ tags, repo, name, version: from })
  const toTag = pickTag({ tags, repo, name, version: to })
  if (!fromTag || !toTag) {
    return empty
  }

  const compareUrl = `https://github.com/${repo.owner}/${repo.name}/compare/${fromTag.name}...${toTag.name}`
  const rawCommits = repo.directory
    ? await fetchPathCommits({ fetch, repo, fromTag, toTag, token })
    : await fetchCompareCommits({ fetch, repo, fromTag, toTag, token })
  if (!rawCommits) {
    return empty
  }

  const humanCommits = rawCommits.filter((commit) => !isBotCommit({ commit }))
  return {
    ...empty,
    commits: humanCommits.slice(0, MAX_COMMITS).map(toCommitSummary),
    total: humanCommits.length,
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

function pickTag({ tags, repo, name, version }) {
  const names = new Set(tags.map((tag) => tag.name))
  const match = tagPrefixes({ repo, name })
    .map((prefix) => `${prefix}${version}`)
    .find((candidate) => names.has(candidate))
  return tags.find((tag) => tag.name === match) ?? null
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

async function listTags({ fetch, repo, token }) {
  const pages = await listPages({
    fetch,
    token,
    url: (page) =>
      `${GITHUB_API}/repos/${repo.owner}/${repo.name}/tags?per_page=${PAGE_SIZE}&page=${page}`,
  })
  return pages.filter((tag) => typeof tag?.name === 'string')
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

async function fetchCompareCommits({ fetch, repo, fromTag, toTag }) {
  const data = await getJson({
    fetch,
    url: `${GITHUB_API}/repos/${repo.owner}/${repo.name}/compare/${encodeURIComponent(fromTag.name)}...${encodeURIComponent(toTag.name)}`,
  })
  return Array.isArray(data?.commits) ? data.commits : null
}

async function fetchPathCommits({ fetch, repo, fromTag, toTag, token }) {
  const [fromCommit, toCommit] = await Promise.all(
    [fromTag, toTag].map((tag) =>
      getJson({
        fetch,
        url: `${GITHUB_API}/repos/${repo.owner}/${repo.name}/commits/${encodeURIComponent(tag.name)}`,
        token,
      }),
    ),
  )
  const since = fromCommit?.commit?.committer?.date
  const until = toCommit?.commit?.committer?.date
  if (!since || !until) {
    return null
  }

  const query = new URLSearchParams({
    path: repo.directory,
    since,
    until,
    per_page: String(PAGE_SIZE),
  })
  const commits = await getJson({
    fetch,
    url: `${GITHUB_API}/repos/${repo.owner}/${repo.name}/commits?${query}`,
    token,
  })
  if (!Array.isArray(commits)) {
    return null
  }
  return commits.filter((commit) => commit.sha !== fromCommit.sha)
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

function selectEntries({ candidates, from, to, isMajor, includeMinors }) {
  const byVersion = new Map()
  for (const candidate of candidates) {
    if (!byVersion.has(candidate.version)) {
      byVersion.set(candidate.version, candidate)
    }
  }

  const entries = [...byVersion.values()]
    .filter((candidate) => compareVersions({ a: candidate.version, b: from }) > 0)
    .filter((candidate) => compareVersions({ a: candidate.version, b: to }) <= 0)
    .map((candidate) => ({ ...candidate, isMajor: isMajorRelease({ version: candidate.version }) }))
    .filter((entry) => {
      if (!isMajor) {
        return entry.version === to
      }
      return entry.isMajor || includeMinors
    })

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

/** Splits a changelog at headings that carry a semver, in any of `#`, `##`, `###`. */
function cutChangelog({ text, url }) {
  const sections = []
  let current = null

  for (const line of text.split('\n')) {
    const heading = line.match(HEADING_PATTERN)
    const version = heading?.[1].match(VERSION_PATTERN)?.[0]
    if (version) {
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
