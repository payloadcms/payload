import type { CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { lexicalViewsNestedSlug } from '../../slugs.js'
import { lexicalNestedBlocks } from './blocks.js'

/**
 * Collection to test that nested richtext fields keep their ViewSelector
 * when parent richtext has NO views configured.
 *
 * Structure:
 * - Parent richtext: lexicalEditor() with NO views
 * - Block inside parent: contains richtext WITH views
 *
 * Expected: Block's richtext should show ViewSelector (not inherited, parent has nothing to pass down).
 */
export const LexicalViewsNested: CollectionConfig = {
  slug: lexicalViewsNestedSlug,
  fields: [
    {
      name: 'parentRichText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: lexicalNestedBlocks,
          }),
        ],
        // NO views configured on parent
      }),
    },
  ],
  labels: {
    plural: 'Lexical Views Nested',
    singular: 'Lexical Views Nested',
  },
}
