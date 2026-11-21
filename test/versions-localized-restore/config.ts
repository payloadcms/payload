import type { Field } from 'payload'

import { lexicalEditor, ParagraphFeature } from '@payloadcms/richtext-lexical'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import {
  restoreLocalizedGroupSlug,
  restoreLocalizedTabSlug,
  restoreRequiredContainersSlug,
  restoreRichTextSlug,
} from './slugs.js'

const requiredTitle: Field = { name: 'title', type: 'text', required: true }

export default buildConfigWithDefaults({
  collections: [
    {
      slug: restoreLocalizedGroupSlug,
      fields: [
        {
          name: 'content',
          type: 'group',
          fields: [
            { name: 'enabled', type: 'checkbox', defaultValue: true },
            {
              ...requiredTitle,
              admin: { condition: (_, siblingData) => siblingData.enabled !== false },
              minLength: 3,
            },
          ],
          localized: true,
        },
        {
          name: 'sections',
          type: 'blocks',
          blocks: [
            {
              slug: 'conditional-section',
              fields: [
                { name: 'enabled', type: 'checkbox', defaultValue: true },
                {
                  name: 'caption',
                  type: 'text',
                  admin: {
                    condition: (data, siblingData, { blockData, operation, path }) =>
                      !(
                        data.id !== undefined &&
                        data.content?.enabled === false &&
                        siblingData.enabled === false &&
                        blockData?.enabled === false &&
                        operation === 'update' &&
                        path.join('.') === 'sections.1.caption'
                      ),
                  },
                  localized: true,
                  minLength: 3,
                  required: true,
                },
              ],
            },
          ],
        },
      ],
      versions: true,
    },
    {
      slug: restoreLocalizedTabSlug,
      fields: [
        {
          type: 'tabs',
          tabs: [{ name: 'content', fields: [{ ...requiredTitle }], localized: true }],
        },
      ],
      versions: true,
    },
    {
      slug: restoreRequiredContainersSlug,
      fields: [
        { ...requiredTitle, localized: true },
        {
          name: 'items',
          type: 'array',
          fields: [{ name: 'text', type: 'text' }],
          localized: true,
          required: true,
        },
        {
          name: 'sections',
          type: 'blocks',
          blocks: [{ slug: 'section', fields: [{ name: 'text', type: 'text' }] }],
          localized: true,
          required: true,
        },
      ],
      versions: { drafts: {} },
    },
    {
      slug: restoreRichTextSlug,
      fields: [
        {
          name: 'body',
          type: 'richText',
          editor: lexicalEditor({ features: [ParagraphFeature()] }),
          localized: true,
          required: true,
        },
      ],
      versions: { drafts: {} },
    },
  ],
  localization: { defaultLocale: 'en', locales: ['en', 'de'] },
})
