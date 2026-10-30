import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { buildResearchPrompt, parseResearchResult } from './codex-contract.mjs'

const GHSA_A = 'GHSA-cccc-ffff-gggg'
const GHSA_B = 'GHSA-2222-3333-4444'

const bump = {
  id: 'sentry-nextjs-10',
  advisories: [GHSA_A, GHSA_B],
  dependency: '@sentry/nextjs',
  fallbackFor: null,
  from: '^9.5.0',
  fromVersion: '9.5.0',
  isMajor: true,
  manifests: ['packages/plugin-sentry/package.json'],
  to: '10.54.0',
}

const evidencePaths = {
  notesPath: '/tmp/audit-deps/evidence/notes.md',
  pinHistoryPath: '/tmp/audit-deps/evidence/pin-history.md',
}

const skill = '---\nname: audit-dependencies\ndescription: x\n---\n\n# Skill body\n'

const realTemplate = readFileSync(new URL('./prompt.md', import.meta.url), 'utf8')

const validResult = (overrides = {}) =>
  JSON.stringify({
    breakingChanges: [{ change: 'removed export', ourUsage: 'not used' }],
    decision: 'apply',
    filesChecked: ['packages/plugin-sentry/src/index.ts'],
    reason: '',
    ...overrides,
  })

describe('buildResearchPrompt', () => {
  it('fills every token and appends the skill without frontmatter', () => {
    const template =
      '{{ref}}|{{dependency}}|{{from}}|{{to}}|{{kind}}|{{notesPath}}|{{pinHistoryPath}}|{{evidenceMode}}\n{{advisories}}'
    const prompt = buildResearchPrompt({
      bump,
      evidencePaths,
      hasNotes: true,
      ref: 'main',
      skill,
      template,
    })

    expect(prompt).toContain(
      'main|@sentry/nextjs|9.5.0|10.54.0|major|/tmp/audit-deps/evidence/notes.md|/tmp/audit-deps/evidence/pin-history.md|release notes',
    )
    expect(prompt).toContain(`- ${GHSA_A}\n- ${GHSA_B}`)
    expect(prompt).toContain('\n\n---\n\n# Skill body')
    expect(prompt).not.toContain('name: audit-dependencies')
  })

  it('uses package diff mode and non-major kind', () => {
    const prompt = buildResearchPrompt({
      bump: { ...bump, isMajor: false },
      evidencePaths,
      hasNotes: false,
      ref: 'main',
      skill,
      template: '{{kind}} {{evidenceMode}}',
    })

    expect(prompt).toContain('non-major package diff')
  })

  it('falls back to the declared spec when fromVersion is empty', () => {
    const prompt = buildResearchPrompt({
      bump: { ...bump, fromVersion: '' },
      evidencePaths,
      hasNotes: true,
      ref: 'main',
      skill,
      template: '{{from}}',
    })

    expect(prompt).toContain('^9.5.0')
  })

  it('throws on an unfilled token', () => {
    expect(() =>
      buildResearchPrompt({
        bump,
        evidencePaths,
        hasNotes: true,
        ref: 'main',
        skill,
        template: '{{ref}} {{unknown}}',
      }),
    ).toThrow(/unfilled/)
  })

  it('does not rescan substituted values or the skill for tokens', () => {
    const prompt = buildResearchPrompt({
      bump: { ...bump, dependency: '{{ref}}' },
      evidencePaths,
      hasNotes: true,
      ref: 'main',
      skill: `${skill}\nuse \${{ github.sha }}\n`,
      template: '{{dependency}}',
    })

    expect(prompt.startsWith('{{ref}}\n')).toBe(true)
    expect(prompt).toContain('${{ github.sha }}')
  })

  it('fills the real template with no unfilled token and states the hard rules', () => {
    const prompt = buildResearchPrompt({
      bump,
      evidencePaths,
      hasNotes: false,
      ref: 'main',
      skill,
      template: realTemplate,
    })

    expect(prompt).not.toMatch(/\{\{\w+\}\}/)
    expect(prompt).toContain('Never edit files')
    expect(prompt).toContain(
      `npm diff --diff='@sentry/nextjs@9.5.0' --diff='@sentry/nextjs@10.54.0'`,
    )
    expect(prompt).toContain('--cache=/tmp/audit-deps/npm-cache')
    expect(prompt).toContain('JSON matching the schema and nothing else')
  })
})

