import type { Block, RichTextField, SanitizedConfig } from 'payload'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { buildConfig } from 'payload'
import { expect, it } from 'vitest'

import { lexicalEditor, type LexicalRichTextAdapter } from './index.js'
import { BlocksFeature } from './features/blocks/server/index.js'

it('finishes shared block sanitization before another editor captures its fields', async () => {
  const shared: Block = {
    slug: 'shared',
    fields: [
      ...Array.from({ length: 30 }, (_, i) => ({ name: `text${i}`, type: 'text' as const })),
      { name: 'items', type: 'array', fields: [{ name: 'value', type: 'text' }] },
    ],
  }
  const editor = () => lexicalEditor({ features: [BlocksFeature({ blocks: [shared] })] })
  const config = (await buildConfig({
    secret: 'shared-block-test',
    db: mongooseAdapter({ url: 'mongodb://127.0.0.1:1/shared-block-test' }),
    collections: [
      {
        slug: 'pages',
        fields: [
          { name: 'one', type: 'richText', editor: editor() },
          { name: 'two', type: 'richText', editor: editor() },
        ],
      },
    ],
  })) as SanitizedConfig

  const collection = config.collections.find(({ slug }) => slug === 'pages')!
  for (const name of ['one', 'two']) {
    const field = collection.fields?.find(
      (field) => 'name' in field && field.name === name,
    ) as RichTextField
    const adapter = field.editor as LexicalRichTextAdapter
    const blocks = adapter.editorConfig.resolvedFeatureMap.get('blocks')!
    const node = blocks.nodes!.find((node) => node.node.getType() === 'block')!
    const fields = node.getSubFields!({ node: { fields: { blockType: 'shared' } } } as never)
    const array = fields?.find((field) => 'name' in field && field.name === 'items')
    expect(array && 'validate' in array ? array.validate : undefined).toBeTypeOf('function')
  }
})
