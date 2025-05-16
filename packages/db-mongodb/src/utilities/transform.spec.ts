import { flattenAllFields, type Field, type SanitizedConfig } from 'payload'

import { Types } from 'mongoose'

import { transform } from './transform.js'
import type { MongooseAdapter } from '../index.js'

const flattenRelationshipValues = (obj: Record<string, any>, prefix = ''): Record<string, any> => {
  return Object.keys(obj).reduce(
    (acc, key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key
      const value = obj[key]

      if (value && typeof value === 'object' && !(value instanceof Types.ObjectId)) {
        Object.assign(acc, flattenRelationshipValues(value, fullKey))
        // skip relationTo and blockType
      } else if (!fullKey.endsWith('relationTo') && !fullKey.endsWith('blockType')) {
        acc[fullKey] = value
      }

      return acc
    },
    {} as Record<string, any>,
  )
}

const relsFields: Field[] = [
  {
    name: 'rel_1',
    type: 'relationship',
    relationTo: 'rels',
  },
  {
    name: 'rel_1_l',
    type: 'relationship',
    localized: true,
    relationTo: 'rels',
  },
  {
    name: 'rel_2',
    type: 'relationship',
    hasMany: true,
    relationTo: 'rels',
  },
  {
    name: 'rel_2_l',
    type: 'relationship',
    hasMany: true,
    localized: true,
    relationTo: 'rels',
  },
  {
    name: 'rel_3',
    type: 'relationship',
    relationTo: ['rels'],
  },
  {
    name: 'rel_3_l',
    type: 'relationship',
    localized: true,
    relationTo: ['rels'],
  },
  {
    name: 'rel_4',
    type: 'relationship',
    hasMany: true,
    relationTo: ['rels'],
  },
  {
    name: 'rel_4_l',
    type: 'relationship',
    hasMany: true,
    localized: true,
    relationTo: ['rels'],
  },
]

const referenceBlockFields: Field[] = [
  ...relsFields,
  {
    name: 'group',
    type: 'group',
    fields: relsFields,
  },
  {
    name: 'array',
    type: 'array',
    fields: relsFields,
  },
]

