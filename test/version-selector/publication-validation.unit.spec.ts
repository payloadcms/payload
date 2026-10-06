import type { PayloadRequest, SanitizedCollectionConfig } from 'payload'

import { expect, it } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise the private field pipeline with real editor hooks.
import { beforeChange } from '../../packages/payload/src/fields/hooks/beforeChange/index.js'
import { getLexicalHooks } from '../../packages/richtext-lexical/src/hooks.js'

it('should retain Lexical locale merge actions during deferred publication validation', async () => {
  const block = { type: 'block', fields: { id: '1', label: 'Text' } }
  const value = { root: { children: [block] } }
  const features = {
    getSubFields: new Map([['block', () => [{ name: 'label', type: 'text', localized: true }]]]),
    getSubFieldsData: new Map([
      ['block', ({ node }: { node?: { fields?: Record<string, unknown> } }) => node?.fields ?? {}],
    ]),
  }
  const editor = {
    hooks: getLexicalHooks({
      editorConfig: { features } as Parameters<typeof getLexicalHooks>[0]['editorConfig'],
    }),
  }
  const collection = {
    slug: 'posts',
    versions: { drafts: true },
    fields: [
      { name: 'richText', type: 'richText', editor },
      {
        name: '_status',
        type: 'select',
        options: [],
        hooks: { beforeChange: [() => 'published'] },
      },
    ],
  } as SanitizedCollectionConfig
  const document = { richText: value, _status: 'draft' }

  const result = await beforeChange({
    collection,
    context: { internal: { richText: { richText: { originalNodeIDMap: { '1': block } } } } },
    data: document,
    doc: document,
    docWithLocales: document,
    global: null,
    operation: 'update',
    overrideAccess: true,
    req: {
      locale: 'all',
      payload: {
        config: {
          blocks: [],
          localization: { locales: ['en', 'fr'], localeCodes: ['en', 'fr'], defaultLocale: 'en' },
        },
      },
    } as unknown as PayloadRequest,
    skipValidation: true,
    validateDraftOnPublish: true,
  })

  expect(result).toMatchObject({
    richText: { root: { children: [{ fields: { label: { en: 'Text', fr: 'Text' } } }] } },
    _status: 'published',
  })
})
