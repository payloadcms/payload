import type { CollectionConfig } from 'payload'

import { publishedOrLoggedIn } from '../../access/publishedOrLoggedIn'
import { revalidateWebsiteCollection } from '../../hooks/revalidateWebsite'
import { iconField, normalizeTags, personalWebsiteGroup, richTextField, seoField } from '../fields'

const revalidate = revalidateWebsiteCollection()

/**
 * Projects of the personal website: cards on /projects and a page each at /projects/<slug>. The
 * website reads published projects anonymously from `GET /api/personal-projects`; drafts stay
 * private.
 */
export const PersonalProjects: CollectionConfig = {
  slug: 'personal-projects',
  access: {
    read: publishedOrLoggedIn,
  },
  admin: {
    defaultColumns: ['title', 'date', '_status', 'updatedAt'],
    group: personalWebsiteGroup,
    listSearchableFields: ['title', 'slug'],
    useAsTitle: 'title',
  },
  defaultPopulate: {
    // What a document that links to this project receives (the website only needs the slug)
    slug: true,
    title: true,
  },
  defaultSort: '-date',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'One or two sentences shown on the projects page and in search results.',
      },
      required: true,
    },
    {
      name: 'images',
      type: 'upload',
      admin: {
        description:
          'The first image is shown on the projects page. All images appear in the gallery at the top of the project.',
      },
      hasMany: true,
      relationTo: 'media',
    },
    {
      name: 'overlay',
      type: 'upload',
      admin: {
        description:
          'Optional. Shown over the right side of the first image on the projects page, e.g. a phone screenshot.',
      },
      relationTo: 'media',
    },
    iconField({
      name: 'logo',
      description:
        'Optional SVG logo above the title on the projects page. The website colors it to match the theme.',
    }),
    {
      name: 'attributes',
      type: 'array',
      admin: {
        description:
          'Shown on the projects page and at the top of the project, e.g. Duration: 2 years, Role: Developer.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              admin: {
                description: 'e.g. Role',
              },
              required: true,
            },
            {
              name: 'value',
              type: 'text',
              admin: {
                description: 'e.g. Inventor, Programmer, Designer',
              },
              required: true,
            },
          ],
        },
      ],
      label: 'Facts',
      labels: {
        plural: 'Facts',
        singular: 'Fact',
      },
    },
    richTextField({ name: 'content', required: true }),
    {
      name: 'slug',
      type: 'slug',
      admin: {
        description: 'The project is published at /projects/<slug>.',
      },
      useAsSlug: 'title',
    },
    {
      name: 'date',
      type: 'date',
      admin: {
        date: {
          displayFormat: 'd MMM yyyy',
          pickerAppearance: 'dayOnly',
        },
        description: 'Shown on the project, e.g. when it launched. Projects are sorted by it.',
        position: 'sidebar',
      },
      required: true,
    },
    {
      name: 'tags',
      type: 'text',
      admin: {
        description: 'Technologies, e.g. swift, ble. Shown as tags.',
        position: 'sidebar',
      },
      hasMany: true,
      hooks: {
        beforeChange: [normalizeTags],
      },
    },
    seoField,
  ],
  hooks: {
    afterChange: [revalidate.afterChange],
    afterDelete: [revalidate.afterDelete],
    beforeChange: [revalidate.beforeChange],
  },
  labels: {
    plural: 'Projects',
    singular: 'Project',
  },
  versions: {
    drafts: true,
  },
}
