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
      name: 'topLevelNamedField',
      type: 'text',
      hooks: attachHooks('topLevelNamedField'),
    },
    {
      // schemaPath: 'array'
      // path: 'array'
      name: 'array',
      type: 'array',
      fields: [
        {
          // schemaPath: 'array.fieldWithinArray'
          // path: 'array.[n].fieldWithinArray'
          name: 'fieldWithinArray',
          type: 'text',
          hooks: attachHooks('fieldWithinArray'),
        },
      ],
    },
    {
      // schemaPath: '_index-2'
      // path: '_index-2'
      type: 'row',
      fields: [
        {
          // schemaPath: '_index-2.fieldWithinRow'
          // path: 'fieldWithinRow'
          name: 'fieldWithinRow',
          type: 'text',
          hooks: attachHooks('fieldWithinRow'),
        },
      ],
    },
    {
      // schemaPath: '_index-3'
      // path: '_index-3'
      type: 'tabs',
      tabs: [
        {
          // schemaPath: '_index-3-0'
          // path: '_index-3-0'
          label: 'Unnamed Tab',
          fields: [
            {
              // schemaPath: '_index-3-0.fieldWithinUnnamedTab'
              // path: 'fieldWithinUnnamedTab'
              name: 'fieldWithinUnnamedTab',
              type: 'text',
              hooks: attachHooks('fieldWithinUnnamedTab'),
            },
            {
              // schemaPath: '_index-3-0-1'
              // path: '_index-3-0-1'
              type: 'tabs',
              tabs: [
                {
                  // schemaPath: '_index-3-0-1-0'
                  // path: '_index-3-0-1-0'
                  label: 'Nested Unnamed Tab',
                  fields: [
                    {
                      // schemaPath: '_index-3-0-1-0.fieldWithinNestedUnnamedTab'
                      // path: 'fieldWithinNestedUnnamedTab'
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
          // schemaPath: '_index-3-1'
          // path: 'namedTab'
          label: 'Named Tab',
          name: 'namedTab',
          fields: [
            {
              // schemaPath: '_index-3-1.fieldWithinNamedTab'
              // path: 'namedTab.fieldWithinNamedTab'
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
