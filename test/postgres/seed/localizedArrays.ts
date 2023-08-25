import { Payload } from '../../../src';

export const seedLocalizedArrays = async (payload: Payload) => {
  const localizedArray = await payload.create({
    collection: 'localized-arrays',
    data: {
      array: [
        {
          text: 'hello in english',
        },
        {
          text: 'hello 2 in english',
        },
      ],
    },
  });

  await payload.update({
    collection: 'localized-arrays',
    id: localizedArray.id,
    locale: 'es',
    data: {
      array: [
        {
          text: 'hello in spanny',
        },
        {
          text: 'hello 2 in spanny',
        },
      ],
    },
  });

  const retrievedArray = await payload.findByID({
    collection: 'localized-arrays',
    id: localizedArray.id,
    locale: 'all',
  });

  console.log(retrievedArray);
};
