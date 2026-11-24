import type { CollectionConfig, TextField } from 'payload'

import { describe, expect, it } from 'vitest'

import { getFields } from '../fields/getFields.js'
import {
  getNormalizeUploadPrefixFieldHook,
  getNormalizeUploadPrefixHook,
  getResolveUploadPrefixHook,
  getRestoreStoredPrefixFieldHook,
} from './normalizeUploadPrefix.js'

const runHook = ({
  data,
  originalDoc,
  req = { context: {}, file: {} },
}: {
  data: Record<string, unknown>
  originalDoc?: Record<string, unknown>
  req?: Record<string, unknown>
}) =>
  getNormalizeUploadPrefixHook({ collectionPrefix: 'media' })({
    data,
    originalDoc,
    req,
  } as never)

describe('new upload prefixes', () => {
  it('should normalize after custom prefix field hooks', async () => {
    const fields = getFields({
      collection: {
        fields: [{ name: 'prefix', type: 'text', hooks: { beforeChange: [() => 'custom'] } }],
      } as CollectionConfig,
      prefix: 'media',
    })
    const field = fields.find((field) => 'name' in field && field.name === 'prefix') as TextField
    let value = 'original'

    for (const hook of field.hooks?.beforeChange || []) {
      value = await hook({
        value,
        data: { filename: 'file.png' },
        req: { file: {}, context: {} },
      } as never)
    }

    expect(value).toBe('media/custom')
  })

  it('should contain a prefix supplied with a file upload', async () => {
    const result = await runHook({ data: { filename: 'file.png', prefix: 'legacy' } })

    expect(result.prefix).toBe('media/legacy')
  })

  it('should leave internal cloud storage writes alone', async () => {
    const result = await runHook({
      data: { filename: 'file.png', prefix: 'legacy' },
      req: { context: { skipCloudStorage: true }, file: {} },
    })

    expect(result.prefix).toBe('legacy')
  })

  /**
   * The `prefix` field is writable through the REST/GraphQL/Local API, so a request
   * carrying no file must not be able to point a document at a foreign object.
   */
  it('should contain a caller-supplied prefix on a metadata-only update', async () => {
    const result = await runHook({
      data: { prefix: 'tenant-b/private' },
      originalDoc: { prefix: 'media/legacy' },
      req: { context: {} },
    })

    expect(result.prefix).toBe('media/tenant-b/private')
  })

  it('should contain a caller-supplied prefix on a create without a file', async () => {
    const result = await runHook({
      data: { prefix: 'tenant-b/private' },
      req: { context: {} },
    })

    expect(result.prefix).toBe('media/tenant-b/private')
  })

  it('should leave a stored prefix alone when the request omits it', async () => {
    const result = await runHook({
      data: { filename: 'legacy.png' },
      originalDoc: { prefix: 'legacy-invoices' },
      req: { context: {} },
    })

    expect(result.prefix).toBeUndefined()
  })

  it('should leave a stored prefix alone when the request repeats it unchanged', async () => {
    const result = await runHook({
      data: { prefix: 'legacy-invoices' },
      originalDoc: { prefix: 'legacy-invoices' },
      req: { context: {} },
    })

    expect(result.prefix).toBe('legacy-invoices')
  })

  describe('prefix field hook', () => {
    const runFieldHook = ({
      previousValue,
      req = { context: {} },
      value,
    }: {
      previousValue?: string
      req?: Record<string, unknown>
      value: unknown
    }) =>
      getNormalizeUploadPrefixFieldHook({ collectionPrefix: 'media' })({
        data: {},
        previousValue,
        req,
        value,
      } as never)

    it('should contain a caller-supplied value without a file', async () => {
      expect(await runFieldHook({ previousValue: 'media/legacy', value: 'tenant-b/private' })).toBe(
        'media/tenant-b/private',
      )
    })

    it('should leave an unchanged value alone', async () => {
      expect(
        await runFieldHook({ previousValue: 'legacy-invoices', value: 'legacy-invoices' }),
      ).toBe('legacy-invoices')
    })
  })
})

describe('upload prefix before filename selection', () => {
  const runOperationHook = async ({
    data,
    operation = 'create',
    req = { context: {}, file: {}, payload: { db: { findOne: () => Promise.resolve(null) } } },
    useCompositePrefixes,
  }: {
    data: Record<string, unknown>
    operation?: string
    req?: Record<string, unknown>
    useCompositePrefixes?: boolean
  }) =>
    (await getResolveUploadPrefixHook({ collectionPrefix: 'media', useCompositePrefixes })({
      args: { data },
      collection: { slug: 'media' },
      operation,
      req,
    } as never)) as { data: Record<string, unknown> }

  it('should resolve the prefix of an update with a file', async () => {
    const result = await runOperationHook({ data: { prefix: './nested/' }, operation: 'update' })

    expect(result.data.prefix).toBe('media/nested')
  })

  it('should leave the prefix of an update without a file alone', async () => {
    const result = await runOperationHook({
      data: { prefix: './nested/' },
      operation: 'update',
      req: { context: {} },
    })

    expect(result.data.prefix).toBe('./nested/')
  })

  it('should reject a prefix inside the object folder of a stored version', async () => {
    const result = getResolveUploadPrefixHook({ collectionPrefix: 'media' })({
      args: { data: { prefix: 'draft-key' } },
      collection: { slug: 'media', versions: { drafts: true } },
      operation: 'create',
      req: {
        context: {},
        file: {},
        payload: {
          db: {
            findOne: () => Promise.resolve(null),
            findVersions: () => Promise.resolve({ docs: [{ id: 'version' }] }),
          },
        },
      },
    } as never)

    await expect(result).rejects.toThrow('The provided prefix is not allowed.')
  })

  it('should give prefix hooks the stored prefix after a file update', () => {
    const value = getRestoreStoredPrefixFieldHook()({
      previousValue: 'media/nested',
      req: { file: {} },
      value: null,
    } as never)

    expect(value).toBe('media/nested')
  })

  it('should check the filename of a duplicate across the collection', async () => {
    const result = await getResolveUploadPrefixHook({ collectionPrefix: 'media' })({
      args: { data: { prefix: 'nested' }, duplicateFromID: 'source' },
      collection: { slug: 'media' },
      operation: 'create',
      req: { context: {} },
    } as never)

    expect(result.data).toStrictEqual({})
  })

  it('should resolve composite prefixes relative to the collection prefix', async () => {
    const result = await runOperationHook({
      data: { prefix: './nested/' },
      useCompositePrefixes: true,
    })

    expect(result.data.prefix).toBe('nested')
  })
})
