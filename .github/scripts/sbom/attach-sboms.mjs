// Uploads the files in `sbom-manifest.json` to the GitHub release for `tag`. Runs in the
// `attach-sboms` job of publish-release.yml via actions/github-script. Lists releases to find
// it, because `GET /releases/tags/{tag}` returns 404 for a draft release.

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const SBOM_FILE = /^[a-z0-9][a-z0-9.-]*\.(cdx|spdx)\.json$/
const SBOM_LABEL = /^(@[a-z0-9-]+\/)?[a-z0-9.-]+ \((CycloneDX 1\.6|SPDX 2\.3)\)$/

export async function attachSboms({ core, dir, github, owner, repo, tag }) {
  const { assets } = JSON.parse(readFileSync(path.join(dir, 'sbom-manifest.json'), 'utf8'))
  // The manifest comes from a job that runs installed dependency code; only SBOM-shaped
  // names may reach the write token, so a tampered entry cannot read or publish other files.
  const unexpected = assets.filter((asset) => !isExpectedAsset(asset))
  if (unexpected.length > 0) {
    throw new Error(`Unexpected manifest entry: ${JSON.stringify(unexpected)}`)
  }

  const missing = assets.filter(({ file }) => !existsSync(path.join(dir, file)))
  if (missing.length > 0) {
    throw new Error(
      `Manifest files missing in ${dir}: ${missing.map(({ file }) => file).join(', ')}`,
    )
  }

  const release = await findReleaseByTag({ github, owner, repo, tag })
  if (!release.draft) {
    core.warning(`${tag} is already published; uploading anyway`)
  }

  const existingAssets = await github.paginate(github.rest.repos.listReleaseAssets, {
    owner,
    per_page: 100,
    release_id: release.id,
    repo,
  })
  const existingIdByName = new Map(existingAssets.map((asset) => [asset.name, asset.id]))

  for (const { file, label } of assets) {
    // A rerun after a partial upload finds some assets already there; upload fails on a duplicate name.
    const existingId = existingIdByName.get(file)
    if (existingId !== undefined) {
      await github.rest.repos.deleteReleaseAsset({ asset_id: existingId, owner, repo })
    }

    const data = readFileSync(path.join(dir, file))
    await github.rest.repos.uploadReleaseAsset({
      data,
      headers: {
        'content-length': data.length,
        'content-type': file.endsWith('.json') ? 'application/json' : 'text/plain',
      },
      label,
      name: file,
      owner,
      release_id: release.id,
      repo,
    })
    core.info(`Uploaded ${file}`)
  }

  await core.summary.addRaw(`Attached ${assets.length} SBOM assets to ${release.html_url}`).write()

  return { attached: assets.length, releaseUrl: release.html_url }
}

async function findReleaseByTag({ github, owner, repo, tag }) {
  const pages = github.paginate.iterator(github.rest.repos.listReleases, {
    owner,
    per_page: 100,
    repo,
  })
  for await (const { data } of pages) {
    const match = data.find((release) => release.tag_name === tag)
    if (match) {
      return match
    }
  }
  throw new Error(`No GitHub release found for ${tag}`)
}

function isExpectedAsset({ file, label }) {
  if (file === 'SHA256SUMS') {
    return label === 'SHA-256 checksums'
  }
  return SBOM_FILE.test(file) && SBOM_LABEL.test(label)
}
