import type { ServerEditorConfig } from '@payloadcms/richtext-lexical'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { Block, BlockSlug, CollectionConfig, PayloadComponent } from 'payload'

import {
  BlocksFeature,
  defaultEditorFeatures,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  getEnabledNodes,
  HeadingFeature,
  lexicalEditor,
  LinkFeature,
  sanitizeServerEditorConfig,
  TreeViewFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
import { createHeadlessEditor } from '@payloadcms/richtext-lexical/lexical/headless'
import { $convertToMarkdownString } from '@payloadcms/richtext-lexical/lexical/markdown'

import { lexicalFieldsSlug } from '../../slugs.js'
import {
  AsyncHooksBlock,
  CodeBlock,
  ConditionalLayoutBlock,
  FilterOptionsBlock,
  RadioButtonsBlock,
  RelationshipBlock,
  RelationshipHasManyBlock,
  RichTextBlock,
  SelectFieldBlock,
  SubBlockBlock,
  TabBlock,
  TextBlock,
  UploadAndRichTextBlock,
  ValidationBlock,
} from './blocks.js'
import { ModifyInlineBlockFeature } from './ModifyInlineBlockFeature/feature.server.js'

export const lexicalBlocks: (Block | BlockSlug)[] = [
  ValidationBlock,
  FilterOptionsBlock,
  AsyncHooksBlock,
  RichTextBlock,
  TextBlock,
  UploadAndRichTextBlock,
  SelectFieldBlock,
  RelationshipBlock,
  RelationshipHasManyBlock,
  SubBlockBlock,
  RadioButtonsBlock,
  ConditionalLayoutBlock,
  TabBlock,
  CodeBlock,
  {
    slug: 'myBlock',
    admin: {
      components: {},
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
  {
    slug: 'myBlockWithLabel',
    admin: {
      components: {
        Label: '/collections/Lexical/blockComponents/LabelComponent.js#LabelComponent',
      },
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
  {
    slug: 'myBlockWithBlock',
    admin: {
      components: {
        Block: '/collections/Lexical/blockComponents/BlockComponent.js#BlockComponent',
      },
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
  {
    slug: 'BlockRSC',

    admin: {
      components: {
        Block: '/collections/Lexical/blockComponents/BlockComponentRSC.js#BlockComponentRSC',
      },
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
  {
    slug: 'myBlockWithBlockAndLabel',
    admin: {
      components: {
        Block: '/collections/Lexical/blockComponents/BlockComponent.js#BlockComponent',
        Label: '/collections/Lexical/blockComponents/LabelComponent.js#LabelComponent',
      },
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
]

export const lexicalInlineBlocks: (Block | BlockSlug)[] = [
  {
    slug: 'AvatarGroup',
    interfaceName: 'AvatarGroupBlock',
    fields: [
      {
        name: 'avatars',
        type: 'array',
        minRows: 1,
        maxRows: 6,
        fields: [
          {
            name: 'image',
            type: 'upload',
            relationTo: 'uploads',
          },
        ],
      },
    ],
  },
  {
    slug: 'myInlineBlock',
    admin: {
      components: {},
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
  {
    slug: 'myInlineBlockWithLabel',
    admin: {
      components: {
        Label: '/collections/Lexical/inlineBlockComponents/LabelComponent.js#LabelComponent',
      },
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
  {
    slug: 'myInlineBlockWithBlock',
    admin: {
      components: {
        Block: '/collections/Lexical/inlineBlockComponents/BlockComponent.js#BlockComponent',
      },
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
  {
    slug: 'myInlineBlockWithBlockAndLabel',
    admin: {
      components: {
        Block: '/collections/Lexical/inlineBlockComponents/BlockComponent.js#BlockComponent',
        Label: '/collections/Lexical/inlineBlockComponents/LabelComponent.js#LabelComponent',
      },
    },
    fields: [
      {
        name: 'key',
        label: () => {
          return 'Key'
        },
        type: 'select',
        options: ['value1', 'value2', 'value3'],
      },
    ],
  },
]

export const lexicalWrapperBlocks: Array<{
  block: Block | BlockSlug
  createDOM: PayloadComponent
}> = [
  {
    block: {
      slug: 'wrapperBlock',
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    createDOM: './collections/Lexical/wrapperBlocks/createDOM.js#wrapperBlockCreateDOM',
  },
  {
    block: {
      slug: 'wrapperBlockCustomLabel',
      admin: {
        components: {
          Label: '/collections/Lexical/wrapperBlocks/LabelComponent.js#NameLabelComponent',
        },
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    createDOM: './collections/Lexical/wrapperBlocks/createDOM.js#wrapperBlockCreateDOM',
  },
  {
    block: {
      slug: 'wrapperBlockCustomBlock',
      admin: {
        components: {
          Block: '/collections/Lexical/wrapperBlocks/BlockComponent.js#BlockComponent',
        },
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    createDOM: './collections/Lexical/wrapperBlocks/createDOM.js#wrapperBlockCreateDOM',
  },
  {
    block: {
      slug: 'wrapperBlockCustomBlockAndLabel',
      admin: {
        components: {
          Block: '/collections/Lexical/wrapperBlocks/BlockComponent.js#BlockComponent',
          Label: '/collections/Lexical/wrapperBlocks/LabelComponent.js#NameLabelComponent',
        },
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    createDOM: './collections/Lexical/wrapperBlocks/createDOM.js#wrapperBlockCreateDOM',
  },
  {
    block: {
      slug: 'wrapperBlockColor',
      admin: {
        components: {
          Label: '/collections/Lexical/wrapperBlocks/ColorLabelComponent.js#ColorLabelComponent',
        },
      },
      fields: [
        {
          name: 'color',
          type: 'text',
        },
      ],
    },
    createDOM: './collections/Lexical/wrapperBlocks/createDOM.js#wrapperBlockColorCreateDOM',
  },
]

export const getLexicalFieldsCollection: (args: {
  blocks: (Block | BlockSlug)[]
  inlineBlocks: (Block | BlockSlug)[]
  wrapperBlocks: Array<{
    block: Block | BlockSlug
    createDOM: PayloadComponent
  }>
}) => CollectionConfig = ({ blocks, inlineBlocks, wrapperBlocks }) => {
  const editorConfig: ServerEditorConfig = {
    features: [
      ...defaultEditorFeatures,
      //TestRecorderFeature(),
      TreeViewFeature(),
      //HTMLConverterFeature(),
      FixedToolbarFeature(),
      LinkFeature({
        fields: ({ defaultFields }) => [
          ...defaultFields,
          {
            name: 'rel',
            type: 'select',
            admin: {
              description:
                'The rel attribute defines the relationship between a linked resource and the current document. This is a custom link field.',
            },
            hasMany: true,
            label: 'Rel Attribute',
            options: ['noopener', 'noreferrer', 'nofollow'],
          },
        ],
      }),
      UploadFeature({
        collections: {
          uploads: {
            fields: [
              {
                name: 'caption',
                type: 'richText',
                editor: lexicalEditor(),
              },
            ],
          },
        },
      }),
      ModifyInlineBlockFeature(),
      BlocksFeature({
        blocks,
        inlineBlocks,
        wrapperBlocks,
      }),
      EXPERIMENTAL_TableFeature(),
    ],
  }
  return {
    slug: lexicalFieldsSlug,
    access: {
      read: () => true,
    },
    admin: {
      listSearchableFields: ['title', 'richTextLexicalCustomFields'],
      useAsTitle: 'title',
    },
    fields: [
      {
        name: 'title',
        type: 'text',
        required: true,
      },
      {
        name: 'lexicalRootEditor',
        type: 'richText',
      },
      {
        name: 'lexicalSimple',
        type: 'richText',
        editor: lexicalEditor({
          features: ({ defaultFeatures }) => [
            //TestRecorderFeature(),
            TreeViewFeature(),
            BlocksFeature({
              blocks: [
                RichTextBlock,
                TextBlock,
                UploadAndRichTextBlock,
                SelectFieldBlock,
                RelationshipBlock,
                RelationshipHasManyBlock,
                SubBlockBlock,
                RadioButtonsBlock,
                ConditionalLayoutBlock,
              ],
            }),
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h4'] }),
          ],
        }),
      },
      {
        type: 'ui',
        name: 'clearLexicalState',
        admin: {
          components: {
            Field: {
              path: '/collections/Lexical/components/ClearState.js#ClearState',
              clientProps: {
                fieldName: 'lexicalSimple',
              },
            },
          },
        },
      },
      {
        name: 'lexicalWithBlocks',
        type: 'richText',
        editor: lexicalEditor({
          admin: {
            hideGutter: false,
          },
          features: editorConfig.features,
        }),
        required: true,
      },
      //{
      //  name: 'rendered',
      //  type: 'ui',
      //  admin: {
      //    components: {
      //      Field: './collections/Lexical/LexicalRendered.js#LexicalRendered',
      //    },
      //  },
      //},
      {
        name: 'lexicalWithBlocks_markdown',
        type: 'textarea',
        hooks: {
          afterRead: [
            async ({ req, siblingData }) => {
              const yourSanitizedEditorConfig = await sanitizeServerEditorConfig(
                editorConfig,
                req.payload.config,
              )

              const headlessEditor = createHeadlessEditor({
                nodes: getEnabledNodes({
                  editorConfig: yourSanitizedEditorConfig,
                }),
              })

              const yourEditorState: SerializedEditorState = siblingData.lexicalWithBlocks
              try {
                headlessEditor.update(
                  () => {
                    headlessEditor.setEditorState(headlessEditor.parseEditorState(yourEditorState))
                  },
                  { discrete: true },
                )
              } catch (e) {
                /* empty */
              }

              // Export to markdown
              let markdown: string = ''
              headlessEditor.getEditorState().read(() => {
                markdown = $convertToMarkdownString(
                  yourSanitizedEditorConfig?.features?.markdownTransformers,
                )
              })
              return markdown
            },
          ],
        },
      },
    ],
  }
}
