import type { CollectionConfig } from 'payload'

import { hiddenFields } from '../fields.js'
import { allHiddenSlug, hiddenFieldsSlug } from '../shared.js'

export const HiddenFields: CollectionConfig = {
  slug: hiddenFieldsSlug,
  access: { create: () => true, read: () => true, update: () => true },
  fields: hiddenFields,
  versions: false,
  graphQL: { singularName: 'HiddenFields' },
}

export const AllHidden: CollectionConfig = {
  slug: allHiddenSlug,
  authorship: false,
  access: { create: () => true, read: () => true, update: () => true },
  fields: [{ name: 'secret', type: 'text', hidden: true, defaultValue: 'internal' }],
  graphQL: { singularName: 'AllHidden' },
  timestamps: false,
  versions: false,
}
