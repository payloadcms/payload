import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'
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

describe('migrate-version-action-api', () => {
  it('rewrites Local API/SDK read draft booleans to version', async () => {
    const output = await fixture('read.output.ts')

    expect(await apply('read.input.ts')).toBe(output)
  })

  it('preserves comments around rewritten read options', async () => {
    const output = await apply('read.input.ts')

    expect(output).toContain('// fetch the newest draft when one exists')
    expect(output).toContain("version: 'latest'")
  })

  it('rewrites safe write draft booleans to action', async () => {
    const output = await fixture('write.output.ts')

    expect(await apply('write.input.ts')).toBe(output)
  })

  it('rewrites restore draft booleans to action', async () => {
    const output = await fixture('restore.output.ts')

    expect(await apply('restore.input.ts')).toBe(output)
  })

  it('removes typescript.strictDraftTypes', async () => {
    const output = await fixture('strict-draft-types.output.ts')

    expect(await apply('strict-draft-types.input.ts')).toBe(output)
  })

  it('removes strictDraftTypes: false and notes that types are always strict', async () => {
    const output = await fixture('strict-draft-types-false.output.ts')
    const input = await fixture('strict-draft-types-false.input.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('config.ts', input)

    const result = await migrateVersionActionApi.apply({ packageJsons: [], project })

    expect(project.getSourceFileOrThrow('config.ts').getFullText()).toBe(output)
    expect(result.notes).toEqual([expect.stringContaining('removed `strictDraftTypes: false`')])
  })

  it('rewrites contextual REST draft query params', async () => {
    const output = await fixture('rest.output.ts')

    expect(await apply('rest.input.ts')).toBe(output)
  })

  it('rewrites contextual GraphQL draft arguments', async () => {
    const output = await fixture('graphql.output.ts')

    expect(await apply('graphql.input.ts')).toBe(output)
  })

  it('drops obsolete draft when static _status already infers the action', async () => {
    const output = await fixture('status.output.ts')

    expect(await apply('status.input.ts')).toBe(output)
  })

  it('rewrites aliased payload, sdk, and identifier call sites', async () => {
    const output = await fixture('alias.output.ts')

    expect(await apply('alias.input.ts')).toBe(output)
  })

  it('leaves unrelated client calls, REST URLs, and GraphQL documents unchanged', async () => {
    const input = await fixture('external.input.ts')
    const output = await fixture('external.output.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('/external.ts', input)

    const result = await migrateVersionActionApi.apply({ packageJsons: [], project })

    expect(project.getSourceFileOrThrow('/external.ts').getFullText()).toBe(output)
    expect(result.notes).toEqual([
      expect.stringContaining('wrapper or unclassified call'),
      expect.stringContaining('REST `draft` query without enough operation context'),
      expect.stringContaining('GraphQL `draft` argument without enough operation context'),
    ])
  })

  it('is a no-op on already-migrated input', async () => {
    const input = await fixture('already-migrated.input.ts')

    expect(await apply('already-migrated.input.ts')).toBe(input)
  })

  it('is idempotent when run on rewritten output', async () => {
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
    ]) {
      const output = await fixture(name)

      expect(await runTransform({ source: output, transform: migrateVersionActionApi })).toBe(
        output,
      )
    }
  })

  it('does not rewrite update draft: false without static status and emits a note', async () => {
    const input = await fixture('update-draft-false.input.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('update.ts', input)

    const result = await migrateVersionActionApi.apply({ packageJsons: [], project })

    expect(project.getSourceFileOrThrow('update.ts').getFullText()).toBe(input)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([expect.stringContaining('update `draft: false`')])
  })

  it('does not rewrite dynamic draft values and emits a note', async () => {
    const input = await fixture('dynamic.input.ts')

    expect(await apply('dynamic.input.ts')).toBe(input)

    const result = await applyProject({ '/dynamic.ts': input })
    expect(result.notes).toEqual([expect.stringContaining('dynamic `draft`')])
  })

  it('does not rewrite detached options objects and emits a note', async () => {
    const input = await fixture('detached.input.ts')

    expect(await apply('detached.input.ts')).toBe(input)

    const result = await applyProject({ '/detached.ts': input })
    expect(result.notes).toEqual([expect.stringContaining('detached options object')])
  })

  it('does not rewrite wrapper-built options and emits a note', async () => {
    const input = await fixture('wrapper.input.ts')

    expect(await apply('wrapper.input.ts')).toBe(input)

    const result = await applyProject({ '/wrapper.ts': input })
    expect(result.notes).toEqual([expect.stringContaining('detached options object')])
  })

  it('does not rewrite conflicting draft/_status combinations and emits a note', async () => {
    const input = await fixture('status-conflict.input.ts')

    expect(await apply('status-conflict.input.ts')).toBe(input)

    const result = await applyProject({ '/status-conflict.ts': input })
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([
      expect.stringContaining('conflicting `draft` and `_status`'),
      expect.stringContaining('conflicting `draft` and `_status`'),
    ])
  })

  it('does not rewrite GraphQL/REST strings without operation context', async () => {
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

  it('does not rewrite conflicting draft/version/action values and emits a note', async () => {
    const input = await fixture('conflict.input.ts')

    expect(await apply('conflict.input.ts')).toBe(input)

    const result = await applyProject({ '/conflict.ts': input })
    expect(result.notes).toEqual([
      expect.stringContaining('conflicting `draft`'),
      expect.stringContaining('conflicting `draft`'),
    ])
  })

  it('does not rewrite ambiguous REST strings and emits a note', async () => {
    const input = await fixture('ambiguous-url.input.ts')

    expect(await apply('ambiguous-url.input.ts')).toBe(input)

    const result = await applyProject({ '/url.ts': input })
    expect(result.notes).toEqual([
      expect.stringContaining('REST `draft` query without enough operation context'),
    ])
  })

  it('does not rewrite localized or computed _status combinations and emits a note', async () => {
    const input = await fixture('localized-status.input.ts')

    expect(await apply('localized-status.input.ts')).toBe(input)

    const result = await applyProject({ '/status.ts': input })
    expect(result.notes).toEqual([
      expect.stringContaining('localized or computed `_status`'),
      expect.stringContaining('localized or computed `_status`'),
    ])
  })

  it('does not rewrite legitimate drafts config, document fields, or UI copy', async () => {
    const input = await fixture('non-matching.input.ts')

    expect(await apply('non-matching.input.ts')).toBe(input)
  })

  it('reports exact filesChanged for rewritten files only', async () => {
    const read = await fixture('read.input.ts')
    const untouched = await fixture('already-migrated.input.ts')
    const result = await applyProject({
      '/migrated.ts': untouched,
      '/posts.ts': read,
    })

    expect(result.filesChanged).toEqual(['/posts.ts'])
  })

  it('does not touch the filesystem', async () => {
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('/memory.ts', await fixture('read.input.ts'))

    const result = await migrateVersionActionApi.apply({ packageJsons: [], project })

    expect(result.filesChanged).toEqual(['/memory.ts'])
    expect(project.getSourceFileOrThrow('/memory.ts').getFullText()).toContain("version: 'latest'")
  })
})
