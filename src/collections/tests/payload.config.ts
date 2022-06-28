import { generateTestConfig, openAccess } from '../../tests/helpers/configHelpers';

export default generateTestConfig({
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
