import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('child_process', () => ({ execSync: vi.fn(), spawn: vi.fn() }))
vi.mock('./getPackageRegistryVersions.js', () => ({
  isVersionPublished: vi.fn(),
}))
vi.mock('globby', () => ({ default: vi.fn() }))
vi.mock('fs-extra', () => ({ default: { readJson: vi.fn() } }))

import { spawn } from 'child_process'
import fse from 'fs-extra'
import globby from 'globby'

import { isVersionPublished } from './getPackageRegistryVersions.js'
import { getWorkspace } from './getWorkspace.js'
import { packagePublishList } from './publishList.js'

const spawnExiting = (exitCode: number) => {
  const child = Object.assign(new EventEmitter(), {
    stderr: new EventEmitter(),
    stdout: new EventEmitter(),
  })
  queueMicrotask(() => child.emit('close', exitCode))
  return child
}

const spawnedPaths = () =>
  vi.mocked(spawn).mock.calls.map(([, args]) => args[args.indexOf('-C') + 1])

const nameFor = (shortName: string) =>
  shortName === 'payload' || shortName === 'create-payload-app'
    ? shortName
    : `@payloadcms/${shortName}`

describe('workspace.publish order', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    // Reverse alphabetical glob order, plus a package that is not on the publish list.
    const globbed = [...packagePublishList, 'not-published'].sort().reverse()
    vi.mocked(globby).mockResolvedValue(
      globbed.map((shortName) => `/repo/packages/${shortName}/package.json`),
    )
    vi.mocked(fse.readJson).mockImplementation(async (packageJsonPath: string) => ({
      name: nameFor(packageJsonPath.split('/').at(-2) ?? ''),
      version: '4.0.0-beta.2',
    }))
    vi.mocked(isVersionPublished).mockResolvedValue(false)
    vi.mocked(spawn).mockImplementation(() => spawnExiting(0) as never)
  })

  it('should spawn publishes in packagePublishList order for a single tag', async () => {
    await getWorkspace().publish({ tag: 'beta' })

    expect(spawnedPaths()).toEqual(packagePublishList.map((shortName) => `packages/${shortName}`))
  })
})
