import type { Config, TextField } from 'payload'

import { randomUUID } from 'crypto'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { seed } from './seed.js'
import {
  customIDsSlug,
  customSchemaSlug,
  defaultValuesSlug,
  errorOnUnnamedFieldsSlug,
  fakeCustomIDsSlug,
  fieldsPersistanceSlug,
  pgMigrationSlug,
  placesSlug,
  postsSlug,
  relationASlug,
  relationBSlug,
  relationshipsMigrationSlug,
} from './shared.js'

const defaultValueField: TextField = {
  name: 'defaultValue',
  type: 'text',
  defaultValue: 'default value from database',
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const getConfig: () => Partial<Config> = () => ({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: 'noTimeStamps',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
      timestamps: false,
      versions: false,
    },
    {
      slug: 'categories',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'simple',
          type: 'relationship',
          relationTo: 'simple',
        },
        {
          type: 'tabs',
          tabs: [
            {
              name: 'hideout',
              fields: [
                {
                  type: 'tabs',
                  label: 'Cameras',
                  tabs: [
                    {
                      name: 'camera1',
                      fields: [
                        {
                          type: 'row',
                          fields: [
                            {
                              name: 'time1Image',
                              type: 'relationship',
                              relationTo: 'posts',
                              unique: true,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                  unique: true,
                },
              ],
            },
          ],
        },
      ],
      versions: { drafts: true },
    },
    {
      slug: 'simple',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'number',
          type: 'number',
        },
      ],
      versions: false,
    },
    {
      slug: 'simple-localized',
      fields: [
        {
          name: 'text',
          type: 'text',
          localized: true,
        },
        {
          name: 'number',
          type: 'number',
        },
      ],
      versions: false,
    },
    {
      slug: 'categories-custom-id',
      fields: [
        {
          name: 'id',
          type: 'number',
        },
      ],
      versions: { drafts: true },
    },
    {
      slug: postsSlug,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          // access: { read: () => false },
        },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
        },
        {
          name: 'categoryID',
          type: 'json',
          virtual: 'category.id',
        },
        {
          name: 'categoryTitle',
          type: 'text',
          virtual: 'category.title',
        },
        {
          name: 'categorySimpleText',
          type: 'text',
          virtual: 'category.simple.text',
        },
        {
          name: 'categories',
          type: 'relationship',
          hasMany: true,
          relationTo: 'categories',
        },
        {
          name: 'categoriesCustomID',
          type: 'relationship',
          hasMany: true,
          relationTo: 'categories-custom-id',
        },
        {
          name: 'categoryPoly',
          type: 'relationship',
          relationTo: ['categories'],
        },
        {
          name: 'categoryPolyMany',
          type: 'relationship',
          hasMany: true,
          relationTo: ['categories'],
        },
        {
          name: 'categoryCustomID',
          type: 'relationship',
          relationTo: 'categories-custom-id',
        },
        {
          name: 'polymorphicRelations',
          type: 'relationship',
          hasMany: true,
          relationTo: ['categories', 'simple'],
        },
        {
          name: 'localizedPolymorphicRelations',
          type: 'relationship',
          hasMany: true,
          localized: true,
          relationTo: ['categories', 'simple'],
        },
        {
          name: 'localized',
          type: 'text',
          localized: true,
        },
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'number',
          type: 'number',
        },
        {
          name: 'numberDefault',
          type: 'number',
          defaultValue: 1,
        },
        {
          name: 'numbersHasMany',
          type: 'number',
          hasMany: true,
        },
        {
          name: 'publishDate',
          type: 'date',
        },
        {
          name: 'blocks',
          type: 'blocks',
          blocks: [
            {
              slug: 'block-third',
              fields: [
                {
                  name: 'nested',
                  type: 'blocks',
                  blocks: [
                    {
                      slug: 'block-fourth',
                      fields: [
                        {
                          name: 'nested',
                          type: 'blocks',
                          blocks: [],
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
          name: 'testNestedGroup',
          type: 'group',
          fields: [
            {
              name: 'nestedLocalizedPolymorphicRelation',
              type: 'relationship',
              hasMany: true,
              localized: true,
              relationTo: ['categories', 'simple'],
            },
            {
              name: 'nestedLocalizedText',
              type: 'text',
              localized: true,
            },
            {
              name: 'nestedText1',
              type: 'text',
            },
            {
              name: 'nestedText2',
              type: 'text',
            },
          ],
        },
        {
          type: 'tabs',
          tabs: [
            {
              name: 'D1',
              fields: [
                {
                  name: 'D2',
                  type: 'group',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          type: 'collapsible',
                          fields: [
                            {
                              type: 'tabs',
                              tabs: [
                                {
                                  fields: [
                                    {
                                      name: 'D3',
                                      type: 'group',
                                      fields: [
                                        {
                                          type: 'row',
                                          fields: [
                                            {
                                              type: 'collapsible',
                                              fields: [
                                                {
                                                  name: 'D4',
                                                  type: 'text',
                                                },
                                              ],
                                              label: 'Collapsible2',
                                            },
                                          ],
                                        },
                                      ],
                                    },
                                  ],
                                  label: 'Tab1',
                                },
                              ],
                            },
                          ],
                          label: 'Collapsible2',
                        },
                      ],
                    },
                  ],
                },
              ],
              label: 'Tab1',
            },
          ],
        },
        {
          name: 'hasTransaction',
          type: 'checkbox',
          admin: {
            readOnly: true,
          },
          hooks: {
            beforeChange: [({ req }) => !!req.transactionID],
          },
        },
        {
          name: 'throwAfterChange',
          type: 'checkbox',
          defaultValue: false,
          hooks: {
            afterChange: [
              ({ value }) => {
                if (value) {
                  throw new Error('throw after change')
                }
              },
            ],
          },
        },
        {
          name: 'arrayWithIDs',
          type: 'array',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
            {
              name: 'textLocalized',
              type: 'text',
              localized: true,
            },
          ],
        },
        {
          name: 'arrayWithIDsLocalized',
          type: 'array',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
          localized: true,
        },
        {
          name: 'blocksWithIDs',
          type: 'blocks',
          blocks: [
            {
              slug: 'block-first',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          name: 'group',
          type: 'group',
          fields: [{ name: 'text', type: 'text' }],
        },
        {
          type: 'tabs',
          tabs: [
            {
              name: 'tab',
              fields: [{ name: 'text', type: 'text' }],
            },
          ],
        },
      ],
      hooks: {
        beforeOperation: [
          ({ args, operation, req }) => {
            if (operation === 'update') {
              const defaultIDType = req.payload.db.defaultIDType

              if (defaultIDType === 'number' && typeof args.id === 'string') {
                throw new Error('ID was not sanitized to a number properly')
              }
            }

            return args
          },
        ],
      },
      versions: false,
    },
    {
      slug: errorOnUnnamedFieldsSlug,
      fields: [
        {
          type: 'tabs',
          tabs: [
            {
              fields: [
                {
                  name: 'groupWithinUnnamedTab',
                  type: 'group',
                  fields: [
                    {
                      name: 'text',
                      type: 'text',
                      required: true,
                    },
                  ],
                },
              ],
              label: 'UnnamedTab',
            },
          ],
        },
      ],
      versions: false,
    },
    {
      slug: defaultValuesSlug,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        defaultValueField,
        {
          name: 'array',
          type: 'array',
          // default array with one object to test subfield defaultValue properties for Mongoose
          defaultValue: [{}],
          fields: [defaultValueField],
        },
        {
          name: 'group',
          type: 'group',
          // we need to have to use as default in order to have subfield defaultValue properties directly for Mongoose
          defaultValue: {},
          fields: [defaultValueField],
        },
        {
          name: 'select',
          type: 'select',
          defaultValue: 'default',
          options: [
            { label: 'Option 0', value: 'option0' },
            { label: 'Option 1', value: 'option1' },
            { label: 'Default', value: 'default' },
          ],
        },
        {
          name: 'point',
          type: 'point',
          defaultValue: [10, 20],
        },
        {
          name: 'escape',
          type: 'text',
          defaultValue: "Thanks, we're excited for you to join us.",
        },
      ],
      versions: false,
    },
    {
      slug: relationASlug,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'richText',
          type: 'richText',
        },
      ],
      labels: {
        plural: 'Relation As',
        singular: 'Relation A',
      },
      versions: false,
    },
    {
      slug: relationBSlug,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'relationship',
          type: 'relationship',
          relationTo: 'relation-a',
        },
        {
          name: 'richText',
          type: 'richText',
        },
      ],
      labels: {
        plural: 'Relation Bs',
        singular: 'Relation B',
      },
      versions: false,
    },
    {
      slug: pgMigrationSlug,
      fields: [
        {
          name: 'relation1',
          type: 'relationship',
          relationTo: 'relation-a',
        },
        {
          name: 'myArray',
          type: 'array',
          fields: [
            {
              name: 'relation2',
              type: 'relationship',
              relationTo: 'relation-b',
            },
            {
              name: 'mySubArray',
              type: 'array',
              fields: [
                {
                  name: 'relation3',
                  type: 'relationship',
                  localized: true,
                  relationTo: 'relation-b',
                },
              ],
            },
          ],
        },
        {
          name: 'myGroup',
          type: 'group',
          fields: [
            {
              name: 'relation4',
              type: 'relationship',
              localized: true,
              relationTo: 'relation-b',
            },
          ],
        },
        {
          name: 'myBlocks',
          type: 'blocks',
          blocks: [
            {
              slug: 'myBlock',
              fields: [
                {
                  name: 'relation5',
                  type: 'relationship',
                  relationTo: 'relation-a',
                },
                {
                  name: 'relation6',
                  type: 'relationship',
                  localized: true,
                  relationTo: 'relation-b',
                },
              ],
            },
          ],
        },
      ],
      versions: true,
    },
    {
      slug: customSchemaSlug,
      dbName: 'customs',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'localizedText',
          type: 'text',
          localized: true,
        },
        {
          name: 'relationship',
          type: 'relationship',
          hasMany: true,
          relationTo: 'relation-a',
        },
        {
          name: 'select',
          type: 'select',
          dbName: ({ tableName }) => `${tableName}_customSelect`,
          enumName: 'selectEnum',
          hasMany: true,
          options: ['a', 'b', 'c'],
        },
        {
          name: 'radio',
          type: 'select',
          enumName: 'radioEnum',
          options: ['a', 'b', 'c'],
        },
        {
          name: 'array',
          type: 'array',
          dbName: 'customArrays',
          fields: [
            {
              name: 'text',
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
          name: 'blocks',
          type: 'blocks',
          blocks: [
            {
              slug: 'block-second',
              dbName: 'customBlocks',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
                {
                  name: 'localizedText',
                  type: 'text',
                  localized: true,
                },
              ],
            },
          ],
        },
      ],
      versions: {
        drafts: true,
      },
    },
    {
      slug: placesSlug,
      fields: [
        {
          name: 'country',
          type: 'text',
        },
        {
          name: 'city',
          type: 'text',
        },
      ],
      versions: false,
    },
    {
      slug: 'virtual-relations',
      access: { read: () => true },
      admin: { useAsTitle: 'postTitle' },
      fields: [
        {
          name: 'postTitle',
          type: 'text',
          virtual: 'post.title',
        },
        {
          name: 'postsTitles',
          type: 'text',
          virtual: 'posts.title',
        },
        {
          name: 'postCategoriesTitles',
          type: 'text',
          virtual: 'post.categories.title',
        },
        {
          name: 'postTitleHidden',
          type: 'text',
          hidden: true,
          virtual: 'post.title',
        },
        {
          name: 'postCategoryTitle',
          type: 'text',
          virtual: 'post.category.title',
        },
        {
          name: 'postCategoryID',
          type: 'json',
          virtual: 'post.category.id',
        },
        {
          name: 'postCategoryCustomID',
          type: 'number',
          virtual: 'post.categoryCustomID.id',
        },
        {
          name: 'postID',
          type: 'json',
          virtual: 'post.id',
        },
        {
          name: 'postLocalized',
          type: 'text',
          virtual: 'post.localized',
        },
        {
          name: 'post',
          type: 'relationship',
          relationTo: 'posts',
        },
        {
          name: 'posts',
          type: 'relationship',
          hasMany: true,
          relationTo: 'posts',
        },
        {
          name: 'customID',
          type: 'relationship',
          relationTo: 'custom-ids',
        },
        {
          name: 'customIDValue',
          type: 'text',
          virtual: 'customID.id',
        },
      ],
      versions: { drafts: true },
    },
    {
      slug: fieldsPersistanceSlug,
      fields: [
        {
          name: 'text',
          type: 'text',
          virtual: true,
        },
        {
          name: 'textHooked',
          type: 'text',
          hooks: { afterRead: [() => 'hooked'] },
          virtual: true,
        },
        {
          name: 'array',
          type: 'array',
          fields: [],
          virtual: true,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'textWithinRow',
              type: 'text',
              virtual: true,
            },
          ],
        },
        {
          type: 'collapsible',
          fields: [
            {
              name: 'textWithinCollapsible',
              type: 'text',
              virtual: true,
            },
          ],
          label: 'Colllapsible',
        },
        {
          type: 'tabs',
          tabs: [
            {
              fields: [
                {
                  name: 'textWithinTabs',
                  type: 'text',
                  virtual: true,
                },
              ],
              label: 'tab',
            },
          ],
        },
        {
          name: 'blockWithVirtual',
          type: 'blocks',
          blocks: [
            {
              slug: 'blockWithVirtual',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
                {
                  name: 'virtualField',
                  type: 'text',
                  virtual: true,
                },
              ],
            },
          ],
        },
      ],
      versions: false,
    },
    {
      slug: customIDsSlug,
      fields: [
        {
          name: 'id',
          type: 'text',
          admin: {
            readOnly: true,
          },
          hooks: {
            beforeChange: [
              ({ operation, value }) => {
                if (operation === 'create') {
                  return randomUUID()
                }
                return value
              },
            ],
          },
        },
        {
          name: 'title',
          type: 'text',
        },
      ],
      versions: { drafts: true },
    },
    {
      slug: fakeCustomIDsSlug,
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'group',
          type: 'group',
          fields: [
            {
              name: 'id',
              type: 'text',
            },
          ],
        },
        {
          type: 'tabs',
          tabs: [
            {
              name: 'myTab',
              fields: [
                {
                  name: 'id',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
      versions: false,
    },
    {
      slug: relationshipsMigrationSlug,
      fields: [
        {
          name: 'relationship',
          type: 'relationship',
          relationTo: 'default-values',
        },
        {
          name: 'relationship_2',
          type: 'relationship',
          relationTo: ['default-values'],
        },
      ],
      versions: true,
    },
    {
      slug: 'compound-indexes',
      fields: [
        {
          name: 'one',
          type: 'text',
        },
        {
          name: 'two',
          type: 'text',
        },
        {
          name: 'three',
          type: 'text',
        },
        {
          name: 'group',
          type: 'group',
          fields: [
            {
              name: 'four',
              type: 'text',
            },
          ],
        },
      ],
      indexes: [
        {
          fields: ['one', 'two'],
          unique: true,
        },
        {
          fields: ['three', 'group.four'],
          unique: true,
        },
      ],
      versions: false,
    },
    {
      slug: 'aliases',
      fields: [
        {
          name: 'thisIsALongFieldNameThatCanCauseAPostgresErrorEvenThoughWeSetAShorterDBName',
          type: 'array',
          dbName: 'shortname',
          fields: [
            {
              name: 'nestedArray',
              type: 'array',
              dbName: 'short_nested_1',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
      versions: false,
    },
    {
      slug: 'blocks-docs',
      fields: [
        {
          name: 'testBlocksLocalized',
          type: 'blocks',
          blocks: [
            {
              slug: 'cta',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
              ],
            },
          ],
          localized: true,
        },
        {
          name: 'testBlocks',
          type: 'blocks',
          blocks: [
            {
              slug: 'cta',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
      versions: false,
    },
    {
      slug: 'unique-fields',
      fields: [
        {
          name: 'slugField',
          type: 'text',
          unique: true,
        },
      ],
      versions: false,
    },
    {
      slug: 'select-has-many',
      fields: [
        {
          name: 'roles',
          type: 'select',
          hasMany: true,
          options: ['user', 'admin', 'editor'],
        },
        {
          name: 'food',
          type: 'select',
          hasMany: true,
          options: ['apple', 'bananabread', 'banana'],
        },
      ],
      versions: false,
    },
    {
      slug: 'virtual-linked-tenants',
      fields: [
        {
          name: 'slug',
          type: 'text',
          required: true,
        },
      ],
      versions: false,
    },
    {
      slug: 'virtual-linked-roles',
      access: {
        read: () => ({
          tenantSlug: {
            exists: true,
          },
        }),
      },
      fields: [
        {
          name: 'project',
          type: 'relationship',
          relationTo: 'virtual-linked-projects',
          required: true,
        },
        {
          name: 'tenant',
          type: 'relationship',
          relationTo: 'virtual-linked-tenants',
          required: true,
        },
        {
          name: 'tenantSlug',
          type: 'text',
          virtual: 'tenant.slug',
        },
      ],
      versions: false,
    },
    {
      slug: 'virtual-linked-projects',
      access: {
        read: () => true,
      },
      fields: [
        {
          name: 'roles',
          type: 'join',
          collection: 'virtual-linked-roles',
          on: 'project',
        },
      ],
      versions: false,
    },
  ],
  globals: [
    {
      slug: 'header',
      fields: [
        {
          name: 'itemsLvl1',
          type: 'array',
          dbName: 'header_items_lvl1',
          fields: [
            {
              name: 'label',
              type: 'text',
            },
            {
              name: 'itemsLvl2',
              type: 'array',
              dbName: 'header_items_lvl2',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                },
                {
                  name: 'itemsLvl3',
                  type: 'array',
                  dbName: 'header_items_lvl3',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                    },
                    {
                      name: 'itemsLvl4',
                      type: 'array',
                      dbName: 'header_items_lvl4',
                      fields: [
                        {
                          name: 'label',
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
      versions: false,
    },
    {
      slug: 'global',
      dbName: 'customGlobal',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
      versions: true,
    },
    {
      slug: 'global-2',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
      versions: false,
    },
    {
      slug: 'global-3',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
      versions: false,
    },
    {
      slug: 'virtual-relation-global',
      fields: [
        {
          name: 'postTitle',
          type: 'text',
          virtual: 'post.title',
        },
        {
          name: 'post',
          type: 'relationship',
          relationTo: 'posts',
        },
      ],
      versions: false,
    },
  ],
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'uk'],
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

export { seed }
