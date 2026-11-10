import type { FlattenedField } from 'payload'

import { describe, expect, it } from 'vitest'

import type { DrizzleAdapter } from '../../types.js'

import { transformForWrite } from './index.js'

describe('transformForWrite', () => {
  it('should preserve input when transforming blocks containing arrays and nested groups', () => {
    const adapter = {
      payload: {
        blocks: {},
        config: { localization: { localeCodes: ['en', 'fr'] } },
      },
      tableNameMap: new Map([
        ['documents_blocks_content', 'documents_blocks_content'],
        ['documents_blocks_content_items', 'documents_blocks_content_items'],
      ]),
      tables: {
        documents_blocks_content: { _uuid: {} },
        documents_blocks_content_items: { _uuid: {} },
      },
    } as unknown as DrizzleAdapter

    const fields = [
      {
        name: 'layout',
        type: 'blocks',
        blocks: [
          {
            slug: 'content',
            flattenedFields: [
              { name: 'id', type: 'text' },
              {
                name: 'items',
                type: 'array',
                flattenedFields: [
                  { name: 'id', type: 'text' },
                  {
                    name: 'settings',
                    type: 'group',
                    flattenedFields: [{ name: 'label', type: 'text' }],
                  },
                  {
                    name: 'translations',
                    type: 'group',
                    localized: true,
                    flattenedFields: [{ name: 'label', type: 'text' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ] as FlattenedField[]

    const data = {
      layout: [
        {
          id: 'block-id',
          blockType: 'content',
          items: [
            {
              id: 'item-id',
              settings: { label: 'Shared label' },
              translations: { en: { label: 'English' }, fr: { label: 'French' } },
            },
          ],
        },
      ],
    }

    const original = structuredClone(data)

    const transformed = transformForWrite({ adapter, data, fields, tableName: 'documents' })

    expect(data).toEqual(original)
    expect(transformed.blocks.documents_blocks_content[0].row).toMatchObject({
      _uuid: 'block-id',
    })
    expect(
      transformed.blocks.documents_blocks_content[0].arrays.documents_blocks_content_items[0],
    ).toMatchObject({
      row: { _uuid: 'item-id', settings_label: 'Shared label' },
      locales: { en: { translations_label: 'English' }, fr: { translations_label: 'French' } },
    })
  })
})
