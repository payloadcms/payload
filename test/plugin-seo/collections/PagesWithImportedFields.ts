import type { CollectionConfig } from 'payload'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

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
    OverviewField({
      titlePath: 'metaAndSEO.title',
      descriptionPath: 'metaAndSEO.innerMeta.description',
      imagePath: 'metaAndSEO.innerMedia.image',
    }),
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
            MetaTitleField({
              hasGenerateFn: true,
              overrides: {
                required: true,
              },
            }),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'metaAndSEO.title',
              descriptionPath: 'metaAndSEO.innerMeta.description',
            }),
            {
              type: 'group',
              name: 'innerMeta',
              fields: [
                MetaDescriptionField({
                  hasGenerateFn: true,
                }),
              ],
            },
            {
              type: 'group',
              name: 'innerMedia',
              fields: [
                MetaImageField({
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
