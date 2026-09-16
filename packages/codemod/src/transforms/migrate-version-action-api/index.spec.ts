import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project, SyntaxKind, ts } from 'ts-morph'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { migrateVersionActionApi } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

async function apply(name: string): Promise<string> {
  const input = await fixture(name)
  return runTransform({ source: input, transform: migrateVersionActionApi })
}

async function applyProject(files: Record<string, string>) {
  const project = new Project({ useInMemoryFileSystem: true })
  for (const [path, contents] of Object.entries(files)) {
    project.createSourceFile(path, contents)
  }
  return migrateVersionActionApi.apply({ packageJsons: [], project })
}

function getSyntacticDiagnosticMessages(source: string): string[] {
  const result = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ESNext },
    fileName: 'fixture.ts',
    reportDiagnostics: true,
  })

  return (result.diagnostics ?? []).map((diagnostic) =>
    ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
  )
}

function getEscapedTitleGraphqlValue(source: string): string {
  const project = new Project({ useInMemoryFileSystem: true })
  const sourceFile = project.createSourceFile('/fixture.ts', source)
  const query = sourceFile
    .getDescendantsOfKind(SyntaxKind.StringLiteral)
    .find((literal) => literal.getLiteralValue().includes('mutation EscapedTitle'))

  return query?.getLiteralValue() ?? ''
}