describe('parseResearchResult', () => {
  it('accepts apply with an empty reason', () => {
    expect(parseResearchResult({ text: validResult() })).toEqual({
      breakingChanges: [{ change: 'removed export', ourUsage: 'not used' }],
      decision: 'apply',
      filesChecked: ['packages/plugin-sentry/src/index.ts'],
      reason: '',
    })
  })

  it('accepts decline with a reason', () => {
    const result = parseResearchResult({
      text: validResult({ decision: 'decline', reason: 'We call the removed API.' }),
    })

    expect(result.decision).toBe('decline')
    expect(result.reason).toBe('We call the removed API.')
  })

  it('rejects invalid JSON', () => {
    expect(() => parseResearchResult({ text: 'nope' })).toThrow(/not valid JSON/)
  })

  it('rejects a non-object result', () => {
    expect(() => parseResearchResult({ text: '[]' })).toThrow(/missing/)
  })

  it.each(['breakingChanges', 'decision', 'filesChecked', 'reason'])(
    'rejects a missing %s',
    (field) => {
      const result = JSON.parse(validResult())
      delete result[field]

      expect(() => parseResearchResult({ text: JSON.stringify(result) })).toThrow(/missing/)
    },
  )

  it('rejects an unknown decision without echoing it', () => {
    const decision = 'maybe::warning::forged'

    expect(() => parseResearchResult({ text: validResult({ decision }) })).toThrow(/decision/)
    expect(() => parseResearchResult({ text: validResult({ decision }) })).not.toThrow(/forged/)
  })

  it('rejects more than 100 filesChecked entries', () => {
    const filesChecked = Array.from({ length: 101 }, (_, index) => `src/${index}.ts`)

    expect(() => parseResearchResult({ text: validResult({ filesChecked }) })).toThrow(/100/)
  })

  it('accepts exactly 100 filesChecked entries', () => {
    const filesChecked = Array.from({ length: 100 }, (_, index) => `src/${index}.ts`)

    expect(() => parseResearchResult({ text: validResult({ filesChecked }) })).not.toThrow()
  })

  it('rejects decline with an empty or blank reason', () => {
    for (const reason of ['', '   ']) {
      expect(() =>
        parseResearchResult({ text: validResult({ decision: 'decline', reason }) }),
      ).toThrow(/reason/)
    }
  })

  it('rejects a malformed breaking change', () => {
    const text = validResult({ breakingChanges: [{ change: 'x' }] })

    expect(() => parseResearchResult({ text })).toThrow(/breakingChanges/)
  })

  it('rejects non-string filesChecked entries', () => {
    expect(() => parseResearchResult({ text: validResult({ filesChecked: [1] }) })).toThrow(
      /filesChecked/,
    )
  })

  it('rejects a string over 4,000 characters in any field', () => {
    const long = 'a'.repeat(4001)
    const cases = [
      validResult({ reason: long }),
      validResult({ breakingChanges: [{ change: long, ourUsage: 'x' }] }),
      validResult({ breakingChanges: [{ change: 'x', ourUsage: long }] }),
      validResult({ filesChecked: [long] }),
    ]

    for (const text of cases) {
      expect(() => parseResearchResult({ text })).toThrow(/4000/)
    }
  })

  it('accepts a string of exactly 4,000 characters', () => {
    expect(() =>
      parseResearchResult({ text: validResult({ reason: 'a'.repeat(4000) }) }),
    ).not.toThrow()
  })

  it('rejects more than 30 breaking changes', () => {
    const breakingChanges = Array.from({ length: 31 }, () => ({ change: 'c', ourUsage: 'u' }))

    expect(() => parseResearchResult({ text: validResult({ breakingChanges }) })).toThrow(/30/)
  })

  it('accepts exactly 30 breaking changes', () => {
    const breakingChanges = Array.from({ length: 30 }, () => ({ change: 'c', ourUsage: 'u' }))

    expect(() => parseResearchResult({ text: validResult({ breakingChanges }) })).not.toThrow()
  })

  it('drops unknown keys from the parsed result', () => {
    const result = parseResearchResult({ text: validResult({ extra: 'x' }) })

    expect(Object.keys(result).sort()).toEqual([
      'breakingChanges',
      'decision',
      'filesChecked',
      'reason',
    ])
  })
})

describe('assets', () => {
  it('schema file is strict at both levels', () => {
    const schema = JSON.parse(readFileSync(new URL('./codex-output.schema.json', import.meta.url)))
    const item = schema.properties.breakingChanges.items

    for (const node of [schema, item]) {
      expect(node.additionalProperties).toBe(false)
      expect([...node.required].sort()).toEqual(Object.keys(node.properties).sort())
    }
    expect(schema.properties.decision.enum).toEqual(['apply', 'decline'])
  })

  it('config is a read-only profile with one writable path and an allowlisted proxy', () => {
    const toml = readFileSync(new URL('./codex-config.toml', import.meta.url), 'utf8')

    expect(toml).toContain('default_permissions = "audit-deps"')
    expect(toml).toContain('extends = ":read-only"')
    expect(toml).toContain('network_proxy = true')
    expect(toml).toContain('[permissions.audit-deps.filesystem]')
    expect(toml.match(/= "write"/g)).toHaveLength(1)
    expect(toml).toContain('"/tmp/audit-deps" = "write"')
    expect(toml).toContain('PNPM_HOME = "/tmp/audit-deps/pnpm-home"')
    expect(toml).toContain('npm_config_cache = "/tmp/audit-deps/npm-cache"')
    for (const host of [
      'registry.npmjs.org',
      'github.com',
      'api.github.com',
      'raw.githubusercontent.com',
    ]) {
      expect(toml).toContain(`"${host}" = "allow"`)
    }
    expect(toml.match(/" = "allow"/g)).toHaveLength(4)
  })
})
