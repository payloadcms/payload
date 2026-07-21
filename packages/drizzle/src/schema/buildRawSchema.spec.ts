import type { Block, Config, SanitizedConfig } from 'payload'
import { sanitizeConfig } from 'payload'
import { describe, expect, it } from 'vitest'

import { setColumnID } from '../postgres/schema/setColumnID.js'
import type { DrizzleAdapter } from '../types.js'
import { buildRawSchema } from './buildRawSchema.js'

const headlineBlock: Block = {
  slug: 'headline',
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}

const createContainerBlock = (slug: string): Block => ({
  slug,
  fields: [
    {
      name: 'content',
      type: 'blocks',
      blockReferences: ['headline'],
      blocks: [],
    },
  ],
})

const createAdapter = (config: SanitizedConfig): DrizzleAdapter =>
  ({
    blocksAsJSON: false,
    fieldConstraints: {},
    idType: 'serial',
    localesSuffix: '_locales',
    payload: {
      blocks: Object.fromEntries(config.blocks.map((block) => [block.slug, block])),
      collections: Object.fromEntries(
        config.collections.map((collection) => [
          collection.slug,
          {
            config: collection,
            customIDType: undefined,
          },
        ]),
      ),
      config,
    },
    rawRelations: {},
    rawTables: {},
    tableNameMap: new Map(),
    versionsSuffix: '_versions',
  }) as unknown as DrizzleAdapter

describe('buildRawSchema', () => {
  it('should not create duplicate suffixed block tables for identical reused blocks under localized ancestors', async () => {
    const layoutBlocks = [createContainerBlock('container'), createContainerBlock('container50')]

    const config = await sanitizeConfig({
      blocks: [headlineBlock],
      collections: [
        {
          slug: 'pages',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              localized: true,
              blocks: layoutBlocks,
            },
          ],
          timestamps: false,
        },
        {
          slug: 'posts',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              localized: true,
              blocks: layoutBlocks,
            },
          ],
          timestamps: false,
        },
      ],
      localization: {
        defaultLocale: 'en',
        locales: ['en', 'de'],
      },
    } as Config)

    const adapter = createAdapter(config)

    buildRawSchema({
      adapter,
      setColumnID,
    })

    expect(adapter.rawTables.pages_blocks_headline).toBeDefined()
    expect(adapter.rawTables.pages_blocks_headline.columns._locale).toBeDefined()
    expect(adapter.rawTables.pages_blocks_headline_2).toBeUndefined()
    expect(adapter.rawTables.pages_blocks_headline_2_locales).toBeUndefined()
    expect(adapter.rawTables.posts_blocks_headline).toBeDefined()
    expect(adapter.rawTables.posts_blocks_headline.columns._locale).toBeDefined()
    expect(adapter.rawTables.posts_blocks_headline_2).toBeUndefined()
    expect(adapter.rawTables.posts_blocks_headline_2_locales).toBeUndefined()
  })
})
