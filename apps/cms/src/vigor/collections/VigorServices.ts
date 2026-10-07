import type { CollectionConfig } from 'payload'

import { publishedOrLoggedIn } from '../../access/publishedOrLoggedIn'
import { bodyField, imageField, slugField, sortOrderField } from '../fields'
import { revalidateVigorAfterChange, revalidateVigorAfterDelete } from '../revalidate'

/** Service pages of the Vigor website (/topics/<slug>), shown as tiles on the home page */
export const VigorServices: CollectionConfig = {
  slug: 'vigor-services',
  access: {
    read: publishedOrLoggedIn,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'sortOrder', '_status'],
    group: 'Vigor website',
    listSearchableFields: ['title', 'slug'],
    useAsTitle: 'title',
  },
  defaultSort: 'sortOrder',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      required: true,
    },
    bodyField,
    imageField(),
    slugField({ from: 'title' }),
    sortOrderField,
  ],
  hooks: {
    afterChange: [revalidateVigorAfterChange],
    afterDelete: [revalidateVigorAfterDelete],
  },
  labels: {
    plural: 'Service pages',
    singular: 'Service page',
  },
  versions: {
    drafts: true,
  },
}
