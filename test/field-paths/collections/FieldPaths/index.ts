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
  versions: {
    drafts: true,
  },
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
          // indexPath: '2'
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
    {
      // path: '_index-4'
      // schemaPath: '_index-4'
      // indexPath: '4'
      type: 'collapsible',
      label: 'Collapsible with Tabs',
      fields: [
        {
          // path: '_index-4-0'
          // schemaPath: '_index-4-0'
          // indexPath: '4-0'
          type: 'tabs',
          tabs: [
            {
              // path: '_index-4-0-0'
              // schemaPath: '_index-4-0-0'
              // indexPath: '4-0-0'
              label: 'Unnamed Tab Within Collapsible',
              fields: [
                // path: 'fieldWithinUnnamedTabWithinCollapsible'
                // schemaPath: '_index-4-0-0.fieldWithinUnnamedTabWithinCollapsible'
                // indexPath: ''
                {
                  name: 'fieldWithinUnnamedTabWithinCollapsible',
                  type: 'text',
                  hooks: attachHooks('fieldWithinUnnamedTabWithinCollapsible'),
                },
              ],
            },
            {
              // path: 'namedTabWithinCollapsible'
              // schemaPath: '_index-4-0.namedTabWithinCollapsible'
              // indexPath: ''
              label: 'Named Tab Within Collapsible',
              name: 'namedTabWithinCollapsible',
              fields: [
                // path: 'namedTabWithinCollapsible.fieldWithinNamedTabWithinCollapsible'
                // schemaPath: '_index-4-0.namedTabWithinCollapsible.fieldWithinNamedTabWithinCollapsible'
                // indexPath: ''
                {
                  name: 'fieldWithinNamedTabWithinCollapsible',
                  type: 'text',
                  hooks: attachHooks('fieldWithinNamedTabWithinCollapsible'),
                },
              ],
            },
          ],
        },
      ],
    },
    {
      // path: '_index-5'
      // schemaPath: '_index-5'
      // indexPath: '5'
      type: 'group',
      label: 'Unnamed group',
      fields: [
        {
          // path: 'textFieldInUnnamedGroup'
          // schemaPath: '_index-5.textFieldInUnnamedGroup'
          // indexPath: ''
          name: 'textFieldInUnnamedGroup',
          type: 'text',
          hooks: attachHooks('textFieldInUnnamedGroup'),
        },
      ],
    },
    // path: 'blocks'
    // schemaPath: 'blocks'
    // indexPath: ''
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          // path: 'blocks.[n]'
          // schemaPath: 'blocks.CollapsibleBlock'
          // indexPath: ''
          slug: 'CollapsibleBlock',
          fields: [
            {
              // path: 'blocks.[n]._index-0'
              // schemaPath: 'blocks.CollapsibleBlock._index-0'
              // indexPath: '0-0'
              type: 'collapsible',
              label: 'Collapsible',
              fields: [
                {
                  // path: 'blocks.[n]._index-0-0'
                  // schemaPath: 'blocks.CollapsibleBlock._index-0-0'
                  // indexPath: '0-0-0'
                  type: 'collapsible',
                  label: 'Nested Collapsible',
                  fields: [
                    {
                      // path: 'blocks.[n].textInCollapsibleInCollapsibleBlock'
                      // schemaPath: 'blocks.CollapsibleBlock._index-0-0.textInCollapsibleInCollapsibleBlock'
                      // indexPath: ''
                      name: 'textInCollapsibleInCollapsibleBlock',
                      type: 'text',
                      hooks: attachHooks('textInCollapsibleInCollapsibleBlock'),
                    },
                  ],
                },
              ],
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
      'fieldWithinUnnamedTabWithinCollapsible',
      'fieldWithinNamedTabWithinCollapsible',
      'textFieldInUnnamedGroup',
      'textInCollapsibleInCollapsibleBlock',
    ]),
  ],
}
