type Args = {
  branch: string
  tag: string
  releaseNotes: string
}

export const createDraftGitHubRelease = async ({
  branch,
  tag,
  releaseNotes,
}: Args): Promise<{ releaseUrl: string }> => {
  // https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#create-a-release
  const res = await fetch(`https://api.github.com/repos/payloadcms/payload/releases`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
    },
    method: 'POST',
    body: JSON.stringify({
      tag_name: tag,
      target_commitish: branch,
      name: tag,
      body: releaseNotes,
      draft: true,
      prerelease: false,
      generate_release_notes: false,
    }),
  })

  if (!res.ok) {
    throw new Error(`Failed to create release: ${await res.text()}`)
  }

  const resBody = await res.json()

  return { releaseUrl: resBody.html_url }
}
