import path from 'path';
import { buildConfig } from '../buildConfig';

export default buildConfig({
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'schema.graphql'),
  },
  collections: [
    {
      slug: 'collection1',
      fields: [
        {
          type: 'tabs',
          tabs: [
            {
              label: 'Tab 1',
              name: 'tab1',
              interface: 'SpecialTabName',
              fields: [
                {
                  type: 'text',
                  name: 'title',
                },
              ],
            },
            {
              label: 'Tab 2',
              name: 'tab2',
              interface: 'SpecialTabName',
              fields: [
                {
                  type: 'text',
                  name: 'title',
                },
              ],
            },
          ],
        },
        {
          type: 'array',
          name: 'meta',
          interface: 'SharedMetaArray',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'description',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      slug: 'collection2',
      fields: [
        {
          type: 'array',
          name: 'meta',
          interface: 'SharedMetaArray',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'description',
              type: 'text',
            },
          ],
        },
        {
          type: 'group',
          name: 'meta',
          interface: 'SharedMeta',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'description',
              type: 'text',
            },
          ],
        },
        {
          type: 'group',
          name: 'nestedGroup',
          fields: [
            {
              type: 'group',
              name: 'meta',
              interface: 'SharedMeta',
              fields: [
                {
                  name: 'title',
                  type: 'text',
                },
                {
                  name: 'description',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});
