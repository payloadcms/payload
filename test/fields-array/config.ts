import { buildConfig } from '../buildConfig';

export const slug = 'fields-array';

export default buildConfig({
  collections: [
    {
      slug,
      fields: [
        {
          type: 'array',
          name: 'readOnlyArray',
          label: 'readOnly Array',
          admin: {
            readOnly: true,
          },
          defaultValue: [
            {
              text: 'defaultValue',
            },
            {
              text: 'defaultValue2',
            },
          ],
          fields: [
            {
              type: 'text',
              name: 'text',
            },
          ],
        },
      ],
    },
  ],
});