const config = {
  blocks: [
    {
      slug: 'reference-block',
      fields: referenceBlockFields,
      flattenedFields: flattenAllFields({ fields: referenceBlockFields }),
    },
  ],
  collections: [
    {
      slug: 'docs',
      fields: [
        ...relsFields,
        {
          name: 'array',
          type: 'array',
          fields: [
            {
              name: 'array',
              type: 'array',
              fields: relsFields,
            },
            {
              name: 'blocks',
              type: 'blocks',
              blocks: [{ slug: 'block', fields: relsFields }],
            },
            ...relsFields,
          ],
        },
        {
          name: 'arrayLocalized',
          type: 'array',
          fields: [
            {
              name: 'array',
              type: 'array',
              fields: relsFields,
            },
            {
              name: 'blocks',
              type: 'blocks',
              blocks: [{ slug: 'block', fields: relsFields }],
            },
            ...relsFields,
          ],
          localized: true,
        },
        {
          name: 'blocks',
          type: 'blocks',
          blocks: [
            {
              slug: 'block',
              fields: [
                ...relsFields,
                {
                  name: 'group',
                  type: 'group',
                  fields: relsFields,
                },
                {
                  name: 'array',
                  type: 'array',
                  fields: relsFields,
                },
              ],
            },
          ],
        },
        {
          name: 'blockReferences',
          type: 'blocks',
          blockReferences: ['reference-block'],
        },
        {
          name: 'group',
          type: 'group',
          fields: [
            ...relsFields,
            {
              name: 'array',
              type: 'array',
              fields: relsFields,
            },
          ],
        },
        {
          name: 'groupLocalized',
          type: 'group',
          fields: [
            ...relsFields,
            {
              name: 'array',
              type: 'array',
              fields: relsFields,
            },
          ],
          localized: true,
        },
        {
          name: 'groupAndRow',
          type: 'group',
          fields: [
            {
              type: 'row',
              fields: [
                ...relsFields,
                {
                  type: 'array',
                  name: 'array',
                  fields: relsFields,
                },
              ],
            },
          ],
        },
        {
          type: 'tabs',
          tabs: [
            {
              name: 'tab',
              fields: relsFields,
            },
            {
              name: 'tabLocalized',
              fields: relsFields,
              localized: true,
            },
            {
              label: 'another',
              fields: [
                {
                  type: 'tabs',
                  tabs: [
                    {
                      name: 'nestedTab',
                      fields: relsFields,
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
      slug: 'rels',
      fields: [],
    },
  ],
  localization: {
    defaultLocale: 'en',
    localeCodes: ['en', 'es'],
    locales: [
      { code: 'en', label: 'EN' },
      { code: 'es', label: 'ES' },
    ],
  },
} as SanitizedConfig

const relsData = {
  rel_1: new Types.ObjectId().toHexString(),
  rel_1_l: {
    en: new Types.ObjectId().toHexString(),
    es: new Types.ObjectId().toHexString(),
  },
  rel_2: [new Types.ObjectId().toHexString()],
  rel_2_l: {
    en: [new Types.ObjectId().toHexString()],
    es: [new Types.ObjectId().toHexString()],
  },
  rel_3: {
    relationTo: 'rels',
    value: new Types.ObjectId().toHexString(),
  },
  rel_3_l: {
    en: {
      relationTo: 'rels',
      value: new Types.ObjectId().toHexString(),
    },
    es: {
      relationTo: 'rels',
      value: new Types.ObjectId().toHexString(),
    },
  },
  rel_4: [
    {
      relationTo: 'rels',
      value: new Types.ObjectId().toHexString(),
    },
  ],
  rel_4_l: {
    en: [
      {
        relationTo: 'rels',
        value: new Types.ObjectId().toHexString(),
      },
    ],
    es: [
      {
        relationTo: 'rels',
        value: new Types.ObjectId().toHexString(),
      },
    ],
  },
}

describe('transform', () => {
  it('should sanitize relationships', () => {
    const data = {
      ...relsData,
      array: [
        {
          ...relsData,
          array: [{ ...relsData }],
          blocks: [
            {
              blockType: 'block',
              ...relsData,
            },
          ],
        },
      ],
      arrayLocalized: {
        en: [
          {
            ...relsData,
            array: [{ ...relsData }],
            blocks: [
              {
                blockType: 'block',
                ...relsData,
              },
            ],
          },
        ],
        es: [
          {
            ...relsData,
            array: [{ ...relsData }],
            blocks: [
              {
                blockType: 'block',
                ...relsData,
              },
            ],
          },
        ],
      },
      blocks: [
        {
          blockType: 'block',
          ...relsData,
          array: [{ ...relsData }],
          group: { ...relsData },
        },
      ],
      blockReferences: [
        {
          blockType: 'reference-block',
          array: [{ ...relsData }],
          group: { ...relsData },
          ...relsData,
        },
      ],
      group: {
        ...relsData,
        array: [{ ...relsData }],
      },
      groupAndRow: {
        ...relsData,
        array: [{ ...relsData }],
      },
      groupLocalized: {
        en: {
          ...relsData,
          array: [{ ...relsData }],
        },
        es: {
          ...relsData,
          array: [{ ...relsData }],
        },
      },
      tab: { ...relsData },
      tabLocalized: {
        en: { ...relsData },
        es: { ...relsData },
      },
      nestedTab: { ...relsData },
    }
    const flattenValuesBefore = Object.values(flattenRelationshipValues(data))

    const mockAdapter = {
      payload: {
        config,
      },
    } as MongooseAdapter

    transform({
      adapter: mockAdapter,
      operation: 'write',
      data,
      fields: config.collections[0].fields,
    })
    const flattenValuesAfter = Object.values(flattenRelationshipValues(data))

    flattenValuesAfter.forEach((value, i) => {
      expect(value).toBeInstanceOf(Types.ObjectId)
      expect(flattenValuesBefore[i]).toBe(value.toHexString())
    })
  })
})
