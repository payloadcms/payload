import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { Project, SyntaxKind, ts } from 'ts-morph'
import { describe, expect, it } from 'vitest'

import { transforms } from '../../registry.js'
import { runTransform } from '../../utils/test-helpers.js'
import { migrateAliasedExports } from '../migrate-aliased-exports/index.js'
import { migratePayloadRequestCreation } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

describe('migrate-payload-request-creation', () => {
  it.each([
    'empty',
    'populated',
    'expression',
    'aliases',
    'internal',
    'comments',
    'shadowed',
    'shorthand',
  ])('should migrate %s imports and calls', async (name) => {
    const source = await fixture(`${name}.input.ts`)
    const output = await fixture(`${name}.output.ts`)

    expect(await runTransform({ source, transform: migratePayloadRequestCreation })).toBe(output)
    expect(await runTransform({ source: output, transform: migratePayloadRequestCreation })).toBe(
      output,
    )
  })

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

  it('should preserve payload capture, inherited getters, getter order, and unrelated getters', async () => {
    const source = await fixture('getters.input.ts')
    const output = await runTransform({ source, transform: migratePayloadRequestCreation })
    const evaluate = (code: string) => {
      const context = {
        createLocalReq: (
          { context, depth, fallbackLocale, locale, req, urlSuffix, user }: Record<string, unknown>,
          payload: unknown,
        ) => ({ context, depth, fallbackLocale, locale, req, urlSuffix, user, payload }),
        createPayloadRequest: ({
          context,
          depth,
          fallbackLocale,
          locale,
          payload,
          req,
          urlSuffix,
          user,
        }: Record<string, unknown>) => ({
          context,
          depth,
          fallbackLocale,
          locale,
          req,
          urlSuffix,
          user,
          payload,
        }),
        observed: undefined,
      }
      const executable = new Project({ useInMemoryFileSystem: true }).createSourceFile(
        'input.ts',
        code,
      )

      executable.getImportDeclarations().forEach((declaration) => declaration.remove())
      runInNewContext(executable.getFullText(), context)

      return context.observed
    }

    expect(output).toContain('createPayloadRequest(')
    expect(output).not.toContain('...options')
    expect(evaluate(output)).toEqual(evaluate(source))
    expect(evaluate(output)).toEqual({
      request: {
        payload: { id: 'original' },
        context: 'context',
        depth: 1,
        fallbackLocale: 'en',
        locale: 'fr',
        req: {},
        urlSuffix: '/path',
        user: 'inherited',
      },
      events: ['context', 'depth', 'fallbackLocale', 'locale', 'req', 'urlSuffix', 'user'],
    })
  })

  it('should keep throwing option getters inside the rejected-Promise boundary', async () => {
    const source = `import { createLocalReq } from 'payload'
const options = Object.create(null, { context: { get() { throw new Error('getter') } } })
const payload = {}
try {
  globalThis.observed = createLocalReq(options, payload).then(() => 'resolved', error => 'rejected:' + error.message)
} catch (error) {
  globalThis.observed = Promise.resolve('threw:' + error.message)
}`
    const output = await runTransform({ source, transform: migratePayloadRequestCreation })
    const evaluate = async (code: string) => {
      const context = {
        createLocalReq: async ({ context }: Record<string, unknown>) => context,
        createPayloadRequest: async ({ context }: Record<string, unknown>) => context,
        observed: undefined,
      }
      const executable = new Project({ useInMemoryFileSystem: true }).createSourceFile(
        'input.ts',
        code,
      )

      executable.getImportDeclarations().forEach((declaration) => declaration.remove())
      runInNewContext(executable.getFullText(), context)

      return await context.observed
    }

    expect(output).toContain('createPayloadRequest(')
    expect(await evaluate(source)).toBe('rejected:getter')
    expect(await evaluate(output)).toBe('rejected:getter')
  })

  it.each(['CreateLocalReqOptions', 'CreateLocalReqOptions as Options'])(
    'should typecheck options-only annotations from %s without requiring payload',
    async (imported) => {
      const local = imported.includes(' as ') ? 'Options' : imported
      const source = `import type { ${imported} } from 'payload'\nimport { createLocalReq } from 'payload'\nconst options: ${local} = { user: 'user' }\ntype Extra = ${local} & { extra?: boolean }\nconst payload = { id: 'payload' }\nconst request = createLocalReq(options, payload)`
      const output = await runTransform({ source, transform: migratePayloadRequestCreation })
      const project = new Project({
        compilerOptions: { strict: true, noEmit: true },
        useInMemoryFileSystem: true,
      })
      const actualHelper = ts.createSourceFile(
        'createPayloadRequest.ts',
        await readFile(
          join(here, '../../../../payload/src/utilities/createPayloadRequest.ts'),
          'utf8',
        ),
        ts.ScriptTarget.Latest,
        true,
      )
      const args = actualHelper.statements.find(
        (node) => ts.isTypeAliasDeclaration(node) && node.name.text === 'CreatePayloadRequestArgs',
      )!

      project.createSourceFile(
        '/node_modules/payload/index.d.ts',
        `type Payload = { id: string }; type RequestContext = Record<string, unknown>; type TypedLocale = string; type PayloadRequest = Record<string, unknown>; type User = string;\n${args.getText(actualHelper)}\nexport declare function createPayloadRequest(args: CreatePayloadRequestArgs): unknown`,
      )
      const file = project.createSourceFile('/output.ts', output)

      expect(
        project.getPreEmitDiagnostics().map((diagnostic) => diagnostic.getMessageText()),
      ).toEqual([])
      expect(
        file.getVariableDeclarationOrThrow('options').getType().getProperty('payload'),
      ).toBeUndefined()
      expect(output).toContain(
        `Omit<${local === 'Options' ? 'Options' : 'CreatePayloadRequestArgs'}, 'payload'>`,
      )
    },
  )

  it.each([
    `const options = getOptions(); createLocalReq(getOptions(), payload)`,
    `const options = {}; createLocalReq({ user }, payload)`,
    `let options = {}; createLocalReq(options, payload)`,
    `createLocalReq(options, payload)`,
    `function build(options) { return createLocalReq(options, payload) }`,
    `const options = { user: 'user' }; createLocalReq(options, payload)`,
  ])('should skip unsafe options shapes and bindings: %s', async (body) => {
    const project = new Project({ useInMemoryFileSystem: true })
    const source = `import { createLocalReq } from 'payload'\n${body}`
    const file = project.createSourceFile('/unsafe.ts', source)
    const result = await migratePayloadRequestCreation.apply({ packageJsons: [], project })

    expect(file.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes?.join('\n')).toContain('options')
  })

  it.each([
    `import type { CreateLocalReqOptions } from 'payload'\nexport { CreateLocalReqOptions }`,
    `import type { CreateLocalReqOptions } from 'payload'\ntype Omit<T, K> = T\nconst options: CreateLocalReqOptions = { user }`,
    `import type { CreateLocalReqOptions } from '../utilities/createLocalReq.js'\nconst options: CreateLocalReqOptions = { user }`,
    `import type { CreateLocalReqOptions } from 'payload/dist/utilities/createLocalReq.js'\nconst options: CreateLocalReqOptions = { user }`,
  ])('should skip unsupported options-type usage or import source', async (source) => {
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('/types.ts', source)
    const result = await migratePayloadRequestCreation.apply({ packageJsons: [], project })

    expect(file.getFullText()).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes?.join('\n')).toContain('CreateLocalReqOptions')
  })

  it('should complete the request rename after migrate-aliased-exports', async () => {
    const source = `import { createPayloadRequest } from '@payloadcms/next/utilities'\nconst req = createPayloadRequest(args)`
    const intermediate = await runTransform({ source, transform: migrateAliasedExports })

    expect(intermediate).toBe(
      `import { createPayloadRequestFromWebRequest as createPayloadRequest } from 'payload'\nconst req = createPayloadRequest(args)`,
    )

    const output = await runTransform({
      source: intermediate,
      transform: migratePayloadRequestCreation,
    })
    const expected = `import { createPayloadRequestFromWebRequest } from 'payload'\nconst req = createPayloadRequestFromWebRequest(args)`

    expect(output).toBe(expected)
    expect(await runTransform({ source: output, transform: migratePayloadRequestCreation })).toBe(
      expected,
    )
  })

  it('should preserve user-authored aliases of createPayloadRequestFromWebRequest', async () => {
    const source = `import { createPayloadRequestFromWebRequest as webRequest } from 'payload'\nconst req = webRequest(args)`

    expect(await runTransform({ source, transform: migratePayloadRequestCreation })).toBe(source)
  })

  it('should preserve behavior when evaluating payload mutates the options', async () => {
    const source = await fixture('evaluation-order.input.ts')
    const project = new Project({ useInMemoryFileSystem: true })
    const file = project.createSourceFile('/evaluation-order.ts', source)
    const result = await migratePayloadRequestCreation.apply({ packageJsons: [], project })
    const output = file.getFullText()
    const evaluate = (code: string) => {
      const context = {
        createLocalReq: (options: { user: string }) => ({ ...options }),
        createPayloadRequest: (options: { user: string }) => options,
        observed: undefined,
      }
      const executable = new Project({ useInMemoryFileSystem: true }).createSourceFile(
        'input.ts',
        code,
      )

      executable.getImportDeclarations().forEach((declaration) => declaration.remove())
      runInNewContext(executable.getFullText(), context)

      return context.observed
    }

    expect(evaluate(source)).toBe('new')
    expect(evaluate(output)).toBe(evaluate(source))
    expect(output).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes?.[0]).toContain('/evaluation-order.ts:')
    expect(result.notes?.[0]).toContain('payload argument `(options.user = newUser, payload)`')
    expect(result.notes?.[0]).toContain('evaluation order')
  })

  it.each(['getPayload()', 'holder.payload', 'await getPayload()', '(payload)', 'payload!'])(
    'should skip the entire binding for payload expression %s',
    async (expression) => {
      const project = new Project({ useInMemoryFileSystem: true })
      const source = `import { createLocalReq } from 'payload'\nconst safe = createLocalReq({}, payload)\nconst req = createLocalReq(options, ${expression})`
      const file = project.createSourceFile('/evaluation-order.ts', source)

      const result = await migratePayloadRequestCreation.apply({ packageJsons: [], project })

      expect(file.getFullText()).toBe(source)
      expect(result.filesChanged).toEqual([])
      expect(result.notes?.[0]).toContain(`payload argument \`${expression}\``)
      expect(result.notes?.[0]).toContain('evaluation order')
    },
  )

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

    expect(matching.getFullText()).toContain('createPayloadRequest({ payload: payload })')
    expect(matching.getFullText()).toContain('createPayloadRequestFromWebRequest(args)')
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
    expect(file.getFullText()).toContain('createPayloadRequest<User>({ payload: payload })')
    expect(file.getDescendantsOfKind(SyntaxKind.CallExpression)[0]?.getArguments()).toHaveLength(1)
  })

  it('should migrate a supported alias independently of an unsupported binding', async () => {
    const source = `import { createLocalReq, createLocalReq as local } from 'payload'\nconst callback = createLocalReq\nconst req = local({}, payload)`

    const output = await runTransform({ source, transform: migratePayloadRequestCreation })

    expect(output).toBe(
      `import { createLocalReq, createPayloadRequest as local } from 'payload'\nconst callback = createLocalReq\nconst req = local({ payload: payload })`,
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
