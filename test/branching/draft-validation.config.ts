import type { Field } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

export const draftValidationSlug = 'draft-validation'
export const strictDraftValidationSlug = 'strict-draft-validation'
export const strictDraftValidationGlobalSlug = 'strict-draft-validation-global'
export const draftValidationGlobalSlug = 'draft-validation-global'

const fields: Field[] = [
  { name: 'title', type: 'text', localized: true, required: true },
  { name: 'content', type: 'richText', localized: true, required: true },
  { name: 'slug', type: 'slug', useAsSlug: 'title' },
  {
    name: 'metadata',
    type: 'json',
    localized: true,
    jsonSchema: {
      fileMatch: ['draft-merge-metadata.json'],
      schema: {
        type: 'object',
        properties: { label: { type: 'string' } },
        required: ['label'],
      },
      uri: 'payload://draft-merge-metadata.json',
    },
  },
  {
    name: 'details',
    type: 'group',
    fields: [{ name: 'label', type: 'text', required: true }],
  },
  {
    name: 'items',
    type: 'array',
    fields: [{ name: 'label', type: 'text', required: true }],
  },
  {
    name: 'layout',
    type: 'blocks',
    blocks: [{ slug: 'text', fields: [{ name: 'label', type: 'text', required: true }] }],
  },
]

export default buildConfigWithDefaults({
  config: {
    branching: true,
    typescript: { autoGenerate: false },
    collections: [
      { slug: draftValidationSlug, fields, versions: { drafts: true } },
      {
        slug: strictDraftValidationSlug,
        fields: [{ name: 'title', type: 'text', required: true }],
        versions: { drafts: { validate: true } },
      },
    ],
    globals: [
      { slug: draftValidationGlobalSlug, fields, versions: { drafts: true } },
      {
        slug: strictDraftValidationGlobalSlug,
        fields: [{ name: 'title', type: 'text', required: true }],
        versions: { drafts: { validate: true } },
      },
    ],
    localization: { defaultLocale: 'en', locales: ['en', 'fr', 'de'] },
  },
  suite: 'branching',
})
