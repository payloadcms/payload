import path from 'path';
import { buildConfigWithDefaults } from '../buildConfigWithDefaults';

export default buildConfigWithDefaults({
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'schema.graphql'),
  },
  typescript: {
    outputFile: path.resolve(__dirname, 'schema.ts'),
  },
  collections: [
    {
      slug: 'collection1',
      fields: [
        {
          type: 'row',
          fields: [{ type: 'text', required: true, name: 'testing' }],
        },
        {
          type: 'tabs',
          tabs: [
            {
              label: 'Tab 1',
              fields: [
                {
                  required: true,
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
          interfaceName: 'SharedMetaArray',
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
          type: 'blocks',
          name: 'blocks',
          required: true,
          blocks: [
            {
              slug: 'block1',
              interfaceName: 'SharedMetaBlock',
              fields: [
                {
                  required: true,
                  name: 'b1title',
                  type: 'text',
                },
                {
                  name: 'b1description',
                  type: 'text',
                },
              ],
            },
            {
              slug: 'block2',
              interfaceName: 'AnotherSharedBlock',
              fields: [
                {
                  name: 'b2title',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'b2description',
                  type: 'text',
                },
              ],
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
          interfaceName: 'SharedMetaArray',
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
          interfaceName: 'SharedMeta',
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
              interfaceName: 'SharedMeta',
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
          name: 'relationToCollection3',
          type: 'relationship',
          relationTo: 'collection3',
        },
      ],
    },
    {
      slug: 'collection3',
      fields: [
        {
          type: 'tabs',
          tabs: [
            {
              label: 'Tab 1',
              fields: [
                {
                  name: 'descriptiontab1',
                  type: 'textarea',
                },
              ],
            },
            {
              label: 'Tab 2',
              name: 'tab2',
              fields: [
                {
                  type: 'select',
                  name: 'selecttab2',
                  options: [
                    { value: 'option1', label: 'Option 1' },
                    { value: 'option2', label: 'Option 2' },
                  ],
                },
              ],
            },
            {
              label: 'Tab3',
              name: 'tab3',
              fields: [
                {
                  name: 'acheckbox',
                  type: 'checkbox',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});
