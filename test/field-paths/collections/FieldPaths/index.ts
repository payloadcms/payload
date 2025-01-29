import type { CollectionConfig, Field, FieldHook, FieldHookArgs } from 'payload'

import { fieldPathsSlug } from '../../shared.js'

const attachPathsToDoc = (
  label: string,
  { value, path, schemaPath, indexPath, data }: FieldHookArgs,
): any => {
  if (!data) {
    data = {}
  }

  // attach values to data for `beforeRead` and `beforeChange` hooks
  data[`${label}_FieldPaths`] = {
    path,
    schemaPath,
    indexPath,
  }

  return value
}

const attachHooks = (
  fieldIdentifier: string,
): {
  afterRead: FieldHook[]
  beforeChange: FieldHook[]
  beforeDuplicate: FieldHook[]
  beforeValidate: FieldHook[]
} => ({
  beforeValidate: [(args) => attachPathsToDoc(`${fieldIdentifier}_beforeValidate`, args)],
  beforeChange: [(args) => attachPathsToDoc(`${fieldIdentifier}_beforeChange`, args)],
  afterRead: [(args) => attachPathsToDoc(`${fieldIdentifier}_afterRead`, args)],
  beforeDuplicate: [(args) => attachPathsToDoc(`${fieldIdentifier}_beforeDuplicate`, args)],
})

const createFields = (fieldIdentifiers: string[]): Field[] =>
  fieldIdentifiers.reduce((acc, fieldIdentifier) => {
    return [
      ...acc,
      {
        name: `${fieldIdentifier}_beforeValidate_FieldPaths`,
        type: 'json',
      },
      {
        name: `${fieldIdentifier}_beforeChange_FieldPaths`,
        type: 'json',
      },
      {
        name: `${fieldIdentifier}_afterRead_FieldPaths`,
        type: 'json',
      },
      {
        name: `${fieldIdentifier}_beforeDuplicate_FieldPaths`,
        type: 'json',
      },
    ]
  }, [] as Field[])

export const FieldPaths: CollectionConfig = {
  slug: fieldPathsSlug,
  fields: [
    {
      // path: 'topLevelNamedField'
      // schemaPath: 'topLevelNamedField'
      // indexPath: ''
      name: 'topLevelNamedField',
      type: 'text',
      hooks: attachHooks('topLevelNamedField'),
    },
    {
      // path: 'array'
      // schemaPath: 'array'
      // indexPath: ''
      name: 'array',
      type: 'array',
      fields: [
        {
          // path: 'array.[n].fieldWithinArray'
          // schemaPath: 'array.fieldWithinArray'
          // indexPath: ''
          name: 'fieldWithinArray',
          type: 'text',
          hooks: attachHooks('fieldWithinArray'),
        },
        {
          // path: 'array.[n].nestedArray'
          // schemaPath: 'array.nestedArray'
          // indexPath: ''
          name: 'nestedArray',
          type: 'array',
          fields: [
            {
              // path: 'array.[n].nestedArray.[n].fieldWithinNestedArray'
              // schemaPath: 'array.nestedArray.fieldWithinNestedArray'
              // indexPath: ''
              name: 'fieldWithinNestedArray',
              type: 'text',
              hooks: attachHooks('fieldWithinNestedArray'),
            },
          ],
        },
        {
          // path: 'array.[n]._index-2'
          // schemaPath: 'array._index-2'
          // indexPath: ''
          type: 'row',
          fields: [
            {
              // path: 'array.[n].fieldWithinRowWithinArray'
              // schemaPath: 'array._index-2.fieldWithinRowWithinArray'
              // indexPath: ''
              name: 'fieldWithinRowWithinArray',
              type: 'text',
              hooks: attachHooks('fieldWithinRowWithinArray'),
            },
          ],
        },
      ],
    },
    {
      // path: '_index-2'
      // schemaPath: '_index-2'
      // indexPath: '2'
      type: 'row',
      fields: [
        {
          // path: 'fieldWithinRow'
          // schemaPath: '_index-2.fieldWithinRow'
          // indexPath: ''
          name: 'fieldWithinRow',
          type: 'text',
          hooks: attachHooks('fieldWithinRow'),
        },
      ],
    },
    {
      // path: '_index-3'
      // schemaPath: '_index-3'
      // indexPath: '3'
      type: 'tabs',
      tabs: [
        {
          // path: '_index-3-0'
          // schemaPath: '_index-3-0'
          // indexPath: '3-0'
          label: 'Unnamed Tab',
          fields: [
            {
              // path: 'fieldWithinUnnamedTab'
              // schemaPath: '_index-3-0.fieldWithinUnnamedTab'
              // indexPath: ''
              name: 'fieldWithinUnnamedTab',
              type: 'text',
              hooks: attachHooks('fieldWithinUnnamedTab'),
            },
            {
              // path: '_index-3-0-1'
              // schemaPath: '_index-3-0-1'
              // indexPath: '3-0-1'
              type: 'tabs',
              tabs: [
                {
                  // path: '_index-3-0-1-0'
                  // schemaPath: '_index-3-0-1-0'
                  // indexPath: '3-0-1-0'
                  label: 'Nested Unnamed Tab',
                  fields: [
                    {
                      // path: 'fieldWithinNestedUnnamedTab'
                      // schemaPath: '_index-3-0-1-0.fieldWithinNestedUnnamedTab'
                      // indexPath: ''
                      name: 'fieldWithinNestedUnnamedTab',
                      type: 'text',
                      hooks: attachHooks('fieldWithinNestedUnnamedTab'),
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          // path: 'namedTab'
          // schemaPath: '_index-3.namedTab'
          // indexPath: ''
          label: 'Named Tab',
          name: 'namedTab',
          fields: [
            {
              // path: 'namedTab.fieldWithinNamedTab'
              // schemaPath: '_index-3.namedTab.fieldWithinNamedTab'
              // indexPath: ''
              name: 'fieldWithinNamedTab',
              type: 'text',
              hooks: attachHooks('fieldWithinNamedTab'),
            },
          ],
        },
      ],
    },
    // create fields for the hooks to save data to
    ...createFields([
      'topLevelNamedField',
      'fieldWithinArray',
      'fieldWithinNestedArray',
      'fieldWithinRowWithinArray',
      'fieldWithinRow',
      'fieldWithinUnnamedTab',
      'fieldWithinNestedUnnamedTab',
      'fieldWithinNamedTab',
    ]),
  ],
}
