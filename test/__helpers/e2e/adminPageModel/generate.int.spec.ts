import type { SanitizedConfig } from 'payload'

import { describe, expect, it } from 'vitest'

import { createAdminPageModelDescriptor, createAdminPageModelSource } from './generate.js'

const config = {
  blocks: [
    {
      slug: 'reusableQuote',
      fields: [
        {
          name: 'citation',
          type: 'text',
        },
      ],
      labels: {
        plural: 'Reusable Quotes',
        singular: 'Reusable Quote',
      },
    },
  ],
  collections: [
    {
      slug: 'articles',
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: {
            disabled: true,
          },
          required: true,
        },
        {
          name: 'tags',
          type: 'text',
          hasMany: true,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'summary',
              type: 'text',
            },
          ],
        },
        {
          type: 'collapsible',
          fields: [
            {
              name: 'collapsibleText',
              type: 'text',
            },
          ],
          label: 'Collapsible',
        },
        {
          type: 'tabs',
          tabs: [
            {
              fields: [
                {
                  name: 'tabText',
                  type: 'text',
                },
              ],
              label: 'Unnamed Tab',
            },
            {
              name: 'namedTab',
              fields: [
                {
                  name: 'nestedText',
                  type: 'text',
                },
              ],
              label: 'Named Tab',
            },
          ],
        },
        {
          name: 'meta',
          type: 'group',
          fields: [
            {
              name: 'description',
              type: 'text',
            },
          ],
        },
        {
          name: 'items',
          type: 'array',
          fields: [
            {
              name: 'labels',
              type: 'text',
              hasMany: true,
            },
          ],
        },
        {
          name: 'content',
          type: 'blocks',
          blocks: [
            {
              slug: 'quote',
              fields: [
                {
                  name: 'quoteText',
                  type: 'text',
                },
              ],
              labels: {
                plural: 'Quotes',
                singular: 'Quote',
              },
            },
          ],
        },
        {
          name: 'reusableContent',
          type: 'blocks',
          blocks: ['reusableQuote'],
        },
        {
          name: 'author',
          type: 'relationship',
          relationTo: ['users', 'guests'],
        },
      ],
    },
    {
      slug: 'excluded',
      fields: [],
    },
  ],
} as unknown as SanitizedConfig

describe('createAdminPageModelDescriptor', () => {
  it('generates selected collections and nested field metadata', () => {
    const descriptor = createAdminPageModelDescriptor(config, {
      collections: ['articles'],
    })

    expect(descriptor).toEqual({
      collections: {
        articles: {
          slug: 'articles',
          fields: {
            author: {
              type: 'relationship',
              hasMany: false,
              path: 'author',
              relationTo: ['users', 'guests'],
            },
            collapsibleText: {
              type: 'text',
              hasMany: false,
              path: 'collapsibleText',
            },
            content: {
              type: 'blocks',
              blocks: {
                quote: {
                  slug: 'quote',
                  fields: {
                    quoteText: {
                      type: 'text',
                      hasMany: false,
                      path: 'content.quoteText',
                    },
                  },
                  label: 'Quote',
                },
              },
              path: 'content',
            },
            items: {
              type: 'array',
              fields: {
                labels: {
                  type: 'text',
                  hasMany: true,
                  path: 'items.labels',
                },
              },
              path: 'items',
            },
            meta: {
              type: 'group',
              fields: {
                description: {
                  type: 'text',
                  hasMany: false,
                  path: 'meta.description',
                },
              },
              path: 'meta',
            },
            namedTab: {
              type: 'group',
              fields: {
                nestedText: {
                  type: 'text',
                  hasMany: false,
                  path: 'namedTab.nestedText',
                },
              },
              path: 'namedTab',
            },
            reusableContent: {
              type: 'blocks',
              blocks: {
                reusableQuote: {
                  slug: 'reusableQuote',
                  fields: {
                    citation: {
                      type: 'text',
                      hasMany: false,
                      path: 'reusableContent.citation',
                    },
                  },
                  label: 'Reusable Quote',
                },
              },
              path: 'reusableContent',
            },
            summary: {
              type: 'text',
              hasMany: false,
              path: 'summary',
            },
            tabText: {
              type: 'text',
              hasMany: false,
              path: 'tabText',
            },
            tags: {
              type: 'text',
              hasMany: true,
              path: 'tags',
            },
            title: {
              type: 'text',
              admin: {
                disabled: true,
                hidden: false,
                readOnly: false,
              },
              hasMany: false,
              path: 'title',
              required: true,
            },
          },
        },
      },
    })
  })

  it('reports a requested collection that does not exist', () => {
    expect(() =>
      createAdminPageModelDescriptor(config, {
        collections: ['missing'],
      }),
    ).toThrow('Cannot generate an Admin page model for unknown collection "missing".')
  })
})

describe('createAdminPageModelSource', () => {
  it('creates a standalone literal descriptor module', () => {
    const result = createAdminPageModelSource(config, { collections: ['articles'] })

    expect(result).toContain('export const adminPageModel = {')
    expect(result).toContain('"articles": {')
    expect(result).toContain('} as const')
  })
})
