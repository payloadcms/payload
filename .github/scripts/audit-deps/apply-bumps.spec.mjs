import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  applyBumps,
  NonRaisingBumpError,
  setSpecifierVersion,
  UnsupportedSpecifierError,
} from './apply-bumps.mjs'

function bump({ dependency = 'dep', to, manifests }) {
  return {
    id: `${dependency}-1`,
    advisories: [],
    dependency,
    fallbackFor: null,
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

describe('setSpecifierVersion', () => {
  it('keeps the range prefix', () => {
    expect(setSpecifierVersion({ spec: '5.6.0', version: '7.0.2' })).toBe('7.0.2')
    expect(setSpecifierVersion({ spec: '^9.5.0', version: '10.54.0' })).toBe('^10.54.0')
    expect(setSpecifierVersion({ spec: '~1.2.0', version: '1.2.5' })).toBe('~1.2.5')
  })

  it.each(['>=1.0.0', '*', 'workspace:*', 'npm:x@1'])('throws for %s', (spec) => {
    expect(() => setSpecifierVersion({ spec, version: '2.0.0' })).toThrow(UnsupportedSpecifierError)
  })
})

describe('applyBumps', () => {
  it('edits each manifest and keeps every other byte', async () => {
    const a = '{\n    "name": "a",\n    "dependencies": {\n        "dep": "1.2.0"\n    }\n}\n'
    const b = '{\n  "devDependencies": {\n    "dep": "^1.2.0"\n  },\n  "name": "b"\n}\n'
    const cwd = await makeRepo({ files: { 'a/package.json': a, 'b/package.json': b } })

    const { changes } = await applyBumps({
      bumps: [bump({ to: '1.2.5', manifests: ['a/package.json', 'b/package.json'] })],
      cwd,
    })

    expect(await readFile(path.join(cwd, 'a/package.json'), 'utf8')).toBe(
      a.replace('1.2.0', '1.2.5'),
    )
    expect(await readFile(path.join(cwd, 'b/package.json'), 'utf8')).toBe(
      b.replace('^1.2.0', '^1.2.5'),
    )
    expect(changes).toEqual([
      { file: 'a/package.json', after: '1.2.5', before: '1.2.0', dependency: 'dep' },
      { file: 'b/package.json', after: '^1.2.5', before: '^1.2.0', dependency: 'dep' },
    ])
  })

  it('only edits the section that declares the dependency', async () => {
    const pkg =
      '{\n  "dependencies": {\n    "other": "1.2.0"\n  },\n  "peerDependencies": {\n    "dep": "1.2.0"\n  }\n}\n'
    const cwd = await makeRepo({ files: { 'a/package.json': pkg } })

    await applyBumps({ bumps: [bump({ to: '1.2.5', manifests: ['a/package.json'] })], cwd })

    expect(await readFile(path.join(cwd, 'a/package.json'), 'utf8')).toBe(
      pkg.replace('"dep": "1.2.0"', '"dep": "1.2.5"'),
    )
  })

  it.each([
    ["'2.4.1'", "'2.5.0'", "'"],
    ['2.4.1', '2.5.0', ''],
    ['"2.4.1"', '"2.5.0"', '"'],
  ])('edits the catalog entry %s and leaves the manifest alone', async (before, after) => {
    const manifest = '{\n  "dependencies": {\n    "dep": "catalog:"\n  }\n}\n'
    const workspace = `packages:\n  - 'a'\n\ncatalog:\n  # note\n  other: '1.0.0'\n  dep: ${before}\n  zed: '3.0.0'\n\nsavePrefix: ''\n`
    const cwd = await makeRepo({
      files: { 'a/package.json': manifest, 'pnpm-workspace.yaml': workspace },
    })

    const { changes } = await applyBumps({
      bumps: [bump({ to: '2.5.0', manifests: ['a/package.json'] })],
      cwd,
    })

    expect(await readFile(path.join(cwd, 'a/package.json'), 'utf8')).toBe(manifest)
    expect(await readFile(path.join(cwd, 'pnpm-workspace.yaml'), 'utf8')).toBe(
      workspace.replace(`dep: ${before}`, `dep: ${after}`),
    )
    expect(changes).toEqual([
      {
        file: 'pnpm-workspace.yaml',
        after: after.replaceAll(/['"]/g, ''),
        before: before.replaceAll(/['"]/g, ''),
        dependency: 'dep',
      },
    ])
  })

  it('edits a quoted scoped catalog key and ignores same-named keys outside catalog', async () => {
    const manifest = '{\n  "dependencies": {\n    "@s/dep": "catalog:"\n  }\n}\n'
    const workspace = "overrides:\n  '@s/dep': '1.0.0'\n\ncatalog:\n  '@s/dep': '1.0.0'\n"
    const cwd = await makeRepo({
      files: { 'a/package.json': manifest, 'pnpm-workspace.yaml': workspace },
    })

    await applyBumps({
      bumps: [bump({ dependency: '@s/dep', to: '1.1.0', manifests: ['a/package.json'] })],
      cwd,
    })

    expect(await readFile(path.join(cwd, 'pnpm-workspace.yaml'), 'utf8')).toBe(
      "overrides:\n  '@s/dep': '1.0.0'\n\ncatalog:\n  '@s/dep': '1.1.0'\n",
    )
  })

  it('edits a catalog entry once when several manifests use it', async () => {
    const manifest = '{\n  "dependencies": {\n    "dep": "catalog:"\n  }\n}\n'
    const cwd = await makeRepo({
      files: {
        'a/package.json': manifest,
        'b/package.json': manifest,
        'pnpm-workspace.yaml': "catalog:\n  dep: '1.0.0'\n",
      },
    })

    const { changes } = await applyBumps({
      bumps: [bump({ to: '1.1.0', manifests: ['a/package.json', 'b/package.json'] })],
      cwd,
    })

    expect(changes).toHaveLength(1)
  })

  it('throws when the catalog value is an npm alias', async () => {
    const cwd = await makeRepo({
      files: {
        'a/package.json': '{\n  "dependencies": {\n    "dep": "catalog:"\n  }\n}\n',
        'pnpm-workspace.yaml': "catalog:\n  dep: 'npm:typescript@7.0.2'\n",
      },
    })

    await expect(
      applyBumps({ bumps: [bump({ to: '7.0.3', manifests: ['a/package.json'] })], cwd }),
    ).rejects.toThrow(UnsupportedSpecifierError)
  })

  it.each([
    ['5.7.0', '5.6.1'],
    ['5.6.1', '5.6.1'],
  ])('throws when the manifest spec %s already reaches %s', async (spec, to) => {
    const pkg = `{\n  "dependencies": {\n    "dep": "${spec}"\n  }\n}\n`
    const cwd = await makeRepo({ files: { 'a/package.json': pkg } })

    await expect(
      applyBumps({ bumps: [bump({ to, manifests: ['a/package.json'] })], cwd }),
    ).rejects.toThrow(NonRaisingBumpError)
    expect(await readFile(path.join(cwd, 'a/package.json'), 'utf8')).toBe(pkg)
  })

  it('skips a manifest already at the target and raises the others', async () => {
    const a = '{\n  "dependencies": {\n    "dep": "5.7.0"\n  }\n}\n'
    const b = '{\n  "dependencies": {\n    "dep": "^5.6.0"\n  }\n}\n'
    const cwd = await makeRepo({ files: { 'a/package.json': a, 'b/package.json': b } })

    const { changes } = await applyBumps({
      bumps: [bump({ to: '5.6.1', manifests: ['a/package.json', 'b/package.json'] })],
      cwd,
    })

    expect(await readFile(path.join(cwd, 'a/package.json'), 'utf8')).toBe(a)
    expect(await readFile(path.join(cwd, 'b/package.json'), 'utf8')).toBe(
      b.replace('^5.6.0', '^5.6.1'),
    )
    expect(changes).toEqual([
      { file: 'b/package.json', after: '^5.6.1', before: '^5.6.0', dependency: 'dep' },
    ])
  })

  it('skips a catalog line already at the target', async () => {
    const workspace = "catalog:\n  dep: '^5.7.0'\n"
    const direct = '{\n  "dependencies": {\n    "dep": "5.6.0"\n  }\n}\n'
    const cwd = await makeRepo({
      files: {
        'a/package.json': '{\n  "dependencies": {\n    "dep": "catalog:"\n  }\n}\n',
        'b/package.json': direct,
        'pnpm-workspace.yaml': workspace,
      },
    })

    await applyBumps({
      bumps: [bump({ to: '5.6.1', manifests: ['a/package.json', 'b/package.json'] })],
      cwd,
    })

    expect(await readFile(path.join(cwd, 'pnpm-workspace.yaml'), 'utf8')).toBe(workspace)
    expect(await readFile(path.join(cwd, 'b/package.json'), 'utf8')).toBe(
      direct.replace('5.6.0', '5.6.1'),
    )
  })

  it('throws when every spec, catalog included, already reaches the target', async () => {
    const cwd = await makeRepo({
      files: {
        'a/package.json': '{\n  "dependencies": {\n    "dep": "catalog:"\n  }\n}\n',
        'b/package.json': '{\n  "dependencies": {\n    "dep": "^5.6.1"\n  }\n}\n',
        'pnpm-workspace.yaml': "catalog:\n  dep: '^5.7.0'\n",
      },
    })

    await expect(
      applyBumps({
        bumps: [bump({ to: '5.6.1', manifests: ['a/package.json', 'b/package.json'] })],
        cwd,
      }),
    ).rejects.toThrow(NonRaisingBumpError)
  })

  it('raises a range spec below the target', async () => {
    const pkg = '{\n  "dependencies": {\n    "dep": "^5.6.0"\n  }\n}\n'
    const cwd = await makeRepo({ files: { 'a/package.json': pkg } })

    await applyBumps({ bumps: [bump({ to: '5.6.1', manifests: ['a/package.json'] })], cwd })

    expect(await readFile(path.join(cwd, 'a/package.json'), 'utf8')).toBe(
      pkg.replace('^5.6.0', '^5.6.1'),
    )
  })

  it('throws when the manifest does not declare the dependency', async () => {
    const cwd = await makeRepo({
      files: { 'a/package.json': '{\n  "dependencies": {\n    "other": "1.0.0"\n  }\n}\n' },
    })

    await expect(
      applyBumps({ bumps: [bump({ to: '1.2.5', manifests: ['a/package.json'] })], cwd }),
    ).rejects.toThrow(/a\/package\.json.*dep/)
  })
})
