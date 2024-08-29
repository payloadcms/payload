import type { ServerEditorConfig } from '@payloadcms/richtext-lexical'
import type { SerializedEditorState } from 'lexical'
import type { CollectionConfig } from 'payload'

import { createHeadlessEditor } from '@lexical/headless'
import { $convertToMarkdownString } from '@lexical/markdown'
import {
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  LinkFeature,
  TreeViewFeature,
  UploadFeature,
  defaultEditorFeatures,
  getEnabledNodes,
  lexicalEditor,
  sanitizeServerEditorConfig,
} from '@payloadcms/richtext-lexical'

import { lexicalFieldsSlug } from '../../slugs.js'
import {
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
      ],
      inlineBlocks: [
        {
          slug: 'myInlineBlock',
          admin: {
            components: {
              Label: '/collections/Lexical/LabelComponent.js#LabelComponent',
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
              headlessEditor.setEditorState(headlessEditor.parseEditorState(yourEditorState))
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
