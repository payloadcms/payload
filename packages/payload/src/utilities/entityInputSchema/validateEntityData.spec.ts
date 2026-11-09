import { initI18n } from '@payloadcms/translations'
import { en } from '@payloadcms/translations/languages/en'
import { fr } from '@payloadcms/translations/languages/fr'
import { describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../../types/index.js'
import type { EntityInputSchema } from './types.js'

import { ValidationError } from '../../errors/ValidationError.js'
import { flattenAllFields } from '../flattenAllFields.js'
import { getCollectionInputSchema, getGlobalInputSchema } from './getEntityInputSchema.js'
import { validateCollectionData, validateGlobalData } from './validateEntityData.js'

vi.mock('./getEntityInputSchema.js', () => ({
  getCollectionInputSchema: vi.fn(),
  getGlobalInputSchema: vi.fn(),
}))

const schema: EntityInputSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    count: { type: 'number' },
    enabled: { type: 'boolean' },
    choice: { type: 'string', enum: ['one', 'two'] },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' } },
        required: ['title'],
      },
    },
    layout: {
      type: 'array',
      items: {
        type: 'object',
        properties: { blockType: { const: 'hero' }, title: { type: 'string' } },
      },
    },
  },
  required: ['title'],
}

const createRequest = async ({ language = 'en' }: { language?: 'en' | 'fr' } = {}) => {
  const i18n = await initI18n({
    config: { fallbackLanguage: 'en', supportedLanguages: { en, fr } },
    context: 'api',
    language,
  })
  const entity = {
    slug: 'posts',
    flattenedFields: flattenAllFields({
      fields: [
        { name: 'title', type: 'text', label: { en: 'Headline', fr: 'Titre' }, required: true },
        { name: 'count', type: 'number', label: 'Count' },
        { name: 'enabled', type: 'checkbox', label: 'Enabled' },
        { name: 'choice', type: 'select', options: ['one', 'two'] },
        {
          name: 'items',
          type: 'array',
          label: 'Entries',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: ({ i18n }) => (i18n.language === 'fr' ? 'Titre' : 'Title'),
            },
          ],
        },
        {
          name: 'layout',
          type: 'blocks',
          label: 'Layout',
          blocks: [{ slug: 'hero', fields: [{ name: 'title', type: 'text', label: 'Heading' }] }],
        },
      ],
    }),
  }

  vi.mocked(getCollectionInputSchema).mockReturnValue(schema)
  vi.mocked(getGlobalInputSchema).mockReturnValue(schema)

  return {
    i18n,
    payload: { collections: { posts: { config: entity } }, config: { globals: [entity] } },
    t: i18n.t,
  } as unknown as PayloadRequest
}

const getErrors = ({
  data,
  req,
  isGlobal = false,
}: {
  data: Record<string, unknown>
  isGlobal?: boolean
  req: PayloadRequest
}) => {
  try {
    if (isGlobal) {
      validateGlobalData({ slug: 'posts', data, req })
    } else {
      validateCollectionData({ slug: 'posts', data, req })
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      return error.data.errors
    }

    throw error
  }

  throw new Error('Expected schema validation to fail')
}

describe('entity input validation messages', () => {
  it.each([false, true])(
    'should translate required errors and field labels (global: %s)',
    async (isGlobal) => {
      const req = await createRequest({ language: 'fr' })
      const errors = getErrors({ data: { title: null }, isGlobal, req })

      expect(errors).toEqual([
        { label: 'Titre', message: req.t('validation:required'), path: 'data.title' },
      ])
      expect(errors[0].message).not.toContain('expected string')
    },
  )

  it('should explain invalid numbers, booleans, and selections without schema messages', async () => {
    const req = await createRequest()
    const errors = getErrors({
      data: { title: 'Valid', count: 'many', enabled: 'yes', choice: 'three' },
      req,
    })

    expect(errors).toEqual([
      { label: 'Count', message: req.t('validation:enterNumber'), path: 'data.count' },
      { label: 'Enabled', message: req.t('validation:trueOrFalse'), path: 'data.enabled' },
      { label: 'choice', message: req.t('validation:invalidSelection'), path: 'data.choice' },
    ])
  })

  it('should identify array and block rows using configured labels', async () => {
    const req = await createRequest()
    const errors = getErrors({
      data: {
        title: 'Valid',
        items: [{ title: null }],
        layout: [{ blockType: 'hero', title: 42 }],
      },
      req,
    })

    expect(errors).toEqual([
      {
        label: 'Entries 1 > Title',
        message: req.t('validation:required'),
        path: 'data.items[0].title',
      },
      {
        label: 'Layout 1 > Heading',
        message: req.t('validation:invalidInput'),
        path: 'data.layout[0].title',
      },
    ])
  })

  it('should continue to accept valid data and partial updates', async () => {
    const req = await createRequest()

    expect(() =>
      validateCollectionData({ slug: 'posts', data: { title: 'Valid' }, req }),
    ).not.toThrow()
    expect(() =>
      validateCollectionData({ slug: 'posts', data: {}, partial: true, req }),
    ).not.toThrow()
    expect(getErrors({ data: {}, req })).toEqual([
      { label: 'Headline', message: req.t('validation:required'), path: 'data.title' },
    ])
  })
})
