import { CollectionConfig } from '../../src/collections/config/types';
import { buildConfigWithDefaults } from '../buildConfigWithDefaults';

export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'number',
      type: 'number',
      localized: true,
    },
    {
      name: 'myArray',
      type: 'array',
      fields: [
        {
          name: 'subField',
          type: 'text',
          localized: true,
        },
        {
          name: 'mySubArray',
          type: 'array',
          fields: [
            {
              name: 'subSubField',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      name: 'myBlocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'block1',
          fields: [
            {
              name: 'nonLocalizedText',
              type: 'text',
            },
            {
              name: 'localizedText',
              type: 'text',
              localized: true,
            },
          ],
        },
        {
          slug: 'block2',
          fields: [
            {
              name: 'number',
              type: 'number',
            },
          ],
        },
      ],
    },
    // Has One
    {
      name: 'relationHasOne',
      type: 'relationship',
      relationTo: 'pages',
    },
    // Has Many
    {
      name: 'relationHasMany',
      type: 'relationship',
      hasMany: true,
      relationTo: 'pages',
    },
    // Has One - Polymorphic
    {
      name: 'relationHasOnePoly',
      type: 'relationship',
      relationTo: ['people', 'pages'],
    },
    // Has Many - Polymorphic
    {
      name: 'relationHasManyPoly',
      type: 'relationship',
      hasMany: true,
      relationTo: ['people', 'pages'],
    },
    {
      name: 'selfReferencingRelationship',
      type: 'relationship',
      relationTo: 'posts',
    },
    {
      name: 'myGroup',
      type: 'group',
      fields: [
        {
          name: 'subField',
          type: 'text',
        },
        {
          name: 'subFieldLocalized',
          type: 'text',
          localized: true,
        },
        {
          name: 'subGroup',
          type: 'group',
          fields: [
            {
              name: 'subSubField',
              type: 'text',
            },
            {
              name: 'subSubFieldLocalized',
              type: 'text',
              localized: true,
            },
          ],
        },
        {
          name: 'groupArray',
          type: 'array',
          fields: [
            {
              name: 'groupArrayText',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
};

const config = buildConfigWithDefaults({
  collections: [
    Posts,
    {
      slug: 'pages',
      fields: [
        {
          name: 'slug',
          type: 'text',
        },
      ],
    },
    {
      slug: 'people',
      fields: [
        {
          name: 'fullName',
          type: 'text',
        },
      ],
    },
  ],
  localization: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
  },
});

export default config;
