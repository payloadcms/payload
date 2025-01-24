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
      // schemaPath: 'topLevelNamedField'
      // path: 'topLevelNamedField'
      // indexPath: ''
      name: 'topLevelNamedField',
      type: 'text',
      hooks: attachHooks('topLevelNamedField'),
    },
    {
      // schemaPath: 'array'
      // path: 'array'
      // indexPath: ''
      name: 'array',
      type: 'array',
      fields: [
        {
          // schemaPath: 'array.fieldWithinArray'
          // path: 'array.[n].fieldWithinArray'
          // indexPath: ''
          name: 'fieldWithinArray',
          type: 'text',
          hooks: attachHooks('fieldWithinArray'),
        },
      ],
    },
    {
      // schemaPath: '_index-2'
      // path: ''
      // indexPath: '2'
      type: 'row',
      fields: [
        {
          // schemaPath: '_index-2.fieldWithinRow'
          // path: 'fieldWithinRow'
          // indexPath: ''
          name: 'fieldWithinRow',
          type: 'text',
          hooks: attachHooks('fieldWithinRow'),
        },
      ],
    },
    {
      // schemaPath: '_index-3'
      // path: ''
      // indexPath: '3'
      type: 'tabs',
      tabs: [
        {
          // schemaPath: '_index-3-0'
          // path: ''
          // indexPath: '3-0'
          label: 'Unnamed Tab',
          fields: [
            {
              // schemaPath: '_index-3-0.fieldWithinUnnamedTab'
              // path: 'fieldWithinUnnamedTab'
              // indexPath: ''
              name: 'fieldWithinUnnamedTab',
              type: 'text',
              hooks: attachHooks('fieldWithinUnnamedTab'),
            },
            {
              // schemaPath: '_index-3-0-1'
              // path: ''
              // indexPath: '3-0-1'
              type: 'tabs',
              tabs: [
                {
                  // schemaPath: '_index-3-0-1-0'
                  // path: ''
                  // indexPath: '3-0-1-0'
                  label: 'Nested Unnamed Tab',
                  fields: [
                    {
                      // schemaPath: '_index-3-0-1-0.fieldWithinNestedUnnamedTab'
                      // path: 'fieldWithinNestedUnnamedTab'
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
          // schemaPath: '_index-3.namedTab'
          // path: 'namedTab'
          // indexPath: ''
          label: 'Named Tab',
          name: 'namedTab',
          fields: [
            {
              // schemaPath: '_index-3.namedTab.fieldWithinNamedTab'
              // path: 'namedTab.fieldWithinNamedTab'
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
      'fieldWithinRow',
      'fieldWithinUnnamedTab',
      'fieldWithinNestedUnnamedTab',
      'fieldWithinNamedTab',
    ]),
  ],
}
