import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'
import { describe, expect, it } from 'vitest'

import { runTransform } from '../../utils/test-helpers.js'
import { addOverrideAccessTrue } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('add-override-access-true', () => {
  it('adds overrideAccess: true to recognized Payload Local API calls', async () => {
    const input = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: input, transform: addOverrideAccessTrue })

    expect(result).toBe(output)
  })

  it('is idempotent', async () => {
    const output = await fixture('basic.output.ts')

    const result = await runTransform({ source: output, transform: addOverrideAccessTrue })

    expect(result).toBe(output)
  })

  it('recognizes the distinctive payload.jobs API without a type annotation', async () => {
    const input = await fixture('jobs.input.ts')
    const output = await fixture('jobs.output.ts')

    const result = await runTransform({ source: input, transform: addOverrideAccessTrue })

    expect(result).toBe(output)
  })

  it('recognizes a Payload value from its resolved BasePayload type', async () => {
    const project = new Project({ useInMemoryFileSystem: true })
    project
      .getFileSystem()
      .writeFileSync(
        '/node_modules/payload/package.json',
        JSON.stringify({ name: 'payload', types: 'index.d.ts' }),
      )
    project.createSourceFile(
      '/node_modules/payload/index.d.ts',
      `export declare class BasePayload {
  find(options: { collection: string }): Promise<unknown>
}
`,
    )
    const sourceFile = project.createSourceFile(
      '/project/input.ts',
      `import type { BasePayload } from 'payload'

declare function loadPayload(): Promise<BasePayload>

const cms = await loadPayload()

await cms.find({ collection: 'posts' })
`,
    )

    await addOverrideAccessTrue.apply({ packageJsons: [], project })

    expect(sourceFile.getFullText()).toContain(
      "await cms.find({ overrideAccess: true, collection: 'posts' })",
    )
  })

  it('recognizes a known Payload value cast to another type', async () => {
    const source = `import type { Payload } from 'payload'

declare const payload: Payload

await (payload as any).create({ collection: 'posts', data: { title: 'Post' } })
`

    const result = await runTransform({ source, transform: addOverrideAccessTrue })

    expect(result).toContain(
      "await (payload as any).create({ overrideAccess: true, collection: 'posts'",
    )
  })

  it('does not rewrite a resolved union that can be an unrelated client', async () => {
    const project = new Project({ useInMemoryFileSystem: true })
    project
      .getFileSystem()
      .writeFileSync(
        '/node_modules/payload/package.json',
        JSON.stringify({ name: 'payload', types: 'index.d.ts' }),
      )
    project.createSourceFile(
      '/node_modules/payload/index.d.ts',
      `export declare class BasePayload {
  find(options: { collection: string }): Promise<unknown>
}
`,
    )
    const source = `interface OtherClient {
  find(options: { collection: string }): Promise<unknown>
}

declare function loadClient(): Promise<import('payload').BasePayload | OtherClient>

const client = await loadClient()

await client.find({ collection: 'posts' })
`
    const sourceFile = project.createSourceFile('/project/input.ts', source)

    const result = await addOverrideAccessTrue.apply({ packageJsons: [], project })

    expect(sourceFile.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
  })

  it('avoids duplicate property diagnostics when options require overrideAccess', async () => {
    const project = new Project({
      compilerOptions: { strict: true },
      useInMemoryFileSystem: true,
    })
    const sourceFile = project.createSourceFile(
      'input.ts',
      `import type { Payload as PayloadInstance } from 'payload'

declare const payload: PayloadInstance & {
  find(options: { collection: string; overrideAccess?: boolean }): void
}
declare const options: { collection: string; overrideAccess: boolean }

payload.find(options)
payload.find({ ...options, collection: 'posts' })
`,
    )

    await addOverrideAccessTrue.apply({ packageJsons: [], project })

    expect(sourceFile.getFullText()).toContain(
      'payload.find({ ...{ overrideAccess: true }, ...options })',
    )
    expect(sourceFile.getFullText()).toContain(
      "payload.find({ ...{ overrideAccess: true }, ...options, collection: 'posts' })",
    )
    expect(
      project.getPreEmitDiagnostics().filter((diagnostic) => diagnostic.getCode() === 2783),
    ).toEqual([])
  })

  it('preserves explicit values inside asserted options objects', async () => {
    const source = `import type { Payload as PayloadInstance } from 'payload'

type Options = { collection: string; overrideAccess?: boolean }

declare const payload: PayloadInstance & { find(options: Options): void }

payload.find({ collection: 'posts', overrideAccess: false } as Options)
payload.find(({ collection: 'posts', overrideAccess: true } satisfies Options))
`

    const result = await runTransform({ source, transform: addOverrideAccessTrue })

    expect(result).toBe(source)
  })

  it('replaces an explicit undefined options argument instead of spreading it', async () => {
    const project = new Project({
      compilerOptions: { strict: true },
      useInMemoryFileSystem: true,
    })
    const sourceFile = project.createSourceFile(
      'input.ts',
      `import type { Payload } from 'payload'

declare const payload: Payload

payload.jobs.run(undefined)
`,
    )

    await addOverrideAccessTrue.apply({ packageJsons: [], project })

    expect(sourceFile.getFullText()).toContain('payload.jobs.run({ overrideAccess: true })')
    expect(
      project.getPreEmitDiagnostics().filter((diagnostic) => diagnostic.getCode() === 2698),
    ).toEqual([])
  })

  it('leaves spread call arguments unchanged and emits a manual-review note', async () => {
    const source = `import type { Payload as PayloadInstance } from 'payload'

declare const payload: PayloadInstance & { find(options: { collection: string }): void }
declare const args: [{ collection: string }]

payload.find(...args)
`
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile('input.ts', source)

    const result = await addOverrideAccessTrue.apply({ packageJsons: [], project })

    expect(sourceFile.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([
      expect.stringContaining('could not safely rewrite spread arguments'),
    ])
  })

  it('leaves side-effecting void options unchanged and emits a manual-review note', async () => {
    const source = `import type { Payload as PayloadInstance } from 'payload'

declare const payload: PayloadInstance & { find(options: unknown): void }
declare function sideEffect(): unknown

payload.find(void sideEffect())
`
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile('input.ts', source)

    const result = await addOverrideAccessTrue.apply({ packageJsons: [], project })

    expect(sourceFile.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([
      expect.stringContaining('could not safely rewrite a side-effecting void argument'),
    ])
  })

  it('does not modify unrelated APIs with similarly named methods', async () => {
    const input = await fixture('non-matching.input.ts')

    const result = await runTransform({ source: input, transform: addOverrideAccessTrue })

    expect(result).toBe(input)
  })

  it('leaves ambiguous Payload-like calls unchanged and emits a manual-review note', async () => {
    const input = await fixture('ambiguous.input.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    project.createSourceFile('input.ts', input)

    const result = await addOverrideAccessTrue.apply({ packageJsons: [], project })

    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([
      expect.stringContaining(
        'could not confirm that `payload.create` is a Payload Local API call',
      ),
    ])
  })
})
