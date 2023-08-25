import { Payload } from '../../../src';

export const seedLocalizedBlocks = async (payload: Payload) => {
  const localizedBlock = await payload.create({
    collection: 'localized-blocks',
    data: {
      title: 'hello',
      layout: [
        {
          blockType: 'text',
          text: 'hello in english',
        },
        {
          blockType: 'number',
          number: 1337,
        },
      ],
    },
  });

  await payload.update({
    collection: 'localized-blocks',
    id: localizedBlock.id,
    locale: 'es',
    data: {
      title: 'hello in spanish',
      layout: [
        {
          blockType: 'text',
          text: 'hello in spanny',
        },
        {
          blockType: 'number',
          number: 69420,
        },
      ],
    },
  });

  const retrievedBlock = await payload.findByID({
    collection: 'localized-blocks',
    id: localizedBlock.id,
    locale: 'all',
  });

  console.log(retrievedBlock);
};
