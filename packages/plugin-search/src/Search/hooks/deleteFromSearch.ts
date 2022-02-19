import { CollectionAfterDeleteHook } from 'payload/types';

const deleteFromSearch: CollectionAfterDeleteHook = ({ req: { payload }, doc }) => {
  try {
    const deleteSearchDoc = async () => {
      const searchDocQuery = await payload.find({
        collection: 'search',
        where: {
          'doc.value': {
            equals: doc.id,
          },
        },
        depth: 0,
      }) as any;

      if (searchDocQuery?.docs?.[0]) {
        payload.delete({
          collection: 'search',
          id: searchDocQuery?.docs?.[0]?.id,
        });
      }
    };

    deleteSearchDoc();
  } catch (err) {
    console.error(err);
  }

  return doc;
};

export default deleteFromSearch;
