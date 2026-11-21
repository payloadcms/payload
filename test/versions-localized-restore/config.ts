import type { Field } from 'payload'

import { lexicalEditor, ParagraphFeature } from '@payloadcms/richtext-lexical'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import {
  restoreConditionalGroupSlug,
  restoreLocalizedArrayRowsSlug,
  restoreLocalizedGroupSlug,
  restoreLocalizedTabSlug,
  restorePointConditionSlug,
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
          tabs: [
            {
              name: 'content',
              fields: [
                {
                  ...requiredTitle,
                  hooks: {
                    afterRead: [
                      ({ context, req, value }) => {
                        if (Array.isArray(context.restoreReadLocales)) {
                          context.restoreReadLocales.push({ locale: req.locale, value })
                        }
                      },
                    ],
                  },
                },
              ],
              localized: true,
            },
          ],
        },
      ],
      versions: true,
    },
    {
      slug: restoreConditionalGroupSlug,
      fields: [
        { name: 'heading', type: 'text', localized: true, required: true },
        {
          name: 'content',
          type: 'group',
          fields: [
            {
              type: 'tabs',
              tabs: [
                {
                  name: 'details',
                  fields: [
                    { name: 'enabled', type: 'checkbox' },
                    {
                      name: 'advanced',
                      type: 'group',
                      admin: {
                        condition: (_, siblingData, { path }) =>
                          siblingData.enabled !== false ||
                          path.join('.') !== 'content.details.advanced',
                      },
                      fields: [requiredTitle],
                    },
                  ],
                },
              ],
            },
          ],
          localized: true,
        },
      ],
      versions: true,
    },
    {
      slug: restoreLocalizedArrayRowsSlug,
      fields: [
        {
          name: 'content',
          type: 'group',
          fields: [
            {
              name: 'rows',
              type: 'array',
              fields: [
                { name: 'enabled', type: 'checkbox', defaultValue: true },
                {
                  ...requiredTitle,
                  admin: { condition: (_, siblingData) => siblingData.enabled !== false },
                  minLength: 3,
                },
              ],
            },
          ],
          localized: true,
        },
      ],
      versions: true,
    },
    {
      slug: restorePointConditionSlug,
      fields: [
        { name: 'origin', type: 'point' },
        {
          ...requiredTitle,
          admin: { condition: (data) => data.origin?.[0] > 0 },
          localized: true,
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
