import type { RichTextField, TextareaField } from 'payload'

import { BlocksFeature, FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { SEOFeature } from '../MetaTitle/SEOFeature/index.js'

interface FieldFunctionProps {
  /**
   * Tell the component if the generate function is available as configured in the plugin config
   */
  hasGenerateFn?: boolean
  overrides?: Partial<RichTextField>
}

type FieldFunction = ({ hasGenerateFn, overrides }: FieldFunctionProps) => RichTextField

export const MetaDescriptionField: FieldFunction = ({ hasGenerateFn = false, overrides }) => {
  return {
    name: 'description',
    type: 'richText',
    editor: lexicalEditor({
      admin: {
        hideGutter: true,
      },
      features: [
        SEOFeature(),
        FixedToolbarFeature(),
        BlocksFeature({
          inlineBlocks: [
            {
              slug: 'Product Name',
              admin: {
                components: {
                  Block: '@payloadcms/plugin-seo/client#InlineBlockComponent',
                },
              },
              fields: [],
            },
            {
              slug: 'Collection Name',
              admin: {
                components: {
                  Block: '@payloadcms/plugin-seo/client#InlineBlockComponent',
                },
              },
              fields: [],
            },
            {
              slug: 'City',
              admin: {
                components: {
                  Block: '@payloadcms/plugin-seo/client#InlineBlockComponent',
                },
              },
              fields: [],
            },
            {
              slug: 'Florist Name',
              admin: {
                components: {
                  Block: '@payloadcms/plugin-seo/client#InlineBlockComponent',
                },
              },
              fields: [],
            },
          ],
        }),
      ],
    }),
    localized: true,
    ...((overrides as unknown as RichTextField) ?? {}),
  }
}
