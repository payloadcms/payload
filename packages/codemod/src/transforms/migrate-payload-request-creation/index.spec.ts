import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project, SyntaxKind } from 'ts-morph'
import { describe, expect, it } from 'vitest'

import { transforms } from '../../registry.js'
import { runTransform } from '../../utils/test-helpers.js'
import { migratePayloadRequestCreation } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-payload-request-creation', () => {
  it.each(['empty', 'populated', 'expression', 'aliases', 'internal', 'comments', 'shadowed'])(
    'should migrate %s imports and calls',
    async (name) => {
      const source = await fixture(`${name}.input.ts`)
      const output = await fixture(`${name}.output.ts`)

      expect(await runTransform({ source, transform: migratePayloadRequestCreation })).toBe(output)
      expect(await runTransform({ source: output, transform: migratePayloadRequestCreation })).toBe(
        output,
      )
    },
  )

  it.each(['collision', 'unsupported', 'non-matching'])(
    'should preserve %s source byte for byte and report manual work',
    async (name) => {
      const source = await fixture(`${name}.input.ts`)
      const project = new Project({ useInMemoryFileSystem: true })
      const file = project.createSourceFile('/fixture.ts', source)
      const result = await migratePayloadRequestCreation.apply({ packageJsons: [], project })

      expect(file.getFullText()).toBe(source)
      expect(result.filesChanged).toEqual([])
      if (name === 'non-matching') {
        expect(result.notes).toBeUndefined()
      } else {
        expect(result.notes?.length).toBeGreaterThan(0)
        expect(result.notes?.every((note) => note.includes('/fixture.ts'))).toBe(true)
        expect(result.notes?.join('\n')).toContain(
          name === 'collision' ? 'collision' : 'Unsupported',
        )
      }
    },
  )

  it('should register the transform', () => {
    expect(transforms).toContain(migratePayloadRequestCreation)
  })

  it('should isolate local bindings when dependency exports resolve', async () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const declaration =
      'export declare function createLocalReq(options: unknown, payload: unknown): unknown\nexport declare function createPayloadRequest(args: unknown): unknown'
    const dependency = project.createSourceFile('/node_modules/payload/index.d.ts', declaration)
    const matching = project.createSourceFile(
      '/matching.ts',
      `import { createLocalReq, createPayloadRequest } from 'payload'\nconst req = createLocalReq({}, payload)\nconst web = createPayloadRequest(args)`,
    )
    const unsupportedSource = `import { createLocalReq } from 'payload'\nconst req = createLocalReq(options)`
    const unsupported = project.createSourceFile('/unsupported.ts', unsupportedSource)

    const result = await migratePayloadRequestCreation.apply({ packageJsons: [], project })

    expect(matching.getFullText()).toContain('createPayloadReq({ payload: payload })')
    expect(matching.getFullText()).toContain('createPayloadReqFromWebRequest(args)')
    expect(dependency.getFullText()).toBe(declaration)
    expect(unsupported.getFullText()).toBe(unsupportedSource)
    expect(result.filesChanged).toEqual(['/matching.ts'])
    expect(result.notes).toHaveLength(1)
    expect(result.notes?.[0]).toContain('/unsupported.ts:2: Unsupported use')
  })

  it('should report exactly the changed files and rewrite generic direct calls', async () => {
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile(
      '/matching.ts',
      `import { createLocalReq } from 'payload'\nconst req = createLocalReq<User>({}, payload)`,
    )
    project.createSourceFile('/unrelated.ts', 'const value = 1')

    const result = await migratePayloadRequestCreation.apply({ packageJsons: [], project })

    expect(result).toEqual({ filesChanged: ['/matching.ts'] })
    expect(file.getFullText()).toContain('createPayloadReq<User>({ payload: payload })')
    expect(file.getDescendantsOfKind(SyntaxKind.CallExpression)[0]?.getArguments()).toHaveLength(1)
  })

  it('should migrate a supported alias independently of an unsupported binding', async () => {
    const source = `import { createLocalReq, createLocalReq as local } from 'payload'\nconst callback = createLocalReq\nconst req = local({}, payload)`

    const output = await runTransform({ source, transform: migratePayloadRequestCreation })

    expect(output).toBe(
      `import { createLocalReq, createPayloadReq as local } from 'payload'\nconst callback = createLocalReq\nconst req = local({ payload: payload })`,
    )
  })

  it.each([
    'createLocalReq()',
    'createLocalReq({}, payload, extra)',
    '(createLocalReq)({}, payload)',
    'new createLocalReq({}, payload)',
    '({ createLocalReq })',
    'createLocalReq.bind(null)',
    'export { createLocalReq }',
  ])('should leave unsupported use %s and its import unchanged', async (use) => {
    const project = new Project({ useInMemoryFileSystem: true })
    const source = `import { createLocalReq } from 'payload'\n${use}`
    const file = project.createSourceFile('/unsupported.ts', source)

    const result = await migratePayloadRequestCreation.apply({ packageJsons: [], project })

    expect(file.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes?.join('\n')).toContain('Unsupported use of `createLocalReq`')
  })
})
