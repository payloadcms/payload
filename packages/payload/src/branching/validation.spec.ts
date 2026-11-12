import type { Config } from '../config/types.js'
import type { Field } from '../fields/config/types.js'
import type { PayloadRequest } from '../types/index.js'
import type { BranchMergeValidationCandidate } from './validation.js'

import { describe, expect, it, vi } from 'vitest'

import { sanitizeConfig } from '../config/sanitize.js'
import { prepareValidationData } from './prepareValidationData.js'
import { defaultBranchMergeValidation } from './validation.js'

const linkFields: Field[] = [
  { name: 'type', type: 'select', options: ['custom', 'reference'] },
  {
    name: 'reference',
    type: 'relationship',
    relationTo: ['pages'],
    required: true,
    admin: { condition: (_, siblingData) => siblingData.type === 'reference' },
  },
  {
    name: 'url',
    type: 'text',
    required: true,
    admin: { condition: (_, siblingData) => siblingData.type === 'custom' },
  },
]
const fields: Field[] = [
  { name: 'link', type: 'group', fields: linkFields },
  { name: 'items', type: 'array', localized: true, required: true, fields: linkFields },
  {
    name: 'layout',
    type: 'blocks',
    localized: true,
    required: true,
    blocks: ['links'],
  },
]
const config = sanitizeConfig({
  collections: [{ slug: 'pages', fields, authorship: false }],
  globals: [{ slug: 'header', fields, authorship: false }],
  blocks: [{ slug: 'links', fields: linkFields }],
  localization: { defaultLocale: 'en', locales: ['en', 'fr'] },
} as Config)
const inactiveReference = {
  type: 'custom',
  url: '/accepted',
  reference: { relationTo: 'pages', value: null },
}

const validate = ({
  data,
  entityType = 'collection',
  locale = 'en',
  req,
}: {
  data: Record<string, unknown>
  entityType?: 'collection' | 'global'
  locale?: string
  req?: PayloadRequest
}) => {
  const candidate: BranchMergeValidationCandidate = {
    changeID: 'change',
    collectionSlug: entityType === 'collection' ? 'pages' : undefined,
    globalSlug: entityType === 'global' ? 'header' : undefined,
    data,
    draft: false,
    entityType,
    locale,
    operation: 'update',
  }

  return defaultBranchMergeValidation({
    branch: 'campaign',
    candidates: [candidate],
    req:
      req ??
      ({
        context: {},
        payload: {
          config,
          blocks: Object.fromEntries(config.blocks!.map((block) => [block.slug, block])),
          collections: { pages: { config: config.collections[0] } },
          globals: { config: config.globals },
          db: { defaultIDType: 'text' },
        },
      } as unknown as PayloadRequest),
    target: 'main',
  })
}

describe.each(['collection', 'global'] as const)('merge validation for %s', (entityType) => {
  it('should accept unused link references without modifying the candidate', async () => {
    const data = { link: structuredClone(inactiveReference) }
    const original = structuredClone(data)
    const result = await validate({ data, entityType })

    expect(result).toEqual({ errors: [], valid: true })
    expect(data).toEqual(original)
  })

  it('should honor link conditions inside arrays and referenced blocks', async () => {
    const result = await validate({
      data: {
        items: [inactiveReference],
        layout: [{ blockType: 'links', ...inactiveReference }],
      },
      entityType,
    })

    expect(result).toEqual({ errors: [], valid: true })
  })

  it('should accept untranslated required arrays and layouts in a non-default locale', async () => {
    const data = { items: null, layout: null }
    const result = await validate({ data, entityType, locale: 'fr' })

    expect(result).toEqual({ errors: [], valid: true })
    expect(data).toEqual({ items: null, layout: null })
  })

  it('should reject null required arrays and layouts in the default locale', async () => {
    const result = await validate({ data: { items: null, layout: null }, entityType })

    expect(result.valid).toBe(false)
    expect(result.errors.map(({ path }) => path)).toEqual(['data.items', 'data.layout'])
  })

  it('should reject malformed active link references', async () => {
    const result = await validate({
      data: { link: { type: 'reference', reference: { relationTo: 'pages', value: null } } },
      entityType,
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(
      expect.objectContaining({ path: 'data.link.reference.value' }),
    )
  })

  it('should reject malformed translated layouts', async () => {
    const result = await validate({ data: { layout: { invalid: true } }, entityType, locale: 'fr' })

    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(expect.objectContaining({ path: 'data.layout' }))
  })
})

describe('merge validation conditions', () => {
  it('should preserve condition inputs across unnamed containers and named tabs', () => {
    const condition = vi.fn((_, siblingData) => siblingData.reference.value !== null)
    const fields: Field[] = [
      {
        type: 'tabs',
        tabs: [
          {
            label: 'Unnamed',
            fields: [
              { name: 'reference', type: 'json', admin: { condition: () => false } },
              {
                type: 'row',
                fields: [{ name: 'ignored', type: 'json', admin: { condition } }],
              },
            ],
          },
          {
            name: 'details',
            fields: [{ type: 'collapsible', label: 'Links', fields: linkFields }],
          },
          {
            name: 'hidden',
            admin: { condition: () => false },
            fields: [{ name: 'required', type: 'text', required: true }],
          },
        ],
      },
    ]
    const data = {
      reference: { value: null },
      ignored: null,
      details: inactiveReference,
      hidden: { required: null },
    }
    const result = prepareValidationData({
      data,
      fields,
      req: { payload: { config: { localization: false } } } as PayloadRequest,
    })

    expect(result).toEqual({ details: { type: 'custom', url: '/accepted' } })
    expect(condition).toHaveBeenCalledWith(
      data,
      data,
      expect.objectContaining({ path: ['ignored'] }),
    )
    expect(data.reference).toEqual({ value: null })
    expect(data.hidden).toEqual({ required: null })
  })

  it('should pass root data, block data, field path and merging user to block conditions', () => {
    const condition = vi.fn(() => false)
    const row = { blockType: 'links', reference: { value: null } }
    const data = { layout: [row] }
    const user = { id: 'editor', collection: 'users' }
    const result = prepareValidationData({
      data,
      fields: [
        {
          name: 'layout',
          type: 'blocks',
          blocks: [
            { slug: 'links', fields: [{ name: 'reference', type: 'json', admin: { condition } }] },
          ],
        },
      ],
      req: { user, payload: { config: { localization: false } } } as PayloadRequest,
    })

    expect(result).toEqual({ layout: [{ blockType: 'links' }] })
    expect(condition).toHaveBeenCalledWith(data, row, {
      blockData: row,
      operation: 'update',
      path: ['layout', '0', 'reference'],
      user,
    })
  })
})

it.each(['group', 'tab'] as const)(
  'should traverse a single-locale localized %s without treating its children as locales',
  (containerType) => {
    const childFields: Field[] = [
      { name: 'link', type: 'group', fields: linkFields },
      { name: 'items', type: 'array', localized: true, required: true, fields: [] },
    ]
    const fields: Field[] = [
      containerType === 'group'
        ? { name: 'details', type: 'group', localized: true, fields: childFields }
        : { type: 'tabs', tabs: [{ name: 'details', localized: true, fields: childFields }] },
    ]
    const data = { details: { link: inactiveReference, items: null } }
    const original = structuredClone(data)
    const result = prepareValidationData({
      data,
      fields,
      req: {
        locale: 'fr',
        payload: { config: { localization: { defaultLocale: 'en' } } },
      } as PayloadRequest,
    })

    expect(result).toEqual({
      details: { link: { type: 'custom', url: '/accepted' }, items: null },
    })
    expect(data).toEqual(original)
  },
)
