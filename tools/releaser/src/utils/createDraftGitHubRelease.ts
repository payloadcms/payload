import semver from 'semver'

type Args = {
  branch: string
  fetchImpl?: typeof fetch
  releaseNotes: string
  tag: string
}

type GitHubRelease = {
  draft: boolean
  id: number
  tag_name: string
}

const REPO = 'payloadcms/payload'
const PER_PAGE = 100

export const createDraftGitHubRelease = async ({
  branch,
  fetchImpl = fetch,
  releaseNotes,
  tag,
}: Args): Promise<{ releaseUrl: string }> => {
  const existing = await findReleaseByTag({ fetchImpl, tag })

  // Only a still-draft release is safe to overwrite. A matching PUBLISHED release
  // means this tag already shipped — refuse rather than clobber its live notes.
  if (existing && !existing.draft) {
    throw new Error(
      `Refusing to overwrite the already-published GitHub release for ${tag}. Edit it manually if the update is intended.`,
    )
  }

  if (existing) {
    console.log(`📝 Found existing draft release for ${tag}; updating it.`)
  }

  // https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28
  const url = existing
    ? `https://api.github.com/repos/${REPO}/releases/${existing.id}`
    : `https://api.github.com/repos/${REPO}/releases`

  const res = await fetchImpl(url, {
    body: JSON.stringify(
      existing
        ? { body: releaseNotes, name: tag }
        : {
            name: tag,
            body: releaseNotes,
            draft: true,
            generate_release_notes: false,
            // A prerelease is never marked "Latest", so it cannot displace the stable line.
            prerelease: semver.prerelease(tag) !== null,
            tag_name: tag,
            target_commitish: branch,
          },
    ),
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
    },
    method: existing ? 'PATCH' : 'POST',
  })

  if (!res.ok) {
    throw new Error(`Failed to ${existing ? 'update' : 'create'} release: ${await res.text()}`)
  }

  const resBody: unknown = await res.json()

  if (!hasHtmlUrl(resBody)) {
    throw new Error('GitHub release response has no html_url')
  }

  return { releaseUrl: resBody.html_url }
}

// GET /releases/tags/{tag} returns 404 for DRAFT releases, so we list and match
// instead. The list is newest-first by created_at and a draft we would update was
// created recently, so it sits on the first page — we scan only the newest page to
// stay O(1) as the release history grows. A match buried deeper would require ~100
// releases created after the draft, which is implausible for a re-run.
const findReleaseByTag = async ({
  fetchImpl,
  tag,
}: {
  fetchImpl: typeof fetch
  tag: string
}): Promise<GitHubRelease | undefined> => {
  const res = await fetchImpl(
    `https://api.github.com/repos/${REPO}/releases?per_page=${PER_PAGE}&page=1`,
    {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
      method: 'GET',
    },
  )

  if (!res.ok) {
    throw new Error(`Failed to list releases: ${await res.text()}`)
  }

  const releases: unknown = await res.json()

  if (!isGitHubReleaseList(releases)) {
    throw new Error('Unexpected GitHub releases list response')
  }

  return releases.find((release) => release.tag_name === tag)
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const hasHtmlUrl = (body: unknown): body is { html_url: string } =>
  isRecord(body) && typeof body.html_url === 'string'

const isGitHubReleaseList = (body: unknown): body is GitHubRelease[] =>
  Array.isArray(body) &&
  body.every(
    (item: unknown) =>
      isRecord(item) &&
      typeof item.id === 'number' &&
      typeof item.draft === 'boolean' &&
      typeof item.tag_name === 'string',
  )
