import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { Field, Validate } from '../../config/types.js'

import { describe, expect, it, vi } from 'vitest'

import { flattenValidationData } from './flattenValidationData.js'
import { beforeChange } from './index.js'

vi.mock('../../../index.js', () => ({ validateBlocksFilterOptions: vi.fn() }))

type TextValidation = Validate<string, JsonObject, JsonObject>

describe('beforeChange locale all validation context', () => {
  const translations = { en: 'English text', es: 'Spanish text' }

  it('should project data and siblingData for each locale without changing stored translations', async () => {
    const validate = vi.fn<TextValidation>((value, { data, siblingData }) =>
      value === data.confirmation && value === siblingData.confirmation
        ? true
        : 'Translations do not match',
    )
    const fields: Field[] = [
      { name: 'title', type: 'text', localized: true, validate },
      { name: 'confirmation', type: 'text', localized: true },
      { name: 'metadata', type: 'json' },
    ]
    const data = {
      title: translations,
      confirmation: translations,
      metadata: { en: 'shared JSON' },
    }
    const result = await runBeforeChange({ data, fields })

    expect(
      validate.mock.calls.map(([value, { data, req, siblingData }]) => ({
        confirmation: siblingData.confirmation,
        locale: req.locale,
        metadata: data.metadata,
        title: value,
      })),
    ).toEqual([
      {
        confirmation: translations.en,
        locale: 'en',
        metadata: data.metadata,
        title: translations.en,
      },
      {
        confirmation: translations.es,
        locale: 'es',
        metadata: data.metadata,
        title: translations.es,
      },
    ])
    expect(result).toEqual(data)
    expect(data.title).toEqual(translations)
  })

  it('should reject a translation that does not match its localized sibling', async () => {
    const validate: TextValidation = (value, { siblingData }) =>
      value === siblingData.confirmation || 'Translations do not match'
    const fields: Field[] = [
      {
        name: 'title',
        type: 'text',
        localized: true,
        validate,
      },
      { name: 'confirmation', type: 'text', localized: true },
    ]

    await expect(
      runBeforeChange({
        data: { title: translations, confirmation: { ...translations, es: 'Different' } },
        fields,
      }),
    ).rejects.toThrow('Title (es)')
  })

  it('should use existing localized sibling values for a partial update', async () => {
    const validate = vi.fn<TextValidation>(
      (value, { siblingData }) => value === siblingData.confirmation || 'Translations do not match',
    )
    const fields: Field[] = [
      { name: 'title', type: 'text', localized: true, validate },
      { name: 'confirmation', type: 'text', localized: true },
    ]
    const doc = { title: translations, confirmation: translations }
    const result = await runBeforeChange({ data: { title: { es: translations.es } }, doc, fields })

    expect(validate).toHaveBeenCalledOnce()
    expect(result.title).toEqual(translations)
    expect(doc.confirmation).toEqual(translations)
  })

  it('should project nested array context inside named tabs', async () => {
    const validate = vi.fn<TextValidation>((value, { data }) =>
      value === data.settings.items[0].confirmation ? true : 'Translations do not match',
    )
    const fields: Field[] = [
      { name: 'title', type: 'text', localized: true, validate },
      {
        type: 'tabs',
        tabs: [
          {
            name: 'settings',
            fields: [
              {
                name: 'items',
                type: 'array',
                fields: [{ name: 'confirmation', type: 'text', localized: true }],
              },
            ],
          },
        ],
      },
    ]
    const data = {
      title: translations,
      settings: { items: [{ confirmation: translations }] },
    }
    const result = await runBeforeChange({ data, fields })

    expect(validate).toHaveBeenCalledTimes(2)
    expect(result).toEqual(data)
  })

  it('should project blockData through nested groups and referenced blocks', async () => {
    const validate = vi.fn<TextValidation>((value, { blockData, data, siblingData }) =>
      value === siblingData.confirmation &&
      value === blockData.confirmation &&
      value === data.confirmation
        ? true
        : 'Translations do not match',
    )
    const blockFields: Field[] = [
      { name: 'confirmation', type: 'text', localized: true },
      {
        name: 'nested',
        type: 'group',
        fields: [
          { name: 'title', type: 'text', localized: true, validate },
          { name: 'confirmation', type: 'text', localized: true },
        ],
      },
    ]
    const fields: Field[] = [
      { name: 'confirmation', type: 'text', localized: true },
      { name: 'layout', type: 'blocks', blocks: ['content'] },
    ]
    const data = {
      confirmation: translations,
      layout: [
        {
          blockType: 'content',
          confirmation: translations,
          nested: { title: translations, confirmation: translations },
        },
      ],
    }
    const result = await runBeforeChange({
      blocks: { content: { slug: 'content', fields: blockFields, flattenedFields: [] } },
      data,
      fields,
    })

    expect(validate).toHaveBeenCalledTimes(2)
    expect(result).toEqual(data)
  })

  it('should project global validator context using the global fields', async () => {
    const validate: TextValidation = (value, { data, siblingData }) =>
      (value === data.confirmation && value === siblingData.confirmation) ||
      'Translations do not match'
    const fields: Field[] = [
      {
        name: 'title',
        type: 'text',
        localized: true,
        validate,
      },
      { name: 'confirmation', type: 'text', localized: true },
    ]
    const data = { title: translations, confirmation: translations }
    const result = await runBeforeChange({ data, fields, isGlobal: true })

    expect(result).toEqual(data)
  })

  it('should keep single locale validator context unchanged', async () => {
    const validate = vi.fn<TextValidation>(() => true)
    const fields: Field[] = [{ name: 'title', type: 'text', localized: true, validate }]

    await runBeforeChange({ data: { title: 'English text' }, fields, locale: 'en' })

    expect(validate.mock.calls[0]![1].data.title).toBe('English text')
    expect(validate.mock.calls[0]![1].siblingData.title).toBe('English text')
  })

  it('should project localized containers without treating nested JSON keys as locales', () => {
    const nestedFields: Field[] = [{ name: 'metadata', type: 'json', localized: true }]
    const fields: Field[] = [
      { name: 'group', type: 'group', localized: true, fields: nestedFields },
      { type: 'tabs', tabs: [{ name: 'tab', localized: true, fields: nestedFields }] },
      { name: 'items', type: 'array', localized: true, fields: nestedFields },
      {
        name: 'layout',
        type: 'blocks',
        localized: true,
        blocks: [{ slug: 'content', fields: nestedFields }],
      },
    ]
    const english = { metadata: { en: 'Literal JSON key' } }
    const spanish = { metadata: { en: 'Another literal JSON key' } }
    const data = {
      group: { en: english, es: spanish },
      tab: { en: english, es: spanish },
      items: { en: [english], es: [spanish] },
      layout: {
        en: [{ blockType: 'content', ...english }],
        es: [{ blockType: 'content', ...spanish }],
      },
    }
    const result = flattenValidationData({
      config: { blocks: [] } as unknown as PayloadRequest['payload']['config'],
      data,
      fields,
      locale: 'es',
    })

    expect(result).toEqual({
      group: spanish,
      tab: spanish,
      items: [spanish],
      layout: [{ blockType: 'content', ...spanish }],
    })
    expect(data.group).toEqual({ en: english, es: spanish })
  })
})

async function runBeforeChange({
  blocks = {},
  data,
  doc = {},
  fields,
  isGlobal = false,
  locale = 'all',
}: {
  blocks?: PayloadRequest['payload']['blocks']
  data: JsonObject
  doc?: JsonObject
  fields: Field[]
  isGlobal?: boolean
  locale?: string
}) {
  const req = {
    locale,
    payload: {
      blocks,
      config: {
        blocks: Object.values(blocks),
        localization: { defaultLocale: 'en', localeCodes: ['en', 'es'] },
      },
    },
    t: (key: string) => key,
  } as PayloadRequest

  return beforeChange({
    collection: isGlobal ? null : ({ fields, slug: 'posts' } as SanitizedCollectionConfig),
    context: {},
    data,
    doc,
    docWithLocales: doc,
    global: isGlobal ? ({ fields, slug: 'settings' } as SanitizedGlobalConfig) : null,
    operation: 'update',
    overrideAccess: true,
    req,
  })
}
