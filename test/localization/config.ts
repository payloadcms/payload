import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import type { CollectionConfig } from 'payload'

import type { LocalizedPost } from './payload-types.js'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { ArrayCollection } from './collections/Array/index.js'
import { BlocksCollection } from './collections/Blocks/index.js'
import { Group } from './collections/Group/index.js'
import { LocalizedDrafts } from './collections/LocalizedDrafts/index.js'
import { LocalizedWithinLocalized } from './collections/LocalizedWithinLocalized/index.js'
import { NestedArray } from './collections/NestedArray/index.js'
import { NestedFields } from './collections/NestedFields/index.js'
import { NestedToArrayAndBlock } from './collections/NestedToArrayAndBlock/index.js'
import { NoLocalizedFieldsCollection } from './collections/NoLocalizedFields/index.js'
import { RichTextCollection } from './collections/RichText/index.js'
import { Tab } from './collections/Tab/index.js'
import {
  blocksWithLocalizedSameName,
  cannotCreateDefaultLocale,
  defaultLocale,
  englishTitle,
  hungarianLocale,
  localizedPostsSlug,
  localizedSortSlug,
  portugueseLocale,
  relationEnglishTitle,
  relationEnglishTitle2,
  relationshipLocalizedSlug,
  relationSpanishTitle,
  relationSpanishTitle2,
  spanishLocale,
  spanishTitle,
  withLocalizedRelSlug,
  withRequiredLocalizedFields,
} from './shared.js'
export type LocalizedPostAllLocale = {
  title: {
    en?: string
    es?: string
  }
} & LocalizedPost

const openAccess: CollectionConfig['access'] = {
  create: () => true,
  delete: () => true,
  read: () => true,
  update: () => true,
}

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    RichTextCollection,
    BlocksCollection,
    NestedArray,
    NestedFields,
    LocalizedDrafts,
    {
      admin: {
        listSearchableFields: 'name',
      },
      auth: true,
      fields: [
        {
          name: 'name',
          label: { en: 'Full name' },
          type: 'text',
        },
        {
          name: 'relation',
          relationTo: localizedPostsSlug,
          type: 'relationship',
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
          label: { en: 'Full title' },
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
        {
          name: 'unique',
          type: 'text',
          localized: true,
          unique: true,
        },
      ],
    },
    NoLocalizedFieldsCollection,
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
          type: 'tabs',
          tabs: [
            {
              label: 'Main Nav',
              fields: [
                {
                  name: 'nav',
                  type: 'group',
                  fields: [
                    {
                      name: 'layout',
                      blocks: [
                        {
                          fields: [
                            {
                              name: 'text',
                              type: 'text',
                            },
                            {
                              name: 'nestedArray',
                              type: 'array',
                              fields: [
                                {
                                  name: 'text',
                                  type: 'text',
                                },
                                {
                                  name: 'l2',
                                  type: 'array',
                                  fields: [
                                    {
                                      name: 'l3',
                                      type: 'array',
                                      fields: [
                                        {
                                          name: 'l4',
                                          type: 'array',
                                          fields: [
                                            {
                                              name: 'superNestedText',
                                              type: 'text',
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
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
                },
              ],
            },
            {
              name: 'myTab',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
                {
                  name: 'group',
                  type: 'group',
                  localized: true,
                  fields: [
                    {
                      name: 'nestedArray2',
                      type: 'array',
                      fields: [
                        {
                          name: 'nestedText',
                          type: 'text',
                        },
                      ],
                    },
                    {
                      name: 'nestedText',
                      type: 'text',
                    },
                  ],
                },
              ],
            },
          ],
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
          relationTo: [localizedPostsSlug, cannotCreateDefaultLocale],
          type: 'relationship',
        },
        // Relation multiple relationTo hasMany
        {
          name: 'localizedRelationMultiRelationToHasMany',
          hasMany: true,
          relationTo: [localizedPostsSlug, cannotCreateDefaultLocale],
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
          relationTo: [localizedPostsSlug, cannotCreateDefaultLocale],
          type: 'relationship',
        },
        {
          name: 'relationMultiRelationToHasMany',
          hasMany: true,
          localized: true,
          relationTo: [localizedPostsSlug, cannotCreateDefaultLocale],
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
      access: {
        ...openAccess,
        create: ({ req }) => req.locale !== defaultLocale,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      slug: cannotCreateDefaultLocale,
    },
    NestedToArrayAndBlock,
    Group,
    Tab,
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
    LocalizedWithinLocalized,
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
    {
      fields: [
        {
          name: 'text',
          localized: true,
          type: 'text',
        },
      ],
      slug: 'global-text',
    },
  ],
  localization: {
    filterAvailableLocales: ({ locales }) => {
      return locales.filter((locale) => locale.code !== 'xx')
    },
    defaultLocale,
    fallback: true,
    locales: [
      {
        code: 'xx',
        label: 'FILTERED',
      },
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

    console.log('SEED 1')

    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
        relation: localizedPost.id,
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

    console.log('SEED 2')

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

    console.log('SEED 3')

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

    console.log('SEED 4')

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
    const relationshipLocalized = await payload.create({
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

    await payload.update({
      collection: relationshipLocalizedSlug,
      id: relationshipLocalized.id,
      data: {
        relationMultiRelationTo: { relationTo: collection, value: localizedPost.id },
      },
      locale: 'es',
    })

    console.log('SEED 5')

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

    console.log('SEED COMPLETE')
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
