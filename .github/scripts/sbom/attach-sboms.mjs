// Uploads `payload-sboms-<version>.zip` from `dir` to the GitHub release for `tag`. Runs in the
// `attach-sboms` job of publish-release.yml via actions/github-script. Lists releases to find
// it, because `GET /releases/tags/{tag}` returns 404 for a draft release.

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const LABEL = 'SBOMs'

export async function attachSboms({ core, dir, github, owner, repo, tag }) {
  // The name comes from the tag, not from the artifact: the artifact is written by a job that
  // runs installed dependency code, so it cannot pick which file reaches the write token.
  const assetName = `payload-sboms-${tag.replace(/^v/, '')}.zip`
  const filePath = path.join(dir, assetName)
  if (!existsSync(filePath)) {
    throw new Error(`SBOM zip ${assetName} missing in ${dir}`)
  }

  const release = await findReleaseByTag({ github, owner, repo, tag })

  const existingAssets = await github.paginate(github.rest.repos.listReleaseAssets, {
    owner,
    per_page: 100,
    release_id: release.id,
    repo,
  })
  // A rerun finds the asset from the previous attempt; upload fails on a duplicate name.
  const existing = existingAssets.find((asset) => asset.name === assetName)
  if (existing) {
    await github.rest.repos.deleteReleaseAsset({ asset_id: existing.id, owner, repo })
  }

  const data = readFileSync(filePath)
  await github.rest.repos.uploadReleaseAsset({
    data,
    headers: { 'content-length': data.length, 'content-type': 'application/zip' },
    label: LABEL,
    name: assetName,
    owner,
    release_id: release.id,
    repo,
  })

  await core.summary.addRaw(`Attached ${assetName} to ${release.html_url}`).write()

  return { assetName, releaseUrl: release.html_url }
}

async function findReleaseByTag({ github, owner, repo, tag }) {
  const releases = await github.paginate(github.rest.repos.listReleases, {
    owner,
    per_page: 100,
    repo,
  })
  const match = releases.find((release) => release.tag_name === tag)
  if (!match) {
    throw new Error(`No GitHub release found for ${tag}`)
  }
  return match
}
