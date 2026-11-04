import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { listPublishedPackages, resolveAffects } from './workspace-graph.mjs'

const graph = new Map([
  ['graphql', { name: '@payloadcms/graphql', isPrivate: false, dependencies: [] }],
  ['next', { name: '@payloadcms/next', isPrivate: false, dependencies: ['@payloadcms/graphql'] }],
  [
    'tanstack-start',
    { name: '@payloadcms/tanstack-start', isPrivate: false, dependencies: ['@payloadcms/next'] },
  ],
  ['test-app', { name: 'test-app', isPrivate: true, dependencies: ['@payloadcms/tanstack-start'] }],
  ['ui', { name: '@payloadcms/ui', isPrivate: false, dependencies: [] }],
])

describe('resolveAffects', () => {
  it('should list published direct packages and published transitive dependents', () => {
    expect(resolveAffects({ graph, originDirs: ['graphql', 'test-app', 'nope'] })).toEqual({
      direct: [{ name: '@payloadcms/graphql', dir: 'graphql' }],
      via: [
        { name: '@payloadcms/next', dir: 'next' },
        { name: '@payloadcms/tanstack-start', dir: 'tanstack-start' },
      ],
    })
  })
})

describe('listPublishedPackages', () => {
  let cwd

  afterEach(async () => {
    await rm(cwd, { force: true, recursive: true })
  })

  it('should read names, privacy, and dependencies only', async () => {
    cwd = await mkdtemp(path.join(tmpdir(), 'audit-graph-'))
    await mkdir(path.join(cwd, 'packages', 'a'), { recursive: true })
    await mkdir(path.join(cwd, 'packages', 'b'), { recursive: true })
    await mkdir(path.join(cwd, 'packages', 'empty'), { recursive: true })
    await writeFile(
      path.join(cwd, 'packages', 'a', 'package.json'),
      JSON.stringify({
        name: '@x/a',
        dependencies: { '@x/b': 'workspace:*' },
        devDependencies: { dev: '1.0.0' },
        peerDependencies: { peer: '1.0.0' },
      }),
    )
    await writeFile(
      path.join(cwd, 'packages', 'b', 'package.json'),
      JSON.stringify({ name: '@x/b', private: true }),
    )

    const result = await listPublishedPackages({ cwd })

    expect(result.get('a')).toEqual({ name: '@x/a', isPrivate: false, dependencies: ['@x/b'] })
    expect(result.get('b')).toEqual({ name: '@x/b', isPrivate: true, dependencies: [] })
    expect(result.has('empty')).toBe(false)
  })
})
