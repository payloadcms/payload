import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { attachSboms } from './attach-sboms.mjs'

const TAG = 'v4.0.0-beta.4'

const ASSETS = [
  { file: 'payload-4.0.0-beta.4.cdx.json', label: 'payload (CycloneDX 1.6)' },
  { file: 'payloadcms-ui-4.0.0-beta.4.cdx.json', label: '@payloadcms/ui (CycloneDX 1.6)' },
  { file: 'SHA256SUMS', label: 'SHA-256 checksums' },
]

const release = (overrides = {}) => ({
  draft: true,
  html_url: `https://github.com/payloadcms/payload/releases/tag/${TAG}`,
  id: 42,
  tag_name: TAG,
  ...overrides,
})

const makeGithub = ({ existingAssets = [], releasePages = [[release()]] } = {}) => {
  const rest = {
    repos: {
      deleteReleaseAsset: vi.fn(async () => ({})),
      listReleaseAssets: vi.fn(),
      listReleases: vi.fn(),
      uploadReleaseAsset: vi.fn(async () => ({})),
    },
  }
  const paginate = vi.fn(async (method) => {
    if (method !== rest.repos.listReleaseAssets) {
      throw new Error('unexpected paginate call')
    }
    return existingAssets
  })
  paginate.iterator = vi.fn((method) => {
    if (method !== rest.repos.listReleases) {
      throw new Error('unexpected paginate.iterator call')
    }
    return (async function* () {
      for (const data of releasePages) {
        yield { data }
      }
    })()
  })
  return { paginate, rest }
}

const makeCore = () => {
  const summary = { addRaw: vi.fn(() => summary), write: vi.fn(async () => summary) }
  return { info: vi.fn(), summary, warning: vi.fn() }
}

describe('attachSboms', () => {
  let dir

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'attach-sboms-'))
    for (const { file } of ASSETS) {
      writeFileSync(path.join(dir, file), file.endsWith('.json') ? '{}' : 'abc  file\n')
    }
    writeFileSync(path.join(dir, 'sbom-manifest.json'), JSON.stringify({ assets: ASSETS }))
  })

  afterEach(() => {
    rmSync(dir, { force: true, recursive: true })
  })

  const run = ({ core = makeCore(), github = makeGithub(), tag = TAG } = {}) =>
    attachSboms({ core, dir, github, owner: 'payloadcms', repo: 'payload', tag })

  it('uploads every manifest asset with its label to the matching release', async () => {
    const github = makeGithub()

    const result = await run({ github })

    expect(result).toEqual({ attached: 3, releaseUrl: release().html_url })
    expect(github.rest.repos.uploadReleaseAsset).toHaveBeenCalledTimes(3)
    expect(github.rest.repos.uploadReleaseAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        label: '@payloadcms/ui (CycloneDX 1.6)',
        name: 'payloadcms-ui-4.0.0-beta.4.cdx.json',
        owner: 'payloadcms',
        release_id: 42,
        repo: 'payload',
      }),
    )
  })

  it('sends the file bytes with content type and length', async () => {
    const github = makeGithub()

    await run({ github })

    const calls = github.rest.repos.uploadReleaseAsset.mock.calls.map(([args]) => args)
    const json = calls.find((args) => args.name.endsWith('.cdx.json'))
    const sums = calls.find((args) => args.name === 'SHA256SUMS')

    expect(json.data.toString()).toBe('{}')
    expect(json.headers).toEqual({ 'content-length': 2, 'content-type': 'application/json' })
    expect(sums.headers['content-type']).toBe('text/plain')
  })

  it('finds a draft release on a later page', async () => {
    const github = makeGithub({
      releasePages: [[release({ id: 1, tag_name: 'v4.0.0-beta.3' })], [release()]],
    })

    await run({ github })

    expect(github.rest.repos.uploadReleaseAsset).toHaveBeenCalledWith(
      expect.objectContaining({ release_id: 42 }),
    )
  })

  it('deletes an existing asset with the same name before upload', async () => {
    const github = makeGithub({ existingAssets: [{ id: 7, name: 'SHA256SUMS' }] })

    const result = await run({ github })

    expect(github.rest.repos.deleteReleaseAsset).toHaveBeenCalledTimes(1)
    expect(github.rest.repos.deleteReleaseAsset).toHaveBeenCalledWith(
      expect.objectContaining({ asset_id: 7 }),
    )

    const uploadCalls = github.rest.repos.uploadReleaseAsset.mock.calls
    const sumsUploadIndex = uploadCalls.findIndex(([args]) => args.name === 'SHA256SUMS')
    const deleteOrder = github.rest.repos.deleteReleaseAsset.mock.invocationCallOrder[0]
    const sumsUploadOrder =
      github.rest.repos.uploadReleaseAsset.mock.invocationCallOrder[sumsUploadIndex]

    expect(deleteOrder).toBeLessThan(sumsUploadOrder)
    expect(result.attached).toBe(3)
  })

  it('throws with the tag when no release matches, and uploads nothing', async () => {
    const github = makeGithub()

    await expect(run({ github, tag: 'v9.9.9' })).rejects.toThrow('v9.9.9')
    expect(github.rest.repos.uploadReleaseAsset).not.toHaveBeenCalled()
  })

  it('warns but uploads when the release is published', async () => {
    const core = makeCore()
    const github = makeGithub({ releasePages: [[release({ draft: false })]] })

    const result = await run({ core, github })

    expect(core.warning).toHaveBeenCalledWith(expect.stringContaining(TAG))
    expect(result.attached).toBe(3)
  })

  it('throws when a manifest file is missing on disk', async () => {
    rmSync(path.join(dir, 'SHA256SUMS'))
    const github = makeGithub()

    await expect(run({ github })).rejects.toThrow(/missing.*SHA256SUMS/)
    expect(github.paginate.iterator).not.toHaveBeenCalled()
    expect(github.rest.repos.uploadReleaseAsset).not.toHaveBeenCalled()
  })

  it('writes the asset count and release URL to the job summary', async () => {
    const core = makeCore()

    await run({ core })

    expect(core.summary.addRaw).toHaveBeenCalledWith(
      `Attached 3 SBOM assets to ${release().html_url}`,
    )
    expect(core.summary.write).toHaveBeenCalled()
  })
})
