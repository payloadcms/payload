import { CollectionAfterChangeHook } from 'payload/types';

const syncWithSearch: CollectionAfterChangeHook = async ({
  req: { payload },
  doc,
  operation,
  // @ts-ignore
  collection,
}) => {
  const {
    id,
    status,
  } = doc || {};

  // TODO: inject default priorities here
  let defaultPriority = 0;

  // TODO: call a function from the config that returns transformed search data
  const dataToSave = {
    doc: {
      relationTo: collection,
      value: id,
    },
  };

  try {
    if (operation === 'create') {
      if (status === 'published') {
        payload.create({
          collection: 'search',
          data: {
            ...dataToSave,
            priority: defaultPriority,
          },
        });
      }
    }

    if (operation === 'update') {
      try {
        // find the correct doc to sync with
        const searchDocQuery = await payload.find({
          collection: 'search',
          where: {
            'doc.value': {
              equals: id,
            },
          },
          depth: 0,
        }) as any;

        const docs: {
          id: string
          priority?: number
        }[] = searchDocQuery?.docs || [];

        const [foundDoc, ...duplicativeDocs] = docs;

        // delete all duplicative search docs (docs that reference the same page)
        // to ensure the same, out-of-date result does not appear twice (where only syncing the first found doc)
        if (duplicativeDocs.length > 0) {
          try {
            Promise.all(duplicativeDocs.map(({ id: duplicativeDocID }) => payload.delete({
              collection: 'search',
              id: duplicativeDocID,
            })));
          } catch (err) {
            payload.logger.error(`Error deleting duplicative search documents.`);
          }
        }

        if (foundDoc) {
          const {
            id: searchDocID,
          } = foundDoc;

          if (status === 'published') {
            // update the doc normally
            try {
              payload.update({
                collection: 'search',
                id: searchDocID,
                data: {
                  ...dataToSave,
                  priority: foundDoc.priority || defaultPriority,
                },
              });
            } catch (err) {
              payload.logger.error(`Error updating search document.`);
            }
          }
          if (status === 'draft') {
            // do not include draft docs in search results, so delete the record
            try {
              payload.delete({
                collection: 'search',
                id: searchDocID,
              });
            } catch (err) {
              payload.logger.error(`Error deleting search document.`);
            }
          }
        } else if (status === 'published') {
          try {
            payload.create({
              collection: 'search',
              data: {
                ...dataToSave,
                priority: defaultPriority,
              },
            });
          } catch (err) {
            payload.logger.error(err);
            payload.logger.error(`Error creating search document.`);
          }
        }
      } catch (err) {
        payload.logger.error(`Error finding search document.`);
      }
    }
  } catch (err) {
    payload.logger.error(err);
    payload.logger.error(`Error syncing search document related to ${collection} with id: '${id}'`);
  }

  return doc;
};

export default syncWithSearch;
