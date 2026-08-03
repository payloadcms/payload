type Args = {
  branch: string
  fetchImpl?: typeof fetch
  releaseNotes: string
  tag: string
}

type GitHubRelease = {
  draft: boolean
  html_url: string
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
            prerelease: false,
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

  const resBody = (await res.json()) as GitHubRelease
  return { releaseUrl: resBody.html_url }
}

// GET /releases/tags/{tag} returns 404 for DRAFT releases, so we list and match
// instead. The list is newest-first by created_at and a draft we would update was
// created recently, so it sits on the first page — we scan only the newest page to
// stay O(1) as the release history grows. A match buried deeper would require ~100
// releases created after the draft (implausible for a re-run); we warn if that
// near-impossible case is even reachable.
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

  const releases = (await res.json()) as GitHubRelease[]
  const match = releases.find((release) => release.tag_name === tag)

  if (!match && releases.length === PER_PAGE) {
    console.warn(
      `⚠️  ${tag} not found in the ${PER_PAGE} most recent releases; treating it as new. A draft buried deeper in the history would not be updated.`,
    )
  }

  return match
}
