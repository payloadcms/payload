import type { CollectionConfig } from 'payload'

import { MetaDescription, MetaImage, MetaTitle } from '@payloadcms/plugin-seo'

import { pagesWithImportedFieldsSlug } from '../shared.js'

export const PagesWithImportedFields: CollectionConfig = {
  slug: pagesWithImportedFieldsSlug,
  labels: {
    singular: 'Page with imported fields',
    plural: 'Pages with imported fields',
  },
  admin: {
    useAsTitle: 'title',
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            {
              name: 'excerpt',
              label: 'Excerpt',
              type: 'text',
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              // NOTE: in order for position: 'sidebar' to work here,
              // the first field of this config must be of type `tabs`,
              // and this field must be a sibling of it
              // See `./Posts` or the `../../README.md` for more info
              admin: {
                position: 'sidebar',
              },
            },
          ],
        },
        {
          label: 'Meta',
          name: 'metaAndSEO',
          fields: [
            MetaTitle({
              hasGenerateFn: true,
            }),
            {
              type: 'group',
              name: 'innerMeta',
              fields: [
                MetaDescription({
                  hasGenerateFn: true,
                }),
              ],
            },
            {
              type: 'group',
              name: 'innerMedia',
              fields: [
                MetaImage({
                  relationTo: 'media',
                  hasGenerateFn: true,
                }),
              ],
            },
          ],
        },
      ],
    },
  ],
}
