import type { CollectionConfig, TextField } from 'payload'

import { describe, expect, it } from 'vitest'

import { getFields } from '../fields/getFields.js'
import {
  getNormalizeUploadPrefixFieldHook,
  getNormalizeUploadPrefixHook,
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
