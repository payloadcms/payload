import type { Field } from 'payload'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

export const draftValidationSlug = 'draft-validation'
export const strictDraftValidationSlug = 'strict-draft-validation'
export const draftValidationGlobalSlug = 'draft-validation-global'

const fields: Field[] = [
  { name: 'title', type: 'text', localized: true, required: true },
  { name: 'content', type: 'richText', localized: true, required: true },
  { name: 'slug', type: 'slug', localized: true, useAsSlug: 'title' },
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
    globals: [{ slug: draftValidationGlobalSlug, fields, versions: { drafts: true } }],
    localization: { defaultLocale: 'en', locales: ['en', 'fr', 'de'] },
  },
  suite: 'branching',
})
