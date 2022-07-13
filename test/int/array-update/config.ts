import { buildConfig } from '../buildConfig';

export default buildConfig({
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
