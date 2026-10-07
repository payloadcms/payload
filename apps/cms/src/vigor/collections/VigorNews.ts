import type { CollectionConfig } from 'payload'

import { publishedOrLoggedIn } from '../../access/publishedOrLoggedIn'
import { bodyField, dayField, imageField, slugField } from '../fields'
import { newsCategories } from '../options'
import { revalidateVigorAfterChange, revalidateVigorAfterDelete } from '../revalidate'

/** The Vigor website's newsroom: /news and an article page at /news/<slug> */
export const VigorNews: CollectionConfig = {
  slug: 'vigor-news',
  access: {
    read: publishedOrLoggedIn,
  },
  admin: {
    defaultColumns: ['title', 'date', 'category', '_status'],
    group: 'Vigor website',
    listSearchableFields: ['title', 'slug'],
    useAsTitle: 'title',
  },
  // Latest first
  defaultSort: '-date',
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
    dayField({ sidebar: true }),
    {
      name: 'category',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      options: newsCategories,
      required: true,
    },
  ],
  hooks: {
    afterChange: [revalidateVigorAfterChange],
    afterDelete: [revalidateVigorAfterDelete],
  },
  labels: {
    plural: 'News',
    singular: 'News article',
  },
  typescript: {
    interface: 'VigorNewsArticle',
  },
  versions: {
    drafts: true,
  },
}
