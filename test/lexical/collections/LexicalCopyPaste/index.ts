import type { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import type { Block, BlockSlug, CollectionConfig, RichTextField } from 'payload'

import {
  BlocksFeature,
  buildDefaultEditorState,
  buildEditorState,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { lexicalCopyPasteSlug } from '../../slugs.js'
import { NestedBlock } from '../LexicalNestedBlocks/index.js'

export const LexicalCopyPaste: CollectionConfig = {
  slug: lexicalCopyPasteSlug,
  fields: [
    getSourceField({
      name: 'sourceBlock',
      block: {
        slug: 'copyPasteBlock',
        fields: [{ name: 'text', type: 'text' }],
      },
    }),
    getSourceField({
      name: 'sourceReference',
      block: NestedBlock.slug as BlockSlug,
    }),
    {
      name: 'target',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [{ slug: 'allowedBlock', fields: [{ name: 'text', type: 'text' }] }],
          }),
        ],
      }),
    },
  ],
}

function getSourceField({
  name,
  block,
}: {
  block: Block | BlockSlug
  name: string
}): RichTextField {
  return {
    name,
    type: 'richText',
    defaultValue: buildEditorState<DefaultNodeTypes | SerializedBlockNode>({
      text: 'Before block',
      nodes: [
        {
          type: 'block',
          version: 2,
          format: '',
          fields: {
            id: '507f1f77bcf86cd799439011',
            blockType: typeof block === 'string' ? block : block.slug,
            text: 'Copied block content',
          },
        },
        ...buildDefaultEditorState({ text: 'After block' }).root.children,
      ],
    }),
    editor: lexicalEditor({
      features: ({ defaultFeatures }) => [...defaultFeatures, BlocksFeature({ blocks: [block] })],
    }),
  }
}
