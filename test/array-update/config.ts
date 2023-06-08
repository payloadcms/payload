import { buildConfig } from '../buildConfig';

export default buildConfig({
  collections: [
    {
      slug: 'arrays',
      fields: [
        {
          name: 'arrayOfFields',
          type: 'array',
          admin: {
            initCollapsed: true,
          },
          fields: [
            {
              type: 'text',
              name: 'required',
              required: true,
            },
            {
              type: 'text',
              name: 'optional',
            },
            {
              name: 'innerArrayOfFields',
              type: 'array',
              fields: [
                {
                  type: 'text',
                  name: 'required',
                  required: true,
                },
                {
                  type: 'text',
                  name: 'optional',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});