describe('migrate-version-action-api', () => {
  it('should rewrite Local API/SDK read draft booleans to version', async () => {
    const output = await fixture('read.output.ts')

    expect(await apply('read.input.ts')).toBe(output)
  })

  it('should preserve comments around rewritten read options', async () => {
    const output = await apply('read.input.ts')

    expect(output).toContain('// fetch the newest draft when one exists')
    expect(output).toContain("version: 'latest'")
  })

  it('should rewrite safe write draft booleans to action', async () => {
    const output = await fixture('write.output.ts')

    expect(await apply('write.input.ts')).toBe(output)
  })

  it('should rewrite restore draft booleans to action', async () => {
    const output = await fixture('restore.output.ts')

    expect(await apply('restore.input.ts')).toBe(output)
  })

  it('should remove typescript.strictDraftTypes', async () => {
    const output = await fixture('strict-draft-types.output.ts')

    expect(await apply('strict-draft-types.input.ts')).toBe(output)
  })

  it('should remove strictDraftTypes: false and notes that types are always strict', async () => {
    const output = await fixture('strict-draft-types-false.output.ts')
    const input = await fixture('strict-draft-types-false.input.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('config.ts', input)

    const result = await migrateVersionActionApi.apply({ packageJsons: [], project })

    expect(project.getSourceFileOrThrow('config.ts').getFullText()).toBe(output)
    expect(result.notes).toEqual([expect.stringContaining('removed `strictDraftTypes: false`')])
  })

  it('should rewrite contextual REST draft query params', async () => {
    const output = await fixture('rest.output.ts')

    expect(await apply('rest.input.ts')).toBe(output)
  })

  it('should rewrite contextual GraphQL draft arguments', async () => {
    const output = await fixture('graphql.output.ts')

    expect(await apply('graphql.input.ts')).toBe(output)
  })

  it('should rewrite static Local API and SDK all-locale publication flags', async () => {
    const output = await fixture('all-locales.output.ts')

    expect(await apply('all-locales.input.ts')).toBe(output)
  })

  it('should not replace an explicit locale when non-empty data could be redirected', async () => {
    const input = await fixture('all-locales-localized-data.input.ts')
    const output = await fixture('all-locales-localized-data.output.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('/all-locales-localized-data.ts', input)

    const result = await migrateVersionActionApi.apply({ packageJsons: [], project })

    expect(project.getSourceFileOrThrow('/all-locales-localized-data.ts').getFullText()).toBe(
      output,
    )
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([
      expect.stringContaining("non-empty `data` with explicit `locale: 'es'`"),
    ])
  })

  it('should rewrite static REST all-locale publication flags', async () => {
    const output = await fixture('all-locales-rest.output.ts')

    expect(await apply('all-locales-rest.input.ts')).toBe(output)
  })

  it('should preserve REST localized writes with non-empty or unresolved request bodies', async () => {
    const input = await fixture('all-locales-rest-localized-data.input.ts')
    const output = await fixture('all-locales-rest-localized-data.output.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('/all-locales-rest-localized-data.ts', input)

    const result = await migrateVersionActionApi.apply({ packageJsons: [], project })
    const transformed = project
      .getSourceFileOrThrow('/all-locales-rest-localized-data.ts')
      .getFullText()

    expect(transformed).toBe(output)
    expect(getSyntacticDiagnosticMessages(transformed)).toEqual([])
    expect(result.filesChanged).toEqual(['/all-locales-rest-localized-data.ts'])
    expect(result.notes).toEqual([
      expect.stringContaining('non-empty or unresolved request body'),
      expect.stringContaining('non-empty or unresolved request body'),
    ])
  })

  it('should rewrite static GraphQL all-locale publication flags', async () => {
    const output = await fixture('all-locales-graphql.output.ts')

    expect(await apply('all-locales-graphql.input.ts')).toBe(output)
  })

  it('should preserve GraphQL localized writes with non-empty or unresolved data', async () => {
    const input = await fixture('all-locales-graphql-localized-data.input.ts')
    const output = await fixture('all-locales-graphql-localized-data.output.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('/all-locales-graphql-localized-data.ts', input)

    const result = await migrateVersionActionApi.apply({ packageJsons: [], project })
    const transformed = project
      .getSourceFileOrThrow('/all-locales-graphql-localized-data.ts')
      .getFullText()

    expect(transformed).toBe(output)
    expect(getSyntacticDiagnosticMessages(transformed)).toEqual([])
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([expect.stringContaining('non-empty or unresolved `data`')])
  })

  it('should only rewrite top-level GraphQL operation arguments', async () => {
    const output = await fixture('all-locales-graphql-nested.output.ts')

    expect(await apply('all-locales-graphql-nested.input.ts')).toBe(output)
  })

  it('should remove comma-free static false GraphQL operation arguments', async () => {
    const output = await fixture('all-locales-graphql-comma-free.output.ts')

    expect(await apply('all-locales-graphql-comma-free.input.ts')).toBe(output)
  })

  it('should preserve a separator when removing an inline comma-free GraphQL argument', async () => {
    const output = await fixture('all-locales-graphql-inline-comma-free.output.ts')

    expect(await apply('all-locales-graphql-inline-comma-free.input.ts')).toBe(output)
  })

  it('should rewrite GraphQL operations stored in double-quoted JavaScript strings', async () => {
    const output = await fixture('all-locales-graphql-double-quoted.output.ts')

    expect(await apply('all-locales-graphql-double-quoted.input.ts')).toBe(output)
  })

  it('should preserve escaped nested quotes in double-quoted GraphQL strings', async () => {
    const input = await fixture('all-locales-graphql-escaped-string.input.ts')
    const output = await fixture('all-locales-graphql-escaped-string.output.ts')
    const transformed = await apply('all-locales-graphql-escaped-string.input.ts')

    expect(getSyntacticDiagnosticMessages(input)).toEqual([])
    expect(getSyntacticDiagnosticMessages(output)).toEqual([])
    expect(transformed).toBe(output)
    expect(getSyntacticDiagnosticMessages(transformed)).toEqual([])
    expect(getEscapedTitleGraphqlValue(transformed)).toContain('title: "hello \\"world\\""')
    expect(await runTransform({ source: transformed, transform: migrateVersionActionApi })).toBe(
      transformed,
    )
  })

  it('should complete compatible mixed REST draft and all-locale rewrites in one run', async () => {
    const output = await fixture('all-locales-mixed-rest.output.ts')

    expect(await apply('all-locales-mixed-rest.input.ts')).toBe(output)
  })

  it('should not rewrite object options with unresolved spreads or computed properties', async () => {
    const input = await fixture('all-locales-object-ambiguous.input.ts')
    const output = await fixture('all-locales-object-ambiguous.output.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('/all-locales-object-ambiguous.ts', input)

    const result = await migrateVersionActionApi.apply({ packageJsons: [], project })

    expect(project.getSourceFileOrThrow('/all-locales-object-ambiguous.ts').getFullText()).toBe(
      output,
    )
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([
      expect.stringContaining('spread or computed property'),
      expect.stringContaining('spread or computed property'),
    ])
  })

  it('should drop obsolete draft when static _status already infers the action', async () => {
    const output = await fixture('status.output.ts')

    expect(await apply('status.input.ts')).toBe(output)
  })

  it('should rewrite aliased payload, sdk, and identifier call sites', async () => {
    const output = await fixture('alias.output.ts')

    expect(await apply('alias.input.ts')).toBe(output)
  })

  it('should leave unrelated client calls, REST URLs, and GraphQL documents unchanged', async () => {
    const input = await fixture('external.input.ts')
    const output = await fixture('external.output.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('/external.ts', input)

    const result = await migrateVersionActionApi.apply({ packageJsons: [], project })

    expect(project.getSourceFileOrThrow('/external.ts').getFullText()).toBe(output)
    expect(result.notes).toEqual([
      expect.stringContaining('wrapper or unclassified call'),
      expect.stringContaining('REST `draft` query without enough operation context'),
      expect.stringContaining('REST `draft` query without enough operation context'),
      expect.stringContaining('GraphQL `draft` argument without enough operation context'),
      expect.stringContaining('GraphQL `draft` argument without enough operation context'),
    ])
  })

  it('should be a no-op on already-migrated input', async () => {
    const input = await fixture('already-migrated.input.ts')

    expect(await apply('already-migrated.input.ts')).toBe(input)
  })

  it('should be idempotent when run on rewritten output', async () => {
    for (const name of [
      'read.output.ts',
      'write.output.ts',
      'restore.output.ts',
      'strict-draft-types.output.ts',
      'rest.output.ts',
      'graphql.output.ts',
      'status.output.ts',
      'alias.output.ts',
      'strict-draft-types-false.output.ts',
      'all-locales.output.ts',
      'all-locales-localized-data.output.ts',
      'all-locales-rest.output.ts',
      'all-locales-rest-localized-data.output.ts',
      'all-locales-graphql.output.ts',
      'all-locales-graphql-localized-data.output.ts',
      'all-locales-graphql-nested.output.ts',
      'all-locales-graphql-comma-free.output.ts',
      'all-locales-graphql-inline-comma-free.output.ts',
      'all-locales-graphql-double-quoted.output.ts',
      'all-locales-graphql-escaped-string.output.ts',
      'all-locales-mixed-rest.output.ts',
      'all-locales-object-ambiguous.output.ts',
      'all-locales-unsafe.output.ts',
    ]) {
      const output = await fixture(name)

      expect(await runTransform({ source: output, transform: migrateVersionActionApi })).toBe(
        output,
      )
    }
  })

  it('should not rewrite update draft: false without static status and emits a note', async () => {
    const input = await fixture('update-draft-false.input.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('update.ts', input)

    const result = await migrateVersionActionApi.apply({ packageJsons: [], project })

    expect(project.getSourceFileOrThrow('update.ts').getFullText()).toBe(input)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([expect.stringContaining('update `draft: false`')])
  })

  it('should not rewrite dynamic draft values and emits a note', async () => {
    const input = await fixture('dynamic.input.ts')

    expect(await apply('dynamic.input.ts')).toBe(input)

    const result = await applyProject({ '/dynamic.ts': input })
    expect(result.notes).toEqual([expect.stringContaining('dynamic `draft`')])
  })

  it('should not rewrite detached options objects and emits a note', async () => {
    const input = await fixture('detached.input.ts')

    expect(await apply('detached.input.ts')).toBe(input)

    const result = await applyProject({ '/detached.ts': input })
    expect(result.notes).toEqual([expect.stringContaining('detached options object')])
  })

  it('should not rewrite wrapper-built options and emits a note', async () => {
    const input = await fixture('wrapper.input.ts')

    expect(await apply('wrapper.input.ts')).toBe(input)

    const result = await applyProject({ '/wrapper.ts': input })
    expect(result.notes).toEqual([expect.stringContaining('detached options object')])
  })

  it('should not rewrite conflicting draft/_status combinations and emits a note', async () => {
    const input = await fixture('status-conflict.input.ts')

    expect(await apply('status-conflict.input.ts')).toBe(input)

    const result = await applyProject({ '/status-conflict.ts': input })
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([
      expect.stringContaining('conflicting `draft` and `_status`'),
      expect.stringContaining('conflicting `draft` and `_status`'),
    ])
  })

  it('should not rewrite GraphQL/REST strings without operation context', async () => {
    const input = await fixture('graphql-ambiguous.input.ts')

    expect(await apply('graphql-ambiguous.input.ts')).toBe(input)

    const result = await applyProject({ '/gql.ts': input })
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([
      expect.stringContaining('REST `draft` query without enough operation context'),
      expect.stringContaining('GraphQL `draft` argument without enough operation context'),
      expect.stringContaining('GraphQL `draft` argument without enough operation context'),
    ])
  })

  it('should not rewrite conflicting draft/version/action values and emits a note', async () => {
    const input = await fixture('conflict.input.ts')

    expect(await apply('conflict.input.ts')).toBe(input)

    const result = await applyProject({ '/conflict.ts': input })
    expect(result.notes).toEqual([
      expect.stringContaining('conflicting `draft`'),
      expect.stringContaining('conflicting `draft`'),
    ])
  })

  it('should not rewrite ambiguous REST strings and emits a note', async () => {
    const input = await fixture('ambiguous-url.input.ts')

    expect(await apply('ambiguous-url.input.ts')).toBe(input)

    const result = await applyProject({ '/url.ts': input })
    expect(result.notes).toEqual([
      expect.stringContaining('REST `draft` query without enough operation context'),
    ])
  })

  it('should not guess dynamic, conflicting, detached, or ambiguous all-locale publication intent', async () => {
    const input = await fixture('all-locales-unsafe.input.ts')
    const output = await fixture('all-locales-unsafe.output.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('/all-locales-unsafe.ts', input)

    const result = await migrateVersionActionApi.apply({ packageJsons: [], project })

    expect(project.getSourceFileOrThrow('/all-locales-unsafe.ts').getFullText()).toBe(output)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([
      expect.stringContaining('dynamic `publishAllLocales`'),
      expect.stringContaining('dynamic `locale`'),
      expect.stringContaining('conflicting all-locale publication flags'),
      expect.stringContaining('conflicting `action` and `publishAllLocales`'),
      expect.stringContaining('requires an explicit `publish` action'),
      expect.stringContaining('REST all-locale publication query without enough operation context'),
      expect.stringContaining(
        'GraphQL all-locale publication argument without enough operation context',
      ),
      expect.stringContaining('detached options object with all-locale publication flags'),
    ])
  })

  it('should not rewrite localized or computed _status combinations and emits a note', async () => {
    const input = await fixture('localized-status.input.ts')

    expect(await apply('localized-status.input.ts')).toBe(input)

    const result = await applyProject({ '/status.ts': input })
    expect(result.notes).toEqual([
      expect.stringContaining('localized or computed `_status`'),
      expect.stringContaining('localized or computed `_status`'),
    ])
  })

  it('should not rewrite legitimate drafts config, document fields, or UI copy', async () => {
    const input = await fixture('non-matching.input.ts')

    expect(await apply('non-matching.input.ts')).toBe(input)
  })

  it('should report exact filesChanged for rewritten files only', async () => {
    const read = await fixture('read.input.ts')
    const allLocales = await fixture('all-locales.input.ts')
    const unsafeAllLocales = await fixture('all-locales-unsafe.input.ts')
    const untouched = await fixture('already-migrated.input.ts')
    const result = await applyProject({
      '/all-locales.ts': allLocales,
      '/all-locales-unsafe.ts': unsafeAllLocales,
      '/migrated.ts': untouched,
      '/posts.ts': read,
    })

    expect(result.filesChanged).toEqual(['/all-locales.ts', '/posts.ts'])
  })

  it('should not touch the filesystem', async () => {
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('/memory.ts', await fixture('read.input.ts'))

    const result = await migrateVersionActionApi.apply({ packageJsons: [], project })

    expect(result.filesChanged).toEqual(['/memory.ts'])
    expect(project.getSourceFileOrThrow('/memory.ts').getFullText()).toContain("version: 'latest'")
  })
})
