import type { LocalizedPost } from './payload-types'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import { englishLocale } from '../globals/config'
import { ArrayCollection } from './collections/Array'
import { NestedToArrayAndBlock } from './collections/NestedToArrayAndBlock'
import { RestrictedByLocaleCollection } from './collections/RestrictedByLocale'
import {
  blocksWithLocalizedSameName,
  defaultLocale,
  englishTitle,
  hungarianLocale,
  localizedPostsSlug,
  localizedSortSlug,
  portugueseLocale,
  relationEnglishTitle,
  relationEnglishTitle2,
  relationSpanishTitle,
  relationSpanishTitle2,
  relationshipLocalizedSlug,
  spanishLocale,
  spanishTitle,
  withLocalizedRelSlug,
  withRequiredLocalizedFields,
} from './shared'

export type LocalizedPostAllLocale = LocalizedPost & {
  title: {
    en?: string
    es?: string
  }
}

const openAccess = {
  create: () => true,
  delete: () => true,
  read: () => true,
  update: () => true,
}

export default buildConfigWithDefaults({
  collections: [
    {
      auth: true,
      fields: [
        {
          name: 'relation',
          relationTo: localizedPostsSlug,
          type: 'relationship',
        },
        {
          name: 'assignedLocales',
          type: 'select',
          hasMany: true,
          options: [defaultLocale, spanishLocale, portugueseLocale, 'ar'],
        },
        {
          type: 'select',
          name: 'roles',
          options: ['admin', 'editor'],
          defaultValue: 'admin',
        },
      ],
      slug: 'users',
    },
    {
      slug: localizedPostsSlug,
      access: openAccess,
      admin: {
        useAsTitle: 'title',
      },
      fields: [
        {
          name: 'title',
          index: true,
          localized: true,
          type: 'text',
        },
        {
          name: 'description',
          type: 'text',
        },
        {
          name: 'localizedDescription',
          localized: true,
          type: 'text',
        },
        {
          name: 'localizedCheckbox',
          localized: true,
          type: 'checkbox',
        },
        {
          name: 'children',
          hasMany: true,
          relationTo: localizedPostsSlug,
          type: 'relationship',
        },
        {
          name: 'group',
          fields: [
            {
              name: 'children',
              type: 'text',
            },
          ],
          type: 'group',
        },
      ],
    },
    ArrayCollection,
    {
      fields: [
        {
          name: 'title',
          localized: true,
          required: true,
          type: 'text',
        },
        {
          name: 'layout',
          blocks: [
            {
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
              ],
              slug: 'text',
            },
            {
              fields: [
                {
                  name: 'number',
                  type: 'number',
                },
              ],
              slug: 'number',
            },
          ],
          localized: true,
          required: true,
          type: 'blocks',
        },
      ],
      slug: withRequiredLocalizedFields,
    },
    {
      access: openAccess,
      fields: [
        // Relationship
        {
          name: 'localizedRelationship',
          relationTo: localizedPostsSlug,
          type: 'relationship',
        },
        // Relation hasMany
        {
          name: 'localizedRelationHasManyField',
          hasMany: true,
          relationTo: localizedPostsSlug,
          type: 'relationship',
        },
        // Relation multiple relationTo
        {
          name: 'localizedRelationMultiRelationTo',
          relationTo: [localizedPostsSlug, 'dummy'],
          type: 'relationship',
        },
        // Relation multiple relationTo hasMany
        {
          name: 'localizedRelationMultiRelationToHasMany',
          hasMany: true,
          relationTo: [localizedPostsSlug, 'dummy'],
          type: 'relationship',
        },
      ],
      slug: withLocalizedRelSlug,
    },
    {
      fields: [
        {
          name: 'relationship',
          localized: true,
          relationTo: localizedPostsSlug,
          type: 'relationship',
        },
        {
          name: 'relationshipHasMany',
          hasMany: true,
          localized: true,
          relationTo: localizedPostsSlug,
          type: 'relationship',
        },
        {
          name: 'relationMultiRelationTo',
          localized: true,
          relationTo: [localizedPostsSlug, 'dummy'],
          type: 'relationship',
        },
        {
          name: 'relationMultiRelationToHasMany',
          hasMany: true,
          localized: true,
          relationTo: [localizedPostsSlug, 'dummy'],
          type: 'relationship',
        },
        {
          name: 'arrayField',
          fields: [
            {
              name: 'nestedRelation',
              label: 'Nested Relation',
              relationTo: localizedPostsSlug,
              type: 'relationship',
            },
          ],
          label: 'Array Field',
          localized: true,
          type: 'array',
        },
      ],
      slug: relationshipLocalizedSlug,
    },
    {
      access: openAccess,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      slug: 'dummy',
    },
    NestedToArrayAndBlock,
    {
      slug: localizedSortSlug,
      access: openAccess,
      fields: [
        {
          name: 'title',
          index: true,
          localized: true,
          type: 'text',
        },
        {
          name: 'date',
          type: 'date',
          localized: true,
        },
      ],
    },
    {
      slug: blocksWithLocalizedSameName,
      fields: [
        {
          type: 'blocks',
          name: 'blocks',
          blocks: [
            {
              slug: 'block_first',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  localized: true,
                },
              ],
            },
            {
              slug: 'block_second',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  localized: true,
                },
              ],
            },
          ],
        },
      ],
    },
    RestrictedByLocaleCollection,
  ],
  globals: [
    {
      fields: [
        {
          name: 'array',
          fields: [
            {
              name: 'text',
              localized: true,
              type: 'text',
            },
          ],
          type: 'array',
        },
      ],
      slug: 'global-array',
    },
  ],
  localization: {
    defaultLocale,
    fallback: true,
    locales: [
      {
        code: defaultLocale,
        label: 'English',
        rtl: false,
      },
      {
        code: spanishLocale,
        label: 'Spanish',
        rtl: false,
      },
      {
        code: portugueseLocale,
        fallbackLocale: spanishLocale,
        label: 'Portuguese',
      },
      {
        code: 'ar',
        label: 'Arabic',
        rtl: true,
      },
      {
        code: hungarianLocale,
        label: 'Hungarian',
        rtl: false,
      },
    ],
  },
  onInit: async (payload) => {
    const collection = localizedPostsSlug

    await payload.create({
      collection,
      data: {
        title: englishTitle,
      },
    })

    const localizedPost = await payload.create({
      collection,
      data: {
        title: englishTitle,
      },
    })

    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
        relation: localizedPost.id,
        assignedLocales: [englishLocale, spanishLocale],
      },
    })

    await payload.update({
      id: localizedPost.id,
      collection,
      data: {
        title: spanishTitle,
      },
      locale: spanishLocale,
    })

    const localizedRelation = await payload.create({
      collection,
      data: {
        title: relationEnglishTitle,
      },
    })

    await payload.update({
      id: localizedPost.id,
      collection,
      data: {
        title: relationSpanishTitle,
      },
      locale: spanishLocale,
    })

    const localizedRelation2 = await payload.create({
      collection,
      data: {
        title: relationEnglishTitle2,
      },
    })

    await payload.update({
      id: localizedPost.id,
      collection,
      data: {
        title: relationSpanishTitle2,
      },
      locale: spanishLocale,
    })

    await payload.create({
      collection: withLocalizedRelSlug,
      data: {
        localizedRelationHasManyField: [localizedRelation.id, localizedRelation2.id],
        localizedRelationMultiRelationTo: { relationTo: collection, value: localizedRelation.id },
        localizedRelationMultiRelationToHasMany: [
          { relationTo: localizedPostsSlug, value: localizedRelation.id },
          { relationTo: localizedPostsSlug, value: localizedRelation2.id },
        ],
        relationship: localizedRelation.id,
      },
    })
    await payload.create({
      collection: relationshipLocalizedSlug,
      data: {
        arrayField: [
          {
            nestedRelation: localizedRelation.id,
          },
        ],
        relationMultiRelationTo: { relationTo: collection, value: localizedRelation.id },
        relationMultiRelationToHasMany: [
          { relationTo: localizedPostsSlug, value: localizedRelation.id },
          { relationTo: localizedPostsSlug, value: localizedRelation2.id },
        ],
        relationship: localizedRelation.id,
        relationshipHasMany: [localizedRelation.id, localizedRelation2.id],
      },
      locale: 'en',
    })

    const globalArray = await payload.updateGlobal({
      data: {
        array: [
          {
            text: 'test en 1',
          },
          {
            text: 'test en 2',
          },
        ],
      },
      slug: 'global-array',
    })

    await payload.updateGlobal({
      data: {
        array: globalArray.array.map((row, i) => ({
          ...row,
          text: `test es ${i + 1}`,
        })),
      },
      locale: 'es',
      slug: 'global-array',
    })
  },
})
