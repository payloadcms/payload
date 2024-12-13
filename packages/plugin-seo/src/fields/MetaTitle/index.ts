import type { RichTextField, TextField } from 'payload'
import { BlocksFeature, FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { SEOFeature } from './SEOFeature/index.js'

interface FieldFunctionProps {
  /**
   * Tell the component if the generate function is available as configured in the plugin config
   */
  hasGenerateFn?: boolean
  overrides?: Partial<TextField>
}

type FieldFunction = ({ hasGenerateFn, overrides }: FieldFunctionProps) => RichTextField

export const MetaTitleField: FieldFunction = ({ hasGenerateFn = false, overrides }) => {
  return {
    name: 'title',
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
              fields: [],
              admin: {
                components: {
                  Block: '@payloadcms/plugin-seo/client#InlineBlockComponent',
                },
              },
            },
            {
              slug: 'Collection Name',
              fields: [],
              admin: {
                components: {
                  Block: '@payloadcms/plugin-seo/client#InlineBlockComponent',
                },
              },
            },
            {
              slug: 'City',
              fields: [],
              admin: {
                components: {
                  Block: '@payloadcms/plugin-seo/client#InlineBlockComponent',
                },
              },
            },
            {
              slug: 'Florist Name',
              fields: [],
              admin: {
                components: {
                  Block: '@payloadcms/plugin-seo/client#InlineBlockComponent',
                },
              },
            },
          ],
        }),
      ],
    }),
    admin: {
      components: {},
    },
    localized: true,
    ...((overrides as unknown as RichTextField) ?? {}),
  }
}
