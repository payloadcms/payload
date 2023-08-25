import { Payload } from '../../../src';

export const seedLocalizedGroups = async (payload: Payload) => {
  const localizedGroup = await payload.create({
    collection: 'localized-groups',
    data: {
      group: {
        text: 'en',
        number: 123,
      },
    },
  });

  const test = await payload.update({
    collection: 'localized-groups',
    id: localizedGroup.id,
    locale: 'es',
    data: {
      group: {
        text: 'es',
        number: 456,
      },
    },
  });

  const retrievedGroup = await payload.findByID({
    collection: 'localized-groups',
    id: localizedGroup.id,
    locale: 'all',
  });
};
