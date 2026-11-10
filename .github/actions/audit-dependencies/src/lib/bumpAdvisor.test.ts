import { describe, expect, it } from 'vitest'

import type { Finding } from '../types'
import type { DeclaredIndex } from './packages'
import type { Packument, RegistryClient } from './registry'

import { annotateFindings } from './bumpAdvisor'

const packument = (versions: Record<string, Record<string, string>>): Packument => ({
  distTags: {},
  versions: Object.fromEntries(
    Object.entries(versions).map(([version, dependencies]) => [version, { dependencies }]),
  ),
})

const fakeClient = (packuments: Record<string, null | Packument>): RegistryClient => ({
  fetchPackument: (name) => Promise.resolve(name in packuments ? packuments[name] : null),
})

const finding = (overrides: Partial<Finding> = {}): Finding => ({
  advisory: 'GHSA-aaaa-bbbb-cccc',
  chainPackages: ['@typescript-eslint/parser', 'minimatch', 'brace-expansion'],
  directDeps: [{ dependency: '@typescript-eslint/parser', workspacePackage: 'eslint-config' }],
  fixed_in: '>=2.1.2',
  originPackages: [],
  package: 'brace-expansion',
  paths: ['eslint-config > @typescript-eslint/parser > minimatch'],
  severity: 'high',
  title: 'title',
  url: 'https://example.test',
  vulnerable: '<2.1.2',
  ...overrides,
})

const index: DeclaredIndex = new Map([
  ['eslint-config', new Map([['@typescript-eslint/parser', '^8.20.0']])],
])

