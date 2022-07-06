import { generateTestConfig, openAccess } from '../../tests/helpers/configHelpers';

export default generateTestConfig({
  // admin: {
  //   disable: true,
  // },
  collections: [{
    slug: 'localized-collection',
    access: openAccess,
    fields: [
      {
        name: 'title',
        label: 'Title',
        type: 'text',
        localized: true,
      },
    ],
  }],
});
