import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { attachSboms } from './attach-sboms.mjs'

const TAG = 'v4.0.0-beta.4'
const ZIP = 'payload-sboms-4.0.0-beta.4.zip'

const release = (overrides = {}) => ({
  draft: true,
  html_url: `https://github.com/payloadcms/payload/releases/tag/${TAG}`,
  id: 42,
  tag_name: TAG,
  ...overrides,
})

const makeGithub = ({ existingAssets = [], releases = [release()] } = {}) => {
  const rest = {
    repos: {
      deleteReleaseAsset: vi.fn(async () => ({})),
      listReleaseAssets: vi.fn(),
      listReleases: vi.fn(),
      uploadReleaseAsset: vi.fn(async () => ({})),
    },
  }
  const results = new Map([
    [rest.repos.listReleaseAssets, existingAssets],
    [rest.repos.listReleases, releases],
  ])
  const paginate = vi.fn(async (method) => {
    if (!results.has(method)) {
      throw new Error('unexpected paginate call')
    }
    return results.get(method)
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
    writeFileSync(path.join(dir, ZIP), 'PK')
  })

  afterEach(() => {
    rmSync(dir, { force: true, recursive: true })
  })

  const run = ({ core = makeCore(), github = makeGithub(), tag = TAG } = {}) =>
    attachSboms({ core, dir, github, owner: 'payloadcms', repo: 'payload', tag })

  it('uploads the SBOM zip for the tag with its label to the matching release', async () => {
    const github = makeGithub()

    const result = await run({ github })

    expect(result).toEqual({ assetName: ZIP, releaseUrl: release().html_url })
    expect(github.rest.repos.uploadReleaseAsset).toHaveBeenCalledOnce()
    expect(github.rest.repos.uploadReleaseAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'SBOMs',
        name: ZIP,
        owner: 'payloadcms',
        release_id: 42,
        repo: 'payload',
      }),
    )
  })

  it('sends the zip bytes with content type and length', async () => {
    const github = makeGithub()

    await run({ github })

    const [[args]] = github.rest.repos.uploadReleaseAsset.mock.calls

    expect(args.data.toString()).toBe('PK')
    expect(args.headers).toEqual({ 'content-length': 2, 'content-type': 'application/zip' })
  })

  it('picks the release that matches the tag', async () => {
    const github = makeGithub({
      releases: [
        release({ id: 1, tag_name: 'v4.0.0-beta.3' }),
        release(),
        release({ id: 3, tag_name: 'v4.0.0-beta.2' }),
      ],
    })

    await run({ github })

    expect(github.rest.repos.uploadReleaseAsset).toHaveBeenCalledWith(
      expect.objectContaining({ release_id: 42 }),
    )
  })

  it('deletes an existing asset with the same name before upload', async () => {
    const github = makeGithub({
      existingAssets: [
        { id: 6, name: 'notes.txt' },
        { id: 7, name: ZIP },
      ],
    })

    await run({ github })

    expect(github.rest.repos.deleteReleaseAsset).toHaveBeenCalledOnce()
    expect(github.rest.repos.deleteReleaseAsset).toHaveBeenCalledWith(
      expect.objectContaining({ asset_id: 7 }),
    )
    expect(github.rest.repos.deleteReleaseAsset.mock.invocationCallOrder[0]).toBeLessThan(
      github.rest.repos.uploadReleaseAsset.mock.invocationCallOrder[0] ?? 0,
    )
  })

  it('throws with the tag when no release matches, and uploads nothing', async () => {
    const github = makeGithub()
    writeFileSync(path.join(dir, 'payload-sboms-9.9.9.zip'), 'PK')

    await expect(run({ github, tag: 'v9.9.9' })).rejects.toThrow('v9.9.9')
    expect(github.rest.repos.uploadReleaseAsset).not.toHaveBeenCalled()
  })

  it('uploads when the release is published', async () => {
    const github = makeGithub({ releases: [release({ draft: false })] })

    await run({ github })

    expect(github.rest.repos.uploadReleaseAsset).toHaveBeenCalledOnce()
  })

  it('throws before any API call when the zip for the tag is missing', async () => {
    rmSync(path.join(dir, ZIP))
    writeFileSync(path.join(dir, 'payload-sboms-4.0.0-beta.3.zip'), 'PK')
    const github = makeGithub()

    await expect(run({ github })).rejects.toThrow(ZIP)
    expect(github.paginate).not.toHaveBeenCalled()
    expect(github.rest.repos.uploadReleaseAsset).not.toHaveBeenCalled()
  })

  it('writes the zip name and release URL to the job summary', async () => {
    const core = makeCore()

    await run({ core })

    expect(core.summary.addRaw).toHaveBeenCalledWith(`Attached ${ZIP} to ${release().html_url}`)
    expect(core.summary.write).toHaveBeenCalled()
  })
})
