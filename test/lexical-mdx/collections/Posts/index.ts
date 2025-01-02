import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  lexicalEditor,
  TreeViewFeature,
} from '@payloadcms/richtext-lexical'

import { loadMDXAfterRead, saveMDXBeforeChange } from '../../mdx/hooks.js'
import { BannerBlock } from '../../mdx/jsxBlocks/banner.js'
import { CodeBlock } from '../../mdx/jsxBlocks/code/code.js'
import { InlineCodeBlock } from '../../mdx/jsxBlocks/inlineCode.js'
import { PackageInstallOptions } from '../../mdx/jsxBlocks/packageInstallOptions.js'
import { RestExamplesBlock } from '../../mdx/jsxBlocks/restExamples/index.js'
import { TextContainerBlock } from '../../mdx/jsxBlocks/TextContainer.js'
import { TextContainerNoTrimBlock } from '../../mdx/jsxBlocks/TextContainerNoTrim.js'

export const postsSlug = 'posts'

export const PostsCollection: CollectionConfig = {
  slug: postsSlug,
  admin: {
    useAsTitle: 'docPath',
  },
  hooks: {
    beforeChange: [saveMDXBeforeChange],
    afterRead: [loadMDXAfterRead],
  },
  fields: [
    {
      name: 'docPath',
      type: 'text',
      required: true,
    },
    {
      type: 'collapsible',
      label: 'FrontMatter',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'frontMatter',
          type: 'array',
          fields: [
            {
              type: 'text',
              name: 'key',
            },
            {
              type: 'text',
              name: 'value',
            },
          ],
        },
      ],
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          TreeViewFeature(),
          EXPERIMENTAL_TableFeature(),
          FixedToolbarFeature(),
          BlocksFeature({
            blocks: [
              BannerBlock,
              CodeBlock,
              PackageInstallOptions,
              TextContainerNoTrimBlock,
              TextContainerBlock,
              RestExamplesBlock,
            ],
            inlineBlocks: [InlineCodeBlock],
          }),
        ],
      }),
    },
    {
      name: 'richTextUnconverted',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          TreeViewFeature(),
          EXPERIMENTAL_TableFeature(),
          FixedToolbarFeature(),
          BlocksFeature({
            blocks: [
              BannerBlock,
              CodeBlock,
              PackageInstallOptions,
              TextContainerNoTrimBlock,
              TextContainerBlock,
              RestExamplesBlock,
            ],
            inlineBlocks: [InlineCodeBlock],
          }),
        ],
      }),
    },
  ],
  versions: {
    drafts: true,
  },
}
