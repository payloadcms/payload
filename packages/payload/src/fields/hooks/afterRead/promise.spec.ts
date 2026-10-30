import { createHook } from 'node:async_hooks'
import { describe, expect, it } from 'vitest'

import type { Field } from '../../config/types.js'
import type { AfterReadArgs } from './index.js'

import { afterRead } from './index.js'

const read = (fields: Field[], doc: Record<string, unknown>, overrides = {}) =>
  afterRead({
    collection: { fields },
    context: {},
    depth: 0,
    doc,
    fallbackLocale: false,
    locale: 'en',
    overrideAccess: true,
    req: {
      payload: {
        blocks: {},
        collections: {},
        config: { defaultDepth: 0, maxDepth: 10, localization: { locales: ['en', 'de', 'ja'] } },
      },
    },
    ...overrides,
  } as unknown as AfterReadArgs<Record<string, unknown>>)

describe('afterRead synchronous scalar fields', () => {
  it.each(['en', 'de', 'ja'])(
    'should avoid per-field promises for %s localized scalar fields',
    async (locale) => {
      const values = { de: 'Hallo', en: 'Hello', ja: 'こんにちは' }
      const fields: Field[] = Array.from({ length: 1000 }, (_, i) => ({
        name: `text${i}`,
        type: 'text',
        localized: true,
      }))
      const doc = Object.fromEntries(
        fields.map((field) => [(field as { name: string }).name, { ...values }]),
      )
      let promises = 0
      const hook = createHook({
        init(_id, type) {
          if (type === 'PROMISE') promises++
        },
      })
      hook.enable()
      let result: Record<string, unknown>
      try {
        result = await read(fields, doc, { locale })
      } finally {
        hook.disable()
      }
      expect(result.text999).toBe(values[locale as keyof typeof values])
      expect(promises).toBeLessThan(20)
    },
  )

  it('should preserve fallback, all-locales and nested traversal', async () => {
    const fields: Field[] = [{ name: 'title', type: 'text', localized: true }]
    expect(
      (
        await read(
          fields,
          { title: { en: 'Hello', ja: '' } },
          { locale: 'ja', fallbackLocale: 'en' },
        )
      ).title,
    ).toBe('Hello')
    expect(
      (await read(fields, { title: { en: 'Hello', ja: 'こんにちは' } }, { locale: 'all' })).title,
    ).toEqual({ en: 'Hello', ja: 'こんにちは' })
    expect(
      await read(
        [{ type: 'row', fields: [{ name: 'rows', type: 'array', fields }] }],
        { rows: [{ title: { ja: 'こんにちは' } }] },
        { locale: 'ja' },
      ),
    ).toEqual({ rows: [{ title: 'こんにちは' }] })
  })

  it('should preserve hidden fields and inclusive and exclusive selection', async () => {
    const fields: Field[] = [
      { name: 'id', type: 'text', hidden: true },
      { name: 'title', type: 'text' },
      { name: 'secret', type: 'text', hidden: true, defaultValue: 'do not restore' },
    ]
    expect(
      await read(
        fields,
        { id: 'id', title: 'title', secret: 'secret' },
        { select: { title: true } },
      ),
    ).toEqual({ id: 'id', title: 'title' })
    expect(
      await read(
        fields,
        { id: 'id', title: 'title', secret: 'secret' },
        { select: { title: false }, showHiddenFields: true },
      ),
    ).toEqual({ id: 'id', secret: 'secret' })
  })

  it('should still await hooks, access checks and functional defaults', async () => {
    const fields: Field[] = [
      {
        name: 'secret',
        type: 'text',
        access: { read: async () => false },
        defaultValue: 'do not restore',
      },
      { name: 'title', type: 'text', hooks: { afterRead: [async ({ value }) => `${value}!`] } },
      { name: 'default', type: 'text', defaultValue: async () => 'default' },
      { name: 'object', type: 'json', defaultValue: { nested: ['original'] } },
    ]
    const result = await read(
      fields,
      { secret: 'secret', title: 'Hello' },
      { overrideAccess: false },
    )
    expect(result).toEqual({
      title: 'Hello!',
      default: 'default',
      object: { nested: ['original'] },
    })
    ;(result.object as { nested: string[] }).nested.push('changed')
    expect((fields[3] as { defaultValue: unknown }).defaultValue).toEqual({ nested: ['original'] })
    expect((await read(fields, { secret: 'visible', title: 'Hello' })).secret).toBe('visible')
  })

  it('should preserve rejection semantics for hooks and synchronous field validation', async () => {
    await expect(
      read(
        [
          {
            name: 'failure',
            type: 'text',
            hooks: {
              afterRead: [
                () => {
                  throw new Error('hook failed')
                },
              ],
            },
          },
        ],
        {},
      ),
    ).rejects.toThrow('hook failed')
    await expect(read([{ name: 'body', type: 'richText' }], {})).rejects.toThrow(/editor/i)
  })

  it('should still run editor hooks and sanitize point fields', async () => {
    const fields = [
      {
        name: 'body',
        type: 'richText',
        editor: {
          hooks: {
            afterRead: [async ({ value }: { value: object }) => ({ ...value, checked: true })],
          },
        },
      },
    ] as unknown as Field[]
    expect(await read(fields, { body: { text: 'body' } })).toEqual({
      body: { text: 'body', checked: true },
    })
    expect(
      await read([{ name: 'point', type: 'point' }], { point: { coordinates: [1, 2] } }),
    ).toEqual({ point: [1, 2] })
  })
})
