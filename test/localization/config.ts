import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import type { CollectionConfig } from 'payload'

import type { LocalizedPost } from './payload-types.js'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { AllFieldsLocalized } from './collections/AllFields/index.js'
import { ArrayCollection } from './collections/Array/index.js'
import { ArrayWithFallbackCollection } from './collections/ArrayWithFallback/index.js'
import { BlocksCollection } from './collections/Blocks/index.js'
import { Group } from './collections/Group/index.js'
import { LocalizedDateFields } from './collections/LocalizedDateFields/index.js'
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
  globalWithDraftsSlug,
  hungarianLocale,
  localeRestrictedSlug,
  localizedDateFieldsSlug,
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
  suite: 'localization',
  config: {
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
      LocalizedDateFields,
      AllFieldsLocalized,
      {
        slug: 'users',
        admin: {
          listSearchableFields: 'name',
        },
        auth: true,
        fields: [
          {
            name: 'name',
            type: 'text',
            label: { en: 'Full name' },
          },
          {
            name: 'relation',
            type: 'relationship',
            relationTo: localizedPostsSlug,
          },
        ],
        versions: false,
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
            type: 'text',
            index: true,
            label: { en: 'Full title' },
            localized: true,
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'localizedDescription',
            type: 'text',
            localized: true,
          },
          {
            name: 'localizedCheckbox',
            type: 'checkbox',
            localized: true,
          },
          {
            name: 'children',
            type: 'relationship',
            hasMany: true,
            relationTo: localizedPostsSlug,
          },
          {
            name: 'group',
            type: 'group',
            fields: [
              {
                name: 'children',
                type: 'text',
              },
            ],
          },
          {
            name: 'unique',
            type: 'text',
            localized: true,
            unique: true,
          },
        ],
        versions: false,
      },
      NoLocalizedFieldsCollection,
      ArrayCollection,
      {
        slug: withRequiredLocalizedFields,
        fields: [
          {
            name: 'title',
            type: 'text',
            localized: true,
            required: true,
          },
          {
            type: 'tabs',
            tabs: [
              {
                fields: [
                  {
                    name: 'seoTitle',
                    type: 'text',
                    localized: true,
                    unique: true,
                  },
                ],
                label: 'SEO',
              },
              {
                fields: [
                  {
                    name: 'nav',
                    type: 'group',
                    fields: [
                      {
                        name: 'layout',
                        type: 'blocks',
                        blocks: [
                          {
                            slug: 'text',
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
                          },
                          {
                            slug: 'number',
                            fields: [
                              {
                                name: 'number',
                                type: 'number',
                              },
                            ],
                          },
                        ],
                        localized: true,
                        required: true,
                      },
                    ],
                  },
                ],
                label: 'Main Nav',
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
                    localized: true,
                  },
                ],
              },
            ],
          },
        ],
        versions: false,
      },
      {
        slug: withLocalizedRelSlug,
        access: openAccess,
        fields: [
          // Relationship
          {
            name: 'localizedRelationship',
            type: 'relationship',
            relationTo: localizedPostsSlug,
          },
          // Relation hasMany
          {
            name: 'localizedRelationHasManyField',
            type: 'relationship',
            hasMany: true,
            relationTo: localizedPostsSlug,
          },
          // Relation multiple relationTo
          {
            name: 'localizedRelationMultiRelationTo',
            type: 'relationship',
            relationTo: [localizedPostsSlug, cannotCreateDefaultLocale],
          },
          // Relation multiple relationTo hasMany
          {
            name: 'localizedRelationMultiRelationToHasMany',
            type: 'relationship',
            hasMany: true,
            relationTo: [localizedPostsSlug, cannotCreateDefaultLocale],
          },
        ],
        versions: false,
      },
      {
        slug: relationshipLocalizedSlug,
        fields: [
          {
            name: 'relationship',
            type: 'relationship',
            localized: true,
            relationTo: localizedPostsSlug,
          },
          {
            name: 'relationshipHasMany',
            type: 'relationship',
            hasMany: true,
            localized: true,
            relationTo: localizedPostsSlug,
          },
          {
            name: 'relationMultiRelationTo',
            type: 'relationship',
            localized: true,
            relationTo: [localizedPostsSlug, cannotCreateDefaultLocale],
          },
          {
            name: 'relationMultiRelationToHasMany',
            type: 'relationship',
            hasMany: true,
            localized: true,
            relationTo: [localizedPostsSlug, cannotCreateDefaultLocale],
          },
          {
            name: 'arrayField',
            type: 'array',
            fields: [
              {
                name: 'nestedRelation',
                type: 'relationship',
                label: 'Nested Relation',
                relationTo: localizedPostsSlug,
              },
            ],
            label: 'Array Field',
            localized: true,
          },
        ],
        versions: false,
      },
      {
        slug: cannotCreateDefaultLocale,
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
        versions: false,
      },
      {
        slug: localeRestrictedSlug,
        access: {
          ...openAccess,
          update: ({ req }) => req.locale === spanishLocale,
        },
        fields: [
          {
            name: 'title',
            type: 'text',
            localized: true,
          },
        ],
        versions: false,
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
            type: 'text',
            index: true,
            localized: true,
          },
          {
            name: 'date',
            type: 'date',
            localized: true,
          },
        ],
        versions: false,
      },
      {
        slug: blocksWithLocalizedSameName,
        fields: [
          {
            name: 'blocks',
            type: 'blocks',
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
        versions: false,
      },
      LocalizedWithinLocalized,
      ArrayWithFallbackCollection,
    ],
    globals: [
      {
        slug: 'global-array',
        fields: [
          {
            name: 'array',
            type: 'array',
            fields: [
              {
                name: 'text',
                type: 'text',
                localized: true,
              },
            ],
          },
        ],
        versions: false,
      },
      {
        slug: 'global-text',
        fields: [
          {
            name: 'text',
            type: 'text',
            localized: true,
          },
        ],
        versions: false,
      },
      {
        slug: globalWithDraftsSlug,
        fields: [
          {
            name: 'text',
            type: 'text',
            localized: true,
          },
        ],
        versions: {
          drafts: {},
        },
      },
    ],
    localization: {
      defaultLocale,
      fallback: true,
      filterAvailableLocales: ({ locales }) => {
        return locales.filter((locale) => locale.code !== 'xx')
      },
      locales: [
        {
          code: 'xx',
          label: 'FILTERED',
        },
        {
          code: defaultLocale,
          label: {
            de: 'Englisch',
            en: 'English',
            es: 'Inglés',
          },
          rtl: false,
        },
        {
          code: spanishLocale,
          label: {
            de: 'Spanisch',
            en: 'Spanish',
            es: 'Español',
          },
          rtl: false,
        },
        {
          code: portugueseLocale,
          fallbackLocale: spanishLocale,
          label: {
            de: 'Portugiesisch',
            en: 'Portuguese',
            es: 'Portugués',
          },
        },
        {
          code: 'ar',
          label: {
            de: 'Arabisch',
            en: 'Arabic',
            es: 'Árabe',
          },
          rtl: true,
        },
        {
          code: hungarianLocale,
          label: {
            de: 'Ungarische',
            en: 'Hungarian',
            es: 'Húngaro',
          },
          rtl: false,
        },
      ],
    },
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: async (payload) => {
    // On a fresh database with autoIndex enabled, the first write to a collection (or its
    // versions collection) kicks off async index builds. A subsequent seeding write can then
    // race that catalog change and fail with a transient MongoDB "catalog changes" error.
    // Awaiting Model.init() lets collection and index creation settle before the writes below.
    // This is a no-op for non-Mongoose adapters, where these models are undefined.
    const db = payload.db as any
    if (db?.collections || db?.versions) {
      await Promise.all([
        ...payload.config.collections.map((coll) => db.collections?.[coll.slug]?.init?.()),
        ...payload.config.collections.map((coll) => db.versions?.[coll.slug]?.init?.()),
        db.globals?.init?.(),
      ])
    }

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
      collection: localizedDateFieldsSlug,
      data: {
        date: new Date().toISOString(),
        localizedDate: new Date().toISOString(),
      },
    })

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
      id: relationshipLocalized.id,
      collection: relationshipLocalizedSlug,
      data: {
        relationMultiRelationTo: { relationTo: collection, value: localizedPost.id },
      },
      locale: 'es',
    })

    const globalArray = await payload.updateGlobal({
      slug: 'global-array',
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
    })

    await payload.updateGlobal({
      slug: 'global-array',
      data: {
        array: globalArray.array.map((row, i) => ({
          ...row,
          text: `test es ${i + 1}`,
        })),
      },
      locale: 'es',
    })
  },
})
