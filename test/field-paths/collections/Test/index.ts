import type { CollectionConfig } from 'payload'

export const Test: CollectionConfig = {
  slug: 'test',
  fields: [
    {
      // path: '_index-0'
      // schemaPath: '_index-0'
      // indexPath: '0'
      type: 'tabs',
      tabs: [
        {
          // path: '_index-0-0'
          // schemaPath: '_index-0-0'
          // indexPath: '0-0'
          label: 'Unnamed Tab',
          fields: [
            {
              // path: 'fieldWithinUnnamedTab'
              // schemaPath: '_index-0-0.fieldWithinUnnamedTab'
              // indexPath: ''
              name: 'fieldWithinUnnamedTab',
              type: 'text',
            },
          ],
        },
        {
          // path: 'namedTab'
          // schemaPath: '_index-0.namedTab'
          // indexPath: ''
          label: 'Named Tab',
          name: 'namedTab',
          fields: [
            {
              // path: 'namedTab.fieldWithinNamedTab'
              // schemaPath: '_index-0.namedTab.fieldWithinNamedTab'
              // indexPath: ''
              name: 'fieldWithinNamedTab',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}
