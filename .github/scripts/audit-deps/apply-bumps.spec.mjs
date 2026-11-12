import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { applyBumps, NonRaisingBumpError } from './apply-bumps.mjs'

const catalogManifest = '{\n  "dependencies": {\n    "dep": "catalog:"\n  }\n}\n'

function bump({ dependency = 'dep', to, manifests }) {
  return {
    id: `${dependency}-1`,
    advisories: [],
    dependency,
    from: '',
    fromVersion: '',
    isMajor: false,
    manifests,
    to,
  }
}

async function makeRepo({ files }) {
  const cwd = await mkdtemp(path.join(tmpdir(), 'apply-bumps-'))
  for (const [file, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(cwd, file)), { recursive: true })
    await writeFile(path.join(cwd, file), content)
  }
  return cwd
}

function readRepoFile({ cwd, file }) {
  return readFile(path.join(cwd, file), 'utf8')
}

describe('applyBumps', () => {
  it('should edit each manifest and keep every other byte', async () => {
    const a = '{\n    "name": "a",\n    "dependencies": {\n        "dep": "1.2.0"\n    }\n}\n'
    const b = '{\n  "devDependencies": {\n    "dep": "^1.2.0"\n  },\n  "name": "b"\n}\n'
    const cwd = await makeRepo({ files: { 'a/package.json': a, 'b/package.json': b } })

    const { changes } = await applyBumps({
      bumps: [bump({ to: '1.2.5', manifests: ['a/package.json', 'b/package.json'] })],
      cwd,
    })

    expect(await readRepoFile({ cwd, file: 'a/package.json' })).toBe(a.replace('1.2.0', '1.2.5'))
    expect(await readRepoFile({ cwd, file: 'b/package.json' })).toBe(b.replace('^1.2.0', '^1.2.5'))
    expect(changes).toEqual([
      { file: 'a/package.json', after: '1.2.5', before: '1.2.0', dependency: 'dep' },
      { file: 'b/package.json', after: '^1.2.5', before: '^1.2.0', dependency: 'dep' },
    ])
  })

  it('should edit the catalog entry and leave the manifest alone', async () => {
    const workspace =
      "packages:\n  - 'a'\n\ncatalog:\n  # note\n  other: '1.0.0'\n  dep: '2.4.1'\n  zed: '3.0.0'\n\nsavePrefix: ''\n"
    const cwd = await makeRepo({
      files: { 'a/package.json': catalogManifest, 'pnpm-workspace.yaml': workspace },
    })

    const { changes } = await applyBumps({
      bumps: [bump({ to: '2.5.0', manifests: ['a/package.json'] })],
      cwd,
    })

    expect(await readRepoFile({ cwd, file: 'a/package.json' })).toBe(catalogManifest)
    expect(await readRepoFile({ cwd, file: 'pnpm-workspace.yaml' })).toBe(
      workspace.replace("dep: '2.4.1'", "dep: '2.5.0'"),
    )
    expect(changes).toEqual([
      { file: 'pnpm-workspace.yaml', after: '2.5.0', before: '2.4.1', dependency: 'dep' },
    ])
  })

  it('should edit a quoted scoped catalog key and ignore same-named keys outside catalog', async () => {
    const manifest = '{\n  "dependencies": {\n    "@s/dep": "catalog:"\n  }\n}\n'
    const workspace = "overrides:\n  '@s/dep': '1.0.0'\n\ncatalog:\n  '@s/dep': '1.0.0'\n"
    const cwd = await makeRepo({
      files: { 'a/package.json': manifest, 'pnpm-workspace.yaml': workspace },
    })

    await applyBumps({
      bumps: [bump({ dependency: '@s/dep', to: '1.1.0', manifests: ['a/package.json'] })],
      cwd,
    })

    expect(await readRepoFile({ cwd, file: 'pnpm-workspace.yaml' })).toBe(
      "overrides:\n  '@s/dep': '1.0.0'\n\ncatalog:\n  '@s/dep': '1.1.0'\n",
    )
  })

  it.each([
    ['5.7.0', '5.6.1'],
    ['5.6.1', '5.6.1'],
    ['>=5.0.0', '5.6.1'],
    ['^4.0.0 || ^5.0.0', '5.6.1'],
    ['workspace:*', '5.6.1'],
  ])('should throw when the only manifest spec %s cannot be raised to %s', async (spec, to) => {
    const pkg = `{\n  "dependencies": {\n    "dep": "${spec}"\n  }\n}\n`
    const cwd = await makeRepo({ files: { 'a/package.json': pkg } })

    await expect(
      applyBumps({ bumps: [bump({ to, manifests: ['a/package.json'] })], cwd }),
    ).rejects.toThrow(NonRaisingBumpError)
    expect(await readRepoFile({ cwd, file: 'a/package.json' })).toBe(pkg)
  })

  it('should leave a manifest with a range it cannot raise and raise the others', async () => {
    const a = '{\n  "dependencies": {\n    "dep": ">=5.0.0"\n  }\n}\n'
    const b = '{\n  "dependencies": {\n    "dep": "^5.6.0"\n  }\n}\n'
    const cwd = await makeRepo({ files: { 'a/package.json': a, 'b/package.json': b } })

    const { changes } = await applyBumps({
      bumps: [bump({ to: '5.6.1', manifests: ['a/package.json', 'b/package.json'] })],
      cwd,
    })

    expect(await readRepoFile({ cwd, file: 'a/package.json' })).toBe(a)
    expect(changes).toEqual([
      { file: 'b/package.json', after: '^5.6.1', before: '^5.6.0', dependency: 'dep' },
    ])
  })

  it('should skip a manifest already at the target and raise the others', async () => {
    const a = '{\n  "dependencies": {\n    "dep": "5.7.0"\n  }\n}\n'
    const b = '{\n  "dependencies": {\n    "dep": "^5.6.0"\n  }\n}\n'
    const cwd = await makeRepo({ files: { 'a/package.json': a, 'b/package.json': b } })

    const { changes } = await applyBumps({
      bumps: [bump({ to: '5.6.1', manifests: ['a/package.json', 'b/package.json'] })],
      cwd,
    })

    expect(await readRepoFile({ cwd, file: 'a/package.json' })).toBe(a)
    expect(changes).toEqual([
      { file: 'b/package.json', after: '^5.6.1', before: '^5.6.0', dependency: 'dep' },
    ])
  })
})
