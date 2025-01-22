import type { ServerEditorConfig } from '@payloadcms/richtext-lexical'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { CollectionConfig } from 'payload'

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
  CodeBlock,
  ConditionalLayoutBlock,
  RadioButtonsBlock,
  RelationshipBlock,
  RelationshipHasManyBlock,
  RichTextBlock,
  SelectFieldBlock,
  SubBlockBlock,
  TabBlock,
  TextBlock,
  UploadAndRichTextBlock,
} from './blocks.js'
import { ModifyInlineBlockFeature } from './ModifyInlineBlockFeature/feature.server.js'

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
      ],
      inlineBlocks: [
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
      ],
    }),
    EXPERIMENTAL_TableFeature(),
  ],
}

export const LexicalFields: CollectionConfig = {
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
          async ({ data, req, siblingData }) => {
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
            let markdown: string
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
