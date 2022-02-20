import { SearchConfig, SyncWithSearch } from '../../types';

const syncWithSearch: SyncWithSearch = async (args) => {
  const {
    req: { payload },
    doc,
    operation,
    // @ts-ignore
    collection,
    // @ts-ignore
    searchConfig
  } = args;

  const {
    title,
    id,
    status,
  } = doc || {};

  const {
    beforeSync,
    syncOnlyPublished,
    deleteDrafts,
    defaultPriorities,
  } = searchConfig as SearchConfig; // todo fix SyncWithSearch type, see note in ./types.ts

  let dataToSave = {
    title,
    doc: {
      relationTo: collection,
      value: id,
    },
  };

  if (typeof beforeSync === 'function') {
    dataToSave = await beforeSync({
      originalDoc: doc,
      searchDoc: dataToSave,
      payload
    });
  }

  let defaultPriority = 0;
  if (defaultPriorities) {
    const {
      [collection]: priority,
    } = defaultPriorities;

    if (typeof priority === 'function') {
      try {
        defaultPriority = await priority(doc);
      } catch (err) {
        payload.logger.error(err);
        payload.logger.error(`Error gathering default priority for search documents related to ${collection}`);
      }
    } else {
      defaultPriority = priority;
    }
  }

  // TODO: use the new revisions API to check for published status
  const doSync = !!syncOnlyPublished || (syncOnlyPublished && status === 'published');

  try {
    if (operation === 'create') {
      if (doSync) {
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

          if (doSync) {
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
          if (deleteDrafts && status === 'draft') {
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
        } else if (doSync) {
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
