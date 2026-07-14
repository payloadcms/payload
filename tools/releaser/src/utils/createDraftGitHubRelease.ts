type Args = {
  branch: string
  fetchImpl?: typeof fetch
  releaseNotes: string
  tag: string
}

type GitHubRelease = {
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

// GET /releases/tags/{tag} returns 404 for DRAFT releases, so we list and match instead.
const findReleaseByTag = async ({
  fetchImpl,
  tag,
}: {
  fetchImpl: typeof fetch
  tag: string
}): Promise<GitHubRelease | undefined> => {
  for (let page = 1; ; page++) {
    const res = await fetchImpl(
      `https://api.github.com/repos/${REPO}/releases?per_page=${PER_PAGE}&page=${page}`,
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
    if (match) {
      return match
    }

    if (releases.length < PER_PAGE) {
      return undefined
    }
  }
}