describe('annotateFindings', () => {
  it('reports relock when the current range already permits a patched resolution', async () => {
    const client = fakeClient({
      '@typescript-eslint/parser': packument({
        '8.20.0': { minimatch: '3.0.0' },
        '8.42.0': { minimatch: '9.0.5' },
      }),
      'brace-expansion': packument({ '1.0.0': {}, '2.1.2': {} }),
      minimatch: packument({
        '3.0.0': { 'brace-expansion': '1.0.0' },
        '9.0.5': { 'brace-expansion': '2.1.2' },
      }),
    })

    const [reported] = await annotateFindings({ client, findings: [finding()], index })
    const [bump] = reported.bumps

    // 8.42.0 clears and satisfies ^8.20.0, so no manifest bump is needed.
    expect(bump.fix).toEqual({ status: 'relock', version: '8.42.0' })
    expect(bump.currentSpec).toBe('^8.20.0')
  })

  it('suggests the minimal bump when the fix falls outside the current range', async () => {
    const pinnedIndex: DeclaredIndex = new Map([
      ['eslint-config', new Map([['@typescript-eslint/parser', '~8.20.0']])],
    ])
    const client = fakeClient({
      '@typescript-eslint/parser': packument({
        '8.20.0': { minimatch: '3.0.0' },
        '8.42.0': { minimatch: '9.0.5' },
      }),
      'brace-expansion': packument({ '1.0.0': {}, '2.1.2': {} }),
      minimatch: packument({
        '3.0.0': { 'brace-expansion': '1.0.0' },
        '9.0.5': { 'brace-expansion': '2.1.2' },
      }),
    })

    const [reported] = await annotateFindings({ client, findings: [finding()], index: pinnedIndex })

    expect(reported.bumps[0].fix).toEqual({
      crossesMajor: false,
      fromMajor: 8,
      status: 'fix',
      toMajor: 8,
      version: '8.42.0',
    })
  })

  it('flags a fix that crosses the current major', async () => {
    const client = fakeClient({
      '@typescript-eslint/parser': packument({
        '8.20.0': { minimatch: '3.0.0' },
        '8.42.0': { minimatch: '3.0.0' },
        '9.1.0': { minimatch: '9.0.5' },
      }),
      'brace-expansion': packument({ '1.0.0': {}, '2.1.2': {} }),
      minimatch: packument({
        '3.0.0': { 'brace-expansion': '1.0.0' },
        '9.0.5': { 'brace-expansion': '2.1.2' },
      }),
    })

    const [reported] = await annotateFindings({ client, findings: [finding()], index })

    expect(reported.bumps[0].fix).toMatchObject({
      crossesMajor: true,
      fromMajor: 8,
      status: 'fix',
      toMajor: 9,
      version: '9.1.0',
    })
  })

  it('reports none when no version clears the vuln', async () => {
    const client = fakeClient({
      '@typescript-eslint/parser': packument({ '8.20.0': { minimatch: '3.0.0' } }),
      'brace-expansion': packument({ '1.0.0': {} }),
      minimatch: packument({ '3.0.0': { 'brace-expansion': '1.0.0' } }),
    })

    const [reported] = await annotateFindings({ client, findings: [finding()], index })

    expect(reported.bumps[0].fix).toEqual({ status: 'none' })
  })

  it('reports unknown when the direct dep packument is unreachable', async () => {
    const client = fakeClient({ '@typescript-eslint/parser': null })

    const [reported] = await annotateFindings({ client, findings: [finding()], index })

    expect(reported.bumps[0].fix).toEqual({ reason: 'registry', status: 'unknown' })
  })

  it('splits owners declaring the same dependency at different specs into separate bumps', async () => {
    const mixedIndex: DeclaredIndex = new Map([
      ['eslint-config', new Map([['@typescript-eslint/parser', '^8.20.0']])],
      ['eslint-plugin', new Map([['@typescript-eslint/parser', '~8.20.0']])],
    ])
    const client = fakeClient({
      '@typescript-eslint/parser': packument({
        '8.20.0': { minimatch: '3.0.0' },
        '8.42.0': { minimatch: '9.0.5' },
      }),
      'brace-expansion': packument({ '1.0.0': {}, '2.1.2': {} }),
      minimatch: packument({
        '3.0.0': { 'brace-expansion': '1.0.0' },
        '9.0.5': { 'brace-expansion': '2.1.2' },
      }),
    })
    const mixedFinding = finding({
      directDeps: [
        { dependency: '@typescript-eslint/parser', workspacePackage: 'eslint-config' },
        { dependency: '@typescript-eslint/parser', workspacePackage: 'eslint-plugin' },
      ],
    })

    const [reported] = await annotateFindings({
      client,
      findings: [mixedFinding],
      index: mixedIndex,
    })

    // ^8.20.0 admits 8.42.0 -> relock; ~8.20.0 forbids it -> minimal fix bump.
    expect(reported.bumps).toEqual([
      {
        currentSpec: '^8.20.0',
        dependency: '@typescript-eslint/parser',
        fix: { status: 'relock', version: '8.42.0' },
        workspacePackages: ['eslint-config'],
      },
      {
        currentSpec: '~8.20.0',
        dependency: '@typescript-eslint/parser',
        fix: { crossesMajor: false, fromMajor: 8, status: 'fix', toMajor: 8, version: '8.42.0' },
        workspacePackages: ['eslint-plugin'],
      },
    ])
  })

  it('refuses to suggest a bump when the current version is unknown', async () => {
    const emptyIndex: DeclaredIndex = new Map()
    const client = fakeClient({
      '@typescript-eslint/parser': packument({ '8.20.0': { minimatch: '9.0.5' } }),
      'brace-expansion': packument({ '2.1.2': {} }),
      minimatch: packument({ '9.0.5': { 'brace-expansion': '2.1.2' } }),
    })

    const [reported] = await annotateFindings({ client, findings: [finding()], index: emptyIndex })

    expect(reported.bumps[0].fix).toEqual({ reason: 'no-current-version', status: 'unknown' })
  })

  it('reports an unsupported spec when the declared spec is not a semver range', async () => {
    const aliasIndex: DeclaredIndex = new Map([
      ['eslint-config', new Map([['@typescript-eslint/parser', 'npm:other-parser@^8.20.0']])],
    ])
    const client = fakeClient({
      '@typescript-eslint/parser': packument({ '8.20.0': { minimatch: '9.0.5' } }),
    })

    const [reported] = await annotateFindings({ client, findings: [finding()], index: aliasIndex })

    expect(reported.bumps[0].fix).toEqual({ reason: 'unsupported-spec', status: 'unknown' })
  })

  it('reports an unknown patched range instead of guessing a bump', async () => {
    const client = fakeClient({
      '@typescript-eslint/parser': packument({ '8.20.0': { minimatch: '9.0.5' } }),
    })

    const [reported] = await annotateFindings({
      client,
      findings: [finding({ fixed_in: 'unknown' })],
      index,
    })

    expect(reported.bumps[0].fix).toEqual({ reason: 'no-patched-range', status: 'unknown' })
  })

  it('traces nested copies of the module below a patched root', async () => {
    const directIndex: DeclaredIndex = new Map([['plugin-mcp', new Map([['zod', '^3.25.50']])]])
    const client = fakeClient({
      helper: packument({ '1.0.0': { zod: '3.25.50' }, '2.0.0': { zod: '4.7.0' } }),
      zod: packument({
        '3.25.50': {},
        '4.6.6': { helper: '1.0.0' },
        '4.7.0': { helper: '2.0.0' },
      }),
    })
    const directFinding = finding({
      chainPackages: ['helper', 'zod'],
      directDeps: [{ dependency: 'zod', workspacePackage: 'plugin-mcp' }],
      fixed_in: '>=4.6.6',
      package: 'zod',
      paths: ['plugin-mcp > zod'],
      vulnerable: '<4.6.6',
    })

    const [reported] = await annotateFindings({
      client,
      findings: [directFinding],
      index: directIndex,
    })

    // 4.6.6 is patched itself but pulls vulnerable zod@3.25.50 back in through helper@1.
    expect(reported.bumps[0].fix).toMatchObject({ status: 'fix', version: '4.7.0' })
  })

  it('checks the version itself when the direct dependency is the vulnerable module', async () => {
    const directIndex: DeclaredIndex = new Map([['plugin-mcp', new Map([['zod', '^3.25.50']])]])
    const client = fakeClient({
      zod: packument({ '3.25.50': {}, '3.25.76': {}, '4.6.6': {} }),
    })
    const directFinding = finding({
      chainPackages: ['zod'],
      directDeps: [{ dependency: 'zod', workspacePackage: 'plugin-mcp' }],
      fixed_in: '>=4.6.6',
      package: 'zod',
      paths: ['plugin-mcp > zod'],
      vulnerable: '<4.6.6',
    })

    const [reported] = await annotateFindings({
      client,
      findings: [directFinding],
      index: directIndex,
    })

    expect(reported.bumps[0].fix).toEqual({
      crossesMajor: true,
      fromMajor: 3,
      status: 'fix',
      toMajor: 4,
      version: '4.6.6',
    })
  })
})
