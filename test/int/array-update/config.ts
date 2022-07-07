import { buildTestConfig } from '../../helpers/buildTestConfig';

export default buildTestConfig({
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
