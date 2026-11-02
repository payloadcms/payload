import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'
import { describe, expect, it } from 'vitest'

import { transforms } from '../../registry.js'
import { runTransform } from '../../utils/test-helpers.js'
import { migratePayloadRequestCreation } from '../migrate-payload-request-creation/index.js'
import { migrateAdminContextProperties } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string) => readFile(join(here, name), 'utf8')

const apply = async (source: string) => {
  const project = new Project({ useInMemoryFileSystem: true })
  const file = project.createSourceFile('/fixture.ts', source)
  const result = await migrateAdminContextProperties.apply({ packageJsons: [], project })

  return { ...result, output: file.getFullText() }
}

describe('migrate-admin-context-properties', () => {
  it('should migrate removed AdminContext properties', async () => {
    const source = await fixture('basic.input.ts')
    const output = await fixture('basic.output.ts')

    expect(await runTransform({ source, transform: migrateAdminContextProperties })).toBe(output)
  })

  it('should be idempotent', async () => {
    const output = await fixture('basic.output.ts')

    expect(await runTransform({ source: output, transform: migrateAdminContextProperties })).toBe(
      output,
    )
  })

  it('should leave unrelated headers and languageCode untouched', async () => {
    const source = await fixture('no-match.input.ts')
    const output = await fixture('no-match.output.ts')
    const result = await apply(source)

    expect(result.output).toBe(output)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toBeUndefined()
  })

  it('should note that languageCode reads are now typed as string', async () => {
    const result = await apply(`import type { AdminContext } from 'payload'

export const getLanguage = (context: AdminContext) => context.languageCode
`)

    expect(result.output).toContain('context.req.i18n.language')
    expect(result.notes).toEqual([expect.stringContaining('typed as `string`')])
  })

  it('should not note languageCode when only headers are rewritten', async () => {
    const result = await apply(`import type { AdminContext } from 'payload'

export const getUserAgent = (context: AdminContext) => context.headers.get('user-agent')
`)

    expect(result.output).toContain("context.req.headers.get('user-agent')")
    expect(result.notes).toBeUndefined()
  })

  it('should migrate PartialAdminContext languageCode to i18n.language', async () => {
    const source = `import type { PartialAdminContext } from 'payload/internal'

type Language = PartialAdminContext['languageCode']
type Partial = Pick<PartialAdminContext, 'i18n' | 'languageCode'>

export const getLanguage = ({ languageCode, user }: PartialAdminContext) => ({ languageCode, user })
`

    expect(await runTransform({ source, transform: migrateAdminContextProperties })).toBe(
      `import type { PartialAdminContext } from 'payload/internal'

type Language = PartialAdminContext['i18n']['language']
type Partial = Pick<PartialAdminContext, 'i18n'>

export const getLanguage = ({ i18n: { language: languageCode }, user }: PartialAdminContext) => ({ languageCode, user })
`,
    )
  })

  it('should follow aliased imports and preserve defaults and optional chaining', async () => {
    const source = `import { initAdminContext as init } from 'payload/internal'

export async function read(args: never) {
  const context = await init(args)
  const { headers = new Headers(), ...rest } = context

  return { headers, language: context?.languageCode, rest }
}
`

    expect(await runTransform({ source, transform: migrateAdminContextProperties })).toBe(
      `import { initAdminContext as init } from 'payload/internal'

export async function read(args: never) {
  const context = await init(args)
  const { req: { headers = new Headers() }, ...rest } = context

  return { headers, language: context?.req.i18n.language, rest }
}
`,
    )
  })

  it('should keep an existing req binding next to the moved properties', async () => {
    const source = `import { initAdminContext } from 'payload/internal'

export async function read(args: never) {
  const { headers, req } = await initAdminContext(args)

  return { payload: req.payload, userAgent: headers.get('user-agent') }
}
`

    expect(await runTransform({ source, transform: migrateAdminContextProperties })).toBe(
      `import { initAdminContext } from 'payload/internal'

export async function read(args: never) {
  const { req: { headers }, req } = await initAdminContext(args)

  return { payload: req.payload, userAgent: headers.get('user-agent') }
}
`,
    )
  })

  it('should migrate names from before migrate-payload-request-creation', async () => {
    const source = `import type { InitReqResult } from 'payload'

import { initReq } from 'payload/internal'

export const getUserAgent = async (args: never) => (await initReq(args)).headers.get('user-agent')
export const getLanguage = (context: InitReqResult) => context.languageCode
`

    expect(await runTransform({ source, transform: migrateAdminContextProperties })).toBe(
      `import type { InitReqResult } from 'payload'

import { initReq } from 'payload/internal'

export const getUserAgent = async (args: never) => (await initReq(args)).req.headers.get('user-agent')
export const getLanguage = (context: InitReqResult) => context.req.i18n.language
`,
    )
  })

  it('should run after migrate-payload-request-creation in the registry', () => {
    const names = transforms.map(({ name }) => name)

    expect(names.indexOf(migrateAdminContextProperties.name)).toBeGreaterThan(
      names.indexOf(migratePayloadRequestCreation.name),
    )
  })

  it('should leave element access and empty Pick types unchanged and report them', async () => {
    const source = `import type { AdminContext } from 'payload'

type Headers = Pick<AdminContext, 'headers' | 'languageCode'>

export const getUserAgent = (context: AdminContext) => context['headers'].get('user-agent')
`
    const result = await apply(source)

    expect(result.output).toBe(source)
    expect(result.filesChanged).toEqual([])
    expect(result.notes).toEqual([
      expect.stringContaining('only picks properties removed in v4'),
      expect.stringContaining('migrate manually to `context.req.headers`'),
    ])
  })
})
