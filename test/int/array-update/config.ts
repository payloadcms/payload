import { buildConfig } from '../../../src/config/build';

export default buildConfig({
  // admin: {
  //   disable: true,
  // },
  collections: [{
    slug: 'arrays',
    fields: [
      {
        name: 'array',
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
  }],
});
