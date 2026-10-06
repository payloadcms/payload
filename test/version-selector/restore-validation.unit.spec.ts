import type { PayloadRequest, SanitizedGlobalConfig } from 'payload'

import { expect, it, vi } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise snapshot validation preparation.
import { afterRead } from '../../packages/payload/src/fields/hooks/afterRead/index.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise snapshot validation preparation.
import { beforeChange } from '../../packages/payload/src/fields/hooks/beforeChange/index.js'

it('should validate raw editor content without executing editor read hooks', async () => {
  const readHook = vi.fn(() => ({ valid: true }))
  const global = {
    slug: 'settings',
    fields: [
      {
        name: 'content',
        type: 'richText',
        editor: { hooks: { afterRead: [readHook] } },
        validate: (value: { valid: boolean }) => value.valid || 'Invalid editor content',
      },
    ],
  } as unknown as SanitizedGlobalConfig
  const req = {
    locale: 'en',
    payload: { config: { defaultDepth: 0, maxDepth: 10 } },
    t: () => 'Invalid',
  } as unknown as PayloadRequest
  const data = await afterRead({
    collection: null,
    context: {},
    depth: 0,
    doc: { content: { valid: false } },
    draft: false,
    fallbackLocale: null,
    global,
    locale: 'en',
    overrideAccess: true,
    req,
    showHiddenFields: true,
    skipEditorHooks: true,
    triggerHooks: false,
  })

  await expect(
    beforeChange({
      collection: null,
      context: {},
      data,
      doc: {},
      docWithLocales: data,
      global,
      operation: 'update',
      overrideAccess: true,
      req,
      skipFieldHooks: true,
    }),
  ).rejects.toMatchObject({ status: 400 })
  expect(readHook).not.toHaveBeenCalled()
})

it.each([true, false])(
  'should retain editor response hooks when field hooks are %s',
  async (triggerHooks) => {
    const readHook = vi.fn(() => ({ valid: true }))
    const global = {
      slug: 'settings',
      fields: [{ name: 'content', type: 'richText', editor: { hooks: { afterRead: [readHook] } } }],
    } as unknown as SanitizedGlobalConfig
    const req = {
      locale: 'en',
      payload: { config: { defaultDepth: 0, maxDepth: 10 } },
    } as unknown as PayloadRequest
    const result = await afterRead({
      collection: null,
      context: {},
      depth: 0,
      doc: { content: { valid: false } },
      draft: false,
      fallbackLocale: null,
      global,
      locale: 'en',
      overrideAccess: true,
      req,
      showHiddenFields: true,
      triggerHooks,
    })

    expect(result.content).toEqual({ valid: true })
    expect(readHook).toHaveBeenCalledOnce()
  },
)
